#!/usr/bin/env sh
# ============================================================================
# TODO 续航检查器 (Todo Continuation Checker)
# ============================================================================
# v2.0 简化版 - 不依赖 jq，不读取 transcript
# 通过检查状态文件来决定是否阻止 Claude 停止
#
# 工作原理：
# 1. 检查 .claude/yishan-loop.local.md 状态文件是否存在
# 2. 如果存在，返回 JSON 阻止退出
# 3. 如果不存在，允许正常退出
# ============================================================================

# 状态文件路径
YISHAN_STATE_FILE=".claude/yishan-loop.local.md"

# 如果状态文件不存在，允许正常退出
if [ ! -f "$YISHAN_STATE_FILE" ]; then
    exit 0
fi

# 读取迭代次数（简单解析，不依赖 jq）
ITERATION=$(grep '^iteration:' "$YISHAN_STATE_FILE" 2>/dev/null | sed 's/iteration:[[:space:]]*//' | tr -d ' ')
MAX_ITERATIONS=$(grep '^max_iterations:' "$YISHAN_STATE_FILE" 2>/dev/null | sed 's/max_iterations:[[:space:]]*//' | tr -d ' ')

# 默认值
ITERATION=${ITERATION:-1}
MAX_ITERATIONS=${MAX_ITERATIONS:-50}

# 检查最大迭代次数
if [ "$MAX_ITERATIONS" -gt 0 ] 2>/dev/null && [ "$ITERATION" -ge "$MAX_ITERATIONS" ] 2>/dev/null; then
    echo "🛑 愚公移山: 已达最大迭代次数 ($MAX_ITERATIONS)" >&2
    rm -f "$YISHAN_STATE_FILE"
    exit 0
fi

# 更新迭代次数
NEXT_ITERATION=$((ITERATION + 1))
if [ -f "$YISHAN_STATE_FILE" ]; then
    # 使用 sed 更新迭代次数（跨平台）
    sed "s/^iteration:.*/iteration: $NEXT_ITERATION/" "$YISHAN_STATE_FILE" > "${YISHAN_STATE_FILE}.tmp" 2>/dev/null
    mv "${YISHAN_STATE_FILE}.tmp" "$YISHAN_STATE_FILE" 2>/dev/null
fi

# 返回 JSON 阻止退出
# 注意：使用 printf 而不是 echo 来确保正确的 JSON 格式
printf '{"decision":"block","systemMessage":"\\n\\n🏔️ **愚公移山 第 %d 次搬石**\\n\\n[自检] 检查 TODO 列表，如有未完成项则继续工作。\\n\\n如果所有任务已完成，请输出: <promise>移山完毕</promise>\\n然后使用 /cancel-yishan 结束循环。\\n"}\n' "$NEXT_ITERATION"

exit 0
