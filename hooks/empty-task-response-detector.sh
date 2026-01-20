#!/usr/bin/env sh
# ============================================================================
# Empty Task Response Detector - 空任务响应检测器
# ============================================================================
# 检测委派任务返回空响应或无效响应的情况
#
# 功能：
# 1. 检测任务响应是否为空
# 2. 检测响应是否有效（非模板、非占位符）
# 3. 提供重试或调整建议
# ============================================================================

# 获取工具调用结果（如果有）
tool_result="${CLAUDE_TOOL_RESULT:-}"
tool_name="${CLAUDE_TOOL_NAME:-}"

# 只处理 Task 工具的结果
case "$tool_name" in
    *[Tt]ask*|*agent*|*delegate*)
        ;;
    *)
        exit 0
        ;;
esac

# 如果没有结果，退出
if [ -z "$tool_result" ]; then
    exit 0
fi

# 检测空响应或无效响应
is_empty=false
is_placeholder=false
is_error=false

# 检测完全空响应
if [ -z "$(echo "$tool_result" | tr -d '[:space:]')" ]; then
    is_empty=true
fi

# 检测占位符响应
placeholder_patterns="TODO|PLACEHOLDER|TBD|FIXME|NOT_IMPLEMENTED|待实现|占位符|未实现"
if echo "$tool_result" | grep -qiE "^[[:space:]]*(${placeholder_patterns})[[:space:]]*$"; then
    is_placeholder=true
fi

# 检测过短响应（可能是无效的）
result_length=$(echo "$tool_result" | wc -c)
if [ "$result_length" -lt 20 ]; then
    # 检查是否只是确认消息
    if ! echo "$tool_result" | grep -qiE '(done|complete|success|ok|finished|完成|成功)'; then
        is_empty=true
    fi
fi

# 检测错误响应
if echo "$tool_result" | grep -qiE '(error|failed|exception|timeout|拒绝|错误|失败|超时)'; then
    is_error=true
fi

# 检测模板响应（Agent 没有实际执行）
template_patterns="I will|I'll|Let me|Here's what|I would|我将|让我|以下是"
if echo "$tool_result" | grep -qiE "^[[:space:]]*(${template_patterns})" && [ "$result_length" -lt 100 ]; then
    # 可能是 Agent 只给出了意图但没有执行
    is_placeholder=true
fi

# 如果检测到问题，发送警告
if [ "$is_empty" = "true" ] || [ "$is_placeholder" = "true" ] || [ "$is_error" = "true" ]; then
    warning_type=""
    suggestion=""
    
    if [ "$is_empty" = "true" ]; then
        warning_type="空响应"
        suggestion="任务可能未正确执行。建议：
1. 检查任务描述是否足够清晰
2. 确认 Agent 类型是否适合此任务
3. 尝试将任务分解为更小的步骤"
    elif [ "$is_placeholder" = "true" ]; then
        warning_type="占位符响应"
        suggestion="Agent 可能只返回了模板而未实际执行。建议：
1. 在任务 prompt 中明确要求执行而非计划
2. 添加具体的完成标准
3. 要求返回实际执行结果"
    elif [ "$is_error" = "true" ]; then
        warning_type="错误响应"
        suggestion="任务执行遇到错误。建议：
1. 检查错误详情并修复根本原因
2. 使用 delegate-task-retry 重试
3. 考虑调整任务范围或方法"
    fi
    
    printf '{"systemMessage":"\\n\\n[SYSTEM WARNING - EMPTY TASK RESPONSE]\\n\\n**检测到 %s**\\n\\n任务工具: %s\\n响应长度: %d 字符\\n\\n**%s**\\n\\n请验证任务结果并决定是否需要重试。\\n"}\n' "$warning_type" "$tool_name" "$result_length" "$suggestion"
fi

exit 0
