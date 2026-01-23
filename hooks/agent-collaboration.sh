#!/usr/bin/env bash

# agent-collaboration.sh - 多 Agent 协作协议处理器
# 处理 @agent 调用语法，支持多 Agent 间的无缝协作

AGENT_COLLABORATION_LOG="$HOME/.oh-my-claude/logs/agent-collaboration.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$AGENT_COLLABORATION_LOG"
}

# 检测 @agent 调用
detect_agent_calls() {
    local input="$1"

    # 查找所有 @agent 模式
    # 支持: @zhuge, @luban 请..., @鲁班 等等
    local agent_calls=$(echo "$input" | grep -o '@[a-zA-Z\u4e00-\u9fa5]\+[[:space:]]*[^@]*' | sed 's/^@//')

    if [ -n "$agent_calls" ]; then
        log "检测到 Agent 调用: $agent_calls"

        # 解析每个调用
        echo "$agent_calls" | while read -r call; do
            if [ -n "$call" ]; then
                parse_agent_call "$call"
            fi
        done

        # 返回成功表示检测到调用
        return 0
    fi

    return 1
}

# 解析单个 Agent 调用
parse_agent_call() {
    local call="$1"

    # 分离 Agent 名称和任务描述
    # 支持中文和英文 Agent 名称
    local agent_name=$(echo "$call" | awk '{print $1}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    local task_desc=$(echo "$call" | cut -d' ' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

    # 标准化 Agent 名称映射
    case "$agent_name" in
        "诸葛"|"zhuge"|"诸葛亮")
            agent_name="zhuge"
            ;;
        "鲁班"|"luban"|"鲁班大师")
            agent_name="luban"
            ;;
        "悟空"|"wukong"|"孙悟空")
            agent_name="wukong"
            ;;
        "扁鹊"|"bianque"|"扁鹊医生")
            agent_name="bianque"
            ;;
        "墨子"|"mozi"|"墨翟")
            agent_name="mozi"
            ;;
        "孙子"|"sunzi"|"孙武")
            agent_name="sunzi"
            ;;
        "司马迁"|"simaqian"|"史记")
            agent_name="simaqian"
            ;;
        "郑和"|"zhenghe"|"下西洋")
            agent_name="zhenghe"
            ;;
        "张衡"|"zhangheng"|"地震仪")
            agent_name="zhangheng"
            ;;
        "李冰"|"libing"|"都江堰")
            agent_name="libing"
            ;;
        "老子"|"laozi"|"道德经")
            agent_name="laozi"
            ;;
        "包拯"|"baozheng"|"包青天")
            agent_name="baozheng"
            ;;
        "魏征"|"weizheng"|"魏徵")
            agent_name="weizheng"
            ;;
        "仓颉"|"cangjie"|"造字")
            agent_name="cangjie"
            ;;
        "李白"|"libai"|"诗仙")
            agent_name="libai"
            ;;
        "顾恺之"|"gukaizhi"|"画圣")
            agent_name="gukaizhi"
            ;;
        "嫦娥"|"change"|"月宫")
            agent_name="change"
            ;;
        "愚公"|"yugong"|"移山")
            agent_name="yugong"
            ;;
    esac

    log "解析 Agent 调用: $agent_name -> '$task_desc'"

    # 生成协作协议消息
    generate_collaboration_message "$agent_name" "$task_desc"
}

# 生成协作协议消息
generate_collaboration_message() {
    local agent_name="$1"
    local task_desc="$2"

    # 创建协作消息
    local collaboration_id="collab_$(date +%s)_${agent_name}"
    local message="---
【多 Agent 协作】Agent 调用
协作ID: $collaboration_id
目标Agent: $agent_name
任务描述: $task_desc
调用时间: $(date '+%Y-%m-%d %H:%M:%S')
状态: 待处理
---

请 @$agent_name 处理以下任务：
$task_desc

---
【协作协议】请按以下格式响应：
✅ 接受任务 - 开始处理
🔄 处理中 - [进度百分比] [当前步骤]
❌ 无法处理 - [原因说明]
✅ 任务完成 - [结果摘要]
---
"

    # 保存到协作日志
    echo "$message" >> "$AGENT_COLLABORATION_LOG"

    # 输出协作消息（这将被 Claude 看到）
    echo "$message"
}

# 主处理函数
main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 检测并处理 Agent 调用
    if detect_agent_calls "$input"; then
        log "Agent 协作协议已激活"
        exit 0
    else
        # 没有检测到 Agent 调用，正常退出
        exit 0
    fi
}

# 执行主函数
main "$@"