#!/usr/bin/env sh
# 关键词检测器 - UserPromptSubmit Hook
# 检测用户输入中的关键词并注入相应的上下文

# 依赖检查 - jq 是可选的，没有也能工作
has_jq=0
if command -v jq > /dev/null 2>&1; then
    has_jq=1
fi

# 读取 stdin 中的 JSON 数据
input=$(cat)

# 提取用户提示
if [ "$has_jq" -eq 1 ]; then
    prompt=$(echo "$input" | jq -r '.prompt // empty' 2>/dev/null)
else
    # 简单的字符串提取作为回退
    prompt=$(echo "$input" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
fi

if [ -z "$prompt" ]; then
    exit 0
fi

# 转换为小写进行匹配
prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

# 检测愚公移山关键词
if echo "$prompt_lower" | grep -qE '(ultra[-_]?work|ulw|移山|yi[-_]?shan|persist|愚公|yu[-_]?gong)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🏔️ **愚公移山模式已激活**\n\n检测到任务关键词，已自动启用持续执行模式：\n- ✅ 必须使用 TodoWrite 跟踪所有任务\n- ✅ 所有 TODO 完成前不能停止\n- ✅ 遇到困难要调整策略继续前进\n\n愚公精神：坚持必将成功！\n"
}
EOF
    exit 0
fi

# 检测诸葛关键词
if echo "$prompt_lower" | grep -qE '(架构|设计|策略|architecture|design|strategy|诸葛|zhuge|consult|规划|planning)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🎯 **诸葛顾问提示**\n\n检测到架构/策略相关问题，建议：\n- 使用 /zhuge 命令进入顾问模式\n- 诸葛擅长：架构设计、技术选型、策略制定\n"
}
EOF
    exit 0
fi

# 检测鲁班关键词
if echo "$prompt_lower" | grep -qE '(前端|组件|ui|frontend|component|craft|鲁班|luban|巧工|qiaogong)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🔧 **鲁班巧匠提示**\n\n检测到前端/组件开发相关问题，建议：\n- 使用 /luban 命令进入巧匠模式\n- 鲁班擅长：精密代码实现、UI 组件开发、代码质量优化\n"
}
EOF
    exit 0
fi

# 检测悟空关键词
if echo "$prompt_lower" | grep -qE '(搜索|查找|探索|search|find|explore|悟空|wukong|火眼|huoyan|定位|locate)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🔍 **悟空侦察提示**\n\n检测到代码探索相关问题，建议：\n- 使用 /wukong 命令进入侦察模式\n- 悟空擅长：快速定位代码、追踪依赖关系、火眼金睛识别问题\n"
}
EOF
    exit 0
fi

# 检测调试关键词 - 限制 fix 与 bug/error 之间的距离避免误触发
if echo "$prompt_lower" | grep -qE '(fix.{0,20}(bug|error)|debug|调试|报错|异常|exception|扁鹊|bianque|诊断|diagnose)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🩺 **扁鹊诊断提示**\n\n检测到错误/调试相关问题，建议：\n- 使用 /bianque 命令进入诊断模式\n- 扁鹊擅长：望闻问切，找到 bug 的真正病因\n"
}
EOF
    exit 0
fi

# 检测团队协作关键词
if echo "$prompt_lower" | grep -qE '(团队|协作|合作|teamwork|team[-_]?work|collaborate|协同|多人)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🤝 **团队协作提示**\n\n检测到协作相关需求，建议：\n- 使用 /team 命令启动团队协作模式\n- 愚公将作为主编排者，协调各专家共同完成任务\n- 支持调用：@wukong @zhuge @luban @bianque\n"
}
EOF
    exit 0
fi

# 无特殊关键词，正常继续
exit 0
