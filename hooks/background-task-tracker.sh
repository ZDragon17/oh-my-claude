#!/usr/bin/env bash
# ============================================================================
# Background Task Tracker Hook - 后台任务追踪器
# 对标 oh-my-opencode background task tracker
# ============================================================================
# 监控 task 工具调用结果，更新任务状态文件
# ============================================================================

set -euo pipefail

# Source provider adapter for CLI-agnostic paths and variables
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/provider-adapter.sh"

# 获取输入
INPUT=$(cat 2>/dev/null || echo '{}')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || echo '')
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty' 2>/dev/null || echo '')

# 仅在 task 工具完成时处理
if [ "$TOOL_NAME" != "task" ] && [ "$TOOL_NAME" != "Task" ]; then
    exit 0
fi

# 检查是否有正在运行的后台任务
STATE_DIR="$STATE_DIR/background-tasks/active"
REGISTER_DIR="$STATE_DIR/background-tasks/register"

if [ ! -d "$STATE_DIR" ] && [ ! -d "$REGISTER_DIR" ]; then
    exit 0
fi

# 从 tool_input 中提取可能的 task_id
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null || echo '')
SUBTASK_DESC=$(echo "$TOOL_INPUT" | jq -r '.description // empty' 2>/dev/null || echo '')

# 检测任务输出中的状态
if echo "$TOOL_OUTPUT" | grep -qi "error\|failed\|exception\|timeout" 2>/dev/null; then
    TASK_STATUS="error"
    ERROR_MSG=$(echo "$TOOL_OUTPUT" | grep -i "error\|exception" | head -3 | tr '\n' ' ')
elif echo "$TOOL_OUTPUT" | grep -qi "completed\|done\|finished\|success" 2>/dev/null; then
    TASK_STATUS="completed"
    ERROR_MSG=""
else
    # 无法确定状态，假设运行中
    exit 0
fi

# 尝试匹配已知的后台任务
CLI="$(get_cli_entry background)"
if command -v node &>/dev/null && [ -f "$CLI" ]; then
    SESSION_ID="${SESSION_ID:-unknown}"
    # 获取父会话的所有任务
    TASKS_JSON=$(node "$CLI" --action=parent-tasks --parent="$SESSION_ID" 2>/dev/null || echo '[]')

    # 尝试通过描述匹配
    MATCHED_TASK=$(echo "$TASKS_JSON" | jq -r --arg desc "$SUBTASK_DESC" '.[] | select(.status == "pending" or .status == "running") | select(.description | inside($desc) or ($desc | inside(.description))) | .id' 2>/dev/null | head -1 || echo '')

    if [ -n "$MATCHED_TASK" ]; then
        if [ "$TASK_STATUS" = "error" ]; then
            node "$CLI" \
                --action=schedule-retry --task-id="$MATCHED_TASK" 2>/dev/null || true
        else
            node "$CLI" \
                --action=update-status --task-id="$MATCHED_TASK" --status="completed" 2>/dev/null || true
        fi
    fi
fi

# 如果任务失败，注入重试建议
if [ "$TASK_STATUS" = "error" ]; then
    TRUNCATED_ERROR=$(echo "$ERROR_MSG" | cut -c1-200)
    cat << EOF
{
  "systemMessage": "\n\n⚠️ **后台任务执行出错**\n\n错误信息: \`${TRUNCATED_ERROR}...\`\n\n系统将根据退避策略自动重试。使用 \`background_status\` 查看所有后台任务状态。\n"
}
EOF
fi

exit 0
