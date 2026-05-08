#!/usr/bin/env bash
# ============================================================================
# Hashline Edit Validator - 编辑前哈希验证
# 对标 oh-my-opencode hashline-edit-validator
# ============================================================================
# 在 Edit 工具执行前验证 old_string 中的 LINE#ID 哈希是否匹配当前文件内容
# ============================================================================

set -euo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || echo '')
if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "edit" ]; then
    exit 0
fi

# 提取 tool_input
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null || echo '{}')
OLD_STRING=$(echo "$TOOL_INPUT" | jq -r '.old_string // empty' 2>/dev/null || echo '')
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null || echo '')

# 如果没有 old_string 或 file_path，跳过
if [ -z "$OLD_STRING" ] || [ -z "$FILE_PATH" ]; then
    exit 0
fi

# 检查 old_string 是否包含 hashline 标记 (#X|)
if ! echo "$OLD_STRING" | grep -qP '^\d+#[^|]+\|' 2>/dev/null; then
    exit 0  # 没有 hashline 标记，不需要验证
fi

# 使用 TypeScript CLI 进行验证
if command -v node &>/dev/null && [ -f "$(get_cli_entry hashline 2>/dev/null || echo "$HOME/.claude/plugins/oh-my-claude/dist/lib/hashline/cli.js")" ]; then
    VALIDATION=$(node "$(get_cli_entry hashline 2>/dev/null || echo "$HOME/.claude/plugins/oh-my-claude/dist/lib/hashline/cli.js")" \
        --action=validate \
        --file="$FILE_PATH" \
        --old="$OLD_STRING" 2>/dev/null || echo '{"valid":true}')

    IS_VALID=$(echo "$VALIDATION" | jq -r '.valid // true' 2>/dev/null || echo true)

    if [ "$IS_VALID" != "true" ]; then
        MISMATCH_COUNT=$(echo "$VALIDATION" | jq -r '.mismatches | length' 2>/dev/null || echo 0)
        printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Hashline Validator] 编辑验证失败: 检测到 %s 处哈希不匹配。文件内容自上次读取后可能已被修改，请重新读取文件后再编辑。"}}\n' "$MISMATCH_COUNT"
        exit 0
    fi
fi

# 验证通过，允许继续
exit 0
