---
name: word-to-html
description: Convert Word .docx documents to clean semantic HTML. Use when the user asks to transform a .docx or .word file into HTML, extract HTML content from a Word document, or convert Word for mini-program/H5 display. Do not use for .doc (old Word), PDF, or other formats.
---

# Word to HTML Skill

将 `.docx` Word 文件转换为纯净的语义化 HTML，保留标题、段落、列表、表格、图片（内嵌 Base64）等结构，移除 Word 冗余样式。适合小程序 `rich-text` 组件、H5 活动规则展示。

## 触发条件

用户提到以下任一意图时启用：

- "把这个 word 转成 html" / "将 .docx 转为 html"
- "从 Word 文件里提取 HTML"
- "把 Word 文档内容放到小程序/H5 页面"
- 类似 "转 html" + Word/`.docx`/`.word` 关键词的组合

不处理旧版 `.doc`、PDF、Markdown 等其他格式请求。

## 路径约定

下文中的 `<SKILL_DIR>` 指本 skill 所在的目录（即包含本 `SKILL.md` 的目录），转换脚本为 `<SKILL_DIR>/scripts/convert.js`。请先根据 skill 的实际安装位置解析出绝对路径再执行命令。

## 执行步骤

### 1. 确认输入文件

- 从用户消息或当前工作区定位 `.docx` 文件的绝对路径。
- 文件必须以 `.docx` 结尾；旧版 `.doc` 先告知用户不支持。
- 检查文件是否存在（`fs.existsSync` 或直接让脚本报错处理）。

### 2. 准备依赖（首次）

在 `<SKILL_DIR>/scripts/` 下执行 `npm install` 安装 mammoth + cheerio（要求 Node.js >= 20）。如果 `node_modules/` 已存在则跳过。

```bash
cd "<SKILL_DIR>/scripts" && npm install
```

### 3. 运行转换脚本

```bash
node "<SKILL_DIR>/scripts/convert.js" "<输入文件绝对路径>"
# 或指定输出路径和标题
node "<SKILL_DIR>/scripts/convert.js" "<输入文件>" "<输出文件.html>" --title "文档标题"
```

脚本行为：
- 默认输出文件：与输入同目录、同名 `.html`（`xxx.docx` → `xxx.html`）
- 默认 `<title>`：使用原文件名（去掉扩展名）
- 成功时以 JSON 打印 summary，包含 `output`（HTML 绝对路径）和 `bodyHtml`（纯 body 内容片段）

### 4. 将 HTML 交付给用户

- 告知用户生成文件的路径，并使用 `computer://` 链接。
- 如果用户只需要正文片段（用于小程序 `rich-text`），直接引用脚本输出中的 `bodyHtml` 字段。

### 5. 告知转换能力边界

- 仅支持 `.docx`（Office 2007+），不支持 `.doc`。
- 图片自动内嵌为 Base64，HTML 体积会变大。
- 复杂的 Word 样式（如分栏、页眉页脚、批注）不会保留。
- 输出为语义化标签（`h1`–`h6`、`p`、`ul`/`ol`/`li`、`table`、`blockquote`、`a`、`img`），段落默认两端对齐（`text-align: justify`），可直接嵌入小程序 `rich-text` 或 H5 页面。

## 错误处理

| 脚本报错 | 含义 | 处理 |
|---|---|---|
| `文件不存在` | 路径错误 | 让用户确认文件位置 |
| `仅支持 .docx 格式` | 旧版 `.doc` | 建议用 Word 另存为 `.docx` |
| `mammoth` 解析失败 | 文件损坏或加密 | 让用户重新导出 docx |
