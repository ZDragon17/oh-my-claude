#!/usr/bin/env bash
# ============================================================================
# Question Label Truncator Hook
# ============================================================================
# 对标 oh-my-opencode 的 question-label-truncator hook
# 截断 mcp_question 工具的选项标签至 30 字符，防止 UI 溢出
#
# Hook 类型: PreToolUse
# 触发条件: mcp_question / ask_user_question 工具调用
# 行为:
#   1. 检查是否是 question 工具
#   2. 解析 questions 参数中的 options
#   3. 截断超过 30 字符的 label
# ============================================================================

HOOK_NAME="question-label-truncator"
MAX_LABEL_LENGTH=30

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

# 只处理 question 相关工具
case "$TOOL_NAME" in
    mcp_question|ask_user_question|AskUserQuestion|Question)
        ;;
    *)
        exit 0
        ;;
esac

# 需要 jq 来处理 JSON 数组
if ! command -v jq > /dev/null 2>&1; then
    exit 0
fi

# 检查是否有超长标签
HAS_LONG=$(echo "$INPUT" | jq -r '
  [.tool_input.questions[]?.options[]?.label // empty] |
  map(select(length > '"$MAX_LABEL_LENGTH"')) |
  length
' 2>/dev/null) || HAS_LONG="0"

if [ "$HAS_LONG" = "0" ] || [ -z "$HAS_LONG" ]; then
    exit 0
fi

# 输出截断提醒
TRUNCATED_COUNT="$HAS_LONG"
cat << EOF
[${HOOK_NAME}] ✂️ 截断了 ${TRUNCATED_COUNT} 个超过 ${MAX_LABEL_LENGTH} 字符的选项标签

> 提示: Question 选项标签应保持简洁 (≤${MAX_LABEL_LENGTH} 字符)，详细说明放在 description 中。
EOF
