#!/usr/bin/env bash
# ============================================================================
# Background Notification Hook - 后台任务完成通知
# 对标 oh-my-opencode background-notification
# ============================================================================
# 使用 BackgroundManager CLI 获取状态
# ============================================================================

set -euo pipefail

# Source provider adapter for CLI-agnostic paths and variables
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/provider-adapter.sh"

SESSION_ID="${SESSION_ID:-unknown}"
CLI="$(get_cli_entry background)"

# 优先使用 TypeScript CLI
if command -v node &>/dev/null && [ -f "$CLI" ]; then
    STATS=$(node "$CLI" --action=stats 2>/dev/null || echo '{}')

    PENDING=$(echo "$STATS" | jq -r '.pending // 0' 2>/dev/null || echo 0)
    RUNNING=$(echo "$STATS" | jq -r '.running // 0' 2>/dev/null || echo 0)
    COMPLETED=$(echo "$STATS" | jq -r '.completed // 0' 2>/dev/null || echo 0)
    ERROR=$(echo "$STATS" | jq -r '.error // 0' 2>/dev/null || echo 0)

    # 获取父会话的任务
    SESSION_ID="${SESSION_ID:-unknown}"
    TASKS_JSON=$(node "$CLI" --action=parent-tasks --parent="$SESSION_ID" 2>/dev/null || echo '[]')

    # 提取近期完成的任务
    RECENT_COMPLETED=$(echo "$TASKS_JSON" | jq -r '[.[] | select(.status == "completed")] | sort_by(.completedAt) | reverse | .[0:3] | .[] | "- \(.id): \(.description)"' 2>/dev/null || echo '')

    # 提取失败的任务
    RECENT_ERRORS=$(echo "$TASKS_JSON" | jq -r '[.[] | select(.status == "error")] | .[0:3] | .[] | "- \(.id): \(.lastError // "unknown error")"' 2>/dev/null || echo '')

    # 无需通知的情况
    if [ "$COMPLETED" -eq 0 ] && [ "$ERROR" -eq 0 ] && [ "$RUNNING" -eq 0 ]; then
        exit 0
    fi

    # 构建通知消息
    NOTIFICATION_PARTS=""

    if [ "$COMPLETED" -gt 0 ] || [ "$RUNNING" -gt 0 ]; then
        NOTIFICATION_PARTS="📊 后台任务: "
        if [ "$COMPLETED" -gt 0 ]; then
            NOTIFICATION_PARTS="${NOTIFICATION_PARTS}${COMPLETED} 已完成"
        fi
        if [ "$RUNNING" -gt 0 ]; then
            [ -n "$NOTIFICATION_PARTS" ] && NOTIFICATION_PARTS="${NOTIFICATION_PARTS}, "
            NOTIFICATION_PARTS="${NOTIFICATION_PARTS}${RUNNING} 运行中"
        fi
        if [ "$PENDING" -gt 0 ]; then
            NOTIFICATION_PARTS="${NOTIFICATION_PARTS}, ${PENDING} 排队中"
        fi
    fi

    if [ "$ERROR" -gt 0 ]; then
        NOTIFICATION_PARTS="${NOTIFICATION_PARTS}\n⚠️ ${ERROR} 个任务失败"
    fi

    # 如果有已完成任务，展示详情
    COMPLETED_DETAILS=""
    if [ -n "$RECENT_COMPLETED" ]; then
        COMPLETED_DETAILS="\n\n**已完成任务**:\n${RECENT_COMPLETED}"
    fi

    ERROR_DETAILS=""
    if [ -n "$RECENT_ERRORS" ]; then
        ERROR_DETAILS="\n\n**失败任务**:\n${RECENT_ERRORS}"
    fi

    printf '{"systemMessage":"\\n\\n%s%s%s\\n\\n使用 \`%s\` 查看所有后台任务。\\n"}\n' \
        "$NOTIFICATION_PARTS" "$COMPLETED_DETAILS" "$ERROR_DETAILS" "$TOOL_BG_STATUS"
    exit 0
fi

# 回退到基于文件的方式（兼容旧版）
BACKGROUND_STATE_DIR=".claude/background-tasks"
if [ ! -d "$BACKGROUND_STATE_DIR" ]; then
    exit 0
fi

completed_count=0
running_count=0
failed_count=0
completed_tasks=""

for state_file in "$BACKGROUND_STATE_DIR"/*.state; do
    [ -f "$state_file" ] || continue

    task_id=$(basename "$state_file" .state)
    status=$(grep '^status:' "$state_file" 2>/dev/null | sed 's/status:[[:space:]]*//' | tr -d ' ')
    description=$(grep '^description:' "$state_file" 2>/dev/null | sed 's/description:[[:space:]]*//')

    case "$status" in
        completed|done|finished)
            completed_count=$((completed_count + 1))
            if [ -n "$completed_tasks" ]; then
                completed_tasks="${completed_tasks}\\n- ${task_id}: ${description}"
            else
                completed_tasks="- ${task_id}: ${description}"
            fi
            ;;
        running|pending|in_progress)
            running_count=$((running_count + 1))
            ;;
        failed|error)
            failed_count=$((failed_count + 1))
            ;;
    esac
done

if [ "$completed_count" -gt 0 ]; then
    notification_msg=""
    if [ "$completed_count" -eq 1 ]; then
        notification_msg="1 个后台任务已完成"
    else
        notification_msg="${completed_count} 个后台任务已完成"
    fi
    if [ "$running_count" -gt 0 ]; then
        notification_msg="${notification_msg}，${running_count} 个仍在运行"
    fi
    if [ "$failed_count" -gt 0 ]; then
        notification_msg="${notification_msg}，${failed_count} 个失败"
    fi
    printf '{"systemMessage":"\\n\\n🔔 **后台任务通知**\\n\\n%s\\n\\n**已完成的任务**:\\n%s\\n\\n使用 \`%s(task_id=\\"xxx\\")\` 获取结果。\\n"}\n' "$notification_msg" "$completed_tasks" "$TOOL_BG_OUTPUT"
    exit 0
fi

if [ "$failed_count" -gt 0 ]; then
    printf '{"systemMessage":"\\n\\n⚠️ **后台任务警告**\\n\\n%d 个后台任务失败。使用 \`background_output\` 查看详情。\\n"}\n' "$failed_count"
    exit 0
fi

exit 0
