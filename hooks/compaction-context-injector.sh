#!/usr/bin/env bash
# ============================================================================
# Compaction Context Injector - 压缩上下文注入器
# ============================================================================
# 对标 oh-my-opencode 的 compaction-context-injector hook
# 在会话压缩(compaction)发生时，保留关键上下文信息
#
# Hook 类型: Stop
# 功能：
# 1. 检测会话压缩事件
# 2. 在压缩后注入关键上下文（活跃 TODO、当前任务状态）
# 3. 保留循环控制状态（Ralph Loop、愚公移山状态）
# 4. 保留重要的 Agent 协作上下文
# ============================================================================

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""

# 解析 stdin JSON 字段（Stop 事件提供 session_id, transcript_path, cwd）
if command -v jq > /dev/null 2>&1; then
    STOP_SESSION_ID=$(echo "$_STDIN_INPUT" | jq -r '.session_id // empty' 2>/dev/null) || STOP_SESSION_ID=""
else
    STOP_SESSION_ID=$(echo "$_STDIN_INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || STOP_SESSION_ID=""
fi

# Stop 事件没有 stop_reason 字段，使用空值（压缩检测依赖其他标记文件）
STOP_REASON=""

# 状态文件路径
TODO_STATE_FILE="${HOME}/.oh-my-claude/todo-state.json"
RALPH_LOOP_FILE=".claude/ralph-loop.local.md"
YISHAN_STATE_FILE="${HOME}/.oh-my-claude/yishan-state.json"
COMPACTION_MARKER="${HOME}/.oh-my-claude/last-compaction.marker"
CONTEXT_CACHE="${HOME}/.oh-my-claude/compaction-context.cache"

# 确保目录存在
mkdir -p "${HOME}/.oh-my-claude"

# ============================================================================
# 检测函数
# ============================================================================

# 检测是否发生了会话压缩
detect_compaction() {
    # 检查停止原因是否与压缩相关
    if echo "$STOP_REASON" | grep -qiE '(compact|compaction|context.*limit|token.*limit|truncat)'; then
        return 0
    fi
    
    # 检查上下文窗口限制标记
    if [ -f "${HOME}/.oh-my-claude/context-limit-reached.flag" ]; then
        rm -f "${HOME}/.oh-my-claude/context-limit-reached.flag"
        return 0
    fi
    
    return 1
}

# ============================================================================
# 上下文收集函数
# ============================================================================

# 收集活跃 TODO 列表
collect_todo_context() {
    local context=""
    
    # 从 Claude Code 的 todos 目录读取
    local todos_dir="${HOME}/.claude/todos"
    if [ -d "$todos_dir" ]; then
        # 查找最近的 todo 文件
        local latest_todo
        latest_todo=$(ls -t "$todos_dir"/*.json 2>/dev/null | head -1)
        if [ -n "$latest_todo" ] && [ -f "$latest_todo" ]; then
            # 提取未完成的 todo 项
            local pending
            pending=$(grep -o '"status":"pending"\|"status":"in_progress"' "$latest_todo" 2>/dev/null | wc -l | tr -d ' ')
            local completed
            completed=$(grep -o '"status":"completed"' "$latest_todo" 2>/dev/null | wc -l | tr -d ' ')
            
            if [ "$pending" -gt 0 ]; then
                context="**活跃 TODO**: ${completed} 已完成, ${pending} 待处理"
            fi
        fi
    fi
    
    echo "$context"
}

# 收集循环控制状态
collect_loop_context() {
    local context=""
    
    # 检查 Ralph Loop 状态
    if [ -f "$RALPH_LOOP_FILE" ]; then
        local iteration
        iteration=$(grep '^iteration:' "$RALPH_LOOP_FILE" 2>/dev/null | sed 's/iteration:[[:space:]]*//' || echo "?")
        local max_iter
        max_iter=$(grep '^max_iterations:' "$RALPH_LOOP_FILE" 2>/dev/null | sed 's/max_iterations:[[:space:]]*//' || echo "100")
        context="**Ralph Loop 活跃**: 第 ${iteration}/${max_iter} 次迭代"
    fi
    
    # 检查愚公移山状态
    if [ -f "$YISHAN_STATE_FILE" ]; then
        local active
        active=$(grep -o '"active": *true' "$YISHAN_STATE_FILE" 2>/dev/null)
        if [ -n "$active" ]; then
            local mode
            mode=$(grep -o '"mode": *"[^"]*"' "$YISHAN_STATE_FILE" 2>/dev/null | sed 's/"mode": *"//' | sed 's/"//')
            context="${context:+$context\\n}**愚公移山模式活跃**: 模式=${mode:-标准}"
        fi
    fi
    
    echo "$context"
}

# 收集工作目录上下文
collect_workspace_context() {
    local context=""
    
    # 当前工作目录
    local cwd
    cwd=$(pwd)
    context="**工作目录**: ${cwd}"
    
    # Git 分支信息
    local branch
    branch=$(git branch --show-current 2>/dev/null)
    if [ -n "$branch" ]; then
        context="${context}\\n**Git 分支**: ${branch}"
        
        # 未提交的变更数
        local changes
        changes=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        if [ "$changes" -gt 0 ]; then
            context="${context} (${changes} 个未提交变更)"
        fi
    fi
    
    echo "$context"
}

# ============================================================================
# 缓存管理
# ============================================================================

# 保存上下文到缓存（供下次压缩使用）
save_context_cache() {
    local context="$1"
    echo "$context" > "$CONTEXT_CACHE"
}

# 读取缓存的上下文
read_context_cache() {
    if [ -f "$CONTEXT_CACHE" ]; then
        cat "$CONTEXT_CACHE"
    fi
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 始终收集并缓存上下文（即使不是压缩事件，也为下次压缩准备）
    local todo_ctx
    todo_ctx=$(collect_todo_context)
    local loop_ctx
    loop_ctx=$(collect_loop_context)
    local workspace_ctx
    workspace_ctx=$(collect_workspace_context)
    
    # 构建完整上下文
    local full_context=""
    if [ -n "$workspace_ctx" ]; then
        full_context="$workspace_ctx"
    fi
    if [ -n "$todo_ctx" ]; then
        full_context="${full_context:+$full_context\\n}$todo_ctx"
    fi
    if [ -n "$loop_ctx" ]; then
        full_context="${full_context:+$full_context\\n}$loop_ctx"
    fi
    
    # 保存到缓存
    if [ -n "$full_context" ]; then
        save_context_cache "$full_context"
    fi
    
    # 如果检测到压缩事件，注入上下文
    if detect_compaction; then
        # 记录压缩时间
        date -Iseconds > "$COMPACTION_MARKER" 2>/dev/null || date +%Y-%m-%dT%H:%M:%S > "$COMPACTION_MARKER"
        
        # 构建注入消息
        local inject_msg=""
        inject_msg="\\n\\n[COMPACTION CONTEXT INJECTOR]\\n\\n"
        inject_msg="${inject_msg}**会话已压缩** - 以下是压缩前的关键上下文：\\n\\n"
        
        if [ -n "$full_context" ]; then
            inject_msg="${inject_msg}${full_context}\\n\\n"
        fi
        
        # 添加恢复提示
        inject_msg="${inject_msg}**重要提示**:\\n"
        inject_msg="${inject_msg}- 如有活跃的 TODO 列表，请使用 TodoRead 工具查看当前状态\\n"
        inject_msg="${inject_msg}- 如有活跃的循环（Ralph Loop/愚公移山），循环将自动继续\\n"
        inject_msg="${inject_msg}- 使用 Read 工具重新获取需要的文件内容\\n"
        
        printf '{"decision":"block","systemMessage":"%s"}\n' "$inject_msg"
        exit 0
    fi
    
    # 非压缩事件，正常退出
    exit 0
}

# 执行
main
