#!/usr/bin/env bash
# ============================================================================
# Task Reminder Hook
# ============================================================================
# 对标 oh-my-opencode 的 task-reminder hook
# 当连续多轮未使用 task/todo 工具时，提醒使用任务追踪
#
# Hook 类型: PostToolUse
# 触发条件: 所有工具调用后
# 行为:
#   1. 追踪每个会话的工具调用计数
#   2. 如果使用了 task/todo 工具，重置计数
#   3. 如果连续 N 轮未使用，注入提醒
# ============================================================================

HOOK_NAME="task-reminder"
STATE_DIR="$HOME/.oh-my-claude/state"
COUNTER_FILE="$STATE_DIR/task-reminder-counter"
TURN_THRESHOLD=10

# 确保状态目录存在
mkdir -p "$STATE_DIR" 2>/dev/null

# 从 stdin 读取 JSON 数据
INPUT=$(cat 2>/dev/null) || INPUT=""
if [ -z "$INPUT" ]; then
    exit 0
fi

# 解析工具名
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
else
    TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
fi

if [ -z "$TOOL_NAME" ]; then
    exit 0
fi

# 检查是否是 task/todo 相关工具
case "$TOOL_NAME" in
    task|Task|mcp_task|TodoWrite|todowrite|mcp_todowrite|TodoRead|todoread|mcp_todoread)
        # 使用了任务工具，重置计数
        echo "0" > "$COUNTER_FILE" 2>/dev/null
        exit 0
        ;;
esac

# 递增计数器
CURRENT_COUNT=0
if [ -f "$COUNTER_FILE" ]; then
    CURRENT_COUNT=$(cat "$COUNTER_FILE" 2>/dev/null) || CURRENT_COUNT=0
fi

# 确保是数字
case "$CURRENT_COUNT" in
    ''|*[!0-9]*) CURRENT_COUNT=0 ;;
esac

CURRENT_COUNT=$((CURRENT_COUNT + 1))
echo "$CURRENT_COUNT" > "$COUNTER_FILE" 2>/dev/null

# 检查是否达到阈值
if [ "$CURRENT_COUNT" -eq "$TURN_THRESHOLD" ]; then
    cat << 'EOF'

[SYSTEM REMINDER - TODO CONTINUATION]
最近没有使用 task/todo 工具。如果你正在追踪工作进度，请使用 TodoWrite 记录进展，或使用 task 委派子任务。

> 保持 TODO 列表更新有助于用户了解进度、防止遗漏步骤。
EOF
    # 重置计数，避免重复提醒
    echo "0" > "$COUNTER_FILE" 2>/dev/null
fi
