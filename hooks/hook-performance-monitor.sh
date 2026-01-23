#!/usr/bin/env bash
# Hook 性能监控
# 追踪各 Hook 的执行时间，识别性能瓶颈
# 触发时机: PostToolUse (周期性检查)

set -eu

# 性能日志目录
PERF_LOG_DIR="${HOME}/.oh-my-claude/performance"
PERF_LOG_FILE="${PERF_LOG_DIR}/hook-timing.log"
PERF_SUMMARY_FILE="${PERF_LOG_DIR}/summary.json"

# 确保目录存在
mkdir -p "$PERF_LOG_DIR"

# 性能阈值（毫秒）
SLOW_HOOK_THRESHOLD=500
VERY_SLOW_HOOK_THRESHOLD=2000

# 获取当前时间戳（毫秒）
get_timestamp_ms() {
    if command -v python3 &>/dev/null; then
        python3 -c "import time; print(int(time.time() * 1000))"
    elif command -v node &>/dev/null; then
        node -e "console.log(Date.now())"
    else
        # 降级方案：秒级精度
        echo "$(($(date +%s) * 1000))"
    fi
}

# 记录 Hook 执行时间
log_hook_timing() {
    local hook_name="$1"
    local start_time="$2"
    local end_time="$3"
    local duration=$((end_time - start_time))
    
    # 追加到日志
    echo "{\"hook\":\"$hook_name\",\"duration\":$duration,\"timestamp\":$end_time}" >> "$PERF_LOG_FILE"
    
    # 检查是否超过阈值
    if [ "$duration" -gt "$VERY_SLOW_HOOK_THRESHOLD" ]; then
        echo "⚠️ 非常慢的 Hook: $hook_name (${duration}ms)"
    elif [ "$duration" -gt "$SLOW_HOOK_THRESHOLD" ]; then
        echo "⏱️ 较慢的 Hook: $hook_name (${duration}ms)"
    fi
}

# 生成性能摘要
generate_summary() {
    if [ ! -f "$PERF_LOG_FILE" ]; then
        echo "{\"error\": \"No performance data\"}"
        return
    fi
    
    # 使用 jq 生成摘要（如果可用）
    if command -v jq &>/dev/null; then
        jq -s '
            group_by(.hook) | 
            map({
                hook: .[0].hook,
                count: length,
                avg_ms: (map(.duration) | add / length | floor),
                max_ms: (map(.duration) | max),
                min_ms: (map(.duration) | min)
            }) |
            sort_by(-.avg_ms)
        ' "$PERF_LOG_FILE" > "$PERF_SUMMARY_FILE"
        
        cat "$PERF_SUMMARY_FILE"
    else
        echo "{\"message\": \"Install jq for detailed analysis\"}"
    fi
}

# 清理旧日志（保留最近 7 天）
cleanup_old_logs() {
    if [ -f "$PERF_LOG_FILE" ]; then
        # 获取 7 天前的时间戳
        local cutoff_time
        cutoff_time=$(( $(get_timestamp_ms) - 7 * 24 * 60 * 60 * 1000 ))
        
        if command -v jq &>/dev/null; then
            jq -c "select(.timestamp > $cutoff_time)" "$PERF_LOG_FILE" > "${PERF_LOG_FILE}.tmp" 2>/dev/null || true
            mv "${PERF_LOG_FILE}.tmp" "$PERF_LOG_FILE" 2>/dev/null || true
        fi
    fi
}

# 显示性能报告
show_performance_report() {
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│              🔍 Hook 性能监控报告                            │"
    echo "├─────────────────────────────────────────────────────────────┤"
    
    if [ -f "$PERF_SUMMARY_FILE" ] && command -v jq &>/dev/null; then
        echo "│                                                             │"
        echo "│  Hook 名称                  平均耗时    最大耗时    调用次数  │"
        echo "│  ─────────────────────────────────────────────────────────  │"
        
        jq -r '.[] | "│  \(.hook | .[0:25] | . + " " * (25 - length))  \(.avg_ms | tostring | . + "ms" + " " * (8 - length))   \(.max_ms | tostring | . + "ms" + " " * (8 - length))   \(.count)       │"' "$PERF_SUMMARY_FILE" 2>/dev/null | head -10
        
        echo "│                                                             │"
    else
        echo "│  暂无性能数据或 jq 未安装                                   │"
        echo "│                                                             │"
        echo "│  💡 安装 jq 以获取详细分析:                                  │"
        echo "│     brew install jq  (macOS)                                │"
        echo "│     apt install jq   (Linux)                                │"
        echo "│     choco install jq (Windows)                              │"
    fi
    
    echo "│                                                             │"
    echo "│  📁 日志位置: ~/.oh-my-claude/performance/                  │"
    echo "│                                                             │"
    echo "│  🔧 命令:                                                   │"
    echo "│     /hook-perf         查看性能报告                         │"
    echo "│     /hook-perf clear   清除性能日志                         │"
    echo "│                                                             │"
    echo "└─────────────────────────────────────────────────────────────┘"
}

# 主逻辑
main() {
    local action="${1:-report}"
    
    case "$action" in
        "start")
            # 记录开始时间（由调用者使用）
            get_timestamp_ms
            ;;
        "end")
            # 记录结束时间并计算耗时
            local hook_name="${2:-unknown}"
            local start_time="${3:-0}"
            local end_time
            end_time=$(get_timestamp_ms)
            log_hook_timing "$hook_name" "$start_time" "$end_time"
            ;;
        "report")
            # 显示性能报告
            generate_summary >/dev/null 2>&1
            show_performance_report
            ;;
        "summary")
            # 仅生成 JSON 摘要
            generate_summary
            ;;
        "clear")
            # 清除日志
            rm -f "$PERF_LOG_FILE" "$PERF_SUMMARY_FILE"
            echo "✅ 性能日志已清除"
            ;;
        "cleanup")
            # 清理旧日志
            cleanup_old_logs
            ;;
        *)
            echo "用法: hook-performance-monitor.sh [start|end|report|summary|clear|cleanup]"
            ;;
    esac
}

# 运行主程序
main "$@"
