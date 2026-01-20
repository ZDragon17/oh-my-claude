# Playwright 浏览器自动化技能

## 概述

Playwright Skill 为 oh-my-claude 提供浏览器自动化能力，支持网页导航、截图、表单填写和数据提取等功能。

## 核心能力

### 1. 页面导航
- 访问 URL
- 前进/后退
- 页面刷新

### 2. 元素交互
- 点击元素
- 输入文本
- 填写表单
- 选择下拉选项
- 鼠标悬停

### 3. 截图功能
- 全页截图
- 元素截图
- 可配置质量和格式

### 4. 内容提取
- 获取页面 HTML
- 提取文本内容
- 获取元素属性
- 执行 JavaScript

### 5. 等待机制
- 等待元素出现
- 等待导航完成
- 等待网络空闲
- 自定义超时

## 使用示例

### 截取网页截图

```
用户: 截取 https://github.com 的页面截图

Agent 工作流:
1. navigate("https://github.com")
2. waitForSelector("body")
3. screenshot({ fullPage: true })
4. 返回截图文件路径
```

### 填写表单

```
用户: 在示例网站填写登录表单，用户名 test，密码 demo123

Agent 工作流:
1. navigate("https://example.com/login")
2. fill("#username", "test")
3. fill("#password", "demo123")
4. click("button[type=submit]")
5. waitForNavigation()
6. 确认登录成功
```

### 提取页面数据

```
用户: 从 example.com 提取页面标题和主要内容

Agent 工作流:
1. navigate("https://example.com")
2. getText("h1")  // 获取标题
3. getText("main")  // 获取主要内容
4. 返回提取的数据
```

## 配置说明

### 基础配置

```json
{
  "headless": true,       // 无头模式
  "timeout": 30000,       // 超时时间 (ms)
  "viewport": {
    "width": 1280,
    "height": 720
  }
}
```

### 截图配置

```json
{
  "screenshot_format": "png",
  "screenshot_quality": 80
}
```

## MCP 服务器

此 Skill 可选集成 Playwright MCP 服务器：

```bash
# 安装
npm install -g @anthropic/playwright-mcp

# MCP 会在触发时自动启动
```

### MCP 工具列表

| 工具 | 描述 |
|-----|------|
| `navigate` | 导航到指定 URL |
| `click` | 点击元素 |
| `fill` | 填写输入框 |
| `screenshot` | 截取页面截图 |
| `getText` | 获取元素文本 |
| `evaluate` | 执行 JavaScript |

## 安全限制

### 需要确认的操作
- 访问银行相关网站
- 访问政府网站
- 任何涉及敏感数据的操作

### 禁止的操作
- 未授权的密码输入
- 支付操作
- 账户删除操作

## 故障排查

### 常见问题

1. **元素找不到**
   - 检查选择器是否正确
   - 增加等待时间
   - 检查元素是否在 iframe 中

2. **超时错误**
   - 增加 timeout 配置
   - 检查网络连接
   - 检查页面是否完全加载

3. **截图失败**
   - 确保页面已加载
   - 检查磁盘空间
   - 尝试使用非全页截图

## 与其他 Skill 协作

- **huitu** (绘图): 分析截取的图片
- **bianque** (扁鹊): 调试浏览器自动化问题
- **baozheng** (包拯): E2E 测试设计和执行

## 版本历史

- v1.0.0 - 初始版本，支持基础浏览器自动化
