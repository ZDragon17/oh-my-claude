#!/usr/bin/env bash
# ============================================================================
# Ralph Loop Hook - 自引用循环控制
# ============================================================================
# 实现 oh-my-opencode 的 Ralph Loop 机制
# 检测完成承诺 <promise>DONE</promise>，自动继续未完成的任务
#
# 工作原理：
# 1. 检查 .claude/ralph-loop.local.md 状态文件是否存在
# 2. 如果存在，检查是否检测到完成承诺
# 3. 如果没有完成承诺，返回 JSON 阻止退出
# 4. 如果检测到完成承诺或达到最大迭代次数，允许退出
# ============================================================================

# 状态文件路径
RALPH_STATE_FILE=".claude/ralph-loop.local.md"

# 如果状态文件不存在，允许正常退出
if [ ! -f "$RALPH_STATE_FILE" ]; then
    exit 0
fi

# 读取配置（简单解析，不依赖 jq）
ITERATION=$(grep '^iteration:' "$RALPH_STATE_FILE" 2>/dev/null | sed 's/iteration:[[:space:]]*//' | tr -d ' ')
MAX_ITERATIONS=$(grep '^max_iterations:' "$RALPH_STATE_FILE" 2>/dev/null | sed 's/max_iterations:[[:space:]]*//' | tr -d ' ')
COMPLETION_PROMISE=$(grep '^completion_promise:' "$RALPH_STATE_FILE" 2>/dev/null | sed 's/completion_promise:[[:space:]]*//' | tr -d ' ')

# 默认值
ITERATION=${ITERATION:-1}
MAX_ITERATIONS=${MAX_ITERATIONS:-100}
COMPLETION_PROMISE=${COMPLETION_PROMISE:-DONE}

# 检查最大迭代次数
if [ "$MAX_ITERATIONS" -gt 0 ] 2>/dev/null && [ "$ITERATION" -ge "$MAX_ITERATIONS" ] 2>/dev/null; then
    echo "🛑 Ralph Loop: 已达最大迭代次数 ($MAX_ITERATIONS)" >&2
    rm -f "$RALPH_STATE_FILE"
    exit 0
fi

# 更新迭代次数
NEXT_ITERATION=$((ITERATION + 1))
if [ -f "$RALPH_STATE_FILE" ]; then
    # 使用 sed 更新迭代次数（跨平台）
    if [ "$(uname)" = "Darwin" ]; then
        # macOS
        sed -i '' "s/^iteration:.*/iteration: $NEXT_ITERATION/" "$RALPH_STATE_FILE" 2>/dev/null
    else
        # Linux/Windows (Git Bash)
        sed -i "s/^iteration:.*/iteration: $NEXT_ITERATION/" "$RALPH_STATE_FILE" 2>/dev/null
    fi
fi

# 返回 JSON 阻止退出并注入继续指令
printf '{"decision":"block","systemMessage":"\\n\\n🔄 **Ralph Loop 第 %d 次迭代**\\n\\n## 强制自检流程\\n\\n**必须执行以下步骤：**\\n\\n1. 调用 `mcp_todoread` 工具查看当前 TODO 列表\\n2. 检查是否有 `pending` 或 `in_progress` 状态的任务\\n3. 如果有未完成任务 → 继续工作，不要停止\\n4. 如果所有任务都是 `completed` → 执行结束流程\\n\\n## 结束方式\\n\\n当所有 TODO 完成后：\\n1. 向用户报告任务完成\\n2. 执行: `rm -f .claude/ralph-loop.local.md` 删除循环状态文件\\n3. 循环将自动结束\\n\\n**⚠️ 不要跳过 todoread 检查！**\\n"}\n' "$NEXT_ITERATION"

exit 0
