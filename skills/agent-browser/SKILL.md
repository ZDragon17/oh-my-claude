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

# Agent Browser 技能 - CLI 浏览器自动化

Agent Browser 是一个强大的命令行浏览器自动化工具，专为 AI Agent 设计。提供简洁的 CLI 接口，支持页面导航、元素交互、截图、数据提取等完整功能。

## 快速开始

### 基础命令

```bash
# 导航到页面
agent-browser open https://example.com

# 获取页面快照（推荐，包含交互元素引用）
agent-browser snapshot -i

# 通过引用点击元素
agent-browser click @e1

# 通过引用填写输入框
agent-browser fill @e2 "输入内容"

# 关闭浏览器
agent-browser close
```

### 核心工作流

1. **导航** - `open <url>` 访问页面
2. **快照** - `snapshot -i` 获取页面结构和元素引用（如 @e1, @e2）
3. **交互** - 使用引用进行点击、填写等操作
4. **重新快照** - 操作后再次快照查看变化

## 命令参考

### 导航命令

```bash
agent-browser open <url>              # 导航到 URL
agent-browser back                    # 返回上一页
agent-browser forward                 # 前进到下一页
agent-browser reload                  # 刷新页面
agent-browser close                   # 关闭浏览器
```

### 快照命令

```bash
agent-browser snapshot                # 基础快照
agent-browser snapshot -i             # 快照 + 交互元素引用（推荐）
agent-browser snapshot -c             # 快照 + 控制台日志
agent-browser snapshot -d 3           # 快照 + 深度 3 的 DOM 树
agent-browser snapshot -s "selector"  # 快照特定选择器的元素
```

### 交互命令

```bash
# 点击和双击
agent-browser click @e1               # 点击元素
agent-browser dblclick @e1            # 双击元素

# 焦点和输入
agent-browser focus @e1               # 聚焦元素
agent-browser fill @e1 "text"         # 填写输入框
agent-browser type @e1 "text"         # 逐字输入（模拟用户输入）
agent-browser press @e1 "Enter"       # 按下键盘按键

# 键盘控制
agent-browser keydown @e1 "Control"   # 按下键
agent-browser keyup @e1 "Control"     # 释放键

# 鼠标和悬停
agent-browser hover @e1               # 鼠标悬停
agent-browser check @e1               # 勾选复选框
agent-browser uncheck @e1             # 取消勾选
agent-browser select @e1 "option"     # 选择下拉选项

# 滚动和拖拽
agent-browser scroll 0 500            # 滚动页面（x, y）
agent-browser scrollintoview @e1      # 滚动元素到视图
agent-browser drag @e1 @e2            # 拖拽元素
agent-browser upload @e1 "/path/file" # 上传文件
```

### 信息获取命令

```bash
# 获取文本和内容
agent-browser get text @e1            # 获取元素文本
agent-browser get html @e1            # 获取元素 HTML
agent-browser get value @e1           # 获取输入框值
agent-browser get attr @e1 "class"    # 获取属性值

# 获取页面信息
agent-browser get title               # 获取页面标题
agent-browser get url                 # 获取当前 URL
agent-browser get count "selector"    # 获取匹配元素数量
agent-browser get box @e1             # 获取元素位置和大小
```

### 状态检查命令

```bash
agent-browser is visible @e1          # 检查元素是否可见
agent-browser is enabled @e1          # 检查元素是否启用
agent-browser is checked @e1          # 检查复选框是否勾选
```

### 截图和 PDF 命令

```bash
# 截图
agent-browser screenshot              # 截取可见区域
agent-browser screenshot --full       # 截取全页面
agent-browser screenshot -o page.png  # 指定输出文件

# PDF 生成
agent-browser pdf                     # 生成 PDF（可见区域）
agent-browser pdf --full              # 生成完整页面 PDF
agent-browser pdf -o page.pdf         # 指定输出文件
```

### 视频录制命令

```bash
agent-browser record start            # 开始录制
agent-browser record stop             # 停止录制
agent-browser record restart          # 重新开始录制
```

### 等待命令

```bash
# 等待元素或条件
agent-browser wait @e1                # 等待元素出现
agent-browser wait 2000               # 等待毫秒数
agent-browser wait --text "Loading"   # 等待文本出现
agent-browser wait --url "/dashboard" # 等待 URL 变化
agent-browser wait --load             # 等待页面加载完成
agent-browser wait --fn "() => document.readyState === 'complete'" # 等待自定义函数
```

### 鼠标控制命令

```bash
agent-browser mouse move 100 200      # 移动鼠标到坐标
agent-browser mouse down              # 按下鼠标
agent-browser mouse up                # 释放鼠标
agent-browser mouse wheel 0 -3        # 滚轮（x, y）
```

### 语义定位器命令

```bash
# 使用角色、文本、标签等定位
agent-browser find role "button"      # 按角色查找
agent-browser find text "Click me"    # 按文本查找
agent-browser find label "Username"   # 按标签查找
agent-browser find first              # 获取第一个匹配
agent-browser find nth 2              # 获取第 N 个匹配
```

### 浏览器设置命令

```bash
# 视口和设备
agent-browser set viewport 1280 720   # 设置视口大小
agent-browser set device "iPhone 12"  # 设置设备模拟

# 地理位置和离线
agent-browser set geo 39.9 116.4      # 设置地理位置（纬度 经度）
agent-browser set offline true        # 启用离线模式

# HTTP 头和凭证
agent-browser set headers '{"Authorization": "Bearer token"}' # 设置 HTTP 头
agent-browser set credentials "user:pass" # 设置基本认证

# 媒体和颜色
agent-browser set media "dark"        # 设置媒体查询（light/dark）
agent-browser set media-feature "prefers-reduced-motion" "reduce"
```

### Cookie 和存储命令

```bash
# Cookie 管理
agent-browser cookies                 # 获取所有 Cookie
agent-browser cookies set "name" "value" # 设置 Cookie
agent-browser cookies clear           # 清除所有 Cookie

# 本地存储
agent-browser storage local get "key" # 获取本地存储
agent-browser storage local set "key" "value" # 设置本地存储
agent-browser storage session get "key" # 获取会话存储
agent-browser storage session set "key" "value"
```

### 网络拦截命令

```bash
# 路由和请求拦截
agent-browser network route "/api/*" "mock.json" # 拦截 API 请求
agent-browser network unroute "/api/*" # 取消拦截
agent-browser network requests        # 获取所有请求
agent-browser network requests --filter "api" # 过滤请求
```

### 标签页和窗口命令

```bash
# 标签页管理
agent-browser tab                     # 获取当前标签页
agent-browser tab new                 # 打开新标签页
agent-browser tab close               # 关闭当前标签页
agent-browser tab list                # 列出所有标签页
agent-browser tab switch 1            # 切换到标签页

# 窗口管理
agent-browser window new              # 打开新窗口
agent-browser window list             # 列出所有窗口
agent-browser window switch 1         # 切换窗口
```

### 框架命令

```bash
agent-browser frame "iframe-selector" # 进入 iframe
agent-browser frame main              # 返回主框架
agent-browser frame parent            # 返回父框架
```

### 对话框命令

```bash
agent-browser dialog accept           # 接受对话框（alert/confirm）
agent-browser dialog dismiss          # 拒绝对话框
agent-browser dialog type "text"      # 在 prompt 中输入文本
```

### JavaScript 执行命令

```bash
agent-browser eval "document.title"   # 执行 JavaScript 表达式
agent-browser eval "() => window.location.href" # 执行函数
agent-browser eval --file "script.js" # 执行脚本文件
```

## 全局选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `--session <name>` | 隔离浏览器会话，支持多个独立浏览器实例 | `--session auth` |
| `--profile <path>` | 持久化浏览器配置（Cookie、存储等） | `--profile ~/.browser-profile` |
| `--headers <json>` | 设置 HTTP 请求头 | `--headers '{"Authorization":"Bearer token"}'` |
| `--executable-path <path>` | 自定义浏览器可执行文件路径 | `--executable-path /usr/bin/chromium` |
| `--user-agent <ua>` | 自定义 User-Agent | `--user-agent "Mozilla/5.0..."` |
| `--proxy <url>` | 代理服务器 | `--proxy http://proxy.company.com:8080` |
| `--json` | JSON 格式输出（便于脚本解析） | `--json` |
| `--headed` | 显示浏览器窗口（默认无头模式） | `--headed` |
| `--cdp <port\|wss>` | Chrome DevTools 协议连接 | `--cdp localhost:9222` |
| `--debug` | 启用调试输出 | `--debug` |
| `--timeout <ms>` | 全局超时时间 | `--timeout 60000` |
| `--slow-mo <ms>` | 减速执行（便于观察） | `--slow-mo 1000` |

## 实用示例

### 示例 1：表单提交

```bash
# 打开登录页面
agent-browser open https://example.com/login

# 获取页面快照，查看表单元素
agent-browser snapshot -i

# 填写用户名（假设快照中显示 @e1 是用户名输入框）
agent-browser fill @e1 "user@example.com"

# 填写密码（@e2 是密码输入框）
agent-browser fill @e2 "password123"

# 点击提交按钮（@e3 是提交按钮）
agent-browser click @e3

# 等待页面加载完成
agent-browser wait --load

# 验证登录成功
agent-browser get title
```

### 示例 2：认证与状态保存

```bash
# 使用持久化配置保存认证状态
agent-browser open https://api.example.com/login \
  --profile ~/.browser-profile \
  --headers '{"Authorization":"Bearer token123"}'

# 执行操作
agent-browser open https://api.example.com/dashboard

# 后续使用相同 profile，自动恢复认证状态
agent-browser open https://api.example.com/data \
  --profile ~/.browser-profile
```

### 示例 3：会话管理

```bash
# 创建隔离的认证会话
agent-browser open https://example.com \
  --session auth-session \
  --profile ~/.auth-profile

# 创建另一个独立会话
agent-browser open https://example.com \
  --session guest-session

# 在不同会话间切换，各自保持独立状态
```

### 示例 4：数据提取

```bash
# 打开页面
agent-browser open https://news.example.com

# 获取所有新闻标题
agent-browser get text "h2.news-title"

# 获取链接列表
agent-browser get attr "a.news-link" "href"

# 获取匹配元素数量
agent-browser get count "article.news-item"
```

### 示例 5：动态交互

```bash
# 打开页面
agent-browser open https://example.com/search

# 输入搜索词
agent-browser fill @search-input "agent-browser"

# 按 Enter 搜索
agent-browser press @search-input "Enter"

# 等待搜索结果加载
agent-browser wait --text "Results"

# 获取结果数量
agent-browser get count ".search-result"
```

## 安装

### 使用 Bun（推荐）

```bash
bun add -g agent-browser
```

### 使用 npm

```bash
npm install -g agent-browser
```

### 使用 pnpm

```bash
pnpm add -g agent-browser
```

### Playwright 浏览器安装

Agent Browser 依赖 Playwright 浏览器。首次使用时自动安装，或手动安装：

```bash
# 使用 Playwright 安装浏览器
cd /tmp && bun init -y && bun add playwright && bun playwright install chromium

# 或使用 npm
npx playwright install chromium
```

## 调试

### 启用调试模式

```bash
# 显示详细日志
agent-browser open https://example.com --debug

# 显示浏览器窗口（便于观察）
agent-browser open https://example.com --headed

# 减速执行（每个操作延迟 1 秒）
agent-browser open https://example.com --slow-mo 1000
```

### 视频录制

```bash
# 开始录制
agent-browser record start

# 执行操作
agent-browser open https://example.com
agent-browser click @button

# 停止录制
agent-browser record stop

# 查看录制视频
```

### 控制台和错误

```bash
# 获取页面快照时包含控制台日志
agent-browser snapshot -c

# 执行 JavaScript 查看错误
agent-browser eval "console.log('test')"
```

### 追踪和高亮

```bash
# 高亮元素便于调试
agent-browser click @e1 --highlight

# 获取元素位置信息
agent-browser get box @e1
```

## 故障排除

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `Browser not found` | 浏览器未安装 | 运行 `bun playwright install chromium` |
| `Element not found @e1` | 元素不存在或选择器错误 | 重新运行 `snapshot -i` 获取正确引用 |
| `Timeout waiting for element` | 元素加载超时 | 增加 `--timeout` 或使用 `wait` 命令 |
| `Connection refused` | 浏览器连接失败 | 检查浏览器进程，尝试 `--headed` 调试 |
| `Permission denied` | 文件权限问题 | 检查文件路径和权限，使用绝对路径 |
| `Invalid JSON in --headers` | HTTP 头格式错误 | 确保 JSON 格式正确，使用单引号包裹 |
| `Frame not found` | iframe 选择器错误 | 检查 iframe 选择器，使用 `snapshot -d 5` 查看完整 DOM |

## 与其他技能的关系

### Playwright Skill
- **Playwright Skill** - 通过 MCP 协议与 Playwright 通信，提供完整的浏览器 API
- **Agent Browser** - CLI 命令行工具，更轻量级，专为 AI Agent 优化

### Dev Browser Skill
- **Dev Browser** - 持久化页面状态的脚本自动化，支持复杂的多步骤工作流
- **Agent Browser** - 单次命令执行，适合快速任务和数据提取

### 选择指南

| 场景 | 推荐工具 |
|------|----------|
| 简单页面导航和数据提取 | Agent Browser |
| 复杂多步骤自动化工作流 | Dev Browser |
| 完整的浏览器 API 访问 | Playwright Skill |
| 快速原型和测试 | Agent Browser |
| 生产级自动化系统 | Dev Browser + Playwright |

---

*Agent Browser 技能 - 轻量级 CLI 浏览器自动化工具*
