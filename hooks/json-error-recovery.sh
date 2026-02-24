#!/usr/bin/env bash
# ============================================================================
# JSON Error Recovery Hook
# ============================================================================
# 对标 oh-my-opencode 的 json-error-recovery hook
# 检测工具输出中的 JSON 解析错误，注入恢复指导
#
# Hook 类型: PostToolUse
# 触发条件: 除 Bash/Read/Glob/Grep/WebFetch 外的工具输出包含 JSON 错误
# 行为: 检测错误模式并提供具体修复建议
# ============================================================================

HOOK_NAME="json-error-recovery"

# 从 stdin 读取 JSON 数据
INPUT=$(cat 2>/dev/null) || INPUT=""
if [ -z "$INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$INPUT" | jq -r '(.tool_output // empty) | if type == "object" then tostring else . end' 2>/dev/null) || TOOL_OUTPUT=""
else
    TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$INPUT" | grep -o '"tool_output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_OUTPUT=""
fi

# 排除不需要检测的工具（这些工具的输出不是 JSON 格式）
case "$TOOL_NAME" in
    Bash|bash|Read|read|Glob|glob|Grep|grep|WebFetch|webfetch|mcp_webfetch|mcp_bash|mcp_read|mcp_glob|mcp_grep)
        exit 0
        ;;
esac

# 没有输出则跳过
if [ -z "$TOOL_OUTPUT" ]; then
    exit 0
fi

# ============================================================================
# JSON 错误模式检测
# ============================================================================

detect_json_parse_error() {
    local output="$1"
    
    # 模式1: 标准 JSON 解析错误
    if echo "$output" | grep -qiE '(JSON\.parse|SyntaxError.*JSON|Unexpected token|JSON parse error|invalid json|json.*syntax|trailing comma|duplicate key)'; then
        return 0
    fi
    
    # 模式2: 工具特定的 JSON 错误
    if echo "$output" | grep -qiE '(Expected.*but got|Unexpected end of JSON|Unterminated string|unclosed.*string|Bad control character)'; then
        return 0
    fi
    
    # 模式3: MCP 工具的 JSON 错误
    if echo "$output" | grep -qiE '(failed to parse|invalid.*response|malformed.*json|could not decode)'; then
        return 0
    fi
    
    return 1
}

# 检测具体的 JSON 错误类型
detect_specific_error() {
    local output="$1"
    # STRING 检查必须在 POSITION 之前（POSITION 的 'at (column|position)' 会误匹配 STRING 类错误）
    if echo "$output" | grep -qiE 'Unterminated string|unclosed.*string'; then
        echo "STRING"
        return
    fi
    if echo "$output" | grep -qiE 'trailing comma|Expected.*}.*got.*,'; then
        echo "TRAILING_COMMA"
        return
    fi
    if echo "$output" | grep -qiE 'Unexpected token.*position|at (column|position)|position [0-9]'; then
        echo "POSITION"
        return
    fi
    if echo "$output" | grep -qiE 'Unexpected end|unexpected eof|incomplete'; then
        echo "INCOMPLETE"
        return
    fi
    echo "GENERIC"
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 检测 JSON 解析错误
    if ! detect_json_parse_error "$TOOL_OUTPUT"; then
        exit 0
    fi
    
    # 判断具体错误类型
    ERROR_TYPE=$(detect_specific_error "$TOOL_OUTPUT")
    
    # 通用头部
    printf '\n[JSON Error Recovery] 检测到 JSON 解析错误 (工具: %s)\n\n' "$TOOL_NAME"
    
    case "$ERROR_TYPE" in
        POSITION)
            cat << 'EOF'
**错误类型**: 位置相关语法错误
**常见原因**: 多余的逗号、缺少引号、非法字符

**修复步骤**:
1. 找到错误提示中的位置 (position/column)
2. 检查该位置附近的 JSON 语法
3. 常见修复:
   - 属性名必须用双引号: `"key": "value"` (不是 `key: "value"`)
   - 字符串必须用双引号: `"value"` (不是 `'value'`)
   - 注意转义: `\"` for quotes, `\\` for backslash
EOF
            ;;
        STRING)
            cat << 'EOF'
**错误类型**: 未终止的字符串
**常见原因**: 字符串中包含未转义的引号或换行

**修复步骤**:
1. 检查字符串中的特殊字符
2. 转义所有双引号: `\"` 
3. 换行符使用 `\n` 而非真实换行
4. 反斜杠使用 `\\`
EOF
            ;;
        TRAILING_COMMA)
            cat << 'EOF'
**错误类型**: 尾部逗号
**常见原因**: JSON 标准不允许最后一个元素后有逗号

**修复**: 移除对象/数组最后一个元素后的逗号
```json
// ❌ 错误
{"a": 1, "b": 2,}

// ✅ 正确
{"a": 1, "b": 2}
```
EOF
            ;;
        INCOMPLETE)
            cat << 'EOF'
**错误类型**: JSON 不完整
**常见原因**: 输出被截断、缺少闭合括号

**修复步骤**:
1. 检查是否缺少 `}` 或 `]`
2. 确保所有开括号都有对应的闭括号
3. 如果输出被截断，重新生成完整内容
EOF
            ;;
        *)
            cat << 'EOF'
**修复建议**:
1. 使用 Read 工具查看相关文件的当前内容
2. 确保 JSON 格式正确（属性名双引号、无尾逗号、正确转义）
3. 如果是配置文件，考虑使用 JSONC 格式（支持注释）
4. 重试工具调用
EOF
            ;;
    esac
}

# 执行
main
