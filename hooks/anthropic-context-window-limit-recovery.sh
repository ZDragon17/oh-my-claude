#!/bin/bash
# Anthropic Context Window Limit Recovery Hook
# 功能：检测上下文窗口限制错误并提供恢复策略
# 帮助在达到上下文限制时优雅地恢复工作

# 环境变量
HOOK_NAME="anthropic-context-window-limit-recovery"
TOOL_OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"
ERROR_MESSAGE="${CLAUDE_ERROR:-}"

# 配置
RECOVERY_STATE_FILE="${HOME}/.oh-my-claude/context-recovery.state"

# 确保状态目录存在
mkdir -p "$(dirname "$RECOVERY_STATE_FILE")"

# ============================================================================
# 检测函数
# ============================================================================

# 检测上下文窗口限制错误
detect_context_limit_error() {
    local message="$1"
    
    # 检测常见的上下文限制错误信息
    if echo "$message" | grep -qiE '(context window|context limit|token limit|max.*tokens|exceeded.*limit|too many tokens|context.*exceeded|conversation.*too.*long)'; then
        return 0
    fi
    
    # 检测 Anthropic 特定错误
    if echo "$message" | grep -qiE '(prompt.*too.*long|request.*too.*large|max_tokens_to_sample|context_length)'; then
        return 0
    fi
    
    return 1
}

# 检测即将接近限制
detect_approaching_limit() {
    local message="$1"
    
    if echo "$message" | grep -qiE '(approaching.*limit|near.*limit|almost.*full|context.*warning|80%.*capacity|90%.*capacity)'; then
        return 0
    fi
    
    return 1
}

# ============================================================================
# 恢复策略
# ============================================================================

# 生成恢复建议
generate_recovery_advice() {
    cat << 'EOF'

[Context Window Limit Recovery]

DETECTED: Context window limit reached or approaching.

IMMEDIATE ACTIONS:
1. Save current progress to TODO list
2. Document key context in a recovery file
3. Prepare for session continuation

RECOVERY STEPS:

## Step 1: Save Progress
Use TodoWrite to record current state:
```
TodoWrite([
  { id: "recovery-1", content: "Continue from: [current task]", status: "pending" },
  { id: "recovery-2", content: "Completed: [completed tasks]", status: "completed" }
])
```

## Step 2: Create Recovery Context
Write a recovery file with essential context:
```
Write(".claude/recovery-context.md", content=`
# Recovery Context

## Current Task
[What you were working on]

## Progress
- [Completed item 1]
- [Completed item 2]

## Next Steps
1. [Next action]
2. [Following action]

## Important Files
- path/to/file1.ts - [what was changed]
- path/to/file2.ts - [pending changes]

## Key Decisions Made
- [Decision 1 and reasoning]
- [Decision 2 and reasoning]
`)
```

## Step 3: Compact Context (if possible)
- Cancel completed background tasks: `background_cancel(all=true)`
- Summarize long outputs before referencing
- Focus on essential information only

## Step 4: Continue in New Session
In the new session, start with:
```
"Please read .claude/recovery-context.md and continue the previous work."
```

PREVENTION TIPS:
- Use TodoWrite consistently to track progress
- Prefer concise responses over verbose ones
- Summarize large tool outputs
- Cancel background tasks when done
- Use `/compact` or context compression when available
EOF
}

# 生成紧急保存脚本
generate_emergency_save() {
    local timestamp=$(date +%Y%m%d_%H%M%S 2>/dev/null || date +%s)
    
    cat << EOF

[EMERGENCY] Context limit imminent. Execute these saves NOW:

\`\`\`
// 1. Read current TODOs
TodoRead()

// 2. Save recovery state
Write(".claude/emergency-recovery-${timestamp}.md", content=\`
# Emergency Recovery State
Timestamp: ${timestamp}

## Active Tasks
[Copy from TodoRead output above]

## Current Work
[Describe what you were doing]

## Next Actions
[What needs to be done next]
\`)

// 3. Inform user
"I've saved the recovery state. Please start a new session and ask me to read .claude/emergency-recovery-${timestamp}.md to continue."
\`\`\`
EOF
}

# ============================================================================
# 状态管理
# ============================================================================

# 记录警告
log_warning() {
    local message="$1"
    local timestamp=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
    echo "{\"timestamp\": \"$timestamp\", \"warning\": \"$message\"}" >> "$RECOVERY_STATE_FILE"
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 检查错误信息
    local check_message="$TOOL_OUTPUT$ERROR_MESSAGE"
    
    if [ -z "$check_message" ]; then
        exit 0
    fi
    
    # 检测上下文限制错误
    if detect_context_limit_error "$check_message"; then
        log_warning "context_limit_reached"
        generate_recovery_advice
        echo ""
        generate_emergency_save
        exit 0
    fi
    
    # 检测接近限制警告
    if detect_approaching_limit "$check_message"; then
        log_warning "context_limit_approaching"
        
        cat << 'EOF'

[Context Window Warning] Approaching context limit.

RECOMMENDED ACTIONS:
1. Complete current task and save progress
2. Consider summarizing completed work
3. Prepare recovery context if needed

Use TodoWrite to ensure progress is tracked.
EOF
        exit 0
    fi
}

# 执行
main
