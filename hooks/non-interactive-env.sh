#!/usr/bin/env bash
# ============================================================================
# Non-Interactive Environment Handler - 非交互式环境处理器
# ============================================================================
# 对标 oh-my-opencode 的 non-interactive-env hook
# 在 CI/CD、Docker、SSH 等无头环境中自动调整行为
#
# Hook 类型: PreToolUse
# 功能：
# 1. 检测非交互式环境（CI/Docker/SSH/cron）
# 2. 阻止需要用户交互的工具调用
# 3. 自动选择非交互式替代方案
# ============================================================================

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$_STDIN_INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=$(echo "$_STDIN_INPUT" | jq -c '.tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
else
    TOOL_NAME=$(echo "$_STDIN_INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=$(echo "$_STDIN_INPUT" | grep -o '"tool_input"[[:space:]]*:[[:space:]]*{[^}]*}' | head -1 2>/dev/null) || TOOL_INPUT=""
fi

# 如果没有工具名称，跳过
if [ -z "$TOOL_NAME" ]; then
    exit 0
fi

# ============================================================================
# 环境检测函数
# ============================================================================

# 检测是否为非交互式环境
is_non_interactive() {
    # CI/CD 环境变量检测
    if [ -n "$CI" ] || [ -n "$CONTINUOUS_INTEGRATION" ] || [ -n "$BUILD_NUMBER" ]; then
        return 0
    fi
    
    # GitHub Actions
    if [ -n "$GITHUB_ACTIONS" ]; then
        return 0
    fi
    
    # GitLab CI
    if [ -n "$GITLAB_CI" ]; then
        return 0
    fi
    
    # Jenkins
    if [ -n "$JENKINS_URL" ]; then
        return 0
    fi
    
    # Docker 环境（检测 .dockerenv 或 cgroup）
    if [ -f "/.dockerenv" ]; then
        return 0
    fi
    
    # 检查 cgroup（Linux 容器检测）
    if [ -f "/proc/1/cgroup" ] && grep -q "docker\|containerd\|lxc" /proc/1/cgroup 2>/dev/null; then
        return 0
    fi
    
    # 无终端（无 TTY）
    if [ ! -t 0 ] && [ ! -t 1 ]; then
        # stdin 和 stdout 都不是终端
        # 但不能仅凭此判断，因为管道操作也会触发
        # 额外检查是否有 TERM 变量
        if [ -z "$TERM" ] || [ "$TERM" = "dumb" ]; then
            return 0
        fi
    fi
    
    # Cron 环境
    if [ -n "$CRON_JOB" ] || (ps -o comm= -p $PPID 2>/dev/null | grep -q "cron"); then
        return 0
    fi
    
    return 1
}

# 获取环境类型描述
get_env_type() {
    if [ -n "$GITHUB_ACTIONS" ]; then
        echo "GitHub Actions"
    elif [ -n "$GITLAB_CI" ]; then
        echo "GitLab CI"
    elif [ -n "$JENKINS_URL" ]; then
        echo "Jenkins"
    elif [ -n "$CI" ]; then
        echo "CI/CD"
    elif [ -f "/.dockerenv" ]; then
        echo "Docker"
    elif [ -n "$CRON_JOB" ]; then
        echo "Cron"
    else
        echo "Non-interactive"
    fi
}

# ============================================================================
# 工具约束检测
# ============================================================================

# 检测是否为交互式工具
is_interactive_tool() {
    local tool="$1"
    local input="$2"
    
    case "$tool" in
        # 浏览器相关工具需要 GUI
        browser_*|playwright_*)
            return 0
            ;;
        # MCP Question 工具需要用户输入
        mcp_question|question)
            return 0
            ;;
        # Bash 工具中的交互式命令
        Bash|bash)
            # 检测交互式命令
            if echo "$input" | grep -qE '(vim|vi|nano|emacs|less|more|top|htop|man |read |select )'; then
                return 0
            fi
            # 检测需要 GUI 的命令
            if echo "$input" | grep -qE '(open |xdg-open|start |explorer|firefox|chrome|code )'; then
                return 0
            fi
            ;;
        # tmux 交互式会话
        interactive_bash)
            return 0
            ;;
    esac
    
    return 1
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 只在非交互式环境中激活
    if ! is_non_interactive; then
        exit 0
    fi
    
    local env_type
    env_type=$(get_env_type)
    
    # 检测交互式工具调用
    if is_interactive_tool "$TOOL_NAME" "$TOOL_INPUT"; then
        case "$TOOL_NAME" in
            browser_*|playwright_*)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Non-Interactive Env] 在 %s 环境中无法使用浏览器工具 (%s)。浏览器自动化需要 GUI 环境。建议：使用 curl/wget 进行 HTTP 请求，或使用 headless 模式配置。"}}\n' "$env_type" "$TOOL_NAME"
                ;;
            mcp_question|question)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Non-Interactive Env] 在 %s 环境中无法向用户提问。请使用合理的默认值继续执行，或在输出中记录需要用户确认的决策。"}}\n' "$env_type"
                ;;
            interactive_bash)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Non-Interactive Env] 在 %s 环境中无法创建交互式终端会话。请使用标准 Bash 工具执行命令。"}}\n' "$env_type"
                ;;
            Bash|bash)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Non-Interactive Env] 在 %s 环境中检测到交互式命令。请使用非交互式替代方案。"}}\n' "$env_type"
                ;;
            *)
                printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[Non-Interactive Env] 工具 %s 在 %s 环境中可能无法正常工作。请使用非交互式替代方案。"}}\n' "$TOOL_NAME" "$env_type"
                ;;
        esac
        exit 0
    fi
    
    # 非交互式工具允许通过
    exit 0
}

# 执行
main
