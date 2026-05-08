#!/usr/bin/env bash
# ============================================================================
# Enforcer Helpers - 共享的续航强制执行器辅助函数
# ============================================================================
# 提供给 todo-continuation-enforcer.sh 等钩子使用的通用函数
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/provider-adapter.sh" 2>/dev/null || true

ENFORCER_CLI="$(get_cli_entry todo 2>/dev/null || echo "$PLUGIN_DIR/dist/lib/todo/cli.js")"
ENFORCER_STATE_DIR="$STATE_DIR/state"

# 确保状态目录存在
ensure_enforcer_state_dir() {
    if [ ! -d "$ENFORCER_STATE_DIR" ]; then
        mkdir -p "$ENFORCER_STATE_DIR"
    fi
}

# 获取会话 ID
get_session_id() {
    echo "${SESSION_ID:-unknown}"
}

# 检查是否处于冷却期（基于文件时间戳）
check_cooldown() {
    local cooldown_file="$ENFORCER_STATE_DIR/enforcer-cooldown"
    if [ -f "$cooldown_file" ]; then
        local cooldown_ts
        cooldown_ts=$(cat "$cooldown_file" 2>/dev/null || echo 0)
        local now
        now=$(date +%s)
        if [ $((now - cooldown_ts)) -lt 60 ]; then
            return 0  # 在冷却期内
        fi
    fi
    return 1  # 不在冷却期内
}

# 设置冷却期
set_cooldown() {
    ensure_enforcer_state_dir
    date +%s > "$ENFORCER_STATE_DIR/enforcer-cooldown"
}

# 计算指数退避（纯 bash 实现）
compute_backoff() {
    local failures=$1
    local base=${2:-2}
    local max_delay=${3:-120}
    local delay=$base

    for _ in $(seq 1 "$failures"); do
        delay=$((delay * 2))
        if [ "$delay" -gt "$max_delay" ]; then
            delay=$max_delay
            break
        fi
    done

    echo "$delay"
}

# 检测是否处于压缩状态
detect_compaction() {
    local compaction_flag="$ENFORCER_STATE_DIR/last-compaction"
    if [ -f "$compaction_flag" ]; then
        local compaction_ts
        compaction_ts=$(cat "$compaction_flag" 2>/dev/null || echo 0)
        local now
        now=$(date +%s)
        if [ $((now - compaction_ts)) -lt 60 ]; then
            return 0  # 最近压缩过
        fi
    fi
    return 1
}

# 计算待办事项哈希（用于停滞检测）
compute_todo_hash() {
    local todo_file="$1"
    if [ -f "$todo_file" ]; then
        md5sum "$todo_file" 2>/dev/null | cut -d' ' -f1 || md5 "$todo_file" 2>/dev/null | cut -d' ' -f4 || echo "0"
    else
        echo "0"
    fi
}

# 保存待办事项快照
save_todo_snapshot() {
    local session_id="$1"
    local hash="$2"
    ensure_enforcer_state_dir
    echo "$hash" > "$ENFORCER_STATE_DIR/todo-snapshot-${session_id}"
}

# 读取待办事项快照
read_todo_snapshot() {
    local session_id="$1"
    local snapshot_file="$ENFORCER_STATE_DIR/todo-snapshot-${session_id}"
    if [ -f "$snapshot_file" ]; then
        cat "$snapshot_file"
    else
        echo ""
    fi
}

# 保存停滞计数
save_stagnation_count() {
    local session_id="$1"
    local count="$2"
    ensure_enforcer_state_dir
    echo "$count" > "$ENFORCER_STATE_DIR/stagnation-${session_id}"
}

# 读取停滞计数
read_stagnation_count() {
    local session_id="$1"
    local stagnation_file="$ENFORCER_STATE_DIR/stagnation-${session_id}"
    if [ -f "$stagnation_file" ]; then
        cat "$stagnation_file" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

# 保存连续失败次数
save_consecutive_failures() {
    local session_id="$1"
    local count="$2"
    ensure_enforcer_state_dir
    echo "$count" > "$ENFORCER_STATE_DIR/failures-${session_id}"
}

# 读取连续失败次数
read_consecutive_failures() {
    local session_id="$1"
    local failures_file="$ENFORCER_STATE_DIR/failures-${session_id}"
    if [ -f "$failures_file" ]; then
        cat "$failures_file" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

# 检测中止或令牌限制错误
detect_abort_or_token_error() {
    local input="$1"
    if echo "$input" | grep -qi "abort\|cancelled\|context_length\|too many tokens\|token limit exceeded" 2>/dev/null; then
        return 0
    fi
    return 1
}

# 构建进度条字符串
build_progress_bar() {
    local completed=$1
    local total=$2
    local width=${3:-10}

    if [ "$total" -eq 0 ]; then
        echo "[          ] 0%"
        return
    fi

    local pct=$((completed * 100 / total))
    local filled=$((pct * width / 100))
    local bar=""

    for _ in $(seq 1 "$filled"); do
        bar="${bar}█"
    done
    for _ in $(seq "$filled" $((width - 1))); do
        bar="${bar}░"
    done

    echo "[${bar}] ${pct}%"
}
