# Windows 平台支持说明

> oh-my-claude 在 Windows 上完全可用，但部分高级功能需要额外配置。

## 兼容性概览

| 功能 | 状态 | 说明 |
|------|------|------|
| 核心命令 (`/yishan`, `/zhuge` 等) | ✅ 完全支持 | 无需额外配置 |
| Agent 系统 | ✅ 完全支持 | 无需额外配置 |
| Skills 技能 | ✅ 完全支持 | 无需额外配置 |
| 基础 Hooks | ⚠️ 部分支持 | 需要 Git Bash 或 WSL |
| 系统通知 | ⚠️ 部分支持 | 使用 PowerShell 回退 |
| 高级 Hooks | ❌ 需要配置 | 需要 WSL 或 Git Bash |

## 快速开始（Windows）

### 方式一：基础使用（无需额外配置）

如果你只使用核心命令和 Agent 功能，**无需任何额外配置**：

```powershell
# 安装
npx claude-pangu install

# 验证
# 在 Claude Code 中输入 /yishan 你好
```

### 方式二：完整功能（推荐）

为获得完整功能体验，建议安装 Git Bash：

1. **安装 Git for Windows**（包含 Git Bash）
   - 下载：https://git-scm.com/download/win
   - 安装时勾选 "Add to PATH"

2. **验证安装**
   ```powershell
   bash --version
   # 应显示 GNU bash 版本号
   ```

3. **重启 Claude Code**

### 方式三：使用 WSL（最佳兼容性）

WSL 提供完整的 Linux 环境，所有功能均可正常使用：

```powershell
# 安装 WSL
wsl --install

# 在 WSL 中安装
npx claude-pangu install
```

## Hook 兼容性详情

### 完全兼容的 Hooks

以下 Hooks 在 Windows 上无需额外配置即可工作：

- `keyword-detector.sh` - 关键词检测（通过 PowerShell 回退）
- `session-notification.sh` - 会话通知（使用 Windows Toast）
- `progress-notifier.sh` - 进度通知

### 需要 Bash 的 Hooks

以下 Hooks 需要 Git Bash 或 WSL：

| Hook | 功能 | 替代方案 |
|------|------|----------|
| `atlas.sh` | 核心编排 | 基础命令仍可用 |
| `context-compression.sh` | 上下文压缩 | 手动管理上下文 |
| `error-recovery.sh` | 错误恢复 | 手动重试 |
| `interactive-bash-session.sh` | tmux 会话 | 使用 Windows Terminal |
| `lsp-tools.sh` | LSP 工具 | 使用 IDE 内置功能 |

### 禁用不兼容的 Hooks

如果你不想安装 Bash 环境，可以禁用这些 Hooks：

编辑 `~/.claude/plugins/oh-my-claude/hooks/hooks.json`：

```json
{
  "disabled_hooks": [
    "atlas.sh",
    "interactive-bash-session.sh",
    "lsp-tools.sh"
  ]
}
```

## 系统通知配置

### 启用 Windows Toast 通知

oh-my-claude 使用多种方式发送 Windows 通知：

1. **BurntToast 模块**（最佳体验）
   ```powershell
   Install-Module -Name BurntToast -Scope CurrentUser
   ```

2. **原生 Toast**（Windows 10+）
   - 无需配置，自动使用

3. **气泡通知**（回退方案）
   - 无需配置，自动使用

### 配置通知

```bash
# 启用通知（默认）
export OH_MY_CLAUDE_NOTIFICATIONS=true

# 启用通知声音
export OH_MY_CLAUDE_NOTIFICATION_SOUND=true

# 禁用通知
export OH_MY_CLAUDE_NOTIFICATIONS=false
```

## 常见问题

### Q: 命令 `/yishan` 无响应

**A**: 核心命令不依赖 Bash，检查：
1. 插件是否正确安装：`ls ~/.claude/plugins/oh-my-claude`
2. 完全重启 Claude Code（关闭所有窗口）

### Q: Hook 执行报错 "bash: command not found"

**A**: 安装 Git Bash 或在 `hooks.json` 中禁用相关 Hook。

### Q: 通知不显示

**A**:
1. 检查 Windows 通知设置：设置 → 系统 → 通知
2. 确保 Claude Code 有通知权限
3. 尝试安装 BurntToast：`Install-Module BurntToast`

### Q: PowerShell 执行策略错误

**A**: 以管理员身份运行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 性能优化

### 减少 Hook 开销

Windows 上 Bash 脚本执行较慢，可以禁用非必要 Hooks：

```json
{
  "disabled_hooks": [
    "auto-update-checker.sh",
    "directory-readme-injector.sh",
    "preemptive-compaction.sh"
  ]
}
```

### 使用原生工具

某些功能可以使用 Windows 原生工具替代：

| 功能 | Bash 工具 | Windows 替代 |
|------|----------|--------------|
| 文件搜索 | `find`, `grep` | `rg` (ripgrep) |
| JSON 处理 | `jq` | `ConvertFrom-Json` |
| 进程管理 | `ps`, `kill` | `Get-Process`, `Stop-Process` |

## 贡献 Windows 支持

如果你有兴趣改进 Windows 支持，欢迎贡献：

1. 为关键 Hook 提供 PowerShell 替代实现
2. 改进 Windows 通知体验
3. 完善本文档

提交 PR 到：https://github.com/ZDragon17/oh-my-claude
