#!/usr/bin/env bash
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
# 注意：Stop hook 使用 decision + reason 字段（非 systemMessage）
printf '{"decision":"block","reason":"🏔️ 愚公移山 第 %d 次搬石 - 必须先检查 TODO 列表","hookSpecificOutput":{"additionalContext":"\\n\\n🏔️ **愚公移山 第 %d 次搬石**\\n\\n## 强制自检流程\\n\\n**必须执行以下步骤：**\\n\\n1. 调用 `mcp_todoread` 工具查看当前 TODO 列表\\n2. 检查是否有 `pending` 或 `in_progress` 状态的任务\\n3. 如果有未完成任务 → 继续工作，不要停止\\n4. 如果所有任务都是 `completed` → 执行结束流程\\n\\n## 结束方式\\n\\n当所有 TODO 完成后：\\n1. 向用户报告任务完成\\n2. 执行: `rm -f .claude/yishan-loop.local.md` 删除循环状态文件\\n3. 循环将自动结束\\n\\n**⚠️ 不要跳过 todoread 检查！**\\n"}}\n' "$NEXT_ITERATION" "$NEXT_ITERATION"

exit 0
