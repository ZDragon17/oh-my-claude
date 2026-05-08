# Codex CLI Integration

## 概述

oh-my-claude v3.1.0+ 支持在 OpenAI Codex CLI 中运行，通过 provider-adapter 架构实现。

## 快速开始

### 1. 安装

```bash
# 安装 oh-my-claude
npm install -g claude-pangu

# 注册到 Codex
claude-pangu install --provider codex
```

### 2. 配置 Codex 环境

```bash
# 设置环境变量（或由 Codex CLI 自动设置）
export CODEX_SESSION_ID=<session-id>
export CODEX_MODEL=gpt-4o

# 显式指定 provider
export OH_MY_CLAUDE_PROVIDER=codex
```

### 3. 验证

```bash
claude-pangu verify --provider codex
```

## Provider 映射

| 功能 | Claude Code | Codex CLI |
|------|-------------|-----------|
| 安装目录 | `~/.claude/plugins/oh-my-claude/` | `~/.codex/plugins/oh-my-claude/` |
| 状态目录 | `~/.oh-my-claude/` | `~/.oh-my-claude-codex/` |
| 会话 ID | `$CLAUDE_SESSION_ID` | `$CODEX_SESSION_ID` |
| 默认模型 | claude-sonnet-4-6 | gpt-4o |
| 回退链 | opus-4-7 → sonnet-4-6 → haiku-4-5 | o3 → gpt-4o → gpt-4o-mini |

## 钩子事件映射

| oh-my-claude | Claude Code | Codex CLI |
|--------------|-------------|-----------|
| preToolUse | PreToolUse | before_tool |
| postToolUse | PostToolUse | after_tool |
| userPromptSubmit | UserPromptSubmit | on_message |
| sessionStart | SessionStart | on_start |
| stop | Stop | on_stop |

## 工具名称映射

oh-my-claude 内部使用统一的 `ToolType`，每个 provider 映射到相应 CLI 的工具名称。

## 自动检测

1. 显式 `OH_MY_CLAUDE_PROVIDER=codex`
2. 检测 `$CODEX_SESSION_ID` 环境变量
3. 检测 `~/.codex/plugins/oh-my-claude/config.json`
4. 回退到 generic provider

## 通用 Provider 模式

除 Claude Code 和 Codex 之外，oh-my-claude 支持 `generic` provider 用于独立运行：

```bash
OH_MY_CLAUDE_PROVIDER=generic OMC_SESSION_ID=test-1 \
  node dist/lib/atlas/cli.js --action=start-plan --name="my-plan"
```
