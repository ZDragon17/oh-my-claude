---
name: dev-browser
description: |
  Browser automation with persistent page state. Use when users ask to navigate websites,
  fill forms, take screenshots, extract web data, test web apps, or automate browser workflows.
  Trigger phrases include 'go to [url]', 'click on', 'fill out the form', 'take a screenshot',
  'scrape', 'automate', 'test the website', 'log into', or any browser interaction request.
triggers:
  keywords: [dev-browser, browser automation, persistent page, scrape, navigate, screenshot]
  commands: [/dev-browser, /browser-dev]
---

# Dev Browser 技能 - 持久化页面状态的浏览器自动化

持久化页面状态的浏览器自动化。在用户要求导航网站、填写表单、截图、提取网页数据、测试网页应用或自动化浏览器工作流时使用。

## 方法选择

- **本地/源代码可用的网站**: 阅读源代码获取选择器
- **未知布局**: 使用 `getAISnapshot()` + `selectSnapshotRef()` 进行元素发现
- **视觉反馈**: 截图验证页面状态

## 安装与启动

### 独立模式（默认）

```bash
./skills/dev-browser/server.sh &
```

等待 Ready 消息。如需无头模式，添加 `--headless` 参数。

### 扩展模式

连接到用户现有的 Chrome 浏览器以支持已认证的会话。

## 编写脚本

从 `skills/dev-browser/` 目录运行所有脚本。使用 heredoc 内联执行：

```bash
cd skills/dev-browser && npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
const client = await connect();
const page = await client.page("example", { viewport: { width: 1920, height: 1080 } });
await page.goto("https://example.com");
await waitForPageLoad(page);
console.log({ title: await page.title(), url: page.url() });
await client.disconnect();
EOF
```

### 核心原则

1. **小脚本**: 每个脚本只做一件事
2. **评估状态**: 记录/返回状态以决定后续步骤
3. **描述性页面名称**: 使用有意义的页面标识符
4. **断开连接退出**: 页面在服务器上持久化
5. **浏览器上下文中使用纯 JavaScript**: 不在 `page.evaluate()` 中使用 TypeScript 语法

## 工作循环

1. 编写脚本 → 2. 运行 → 3. 评估 → 4. 决策 → 5. 重复

## 客户端 API

```typescript
const client = await connect();
const page = await client.page("name");
const pageWithSize = await client.page("name", { viewport: { width: 1920, height: 1080 } });
const pages = await client.list();
await client.close("name");
await client.disconnect();
const snapshot = await client.getAISnapshot("name");
const element = await client.selectSnapshotRef("name", "e5");
```

## 等待机制

```typescript
import { waitForPageLoad } from "@/client.js";
await waitForPageLoad(page);
await page.waitForSelector(".results");
await page.waitForURL("**/success");
```

## 页面检查

### 截图

```typescript
await page.screenshot({ path: "tmp/screenshot.png" });
await page.screenshot({ path: "tmp/full.png", fullPage: true });
```

### ARIA 快照（元素发现）

`getAISnapshot()` 返回 YAML 格式的无障碍树，包含 `[ref=eN]` 元素标记。使用 `selectSnapshotRef()` 与这些引用交互：

```yaml
# 快照示例
- role: main
  children:
    - role: heading
      text: "Search Results"
      [ref=e1]
    - role: list
      children:
        - role: listitem
          text: "Result 1"
          [ref=e2]
        - role: listitem
          text: "Result 2"
          [ref=e3]
```

使用引用与元素交互：

```typescript
const element = await client.selectSnapshotRef("pageName", "e2");
await element.click();
```

## 数据抓取

对于大型数据集，拦截并重放网络请求，而不是滚动 DOM。

## 错误恢复

页面状态在失败后持久化。使用截图 + 状态检查脚本进行调试。

## 注意事项

- 浏览器上下文中不支持 TypeScript（`page.evaluate()` 在浏览器中运行）
- 仅在脚本需要重用时写入 `tmp/` 文件
- 断开连接后页面在服务器上持久化
