#!/usr/bin/env bash
# ============================================================================
# Tasks TodoWrite Disabler - 任务系统迁移辅助
# 对标 oh-my-opencode tasks-todowrite-disabler
# ============================================================================
# 对于已启用 Task 系统的 Agent/Skill，阻止 TodoWrite/TodoRead 工具调用
# ============================================================================

set -euo pipefail

INPUT=$(cat 2>/dev/null || echo '{}')

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || echo '')
if [ "$TOOL_NAME" != "TodoWrite" ] && [ "$TOOL_NAME" != "TodoRead" ] && [ "$TOOL_NAME" != "todowrite" ] && [ "$TOOL_NAME" != "todoread" ]; then
    exit 0
fi

# 检查禁用配置
DISABLE_CONFIG="${OH_MY_CLAUDE_STATE_DIR:-$HOME/.oh-my-claude}/config/todo-disabled.json"
if [ ! -f "$DISABLE_CONFIG" ]; then
    exit 0
fi

# 获取当前 agent/command/skill 上下文
CURRENT_AGENT=$(echo "$INPUT" | jq -r '.agent // empty' 2>/dev/null || echo '')
CURRENT_COMMAND=$(echo "$INPUT" | jq -r '.command // empty' 2>/dev/null || echo '')

DISABLED=false
REASON=""

if [ -n "$CURRENT_AGENT" ]; then
    if jq -e ".agents | index(\"$CURRENT_AGENT\")" "$DISABLE_CONFIG" >/dev/null 2>&1; then
        DISABLED=true
        REASON="Agent $CURRENT_AGENT 已禁用 TodoWrite"
    fi
fi

if [ -n "$CURRENT_COMMAND" ]; then
    if jq -e ".commands | index(\"$CURRENT_COMMAND\")" "$DISABLE_CONFIG" >/dev/null 2>&1; then
        DISABLED=true
        REASON="命令 $CURRENT_COMMAND 已禁用 TodoWrite"
    fi
fi

if [ "$DISABLED" = true ]; then
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"[TodoWrite Disabler] %s。请使用 TaskCreate/TaskUpdate 代替。"}}\n' "$REASON"
fi

exit 0
