#!/usr/bin/env bash
# error-friendly-display.sh - 友好错误显示 Hook
# 检测工具执行错误，提供分层的用户友好错误信息
#
# 触发时机: PostToolUse
# 功能: 检测错误并根据用户偏好显示友好的错误信息
#
# 兼容性: macOS (bash 3.2+), Linux (bash 4.0+), Windows (Git Bash)

# PostToolUse Hook 必须容错 —— 任何内部错误应静默退出 0，不影响主流程
# 注意：不使用 set -e，因为 PostToolUse Hook 应该安静失败

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$_STDIN_INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$_STDIN_INPUT" | jq -r '(.tool_output // empty) | if type == "object" then tostring else . end' 2>/dev/null) || TOOL_OUTPUT=""
else
    TOOL_NAME=$(echo "$_STDIN_INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$_STDIN_INPUT" | grep -o '"tool_output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_OUTPUT=""
fi
EXIT_CODE="0"

# 状态文件
STATE_DIR="${HOME}/.oh-my-claude"
PREFS_FILE="${STATE_DIR}/preferences.json"

# 确保状态目录存在
mkdir -p "$STATE_DIR" 2>/dev/null || true

# 获取用户偏好的详细度
get_verbosity() {
    if [ -f "$PREFS_FILE" ]; then
        # 尝试用 jq 读取，如果没有 jq 则使用默认值
        if command -v jq >/dev/null 2>&1; then
            verbosity=$(jq -r '.preferences.verbosity // "normal"' "$PREFS_FILE" 2>/dev/null || echo "normal")
            echo "$verbosity"
            return
        fi
    fi
    echo "normal"
}

# 检测错误类型
# 使用多个 grep -qi 调用替代 -E 扩展正则，提高 macOS 兼容性
detect_error_type() {
    local output="$1"
    
    # 权限错误
    if echo "$output" | grep -qi "EACCES" || \
       echo "$output" | grep -qi "EPERM" || \
       echo "$output" | grep -qi "permission denied" || \
       echo "$output" | grep -qi "access denied"; then
        echo "permission"
        return
    fi
    
    # 文件不存在
    if echo "$output" | grep -qi "ENOENT" || \
       echo "$output" | grep -qi "no such file" || \
       echo "$output" | grep -qi "not found" || \
       echo "$output" | grep -qi "does not exist"; then
        echo "not_found"
        return
    fi
    
    # 网络错误
    if echo "$output" | grep -qi "ECONNREFUSED" || \
       echo "$output" | grep -qi "ETIMEDOUT" || \
       echo "$output" | grep -qi "network" || \
       echo "$output" | grep -qi "connection refused"; then
        echo "network"
        return
    fi
    
    # 语法错误
    if echo "$output" | grep -qi "SyntaxError" || \
       echo "$output" | grep -qi "ParseError" || \
       echo "$output" | grep -qi "unexpected token" || \
       echo "$output" | grep -qi "invalid syntax"; then
        echo "syntax"
        return
    fi
    
    # 类型错误
    if echo "$output" | grep -qi "TypeError" || \
       echo "$output" | grep -qi "cannot read" || \
       echo "$output" | grep -qi "undefined is not" || \
       echo "$output" | grep -qi "null is not"; then
        echo "type"
        return
    fi
    
    # 内存错误
    if echo "$output" | grep -qi "ENOMEM" || \
       echo "$output" | grep -qi "out of memory" || \
       echo "$output" | grep -qi "heap" || \
       echo "$output" | grep -qi "allocation failed"; then
        echo "memory"
        return
    fi
    
    # 磁盘空间
    if echo "$output" | grep -qi "ENOSPC" || \
       echo "$output" | grep -qi "no space" || \
       echo "$output" | grep -qi "disk full"; then
        echo "disk"
        return
    fi
    
    # 超时
    if echo "$output" | grep -qi "timeout" || \
       echo "$output" | grep -qi "timed out" || \
       echo "$output" | grep -qi "deadline exceeded"; then
        echo "timeout"
        return
    fi
    
    # Git 错误
    if echo "$output" | grep -qi "^fatal:" || \
       echo "$output" | grep -qi "git.*error" || \
       echo "$output" | grep -qi "merge conflict"; then
        echo "git"
        return
    fi
    
    # 依赖错误
    if echo "$output" | grep -qi "module not found" || \
       echo "$output" | grep -qi "cannot find module" || \
       echo "$output" | grep -qi "import error" || \
       echo "$output" | grep -qi "no module named"; then
        echo "dependency"
        return
    fi
    
    echo "unknown"
}

# 获取简洁错误描述
get_simple_message() {
    local error_type="$1"
    
    case "$error_type" in
        permission)
            echo "权限不足"
            ;;
        not_found)
            echo "文件或目录不存在"
            ;;
        network)
            echo "网络连接问题"
            ;;
        syntax)
            echo "代码语法错误"
            ;;
        type)
            echo "类型错误"
            ;;
        memory)
            echo "内存不足"
            ;;
        disk)
            echo "磁盘空间不足"
            ;;
        timeout)
            echo "操作超时"
            ;;
        git)
            echo "Git 操作失败"
            ;;
        dependency)
            echo "依赖缺失"
            ;;
        *)
            echo "操作失败"
            ;;
    esac
}

# 获取修复建议
get_fix_suggestion() {
    local error_type="$1"
    
    case "$error_type" in
        permission)
            echo "检查文件权限，或使用管理员权限运行"
            ;;
        not_found)
            echo "检查路径是否正确，或创建缺失的文件/目录"
            ;;
        network)
            echo "检查网络连接，或稍后重试"
            ;;
        syntax)
            echo "检查代码语法，可使用 /bianque 诊断"
            ;;
        type)
            echo "检查变量类型和空值处理，可使用 /bianque 诊断"
            ;;
        memory)
            echo "关闭其他程序释放内存，或增加系统内存"
            ;;
        disk)
            echo "清理磁盘空间，删除不需要的文件"
            ;;
        timeout)
            echo "检查服务状态，或增加超时时间"
            ;;
        git)
            echo "检查 Git 状态，可能需要解决冲突或重置"
            ;;
        dependency)
            echo "安装缺失的依赖: npm install / pip install"
            ;;
        *)
            echo "使用 /bianque 进行详细诊断"
            ;;
    esac
}

# 获取快速修复命令
get_quick_fix() {
    local error_type="$1"
    
    case "$error_type" in
        permission)
            echo "/retry"
            ;;
        not_found)
            echo "/wukong 找到正确的文件路径"
            ;;
        syntax|type)
            echo "/bianque 诊断这个错误"
            ;;
        git)
            echo "/git status"
            ;;
        dependency)
            echo "/do 安装缺失的依赖"
            ;;
        *)
            echo "/quickfix"
            ;;
    esac
}

# 主逻辑
main() {
    # 只处理有错误的情况
    if [ "$EXIT_CODE" = "0" ]; then
        # 检查输出中是否包含错误信息（使用多个 grep 替代 -E）
        has_error=false
        if echo "$TOOL_OUTPUT" | grep -qi "error"; then
            has_error=true
        elif echo "$TOOL_OUTPUT" | grep -qi "failed"; then
            has_error=true
        elif echo "$TOOL_OUTPUT" | grep -qi "exception"; then
            has_error=true
        elif echo "$TOOL_OUTPUT" | grep -qi "^fatal:"; then
            has_error=true
        fi
        
        if [ "$has_error" = "false" ]; then
            exit 0
        fi
    fi
    
    # 检测错误类型
    error_type=$(detect_error_type "$TOOL_OUTPUT")
    
    # 获取用户偏好
    verbosity=$(get_verbosity)
    
    # 获取错误信息
    simple_msg=$(get_simple_message "$error_type")
    fix_suggestion=$(get_fix_suggestion "$error_type")
    quick_fix=$(get_quick_fix "$error_type")
    
    # 根据详细度输出不同级别的信息
    case "$verbosity" in
        minimal)
            # 简洁模式: 一句话 + 快速修复
            cat << EOF

⚠️ $simple_msg | 快速修复: $quick_fix

EOF
            ;;
        detailed)
            # 详细模式: 完整信息 + 原始输出
            cat << EOF

╔══════════════════════════════════════════════════════════════╗
║  ⚠️ 检测到错误: $simple_msg
╠══════════════════════════════════════════════════════════════╣
║
║  📋 错误类型: $error_type
║  🔧 工具: $TOOL_NAME
║  
║  💡 建议: $fix_suggestion
║  
║  ⚡ 快速修复: $quick_fix
║  
║  📝 原始错误信息:
║  $(echo "$TOOL_OUTPUT" | head -10 | sed 's/^/║  /')
║  
╚══════════════════════════════════════════════════════════════╝

EOF
            ;;
        *)
            # 标准模式: 问题 + 原因 + 建议
            cat << EOF

┌──────────────────────────────────────────────────────────────┐
│ ⚠️ $simple_msg
├──────────────────────────────────────────────────────────────┤
│ 💡 $fix_suggestion
│ ⚡ 快速修复: $quick_fix
└──────────────────────────────────────────────────────────────┘

EOF
            ;;
    esac
}

# 运行主函数
main
