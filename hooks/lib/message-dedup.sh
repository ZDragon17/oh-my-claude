#!/usr/bin/env sh
# ============================================================================
# 消息去重工具库 - Message Deduplication Library
# ============================================================================
# 提供消息去重功能，避免多个 hook 输出重复的提示
#
# 使用方法：
#   source "$(dirname "$0")/lib/message-dedup.sh"
#   if should_show_message "unique_message_content"; then
#       printf '{"systemMessage":"..."}\n'
#   fi
# ============================================================================

# 配置
DEDUP_DIR="${HOME}/.oh-my-claude/.dedup"
DEDUP_TTL=60  # 消息去重有效期（秒）

# 初始化去重目录
init_dedup() {
    mkdir -p "$DEDUP_DIR" 2>/dev/null

    # 清理过期的去重记录（超过 TTL 的文件）
    if command -v find > /dev/null 2>&1; then
        find "$DEDUP_DIR" -type f -mmin +1 -delete 2>/dev/null
    fi
}

# 计算消息哈希（简单实现）
# $1: 消息内容
get_message_hash() {
    local message="$1"

    # 尝试使用 md5sum/md5
    if command -v md5sum > /dev/null 2>&1; then
        echo "$message" | md5sum | cut -d' ' -f1
    elif command -v md5 > /dev/null 2>&1; then
        echo "$message" | md5
    else
        # 降级：使用消息长度和前 20 字符
        local len=${#message}
        local prefix=$(echo "$message" | head -c 20 | tr -d '\n')
        echo "${len}_${prefix}" | tr ' ' '_'
    fi
}

# 检查消息是否应该显示（去重检查）
# $1: 消息内容
# 返回: 0 = 应该显示, 1 = 应该跳过（重复）
should_show_message() {
    local message="$1"

    init_dedup

    local hash=$(get_message_hash "$message")
    local dedup_file="$DEDUP_DIR/$hash"

    # 检查是否存在去重记录
    if [ -f "$dedup_file" ]; then
        # 消息已经显示过，跳过
        return 1
    else
        # 记录消息哈希
        date +%s > "$dedup_file" 2>/dev/null
        return 0
    fi
}

# 清除特定消息的去重记录（允许再次显示）
# $1: 消息内容
clear_dedup_for_message() {
    local message="$1"
    local hash=$(get_message_hash "$message")
    local dedup_file="$DEDUP_DIR/$hash"

    rm -f "$dedup_file" 2>/dev/null
}

# 清除所有去重记录
clear_all_dedup() {
    rm -rf "$DEDUP_DIR" 2>/dev/null
    mkdir -p "$DEDUP_DIR" 2>/dev/null
}

# 带去重的消息输出函数
# $1: systemMessage 内容（不包含 JSON 包装）
output_system_message() {
    local message="$1"

    if should_show_message "$message"; then
        printf '{"systemMessage":"%s"}\n' "$message"
    fi
}
