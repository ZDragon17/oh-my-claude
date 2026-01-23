#!/usr/bin/env bash
# ============================================================================
# Thinking Block Validator - 思维块验证器
# ============================================================================
# 检测和验证 extended thinking 功能的使用
#
# 功能：
# 1. 检测 thinking block 错误
# 2. 验证 thinking 输出格式
# 3. 提供错误恢复建议
# ============================================================================

# 获取工具调用结果
tool_result="${CLAUDE_TOOL_RESULT:-}"
tool_name="${CLAUDE_TOOL_NAME:-}"

# 如果没有结果，直接退出
if [ -z "$tool_result" ]; then
    exit 0
fi

# 错误检测标志
has_thinking_error=false
error_type=""
error_details=""
suggestions=""

# 1. 检测 extended thinking 相关错误
if echo "$tool_result" | grep -qiE '(extended.*thinking|thinking.*block|budget.*exceeded)'; then
    # 检测思考预算超出
    if echo "$tool_result" | grep -qiE '(budget.*exceeded|token.*limit.*thinking|thinking.*too.*long)'; then
        has_thinking_error=true
        error_type="思考预算超出"
        error_details="Extended thinking 功能的 token 预算已用尽"
        suggestions="1. 将复杂问题分解为更小的步骤\\n2. 减少单次请求的复杂度\\n3. 使用 TODO 列表逐步完成任务"
    fi
    
    # 检测思考块格式错误
    if echo "$tool_result" | grep -qiE '(invalid.*thinking|malformed.*thinking|thinking.*parse.*error)'; then
        has_thinking_error=true
        error_type="思考块格式错误"
        error_details="思考块输出格式不正确"
        suggestions="1. 确保输出符合预期格式\\n2. 避免在思考过程中使用特殊字符\\n3. 简化推理步骤"
    fi
    
    # 检测思考超时
    if echo "$tool_result" | grep -qiE '(thinking.*timeout|thinking.*timed.*out)'; then
        has_thinking_error=true
        error_type="思考超时"
        error_details="思考过程超出时间限制"
        suggestions="1. 简化问题复杂度\\n2. 将任务分解为多个步骤\\n3. 使用缓存的中间结果"
    fi
fi

# 2. 检测 streaming 相关错误
if echo "$tool_result" | grep -qiE '(stream.*error|streaming.*failed|chunk.*error)'; then
    has_thinking_error=true
    error_type="流式输出错误"
    error_details="响应流式输出过程中发生错误"
    suggestions="1. 检查网络连接稳定性\\n2. 减少响应内容长度\\n3. 尝试重新发送请求"
fi

# 3. 检测 API 响应截断
if echo "$tool_result" | grep -qiE '(response.*truncated|output.*cut.*off|incomplete.*response)'; then
    has_thinking_error=true
    error_type="响应截断"
    error_details="API 响应被截断，输出不完整"
    suggestions="1. 请求更简洁的输出格式\\n2. 分批获取长内容\\n3. 使用分页或摘要"
fi

# 4. 检测模型容量错误
if echo "$tool_result" | grep -qiE '(context.*length.*exceeded|max.*tokens.*exceeded|input.*too.*long)'; then
    has_thinking_error=true
    error_type="上下文长度超出"
    error_details="输入内容超出模型上下文窗口限制"
    suggestions="1. 使用 /compact 压缩对话历史\\n2. 减少单次请求的输入量\\n3. 分批处理大型文件"
fi

# 如果检测到错误，发送警告
if [ "$has_thinking_error" = "true" ]; then
    printf '{"systemMessage":"\\n\\n[THINKING BLOCK VALIDATION]\\n\\n**检测到 %s**\\n\\n**问题**: %s\\n\\n**修复建议**:\\n%s\\n\\n请根据建议调整后重试。\\n"}\n' "$error_type" "$error_details" "$suggestions"
    exit 0
fi

# 无错误检测到
exit 0
