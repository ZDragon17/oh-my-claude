#!/usr/bin/env bash
# Session Notification Hook
# 功能：在重要事件发生时发送 OS 级通知
# 支持 macOS、Linux (notify-send)、Windows (PowerShell)

# 环境变量
HOOK_NAME="session-notification"

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$_STDIN_INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$_STDIN_INPUT" | jq -r '(.tool_output // empty) | if type == "object" then tostring else . end' 2>/dev/null) || TOOL_OUTPUT=""
    SESSION_ID=$(echo "$_STDIN_INPUT" | jq -r '.session_id // empty' 2>/dev/null) || SESSION_ID=""
else
    TOOL_NAME=$(echo "$_STDIN_INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$_STDIN_INPUT" | grep -o '"tool_output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_OUTPUT=""
    SESSION_ID=$(echo "$_STDIN_INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || SESSION_ID=""
fi

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

    # 转义双引号和反斜杠以防止 osascript 命令注入
    title="${title//\\/\\\\}"
    title="${title//\"/\\\"}"
    message="${message//\\/\\\\}"
    message="${message//\"/\\\"}"

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

# Windows 通知 (PowerShell) - 使用专用脚本实现多种回退方式
send_windows_notification() {
    local title="$1"
    local message="$2"
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # 方法 1: 使用专用 PowerShell 脚本（支持多种通知方式）
    if [ -f "$script_dir/notify-windows.ps1" ]; then
        powershell.exe -ExecutionPolicy Bypass -File "$script_dir/notify-windows.ps1" -Title "$title" -Message "$message" 2>/dev/null && return
    fi

    # 方法 2: 使用 PowerShell BalloonTip（更可靠）
    powershell.exe -Command "
        Add-Type -AssemblyName System.Windows.Forms
        \$balloon = New-Object System.Windows.Forms.NotifyIcon
        \$balloon.Icon = [System.Drawing.SystemIcons]::Information
        \$balloon.BalloonTipIcon = 'Info'
        \$balloon.BalloonTipTitle = '$title'
        \$balloon.BalloonTipText = '$message'
        \$balloon.Visible = \$true
        \$balloon.ShowBalloonTip(5000)
        Start-Sleep -Seconds 1
        \$balloon.Dispose()
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
    
    # 4. 愚公移山完成 - 检测更多完成标志
    if echo "$TOOL_OUTPUT" | grep -qiE '(移山完成|yishan complete|all todos completed|愚公移山.*任务完成|🎉.*愚公移山|100%.*完成)'; then
        send_notification "🏔️ oh-my-claude" "愚公移山模式已完成所有任务！"
    fi

    # 5. TodoWrite 全部完成检测
    if [ "$TOOL_NAME" = "TodoWrite" ]; then
        # 检测 todos 是否全部完成
        if echo "$TOOL_OUTPUT" | grep -qiE '(all.*completed|全部完成|100%)'; then
            send_notification "🏔️ oh-my-claude" "所有任务已完成！"
        fi
    fi

    # 6. 长时间运行任务完成
    if detect_long_running_complete "$TOOL_NAME" "$TOOL_OUTPUT"; then
        send_notification "oh-my-claude" "Long-running task completed"
    fi
}

# 执行
main
