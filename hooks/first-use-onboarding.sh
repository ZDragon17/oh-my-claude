#!/usr/bin/env sh
# ============================================================================
# 渐进式引导检测 - Progressive Onboarding Hook (UserPromptSubmit)
# ============================================================================
# 为新用户提供渐进式引导，在前 5 次会话中逐步展示功能
# 解决问题：一次性引导信息过多，新用户无法消化
#
# 渐进式策略：
# - 第 1 次：欢迎 + 基础介绍
# - 第 2 次：常用 Agent 推荐
# - 第 3 次：愚公移山模式介绍
# - 第 4 次：错误处理命令介绍
# - 第 5 次：高级功能提示
# - 之后：仅在用户困惑时提供帮助
#
# 输出：根据阶段显示不同的引导提示
# ============================================================================

# 文件路径
OH_MY_CLAUDE_DIR="$HOME/.oh-my-claude"
ONBOARDING_COUNTER="$OH_MY_CLAUDE_DIR/onboarding-count"
ONBOARDING_COMPLETED="$OH_MY_CLAUDE_DIR/onboarding-completed"

# 加载去重库（如果存在）
SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
if [ -f "$SCRIPT_DIR/lib/message-dedup.sh" ]; then
    . "$SCRIPT_DIR/lib/message-dedup.sh"
    USE_DEDUP=1
else
    USE_DEDUP=0
fi

# 带去重的消息输出
safe_printf() {
    local message="$1"
    if [ "$USE_DEDUP" -eq 1 ]; then
        if should_show_message "$message"; then
            printf '{"systemMessage":"%s"}\n' "$message"
        fi
    else
        printf '{"systemMessage":"%s"}\n' "$message"
    fi
}

# 读取 stdin
input=$(cat 2>/dev/null) || input=""

# 尝试提取用户提示（兼容多种格式）
if command -v jq > /dev/null 2>&1 && [ -n "$input" ]; then
    user_prompt=$(echo "$input" | jq -r '.prompt // .user_prompt // .message // empty' 2>/dev/null)
else
    user_prompt=""
fi

# 如果无法从 JSON 获取，使用环境变量
if [ -z "$user_prompt" ]; then
    user_prompt="${CLAUDE_PROMPT:-}"
fi

# 如果仍然为空，静默退出
if [ -z "$user_prompt" ]; then
    exit 0
fi

# ============================================================================
# 核心函数
# ============================================================================

# 函数：获取当前引导阶段 (1-5，超过5返回6表示完成)
get_onboarding_stage() {
    mkdir -p "$OH_MY_CLAUDE_DIR" 2>/dev/null
    if [ -f "$ONBOARDING_COMPLETED" ]; then
        echo "6"
        return
    fi
    if [ -f "$ONBOARDING_COUNTER" ]; then
        count=$(cat "$ONBOARDING_COUNTER" 2>/dev/null | tr -d '[:space:]')
        case "$count" in
            ''|*[!0-9]*) count=0 ;;
        esac
        echo "$count"
    else
        echo "0"
    fi
}

# 函数：增加引导计数
increment_onboarding_count() {
    mkdir -p "$OH_MY_CLAUDE_DIR" 2>/dev/null
    current=$(get_onboarding_stage)
    new_count=$((current + 1))
    echo "$new_count" > "$ONBOARDING_COUNTER" 2>/dev/null

    # 如果达到第 5 阶段，标记为完成
    if [ "$new_count" -ge 5 ]; then
        date +"%Y-%m-%d %H:%M:%S" > "$ONBOARDING_COMPLETED" 2>/dev/null
    fi
}

# 函数：检查是否已完成所有引导
check_onboarding_completed() {
    [ -f "$ONBOARDING_COMPLETED" ]
}

# 函数：快速完成引导（用户已熟练）
mark_onboarding_completed() {
    mkdir -p "$OH_MY_CLAUDE_DIR" 2>/dev/null
    echo "5" > "$ONBOARDING_COUNTER" 2>/dev/null
    date +"%Y-%m-%d %H:%M:%S" > "$ONBOARDING_COMPLETED" 2>/dev/null
}

# 函数：检查是否是斜杠命令
is_slash_command() {
    echo "$1" | grep -qE '^\s*/'
}

# 函数：检查是否表达困惑
is_confused() {
    local prompt_lower=$(echo "$1" | tr '[:upper:]' '[:lower:]')

    # 中文困惑表达
    echo "$prompt_lower" | grep -qE '怎么用|从哪开始|不知道|怎么开始|如何使用|该用哪个|用什么命令|帮我选择|有哪些命令|命令是什么'
    if [ $? -eq 0 ]; then
        return 0
    fi

    # 英文困惑表达
    echo "$prompt_lower" | grep -qiE 'how to use|where to start|don.*t know|what command|which agent|help me|getting started'
    if [ $? -eq 0 ]; then
        return 0
    fi

    return 1
}

# 函数：检查是否是特定意图（可以推荐 Agent）
detect_specific_intent() {
    local prompt_lower=$(echo "$1" | tr '[:upper:]' '[:lower:]')

    # UI/样式相关 → 顾恺之
    if echo "$prompt_lower" | grep -qE '样式|ui|界面|css|颜色|布局|设计|美化|style'; then
        echo "gukaizhi|UI/UX 设计|/gukaizhi"
        return 0
    fi

    # Bug/错误相关 → 扁鹊
    if echo "$prompt_lower" | grep -qE 'bug|错误|报错|fix|修复|error|exception|crash|问题'; then
        echo "bianque|Bug 诊断|/bianque"
        return 0
    fi

    # 测试相关 → 包拯
    if echo "$prompt_lower" | grep -qE '测试|test|单元测试|unit test|tdd'; then
        echo "baozheng|测试专家|/baozheng"
        return 0
    fi

    # 架构/设计相关 → 诸葛
    if echo "$prompt_lower" | grep -qE '架构|设计|规划|strategy|architecture|design'; then
        echo "zhuge|架构设计|/zhuge"
        return 0
    fi

    # 探索/查找相关 → 悟空
    if echo "$prompt_lower" | grep -qE '找|搜索|探索|find|search|locate|where'; then
        echo "wukong|代码探索|/wukong"
        return 0
    fi

    # 实现/开发相关 → 鲁班
    if echo "$prompt_lower" | grep -qE '实现|开发|编写|implement|create|build|write'; then
        echo "luban|代码实现|/luban"
        return 0
    fi

    # 大任务 → 愚公
    if echo "$prompt_lower" | grep -qE '完整|全部|整个|完成|一直|持续|all|complete|entire|persist'; then
        echo "yishan|持续执行|/yishan"
        return 0
    fi

    return 1
}

# ============================================================================
# 渐进式引导消息
# ============================================================================

# 第 1 阶段：欢迎 + 基础介绍
show_stage_1() {
    printf '{"systemMessage":"\\n👋 欢迎使用 oh-my-claude！\\n\\n💡 我集成了 20 个专业 Agent，可以智能匹配你的任务。\\n直接描述你想做什么，我会自动推荐合适的专家。\\n\\n📚 随时输入 /help 查看所有命令\\n"}\n'
}

# 第 2 阶段：常用 Agent 推荐
show_stage_2() {
    printf '{"systemMessage":"\\n💡 oh-my-claude 小贴士 [2/5]\\n\\n🔧 常用专家快捷方式:\\n• /bianque - Bug 诊断专家\\n• /luban - 代码实现专家\\n• /wukong - 代码探索侦察\\n• /zhuge - 架构设计顾问\\n\\n直接描述任务也会自动匹配专家！\\n"}\n'
}

# 第 3 阶段：愚公移山模式
show_stage_3() {
    printf '{"systemMessage":"\\n💡 oh-my-claude 小贴士 [3/5]\\n\\n🏔️ 愚公移山模式（持续执行）:\\n/yishan [任务描述]\\n\\n自动规划 TODO，持续执行直到完成。\\n适合复杂的多步骤任务！\\n\\n暂停: /pause | 恢复: /yishan-resume\\n"}\n'
}

# 第 4 阶段：错误处理
show_stage_4() {
    printf '{"systemMessage":"\\n💡 oh-my-claude 小贴士 [4/5]\\n\\n⚠️ 遇到问题时的命令:\\n• /retry - 智能重试失败操作\\n• /skip - 跳过当前步骤\\n• /rollback - 回滚到上一状态\\n\\n卡住时输入 /bianque 诊断问题\\n"}\n'
}

# 第 5 阶段：高级功能
show_stage_5() {
    printf '{"systemMessage":"\\n💡 oh-my-claude 小贴士 [5/5]\\n\\n🚀 高级功能:\\n• /team - 多 Agent 协作模式\\n• /interrupt - 紧急任务插入\\n• /progress - 查看任务进度面板\\n\\n🎉 引导完成！随时输入 /help 查看所有功能。\\n"}\n'
}

# ============================================================================
# 主逻辑
# ============================================================================

# 获取当前阶段
stage=$(get_onboarding_stage)

# 如果是斜杠命令，用户可能已经熟悉了
if is_slash_command "$user_prompt"; then
    # 使用 3 次以上斜杠命令，认为已熟练
    if [ "$stage" -ge 3 ]; then
        mark_onboarding_completed
    else
        increment_onboarding_count
    fi
    exit 0
fi

# 如果用户明确表达困惑，始终显示帮助
if is_confused "$user_prompt"; then
    printf '{"systemMessage":"\\n👋 看起来你需要帮助！\\n\\n🚀 快速开始:\\n• 说\\"改样式/UI\\" → 顾恺之（UI专家）\\n• 说\\"修bug\\" → 扁鹊（诊断专家）\\n• 说\\"实现XX功能\\" → 愚公移山模式\\n\\n📚 /help 查看命令 | /start 详细引导\\n"}\n'
    exit 0
fi

# 检测特定意图并推荐 Agent
intent_result=$(detect_specific_intent "$user_prompt")
if [ -n "$intent_result" ]; then
    agent_name=$(echo "$intent_result" | cut -d'|' -f1)
    agent_desc=$(echo "$intent_result" | cut -d'|' -f2)
    agent_cmd=$(echo "$intent_result" | cut -d'|' -f3)

    # 根据阶段提供不同详细程度的推荐
    if [ "$stage" -lt 3 ]; then
        # 新用户：详细推荐
        printf '{"systemMessage":"\\n💡 检测到 %s 相关任务\\n推荐: %s (%s)\\n快捷方式: %s [描述]\\n"}\n' \
            "$agent_desc" "$agent_name" "$agent_desc" "$agent_cmd"
        increment_onboarding_count
    elif [ "$stage" -lt 6 ]; then
        # 中级用户：简洁提示
        printf '{"systemMessage":"💡 推荐: %s"}\n' "$agent_cmd"
        increment_onboarding_count
    fi
    # 熟练用户（stage >= 6）：静默，不打扰
    exit 0
fi

# 渐进式显示引导（每阶段只在首次进入时显示）
case "$stage" in
    0)
        show_stage_1
        increment_onboarding_count
        ;;
    1)
        show_stage_2
        increment_onboarding_count
        ;;
    2)
        show_stage_3
        increment_onboarding_count
        ;;
    3)
        show_stage_4
        increment_onboarding_count
        ;;
    4)
        show_stage_5
        increment_onboarding_count
        ;;
    *)
        # 引导已完成，静默退出
        ;;
esac

exit 0
