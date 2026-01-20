#!/bin/bash
# Session Notification Hook
# 功能：在重要事件发生时发送 OS 级通知
# 支持 macOS、Linux (notify-send)、Windows (PowerShell)

# 环境变量
HOOK_NAME="session-notification"
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"
SESSION_ID="${CLAUDE_SESSION_ID:-}"

# 配置
NOTIFICATION_ENABLED="${OH_MY_CLAUDE_NOTIFICATIONS:-true}"
NOTIFICATION_SOUND="${OH_MY_CLAUDE_NOTIFICATION_SOUND:-true}"

# ============================================================================
# 通知发送函数
# ============================================================================

# macOS 通知
send_macos_notification() {
    local title="$1"
    local message="$2"
    local sound=""
    
    if [ "$NOTIFICATION_SOUND" = "true" ]; then
        sound='sound name "default"'
    fi
    
    osascript -e "display notification \"$message\" with title \"$title\" $sound" 2>/dev/null
}

# Linux 通知 (notify-send)
send_linux_notification() {
    local title="$1"
    local message="$2"
    
    if command -v notify-send &> /dev/null; then
        notify-send "$title" "$message" --icon=dialog-information 2>/dev/null
    fi
}

# Windows 通知 (PowerShell)
send_windows_notification() {
    local title="$1"
    local message="$2"
    
    powershell.exe -Command "
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > \$null
        \$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        \$textNodes = \$template.GetElementsByTagName('text')
        \$textNodes.Item(0).AppendChild(\$template.CreateTextNode('$title')) > \$null
        \$textNodes.Item(1).AppendChild(\$template.CreateTextNode('$message')) > \$null
        \$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('oh-my-claude')
        \$notifier.Show([Windows.UI.Notifications.ToastNotification]::new(\$template))
    " 2>/dev/null || true
}

# 跨平台通知发送
send_notification() {
    local title="$1"
    local message="$2"
    
    if [ "$NOTIFICATION_ENABLED" != "true" ]; then
        return
    fi
    
    # 检测操作系统
    case "$(uname -s)" in
        Darwin)
            send_macos_notification "$title" "$message"
            ;;
        Linux)
            send_linux_notification "$title" "$message"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            send_windows_notification "$title" "$message"
            ;;
        *)
            # 未知系统，尝试 notify-send
            send_linux_notification "$title" "$message"
            ;;
    esac
}

# ============================================================================
# 事件检测
# ============================================================================

# 检测任务完成
detect_task_completion() {
    local output="$1"
    
    # 检测常见的完成标志
    if echo "$output" | grep -qiE '(task completed|任务完成|all done|全部完成|successfully|成功)'; then
        return 0
    fi
    return 1
}

# 检测错误
detect_error() {
    local output="$1"
    
    # 检测常见的错误标志
    if echo "$output" | grep -qiE '(error|错误|failed|失败|exception|异常)'; then
        return 0
    fi
    return 1
}

# 检测长时间运行完成
detect_long_running_complete() {
    local tool="$1"
    local output="$2"
    
    # 检测 background_task 完成
    if [ "$tool" = "background_output" ]; then
        if echo "$output" | grep -qiE '(result|completed|done)'; then
            return 0
        fi
    fi
    
    # 检测构建完成
    if echo "$tool" | grep -qiE '(build|test|deploy)'; then
        if echo "$output" | grep -qiE '(success|passed|complete)'; then
            return 0
        fi
    fi
    
    return 1
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 检查是否有工具输出
    if [ -z "$TOOL_OUTPUT" ]; then
        exit 0
    fi
    
    # 检测并发送通知
    
    # 1. 后台任务完成
    if [ "$TOOL_NAME" = "background_output" ]; then
        if detect_task_completion "$TOOL_OUTPUT"; then
            send_notification "oh-my-claude" "Background task completed"
        fi
    fi
    
    # 2. 构建/测试完成
    if echo "$TOOL_NAME" | grep -qiE '(bash|command)'; then
        if echo "$TOOL_OUTPUT" | grep -qiE '(build|test|compile)' && detect_task_completion "$TOOL_OUTPUT"; then
            send_notification "oh-my-claude" "Build/Test completed"
        fi
    fi
    
    # 3. 错误通知
    if detect_error "$TOOL_OUTPUT"; then
        # 只在重要错误时通知，避免噪音
        if echo "$TOOL_OUTPUT" | grep -qiE '(fatal|critical|严重)'; then
            send_notification "oh-my-claude" "Critical error detected"
        fi
    fi
    
    # 4. 愚公移山完成
    if echo "$TOOL_OUTPUT" | grep -qiE '(移山完成|yishan complete|all todos completed)'; then
        send_notification "oh-my-claude" "Yishan mode completed all tasks!"
    fi
}

# 执行
main
