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

# 路径安全检查 - 防止命令注入
case "$transcript_path" in
    *[\;\&\|\`\$]*)
        # 包含危险字符，跳过检查
        exit 0
        ;;
esac

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
