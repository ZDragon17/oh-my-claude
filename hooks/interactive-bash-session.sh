#!/usr/bin/env bash
# ============================================================================
# Interactive Bash Session Hook - tmux 会话管理
# ============================================================================
# 为长时间运行的进程提供 tmux 会话管理支持
#
# 功能：
# 1. 检测需要交互式环境的命令
# 2. 提供 tmux 会话创建建议
# 3. 管理会话生命周期
# ============================================================================

# 配置
SESSION_PREFIX="omo"
STATE_DIR=".claude/tmux-sessions"

# 获取用户输入
user_input="${CLAUDE_USER_PROMPT:-}"

# 需要交互式环境的命令模式
interactive_patterns="npm run dev|npm start|yarn dev|yarn start|pnpm dev|pnpm start"
interactive_patterns="${interactive_patterns}|python.*server|python.*app|flask run|uvicorn|gunicorn"
interactive_patterns="${interactive_patterns}|node.*server|nodemon|ts-node.*server"
interactive_patterns="${interactive_patterns}|docker-compose up|docker compose up"
interactive_patterns="${interactive_patterns}|kubectl port-forward|kubectl logs -f"
interactive_patterns="${interactive_patterns}|tail -f|watch |htop|top"
interactive_patterns="${interactive_patterns}|ssh |telnet |nc -l"
interactive_patterns="${interactive_patterns}|启动服务|运行服务器|开发服务器|dev server"

# 检测是否需要交互式环境
needs_interactive=false
if echo "$user_input" | grep -qiE "($interactive_patterns)"; then
    needs_interactive=true
fi

# 如果不需要交互式环境，直接退出
if [ "$needs_interactive" = "false" ]; then
    exit 0
fi

# 检查 tmux 是否可用
tmux_available=false
if command -v tmux >/dev/null 2>&1; then
    tmux_available=true
fi

# 生成会话名称建议
session_name="${SESSION_PREFIX}-$(date +%Y%m%d-%H%M%S)"

# 获取现有会话列表
existing_sessions=""
if [ "$tmux_available" = "true" ]; then
    existing_sessions=$(tmux list-sessions -F "#{session_name}" 2>/dev/null | grep "^${SESSION_PREFIX}-" | head -5)
fi

# 构建提示信息
if [ "$tmux_available" = "true" ]; then
    session_list=""
    if [ -n "$existing_sessions" ]; then
        session_list="\\n\\n**现有会话**:\\n"
        for sess in $existing_sessions; do
            session_list="${session_list}- \`$sess\`\\n"
        done
    fi
    
    printf '{"systemMessage":"\\n\\n[INTERACTIVE BASH SESSION]\\n\\n检测到可能需要**长时间运行的进程**。\\n\\n**建议使用 tmux 会话**:\\n\\n使用 `interactive_bash` 工具创建 tmux 会话:\\n```\\nmcp_interactive_bash(tmux_command=\"new-session -d -s %s\")\\nmcp_interactive_bash(tmux_command=\"send-keys -t %s \\\"your-command\\\" Enter\")\\n```\\n\\n**查看输出**:\\n```\\nmcp_interactive_bash(tmux_command=\"capture-pane -t %s -p\")\\n```\\n\\n**会话命名规范**: `omo-{name}` 格式%s\\n"}\n' "$session_name" "$session_name" "$session_name" "$session_list"
else
    printf '{"systemMessage":"\\n\\n[INTERACTIVE BASH SESSION]\\n\\n检测到可能需要**长时间运行的进程**。\\n\\n⚠️ **tmux 未安装**\\n\\n建议安装 tmux 以支持后台进程管理:\\n- macOS: `brew install tmux`\\n- Ubuntu/Debian: `sudo apt install tmux`\\n- Windows: 使用 WSL 或 Git Bash\\n\\n**替代方案**:\\n- 使用 `&` 后台运行（但无法获取输出）\\n- 使用 `nohup` 命令\\n"}\n'
fi

exit 0
