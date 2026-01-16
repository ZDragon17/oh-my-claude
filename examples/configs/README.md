# oh-my-claude 配置示例

这个目录包含了不同使用场景的配置示例文件。你可以将这些文件复制到你的配置位置并根据需要进行修改。

## 配置位置

oh-my-claude 支持分层配置，按优先级从高到低：

1. **环境变量** - 最高优先级，用于覆盖其他配置
2. **项目配置** - `./.oh-my-claude.json` 或 `./oh-my-claude.config.json`
3. **用户配置** - `~/.oh-my-claude/config.json`
4. **全局配置** - `~/.oh-my-claude/config/global.json`

## 使用示例配置

### 方法 1: 复制到用户配置

```bash
# 复制开发环境配置
cp examples/configs/development.json ~/.oh-my-claude/config.json

# 复制生产环境配置
cp examples/configs/production.json ~/.oh-my-claude/config.json
```

### 方法 2: 复制到项目配置

```bash
# 为特定项目设置配置
cp examples/configs/development.json ./.oh-my-claude.json
```

### 方法 3: 使用 CLI 导入

```bash
# 导入配置（需要实现导入功能）
oh-my-claude config import examples/configs/production.json
```

## 配置说明

### development.json - 开发环境配置

适合开发和调试场景：
- 启用调试模式和详细日志
- 更长的超时时间
- 禁用缓存以确保最新代码
- 启用第三方插件支持
- 启用性能分析和追踪

### production.json - 生产环境配置

适合生产环境部署：
- 禁用调试模式，只显示警告及以上日志
- 更短的超时时间和重试次数
- 优化性能设置
- 严格的安全策略

### minimal.json - 最小化配置

适合只需要基本功能的用户：
- 只包含最基本的配置项
- 使用默认值以保持简洁
- 适合初次使用的用户

## 自定义配置

你可以在现有配置基础上进行修改：

```bash
# 查看当前配置
oh-my-claude config show

# 修改单个配置项
oh-my-claude config set debug true
oh-my-claude config set agents.defaultTimeout 60000

# 保存配置
oh-my-claude config save
```

## 环境变量覆盖

某些配置可以通过环境变量覆盖：

```bash
# 调试模式
export OH_MY_CLAUDE_DEBUG=true

# Agent 超时时间（毫秒）
export OH_MY_CLAUDE_AGENT_TIMEOUT=60000

# 最大并发任务数
export OH_MY_CLAUDE_MAX_CONCURRENT=5

# UI 主题
export OH_MY_CLAUDE_THEME=dark

# 语言设置
export OH_MY_CLAUDE_LANGUAGE=en-US

# 网络超时
export OH_MY_CLAUDE_TIMEOUT=30000

# 代理服务器
export OH_MY_CLAUDE_PROXY=http://proxy.company.com:8080
```

## 配置验证

所有配置都会通过 Zod 模式验证，确保类型安全。如果配置无效，系统会使用默认值并显示警告。

```bash
# 验证配置是否有效
oh-my-claude config show
```

## 热重载

如果启用了追踪功能（`advanced.enableTracing = true`），配置文件修改后会自动重新加载，无需重启应用程序。