#!/usr/bin/env bash
# ============================================================================
# 失败透明化 - Failure Transparency Hook (PostToolUse)
# ============================================================================
# 解决问题：用户不知道系统在做什么（失败计数、回滚）
#
# 功能：
# 1. 追踪同一任务的失败次数
# 2. 显示当前失败计数（第X次/3次）
# 3. 回滚时通知用户
# 4. 3次失败后提供升级建议
#
# 触发条件：PostToolUse 中检测到错误信号
# ============================================================================

# 配置
FAILURE_STATE_DIR="$HOME/.oh-my-claude/state"
FAILURE_COUNT_FILE="$FAILURE_STATE_DIR/failure-count.json"
MAX_FAILURES=3

# 确保状态目录存在
mkdir -p "$FAILURE_STATE_DIR" 2>/dev/null

# 加载去重库（如果存在）
# 使用 BASH_SOURCE 确保在 source 执行时也能正确获取脚本路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)"
if [ -f "$SCRIPT_DIR/lib/message-dedup.sh" ]; then
    . "$SCRIPT_DIR/lib/message-dedup.sh"
    USE_DEDUP=1
else
    USE_DEDUP=0
fi

# 带去重的消息输出
safe_printf() {
    local message="$1"
    if [ "$USE_DEDUP" -eq 1 ]; then
        if should_show_message "$message"; then
            printf '%s\n' "$message"
        fi
    else
        printf '%s\n' "$message"
    fi
}

# 读取 stdin
input=$(cat 2>/dev/null) || input=""

# 如果输入为空，静默退出
if [ -z "$input" ]; then
    exit 0
fi

# ============================================================================
# 工具函数
# ============================================================================

# 检测是否有错误
has_error() {
    local content="$1"

    # 检测各种错误信号
    echo "$content" | grep -qiE 'error|failed|failure|exception|❌|错误|失败|异常|cannot|unable|denied|refused'
}

# 检测是否是回滚操作
is_rollback() {
    local content="$1"

    echo "$content" | grep -qiE 'rollback|revert|undo|回滚|撤销|恢复到|git checkout|git reset'
}

# 获取任务标识（用于追踪同一任务的失败）
# 改进：使用工具名称 + 操作内容的哈希，更精确地追踪同一操作
get_task_id() {
    local content="$1"
    local tool="$2"

    # 提取操作的关键信息（去除时间戳等变化内容）
    # 保留：文件路径、错误类型、操作类型
    local key_info=$(echo "$content" | \
        grep -oE '(/[a-zA-Z0-9_/.-]+\.[a-z]+|Error|error|failed|cannot|unable)' | \
        head -5 | sort | tr '\n' '_')

    # 添加工具名称
    key_info="${tool}_${key_info}"

    # 计算哈希
    if command -v md5sum > /dev/null 2>&1; then
        echo "$key_info" | md5sum | cut -c1-16
    elif command -v md5 > /dev/null 2>&1; then
        echo "$key_info" | md5 | cut -c1-16
    else
        # 降级：使用内容长度和前缀
        local len=${#key_info}
        echo "task_${len}_$(echo "$key_info" | head -c 20 | tr -d ' \n/' | tr -c 'a-zA-Z0-9' '_')"
    fi
}

# 读取失败计数
read_failure_count() {
    local task_id="$1"

    if [ -f "$FAILURE_COUNT_FILE" ] && command -v jq > /dev/null 2>&1; then
        count=$(jq -r --arg id "$task_id" '.[$id] // 0' "$FAILURE_COUNT_FILE" 2>/dev/null)
        echo "${count:-0}"
    else
        echo "0"
    fi
}

# 更新失败计数
update_failure_count() {
    local task_id="$1"
    local new_count="$2"

    if command -v jq > /dev/null 2>&1; then
        # 读取现有数据或创建空对象
        if [ -f "$FAILURE_COUNT_FILE" ]; then
            existing=$(cat "$FAILURE_COUNT_FILE" 2>/dev/null)
        else
            existing="{}"
        fi

        # 更新计数
        echo "$existing" | jq --arg id "$task_id" --argjson count "$new_count" '. + {($id): $count}' > "$FAILURE_COUNT_FILE" 2>/dev/null
    fi
}

# 重置失败计数
reset_failure_count() {
    local task_id="$1"

    if [ -f "$FAILURE_COUNT_FILE" ] && command -v jq > /dev/null 2>&1; then
        existing=$(cat "$FAILURE_COUNT_FILE" 2>/dev/null)
        echo "$existing" | jq --arg id "$task_id" 'del(.[$id])' > "$FAILURE_COUNT_FILE" 2>/dev/null
    fi
}

# ============================================================================
# 主逻辑
# ============================================================================

# 提取工具输出内容
if command -v jq > /dev/null 2>&1; then
    tool_name=$(echo "$input" | jq -r '.tool_name // .toolName // empty' 2>/dev/null)
    tool_output=$(echo "$input" | jq -r '.tool_output // .output // empty' 2>/dev/null)
    tool_error=$(echo "$input" | jq -r '.error // .tool_error // empty' 2>/dev/null)
else
    tool_output="$input"
    tool_error=""
    tool_name=""
fi

# 合并内容用于检测
content="$tool_output $tool_error"

# 获取任务ID
task_id=$(get_task_id "$content")

# 检测回滚操作
if is_rollback "$content"; then
    # 通知用户回滚（使用去重）
    safe_printf '{"systemMessage":"\\n🔄 **代码已自动回滚到上次成功状态**\\n\\n如需查看回滚内容，可以运行:\\n• git diff HEAD~1 （查看回滚差异）\\n• git log -3 （查看最近提交）\\n"}'
    exit 0
fi

# 检测错误
if has_error "$content"; then
    # 获取当前失败计数
    current_count=$(read_failure_count "$task_id")
    new_count=$((current_count + 1))

    # 更新失败计数
    update_failure_count "$task_id" "$new_count"

    # 根据失败次数提供不同的反馈（使用去重）
    if [ "$new_count" -ge "$MAX_FAILURES" ]; then
        # 达到最大失败次数
        msg=$(printf '{"systemMessage":"\\n🔴 **重复失败检测** [第 %d 次/%d 次]\\n\\n同一操作已失败 %d 次，继续重试可能无效。\\n\\n💡 **升级建议**:\\n• /bianque - 让扁鹊进行深度诊断\\n• /zhuge - 让诸葛重新评估方案\\n• 描述具体问题，我来分析\\n\\n⚠️ 建议换一种策略解决问题\\n"}' \
            "$new_count" "$MAX_FAILURES" "$new_count")
        safe_printf "$msg"

        # 重置计数（用户已被警告）
        reset_failure_count "$task_id"
    elif [ "$new_count" -eq 2 ]; then
        # 第二次失败
        msg=$(printf '{"systemMessage":"\\n⚠️ **修复尝试失败** [第 %d 次/%d 次]\\n\\n📊 还有 %d 次自动重试机会\\n\\n💡 快速选项:\\n• 继续当前策略（还剩 %d 次）\\n• /bianque 让诊断专家介入\\n"}' \
            "$new_count" "$MAX_FAILURES" "$((MAX_FAILURES - new_count))" "$((MAX_FAILURES - new_count))")
        safe_printf "$msg"
    else
        # 第一次失败
        msg=$(printf '{"systemMessage":"\\n⚠️ **操作遇到问题** [第 %d 次/%d 次]\\n\\n正在尝试解决...\\n"}' \
            "$new_count" "$MAX_FAILURES")
        safe_printf "$msg"
    fi
else
    # 操作成功，重置失败计数
    if [ -f "$FAILURE_COUNT_FILE" ]; then
        reset_failure_count "$task_id"
    fi
fi

exit 0
