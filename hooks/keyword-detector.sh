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
  "systemMessage": "\n\n🤝 **团队协作提示**\n\n检测到协作相关需求，建议：\n- 使用 /team 命令启动团队协作模式\n- 愚公将作为主编排者，协调各专家共同完成任务\n- 支持调用：@wukong @zhuge @luban @bianque @mozi @sunzi\n"
}
EOF
    exit 0
fi

# 检测安全关键词
if echo "$prompt_lower" | grep -qE '(安全|漏洞|注入|security|vulnerab|injection|墨子|mozi|audit|审计|xss|csrf|防御)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🛡️ **墨子安全提示**\n\n检测到安全相关问题，建议：\n- 使用 /mozi 命令进入安全审计模式\n- 墨子擅长：漏洞检测、防御性编程、安全加固\n"
}
EOF
    exit 0
fi

# 检测性能关键词
if echo "$prompt_lower" | grep -qE '(性能|优化|慢|performance|optimize|slow|孙子|sunzi|perf|瓶颈|bottleneck|缓存|cache)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n⚔️ **孙子性能提示**\n\n检测到性能相关问题，建议：\n- 使用 /sunzi 命令进入性能优化模式\n- 孙子擅长：性能分析、瓶颈定位、优化策略\n"
}
EOF
    exit 0
fi

# 检测文档关键词
if echo "$prompt_lower" | grep -qE '(文档|注释|记录|document|comment|readme|changelog|history|司马迁|simaqian|史记|shiji)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n📜 **司马迁文档提示**\n\n检测到文档相关需求，建议：\n- 使用 /simaqian 命令进入文档模式\n- 司马迁擅长：技术文档撰写、变更记录、代码注释\n"
}
EOF
    exit 0
fi

# 检测 API 集成关键词
if echo "$prompt_lower" | grep -qE '(api|接口|集成|对接|integrate|webhook|sdk|rest|graphql|grpc|郑和|zhenghe|西洋|第三方)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n⛵ **郑和 API 提示**\n\n检测到 API/集成相关需求，建议：\n- 使用 /zhenghe 命令进入 API 模式\n- 郑和擅长：API 集成、SDK 封装、外部服务对接\n"
}
EOF
    exit 0
fi

# 检测监控关键词
if echo "$prompt_lower" | grep -qE '(监控|日志|告警|追踪|monitor|logging|alert|trace|metrics|prometheus|grafana|张衡|zhangheng|可观测|observab)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🔭 **张衡监控提示**\n\n检测到监控/可观测性相关需求，建议：\n- 使用 /zhangheng 命令进入监控模式\n- 张衡擅长：系统监控、日志分析、链路追踪、告警配置\n"
}
EOF
    exit 0
fi

# 检测 DevOps 关键词
if echo "$prompt_lower" | grep -qE '(devops|ci/cd|cicd|部署|运维|docker|kubernetes|k8s|容器|terraform|基础设施|流水线|pipeline|李冰|libing|都江堰)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🌊 **李冰 DevOps 提示**\n\n检测到 DevOps/基础设施相关需求，建议：\n- 使用 /libing 命令进入 DevOps 模式\n- 李冰擅长：CI/CD 流水线、容器化部署、基础设施即代码\n"
}
EOF
    exit 0
fi

# 检测代码简化关键词
if echo "$prompt_lower" | grep -qE '(简洁|简化|重构|refactor|kiss|yagni|dry|clean[-_]?code|代码异味|code[-_]?smell|老子|laozi|道德经|至简|simplify)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n☯️ **老子简洁之道提示**\n\n检测到代码简化/重构相关需求，建议：\n- 使用 /laozi 命令进入简洁之道模式\n- 老子擅长：代码简化、Clean Code、KISS/YAGNI/DRY 原则、重构优化\n"
}
EOF
    exit 0
fi

# 无特殊关键词，正常继续
exit 0
