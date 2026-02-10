#!/bin/bash

# ============================================================
# Tmux Agent Visualizer - 后台 Agent 可视化 Hook
# ============================================================
#
# 功能：
# - 检测后台 Task 启动
# - 在 tmux 中自动创建窗格显示 Agent 输出
# - Agent 完成后可选自动清理窗格
#
# Hook 类型: PostToolUse
# 超时: 3000ms
# Windows 兼容: 否
# ============================================================

# 配置
HOOK_NAME="Tmux Visualizer"
LOG_DIR="$HOME/.oh-my-claude/logs"
LOG_FILE="$LOG_DIR/tmux-visualizer.log"
PANE_TRACKER="$HOME/.oh-my-claude/tmux-panes.json"

# 是否启用（可通过环境变量控制）
TMUX_VIS_ENABLED="${OH_MY_CLAUDE_TMUX_VIS:-true}"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$HOOK_NAME] $1" >> "$LOG_FILE"
}

# 检查是否在 tmux 中
check_tmux() {
    if [ -z "$TMUX" ]; then
        return 1
    fi
    return 0
}

# 解析 output_file 路径
parse_output_file() {
    local output="$1"
    # 匹配 output_file 路径模式
    echo "$output" | grep -oE 'output_file["\s:]+([^"]+\.txt|/[^\s"]+)' | head -1 | sed 's/.*[:"\s]*//' | tr -d '"'
}

# 解析 task_id
parse_task_id() {
    local output="$1"
    echo "$output" | grep -oE 'task_id["\s:]+([^"]+)' | head -1 | sed 's/.*[:"\s]*//' | tr -d '"'
}

# 解析 Agent 类型
parse_agent_type() {
    local output="$1"
    echo "$output" | grep -oE 'subagent_type["\s:]+([^"]+)' | head -1 | sed 's/.*[:"\s]*//' | tr -d '"'
}

# 创建 tmux 窗格
create_tmux_pane() {
    local output_file="$1"
    local task_id="$2"
    local agent_type="$3"

    if [ -z "$output_file" ]; then
        log "No output file found, skipping pane creation"
        return 1
    fi

    # 设置窗格标题
    local pane_title="Agent: ${agent_type:-unknown}"

    # 创建新窗格（水平分割）
    local new_pane
    new_pane=$(tmux split-window -h -P -F "#{pane_id}" "tail -f '$output_file' 2>/dev/null || echo 'Waiting for output...' && sleep 30")

    if [ -n "$new_pane" ]; then
        # 设置窗格标题
        tmux select-pane -t "$new_pane" -T "$pane_title" 2>/dev/null

        # 调整布局
        tmux select-layout main-vertical 2>/dev/null

        # 记录窗格信息（用于后续清理）
        echo "{\"pane_id\": \"$new_pane\", \"task_id\": \"$task_id\", \"agent_type\": \"$agent_type\", \"output_file\": \"$output_file\", \"created_at\": \"$(date -Iseconds)\"}" >> "$PANE_TRACKER"

        log "Created pane $new_pane for $agent_type (task: $task_id)"

        # 返回主窗格
        tmux select-pane -t :.0 2>/dev/null

        return 0
    else
        log "Failed to create tmux pane"
        return 1
    fi
}

# 检测后台任务完成并清理窗格
cleanup_completed_panes() {
    if [ ! -f "$PANE_TRACKER" ]; then
        return 0
    fi

    # 读取跟踪文件并检查每个任务
    while IFS= read -r line; do
        local pane_id task_id output_file
        pane_id=$(echo "$line" | grep -oE '"pane_id":\s*"[^"]+"' | sed 's/.*"pane_id":\s*"//' | tr -d '"')
        task_id=$(echo "$line" | grep -oE '"task_id":\s*"[^"]+"' | sed 's/.*"task_id":\s*"//' | tr -d '"')
        output_file=$(echo "$line" | grep -oE '"output_file":\s*"[^"]+"' | sed 's/.*"output_file":\s*"//' | tr -d '"')

        # 检查输出文件是否包含完成标记
        if [ -f "$output_file" ]; then
            if grep -q "Task completed\|Agent completed\|✅\|Done" "$output_file" 2>/dev/null; then
                # 任务完成，关闭窗格
                if tmux kill-pane -t "$pane_id" 2>/dev/null; then
                    log "Cleaned up completed pane $pane_id (task: $task_id)"
                fi
            fi
        fi
    done < "$PANE_TRACKER"

    # 清理已关闭窗格的记录
    if [ -f "$PANE_TRACKER" ]; then
        local temp_file="${PANE_TRACKER}.tmp"
        > "$temp_file"
        while IFS= read -r line; do
            local pane_id
            pane_id=$(echo "$line" | grep -oE '"pane_id":\s*"[^"]+"' | sed 's/.*"pane_id":\s*"//' | tr -d '"')
            if tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^${pane_id}$"; then
                echo "$line" >> "$temp_file"
            fi
        done < "$PANE_TRACKER"
        mv "$temp_file" "$PANE_TRACKER"
    fi
}

# ============================================================
# 主逻辑
# ============================================================

# 检查是否启用
if [ "$TMUX_VIS_ENABLED" != "true" ]; then
    exit 0
fi

# 检查是否在 tmux 中
if ! check_tmux; then
    exit 0
fi

# 读取 stdin JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_stdin_input=$(cat 2>/dev/null) || _stdin_input=""
if [ -z "$_stdin_input" ]; then
    exit 0
fi

# 解析 tool_output 字段
if command -v jq > /dev/null 2>&1; then
    tool_output=$(echo "$_stdin_input" | jq -r '.tool_output // empty' 2>/dev/null) || tool_output=""
else
    tool_output=$(echo "$_stdin_input" | grep -o '"tool_output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || tool_output=""
fi

# 如果 tool_output 为空，尝试使用整个 stdin（兼容旧格式）
if [ -z "$tool_output" ]; then
    tool_output="$_stdin_input"
fi

# 检测是否是后台任务启动
if echo "$tool_output" | grep -qE 'run_in_background.*true|background.*task.*started'; then
    log "Detected background task start"

    # 解析任务信息
    output_file=$(parse_output_file "$tool_output")
    task_id=$(parse_task_id "$tool_output")
    agent_type=$(parse_agent_type "$tool_output")

    log "Parsed: output_file=$output_file, task_id=$task_id, agent_type=$agent_type"

    # 创建可视化窗格
    if create_tmux_pane "$output_file" "$task_id" "$agent_type"; then
        # 输出用户提示
        echo ""
        echo "---"
        echo "[$HOOK_NAME] 🖥️ Tmux 可视化"
        echo "---"
        echo ""
        echo "已在右侧窗格显示 Agent 输出。"
        echo "• 切换窗格: Ctrl+b o"
        echo "• 关闭窗格: Ctrl+b x"
        echo "• 最大化: Ctrl+b z"
        echo ""
    fi
fi

# 尝试清理已完成的窗格
cleanup_completed_panes

exit 0
