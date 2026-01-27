---
name: tmux-visualization
description: |
  Tmux 可视化技能 - 多 Agent 工作可视化支持。
  对标 oh-my-opencode 的 Tmux 集成功能。
  在 tmux 环境中运行时，后台 Agent 会在独立窗格中显示。

  状态: ✅ 已实现（实验性）
  通过 PostToolUse hook 自动检测后台任务并创建 tmux 窗格。
  仅在 Unix/Linux/macOS 环境下可用。
triggers:
  keywords: [tmux, 可视化, 多窗口, 并行显示]
  commands: [/tmux, /visual]
---

# Tmux 可视化技能

> ✅ **状态: 已实现（实验性）** - 通过 `hooks/tmux-agent-visualizer.sh` 自动检测后台任务并创建可视化窗格。

在 tmux 环境中实现多 Agent 工作的实时可视化。

## 概述

当在 tmux 中运行时，后台 Agent 可以在独立的窗格 (pane) 中显示输出，实现：
- 实时观察多个 Agent 同时工作
- 每个窗格显示对应 Agent 的输出
- Agent 完成后自动清理窗格

## 配置

在项目配置或用户配置中启用：

```json
{
  "tmux": {
    "enabled": true,
    "layout": "main-vertical",
    "auto_cleanup": true,
    "show_agent_name": true
  }
}
```

### 配置选项

| 选项 | 默认值 | 描述 |
|------|--------|------|
| `enabled` | false | 是否启用 tmux 可视化 |
| `layout` | "main-vertical" | 窗格布局方式 |
| `auto_cleanup` | true | Agent 完成后是否自动关闭窗格 |
| `show_agent_name` | true | 窗格标题是否显示 Agent 名称 |

### 布局选项

| 布局 | 描述 |
|------|------|
| `main-vertical` | 主窗格在左，Agent 窗格在右侧垂直排列 |
| `main-horizontal` | 主窗格在上，Agent 窗格在下方水平排列 |
| `tiled` | 所有窗格均匀分布 |
| `even-vertical` | 所有窗格垂直均匀分布 |
| `even-horizontal` | 所有窗格水平均匀分布 |

## 使用方式

### 检测 Tmux 环境

```bash
# 检查是否在 tmux 中运行
if [ -n "$TMUX" ]; then
    echo "Running in tmux"
fi
```

### 创建 Agent 窗格

当启动后台 Agent 时：

```bash
# 创建新窗格
tmux split-window -h -t "$TMUX_PANE"

# 设置窗格标题
tmux select-pane -T "Agent: explore"

# 在新窗格中运行 Agent 输出
tmux send-keys -t "$NEW_PANE" "tail -f /tmp/agent-explore.log" Enter
```

### 清理窗格

Agent 完成后：

```bash
# 关闭指定窗格
tmux kill-pane -t "$AGENT_PANE"
```

## 可视化效果

### 单 Agent 后台运行

```
┌─────────────────────────┬─────────────────────────┐
│                         │  Agent: explore         │
│  Main Session           │                         │
│  (You are here)         │  [explore output...]    │
│                         │                         │
│                         │                         │
└─────────────────────────┴─────────────────────────┘
```

### 多 Agent 并行运行

```
┌─────────────────────────┬─────────────────────────┐
│                         │  Agent: explore         │
│  Main Session           │  [explore output...]    │
│  (You are here)         ├─────────────────────────┤
│                         │  Agent: librarian       │
│                         │  [librarian output...]  │
│                         ├─────────────────────────┤
│                         │  Agent: oracle          │
│                         │  [oracle output...]     │
└─────────────────────────┴─────────────────────────┘
```

## 与 delegate_task 集成

当使用 `run_in_background=true` 时：

```typescript
// 启动后台 Agent
delegate_task(
  subagent_type="explore",
  prompt="Find auth implementations",
  run_in_background=true  // 如果在 tmux 中，会创建可视化窗格
)
```

**行为**：
1. 如果在 tmux 中且 `tmux.enabled=true`，创建新窗格
2. 窗格显示 Agent 的实时输出
3. Agent 完成后，窗格自动关闭（如果 `auto_cleanup=true`）
4. 主会话继续工作，不受影响

## 手动控制

### Tmux 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+b %` | 垂直分割窗格 |
| `Ctrl+b "` | 水平分割窗格 |
| `Ctrl+b o` | 切换到下一个窗格 |
| `Ctrl+b x` | 关闭当前窗格 |
| `Ctrl+b z` | 最大化/还原当前窗格 |
| `Ctrl+b [` | 进入滚动模式 |

### 手动查看 Agent 输出

```bash
# 列出所有 Agent 任务
background_output --list

# 查看特定 Agent 输出
background_output(task_id="bg_abc123")
```

## 注意事项

### 不在 Tmux 中时

如果不在 tmux 环境中运行，后台 Agent 正常工作，但：
- 没有可视化窗格
- 使用 `background_output` 查看结果
- 系统通知 Agent 完成

### 窗格数量限制

- 建议最多同时显示 4-5 个 Agent 窗格
- 过多窗格会导致每个窗格太小，难以阅读
- 超过限制时，新 Agent 会复用现有窗格或不创建新窗格

### 性能考虑

- 可视化会增加少量系统开销
- 对于大量后台任务，可以考虑禁用可视化
- 可视化主要用于调试和演示

## 故障排除

### 窗格未创建

1. 检查是否在 tmux 中：`echo $TMUX`
2. 检查配置是否启用：`tmux.enabled`
3. 检查窗格数量限制

### 窗格未自动关闭

1. 检查 `auto_cleanup` 配置
2. 手动关闭：`Ctrl+b x` 或 `tmux kill-pane -t <pane>`

### 布局混乱

```bash
# 重新应用布局
tmux select-layout main-vertical

# 或使用预设布局
tmux select-layout tiled
```

---

*Tmux 可视化 - 让多 Agent 协作可见可控*
