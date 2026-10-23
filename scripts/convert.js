#!/usr/bin/env node
/**
 * Word (.docx) 转 HTML 脚本
 * 用法: node convert.js <input.docx> [output.html] [--title "文档标题"]
 *
 * - input.docx: 必需，Word 文件路径
 * - output.html: 可选，输出文件路径；不传则基于输入文件名生成
 * - --title "xxx": 可选，HTML 文档标题；不传则从文件名提取
 */

const path = require("path");
const fs = require("fs");
const mammoth = require("mammoth");
const cheerio = require("cheerio");

// ─── 样式映射 ────────────────────────────────────────────────────────────────
const styleMap = `
heading-1 => h1
heading-2 => h2
heading-3 => h3
heading-4 => h4
heading-5 => h5
heading-6 => h6
paragraph => p
list-item => li
unordered-list => ul
ordered-list => ol
bold => strong
italic => em
underline => u
strikethrough => s
quote => blockquote
hyperlink => a
`;

// ─── 生成完整 HTML ────────────────────────────────────────────────────────────
function generateFullHtml(bodyContent, title = "文档") {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 14px; line-height: 1.8; color: #333; padding: 15px; word-wrap: break-word; }
    h1 { font-size: 1rem; margin: 0; color: #1a1a1a; font-weight: 700; text-align: center; }
    h2 { font-size: 0.9rem; margin: 14px 0 7px; color: #1a1a1a; font-weight: 600; }
    h3 { font-size: 0.8rem; margin: 12px 0 6px; color: #333; font-weight: 600; }
    h4 { font-size: 0.7rem; margin: 10px 0 5px; color: #333; font-weight: 600; }
    h5, h6 { font-size: 0.95rem; margin: 10px 0 5px; color: #333; }
    p { margin: 10px 0; text-align: justify; }
    ul, ol { margin: 10px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 11px; }
    th { border: 1px solid #e5e5e5; padding: 2px; text-align: center; background: #f5f5f5; font-weight: 600; white-space: nowrap; }
    td { border: 1px solid #e5e5e5; padding: 2px; text-align: center; word-wrap: break-word; word-break: break-all; }
    img { max-width: 100%; height: auto; }
    a { color: #576b95; text-decoration: none; }
    blockquote { margin: 10px 0; padding: 10px 14px; background: #f5f5f5; border-left: 4px solid #576b95; color: #666; }
    strong, b { font-weight: 600; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// ─── 清洗 HTML ────────────────────────────────────────────────────────────────
function cleanHtml(html) {
  const $ = cheerio.load(html);

  $("*").each((_, el) => {
    const $el = $(el);
    $el.removeAttr("class");
    $el.removeAttr("style");
  });

  $("img").each((_, el) => {
    const $el = $(el);
    const alt = $el.attr("alt") || "";
    $el.attr("alt", alt);
  });

  $("a").each((_, el) => {
    const $el = $(el);
    const title = $el.attr("title") || "";
    $el.attr("title", title);
  });

  const bodyHtml = $("body").html() || $.html();
  return bodyHtml.trim();
}

// ─── 核心转换 ────────────────────────────────────────────────────────────────
async function convertWordFile(inputPath, title) {
  const result = await mammoth.convertToHtml({ path: inputPath }, {
    styleMap: styleMap,
    convertImage: mammoth.images.imgElement(function (image) {
      return image.read("base64").then(function (imageBuffer) {
        return {
          src: "data:" + image.contentType + ";base64," + imageBuffer,
        };
      });
    }),
  });

  const rawHtml = result.value;
  const bodyHtml = cleanHtml(rawHtml);

  // 标题：优先传入 > 文件名 > 默认
  let docTitle = title;
  if (!docTitle) {
    const ext = path.extname(inputPath);
    docTitle = path.basename(inputPath, ext);
  }

  const fullHtml = generateFullHtml(bodyHtml, docTitle);

  return { fullHtml, bodyHtml, rawHtml, messages: result.messages };
}

// ─── CLI 入口 ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { input: null, output: null, title: null };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--title" || a === "-t") {
      args.title = argv[++i];
    } else if (a === "--help" || a === "-h") {
      args.help = true;
    } else {
      positional.push(a);
    }
  }

  if (positional.length >= 1) args.input = positional[0];
  if (positional.length >= 2) args.output = positional[1];

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    console.log(`Word (.docx) 转 HTML

用法: node convert.js <input.docx> [output.html] [--title "标题"]

  input.docx     必需，Word 文件路径（仅支持 .docx）
  output.html    可选，输出 HTML 路径（默认与输入同目录、同名 .html）
  --title, -t    可选，HTML 文档 <title>（默认使用文件名）
  --help, -h     查看帮助

示例:
  node convert.js rule.docx
  node convert.js rule.docx rule.html --title "活动规则"`);
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = path.resolve(args.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`[错误] 文件不存在: ${inputPath}`);
    process.exit(1);
  }

  if (!inputPath.toLowerCase().endsWith(".docx")) {
    console.error(`[错误] 仅支持 .docx 格式，当前文件: ${path.basename(inputPath)}`);
    process.exit(1);
  }

  // 确定输出路径
  let outputPath;
  if (args.output) {
    outputPath = path.resolve(args.output);
  } else {
    const ext = path.extname(inputPath);
    outputPath = inputPath.replace(new RegExp(ext + "$"), ".html");
  }

  // 确保输出目录存在
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`[转换] ${inputPath}`);
  const result = await convertWordFile(inputPath, args.title);

  fs.writeFileSync(outputPath, result.fullHtml, "utf-8");

  const sizeKB = (Buffer.byteLength(result.fullHtml, "utf-8") / 1024).toFixed(2);
  console.log(`[完成] ${outputPath}  (${sizeKB} KB)`);

  if (result.messages && result.messages.length > 0) {
    console.log(`[提示] ${result.messages.length} 条转换提示 (非阻塞)`);
  }

  // 以 JSON 输出关键信息，方便上层工具解析
  console.log(
    JSON.stringify({
      success: true,
      input: inputPath,
      output: outputPath,
      sizeBytes: Buffer.byteLength(result.fullHtml, "utf-8"),
      bodyHtml: result.bodyHtml,
    })
  );
}

main().catch((err) => {
  console.error("[错误]", err.message);
  console.error(err.stack);
  process.exit(1);
});
