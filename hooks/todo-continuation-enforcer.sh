#!/usr/bin/env bash
# ============================================================================
# TODO Continuation Enforcer Hook - 增强版 (Boulder Mechanism)
# 对标 oh-my-opencode todo-continuation-enforcer v3.17.14
# ============================================================================
# 增强功能：
#   1. 2s 倒计时机制
#   2. 指数退避: delay = min(baseDelay * 2^failures, 120s)
#   3. 停滞检测: 连续 3 次无进展 → 停止
#   4. 压缩守卫: 压缩后 60s 冷却
#   5. 中止/令牌限制检测
#   6. 进度条可视化
# ============================================================================

set -euo pipefail

HOOK_NAME="todo-continuation-enforcer"
HELPERS_LIB="$(dirname "$0")/enforcer-helpers.sh"

# Source provider adapter for CLI-agnostic variables
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/provider-adapter.sh" 2>/dev/null || true

STOP_MARKER="$STATE_DIR/state/continuation-stopped"

# 加载辅助函数
if [ -f "$HELPERS_LIB" ]; then
    source "$HELPERS_LIB"
fi

ensure_enforcer_state_dir

# 获取输入（用于检测中止/令牌错误）
INPUT=$(cat 2>/dev/null || echo '{}')

# ============================================================================
# 守卫检查
# ============================================================================

# 如果停止标记存在，允许停止
if [ -f "$STOP_MARKER" ]; then
    exit 0
fi

# 检查是否处于冷却期
if check_cooldown; then
    exit 0
fi

# 检测压缩
if detect_compaction; then
    exit 0
fi

# 检测中止/令牌限制错误
if detect_abort_or_token_error "$INPUT"; then
    exit 0
fi

# 获取会话 ID
SESSION_ID=$(get_session_id)

# 优先使用 TypeScript CLI 进行状态检查
USE_CLI=false
if command -v node &>/dev/null && [ -f "$(get_cli_entry todo 2>/dev/null || echo '')" ]; then
    USE_CLI=true
fi

# ============================================================================
# TODO 状态解析
# ============================================================================

TODO_FILE=""
for candidate in ".claude/todos.json" ".claude/todo.json" ".sisyphus/todos.json"; do
    if [ -f "$candidate" ]; then
        TODO_FILE="$candidate"
        break
    fi
done

if [ -z "$TODO_FILE" ]; then
    exit 0
fi

PENDING_COUNT=0
IN_PROGRESS_COUNT=0
TOTAL_COUNT=0
COMPLETED_COUNT=0
PENDING_TASKS=""

if command -v jq > /dev/null 2>&1; then
    TOTAL_COUNT=$(jq -r '[.todos // [] | .[] ] | length' "$TODO_FILE" 2>/dev/null) || TOTAL_COUNT=0
    PENDING_COUNT=$(jq -r '[.todos // [] | .[] | select(.status == "pending")] | length' "$TODO_FILE" 2>/dev/null) || PENDING_COUNT=0
    IN_PROGRESS_COUNT=$(jq -r '[.todos // [] | .[] | select(.status == "in_progress")] | length' "$TODO_FILE" 2>/dev/null) || IN_PROGRESS_COUNT=0
    COMPLETED_COUNT=$(jq -r '[.todos // [] | .[] | select(.status == "completed")] | length' "$TODO_FILE" 2>/dev/null) || COMPLETED_COUNT=0
    PENDING_TASKS=$(jq -r '[.todos // [] | .[] | select(.status == "pending" or .status == "in_progress") | .content] | join("\n  - ")' "$TODO_FILE" 2>/dev/null) || PENDING_TASKS=""
else
    TOTAL_COUNT=$(grep -o '"status"' "$TODO_FILE" 2>/dev/null | wc -l | tr -d ' ') || TOTAL_COUNT=0
    PENDING_COUNT=$(grep -o '"pending"' "$TODO_FILE" 2>/dev/null | wc -l | tr -d ' ') || PENDING_COUNT=0
    IN_PROGRESS_COUNT=$(grep -o '"in_progress"' "$TODO_FILE" 2>/dev/null | wc -l | tr -d ' ') || IN_PROGRESS_COUNT=0
    COMPLETED_COUNT=$(grep -o '"completed"' "$TODO_FILE" 2>/dev/null | wc -l | tr -d ' ') || COMPLETED_COUNT=0
fi

UNFINISHED=$((PENDING_COUNT + IN_PROGRESS_COUNT))

if [ "$UNFINISHED" -eq 0 ]; then
    exit 0
fi

if [ "$TOTAL_COUNT" -eq 0 ]; then
    exit 0
fi

# ============================================================================
# 停滞检测
# ============================================================================

CURRENT_HASH=$(compute_todo_hash "$TODO_FILE")
PREVIOUS_HASH=$(read_todo_snapshot "$SESSION_ID")
STAGNATION_COUNT=$(read_stagnation_count "$SESSION_ID")
MAX_STAGNATION=3

if [ "$CURRENT_HASH" = "$PREVIOUS_HASH" ] && [ -n "$PREVIOUS_HASH" ]; then
    STAGNATION_COUNT=$((STAGNATION_COUNT + 1))
    save_stagnation_count "$SESSION_ID" "$STAGNATION_COUNT"

    if [ "$STAGNATION_COUNT" -ge "$MAX_STAGNATION" ]; then
        # 停滞超过阈值，允许停止（不再注入继续提示）
        # 重置停滞计数
        save_stagnation_count "$SESSION_ID" 0
        save_todo_snapshot "$SESSION_ID" ""
        exit 0
    fi
else
    # 有进展，重置停滞计数
    STAGNATION_COUNT=0
    save_stagnation_count "$SESSION_ID" 0
fi

# 保存当前快照
save_todo_snapshot "$SESSION_ID" "$CURRENT_HASH"

# ============================================================================
# 指数退避计算
# ============================================================================

CONSECUTIVE_FAILURES=$(read_consecutive_failures "$SESSION_ID")
BACKOFF_SECONDS=$(compute_backoff "$CONSECUTIVE_FAILURES" 2 120)

if [ "$CONSECUTIVE_FAILURES" -ge 5 ]; then
    # 超出最大重试次数，停止
    save_consecutive_failures "$SESSION_ID" 0
    exit 0
fi

# ============================================================================
# 使用 TypeScript CLI 进行高级检查
# ============================================================================

if $USE_CLI; then
    TS_CLI="$(get_cli_entry todo)"
    TS_RESULT=$(node "$TS_CLI" \
        --action=check \
        --session="$SESSION_ID" \
        --hash="$CURRENT_HASH" 2>/dev/null || echo '{"shouldContinue":true,"backoffSeconds":2,"reason":"todos_incomplete"}')

    TS_SHOULD_CONTINUE=$(echo "$TS_RESULT" | jq -r '.shouldContinue // true' 2>/dev/null || echo true)
    TS_REASON=$(echo "$TS_RESULT" | jq -r '.reason // "unknown"' 2>/dev/null || echo 'unknown')

    if [ "$TS_SHOULD_CONTINUE" != "true" ]; then
        # TypeScript 状态机指示停止
        if [ "$TS_REASON" = "stagnation_detected" ]; then
            exit 0
        fi
        if [ "$TS_REASON" = "max_failures_exceeded" ]; then
            save_consecutive_failures "$SESSION_ID" 0
            exit 0
        fi
        if [ "$TS_REASON" = "compaction_cooldown" ]; then
            exit 0
        fi
        exit 0
    fi
fi

# ============================================================================
# 倒计时机制
# ============================================================================

PROGRESS_PCT=0
if [ "$TOTAL_COUNT" -gt 0 ]; then
    PROGRESS_PCT=$((COMPLETED_COUNT * 100 / TOTAL_COUNT))
fi

PROGRESS_BAR=$(build_progress_bar "$COMPLETED_COUNT" "$TOTAL_COUNT" 10)

TASK_LIST=""
if [ -n "$PENDING_TASKS" ]; then
    TASK_LIST="\n\n📝 **未完成任务**:\n  - ${PENDING_TASKS}"
fi

STAGNATION_WARNING=""
if [ "$STAGNATION_COUNT" -gt 0 ]; then
    STAGNATION_WARNING="\n\n⚠️ 停滞警告: ${STAGNATION_COUNT}/${MAX_STAGNATION} 次无进展"
fi

BACKOFF_INFO=""
if [ "$CONSECUTIVE_FAILURES" -gt 0 ]; then
    BACKOFF_INFO="\n\n⏱️ 退避: ${BACKOFF_SECONDS}s (失败次数: ${CONSECUTIVE_FAILURES})"
fi

# 构建阻塞决策
printf '{"decision":"block","reason":"[TODO Enforcer] 检测到 %d 个未完成任务 (进度: %d%%, 退避: %ds, 停滞: %d/%d)","hookSpecificOutput":{"additionalContext":"\\n\\n📋 **TODO 续航检查 - Boulder 机制**\\n\\n%s %d/%d (%d%%)\\n\\n还有 %d 个任务待完成%s%s%s\\n\\n**请继续执行未完成的任务。**使用 \`%s\` 强制停止。\\n"}}\n' \
    "$UNFINISHED" "$PROGRESS_PCT" "$BACKOFF_SECONDS" "$STAGNATION_COUNT" "$MAX_STAGNATION" \
    "$PROGRESS_BAR" "$COMPLETED_COUNT" "$TOTAL_COUNT" "$PROGRESS_PCT" \
    "$UNFINISHED" "$TASK_LIST" "$STAGNATION_WARNING" "$BACKOFF_INFO" \
    "$CMD_STOP_CONTINUATION"

exit 0
