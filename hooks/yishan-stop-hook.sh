#!/bin/bash

# ============================================================================
# 愚公移山 Stop Hook (Yishan Stop Hook)
# ============================================================================
# 核心循环控制脚本，实现类似 Ralph Wiggum 的自主持续执行机制
# 当 Claude 想停止时，此 hook 检查任务是否完成，未完成则自动继续
#
# 工作原理：
# 1. 检查 .claude/yishan-loop.local.md 状态文件是否存在
# 2. 验证迭代次数是否超过最大限制
# 3. 检查 Claude 输出中是否包含 <promise>完成标记</promise>
# 4. 如果未完成，返回 JSON 阻止退出并重新注入原始 prompt
# ============================================================================

set -euo pipefail

# 从 stdin 读取 hook 输入 (Claude Code 高级 stop hook API)
HOOK_INPUT=$(cat)

# 状态文件路径
YISHAN_STATE_FILE=".claude/yishan-loop.local.md"

# 如果状态文件不存在，说明没有活跃的循环，允许正常退出
if [[ ! -f "$YISHAN_STATE_FILE" ]]; then
    exit 0
fi

# ============================================================================
# 解析状态文件 (YAML frontmatter 格式)
# ============================================================================

# 提取 YAML frontmatter (在 --- 之间的内容)
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$YISHAN_STATE_FILE")

# 解析各字段
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
# 提取完成标记，去除引号
COMPLETION_PROMISE=$(echo "$FRONTMATTER" | grep '^completion_promise:' | sed 's/completion_promise: *//' | sed 's/^\"\(.*\)"$/\1/')

# ============================================================================
# 验证数值字段
# ============================================================================

if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
    echo "⚠️ 愚公移山: 状态文件损坏" >&2
    echo "  文件: $YISHAN_STATE_FILE" >&2
    echo "  问题: 'iteration' 字段不是有效数字 (值: '$ITERATION')" >&2
    echo "" >&2
    echo "  状态文件可能被手动修改或损坏。" >&2
    echo "  循环停止。请运行 /yishan-loop 重新开始。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
    echo "⚠️ 愚公移山: 状态文件损坏" >&2
    echo "  文件: $YISHAN_STATE_FILE" >&2
    echo "  问题: 'max_iterations' 字段不是有效数字 (值: '$MAX_ITERATIONS')" >&2
    echo "" >&2
    echo "  状态文件可能被手动修改或损坏。" >&2
    echo "  循环停止。请运行 /yishan-loop 重新开始。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

# ============================================================================
# 检查最大迭代次数
# ============================================================================

if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
    echo "🛑 愚公移山: 已达最大迭代次数 ($MAX_ITERATIONS)"
    echo "   就像愚公移山需要世代相传，有些任务需要分阶段完成。"
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

# ============================================================================
# 获取 Claude 最后的输出
# ============================================================================

TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
    echo "⚠️ 愚公移山: 找不到会话记录文件" >&2
    echo "  预期路径: $TRANSCRIPT_PATH" >&2
    echo "  这可能是 Claude Code 内部问题。" >&2
    echo "  循环停止。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

# 检查是否有 assistant 消息
if ! grep -q '"role":"assistant"' "$TRANSCRIPT_PATH"; then
    echo "⚠️ 愚公移山: 会话记录中没有找到助手消息" >&2
    echo "  文件: $TRANSCRIPT_PATH" >&2
    echo "  循环停止。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

# 提取最后一条 assistant 消息
LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
if [[ -z "$LAST_LINE" ]]; then
    echo "⚠️ 愚公移山: 无法提取最后的助手消息" >&2
    echo "  循环停止。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

# 解析 JSON 提取文本内容
LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
    .message.content |
    map(select(.type == "text")) |
    map(.text) |
    join("\n")
' 2>&1)

if [[ $? -ne 0 ]]; then
    echo "⚠️ 愚公移山: 无法解析助手消息 JSON" >&2
    echo "  错误: $LAST_OUTPUT" >&2
    echo "  循环停止。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

if [[ -z "$LAST_OUTPUT" ]]; then
    echo "⚠️ 愚公移山: 助手消息没有文本内容" >&2
    echo "  循环停止。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

# ============================================================================
# 检查完成标记 <promise>...</promise>
# ============================================================================

if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
    # 使用 Perl 提取 <promise> 标签中的内容 (支持多行)
    PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")

    # 字符串精确匹配
    if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
        echo "✅ 愚公移山: 检测到完成标记 <promise>$COMPLETION_PROMISE</promise>"
        echo "   🎉 任务完成！愚公精神：坚持就是胜利！"
        rm "$YISHAN_STATE_FILE"
        exit 0
    fi
fi

# ============================================================================
# 未完成 - 继续循环
# ============================================================================

NEXT_ITERATION=$((ITERATION + 1))

# 提取原始 prompt (在 YAML frontmatter 之后的内容)
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$YISHAN_STATE_FILE")

if [[ -z "$PROMPT_TEXT" ]]; then
    echo "⚠️ 愚公移山: 状态文件不完整" >&2
    echo "  文件: $YISHAN_STATE_FILE" >&2
    echo "  问题: 找不到 prompt 内容" >&2
    echo "" >&2
    echo "  可能原因:" >&2
    echo "  • 状态文件被手动编辑" >&2
    echo "  • 文件写入时损坏" >&2
    echo "" >&2
    echo "  循环停止。请运行 /yishan-loop 重新开始。" >&2
    rm "$YISHAN_STATE_FILE"
    exit 0
fi

# 更新迭代次数 (原子操作)
TEMP_FILE="${YISHAN_STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$YISHAN_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$YISHAN_STATE_FILE"

# 构建系统消息
if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
    SYSTEM_MSG="🏔️ 愚公移山 第 $NEXT_ITERATION 次搬石 | 完成时输出: <promise>$COMPLETION_PROMISE</promise> (仅在任务真正完成时输出，不要虚报！)"
else
    SYSTEM_MSG="🏔️ 愚公移山 第 $NEXT_ITERATION 次搬石 | 未设置完成标记 - 将持续执行直到取消"
fi

# 输出 JSON 阻止退出并重新注入 prompt
# decision: "block" 阻止 Claude 停止
# reason: 重新发送给 Claude 的 prompt
# systemMessage: 显示给用户的系统消息
jq -n \
    --arg prompt "$PROMPT_TEXT" \
    --arg msg "$SYSTEM_MSG" \
    '{
        "decision": "block",
        "reason": $prompt,
        "systemMessage": $msg
    }'

exit 0
