#!/usr/bin/env bash
# ============================================================================
# model-fallback.sh — 模型回退链 (增强版)
# ============================================================================
# 增强功能：
#   1. TypeScript 状态控制器集成
#   2. 自动回退链状态追踪
#   3. 错误分类（retryable/stop/non_retryable）
#   4. 指数退避重试计数
#   5. 保留原有手动切换建议作为后备
# ============================================================================

set -euo pipefail

# Source provider adapter for CLI-agnostic paths and variables
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/provider-adapter.sh"

FALLBACK_CONFIG="$STATE_DIR/model-fallback.json"
FALLBACK_LOG="$STATE_DIR/logs/model-fallback.log"
FALLBACK_CLI="$(get_cli_entry model-fallback)"

mkdir -p "$(dirname "$FALLBACK_LOG")" 2>/dev/null

_log() { echo "[$(date '+%H:%M:%S')] $*" >> "$FALLBACK_LOG"; }

USE_CLI=false
if command -v node &>/dev/null && [ -f "$FALLBACK_CLI" ]; then
    USE_CLI=true
fi

# ---- 工具函数 ---------------------------------------------------------------

is_model_error() {
  local output="$1"
  [ -z "$output" ] && return 1

  if echo "$output" | grep -qiE '(overloaded|overloaded_error|529|503|capacity|rate.limit)' 2>/dev/null; then
    return 0
  fi
  if echo "$output" | grep -qiE '(model.*(unavailable|not.found|does.not.exist)|unknown.model|invalid.model)' 2>/dev/null; then
    return 0
  fi
  if echo "$output" | grep -qiE '(quota.*exceeded|billing|insufficient.*credits|usage.limit)' 2>/dev/null; then
    return 0
  fi
  if echo "$output" | grep -qiE '(context.*(window|length|limit).*exceeded|too.*many.*tokens|token.*limit)' 2>/dev/null; then
    return 0
  fi
  if echo "$output" | grep -qiE '(api.*error|internal.*server.*error|service.*unavailable|temporarily.*unavailable)' 2>/dev/null; then
    return 0
  fi
  return 1
}

find_fallback_chain() {
  local current_model="$1"
  if [ ! -f "$FALLBACK_CONFIG" ]; then
    if $USE_CLI; then
      NEXT=$(node "$FALLBACK_CLI" --action=next --session="$SESSION_ID" 2>/dev/null | jq -r '.next // empty' 2>/dev/null || echo '')
      if [ -n "$NEXT" ]; then echo "$NEXT"; return 0; fi
    fi
    echo ""; return 1
  fi
  if command -v jq >/dev/null 2>&1; then
    local fallback
    fallback=$(jq -r --arg model "$current_model" \
      '.providers[] | select(.primary == $model) | .fallbacks[0] // empty' \
      "$FALLBACK_CONFIG" 2>/dev/null) || fallback=""
    if [ -n "$fallback" ]; then echo "$fallback"; return 0; fi
  fi
  return 1
}

get_max_retries() {
  if [ -f "$FALLBACK_CONFIG" ] && command -v jq >/dev/null 2>&1; then
    jq -r '.max_retries // 3' "$FALLBACK_CONFIG" 2>/dev/null || echo "3"
  else
    echo "3"
  fi
}

# ---- 主逻辑 ----------------------------------------------------------------

STDIN_INPUT=$(cat 2>/dev/null) || STDIN_INPUT=""
if [ -z "$STDIN_INPUT" ]; then exit 0; fi

TOOL_OUTPUT=""
TOOL_NAME=""
CURRENT_MODEL=""
SESSION_ID="${SESSION_ID:-unknown}"

if command -v jq >/dev/null 2>&1; then
  TOOL_OUTPUT=$(echo "$STDIN_INPUT" | jq -r '.tool_output // empty' 2>/dev/null) || TOOL_OUTPUT=""
  TOOL_NAME=$(echo "$STDIN_INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
  CURRENT_MODEL=$(echo "$STDIN_INPUT" | jq -r '.model // .current_model // empty' 2>/dev/null) || CURRENT_MODEL=""
fi

if [ -z "$TOOL_OUTPUT" ]; then exit 0; fi
if ! is_model_error "$TOOL_OUTPUT"; then exit 0; fi

_log "Model error detected: $TOOL_NAME"

# 推断当前模型
if [ -z "$CURRENT_MODEL" ]; then
  if echo "$TOOL_OUTPUT" | grep -qi 'claude\|anthropic'; then
    CURRENT_MODEL="claude-opus-4-7"
  else
    CURRENT_MODEL="unknown"
  fi
fi

# ---- TypeScript CLI 集成 --------------------------------------------------

if $USE_CLI; then
    # 分类错误
    CLASSIFICATION=$(node "$FALLBACK_CLI" --action=classify --error="$TOOL_OUTPUT" 2>/dev/null || echo '{"classification":"retryable"}')
    ERROR_TYPE=$(echo "$CLASSIFICATION" | jq -r '.classification // "retryable"' 2>/dev/null || echo 'retryable')

    # 非重试类错误，仅通知
    if [ "$ERROR_TYPE" = "non_retryable" ] || [ "$ERROR_TYPE" = "stop" ]; then
        _log "Non-retryable error type: $ERROR_TYPE"
        cat << EOF
{
  "systemMessage": "\n\n⚠️ **模型错误** ($ERROR_TYPE)\n\n模型 \`$CURRENT_MODEL\` 遇到不可重试的错误。\n\n请检查:\n- API 密钥是否有效\n- 账户余额/配额\n- 模型访问权限\n"
}
EOF
        exit 0
    fi

    # 可重试 - 设置待处理回退
    AGENT_NAME=$(echo "$STDIN_INPUT" | jq -r '.agent // empty' 2>/dev/null || echo '')
    if [ -n "$AGENT_NAME" ]; then
        FALLBACK_STATE=$(node "$FALLBACK_CLI" --action=set-pending \
            --session="$SESSION_ID" \
            --model="$CURRENT_MODEL" \
            --error="$TOOL_OUTPUT" \
            --agent="$AGENT_NAME" 2>/dev/null || echo '{}')
    else
        FALLBACK_STATE=$(node "$FALLBACK_CLI" --action=set-pending \
            --session="$SESSION_ID" \
            --model="$CURRENT_MODEL" \
            --error="$TOOL_OUTPUT" 2>/dev/null || echo '{}')
    fi

    ATTEMPT=$(echo "$FALLBACK_STATE" | jq -r '.attemptCount // 0' 2>/dev/null || echo 0)
    CHAIN_LENGTH=$(echo "$FALLBACK_STATE" | jq -r '.fallbackChain | length' 2>/dev/null || echo 0)

    # 获取下一个回退模型
    NEXT_MODEL=$(node "$FALLBACK_CLI" --action=next --session="$SESSION_ID" 2>/dev/null | jq -r '.next // empty' 2>/dev/null || echo '')
fi

# 回退到经典查找
if [ -z "${NEXT_MODEL:-}" ]; then
    NEXT_MODEL=$(find_fallback_chain "$CURRENT_MODEL")
fi

# 应用回退（如果有 CLI）
if $USE_CLI && [ -n "${NEXT_MODEL:-}" ]; then
    node "$FALLBACK_CLI" --action=apply --session="$SESSION_ID" 2>/dev/null || true
fi

MAX_RETRIES=$(get_max_retries)

if [ -z "${NEXT_MODEL:-}" ]; then
  _log "No fallback available for: $CURRENT_MODEL"
  cat << 'EOF'
{
  "systemMessage": "\n\n⚠️ **模型错误** - 无可用的回退模型\n\n建议:\n- 尝试 /model 切换模型\n- 设置环境变量: `export CLAUDE_MODEL=claude-sonnet-4-6`\n- 重启会话并指定备用模型\n"
}
EOF
  exit 0
fi

_log "Fallback: $CURRENT_MODEL → $NEXT_MODEL (attempt ${ATTEMPT:-0}/${CHAIN_LENGTH:-3})"

# 构建增强输出
AUTO_SWITCH_NOTE=""
if $USE_CLI; then
    AUTO_SWITCH_NOTE="\n\n🔄 **自动回退状态**: 第 ${ATTEMPT:-0} 次尝试"
fi

cat << EOF
{
  "systemMessage": "\n\n🔄 **模型回退**\n\n当前模型 \`$CURRENT_MODEL\` 不可用\n\n→ 回退至: \`${NEXT_MODEL}\`${AUTO_SWITCH_NOTE}\n\n## 操作\n使用 /model 命令切换到模型: \`${NEXT_MODEL}\`\n\n最大重试次数: ${MAX_RETRIES}\n\n编辑 \`~/.oh-my-claude/model-fallback.json\` 自定义回退链。\n"
}
EOF

exit 0
