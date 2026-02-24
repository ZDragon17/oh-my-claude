#!/usr/bin/env bash
# ============================================================================
# TODO Continuation Enforcer Hook
# ============================================================================
# 对标 oh-my-opencode 的 todo-continuation-enforcer hook
# 增强版 TODO 续航检查：检测待完成任务并注入继续提示
#
# Hook 类型: Stop
# 触发条件: 每次 Agent 停止时
# 行为:
#   1. 检查 stop-continuation 标记（如存在则跳过）
#   2. 检查 .claude/todos.json 或类似状态文件
#   3. 如果有 pending/in_progress 的 TODO → 注入继续提示
#   4. 如果所有 TODO 已完成 → 允许停止
#
# 与 todo-continuation.sh 的区别:
#   - todo-continuation.sh: 基于 yishan-loop 状态文件的循环检查
#   - 本 hook: 基于 TODO 列表本身的检查（不需要循环状态）
# ============================================================================

HOOK_NAME="todo-continuation-enforcer"
STATE_DIR="$HOME/.oh-my-claude/state"
STOP_MARKER="$STATE_DIR/continuation-stopped"

# 如果停止标记存在，允许停止
if [ -f "$STOP_MARKER" ]; then
    exit 0
fi

# 检查多个可能的 TODO 状态文件位置
TODO_FILE=""
for candidate in ".claude/todos.json" ".claude/todo.json" ".sisyphus/todos.json"; do
    if [ -f "$candidate" ]; then
        TODO_FILE="$candidate"
        break
    fi
done

# 没有找到 TODO 文件，正常退出
if [ -z "$TODO_FILE" ]; then
    exit 0
fi

# ============================================================================
# TODO 状态解析
# ============================================================================

PENDING_COUNT=0
IN_PROGRESS_COUNT=0
TOTAL_COUNT=0
COMPLETED_COUNT=0
PENDING_TASKS=""

if command -v jq > /dev/null 2>&1; then
    # 使用 jq 解析（精确）
    TOTAL_COUNT=$(jq -r '[.todos // [] | .[] ] | length' "$TODO_FILE" 2>/dev/null) || TOTAL_COUNT=0
    PENDING_COUNT=$(jq -r '[.todos // [] | .[] | select(.status == "pending")] | length' "$TODO_FILE" 2>/dev/null) || PENDING_COUNT=0
    IN_PROGRESS_COUNT=$(jq -r '[.todos // [] | .[] | select(.status == "in_progress")] | length' "$TODO_FILE" 2>/dev/null) || IN_PROGRESS_COUNT=0
    COMPLETED_COUNT=$(jq -r '[.todos // [] | .[] | select(.status == "completed")] | length' "$TODO_FILE" 2>/dev/null) || COMPLETED_COUNT=0
    
    # 获取未完成任务描述
    PENDING_TASKS=$(jq -r '[.todos // [] | .[] | select(.status == "pending" or .status == "in_progress") | .content] | join("\n  - ")' "$TODO_FILE" 2>/dev/null) || PENDING_TASKS=""
else
    # 无 jq 时使用 grep 粗略统计
    TOTAL_COUNT=$(grep -c '"status"' "$TODO_FILE" 2>/dev/null) || TOTAL_COUNT=0
    PENDING_COUNT=$(grep -c '"pending"' "$TODO_FILE" 2>/dev/null) || PENDING_COUNT=0
    IN_PROGRESS_COUNT=$(grep -c '"in_progress"' "$TODO_FILE" 2>/dev/null) || IN_PROGRESS_COUNT=0
    COMPLETED_COUNT=$(grep -c '"completed"' "$TODO_FILE" 2>/dev/null) || COMPLETED_COUNT=0
fi

# 计算未完成总数
UNFINISHED=$((PENDING_COUNT + IN_PROGRESS_COUNT))

# 没有未完成任务，允许停止
if [ "$UNFINISHED" -eq 0 ]; then
    exit 0
fi

# 如果没有总数（文件格式异常），也跳过
if [ "$TOTAL_COUNT" -eq 0 ]; then
    exit 0
fi

# ============================================================================
# 注入继续提示
# ============================================================================

# 构建进度信息
PROGRESS_PCT=0
if [ "$TOTAL_COUNT" -gt 0 ]; then
    PROGRESS_PCT=$((COMPLETED_COUNT * 100 / TOTAL_COUNT))
fi

# 构建任务列表（如果有）
TASK_LIST=""
if [ -n "$PENDING_TASKS" ]; then
    TASK_LIST="\\n\\n未完成任务:\\n  - ${PENDING_TASKS}"
fi

printf '{"decision":"block","reason":"[TODO Enforcer] 检测到 %d 个未完成任务 (进度: %d%%)","hookSpecificOutput":{"additionalContext":"\\n\\n📋 **TODO 续航检查**\\n\\n进度: %d/%d (%d%%) — 还有 %d 个任务待完成%s\\n\\n**请继续执行未完成的任务。** 使用 `mcp_todoread` 查看完整列表。\\n如需强制停止，使用 `/stop-continuation` 命令。\\n"}}\n' \
    "$UNFINISHED" "$PROGRESS_PCT" \
    "$COMPLETED_COUNT" "$TOTAL_COUNT" "$PROGRESS_PCT" \
    "$UNFINISHED" "$TASK_LIST"

exit 0
