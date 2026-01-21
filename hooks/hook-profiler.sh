#!/usr/bin/env bash
# ============================================================================
# Hook Profiler - Hook 性能监控器
# ============================================================================
# 用于包装其他 Hook 脚本，记录执行时间和状态
#
# 用法：
#   bash hooks/hook-profiler.sh <hook-script> [args...]
#
# 环境变量：
#   OH_MY_CLAUDE_PROFILE=true    启用性能监控
#   OH_MY_CLAUDE_PERF_LOG        性能日志路径（默认 ~/.oh-my-claude/logs/hooks-perf.log）
# ============================================================================

set -e

# 配置
PROFILE_ENABLED="${OH_MY_CLAUDE_PROFILE:-false}"
PERF_LOG="${OH_MY_CLAUDE_PERF_LOG:-$HOME/.oh-my-claude/logs/hooks-perf.log}"
HOOK_SCRIPT="$1"
shift

# 如果未启用性能监控，直接执行原始脚本
if [ "$PROFILE_ENABLED" != "true" ]; then
    exec bash "$HOOK_SCRIPT" "$@"
fi

# 确保日志目录存在
mkdir -p "$(dirname "$PERF_LOG")"

# 获取 Hook 名称
HOOK_NAME=$(basename "$HOOK_SCRIPT" .sh)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
START_TIME=$(date +%s%3N 2>/dev/null || date +%s)

# 执行 Hook 并捕获结果
set +e
OUTPUT=$(bash "$HOOK_SCRIPT" "$@" 2>&1)
EXIT_CODE=$?
set -e

END_TIME=$(date +%s%3N 2>/dev/null || date +%s)

# 计算执行时间（毫秒）
if [ ${#START_TIME} -gt 10 ]; then
    # 毫秒精度
    DURATION=$((END_TIME - START_TIME))
else
    # 秒精度，转换为毫秒
    DURATION=$(( (END_TIME - START_TIME) * 1000 ))
fi

# 确定状态
if [ $EXIT_CODE -eq 0 ]; then
    STATUS="success"
else
    STATUS="failed"
fi

# 记录性能日志（JSON 格式）
cat >> "$PERF_LOG" << EOF
{"timestamp":"$TIMESTAMP","hook":"$HOOK_NAME","duration_ms":$DURATION,"status":"$STATUS","exit_code":$EXIT_CODE}
EOF

# 输出原始结果
echo "$OUTPUT"
exit $EXIT_CODE
