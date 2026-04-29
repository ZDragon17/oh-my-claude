#!/usr/bin/env bash

# auto-update-checker.sh - 自动更新检查器
# 检查 oh-my-claude 是否有新版本可用
# 对标 oh-my-opencode 的 auto-update-checker hook

UPDATE_LOG="$HOME/.oh-my-claude/logs/auto-update.log"
UPDATE_STATE="$HOME/.oh-my-claude/state/update-state.json"
UPDATE_CACHE="$HOME/.oh-my-claude/cache/update"

# 确保目录存在
mkdir -p "$(dirname "$UPDATE_LOG")" 2>/dev/null
mkdir -p "$(dirname "$UPDATE_STATE")" 2>/dev/null
mkdir -p "$UPDATE_CACHE" 2>/dev/null

# 配置
PACKAGE_NAME="claude-pangu"
GITHUB_REPO="ZDragon17/oh-my-claude"
CHECK_INTERVAL_HOURS="${OH_MY_CLAUDE_UPDATE_CHECK_INTERVAL:-24}"
AUTO_UPDATE="${OH_MY_CLAUDE_AUTO_UPDATE:-true}"  # 默认开启自动更新

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$UPDATE_LOG"
}

# ==================== 安装检测 ====================

# 检测插件是否已安装
is_plugin_installed() {
    # 1. 检查全局 npm 安装
    if command -v npm &> /dev/null; then
        if npm list -g "$PACKAGE_NAME" &>/dev/null 2>&1; then
            log "检测到全局 npm 安装"
            return 0
        fi
    fi

    # 2. 检查 Claude 插件目录
    local plugin_dir="$HOME/.claude/plugins/oh-my-claude"
    if [ -d "$plugin_dir" ] && [ -f "$plugin_dir/.claude-plugin/plugin.json" ]; then
        log "检测到插件目录安装"
        return 0
    fi

    # 3. 检查当前脚本是否在 node_modules 中运行（npx 方式）
    local script_path=$(readlink -f "$0" 2>/dev/null || echo "$0")
    if echo "$script_path" | grep -q "node_modules"; then
        log "检测到 npx/node_modules 安装"
        return 0
    fi

    # 4. 检查当前是否在 oh-my-claude 项目目录运行
    local script_dir=$(dirname "$script_path")
    local pkg_json="$script_dir/../package.json"
    if [ -f "$pkg_json" ] && grep -q '"name":\s*"claude-pangu"' "$pkg_json" 2>/dev/null; then
        log "检测到本地开发环境"
        return 0
    fi

    log "未检测到插件安装"
    return 1
}

# ==================== 版本检查 ====================

# 获取当前安装版本
get_current_version() {
    # 尝试从 package.json 读取
    local pkg_version=""

    # 1. 检查全局安装
    if command -v npm &> /dev/null; then
        pkg_version=$(npm list -g "$PACKAGE_NAME" 2>/dev/null | grep "$PACKAGE_NAME@" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    fi

    # 2. 检查本地 package.json
    if [ -z "$pkg_version" ]; then
        local script_dir=$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")
        local pkg_json="$script_dir/../package.json"

        if [ -f "$pkg_json" ]; then
            pkg_version=$(grep '"version"' "$pkg_json" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        fi
    fi

    # 3. 检查插件目录
    if [ -z "$pkg_version" ]; then
        local plugin_json="$HOME/.claude/plugins/oh-my-claude/.claude-plugin/plugin.json"
        if [ -f "$plugin_json" ]; then
            pkg_version=$(grep '"version"' "$plugin_json" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        fi
    fi

    echo "${pkg_version:-unknown}"
}

# 获取最新版本（从 npm）
get_latest_npm_version() {
    if command -v npm &> /dev/null; then
        npm view "$PACKAGE_NAME" version 2>/dev/null
    fi
}

# 获取最新版本（从 GitHub）
get_latest_github_version() {
    local cache_file="$UPDATE_CACHE/latest_version.txt"
    local cache_age=3600  # 1 小时缓存

    # 检查缓存
    if [ -f "$cache_file" ]; then
        local file_age=$(( $(date +%s) - $(stat -f%m "$cache_file" 2>/dev/null || stat --format=%Y "$cache_file" 2>/dev/null || echo 0) ))
        if [ "$file_age" -lt "$cache_age" ]; then
            cat "$cache_file"
            return 0
        fi
    fi

    # 从 GitHub API 获取
    local latest=""
    if command -v curl &> /dev/null; then
        latest=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest" 2>/dev/null | grep '"tag_name"' | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | tr -d 'v')
    fi

    if [ -n "$latest" ]; then
        echo "$latest" > "$cache_file"
        echo "$latest"
    fi
}

# 比较版本号
compare_versions() {
    local current="$1"
    local latest="$2"

    if [ "$current" = "unknown" ] || [ -z "$current" ]; then
        echo "unknown"
        return
    fi

    if [ -z "$latest" ]; then
        echo "error"
        return
    fi

    # 将版本号转换为数字进行比较
    local current_num=$(echo "$current" | awk -F. '{ printf("%d%03d%03d\n", $1, $2, $3) }')
    local latest_num=$(echo "$latest" | awk -F. '{ printf("%d%03d%03d\n", $1, $2, $3) }')

    if [ "$current_num" -lt "$latest_num" ]; then
        echo "outdated"
    elif [ "$current_num" -gt "$latest_num" ]; then
        echo "ahead"
    else
        echo "current"
    fi
}

# ==================== 更新状态管理 ====================

# 获取上次检查时间
get_last_check_time() {
    if [ -f "$UPDATE_STATE" ]; then
        grep -o '"last_check":\s*"[^"]*"' "$UPDATE_STATE" | cut -d'"' -f4
    fi
}

# 检查是否需要检查更新
should_check_update() {
    local last_check=$(get_last_check_time)

    if [ -z "$last_check" ]; then
        return 0
    fi

    # 计算时间差（小时）
    local last_ts=$(date -d "$last_check" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$last_check" +%s 2>/dev/null || echo 0)
    local now_ts=$(date +%s)
    local hours_diff=$(( (now_ts - last_ts) / 3600 ))

    [ "$hours_diff" -ge "$CHECK_INTERVAL_HOURS" ]
}

# 保存更新状态
save_update_state() {
    local current="$1"
    local latest="$2"
    local status="$3"

    cat > "$UPDATE_STATE" << EOF
{
  "current_version": "$current",
  "latest_version": "$latest",
  "status": "$status",
  "last_check": "$(date -Iseconds 2>/dev/null || date \"+%Y-%m-%dT%H:%M:%S%z\" 2>/dev/null || date \"+%Y-%m-%dT%H:%M:%S\")",
  "check_interval_hours": $CHECK_INTERVAL_HOURS
}
EOF

    log "更新状态已保存: $status (current=$current, latest=$latest)"
}

# ==================== 更新操作 ====================

# 检查更新
check_for_update() {
    log "开始检查更新..."

    local current=$(get_current_version)
    local latest=$(get_latest_npm_version)

    # 如果 npm 获取失败，尝试 GitHub
    if [ -z "$latest" ]; then
        latest=$(get_latest_github_version)
    fi

    local status=$(compare_versions "$current" "$latest")

    save_update_state "$current" "$latest" "$status"

    echo "---"
    echo "🔄 更新检查"
    echo ""
    echo "📊 版本信息:"
    echo "   • 当前版本: $current"
    echo "   • 最新版本: ${latest:-获取失败}"
    echo ""

    case "$status" in
        "outdated")
            echo "⚠️ 有新版本可用!"
            echo ""
            echo "📋 更新方式:"
            echo "   npm: npm update -g $PACKAGE_NAME"
            echo "   npx: npx $PACKAGE_NAME update"
            echo ""
            echo "📋 查看更新日志:"
            echo "   https://github.com/$GITHUB_REPO/releases"
            ;;
        "current")
            echo "✅ 已是最新版本"
            ;;
        "ahead")
            echo "🔮 当前版本领先于发布版本 (开发版?)"
            ;;
        "unknown")
            echo "❓ 无法确定版本状态"
            ;;
        "error")
            echo "❌ 检查更新失败，请检查网络连接"
            ;;
    esac

    echo "---"
}

# 执行更新
perform_update() {
    log "执行更新..."

    echo "---"
    echo "🔄 执行更新"
    echo ""

    if command -v npm &> /dev/null; then
        echo "📦 使用 npm 更新..."
        echo ""

        # 检查是否为全局安装
        if npm list -g "$PACKAGE_NAME" &>/dev/null; then
            echo "🔄 更新全局安装..."
            npm update -g "$PACKAGE_NAME"
        else
            echo "📥 全局安装最新版本..."
            npm install -g "$PACKAGE_NAME"
        fi

        echo ""
        echo "✅ 更新完成!"
        echo ""

        # 重新检查版本
        local new_version=$(get_current_version)
        echo "📊 当前版本: $new_version"
    else
        echo "⚠️ npm 不可用"
        echo ""
        echo "📋 手动更新方式:"
        echo "   1. 安装 Node.js 和 npm"
        echo "   2. 运行: npm install -g $PACKAGE_NAME"
        echo ""
        echo "   或使用 npx:"
        echo "   npx $PACKAGE_NAME update"
    fi

    echo "---"
}

# 显示更新历史
show_update_history() {
    echo "---"
    echo "📜 更新历史"
    echo ""

    if [ -f "$UPDATE_LOG" ]; then
        echo "📋 最近 10 条记录:"
        tail -10 "$UPDATE_LOG"
    else
        echo "💡 暂无更新记录"
    fi

    echo "---"
}

# ==================== 自动更新逻辑 ====================

# 后台静默更新（非阻塞）
background_update() {
    local current="$1"
    local latest="$2"

    # 创建后台更新脚本
    local bg_script="$UPDATE_CACHE/background-update-$$.sh"

    cat > "$bg_script" << 'BGEOF'
#!/bin/bash
LOG_FILE="$1"
PACKAGE="$2"
CURRENT="$3"
LATEST="$4"
DONE_FILE="$5"

log_bg() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BG] $*" >> "$LOG_FILE"
}

log_bg "后台更新开始: $CURRENT → $LATEST"

if npm update -g "$PACKAGE" >> "$LOG_FILE" 2>&1; then
    log_bg "后台更新成功"
    echo "success" > "$DONE_FILE"
else
    log_bg "后台更新失败"
    echo "failed" > "$DONE_FILE"
fi
BGEOF

    chmod +x "$bg_script"

    # 后台执行，不阻塞当前进程
    local done_file="$UPDATE_CACHE/update-done-$$.txt"
    nohup "$bg_script" "$UPDATE_LOG" "$PACKAGE_NAME" "$current" "$latest" "$done_file" > /dev/null 2>&1 &

    log "后台更新已启动 (PID: $!)"

    # 保存更新状态
    echo "$!" > "$UPDATE_CACHE/update-pid.txt"
    echo "$latest" > "$UPDATE_CACHE/updating-to.txt"
}

# 检查后台更新是否完成
check_background_update_result() {
    local pid_file="$UPDATE_CACHE/update-pid.txt"
    local target_file="$UPDATE_CACHE/updating-to.txt"

    if [ ! -f "$pid_file" ]; then
        return 1
    fi

    local pid=$(cat "$pid_file" 2>/dev/null)
    local done_file="$UPDATE_CACHE/update-done-${pid}.txt"

    # 检查进程是否还在运行
    if kill -0 "$pid" 2>/dev/null; then
        # 仍在更新中
        return 2
    fi

    # 进程已结束，检查结果
    if [ -f "$done_file" ]; then
        local result=$(cat "$done_file")
        local target=$(cat "$target_file" 2>/dev/null)

        # 清理状态文件
        rm -f "$pid_file" "$target_file" "$done_file" 2>/dev/null

        if [ "$result" = "success" ]; then
            echo ""
            echo "---"
            echo "✅ oh-my-claude 后台更新完成! 版本: $target"
            echo "---"
            echo ""
            log "后台更新完成通知已显示"
            return 0
        else
            echo ""
            echo "---"
            echo "⚠️ oh-my-claude 后台更新失败"
            echo "   请手动执行: npm update -g $PACKAGE_NAME"
            echo "---"
            echo ""
            return 1
        fi
    fi

    return 1
}

# 自动检查更新（静默）
auto_check_update() {
    # 首先检查之前的后台更新是否完成
    check_background_update_result

    # 检查插件是否安装
    if ! is_plugin_installed; then
        log "插件未安装，跳过更新检查"
        return 0
    fi

    # 检查是否有正在进行的后台更新
    local pid_file="$UPDATE_CACHE/update-pid.txt"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if kill -0 "$pid" 2>/dev/null; then
            log "后台更新正在进行中 (PID: $pid)，跳过本次检查"
            return 0
        fi
    fi

    # 检查是否需要检查（时间间隔）
    if ! should_check_update; then
        return 0
    fi

    log "自动检查更新触发"

    local current=$(get_current_version)
    local latest=$(get_latest_npm_version)

    if [ -z "$latest" ]; then
        latest=$(get_latest_github_version)
    fi

    local status=$(compare_versions "$current" "$latest")

    save_update_state "$current" "$latest" "$status"

    # 如果有更新
    if [ "$status" = "outdated" ]; then
        if [ "$AUTO_UPDATE" = "true" ]; then
            # 自动更新模式：后台静默更新（非阻塞）
            echo ""
            echo "---"
            echo "🔄 oh-my-claude 发现新版本: $current → $latest"
            echo "   正在后台自动更新，不影响当前操作..."
            echo "---"
            echo ""

            # 启动后台更新
            background_update "$current" "$latest"
        else
            # 非自动更新模式：只显示提示
            echo ""
            echo "---"
            echo "🔔 oh-my-claude 有新版本可用!"
            echo "   当前: $current → 最新: $latest"
            echo "   更新: npm update -g $PACKAGE_NAME"
            echo "   (设置 OH_MY_CLAUDE_AUTO_UPDATE=true 启用自动更新)"
            echo "---"
            echo ""
        fi
    fi
}

# ==================== 帮助信息 ====================

show_help() {
    echo "---"
    echo "🔄 自动更新检查器"
    echo ""
    echo "📋 功能:"
    echo "   • 自动检查 oh-my-claude 更新"
    echo "   • 版本比较和更新提示"
    echo "   • 一键更新命令"
    echo ""
    echo "📋 命令:"
    echo "   /update check    - 检查更新"
    echo "   /update install  - 执行更新"
    echo "   /update history  - 查看历史"
    echo "   /update help     - 显示帮助"
    echo ""
    echo "📋 配置:"
    echo "   检查间隔: $CHECK_INTERVAL_HOURS 小时"
    echo "   自动更新: $AUTO_UPDATE (默认开启)"
    echo ""
    echo "📋 环境变量:"
    echo "   OH_MY_CLAUDE_UPDATE_CHECK_INTERVAL=24  # 检查间隔（小时）"
    echo "   OH_MY_CLAUDE_AUTO_UPDATE=true          # 自动更新开关"
    echo ""
    echo "📋 自动更新说明:"
    echo "   • 启动时自动检测插件是否安装"
    echo "   • 已安装且有新版本：后台自动更新（非阻塞）"
    echo "   • 更新在后台执行，不影响当前操作"
    echo "   • 下次启动时会显示更新结果"
    echo "   • 未安装：静默跳过"
    echo "   • 禁用自动更新: export OH_MY_CLAUDE_AUTO_UPDATE=false"
    echo "---"
}

# ==================== 命令检测 ====================

detect_update_commands() {
    local input="$1"

    # 更新相关命令
    if echo "$input" | grep -qiE "(更新|update|upgrade|版本|version)"; then
        return 0
    fi

    return 1
}

# ==================== SessionStart 专用函数 ====================

# SessionStart 时的快速检查和自动更新
# 特点：
# 1. 非阻塞 - 不影响启动速度
# 2. 静默 - 只在有更新时才显示消息
# 3. 自动更新 - 后台执行更新
session_start_check() {
    log "SessionStart 触发自动更新检查"
    
    # 首先检查之前的后台更新是否完成
    check_background_update_result
    
    # 检查插件是否安装
    if ! is_plugin_installed; then
        log "插件未安装，跳过更新检查"
        return 0
    fi
    
    # 检查是否有正在进行的后台更新
    local pid_file="$UPDATE_CACHE/update-pid.txt"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if kill -0 "$pid" 2>/dev/null; then
            log "后台更新正在进行中 (PID: $pid)，跳过本次检查"
            return 0
        fi
    fi
    
    # 检查是否需要检查（时间间隔）- SessionStart 时使用较短的间隔检查
    # 但如果距离上次检查不足 1 小时，则跳过
    local last_check=$(get_last_check_time)
    if [ -n "$last_check" ]; then
        local last_ts=$(date -d "$last_check" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$last_check" +%s 2>/dev/null || echo 0)
        local now_ts=$(date +%s)
        local hours_diff=$(( (now_ts - last_ts) / 3600 ))
        
        if [ "$hours_diff" -lt 1 ]; then
            log "距离上次检查不足 1 小时，跳过"
            return 0
        fi
    fi
    
    log "开始 SessionStart 更新检查"
    
    local current=$(get_current_version)
    local latest=$(get_latest_npm_version)
    
    if [ -z "$latest" ]; then
        latest=$(get_latest_github_version)
    fi
    
    local status=$(compare_versions "$current" "$latest")
    
    save_update_state "$current" "$latest" "$status"
    
    # 如果有更新且启用了自动更新
    if [ "$status" = "outdated" ]; then
        if [ "$AUTO_UPDATE" = "true" ]; then
            # 输出 JSON 格式的 systemMessage，在启动时显示更新提示
            cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "🔄 oh-my-claude 发现新版本: $current → $latest，正在后台自动更新..."
  }
}
EOF
            # 启动后台更新
            background_update "$current" "$latest"
        else
            # 非自动更新模式：只显示提示
            cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "🔔 oh-my-claude 有新版本可用! 当前: $current → 最新: $latest。更新命令: npm update -g $PACKAGE_NAME"
  }
}
EOF
        fi
    else
        log "当前已是最新版本或无法确定版本状态: $status"
    fi
    
    return 0
}

# ==================== 主函数 ====================

main() {
    local input="$1"

    # 检查是否是 SessionStart 模式
    if [ "$input" = "--session-start" ]; then
        session_start_check
        exit 0
    fi

    if [ -z "$input" ]; then
        # 无输入时，执行自动检查
        auto_check_update
        exit 0
    fi

    # 检测更新命令
    if detect_update_commands "$input"; then
        log "检测到更新命令"

        # 帮助
        if echo "$input" | grep -qiE "(help|帮助)"; then
            show_help
            exit 0
        fi

        # 检查更新
        if echo "$input" | grep -qiE "(check|检查)"; then
            check_for_update
            exit 0
        fi

        # 执行更新
        if echo "$input" | grep -qiE "(install|安装|执行|upgrade)"; then
            perform_update
            exit 0
        fi

        # 查看历史
        if echo "$input" | grep -qiE "(history|历史|记录)"; then
            show_update_history
            exit 0
        fi

        # 默认检查更新
        check_for_update
        exit 0
    fi

    # 自动检查
    auto_check_update

    exit 0
}

# 检查是否通过命令行参数调用（如 SessionStart 的 --session-start）
if [ $# -gt 0 ]; then
    main "$@"
    exit $?
fi

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 的 prompt 字段（UserPromptSubmit 事件）
if command -v jq > /dev/null 2>&1; then
    _STDIN_PROMPT=$(echo "$_STDIN_INPUT" | jq -r '.prompt // empty' 2>/dev/null) || _STDIN_PROMPT=""
else
    _STDIN_PROMPT=$(echo "$_STDIN_INPUT" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || _STDIN_PROMPT=""
fi

# 执行主函数
main "$_STDIN_PROMPT"
