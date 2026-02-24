#!/usr/bin/env bash
# ============================================================================
# Stop Continuation Guard Hook
# ============================================================================
# 对标 oh-my-opencode 的 stop-continuation-guard hook
# 当用户使用 /stop-continuation 后，阻止 todo-continuation 重新启动循环
#
# Hook 类型: Stop
# 触发条件: 每次 Agent 停止时
# 行为:
#   1. 检查停止标记文件是否存在
#   2. 如果存在 → 允许停止（不注入继续提示）
#   3. 标记文件由 /stop-continuation 命令创建
#   4. 标记文件在新 UserPromptSubmit 时自动清除
#
# 配合文件:
#   - commands/stop-continuation.md 创建标记
#   - hooks/todo-continuation.sh 检查标记（已增强）
# ============================================================================

HOOK_NAME="stop-continuation-guard"
STATE_DIR="$HOME/.oh-my-claude/state"
STOP_MARKER="$STATE_DIR/continuation-stopped"

# 检查停止标记是否存在
if [ -f "$STOP_MARKER" ]; then
    # 标记存在：用户已明确要求停止
    # 输出空 JSON（允许正常停止，不注入任何继续提示）
    echo '{}'
    
    # 注意：不在这里清除标记
    # 标记将在下一次 UserPromptSubmit 时由清理逻辑清除
    exit 0
fi

# 标记不存在：正常退出，让其他 Stop hooks 决定是否继续
exit 0
