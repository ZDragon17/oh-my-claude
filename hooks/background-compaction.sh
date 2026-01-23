#!/usr/bin/env bash
# Background Compaction Hook
# 功能：检测后台任务数量并建议清理完成的任务
# 防止后台任务堆积导致资源浪费

# 环境变量
HOOK_NAME="background-compaction"
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"

# 配置
COMPACTION_THRESHOLD=5  # 触发压缩建议的后台任务数量阈值
STATE_FILE="${HOME}/.oh-my-claude/background-tasks.state"

# 确保状态目录存在
mkdir -p "$(dirname "$STATE_FILE")"

# ============================================================================
# 状态管理函数
# ============================================================================

# 初始化状态文件
init_state() {
    if [ ! -f "$STATE_FILE" ]; then
        echo '{"active_tasks": 0, "completed_tasks": 0, "last_compaction": ""}' > "$STATE_FILE"
    fi
}

# 读取活跃任务数
get_active_tasks() {
    if [ -f "$STATE_FILE" ]; then
        grep -o '"active_tasks": *[0-9]*' "$STATE_FILE" | grep -o '[0-9]*' || echo "0"
    else
        echo "0"
    fi
}

# 读取已完成任务数
get_completed_tasks() {
    if [ -f "$STATE_FILE" ]; then
        grep -o '"completed_tasks": *[0-9]*' "$STATE_FILE" | grep -o '[0-9]*' || echo "0"
    else
        echo "0"
    fi
}

# 更新活跃任务数
update_active_tasks() {
    local count="$1"
    if [ -f "$STATE_FILE" ]; then
        sed -i "s/\"active_tasks\": *[0-9]*/\"active_tasks\": $count/" "$STATE_FILE" 2>/dev/null || \
        sed -i '' "s/\"active_tasks\": *[0-9]*/\"active_tasks\": $count/" "$STATE_FILE" 2>/dev/null
    fi
}

# 更新已完成任务数
update_completed_tasks() {
    local count="$1"
    if [ -f "$STATE_FILE" ]; then
        sed -i "s/\"completed_tasks\": *[0-9]*/\"completed_tasks\": $count/" "$STATE_FILE" 2>/dev/null || \
        sed -i '' "s/\"completed_tasks\": *[0-9]*/\"completed_tasks\": $count/" "$STATE_FILE" 2>/dev/null
    fi
}

# 重置计数器
reset_counters() {
    update_active_tasks 0
    update_completed_tasks 0
    local timestamp=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
    sed -i "s/\"last_compaction\": *\"[^\"]*\"/\"last_compaction\": \"$timestamp\"/" "$STATE_FILE" 2>/dev/null || \
    sed -i '' "s/\"last_compaction\": *\"[^\"]*\"/\"last_compaction\": \"$timestamp\"/" "$STATE_FILE" 2>/dev/null
}

# ============================================================================
# 检测函数
# ============================================================================

# 检测后台任务启动
detect_task_start() {
    local tool="$1"
    local output="$2"
    
    if [ "$tool" = "background_task" ]; then
        if echo "$output" | grep -qiE '(task_id|started|launched)'; then
            return 0
        fi
    fi
    return 1
}

# 检测后台任务完成
detect_task_complete() {
    local tool="$1"
    local output="$2"
    
    if [ "$tool" = "background_output" ]; then
        if echo "$output" | grep -qiE '(completed|result|done|finished)'; then
            return 0
        fi
    fi
    return 1
}

# 检测取消所有任务
detect_cancel_all() {
    local tool="$1"
    local output="$2"
    
    if [ "$tool" = "background_cancel" ]; then
        if echo "$output" | grep -qiE '(all.*cancelled|cancelled.*all)'; then
            return 0
        fi
    fi
    return 1
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 初始化状态
    init_state
    
    # 获取当前状态
    local active=$(get_active_tasks)
    local completed=$(get_completed_tasks)
    
    # 检测后台任务启动
    if detect_task_start "$TOOL_NAME" "$TOOL_OUTPUT"; then
        active=$((active + 1))
        update_active_tasks "$active"
    fi
    
    # 检测后台任务完成
    if detect_task_complete "$TOOL_NAME" "$TOOL_OUTPUT"; then
        completed=$((completed + 1))
        if [ "$active" -gt 0 ]; then
            active=$((active - 1))
        fi
        update_active_tasks "$active"
        update_completed_tasks "$completed"
    fi
    
    # 检测取消所有
    if detect_cancel_all "$TOOL_NAME" "$TOOL_OUTPUT"; then
        reset_counters
        exit 0
    fi
    
    # 检查是否需要压缩建议
    local total=$((active + completed))
    if [ "$total" -ge "$COMPACTION_THRESHOLD" ]; then
        cat << EOF

[Background Compaction] High number of background tasks detected.

CURRENT STATE:
- Active tasks: $active
- Completed tasks: $completed
- Total: $total

RECOMMENDATION:
If you have finished collecting results from completed tasks, consider cleaning up:

\`\`\`
// Cancel all remaining background tasks
background_cancel(all=true)
\`\`\`

This will:
- Free up system resources
- Prevent task ID confusion
- Ensure clean workflow completion

NOTE: Always cancel background tasks before providing final answer to user.
EOF
        
        # 如果已完成任务超过阈值，强调建议
        if [ "$completed" -ge "$COMPACTION_THRESHOLD" ]; then
            echo ""
            echo "[IMPORTANT] You have $completed completed tasks. Consider calling background_cancel(all=true) now."
        fi
    fi
}

# 执行
main
