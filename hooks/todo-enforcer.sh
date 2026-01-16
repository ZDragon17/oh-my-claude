#!/usr/bin/env sh
# Todo 强制执行器 - Stop Hook
# 检查是否所有 TODO 都已完成，未完成则阻止停止

# 依赖检查
if ! command -v jq > /dev/null 2>&1; then
    cat << 'EOF'
{
  "systemMessage": "\n⚠️ **oh-my-claude Hook 提示**\n\ntodo-enforcer 需要 jq 工具才能工作。\n\n安装方法：\n- Ubuntu/Debian: `apt-get install jq`\n- macOS: `brew install jq`\n- Windows: `choco install jq` 或通过 Git Bash 使用\n\n暂时跳过 TODO 检查。\n",
  "continue": true
}
EOF
    exit 0
fi

# 错误处理函数
handle_error() {
    cat << 'EOF'
{
  "systemMessage": "\n⚠️ todo-enforcer 执行出错，已跳过检查。\n",
  "continue": true
}
EOF
    exit 0
}

# 设置错误捕获
trap handle_error ERR

# 读取 stdin 中的 JSON 数据
input=$(cat)

# 提取 transcript_path
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null)

if [ -z "$transcript_path" ]; then
    # 无法获取 transcript，允许停止
    exit 0
fi

# 路径安全验证函数
# 注意: 避免使用 local 关键字以保持 POSIX 兼容性
validate_path() {
    _vp_path="$1"

    # 1. 检查是否为空
    if [ -z "$_vp_path" ]; then
        return 1
    fi

    # 2. 检查危险字符（命令注入防护）
    case "$_vp_path" in
        *[\;\&\|\`\$\(\)\{\}\[\]\<\>\!\*\?]*)
            return 1
            ;;
    esac

    # 3. 检查文件是否存在且为普通文件（必须在规范化之前检查）
    if [ ! -f "$_vp_path" ]; then
        return 1
    fi

    # 4. 检查文件是否可读
    if [ ! -r "$_vp_path" ]; then
        return 1
    fi

    # 5. 规范化路径（消除 .. 和符号链接）
    _vp_real_path=""
    if command -v realpath > /dev/null 2>&1; then
        _vp_real_path=$(realpath "$_vp_path" 2>/dev/null) || return 1
    elif command -v readlink > /dev/null 2>&1; then
        # macOS 和一些系统可能没有 realpath，使用 readlink -f
        _vp_real_path=$(readlink -f "$_vp_path" 2>/dev/null) || {
            # 如果 readlink -f 不支持，回退到原始路径检查
            _vp_real_path="$_vp_path"
        }
    else
        # 无规范化工具，使用基本检查
        _vp_real_path="$_vp_path"
    fi

    # 6. 检查规范化后的路径是否包含路径遍历
    case "$_vp_real_path" in
        *..*)
            return 1
            ;;
    esac

    # 7. 检查路径是否以期望的前缀开始（只允许用户目录或临时目录）
    # 支持: Unix ($HOME, /tmp, /var/folders), WSL (/mnt/c/Users), Git Bash (/c/Users)
    case "$_vp_real_path" in
        "$HOME"/*|/tmp/*|/var/folders/*|/mnt/c/[Uu]sers/*|/c/[Uu]sers/*|/home/*)
            # 允许的路径前缀（包括 Windows WSL 和 Git Bash 路径）
            ;;
        *)
            # 检查 Windows 原生路径格式 (如 C:\Users\... 或 C:\Temp\...)
            if echo "$_vp_real_path" | grep -qiE '^[a-z]:\\(users|temp)\\'; then
                # Windows 原生路径，允许
                :
            else
                return 1
            fi
            ;;
    esac

    return 0
}

# 验证 transcript 路径
if ! validate_path "$transcript_path"; then
    # 路径验证失败，允许停止
    exit 0
fi

# 检查 transcript 中是否有未完成的 TODO
if [ -f "$transcript_path" ]; then
    # 尝试使用 jq 正确解析 JSON
    has_incomplete=$(jq -e '
        .. | objects |
        select(.todos? != null) |
        .todos[] |
        select(.status == "pending" or .status == "in_progress")
    ' "$transcript_path" 2>/dev/null)

    jq_exit_code=$?

    # 如果 jq 解析成功且找到未完成项
    if [ $jq_exit_code -eq 0 ] && [ -n "$has_incomplete" ]; then
        # 有未完成的任务，输出提醒并阻止停止
        cat << 'EOF'
{
  "systemMessage": "\n\n⚠️ **愚公移山提醒**：检测到还有未完成的任务！\n\n愚公曰：「虽我之死，有子存焉...子子孙孙无穷匮也，而山不加增，何苦而不平？」\n\n请继续完成所有 TODO 项后再停止。使用 TodoWrite 查看和更新任务状态。\n",
  "continue": false
}
EOF
        exit 2  # Exit code 2 阻止停止
    fi

    # jq 解析失败时，回退到 grep 方式（兼容性处理）
    if [ $jq_exit_code -ne 0 ]; then
        # 使用 grep 作为回退方案
        if grep -qE '"status"\s*:\s*"(pending|in_progress)"' "$transcript_path" 2>/dev/null; then
            cat << 'EOF'
{
  "systemMessage": "\n\n⚠️ **愚公移山提醒**：检测到还有未完成的任务！\n\n请继续完成所有 TODO 项后再停止。\n",
  "continue": false
}
EOF
            exit 2
        fi
    fi
fi

# 所有任务已完成或无任务，允许停止
exit 0
