#!/usr/bin/env bash
# ============================================================================
# Empty Message Sanitizer - 空消息清理器
# ============================================================================
# 对标 oh-my-opencode 的 empty-message-sanitizer hook
# 防止空消息或无效消息导致 API 错误
#
# Hook 类型: PreToolUse
# 功能：
# 1. 检测空的 chat 消息，防止 API 返回错误
# 2. 检测无效的工具输入参数
# 3. 清理和修复常见的空值问题
# ============================================================================

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
INPUT=$(cat 2>/dev/null) || INPUT=""
if [ -z "$INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
else
    TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=$(echo "$INPUT" | grep -o '"tool_input"[[:space:]]*:[[:space:]]*{[^}]*}' | head -1 2>/dev/null) || TOOL_INPUT=""
fi

# 如果没有工具名称，跳过
if [ -z "$TOOL_NAME" ]; then
    exit 0
fi

# ============================================================================
# 检测函数
# ============================================================================

# 检测空的消息内容
detect_empty_message() {
    local input="$1"
    
    # 检查输入是否为空或仅包含空白字符
    if [ -z "$input" ]; then
        return 0
    fi
    
    # 检查是否为空 JSON 对象
    local trimmed
    trimmed=$(echo "$input" | tr -d '[:space:]')
    if [ "$trimmed" = "{}" ] || [ "$trimmed" = "null" ] || [ "$trimmed" = '""' ]; then
        return 0
    fi
    
    return 1
}

# 检测空的文本内容参数
detect_empty_text_param() {
    local input="$1"
    local tool="$2"
    
    # 对于需要文本内容的工具，检查关键参数是否为空
    case "$tool" in
        Write|write)
            # Write 工具必须有 content 参数
            if echo "$input" | grep -qE '"content"\s*:\s*""'; then
                return 0
            fi
            ;;
        Edit|edit)
            # Edit 工具必须有 oldString 和 newString
            if echo "$input" | grep -qE '"oldString"\s*:\s*""'; then
                return 0
            fi
            if echo "$input" | grep -qE '"newString"\s*:\s*""'; then
                # newString 为空是合法的（删除内容），但 oldString 为空不合法
                :
            fi
            ;;
        Bash|bash)
            # Bash 工具必须有 command 参数
            if echo "$input" | grep -qE '"command"\s*:\s*""'; then
                return 0
            fi
            ;;
    esac
    
    return 1
}

# 检测空的文件路径
detect_empty_filepath() {
    local input="$1"
    
    if echo "$input" | grep -qE '"filePath"\s*:\s*""'; then
        return 0
    fi
    if echo "$input" | grep -qE '"file_path"\s*:\s*""'; then
        return 0
    fi
    if echo "$input" | grep -qE '"path"\s*:\s*""'; then
        return 0
    fi
    
    return 1
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 1. 检测完全空的输入
    if detect_empty_message "$TOOL_INPUT"; then
        printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Empty Message Sanitizer] 检测到空的工具输入参数。工具 %s 需要有效的输入参数才能执行。请提供必要的参数后重试。"}}\n' "$TOOL_NAME"
        exit 0
    fi
    
    # 2. 检测空的文本参数
    if detect_empty_text_param "$TOOL_INPUT" "$TOOL_NAME"; then
        case "$TOOL_NAME" in
            Write|write)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Empty Message Sanitizer] Write 工具的 content 参数为空。写入空内容可能会清除文件。如果确实需要清空文件，请明确确认。"}}\n'
                ;;
            Edit|edit)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Empty Message Sanitizer] Edit 工具的 oldString 参数为空。请先使用 Read 工具查看文件内容，然后提供准确的待替换文本。"}}\n'
                ;;
            Bash|bash)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Empty Message Sanitizer] Bash 工具的 command 参数为空。请提供要执行的命令。"}}\n'
                ;;
            *)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Empty Message Sanitizer] 工具 %s 的关键参数为空。请提供有效的参数。"}}\n' "$TOOL_NAME"
                ;;
        esac
        exit 0
    fi
    
    # 3. 检测空的文件路径
    if detect_empty_filepath "$TOOL_INPUT"; then
        printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Empty Message Sanitizer] 文件路径参数为空。请提供有效的文件路径。使用 Glob 工具可以帮助找到正确的文件路径。"}}\n'
        exit 0
    fi
    
    # 通过检测，允许继续
    exit 0
}

# 执行
main
