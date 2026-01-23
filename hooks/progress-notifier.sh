#!/usr/bin/env bash
# ============================================================================
# 进度通知器 - Progress Notifier (PostToolUse Hook)
# ============================================================================
# 在 TodoWrite 工具调用后自动显示简洁进度信息
# 解决问题：用户执行 yishan 时没有进度反馈
#
# 触发条件：PostToolUse 事件中 tool_name = "TodoWrite"
# 输出格式：📊 ████████░░░░░░░░░░░░░░░░░░░░░░ 25% (2/8) 🚀
#
# 优化：支持无 jq 时的降级方案
# ============================================================================

# 调试日志（默认关闭，需要时可通过环境变量启用）
DEBUG_LOG="${HOME}/.oh-my-claude/logs/progress-notifier-debug.log"
DEBUG_ENABLED="${OH_MY_CLAUDE_DEBUG:-false}"

debug_log() {
    if [ "$DEBUG_ENABLED" = "true" ]; then
        mkdir -p "$(dirname "$DEBUG_LOG")" 2>/dev/null
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$DEBUG_LOG"
    fi
}

debug_log "=== progress-notifier.sh started ==="

# 加载去重库（如果存在）
SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
debug_log "SCRIPT_DIR: $SCRIPT_DIR"
if [ -f "$SCRIPT_DIR/lib/message-dedup.sh" ]; then
    . "$SCRIPT_DIR/lib/message-dedup.sh"
    USE_DEDUP=1
else
    USE_DEDUP=0
fi

# 带去重的消息输出
safe_printf() {
    local message="$1"
    if [ "$USE_DEDUP" -eq 1 ]; then
        if should_show_message "$message"; then
            printf '%s\n' "$message"
        fi
    else
        printf '%s\n' "$message"
    fi
}

# 读取 stdin 中的 JSON 数据（带错误保护）
input=$(cat 2>/dev/null) || input=""

debug_log "Input received, length: ${#input}"
debug_log "Input content (first 200 chars): $(echo "$input" | head -c 200)"

# 如果输入为空，静默退出
if [ -z "$input" ]; then
    debug_log "Empty input, exiting"
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
# 无 jq 时的降级解析函数
# ============================================================================

# 简单的 JSON 值提取（纯 shell 实现，Windows 兼容）
extract_json_value() {
    local json="$1"
    local key="$2"
    # 使用 grep -E (扩展正则) + sed 组合，更好的跨平台兼容性
    echo "$json" | grep -oE "\"$key\" *: *\"[^\"]+\"" | head -1 | sed "s/\"$key\" *: *\"//;s/\"$//"
}

# 统计 JSON 数组中特定状态的数量（纯 shell 实现）
count_status() {
    local json="$1"
    local status="$2"
    # 计算 "status": "xxx" 出现的次数，使用 grep -E
    echo "$json" | grep -oE "\"status\" *: *\"$status\"" | wc -l | tr -d ' '
}

# 提取当前进行中的任务内容（纯 shell 实现）
extract_current_task() {
    local json="$1"
    # 查找 in_progress 状态附近的 content，使用 grep -E
    echo "$json" | grep -B2 '"status" *: *"in_progress"' | \
        grep -oE '"content" *: *"[^"]+"' | \
        sed 's/"content" *: *"//;s/"$//' | head -1
}

# ============================================================================
# 主逻辑
# ============================================================================

# 检查是否是 TodoWrite 工具调用
if [ "$HAS_JQ" -eq 1 ]; then
    tool_name=$(echo "$input" | jq -r '.tool_name // .toolName // empty' 2>/dev/null)
else
    tool_name=$(extract_json_value "$input" "tool_name")
    if [ -z "$tool_name" ]; then
        tool_name=$(extract_json_value "$input" "toolName")
    fi
fi

# 只处理 TodoWrite 工具调用
debug_log "Extracted tool_name: [$tool_name]"
if [ "$tool_name" != "TodoWrite" ]; then
    debug_log "Not TodoWrite, exiting"
    exit 0
fi
debug_log "Processing TodoWrite event"

# 提取 todo 统计信息
if [ "$HAS_JQ" -eq 1 ]; then
    # 使用 jq 精确解析
    completed=$(echo "$input" | jq -r '.tool_input.todos | map(select(.status == "completed")) | length' 2>/dev/null)
    in_progress=$(echo "$input" | jq -r '.tool_input.todos | map(select(.status == "in_progress")) | length' 2>/dev/null)
    pending=$(echo "$input" | jq -r '.tool_input.todos | map(select(.status == "pending")) | length' 2>/dev/null)
    current_task=$(echo "$input" | jq -r '.tool_input.todos | map(select(.status == "in_progress")) | .[0].content // "准备下一个任务"' 2>/dev/null)
else
    # 降级方案：使用纯 shell 解析
    completed=$(count_status "$input" "completed")
    in_progress=$(count_status "$input" "in_progress")
    pending=$(count_status "$input" "pending")
    current_task=$(extract_current_task "$input")

    # 如果无法提取当前任务，使用默认值
    if [ -z "$current_task" ]; then
        current_task="准备下一个任务"
    fi
fi

# 数值验证和默认值
completed=${completed:-0}
in_progress=${in_progress:-0}
pending=${pending:-0}

# 确保是数字
case "$completed" in
    ''|*[!0-9]*) completed=0 ;;
esac
case "$in_progress" in
    ''|*[!0-9]*) in_progress=0 ;;
esac
case "$pending" in
    ''|*[!0-9]*) pending=0 ;;
esac

# 计算总数和百分比
total=$((completed + in_progress + pending))

# 如果没有任务，静默退出
if [ "$total" -eq 0 ]; then
    exit 0
fi

percent=$((completed * 100 / total))

# 生成进度条 (30 字符宽)
bar_width=30
filled=$((bar_width * percent / 100))

bar=""
i=0
while [ $i -lt $filled ]; do
    bar="${bar}█"
    i=$((i + 1))
done
while [ $i -lt $bar_width ]; do
    bar="${bar}░"
    i=$((i + 1))
done

# 选择里程碑 emoji
if [ "$percent" -ge 100 ]; then
    emoji="🎉"
elif [ "$percent" -ge 75 ]; then
    emoji="🏃"
elif [ "$percent" -ge 50 ]; then
    emoji="🎯"
elif [ "$percent" -ge 25 ]; then
    emoji="💪"
else
    emoji="🚀"
fi

# 计算剩余任务数
remaining=$((pending + in_progress))

# 构建进度信息文本（用于显示）
progress_line1=$(printf '📊 %s %d%% (%d/%d) %s' "$bar" "$percent" "$completed" "$total" "$emoji")
progress_line2=$(printf '🔄 当前: %s | ⏳ 剩余: %d' "$current_task" "$remaining")

# 转义 JSON 特殊字符
escape_json() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g'
}

line1_escaped=$(escape_json "$progress_line1")
line2_escaped=$(escape_json "$progress_line2")

# 输出 JSON（使用 hookSpecificOutput 确保 Claude 能看到并展示给用户）
# systemMessage 用于直接显示给用户，additionalContext 用于 Claude 上下文
output=$(printf '{"systemMessage":"\\n%s\\n%s\\n","hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"【任务进度】%s | %s"}}' \
    "$line1_escaped" "$line2_escaped" "$line1_escaped" "$line2_escaped")

debug_log "Final output: $output"
printf '%s\n' "$output"

debug_log "=== progress-notifier.sh finished ==="
exit 0
