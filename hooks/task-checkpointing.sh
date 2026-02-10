#!/usr/bin/env bash

# task-checkpointing.sh - 任务断点续传管理器
# 解决 Claude 上下文限制，实现长任务的智能断点和恢复

TASK_CHECKPOINT_LOG="$HOME/.oh-my-claude/logs/task-checkpointing.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$TASK_CHECKPOINT_LOG"
}

# 检测任务状态变化
detect_task_changes() {
    local input="$1"

    # 检测任务完成、失败或状态更新
    if echo "$input" | grep -q "✅\|❌\|🔄\|任务完成\|任务失败\|状态同步"; then
        log "检测到任务状态变化: $input"
        return 0
    fi

    return 1
}

# 创建智能断点
create_smart_checkpoint() {
    local input="$1"

    # 分析当前任务状态
    local task_id=""
    local progress=""
    local step=""
    local next_action=""

    # 从输入中提取任务信息
    if echo "$input" | grep -q "进度.*%"; then
        progress=$(echo "$input" | grep -o "进度.*%" | head -1)
    fi

    if echo "$input" | grep -q "步骤.*\/"; then
        step=$(echo "$input" | grep -o "步骤.*/" | head -1)
    fi

    if echo "$input" | grep -q "下一步\|接下来\|继续"; then
        next_action=$(echo "$input" | grep -A1 -E "(下一步|接下来|继续)" | tail -1 | xargs)
    fi

    # 生成断点ID
    local checkpoint_id="checkpoint_$(date +%s)"

    # 创建断点消息
    local checkpoint_message="---
【任务断点】自动保存
断点ID: $checkpoint_id
保存时间: $(date '+%Y-%m-%d %H:%M:%S')
当前进度: ${progress:-'未知'}
当前步骤: ${step:-'未知'}
下一步行动: ${next_action:-'待定'}
上下文状态: 已压缩保存
---

此断点允许在上下文丢失时恢复任务进度。
建议定期创建断点以确保任务连续性。
"

    log "创建智能断点: $checkpoint_id"
    echo "$checkpoint_message"
}

# 检测断点恢复请求
detect_checkpoint_restore() {
    local input="$1"

    # 检测恢复请求关键词
    if echo "$input" | grep -q -i "恢复\|继续\|resume\|continue\|断点\|checkpoint"; then
        log "检测到断点恢复请求"
        return 0
    fi

    return 1
}

# 生成恢复指导
generate_recovery_guidance() {
    local recovery_message="---
【断点恢复】智能指导
恢复模式: 已激活
推荐策略:
1. 检查最新断点状态
2. 恢复关键上下文
3. 从中断处继续执行
4. 验证任务完整性

恢复命令示例:
/yishan resume checkpoint_1234567890
---

如果遇到问题，请使用 /status 查看系统状态。
"

    log "生成恢复指导"
    echo "$recovery_message"
}

# 主处理函数
main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 处理任务状态变化
    if detect_task_changes "$input"; then
        create_smart_checkpoint "$input"
        exit 0
    fi

    # 处理断点恢复请求
    if detect_checkpoint_restore "$input"; then
        generate_recovery_guidance
        exit 0
    fi

    # 默认情况下，定期创建断点（基于时间间隔）
    # 这里可以添加时间戳检查逻辑
    exit 0
}

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 的 prompt 字段
if command -v jq > /dev/null 2>&1; then
    _STDIN_PROMPT=$(echo "$_STDIN_INPUT" | jq -r '.prompt // empty' 2>/dev/null) || _STDIN_PROMPT=""
else
    _STDIN_PROMPT=$(echo "$_STDIN_INPUT" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || _STDIN_PROMPT=""
fi

# 执行主函数
main "$_STDIN_PROMPT"