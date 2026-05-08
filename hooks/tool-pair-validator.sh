#!/usr/bin/env bash
# ============================================================================
# Tool Pair Validator - 工具对冲突检测
# 对标 oh-my-opencode tool-pair-validator
# ============================================================================
# 验证互斥工具没有被同时调用，维护上下文完整性
# ============================================================================

set -euo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || echo '')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo '')

CACHE_DIR="${OH_MY_CLAUDE_STATE_DIR:-$HOME/.oh-my-claude}/cache/tool-pairs"
mkdir -p "$CACHE_DIR"
TRACKER_FILE="$CACHE_DIR/recent-tools.json"

# 加载最近工具调用历史
RECENT="[]"
if [ -f "$TRACKER_FILE" ]; then
    RECENT=$(cat "$TRACKER_FILE" 2>/dev/null || echo '[]')
fi

# 记录当前工具调用
TIMESTAMP=$(date +%s)
if command -v jq >/dev/null 2>&1; then
    NEW_ENTRY=$(jq -n --arg tool "$TOOL_NAME" --arg file "$FILE_PATH" --arg ts "$TIMESTAMP" \
        '{tool: $tool, file: $file, timestamp: $ts | tonumber}')
    RECENT=$(echo "$RECENT" | jq --argjson entry "$NEW_ENTRY" \
        '. + [$entry] | .[-5:]')  # 保留最近5条
    echo "$RECENT" > "$TRACKER_FILE"
fi

# 冲突检测规则
WARNING=""

case "$TOOL_NAME" in
    Write|write)
        # 检查是否刚编辑过同一文件
        if echo "$RECENT" | jq -e --arg f "$FILE_PATH" \
            '.[] | select(.tool == "Edit" and .file == $f)' >/dev/null 2>&1; then
            WARNING="⚠️ 同一文件先 Edit 后 Write — 建议使用 Edit 替代 Write 来修改现有文件。"
        fi
        ;;
    Edit|edit)
        # 检查是否刚 Write 了同一文件
        if echo "$RECENT" | jq -e --arg f "$FILE_PATH" \
            '.[] | select(.tool == "Write" and .file == $f)' >/dev/null 2>&1; then
            WARNING="⚠️ 同一文件先 Write 后 Edit — 可能覆盖刚写入的内容。"
        fi
        ;;
    Bash|bash)
        # 检查是否在刚写/编辑的文件上执行
        BASH_CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo '')
        if echo "$RECENT" | jq -e '.[] | select(.tool == "Write" or .tool == "Edit") | .file' >/dev/null 2>&1; then
            LAST_FILE=$(echo "$RECENT" | jq -r '[.[] | select(.tool == "Write" or .tool == "Edit")] | .[-1].file // empty' 2>/dev/null || echo '')
            if [ -n "$LAST_FILE" ] && echo "$BASH_CMD" | grep -q "$LAST_FILE" 2>/dev/null; then
                WARNING="💡 刚修改了 $LAST_FILE — 确保执行前内容是最新的。"
            fi
        fi
        ;;
esac

if [ -n "$WARNING" ]; then
    printf '{"systemMessage":"\\n\\n%s\\n"}\n' "$WARNING"
fi

exit 0
