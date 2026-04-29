#!/usr/bin/env bash
# ============================================================================
# Context Window Monitor - 上下文窗口监控器
# ============================================================================
# 监控上下文窗口使用情况，在接近限制时提供预警
#
# 功能：
# 1. 估算当前上下文使用量
# 2. 在达到阈值时提供警告
# 3. 建议压缩或分割策略
# ============================================================================

# 配置
CONTEXT_WARNING_THRESHOLD="${OH_MY_CLAUDE_CONTEXT_WARNING_THRESHOLD:-70}"
CONTEXT_CRITICAL_THRESHOLD="${OH_MY_CLAUDE_CONTEXT_CRITICAL_THRESHOLD:-85}"
STATE_DIR=".claude"
CONTEXT_STATE_FILE="$STATE_DIR/context-state.json"

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    user_input=$(echo "$_STDIN_INPUT" | jq -c '.tool_input // empty' 2>/dev/null) || user_input=""
    tool_result=$(echo "$_STDIN_INPUT" | jq -r '(.tool_output // empty) | if type == "object" then tostring else . end' 2>/dev/null) || tool_result=""
else
    user_input=$(echo "$_STDIN_INPUT" | grep -o '"tool_input"[[:space:]]*:[[:space:]]*{[^}]*}' | head -1 2>/dev/null) || user_input=""
    tool_result=$(echo "$_STDIN_INPUT" | grep -o '"tool_output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || tool_result=""
fi

input_length=${#user_input}

# 获取工具调用结果长度
tool_result_length=${#tool_result}

# 获取或初始化累积上下文估算
accumulated_tokens=0
if [ -f "$CONTEXT_STATE_FILE" ]; then
    accumulated_tokens=$(grep '"accumulated_tokens"' "$CONTEXT_STATE_FILE" 2>/dev/null | sed 's/.*"accumulated_tokens"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/' || echo "0")
fi

# 简单的 token 估算（字符数 / 4）
# 这是一个非常粗略的估算，实际 token 计算更复杂
new_tokens=$((input_length / 4 + tool_result_length / 4))
accumulated_tokens=$((accumulated_tokens + new_tokens))

# Claude 的上下文窗口大约 200k tokens
# Claude 的上下文窗口大小（可通过环境变量覆盖）
MAX_CONTEXT_TOKENS="${OH_MY_CLAUDE_MAX_CONTEXT_TOKENS:-200000}"
usage_percent=$((accumulated_tokens * 100 / MAX_CONTEXT_TOKENS))

# 保存状态
mkdir -p "$STATE_DIR"
cat > "$CONTEXT_STATE_FILE" << EOF
{
  "accumulated_tokens": $accumulated_tokens,
  "usage_percent": $usage_percent,
  "last_update": "$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S')",
  "warning_threshold": $CONTEXT_WARNING_THRESHOLD,
  "critical_threshold": $CONTEXT_CRITICAL_THRESHOLD
}
EOF

# 检查是否需要发出警告
if [ "$usage_percent" -ge "$CONTEXT_CRITICAL_THRESHOLD" ]; then
    printf '{"systemMessage":"\\n\\n[SYSTEM ALERT - CONTEXT WINDOW CRITICAL]\\n\\n**上下文窗口即将耗尽**\\n\\n当前使用率: ~%d%%\\n估算 tokens: ~%d / %d\\n\\n**立即行动建议**:\\n1. 使用 `/compact` 压缩对话历史\\n2. 总结当前进度并开始新会话\\n3. 将大型代码块拆分为多个请求\\n\\n继续可能导致截断或错误。\\n"}\n' "$usage_percent" "$accumulated_tokens" "$MAX_CONTEXT_TOKENS"
    exit 0
fi

if [ "$usage_percent" -ge "$CONTEXT_WARNING_THRESHOLD" ]; then
    printf '{"systemMessage":"\\n\\n[SYSTEM WARNING - CONTEXT WINDOW]\\n\\n**上下文窗口使用较高**\\n\\n当前使用率: ~%d%%\\n估算 tokens: ~%d / %d\\n\\n**建议**:\\n- 考虑压缩对话历史\\n- 避免在请求中包含大型代码块\\n- 使用简洁的输出格式\\n"}\n' "$usage_percent" "$accumulated_tokens" "$MAX_CONTEXT_TOKENS"
    exit 0
fi

# 无需警告
exit 0
