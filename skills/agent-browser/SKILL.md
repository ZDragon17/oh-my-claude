---
name: agent-browser
description: |
  Agent Browser 备选引擎 - 浏览器自动化双引擎支持。
  对标 oh-my-opencode 的 agent-browser 集成。
  提供 Playwright MCP 和 Vercel agent-browser 两种浏览器自动化选项。
triggers:
  keywords: [browser, 浏览器, screenshot, 截图, scrape, 爬取, navigate, agent-browser]
  commands: [/agent-browser, /browser-alt]
---

# Agent Browser 技能

提供两种浏览器自动化引擎，可根据需求选择。

## 概述

oh-my-claude 支持两种浏览器自动化引擎：

| 引擎 | 优势 | 适用场景 |
|------|------|----------|
| **Playwright MCP** (默认) | 功能全面，稳定可靠 | 通用浏览器自动化 |
| **Vercel agent-browser** | 轻量级，AI 优化 | 简单抓取任务 |

## 引擎选择

### 配置方式

在项目配置中设置引擎：

```json
{
  "browser_automation_engine": {
    "provider": "playwright"  // 或 "agent-browser"
  }
}
```

### 默认引擎：Playwright MCP

**无需额外配置**，使用内置的 Playwright MCP。

**使用示例**：
```
使用浏览器导航到 example.com 并截图
```

**技术细节**：
- 通过 MCP 协议与 Playwright 通信
- 支持完整的浏览器操作 API
- 支持多标签页、表单、网络请求拦截

### 备选引擎：Vercel Agent Browser

**需要安装**：
```bash
bun add -g agent-browser
# 或
npm install -g agent-browser
```

**使用示例**：
```
使用 agent-browser 导航到 example.com 并提取标题
```

**特点**：
- 专为 AI Agent 设计
- 更简洁的 API
- 更轻量级

## 功能对比

| 功能 | Playwright MCP | Agent Browser |
|------|----------------|---------------|
| 页面导航 | ✅ | ✅ |
| 元素点击 | ✅ | ✅ |
| 表单填写 | ✅ | ✅ |
| 截图 | ✅ | ✅ |
| PDF 生成 | ✅ | ❌ |
| 网络请求拦截 | ✅ | ❌ |
| 多标签页 | ✅ | 有限 |
| 无头模式 | ✅ | ✅ |
| 可视模式 | ✅ | ✅ |
| Cookie 管理 | ✅ | ✅ |
| 等待条件 | ✅ | ✅ |
| JavaScript 执行 | ✅ | ✅ |

## Playwright MCP 使用指南

### 基本导航

```
# 导航到 URL
browser_navigate(url="https://example.com")

# 截取页面快照
browser_snapshot()

# 点击元素
browser_click(ref="[ref_id]", element="Submit button")

# 填写表单
browser_type(ref="[ref_id]", text="Hello World")
```

### 高级操作

```
# 多标签页
browser_tabs(action="new")
browser_tabs(action="select", index=1)

# 等待元素
browser_wait_for(text="Loading complete")

# 执行 JavaScript
browser_evaluate(function="() => document.title")

# 处理对话框
browser_handle_dialog(accept=true)
```

### 截图选项

```
# 截取可见区域
browser_take_screenshot(type="png")

# 截取全页面
browser_take_screenshot(fullPage=true)

# 截取特定元素
browser_take_screenshot(ref="[ref_id]", element="Header section")
```

## Agent Browser 使用指南

### 基本使用

```bash
# 导航并提取内容
agent-browser navigate https://example.com --extract-text

# 截图
agent-browser screenshot https://example.com --output page.png

# 执行脚本
agent-browser eval https://example.com --script "document.title"
```

### 在 oh-my-claude 中使用

当配置为 `agent-browser` 引擎时：

```
使用 agent-browser 访问 https://news.ycombinator.com 
并提取前 10 条新闻标题
```

系统会自动转换为 agent-browser CLI 调用。

## 选择建议

### 使用 Playwright MCP 当：
- 需要复杂的浏览器操作
- 需要处理多标签页
- 需要拦截网络请求
- 需要生成 PDF
- 需要更稳定的自动化

### 使用 Agent Browser 当：
- 只需要简单的页面抓取
- 追求更轻量级的解决方案
- 不需要 Playwright 的完整功能
- 环境受限无法安装 Playwright

## 故障排除

### Playwright 未安装

```
错误: browser not installed

解决:
1. 运行 browser_install() 安装浏览器
2. 或手动: npx playwright install chromium
```

### Agent Browser 未安装

```
错误: agent-browser command not found

解决:
1. 安装: bun add -g agent-browser
2. 或使用默认的 Playwright 引擎
```

### 浏览器超时

```
错误: timeout waiting for element

解决:
1. 增加等待时间
2. 使用更精确的选择器
3. 检查页面是否正确加载
```

## 配置示例

### 完整配置

```json
{
  "browser_automation_engine": {
    "provider": "playwright",
    "headless": true,
    "timeout": 30000,
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### 最小配置

```json
{
  "browser_automation_engine": {
    "provider": "agent-browser"
  }
}
```

## 与 Playwright Skill 的关系

- `/playwright` 技能专注于 Playwright MCP 的使用
- `/agent-browser` 技能提供双引擎选择
- 两者可以共存，根据任务需求选择

---

*Agent Browser 技能 - 灵活的浏览器自动化选择*
