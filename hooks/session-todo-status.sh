#!/usr/bin/env bash
# ============================================================================
# Session Todo Status Hook
# ============================================================================
# 对标 oh-my-opencode 的 session-todo-status hook
# 在 TodoWrite 工具使用后注入当前 TODO 状态摘要
#
# Hook 类型: PostToolUse
# 触发条件: TodoWrite / mcp_todowrite 工具调用
# 行为:
#   1. 检查是否是 TodoWrite 工具
#   2. 解析 todo 数据，统计各状态数量
#   3. 输出状态摘要（已完成/进行中/待处理/已取消）
# ============================================================================

HOOK_NAME="session-todo-status"

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

# 只处理 TodoWrite 工具
case "$TOOL_NAME" in
    TodoWrite|todowrite|mcp_todowrite|TodoRead|todoread|mcp_todoread)
        ;;
    *)
        exit 0
        ;;
esac

# 需要 jq 来解析 todo 数据
if ! command -v jq > /dev/null 2>&1; then
    exit 0
fi

# 从工具输入或输出中提取 todo 数据
TODOS=$(echo "$INPUT" | jq -r '.tool_input.todos // .tool_output.todos // empty' 2>/dev/null)
if [ -z "$TODOS" ] || [ "$TODOS" = "null" ]; then
    # 尝试从 tool_result 中获取
    TODOS=$(echo "$INPUT" | jq -r '.tool_result // empty' 2>/dev/null)
    if [ -z "$TODOS" ] || [ "$TODOS" = "null" ]; then
        exit 0
    fi
fi

# 统计各状态数量
TOTAL=$(echo "$TODOS" | jq 'if type == "array" then length else 0 end' 2>/dev/null) || TOTAL=0
COMPLETED=$(echo "$TODOS" | jq '[.[] | select(.status == "completed")] | length' 2>/dev/null) || COMPLETED=0
IN_PROGRESS=$(echo "$TODOS" | jq '[.[] | select(.status == "in_progress")] | length' 2>/dev/null) || IN_PROGRESS=0
PENDING=$(echo "$TODOS" | jq '[.[] | select(.status == "pending")] | length' 2>/dev/null) || PENDING=0
CANCELLED=$(echo "$TODOS" | jq '[.[] | select(.status == "cancelled")] | length' 2>/dev/null) || CANCELLED=0

if [ "$TOTAL" = "0" ] || [ -z "$TOTAL" ]; then
    exit 0
fi

# 计算完成百分比
if [ "$TOTAL" -gt 0 ]; then
    PERCENT=$((COMPLETED * 100 / TOTAL))
else
    PERCENT=0
fi

# 生成进度条
BAR_WIDTH=20
FILLED=$((PERCENT * BAR_WIDTH / 100))
EMPTY=$((BAR_WIDTH - FILLED))
# 安全生成进度条：限制 FILLED/EMPTY 范围防止无限循环
BAR=""
local _i
if [ "$FILLED" -gt 0 ] 2>/dev/null && [ "$FILLED" -le 100 ]; then
  for _i in $(seq 1 "$FILLED" 2>/dev/null || jot "$FILLED" 2>/dev/null); do BAR="${BAR}█"; done
fi
if [ "$EMPTY" -gt 0 ] 2>/dev/null && [ "$EMPTY" -le 100 ]; then
  for _i in $(seq 1 "$EMPTY" 2>/dev/null || jot "$EMPTY" 2>/dev/null); do BAR="${BAR}░"; done
fi

# 选择状态 emoji
if [ "$PERCENT" -eq 100 ]; then
    STATUS_EMOJI="🎉"
elif [ "$PERCENT" -ge 75 ]; then
    STATUS_EMOJI="💪"
elif [ "$PERCENT" -ge 50 ]; then
    STATUS_EMOJI="🚀"
elif [ "$PERCENT" -ge 25 ]; then
    STATUS_EMOJI="⚡"
else
    STATUS_EMOJI="🔄"
fi

# 输出状态摘要
echo ""
echo "📊 ${BAR} ${PERCENT}% (${COMPLETED}/${TOTAL}) ${STATUS_EMOJI}"

# 详细状态（仅在有多种状态时显示）
DETAILS=""
[ "$IN_PROGRESS" -gt 0 ] && DETAILS="${DETAILS}🔄 进行中: ${IN_PROGRESS} "
[ "$PENDING" -gt 0 ] && DETAILS="${DETAILS}⏳ 待处理: ${PENDING} "
[ "$CANCELLED" -gt 0 ] && DETAILS="${DETAILS}❌ 已取消: ${CANCELLED} "

if [ -n "$DETAILS" ]; then
    echo "✅ 已完成: ${COMPLETED} | ${DETAILS}"
fi
