#!/bin/bash

# preemptive-compaction.sh - 抢占式上下文压缩
# 在达到令牌限制之前主动压缩上下文，避免硬性截断
# 对标 oh-my-opencode 的 preemptive_compaction_threshold: 0.85

COMPACTION_LOG="$HOME/.oh-my-claude/logs/preemptive-compaction.log"
COMPACTION_STATE="$HOME/.oh-my-claude/state/compaction-state.json"
COMPACTION_HISTORY="$HOME/.oh-my-claude/history/compaction"

# 确保目录存在
mkdir -p "$(dirname "$COMPACTION_LOG")" 2>/dev/null
mkdir -p "$(dirname "$COMPACTION_STATE")" 2>/dev/null
mkdir -p "$COMPACTION_HISTORY" 2>/dev/null

# 配置参数
COMPACTION_THRESHOLD="${OH_MY_CLAUDE_COMPACTION_THRESHOLD:-0.85}"  # 85% 触发压缩
MAX_CONTEXT_TOKENS="${OH_MY_CLAUDE_MAX_CONTEXT:-128000}"           # 默认 128K 令牌
WARNING_THRESHOLD="0.70"                                            # 70% 发出警告
CRITICAL_THRESHOLD="0.95"                                           # 95% 强制压缩

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$COMPACTION_LOG"
}

# ==================== 令牌估算 ====================

# 估算文本的令牌数（简化版：约 4 字符 = 1 令牌）
estimate_tokens() {
    local text="$1"
    local char_count=${#text}

    # 英文约 4 字符 = 1 令牌，中文约 1.5-2 字符 = 1 令牌
    # 使用保守估计
    local token_estimate=$((char_count / 3))
    echo "$token_estimate"
}

# 获取当前上下文大小（从状态文件读取）
get_current_context_size() {
    if [ -f "$COMPACTION_STATE" ]; then
        local size=$(cat "$COMPACTION_STATE" 2>/dev/null | grep -o '"current_tokens":[0-9]*' | cut -d: -f2)
        echo "${size:-0}"
    else
        echo "0"
    fi
}

# 更新上下文大小
update_context_size() {
    local new_input="$1"
    local new_tokens=$(estimate_tokens "$new_input")
    local current_tokens=$(get_current_context_size)
    local total_tokens=$((current_tokens + new_tokens))

    # 保存状态
    cat > "$COMPACTION_STATE" << EOF
{
  "current_tokens": $total_tokens,
  "last_update": "$(date -Iseconds)",
  "threshold": $COMPACTION_THRESHOLD,
  "max_tokens": $MAX_CONTEXT_TOKENS
}
EOF

    log "上下文更新: +$new_tokens 令牌, 总计: $total_tokens / $MAX_CONTEXT_TOKENS"
    echo "$total_tokens"
}

# ==================== 压缩级别 ====================

# 计算上下文使用率
calculate_usage_ratio() {
    local current=$(get_current_context_size)
    local ratio=$(echo "scale=4; $current / $MAX_CONTEXT_TOKENS" | bc 2>/dev/null || echo "0")
    echo "$ratio"
}

# 判断压缩级别
determine_compaction_level() {
    local ratio="$1"

    # 使用 awk 进行浮点数比较
    local level=$(awk -v r="$ratio" -v c="$CRITICAL_THRESHOLD" -v t="$COMPACTION_THRESHOLD" -v w="$WARNING_THRESHOLD" '
        BEGIN {
            if (r >= c) print "critical"
            else if (r >= t) print "high"
            else if (r >= w) print "medium"
            else print "low"
        }
    ')

    echo "$level"
}

# ==================== 压缩策略 ====================

# 生成压缩摘要
generate_summary() {
    local content="$1"
    local max_length="${2:-500}"

    # 提取关键信息
    local summary=""

    # 提取任务状态
    local tasks=$(echo "$content" | grep -o -E '(✅|❌|🔄|⏳)[^\\n]*' | head -5)
    if [ -n "$tasks" ]; then
        summary="${summary}\n📋 任务状态:\n$tasks"
    fi

    # 提取代码变更
    local changes=$(echo "$content" | grep -o -E '(创建|修改|删除|更新|添加|移除).*文件' | head -5)
    if [ -n "$changes" ]; then
        summary="${summary}\n📝 代码变更:\n$changes"
    fi

    # 提取技术决策
    local decisions=$(echo "$content" | grep -o -E '(决定|选择|使用|采用)[^。]*。' | head -3)
    if [ -n "$decisions" ]; then
        summary="${summary}\n🎯 技术决策:\n$decisions"
    fi

    # 提取 Agent 协作记录
    local agents=$(echo "$content" | grep -o '@[a-zA-Z]*' | sort -u | head -5)
    if [ -n "$agents" ]; then
        summary="${summary}\n🤝 Agent 协作: $agents"
    fi

    # 截断到最大长度
    if [ ${#summary} -gt $max_length ]; then
        summary="${summary:0:$max_length}..."
    fi

    echo -e "$summary"
}

# 执行轻度压缩
compact_light() {
    local content="$1"

    log "执行轻度压缩"

    # 移除冗余空白
    local result=$(echo "$content" | sed 's/  */ /g' | sed '/^$/d')

    # 移除重复的分隔线
    result=$(echo "$result" | sed 's/---\n---/---/g')

    # 移除时间戳细节
    result=$(echo "$result" | sed 's/\[[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}\]//g')

    echo "$result"
}

# 执行中度压缩
compact_medium() {
    local content="$1"

    log "执行中度压缩"

    # 首先执行轻度压缩
    local result=$(compact_light "$content")

    # 移除详细的代码块，保留摘要
    result=$(echo "$result" | sed '/```/,/```/d')

    # 移除长列表，保留前几项
    result=$(echo "$result" | awk '
        /^[-*] / {
            if (list_count < 5) {
                print
                list_count++
            } else if (list_count == 5) {
                print "   ... (更多项已省略)"
                list_count++
            }
            next
        }
        { list_count = 0; print }
    ')

    echo "$result"
}

# 执行重度压缩
compact_heavy() {
    local content="$1"

    log "执行重度压缩"

    # 生成高度压缩的摘要
    local summary=$(generate_summary "$content" 300)

    local result="---
🧠 上下文已压缩 (重度压缩模式)

$summary

📍 原始内容长度: ${#content} 字符
📍 压缩后长度: ${#summary} 字符
📍 压缩率: $(( (${#content} - ${#summary}) * 100 / ${#content} ))%

💡 如需完整上下文，请使用:
   /context restore 从历史记录恢复
---"

    echo "$result"
}

# 执行紧急压缩
compact_critical() {
    local content="$1"

    log "执行紧急压缩"

    # 仅保留最关键的信息
    local result="---
⚠️ 紧急上下文压缩

📋 当前任务: $(echo "$content" | grep -o '当前任务[^。]*。' | head -1)
📍 最后操作: $(echo "$content" | grep -o -E '(✅|❌|🔄)[^\\n]*' | tail -1)
🎯 关键决策: $(echo "$content" | grep -o '决定[^。]*。' | tail -1)

💡 上下文已压缩到最小，建议:
   1. 完成当前任务后开始新会话
   2. 使用 /context export 导出重要信息
---"

    echo "$result"
}

# ==================== 压缩历史管理 ====================

# 保存压缩前的上下文
save_to_history() {
    local content="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local history_file="$COMPACTION_HISTORY/context_$timestamp.md"

    echo "$content" > "$history_file"
    log "上下文已保存到历史: $history_file"

    # 清理旧历史（保留最近 10 个）
    ls -t "$COMPACTION_HISTORY"/*.md 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
}

# 从历史恢复
restore_from_history() {
    local latest=$(ls -t "$COMPACTION_HISTORY"/*.md 2>/dev/null | head -1)

    if [ -f "$latest" ]; then
        cat "$latest"
        log "从历史恢复上下文: $latest"
    else
        echo "⚠️ 没有可恢复的上下文历史"
    fi
}

# ==================== 主处理逻辑 ====================

# 检测压缩触发条件
should_compact() {
    local ratio=$(calculate_usage_ratio)
    local level=$(determine_compaction_level "$ratio")

    case "$level" in
        "critical"|"high")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# 执行压缩
do_compaction() {
    local content="$1"
    local ratio=$(calculate_usage_ratio)
    local level=$(determine_compaction_level "$ratio")

    log "触发压缩: 使用率=$ratio, 级别=$level"

    # 保存到历史
    save_to_history "$content"

    # 根据级别执行压缩
    local compressed=""
    case "$level" in
        "critical")
            compressed=$(compact_critical "$content")
            ;;
        "high")
            compressed=$(compact_heavy "$content")
            ;;
        "medium")
            compressed=$(compact_medium "$content")
            ;;
        *)
            compressed=$(compact_light "$content")
            ;;
    esac

    # 更新状态
    local new_tokens=$(estimate_tokens "$compressed")
    echo "{\"current_tokens\": $new_tokens, \"last_compaction\": \"$(date -Iseconds)\"}" > "$COMPACTION_STATE"

    echo "$compressed"
}

# 生成压缩状态报告
generate_status_report() {
    local ratio=$(calculate_usage_ratio)
    local current=$(get_current_context_size)
    local level=$(determine_compaction_level "$ratio")
    local percentage=$(awk "BEGIN {printf \"%.1f\", $ratio * 100}")

    local status_icon=""
    case "$level" in
        "critical") status_icon="🔴" ;;
        "high") status_icon="🟠" ;;
        "medium") status_icon="🟡" ;;
        *) status_icon="🟢" ;;
    esac

    echo "---"
    echo "📊 上下文使用状态"
    echo ""
    echo "$status_icon 使用率: $percentage% ($current / $MAX_CONTEXT_TOKENS 令牌)"
    echo "📈 压缩阈值: $(awk "BEGIN {printf \"%.0f\", $COMPACTION_THRESHOLD * 100}")%"
    echo "⚙️ 压缩级别: $level"
    echo ""

    # 生成简单的进度条
    local bar_length=20
    local filled=$(awk "BEGIN {printf \"%.0f\", $ratio * $bar_length}")
    local empty=$((bar_length - filled))

    printf "   ["
    printf "%0.s█" $(seq 1 $filled 2>/dev/null) || true
    printf "%0.s░" $(seq 1 $empty 2>/dev/null) || true
    printf "] $percentage%%\n"

    echo ""
    if [ "$level" = "critical" ]; then
        echo "⚠️ 警告: 即将达到上下文限制，建议立即压缩"
    elif [ "$level" = "high" ]; then
        echo "💡 提示: 上下文使用率较高，将自动触发压缩"
    fi
    echo "---"
}

# ==================== 命令检测 ====================

detect_compaction_commands() {
    local input="$1"

    # 压缩相关命令
    if echo "$input" | grep -qiE "(压缩|compact|compaction|compress)"; then
        return 0
    fi

    # 上下文状态查询
    if echo "$input" | grep -qiE "(上下文|context|令牌|token).*状态|status"; then
        return 0
    fi

    # 恢复命令
    if echo "$input" | grep -qiE "(恢复|restore|recover).*上下文"; then
        return 0
    fi

    return 1
}

# ==================== 主函数 ====================

main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 更新上下文大小
    local total=$(update_context_size "$input")

    # 检测压缩命令
    if detect_compaction_commands "$input"; then
        log "检测到压缩相关命令"

        # 状态查询
        if echo "$input" | grep -qiE "(状态|status)"; then
            generate_status_report
            exit 0
        fi

        # 恢复命令
        if echo "$input" | grep -qiE "(恢复|restore)"; then
            restore_from_history
            exit 0
        fi

        # 强制压缩
        if echo "$input" | grep -qiE "(压缩|compact)"; then
            do_compaction "$input"
            exit 0
        fi
    fi

    # 检查是否需要自动压缩
    if should_compact; then
        log "自动触发抢占式压缩"

        echo "---"
        echo "🔄 抢占式上下文压缩"
        echo ""
        generate_status_report
        echo ""
        echo "💡 系统将自动压缩上下文以避免达到限制"
        echo "   如需手动控制，请使用:"
        echo "   /context status  - 查看状态"
        echo "   /context compact - 手动压缩"
        echo "   /context restore - 从历史恢复"
        echo "---"

        exit 0
    fi

    # 发出警告（如果使用率超过警告阈值）
    local ratio=$(calculate_usage_ratio)
    local level=$(determine_compaction_level "$ratio")

    if [ "$level" = "medium" ]; then
        log "上下文使用率警告: $(awk "BEGIN {printf \"%.1f\", $ratio * 100}")%"
    fi

    exit 0
}

# 执行主函数
main "$@"
