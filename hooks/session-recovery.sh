#!/usr/bin/env sh
# ============================================================================
# Session Recovery Hook - 会话恢复机制
# ============================================================================
# 检测会话中断信号并提供恢复策略
#
# 功能：
# 1. 检测 thinking block 错误
# 2. 检测上下文窗口限制
# 3. 检测会话中断信号
# 4. 提供恢复建议
# ============================================================================

# 状态目录
STATE_DIR=".claude"
RECOVERY_STATE_FILE="$STATE_DIR/recovery-state.json"
TODO_FILE="$STATE_DIR/todos.json"

# 获取用户输入
user_input="${CLAUDE_USER_PROMPT:-}"

# 错误模式检测
thinking_block_error=false
context_limit_error=false
session_interrupted=false
recovery_needed=false

# 检测 thinking block 错误信号
if echo "$user_input" | grep -qiE 'thinking.*block|extended.*thinking|思考.*块|思考.*错误'; then
    thinking_block_error=true
    recovery_needed=true
fi

# 检测上下文窗口限制信号
if echo "$user_input" | grep -qiE 'context.*limit|context.*window|token.*limit|上下文.*限制|窗口.*限制|令牌.*限制'; then
    context_limit_error=true
    recovery_needed=true
fi

# 检测会话中断信号
if echo "$user_input" | grep -qiE 'session.*interrupted|session.*lost|会话.*中断|会话.*丢失|断开|reconnect|重连'; then
    session_interrupted=true
    recovery_needed=true
fi

# 检测恢复请求
if echo "$user_input" | grep -qiE 'continue|resume|recover|继续|恢复|接着|carry.*on'; then
    # 检查是否有保存的状态
    if [ -f "$RECOVERY_STATE_FILE" ] || [ -f "$TODO_FILE" ]; then
        recovery_needed=true
    fi
fi

# 如果不需要恢复，直接退出
if [ "$recovery_needed" = "false" ]; then
    exit 0
fi

# 构建恢复信息
recovery_msg=""
recovery_actions=""

# Thinking Block 错误恢复
if [ "$thinking_block_error" = "true" ]; then
    recovery_msg="${recovery_msg}

**Thinking Block 错误检测**
检测到可能的 extended thinking 错误。这通常发生在：
- 复杂推理任务中思考时间过长
- 思考块生成过程中断

**恢复策略**:
1. 将复杂任务分解为更小的步骤
2. 使用 TODO 列表追踪进度
3. 如果问题持续，尝试简化请求"
    recovery_actions="${recovery_actions}
- 建议将任务分解为更小的单元"
fi

# 上下文窗口限制恢复
if [ "$context_limit_error" = "true" ]; then
    recovery_msg="${recovery_msg}

**上下文窗口限制检测**
检测到可能的上下文窗口限制问题。

**恢复策略**:
1. 使用 /compact 命令压缩对话历史
2. 开始新会话但保留 TODO 状态
3. 将大型代码块拆分为多个请求"
    recovery_actions="${recovery_actions}
- 建议执行上下文压缩"
fi

# 会话中断恢复
if [ "$session_interrupted" = "true" ]; then
    recovery_msg="${recovery_msg}

**会话中断检测**
检测到会话可能被中断。"
fi

# 检查并加载保存的状态
if [ -f "$TODO_FILE" ]; then
    todo_count=$(grep -c '"status"' "$TODO_FILE" 2>/dev/null || echo "0")
    pending_count=$(grep -c '"pending"' "$TODO_FILE" 2>/dev/null || echo "0")
    in_progress_count=$(grep -c '"in_progress"' "$TODO_FILE" 2>/dev/null || echo "0")
    completed_count=$(grep -c '"completed"' "$TODO_FILE" 2>/dev/null || echo "0")
    
    if [ "$todo_count" -gt 0 ]; then
        recovery_msg="${recovery_msg}

**TODO 状态恢复**
发现保存的任务列表：
- 总任务数: ${todo_count}
- 待处理: ${pending_count}
- 进行中: ${in_progress_count}
- 已完成: ${completed_count}"
        recovery_actions="${recovery_actions}
- 使用 todoread 工具读取任务列表并继续"
    fi
fi

# 检查检查点文件
CHECKPOINT_FILE="$STATE_DIR/task-checkpoint.json"
if [ -f "$CHECKPOINT_FILE" ]; then
    checkpoint_task=$(grep '"current_task"' "$CHECKPOINT_FILE" 2>/dev/null | sed 's/.*"current_task"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    checkpoint_time=$(grep '"timestamp"' "$CHECKPOINT_FILE" 2>/dev/null | sed 's/.*"timestamp"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    
    if [ -n "$checkpoint_task" ]; then
        recovery_msg="${recovery_msg}

**检查点恢复**
发现任务检查点：
- 任务: ${checkpoint_task}
- 时间: ${checkpoint_time}"
        recovery_actions="${recovery_actions}
- 可以从检查点继续执行"
    fi
fi

# 输出恢复建议
if [ -n "$recovery_msg" ]; then
    # 转义换行符用于 JSON
    escaped_msg=$(printf '%s' "$recovery_msg" | sed ':a;N;$!ba;s/\n/\\n/g' | sed 's/"/\\"/g')
    escaped_actions=$(printf '%s' "$recovery_actions" | sed ':a;N;$!ba;s/\n/\\n/g' | sed 's/"/\\"/g')
    
    printf '{"systemMessage":"\\n\\n[SYSTEM REMINDER - SESSION RECOVERY]\\n%s\\n\\n**建议操作**:%s\\n\\n请先读取 TODO 状态，然后继续未完成的工作。\\n"}\n' "$escaped_msg" "$escaped_actions"
fi

exit 0
