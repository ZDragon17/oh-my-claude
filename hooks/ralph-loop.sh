#!/usr/bin/env sh
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
printf '{"decision":"block","systemMessage":"\\n\\n🔄 **Ralph Loop 第 %d 次迭代**\\n\\n[自检] 任务是否完成？\\n\\n## 继续条件\\n- 检查 TODO 列表，如有未完成项则继续工作\\n- 验证所有要求都已满足\\n\\n## 完成条件\\n当所有任务完成后：\\n1. 输出: <promise>%s</promise>\\n2. 使用 /cancel-ralph 结束循环\\n\\n**如果任务未完成，继续工作。不要停止。**\\n"}\n' "$NEXT_ITERATION" "$COMPLETION_PROMISE"

exit 0
