#!/usr/bin/env sh
# ============================================================================
# Context Smart Alert - 智能上下文预警 (Enhanced)
# ============================================================================
# 增强版上下文监控，提供多级预警和智能建议
#
# 功能：
# 1. 多级预警：提示(70%) → 警告(85%) → 紧急(95%)
# 2. 进度条可视化
# 3. 与 /context 命令集成
# 4. 智能建议操作
#
# 与 context-window-monitor.sh 的区别：
# - 更精细的预警等级
# - 可视化进度条
# - 与新命令系统集成
# ============================================================================

# 配置
HINT_THRESHOLD=70      # 提示阈值
WARNING_THRESHOLD=85   # 警告阈值
CRITICAL_THRESHOLD=95  # 紧急阈值
MAX_CONTEXT_TOKENS=200000

# 状态目录
STATE_DIR=".claude"
CONTEXT_STATE_FILE="$STATE_DIR/context-smart-state.json"

# 检查间隔（避免频繁提醒）
CHECK_INTERVAL_MINUTES=5
LAST_ALERT_FILE="$STATE_DIR/.last-context-alert"

# 获取当前时间戳（秒）
get_timestamp() {
    date +%s 2>/dev/null || echo "0"
}

# 检查是否应该跳过此次检查（避免频繁提醒）
should_skip_check() {
    if [ -f "$LAST_ALERT_FILE" ]; then
        last_alert=$(cat "$LAST_ALERT_FILE" 2>/dev/null || echo "0")
        current=$(get_timestamp)
        elapsed=$((current - last_alert))
        interval_seconds=$((CHECK_INTERVAL_MINUTES * 60))

        if [ "$elapsed" -lt "$interval_seconds" ]; then
            return 0  # 应该跳过
        fi
    fi
    return 1  # 不跳过
}

# 记录本次提醒时间
record_alert_time() {
    mkdir -p "$STATE_DIR"
    get_timestamp > "$LAST_ALERT_FILE"
}

# 生成进度条
generate_progress_bar() {
    percent=$1
    width=30
    filled=$((percent * width / 100))
    empty=$((width - filled))

    bar=""
    i=0
    while [ $i -lt $filled ]; do
        bar="${bar}█"
        i=$((i + 1))
    done
    while [ $i -lt $width ]; do
        bar="${bar}░"
        i=$((i + 1))
    done

    printf '%s' "$bar"
}

# 获取用户输入长度
user_input="${CLAUDE_USER_PROMPT:-}"
input_length=${#user_input}

# 获取工具调用结果长度
tool_result="${CLAUDE_TOOL_RESULT:-}"
tool_result_length=${#tool_result}

# 获取或初始化累积上下文估算
accumulated_tokens=0
if [ -f "$CONTEXT_STATE_FILE" ]; then
    accumulated_tokens=$(grep '"accumulated_tokens"' "$CONTEXT_STATE_FILE" 2>/dev/null | sed 's/.*"accumulated_tokens"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/' || echo "0")
fi

# Token 估算
# 中文约 1.5 字符/token，英文约 4 字符/token
# 简化为平均 3 字符/token
new_tokens=$((input_length / 3 + tool_result_length / 3))
accumulated_tokens=$((accumulated_tokens + new_tokens))

# 计算使用率
usage_percent=$((accumulated_tokens * 100 / MAX_CONTEXT_TOKENS))

# 确保百分比在 0-100 范围内
if [ "$usage_percent" -gt 100 ]; then
    usage_percent=100
fi

# 保存状态
mkdir -p "$STATE_DIR"
cat > "$CONTEXT_STATE_FILE" << EOF
{
  "accumulated_tokens": $accumulated_tokens,
  "usage_percent": $usage_percent,
  "last_update": "$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')",
  "thresholds": {
    "hint": $HINT_THRESHOLD,
    "warning": $WARNING_THRESHOLD,
    "critical": $CRITICAL_THRESHOLD
  }
}
EOF

# 检查是否需要预警
# 紧急状态始终提醒，其他状态受间隔限制
if [ "$usage_percent" -lt "$HINT_THRESHOLD" ]; then
    # 正常状态，无需提醒
    exit 0
fi

# 紧急状态：立即提醒
if [ "$usage_percent" -ge "$CRITICAL_THRESHOLD" ]; then
    record_alert_time
    progress_bar=$(generate_progress_bar "$usage_percent")

    printf '{"systemMessage":"\\n\\n🚨 **上下文紧急警报**\\n\\n```\\n📈 使用率: [%s] %d%%\\n   估算: ~%d / %d tokens\\n```\\n\\n**状态: 🚨 紧急 - 上下文即将耗尽！**\\n\\n**立即行动:**\\n1. `/context compact` - 压缩对话历史\\n2. `/session save` - 保存当前进度\\n3. 开始新会话继续工作\\n\\n⚠️ 继续操作可能导致会话中断！\\n"}\n' "$progress_bar" "$usage_percent" "$accumulated_tokens" "$MAX_CONTEXT_TOKENS"
    exit 0
fi

# 警告状态
if [ "$usage_percent" -ge "$WARNING_THRESHOLD" ]; then
    if should_skip_check; then
        exit 0
    fi
    record_alert_time
    progress_bar=$(generate_progress_bar "$usage_percent")

    printf '{"systemMessage":"\\n\\n⚠️ **上下文警告**\\n\\n```\\n📈 使用率: [%s] %d%%\\n   估算: ~%d / %d tokens\\n```\\n\\n**状态: 🟠 警告 - 请尽快处理**\\n\\n**建议操作:**\\n- `/context compact` - 压缩对话历史\\n- `/context` - 查看详细状态\\n- 避免读取大型文件\\n"}\n' "$progress_bar" "$usage_percent" "$accumulated_tokens" "$MAX_CONTEXT_TOKENS"
    exit 0
fi

# 提示状态
if [ "$usage_percent" -ge "$HINT_THRESHOLD" ]; then
    if should_skip_check; then
        exit 0
    fi
    record_alert_time
    progress_bar=$(generate_progress_bar "$usage_percent")

    printf '{"systemMessage":"\\n\\n💡 **上下文提示**\\n\\n使用率: %d%% - 建议适时使用 `/context` 查看状态\\n"}\n' "$usage_percent"
    exit 0
fi

exit 0
