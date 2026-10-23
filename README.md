# word-to-html Skill 安装说明

将 Word `.docx` 文件转换为纯净语义化 HTML 的 Trae Skill。适用于小程序 `rich-text` 组件、H5 活动规则页等场景。

---

## 1. 前置要求

| 依赖 | 版本要求 | 检查命令 |
|---|---|---|
| Node.js | >= 20 | `node -v` |
| npm | 随 Node 自带 | `npm -v` |
| Trae IDE | 支持 Skills 的版本 | — |

> Node 版本过低时 mammoth 会报 `File is not defined`。推荐使用 nvm 管理版本：`nvm install stable && nvm alias default stable`。

## 2. 安装

### 2.1 放置 skill 目录

将完整的 `word-to-html/` 目录复制到以下**任一**位置：

```bash
# 方式一：全局安装（所有项目、所有对话都可用）—— 推荐
cp -r word-to-html ~/.trae-cn/skills/

# 方式二：项目级安装（仅当前项目可用）
cp -r word-to-html <项目根目录>/.trae/skills/
```

也可以通过 git 获取：

```bash
# 全局
git clone <仓库地址> ~/.trae-cn/skills/word-to-html

# 项目级
git clone <仓库地址> <项目根目录>/.trae/skills/word-to-html
```

安装后目录结构应为：

```
<skills 目录>/word-to-html/
├── SKILL.md
├── README.md
└── scripts/
    ├── convert.js
    ├── package.json
    └── package-lock.json
```

### 2.2 安装 Node 依赖

```bash
cd <skills 目录>/word-to-html/scripts
npm install
```

依赖为 `mammoth`（解析 docx）+ `cheerio`（清洗 HTML），已用 package-lock 锁定版本。

## 3. 验证安装

任选一种方式验证：

```bash
# 查看帮助
node <skills 目录>/word-to-html/scripts/convert.js --help

# 用一个 docx 文件实测
node <skills 目录>/word-to-html/scripts/convert.js /path/to/测试.docx
```

成功会输出 `[完成] <输出路径>.html` 及 JSON summary。

然后在 Trae 中**新开一个对话**，说"把这个 word 转成 html"并附上 `.docx` 文件，能命中 skill 即安装成功。

## 4. 使用

### 对话触发（常规）

直接向 Trae 发送 `.docx` 文件并说"转成 html"即可。skill 会自动完成转换并交付 HTML 文件。

### 命令行使用（不依赖 Trae）

```bash
# 默认：输出到输入文件同目录、同名 .html
node scripts/convert.js <输入.docx>

# 指定输出路径和网页标题
node scripts/convert.js <输入.docx> <输出.html> --title "文档标题"
```

## 5. 能力边界

- ✅ 支持 `.docx`（Office 2007 及以后格式）
- ❌ 不支持旧版 `.doc`（先用 Word 另存为 `.docx`）、PDF、Markdown
- 图片自动内嵌为 Base64，含大图时 HTML 体积会明显变大
- 复杂 Word 样式（分栏、页眉页脚、批注、文本框）不会保留
- 输出为语义化标签（`h1`–`h6`、`p`、`ul/ol/li`、`table`、`blockquote`、`a`、`img`），段落默认两端对齐

## 6. 常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| `File is not defined` | Node < 20 | 升级 Node：`nvm install stable` |
| `仅支持 .docx 格式` | 传入了旧版 `.doc` | Word 中另存为 `.docx` |
| `Cannot find module 'mammoth'` | 未执行 npm install | 见 2.2 |
| mammoth 解析失败 | 文件损坏或加密 | 用 Word 重新导出 docx |
| skill 不触发 | 目录位置不对或 Trae 未刷新 | 确认目录结构正确后新开对话 |

## 7. 卸载

删除 skill 目录即可：

```bash
rm -rf ~/.trae-cn/skills/word-to-html
# 或
rm -rf <项目根目录>/.trae/skills/word-to-html
```
