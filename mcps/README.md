# oh-my-claude 内置 MCP 服务器

本目录包含 oh-my-claude 的 MCP (Model Context Protocol) 服务器配置参考文件。

## 自动安装

安装 oh-my-claude 时，以下 MCP 服务器会**自动配置**到 Claude Code 中：

| MCP | 功能 | 状态 |
|-----|------|------|
| **context7** | 官方文档查询 | ✅ 默认启用 |
| **grep-app** | GitHub 代码搜索 | ✅ 默认启用 |
| **deepwiki** | 开源项目文档 | ✅ 默认启用 |
| **open-websearch** | 网络搜索 (DuckDuckGo/Bing) | ✅ 默认启用 |

## 工作原理

oh-my-claude 在插件根目录提供 `.mcp.json` 文件，Claude Code 会自动读取并注册其中的 MCP 服务器。

## 验证安装

安装 oh-my-claude 后，在 Claude Code 中输入：

```
你能使用哪些 MCP 工具？
```

应该能看到 `context7`、`grep-app`、`deepwiki`、`open-websearch` 等工具。

## 配置文件

### .mcp.json (插件根目录)

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  },
  "grep-app": {
    "command": "npx",
    "args": ["-y", "@anthropic/grep-app-mcp"]
  }
}
```

### 本目录的 JSON 文件

本目录（`mcps/`）中的 JSON 文件是详细的配置参考，包含：
- 完整的工具定义
- 参数说明
- 使用示例

可用于了解每个 MCP 的详细功能。

## 禁用 MCP

如果需要禁用某个 MCP，可以在 oh-my-claude 配置中设置：

```json
{
  "mcp": {
    "disabled_mcps": ["deepwiki"]
  }
}
```

或直接编辑 `.mcp.json` 文件删除对应条目。

## 添加更多 MCP

### 方法一：编辑 .mcp.json

在插件目录的 `.mcp.json` 中添加：

```json
{
  "my-mcp": {
    "command": "npx",
    "args": ["-y", "@my-org/my-mcp-server"]
  }
}
```

### 方法二：使用 Claude Code 设置

直接在 Claude Code 的 MCP 设置中添加。

## 需要 API 密钥的 MCP

某些 MCP 需要 API 密钥才能使用：

| MCP | 环境变量 | 获取方式 |
|-----|----------|----------|
| exa | `EXA_API_KEY` | https://exa.ai |
| postgres | `DATABASE_URL` | 自有数据库 |

设置环境变量后重启 Claude Code 即可使用。

## 故障排查

### MCP 不工作？

1. **检查 npm 可用性**：`npx --version`
2. **手动测试 MCP**：`npx -y @upstash/context7-mcp`
3. **检查网络**：确保能访问 npm registry
4. **重启 Claude Code**：安装后需要重启

### 常见错误

- `ENOENT`: npm 包名错误或网络问题
- `TIMEOUT`: 网络超时，检查代理设置
- `PERMISSION`: 权限问题，检查 npm 缓存目录
