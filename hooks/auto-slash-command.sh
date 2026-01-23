#!/usr/bin/env bash
# ============================================================================
# 自动斜杠命令 - Auto Slash Command Hook (UserPromptSubmit)
# ============================================================================
# 解决问题：用户不知道有哪些专业 Agent 可用
#
# 功能：
# 1. 智能检测用户意图
# 2. 推荐最匹配的专业 Agent
# 3. 提供简洁的使用建议
#
# 触发条件：UserPromptSubmit 中检测到特定意图关键词
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

# 转换为小写
prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]' 2>/dev/null) || prompt_lower="$prompt"

# ============================================================================
# 快速检查 - 跳过已经是斜杠命令的输入
# ============================================================================
if echo "$prompt" | grep -qE '^\s*/[a-zA-Z]'; then
    exit 0
fi

# 跳过已经使用 @agent 语法的输入（由 at-agent-summoner.sh 处理）
if echo "$prompt" | grep -qE '@[a-zA-Z\x{4e00}-\x{9fff}]+'; then
    exit 0
fi

# ============================================================================
# 智能意图识别
# ============================================================================

# 返回格式: command|agent_name|description
detect_intent() {
    local text="$1"

    # 调试诊断 - 高优先级匹配
    if echo "$text" | grep -qiE '(debug|fix.{0,10}(bug|error)|报错|调试|诊断|异常|exception|出错|崩溃|不工作|问题|error)'; then
        echo "/bianque|扁鹊|Bug 诊断和修复专家"
        return 0
    fi

    # 测试相关
    if echo "$text" | grep -qiE '(测试|单元测试|集成测试|test|tdd|jest|vitest|pytest|覆盖率|coverage|断言|assert)'; then
        echo "/baozheng|包拯|测试专家，TDD 实践者"
        return 0
    fi

    # 代码审查
    if echo "$text" | grep -qiE '(review|审查|code.?review|cr|检查代码|pr|pull.?request|merge)'; then
        echo "/weizheng|魏征|代码审查官，规范守护者"
        return 0
    fi

    # 安全审计
    if echo "$text" | grep -qiE '(安全|漏洞|注入|security|vulnerab|injection|xss|csrf|sql.?inject|渗透|攻击|防护)'; then
        echo "/mozi|墨子|安全审计专家"
        return 0
    fi

    # 性能优化
    if echo "$text" | grep -qiE '(性能|优化|慢|卡顿|performance|optimize|slow|瓶颈|bottleneck|缓存|cache|内存|memory|cpu)'; then
        echo "/sunzi|孙子|性能优化策略大师"
        return 0
    fi

    # 架构设计
    if echo "$text" | grep -qiE '(架构|设计|规划|architecture|design|strategy|方案|技术选型|系统设计|模块划分)'; then
        echo "/zhuge|诸葛|架构设计战略顾问"
        return 0
    fi

    # 代码探索
    if echo "$text" | grep -qiE '(搜索|查找|探索|search|find|explore|定位|locate|在哪|哪里|找到|代码在|文件在)'; then
        echo "/wukong|悟空|代码侦察快速探索"
        return 0
    fi

    # 代码实现/开发
    if echo "$text" | grep -qiE '(实现|开发|编写|implement|develop|write|code|创建|新增|添加功能|写一个)'; then
        echo "/luban|鲁班|精工巧匠代码实现"
        return 0
    fi

    # 代码简化/重构
    if echo "$text" | grep -qiE '(简化|重构|refactor|简洁|clean|kiss|yagni|dry|代码异味|smell|冗余|复杂)'; then
        echo "/laozi|老子|代码简化大师"
        return 0
    fi

    # 数据库相关
    if echo "$text" | grep -qiE '(数据库|database|sql|表设计|索引|index|migration|mysql|postgresql|mongodb|redis|schema|查询优化)'; then
        echo "/cangjie|仓颉|数据库设计专家"
        return 0
    fi

    # 文档编写
    if echo "$text" | grep -qiE '(文档|注释|记录|document|comment|readme|changelog|history|说明|手册|wiki)'; then
        echo "/simaqian|司马迁|文档编写史官"
        return 0
    fi

    # API 集成
    if echo "$text" | grep -qiE '(api|接口|集成|对接|integrate|webhook|sdk|rest|graphql|grpc|第三方|调用外部)'; then
        echo "/zhenghe|郑和|API 集成远航家"
        return 0
    fi

    # 监控日志
    if echo "$text" | grep -qiE '(监控|日志|告警|追踪|monitor|logging|alert|trace|metrics|prometheus|grafana|可观测|observab)'; then
        echo "/zhangheng|张衡|系统监控观测家"
        return 0
    fi

    # DevOps
    if echo "$text" | grep -qiE '(devops|ci/cd|cicd|部署|运维|docker|kubernetes|k8s|容器|terraform|基础设施|流水线|pipeline|发布)'; then
        echo "/libing|李冰|DevOps 水利专家"
        return 0
    fi

    # UI/UX 设计
    if echo "$text" | grep -qiE '(ui|ux|界面|美学|用户体验|视觉|交互|配色|layout|布局|样式|css|组件设计|前端)'; then
        echo "/gukaizhi|顾恺之|界面美学设计师"
        return 0
    fi

    # 需求分析
    if echo "$text" | grep -qiE '(需求|用户故事|prd|功能规划|requirement|user.?story|feature|产品|功能点)'; then
        echo "/libai|李白|需求分析炼金师"
        return 0
    fi

    # 云原生
    if echo "$text" | grep -qiE '(云原生|cloud|serverless|lambda|函数计算|aws|azure|gcp|阿里云|腾讯云)'; then
        echo "/change|嫦娥|云端服务仙子"
        return 0
    fi

    # 图像/多模态
    if echo "$text" | grep -qiE '(图片|图像|截图|image|picture|screenshot|pdf|视觉|识别图)'; then
        echo "/lilou|离娄|多模态洞察师"
        return 0
    fi

    # 长时间/复杂任务
    if echo "$text" | grep -qiE '(完整|全部|所有|彻底|从头到尾|完全|entire|complete|full|comprehensive|持续|坚持)'; then
        echo "/yishan|愚公移山|持续执行直到完成"
        return 0
    fi

    # 无匹配
    return 1
}

# ============================================================================
# 主逻辑
# ============================================================================

result=$(detect_intent "$prompt_lower")

if [ -n "$result" ]; then
    cmd=$(echo "$result" | cut -d'|' -f1)
    agent=$(echo "$result" | cut -d'|' -f2)
    desc=$(echo "$result" | cut -d'|' -f3)

    cat << EOF
{
  "systemMessage": "\n\n💡 **智能推荐**\n\n检测到你可能需要：**${agent}**（${desc}）\n\n快捷方式：\n• 输入 \`${cmd}\` 启用专家模式\n• 输入 \`@${agent}\` 直接召唤\n\n📝 继续当前对话也完全可以，这只是一个建议。\n"
}
EOF
fi

exit 0
