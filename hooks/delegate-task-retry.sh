#!/usr/bin/env bash
# ============================================================================
# Delegate Task Retry Hook - 任务委派自动重试
# ============================================================================
# 检测 Task 工具调用失败并提供自动修复建议
#
# 常见错误模式：
# 1. run_in_background 缺失
# 2. skills 参数缺失
# 3. category OR subagent_type 互斥问题
# 4. 未知类别或 Agent
# 5. 空 Agent 名称
# ============================================================================

# 依赖检查
has_jq=0
if command -v jq > /dev/null 2>&1; then
    has_jq=1
fi

# 读取 stdin 中的 JSON 数据
input=$(cat 2>/dev/null) || input=""

# 空输入检查
if [ -z "$input" ]; then
    exit 0
fi

# 提取工具输出
if [ "$has_jq" -eq 1 ]; then
    tool_name=$(echo "$input" | jq -r '.tool_name // empty' 2>/dev/null) || tool_name=""
    tool_output=$(echo "$input" | jq -r '(.tool_output // empty) | if type == "object" then tostring else . end' 2>/dev/null) || tool_output=""
else
    # 简单的字符串提取
    tool_name=$(echo "$input" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || tool_name=""
    tool_output=$(echo "$input" | grep -o '"tool_output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || tool_output=""
fi

# 只处理 Task 相关工具
case "$tool_name" in
    task|Task|delegate_task|background_task)
        ;;
    *)
        exit 0
        ;;
esac

# 转小写
output_lower=$(echo "$tool_output" | tr '[:upper:]' '[:lower:]' 2>/dev/null) || output_lower="$tool_output"

# 检测错误模式
fix_hint=""

# 1. run_in_background 缺失
if echo "$output_lower" | grep -qE '(run_in_background|background.*required|must.*specify.*background)'; then
    fix_hint="添加 run_in_background 参数。使用 run_in_background=true 进行异步执行，或 run_in_background=false 进行同步等待。"
fi

# 2. skills 参数缺失
if echo "$output_lower" | grep -qE '(skills.*required|missing.*skills|skills.*parameter)'; then
    fix_hint="添加 skills=[] 参数（如果不需要技能，使用空数组）。"
fi

# 3. category OR subagent_type 互斥
if echo "$output_lower" | grep -qE '(category.*or.*subagent|either.*category.*or|mutual.*exclus)'; then
    fix_hint="只提供 category 或 subagent_type 之一，不能同时使用。例如：category='general' 或 subagent_type='explore'。"
fi

# 4. 未知类别
if echo "$output_lower" | grep -qE '(unknown.*category|invalid.*category|category.*not.*found)'; then
    fix_hint="使用有效的类别。可用类别包括：general, quick, frontend, backend, etc。查看错误消息中的可用列表。"
fi

# 5. 未知 Agent
if echo "$output_lower" | grep -qE '(unknown.*agent|invalid.*agent|agent.*not.*found)'; then
    fix_hint="使用有效的 Agent 类型。可用类型：explore, librarian, oracle, general, frontend-ui-ux-engineer, document-writer, debugger, test-engineer, code-reviewer。"
fi

# 6. 空 Agent 名称
if echo "$output_lower" | grep -qE '(agent.*empty|empty.*agent|agent.*cannot.*be.*empty)'; then
    fix_hint="提供非空的 subagent_type 值。"
fi

# 7. 提示词太短或无效
if echo "$output_lower" | grep -qE '(prompt.*too.*short|prompt.*required|invalid.*prompt)'; then
    fix_hint="提供详细的任务提示词。好的提示词应该包含：具体任务、期望结果、上下文信息。"
fi

# 如果检测到错误，返回修复建议
if [ -n "$fix_hint" ]; then
    # 转义特殊字符用于 JSON
    fix_hint_escaped=$(echo "$fix_hint" | sed 's/"/\\"/g' | sed 's/\\/\\\\/g')
    
    printf '{"systemMessage":"\\n\\n⚠️ **任务委派错误检测**\\n\\n检测到 Task 工具调用失败。\\n\\n**修复建议**: %s\\n\\n**正确格式示例**:\\n```\\nTask(\\n  subagent_type=\\"explore\\",\\n  description=\\"简短描述\\",\\n  prompt=\\"详细任务描述...\\",\\n  run_in_background=true\\n)\\n```\\n"}\n' "$fix_hint_escaped"
    exit 0
fi

# 无错误检测到
exit 0
