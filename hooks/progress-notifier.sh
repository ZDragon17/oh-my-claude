#!/usr/bin/env sh
# 进度通知器 - Notification Hook
# 在任务状态变化时显示简洁进度信息

# 依赖检查 - jq 是可选的
has_jq=0
if command -v jq > /dev/null 2>&1; then
    has_jq=1
fi

# 读取 stdin 中的 JSON 数据（带错误保护）
input=$(cat 2>/dev/null) || input=""

# 如果没有 jq 或输入为空，静默退出
if [ "$has_jq" -eq 0 ] || [ -z "$input" ]; then
    exit 0
fi

# 提取消息类型
message_type=$(echo "$input" | jq -r '.type // empty' 2>/dev/null)

# 只处理 todo 相关的通知
if [ "$message_type" != "todo_update" ]; then
    exit 0
fi

# 提取 todo 统计信息
completed=$(echo "$input" | jq -r '.todos | map(select(.status == "completed")) | length' 2>/dev/null)
in_progress=$(echo "$input" | jq -r '.todos | map(select(.status == "in_progress")) | length' 2>/dev/null)
pending=$(echo "$input" | jq -r '.todos | map(select(.status == "pending")) | length' 2>/dev/null)

# 如果无法解析，静默退出
if [ -z "$completed" ] || [ -z "$in_progress" ] || [ -z "$pending" ]; then
    exit 0
fi

# 计算总数和百分比
total=$((completed + in_progress + pending))

if [ "$total" -eq 0 ]; then
    exit 0
fi

percent=$((completed * 100 / total))

# 生成进度条 (30 字符宽)
bar_width=30
filled=$((bar_width * percent / 100))
empty=$((bar_width - filled))

bar=""
i=0
while [ $i -lt $filled ]; do
    bar="${bar}█"
    i=$((i + 1))
done
while [ $i -lt $bar_width ]; do
    bar="${bar}░"
    i=$((i + 1))
done

# 选择里程碑 emoji
if [ "$percent" -ge 100 ]; then
    emoji="🎉"
elif [ "$percent" -ge 75 ]; then
    emoji="🏃"
elif [ "$percent" -ge 50 ]; then
    emoji="🎯"
elif [ "$percent" -ge 25 ]; then
    emoji="💪"
else
    emoji="🚀"
fi

# 获取当前进行中的任务名称
current_task=$(echo "$input" | jq -r '.todos | map(select(.status == "in_progress")) | .[0].content // "无"' 2>/dev/null)

# 输出简洁进度信息
cat << EOF
{
  "systemMessage": "\n\n📊 ${bar} ${percent}% (${completed}/${total}) ${emoji}\n🔄 ${current_task}\n"
}
EOF

exit 0
