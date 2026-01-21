#!/usr/bin/env sh
# ============================================================================
# 操作历史记录 - Operation History Hook (PostToolUse)
# ============================================================================
# 记录工具操作历史，供 /retry 命令使用
#
# 触发条件：PostToolUse 事件
# 存储位置：~/.oh-my-claude/operation-history.json
# 保留数量：最近 20 条操作
# ============================================================================

# 配置
OH_MY_CLAUDE_DIR="$HOME/.oh-my-claude"
HISTORY_FILE="$OH_MY_CLAUDE_DIR/operation-history.json"
MAX_HISTORY=20

# 读取 stdin
input=$(cat 2>/dev/null) || input=""

# 如果输入为空，静默退出
if [ -z "$input" ]; then
    exit 0
fi

# ============================================================================
# 检测是否有 jq
# ============================================================================
HAS_JQ=0
if command -v jq > /dev/null 2>&1; then
    HAS_JQ=1
fi

# ============================================================================
# 提取操作信息
# ============================================================================

extract_operation_info() {
    local json="$1"

    if [ "$HAS_JQ" -eq 1 ]; then
        # 提取工具名称
        tool_name=$(echo "$json" | jq -r '.tool_name // .toolName // empty' 2>/dev/null)

        # 跳过某些只读工具
        case "$tool_name" in
            Read|Glob|Grep|WebFetch|WebSearch|TodoRead)
                # 只读工具，不记录
                return 1
                ;;
        esac

        # 提取工具输入
        tool_input=$(echo "$json" | jq -c '.tool_input // {}' 2>/dev/null)

        # 提取工具输出（简化版，只保留前 200 字符）
        tool_output=$(echo "$json" | jq -r '.tool_output // .output // empty' 2>/dev/null | head -c 200)

        # 检测是否有错误
        has_error=false
        if echo "$json" | jq -e '.error // .tool_error // empty | select(. != "")' > /dev/null 2>&1; then
            has_error=true
        elif echo "$tool_output" | grep -qiE 'error|failed|exception|❌'; then
            has_error=true
        fi

        # 输出提取的信息
        echo "$tool_name"
        echo "$tool_input"
        echo "$has_error"
        return 0
    else
        # 降级方案：使用 grep 提取
        tool_name=$(echo "$json" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | \
            sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | head -1)

        if [ -z "$tool_name" ]; then
            tool_name=$(echo "$json" | grep -o '"toolName"[[:space:]]*:[[:space:]]*"[^"]*"' | \
                sed 's/.*"toolName"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | head -1)
        fi

        # 跳过只读工具
        case "$tool_name" in
            Read|Glob|Grep|WebFetch|WebSearch|TodoRead)
                return 1
                ;;
        esac

        # 简单提取是否有错误
        has_error=false
        if echo "$json" | grep -qiE '"error"|"tool_error"|failed|exception'; then
            has_error=true
        fi

        echo "$tool_name"
        echo "{}"
        echo "$has_error"
        return 0
    fi
}

# ============================================================================
# 更新历史记录
# ============================================================================

update_history() {
    local tool_name="$1"
    local tool_input="$2"
    local has_error="$3"
    local timestamp=$(date +%s)
    local iso_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%d %H:%M:%S")

    mkdir -p "$OH_MY_CLAUDE_DIR" 2>/dev/null

    if [ "$HAS_JQ" -eq 1 ]; then
        # 创建新条目
        new_entry=$(jq -n \
            --arg tool "$tool_name" \
            --argjson input "$tool_input" \
            --argjson error "$has_error" \
            --arg ts "$iso_time" \
            --argjson epoch "$timestamp" \
            '{
                tool: $tool,
                input: $input,
                has_error: $error,
                timestamp: $ts,
                epoch: $epoch
            }')

        if [ -f "$HISTORY_FILE" ]; then
            # 添加新条目并保留最近 MAX_HISTORY 条
            jq --argjson entry "$new_entry" --argjson max "$MAX_HISTORY" \
                '[$entry] + . | .[0:$max]' "$HISTORY_FILE" > "$HISTORY_FILE.tmp" 2>/dev/null && \
            mv "$HISTORY_FILE.tmp" "$HISTORY_FILE"
        else
            # 创建新文件
            echo "[$new_entry]" > "$HISTORY_FILE"
        fi
    else
        # 降级方案：简单追加（格式化较差但可用）
        if [ -f "$HISTORY_FILE" ]; then
            # 在数组开头插入新条目
            sed -i "s/^\[/[{\"tool\":\"$tool_name\",\"has_error\":$has_error,\"timestamp\":\"$iso_time\"},/" "$HISTORY_FILE" 2>/dev/null || \
            echo "[{\"tool\":\"$tool_name\",\"has_error\":$has_error,\"timestamp\":\"$iso_time\"}]" > "$HISTORY_FILE"
        else
            echo "[{\"tool\":\"$tool_name\",\"has_error\":$has_error,\"timestamp\":\"$iso_time\"}]" > "$HISTORY_FILE"
        fi
    fi
}

# ============================================================================
# 主逻辑
# ============================================================================

# 提取操作信息
info=$(extract_operation_info "$input")
if [ $? -eq 0 ] && [ -n "$info" ]; then
    tool_name=$(echo "$info" | sed -n '1p')
    tool_input=$(echo "$info" | sed -n '2p')
    has_error=$(echo "$info" | sed -n '3p')

    if [ -n "$tool_name" ]; then
        update_history "$tool_name" "$tool_input" "$has_error"
    fi
fi

exit 0
