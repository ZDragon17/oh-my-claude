#!/usr/bin/env bash
# ============================================================================
# Background Notification Hook - 后台任务完成通知
# ============================================================================
# 检测后台任务状态变化并提供通知
#
# 功能：
# 1. 检测后台任务完成
# 2. 提供结果摘要
# 3. 建议下一步操作
# ============================================================================

# 状态目录
BACKGROUND_STATE_DIR=".claude/background-tasks"

# 如果状态目录不存在，无需处理
if [ ! -d "$BACKGROUND_STATE_DIR" ]; then
    exit 0
fi

# 计数器
completed_count=0
running_count=0
failed_count=0
completed_tasks=""

# 遍历状态文件
for state_file in "$BACKGROUND_STATE_DIR"/*.state 2>/dev/null; do
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

# 如果有完成的任务，发送通知
if [ "$completed_count" -gt 0 ]; then
    notification_msg=""
    
    if [ "$completed_count" -eq 1 ]; then
        notification_msg="1 个后台任务已完成"
    else
        notification_msg="${completed_count} 个后台任务已完成"
    fi
    
    # 添加运行中的任务信息
    if [ "$running_count" -gt 0 ]; then
        notification_msg="${notification_msg}，${running_count} 个仍在运行"
    fi
    
    # 添加失败的任务信息
    if [ "$failed_count" -gt 0 ]; then
        notification_msg="${notification_msg}，${failed_count} 个失败"
    fi
    
    printf '{"systemMessage":"\\n\\n🔔 **后台任务通知**\\n\\n%s\\n\\n**已完成的任务**:\\n%s\\n\\n使用 `background_output(task_id=\\"xxx\\")` 获取结果。\\n"}\n' "$notification_msg" "$completed_tasks"
    exit 0
fi

# 如果有失败的任务
if [ "$failed_count" -gt 0 ]; then
    printf '{"systemMessage":"\\n\\n⚠️ **后台任务警告**\\n\\n%d 个后台任务失败。使用 `background_output` 查看详情。\\n"}\n' "$failed_count"
    exit 0
fi

# 无需通知
exit 0
