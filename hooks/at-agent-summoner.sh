#!/usr/bin/env sh
# ============================================================================
# @Agent 召唤器 - At Agent Summoner Hook (UserPromptSubmit)
# ============================================================================
# 解决问题：用户希望用 @悟空 @诸葛 等语法直接召唤 Agent
#
# 功能：
# 1. 检测 @agent 语法（中英文名称都支持）
# 2. 直接注入对应 Agent 的系统提示
# 3. 支持多 Agent 同时召唤（用于协作任务）
#
# 触发条件：用户消息中包含 @agentName 语法
# ============================================================================

# 读取 stdin
input=$(cat 2>/dev/null) || input=""

if [ -z "$input" ]; then
    exit 0
fi

# 提取用户提示
if command -v jq > /dev/null 2>&1; then
    prompt=$(echo "$input" | jq -r '.prompt // empty' 2>/dev/null) || prompt=""
else
    prompt=$(echo "$input" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' 2>/dev/null) || prompt=""
fi

if [ -z "$prompt" ]; then
    exit 0
fi

# ============================================================================
# Agent 映射表
# ============================================================================
# 格式: 检测模式 | Agent中文名 | Agent命令 | 专长描述

detect_agents() {
    local text="$1"
    local agents_found=""

    # 悟空 - 代码侦察
    if echo "$text" | grep -qE '@(悟空|wukong|WuKong|探索|火眼)'; then
        agents_found="${agents_found}wukong|悟空|代码侦察专家|探索代码库，追踪依赖，定位问题\n"
    fi

    # 诸葛 - 架构顾问
    if echo "$text" | grep -qE '@(诸葛|zhuge|ZhuGe|军师|顾问)'; then
        agents_found="${agents_found}zhuge|诸葛|战略顾问|架构设计，技术选型，策略制定\n"
    fi

    # 鲁班 - 精工巧匠
    if echo "$text" | grep -qE '@(鲁班|luban|LuBan|巧工|工匠)'; then
        agents_found="${agents_found}luban|鲁班|精工巧匠|精密代码实现，组件开发\n"
    fi

    # 扁鹊 - Bug诊断
    if echo "$text" | grep -qE '@(扁鹊|bianque|BianQue|医师|诊断)'; then
        agents_found="${agents_found}bianque|扁鹊|诊断专家|望闻问切，精准定位 Bug\n"
    fi

    # 司马迁 - 文档史官
    if echo "$text" | grep -qE '@(司马迁|simaqian|SimaQian|史官|史记)'; then
        agents_found="${agents_found}simaqian|司马迁|文档史官|技术文档，变更记录\n"
    fi

    # 顾恺之 - 界面美学
    if echo "$text" | grep -qE '@(顾恺之|gukaizhi|GuKaiZhi|画师|美学)'; then
        agents_found="${agents_found}gukaizhi|顾恺之|界面美学师|UI/UX 设计，视觉优化\n"
    fi

    # 墨子 - 安全审计
    if echo "$text" | grep -qE '@(墨子|mozi|MoZi|安全|防御)'; then
        agents_found="${agents_found}mozi|墨子|安全专家|安全审计，防御编程\n"
    fi

    # 孙子 - 性能优化
    if echo "$text" | grep -qE '@(孙子|sunzi|SunZi|兵法|性能)'; then
        agents_found="${agents_found}sunzi|孙子|性能专家|性能分析，优化策略\n"
    fi

    # 包拯 - 测试专家
    if echo "$text" | grep -qE '@(包拯|baozheng|BaoZheng|青天|测试)'; then
        agents_found="${agents_found}baozheng|包拯|测试专家|单元测试，TDD，质量保证\n"
    fi

    # 魏征 - 代码审查
    if echo "$text" | grep -qE '@(魏征|weizheng|WeiZheng|谏臣|审查)'; then
        agents_found="${agents_found}weizheng|魏征|代码审查官|代码审查，规范检查\n"
    fi

    # 老子 - 代码简化
    if echo "$text" | grep -qE '@(老子|laozi|LaoZi|道德经|简化)'; then
        agents_found="${agents_found}laozi|老子|简洁大师|代码简化，Clean Code\n"
    fi

    # 仓颉 - 数据库
    if echo "$text" | grep -qE '@(仓颉|cangjie|CangJie|造字|数据库)'; then
        agents_found="${agents_found}cangjie|仓颉|数据库专家|数据建模，SQL 优化\n"
    fi

    # 李白 - 需求分析
    if echo "$text" | grep -qE '@(李白|libai|LiBai|诗人|需求)'; then
        agents_found="${agents_found}libai|李白|需求炼金师|需求分析，用户故事\n"
    fi

    # 郑和 - API集成
    if echo "$text" | grep -qE '@(郑和|zhenghe|ZhengHe|航海|api|API)'; then
        agents_found="${agents_found}zhenghe|郑和|API 远航家|API 集成，SDK 封装\n"
    fi

    # 张衡 - 监控观测
    if echo "$text" | grep -qE '@(张衡|zhangheng|ZhangHeng|天文|监控)'; then
        agents_found="${agents_found}zhangheng|张衡|监控观测家|系统监控，日志分析\n"
    fi

    # 李冰 - DevOps
    if echo "$text" | grep -qE '@(李冰|libing|LiBing|都江堰|devops|DevOps)'; then
        agents_found="${agents_found}libing|李冰|DevOps 水利家|CI/CD，容器化部署\n"
    fi

    # 嫦娥 - 云原生
    if echo "$text" | grep -qE '@(嫦娥|change|ChangE|月宫|serverless|Serverless)'; then
        agents_found="${agents_found}change|嫦娥|云端仙子|云原生，Serverless\n"
    fi

    # 离娄 - 多模态分析
    if echo "$text" | grep -qE '@(离娄|lilou|LiLou|明察|vision|图像)'; then
        agents_found="${agents_found}lilou|离娄|多模态洞察师|图像识别，PDF解析\n"
    fi

    # 刘伯温 - 计划审查
    if echo "$text" | grep -qE '@(刘伯温|liubowen|LiuBoWen|军师|计划|审查计划)'; then
        agents_found="${agents_found}liubowen|刘伯温|计划审查师|TODO审核，可行性评估\n"
    fi

    # 愚公 - 持续执行
    if echo "$text" | grep -qE '@(愚公|yugong|YuGong|移山)'; then
        agents_found="${agents_found}yugong|愚公|持续执行者|愚公移山，持续完成任务\n"
    fi

    echo "$agents_found"
}

# ============================================================================
# 主逻辑
# ============================================================================

# 检测是否包含 @ 符号（快速过滤）
if ! echo "$prompt" | grep -q '@'; then
    exit 0
fi

# 检测被召唤的 Agents
agents=$(detect_agents "$prompt")

if [ -z "$agents" ]; then
    exit 0
fi

# 统计召唤的 Agent 数量
agent_count=$(echo "$agents" | grep -c '|')

# 构建输出消息
if [ "$agent_count" -eq 1 ]; then
    # 单 Agent 召唤
    agent_cmd=$(echo "$agents" | head -1 | cut -d'|' -f1)
    agent_name=$(echo "$agents" | head -1 | cut -d'|' -f2)
    agent_role=$(echo "$agents" | head -1 | cut -d'|' -f3)
    agent_desc=$(echo "$agents" | head -1 | cut -d'|' -f4)

    cat << EOF
{
  "systemMessage": "\n\n🎭 **${agent_name}已响应召唤！**\n\n角色：${agent_role}\n专长：${agent_desc}\n\n<agent-mode agent=\"${agent_cmd}\">\n请以${agent_name}（${agent_role}）的身份处理用户的请求。\n运用你的专业技能：${agent_desc}\n\n如需其他专家协助，可建议用户使用 @agent 召唤。\n</agent-mode>\n"
}
EOF
else
    # 多 Agent 协作
    agent_list=""
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            name=$(echo "$line" | cut -d'|' -f2)
            role=$(echo "$line" | cut -d'|' -f3)
            agent_list="${agent_list}\n   • ${name}（${role}）"
        fi
    done << EOF_AGENTS
$(echo "$agents" | head -5)
EOF_AGENTS

    cat << EOF
{
  "systemMessage": "\n\n🤝 **多 Agent 协作模式启动！**\n\n召唤的专家：${agent_list}\n\n<team-mode>\n愚公将作为主编排者，协调以上专家共同完成任务。\n\n协作流程：\n1. 分析任务，确定各专家职责\n2. 并行/串行调度各专家\n3. 整合结果，完成任务\n\n💡 提示：使用 /team 可以获得更完整的团队协作体验\n</team-mode>\n"
}
EOF
fi

exit 0
