#!/usr/bin/env bash
# Agent Ready Notification Hook
# 功能：在 Agent 停止等待用户输入时发送 OS 级通知
# 类似 OpenCode 的 "Agent is ready for input" 通知
# 触发时机：Stop hook

# 环境变量
HOOK_NAME="agent-ready-notification"
STOP_REASON="${CLAUDE_STOP_REASON:-}"
SESSION_ID="${CLAUDE_SESSION_ID:-}"

# 配置 - 可通过环境变量自定义
NOTIFICATION_ENABLED="${OH_MY_CLAUDE_NOTIFICATIONS:-true}"
NOTIFICATION_SOUND="${OH_MY_CLAUDE_NOTIFICATION_SOUND:-true}"
# 最小间隔（秒）- 避免频繁通知
MIN_NOTIFICATION_INTERVAL="${OH_MY_CLAUDE_NOTIFICATION_INTERVAL:-30}"

# 状态文件（用于防止重复通知）
STATE_DIR="${HOME}/.oh-my-claude/state"
LAST_NOTIFICATION_FILE="${STATE_DIR}/last_agent_ready_notification"

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
        notify-send "$title" "$message" --icon=dialog-information --urgency=normal 2>/dev/null
    fi
}

# Windows 通知 (PowerShell)
send_windows_notification() {
    local title="$1"
    local message="$2"
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # 将 Git Bash 路径转换为 Windows 路径
    # /d/projects/... -> D:/projects/...
    local win_script_dir
    if command -v cygpath > /dev/null 2>&1; then
        win_script_dir=$(cygpath -w "$script_dir")
    else
        # 手动转换: /c/path -> C:/path
        win_script_dir=$(echo "$script_dir" | sed 's|^/\([a-zA-Z]\)/|\1:/|')
    fi

    # 使用专用 PowerShell 脚本
    if [ -f "$script_dir/notify-windows.ps1" ]; then
        powershell.exe -ExecutionPolicy Bypass -File "$win_script_dir/notify-windows.ps1" -Title "$title" -Message "$message" 2>/dev/null && return
    fi

    # 回退方案：使用 BalloonTip
    powershell.exe -Command "
        Add-Type -AssemblyName System.Windows.Forms
        \$balloon = New-Object System.Windows.Forms.NotifyIcon
        \$balloon.Icon = [System.Drawing.SystemIcons]::Information
        \$balloon.BalloonTipIcon = 'Info'
        \$balloon.BalloonTipTitle = '$title'
        \$balloon.BalloonTipText = '$message'
        \$balloon.Visible = \$true
        \$balloon.ShowBalloonTip(5000)
        Start-Sleep -Milliseconds 500
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
# 辅助函数
# ============================================================================

# 检查是否应该发送通知（防止频繁通知）
should_send_notification() {
    # 确保状态目录存在
    mkdir -p "$STATE_DIR" 2>/dev/null

    # 检查上次通知时间
    if [ -f "$LAST_NOTIFICATION_FILE" ]; then
        local last_time
        last_time=$(cat "$LAST_NOTIFICATION_FILE" 2>/dev/null || echo "0")
        local current_time
        current_time=$(date +%s)
        local elapsed=$((current_time - last_time))

        if [ "$elapsed" -lt "$MIN_NOTIFICATION_INTERVAL" ]; then
            return 1  # 间隔太短，不发送
        fi
    fi

    # 记录当前时间
    date +%s > "$LAST_NOTIFICATION_FILE" 2>/dev/null
    return 0
}

# 获取通知消息
get_notification_message() {
    local reason="$1"

    # 根据停止原因定制消息
    case "$reason" in
        "end_turn")
            echo "Agent 已准备就绪，等待您的输入"
            ;;
        "tool_use")
            echo "Agent 完成工具调用，等待继续"
            ;;
        "max_tokens")
            echo "响应达到长度限制，可能需要继续"
            ;;
        *)
            echo "Agent 已准备就绪"
            ;;
    esac
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 检查通知是否启用
    if [ "$NOTIFICATION_ENABLED" != "true" ]; then
        exit 0
    fi

    # 检查是否应该发送（间隔限制）
    if ! should_send_notification; then
        exit 0
    fi

    # 获取通知消息
    local message
    message=$(get_notification_message "$STOP_REASON")

    # 发送通知
    send_notification "🤖 oh-my-claude" "$message"
}

# 执行
main
