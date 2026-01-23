#!/usr/bin/env bash
# error-friendly-display.sh - 友好错误显示 Hook
# 检测工具执行错误，提供分层的用户友好错误信息
#
# 触发时机: PostToolUse
# 功能: 检测错误并根据用户偏好显示友好的错误信息

set -e

# 获取输入
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"
EXIT_CODE="${CLAUDE_EXIT_CODE:-0}"

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
detect_error_type() {
    local output="$1"
    
    # 权限错误
    if echo "$output" | grep -qiE "EACCES|EPERM|permission denied|access denied"; then
        echo "permission"
        return
    fi
    
    # 文件不存在
    if echo "$output" | grep -qiE "ENOENT|no such file|not found|does not exist"; then
        echo "not_found"
        return
    fi
    
    # 网络错误
    if echo "$output" | grep -qiE "ECONNREFUSED|ETIMEDOUT|network|connection"; then
        echo "network"
        return
    fi
    
    # 语法错误
    if echo "$output" | grep -qiE "SyntaxError|ParseError|unexpected token|invalid syntax"; then
        echo "syntax"
        return
    fi
    
    # 类型错误
    if echo "$output" | grep -qiE "TypeError|cannot read|undefined is not|null is not"; then
        echo "type"
        return
    fi
    
    # 内存错误
    if echo "$output" | grep -qiE "ENOMEM|out of memory|heap|allocation"; then
        echo "memory"
        return
    fi
    
    # 磁盘空间
    if echo "$output" | grep -qiE "ENOSPC|no space|disk full"; then
        echo "disk"
        return
    fi
    
    # 超时
    if echo "$output" | grep -qiE "timeout|timed out|deadline exceeded"; then
        echo "timeout"
        return
    fi
    
    # Git 错误
    if echo "$output" | grep -qiE "fatal:|error:.*git|conflict|merge"; then
        echo "git"
        return
    fi
    
    # 依赖错误
    if echo "$output" | grep -qiE "module not found|cannot find module|import error|no module named"; then
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
        # 检查输出中是否包含错误信息
        if ! echo "$TOOL_OUTPUT" | grep -qiE "error|failed|exception|fatal"; then
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
