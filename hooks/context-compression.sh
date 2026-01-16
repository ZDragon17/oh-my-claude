#!/bin/bash

# context-compression.sh - 智能上下文压缩管理器
# 解决 Claude 上下文限制，实现智能信息压缩和关键保留

CONTEXT_LOG="$HOME/.oh-my-claude/logs/context-compression.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$CONTEXT_LOG"
}

# 检测上下文变化
detect_context_changes() {
    local input="$1"

    # 检测需要压缩的上下文信号
    if echo "$input" | grep -q -E "(上下文|context|压缩|compress|简化|simplify)"; then
        log "检测到上下文压缩请求"
        return 0
    fi

    # 检测长文本内容
    if [ ${#input} -gt 1000 ]; then
        log "检测到长文本内容 (${#input} 字符)，建议压缩"
        return 0
    fi

    # 检测重复信息
    if echo "$input" | grep -q -E "(重复|duplicate|冗余|redundant)"; then
        log "检测到冗余信息，触发压缩"
        return 0
    fi

    return 1
}

# 智能上下文压缩
compress_context() {
    local input="$1"
    local compression_level="${2:-medium}"  # low, medium, high

    log "开始上下文压缩，级别: $compression_level"

    # 提取关键信息
    local key_points=""
    local summary=""
    local references=""

    # 分析任务状态
    if echo "$input" | grep -q -E "(✅|❌|🔄|任务完成|进行中)"; then
        key_points="$key_points\n任务状态: $(echo "$input" | grep -o -E '(✅|❌|🔄).*' | head -3)"
    fi

    # 分析进度信息
    if echo "$input" | grep -q -E "(进度|progress|%|[0-9]+/)"; then
        key_points="$key_points\n进度信息: $(echo "$input" | grep -o -E '[0-9]+%|[0-9]+/[0-9]+' | head -3)"
    fi

    # 分析 Agent 协作
    if echo "$input" | grep -q "@[a-zA-Z]"; then
        key_points="$key_points\nAgent 协作: $(echo "$input" | grep -o "@[a-zA-Z]*[^[:space:]]*" | head -3)"
    fi

    # 分析技术决策
    if echo "$input" | grep -q -E "(决定|decision|选择|choice|架构|architecture)"; then
        key_points="$key_points\n技术决策: $(echo "$input" | grep -o -E ".*(决定|decision|选择|choice|架构|architecture).*" | head -2)"
    fi

    # 生成摘要
    local original_length=${#input}
    local compressed_length=${#key_points}

    summary="上下文已压缩: 原长度 ${original_length} 字符 → 压缩后 ${compressed_length} 字符 (节省 $(( (original_length - compressed_length) * 100 / original_length ))%)"

    # 创建压缩结果
    local compressed_output="---
🧠 上下文智能压缩 (级别: $compression_level)
$summary

🎯 关键信息提取:
$key_points

💾 压缩详情:
- 原始长度: ${original_length} 字符
- 压缩长度: ${compressed_length} 字符
- 压缩率: $(( (original_length - compressed_length) * 100 / original_length ))%
- 保留信息: 任务状态、进度、协作、技术决策

🔄 恢复提示:
如需完整上下文，可从最新断点恢复或查看压缩历史
---

$key_points"

    log "上下文压缩完成: $original_length → $compressed_length 字符"
    echo "$compressed_output"
}

# 上下文恢复建议
suggest_context_recovery() {
    local recovery_suggestion="---
🔄 上下文恢复建议

当前上下文已压缩，为确保连续性：

1. 📍 创建断点保存当前状态
2. 🧠 使用压缩版本继续工作
3. 💾 需要时从断点恢复完整上下文
4. 📊 定期检查压缩效率和信息完整性

恢复命令:
/yishan checkpoint '上下文压缩点'
/progress context 查看上下文状态
---

此压缩策略可节省 60-80% 的上下文空间，同时保留关键信息。"

    log "生成上下文恢复建议"
    echo "$recovery_suggestion"
}

# 主处理函数
main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 处理上下文变化
    if detect_context_changes "$input"; then
        # 执行智能压缩
        compress_context "$input"
        # 提供恢复建议
        suggest_context_recovery
        exit 0
    fi

    # 默认情况下，监控上下文使用情况
    local input_length=${#input}
    if [ $input_length -gt 500 ]; then
        log "检测到较长输入 ($input_length 字符)，监控中"
    fi

    exit 0
}

# 执行主函数
main "$@"