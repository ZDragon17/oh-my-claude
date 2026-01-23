#!/usr/bin/env bash
# ============================================================================
# Agent 使用追踪器 - Agent Usage Tracker (PostToolUse Hook)
# ============================================================================
# 追踪用户使用的 Agent，记录最近使用历史
# 用于在 /help 等命令中显示个性化的快捷入口
#
# 触发条件：PostToolUse 事件中检测到 Skill 工具调用
# 存储位置：~/.oh-my-claude/agent-usage.json
# ============================================================================

# 配置
OH_MY_CLAUDE_DIR="$HOME/.oh-my-claude"
USAGE_FILE="$OH_MY_CLAUDE_DIR/agent-usage.json"
MAX_HISTORY=10

# 读取 stdin
input=$(cat 2>/dev/null) || input=""

# 如果输入为空，静默退出
if [ -z "$input" ]; then
    exit 0
fi

# ============================================================================
# 检测是否有 jq
# ============================================================================
HAS_JQ=0
if command -v jq > /dev/null 2>&1; then
    HAS_JQ=1
fi

# ============================================================================
# 提取 Agent 名称
# ============================================================================

# 从 Skill 工具调用中提取 agent 名称
extract_agent_name() {
    local json="$1"

    if [ "$HAS_JQ" -eq 1 ]; then
        # 检测是否是 Skill 工具调用
        tool_name=$(echo "$json" | jq -r '.tool_name // .toolName // empty' 2>/dev/null)
        if [ "$tool_name" = "Skill" ]; then
            # 提取 skill 参数
            skill_name=$(echo "$json" | jq -r '.tool_input.skill // empty' 2>/dev/null)
            if [ -n "$skill_name" ]; then
                echo "$skill_name"
                return 0
            fi
        fi
    else
        # 降级方案：使用 grep 检测
        if echo "$json" | grep -q '"tool_name"[[:space:]]*:[[:space:]]*"Skill"'; then
            skill_name=$(echo "$json" | grep -o '"skill"[[:space:]]*:[[:space:]]*"[^"]*"' | \
                sed 's/.*"skill"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | head -1)
            if [ -n "$skill_name" ]; then
                echo "$skill_name"
                return 0
            fi
        fi
    fi

    return 1
}

# ============================================================================
# 更新使用记录
# ============================================================================

update_usage_record() {
    local agent="$1"
    local timestamp=$(date +%s)

    mkdir -p "$OH_MY_CLAUDE_DIR" 2>/dev/null

    if [ "$HAS_JQ" -eq 1 ]; then
        # 使用 jq 更新 JSON
        if [ -f "$USAGE_FILE" ]; then
            # 读取现有记录，添加新条目，保留最近 MAX_HISTORY 条
            jq --arg agent "$agent" --arg ts "$timestamp" '
                . + [{"agent": $agent, "timestamp": ($ts | tonumber)}] |
                sort_by(.timestamp) | reverse | .[0:10]
            ' "$USAGE_FILE" > "$USAGE_FILE.tmp" 2>/dev/null && \
            mv "$USAGE_FILE.tmp" "$USAGE_FILE"
        else
            # 创建新文件
            printf '[{"agent":"%s","timestamp":%s}]' "$agent" "$timestamp" > "$USAGE_FILE"
        fi
    else
        # 降级方案：简单追加（不处理去重和限制）
        if [ -f "$USAGE_FILE" ]; then
            # 简单在数组末尾追加
            sed -i 's/\]$/,{"agent":"'"$agent"'","timestamp":'"$timestamp"'}]/' "$USAGE_FILE" 2>/dev/null || \
            printf '[{"agent":"%s","timestamp":%s}]' "$agent" "$timestamp" > "$USAGE_FILE"
        else
            printf '[{"agent":"%s","timestamp":%s}]' "$agent" "$timestamp" > "$USAGE_FILE"
        fi
    fi
}

# ============================================================================
# 主逻辑
# ============================================================================

agent_name=$(extract_agent_name "$input")

if [ -n "$agent_name" ]; then
    # 过滤掉一些非 Agent 的 skill
    case "$agent_name" in
        help|progress|status|git|refactor)
            # 这些是工具命令，不追踪
            ;;
        *)
            # 记录 Agent 使用
            update_usage_record "$agent_name"
            ;;
    esac
fi

exit 0
