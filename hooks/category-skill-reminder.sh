#!/usr/bin/env bash
# ============================================================================
# Category+Skill Reminder Hook
# ============================================================================
# 对标 oh-my-opencode 的 category-skill-reminder hook
# 当编排 Agent 直接执行工作（而非委派）时，提醒使用 Category+Skills 系统
#
# Hook 类型: PostToolUse
# 触发条件: 工具调用为 Write/Edit/Bash 时（表示直接实现而非委派）
# 行为: 
#   1. 跟踪每个会话中直接实现的工具调用次数
#   2. 累计超过 3 次后，注入 Category+Skills 提醒
#   3. 使用 $HOME/.oh-my-claude/state/ 下的文件跟踪会话计数
# ============================================================================

HOOK_NAME="category-skill-reminder"
STATE_DIR="$HOME/.oh-my-claude/state"
COUNTER_FILE="$STATE_DIR/skill-reminder-counter"

# 确保状态目录存在
mkdir -p "$STATE_DIR" 2>/dev/null

# 从 stdin 读取 JSON 数据
INPUT=$(cat 2>/dev/null) || INPUT=""
if [ -z "$INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
else
    TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=""
fi

# 只关注直接实现类工具（非探索/读取类）
case "$TOOL_NAME" in
    Write|write|Edit|edit|Bash|bash)
        # 这些是"动手做"类工具，编排者应该委派
        ;;
    *)
        # Read/Grep/Glob/Task/TodoWrite 等不算直接实现
        exit 0
        ;;
esac

# 排除: 如果是对 hooks/ 或 .claude/ 内部文件的操作，不算
if [ -n "$TOOL_INPUT" ]; then
    if echo "$TOOL_INPUT" | grep -qE '(hooks/|\.claude/|oh-my-claude/)'; then
        exit 0
    fi
fi

# 递增计数器
CURRENT=0
if [ -f "$COUNTER_FILE" ]; then
    CURRENT=$(cat "$COUNTER_FILE" 2>/dev/null | tr -d '[:space:]')
    # 验证是数字
    case "$CURRENT" in
        ''|*[!0-9]*) CURRENT=0 ;;
    esac
fi

CURRENT=$((CURRENT + 1))
echo "$CURRENT" > "$COUNTER_FILE"

# 阈值: 累计 3 次直接实现后提醒
if [ "$CURRENT" -lt 3 ]; then
    exit 0
fi

# 重置计数器（提醒后重新开始计数）
echo "0" > "$COUNTER_FILE"

# 输出提醒
cat << 'EOF'

[Category+Skill Reminder]

**Built-in**: dev-browser
**⚡ YOUR SKILLS (PRIORITY)**: playwright, frontend-ui-ux, git-master, agent-browser, agent-handoff, agent-wizard, autopilot, bilingual (+60 more)

> User-installed skills OVERRIDE built-in defaults. ALWAYS prefer YOUR SKILLS when domain matches.

```typescript
task(category="visual-engineering", load_skills=["playwright"], run_in_background=true)
```
EOF

exit 0
