#!/usr/bin/env bash
# ============================================================================
# Write Existing File Guard Hook
# ============================================================================
# 对标 oh-my-opencode 的 write-existing-file-guard hook
# 阻止对已存在文件使用 Write（应该用 Edit），除非文件已经被 Read 过
#
# Hook 类型: PreToolUse
# 触发条件: Write 工具调用
# 行为:
#   1. 检查目标文件是否存在
#   2. 如果不存在 → 放行（创建新文件）
#   3. 如果存在 → 检查是否之前 Read 过该文件
#   4. 如果没有 Read 过 → 阻止，建议使用 Edit
#   5. 如果 Read 过 → 放行（有意覆写）
# ============================================================================

HOOK_NAME="write-existing-file-guard"
STATE_DIR="$HOME/.oh-my-claude/state"
READ_TRACKER="$STATE_DIR/read-files-tracker"

# 确保状态目录存在
mkdir -p "$STATE_DIR" 2>/dev/null

# 从 stdin 读取 JSON 数据
INPUT=$(cat 2>/dev/null) || INPUT=""
if [ -z "$INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    FILE_PATH=$(echo "$INPUT" | jq -r '(.tool_input.filePath // .tool_input.file_path // .tool_input.path // empty)' 2>/dev/null) || FILE_PATH=""
else
    TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    FILE_PATH=$(echo "$INPUT" | grep -o '"filePath"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"filePath"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || FILE_PATH=""
fi

# ============================================================================
# Read 追踪器功能
# ============================================================================

# 如果是 Read 工具，记录文件路径（供后续 Write 检查使用）
if [ "$TOOL_NAME" = "Read" ] || [ "$TOOL_NAME" = "read" ] || [ "$TOOL_NAME" = "mcp_read" ]; then
    if [ -n "$FILE_PATH" ]; then
        # 追加到已读文件列表（去重）
        touch "$READ_TRACKER" 2>/dev/null
        if ! grep -qxF "$FILE_PATH" "$READ_TRACKER" 2>/dev/null; then
            echo "$FILE_PATH" >> "$READ_TRACKER"
        fi
    fi
    exit 0
fi

# 只处理 Write 工具
case "$TOOL_NAME" in
    Write|write|mcp_write)
        ;;
    *)
        exit 0
        ;;
esac

# 没有文件路径，跳过
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# ============================================================================
# 文件存在性检查
# ============================================================================

# 如果文件不存在，放行（创建新文件是合法的）
if [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

# 允许对特定目录的文件覆写（内部管理文件）
case "$FILE_PATH" in
    */.claude/*|*/oh-my-claude/*|*/.oh-my-claude/*|*/.sisyphus/*)
        exit 0
        ;;
esac

# 检查是否已经 Read 过该文件
if [ -f "$READ_TRACKER" ]; then
    if grep -qxF "$FILE_PATH" "$READ_TRACKER" 2>/dev/null; then
        # 已 Read 过，放行
        exit 0
    fi
fi

# ============================================================================
# 阻止写入
# ============================================================================

printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Write Guard] 文件已存在: %s\\n\\n该文件已存在但尚未被 Read。为防止意外覆盖：\\n1. 使用 Edit 工具进行精确修改（推荐）\\n2. 或先用 Read 工具查看文件内容，确认后再使用 Write 覆写\\n\\n提示: Edit 工具更安全，因为它只修改指定的部分，不会影响其他内容。"}}\n' "$FILE_PATH"

exit 0
