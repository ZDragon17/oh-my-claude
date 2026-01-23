#!/usr/bin/env bash
# ============================================================================
# Agent Usage Reminder - Agent 使用提醒
# ============================================================================
# 在适当的场景下提醒用户可以使用特定的 Agent
#
# 功能：
# 1. 根据任务类型推荐合适的 Agent
# 2. 提供 Agent 使用示例
# 3. 避免过度提醒（有冷却期）
# ============================================================================

# 配置
STATE_DIR=".claude"
REMINDER_STATE_FILE="$STATE_DIR/agent-reminder-state.json"
COOLDOWN_SECONDS=300  # 5 分钟冷却期

# 获取用户输入
user_input="${CLAUDE_USER_PROMPT:-}"

# 如果输入为空，直接退出
if [ -z "$user_input" ]; then
    exit 0
fi

# 检查冷却期
current_time=$(date +%s)
last_reminder_time=0
if [ -f "$REMINDER_STATE_FILE" ]; then
    last_reminder_time=$(grep '"last_reminder_time"' "$REMINDER_STATE_FILE" 2>/dev/null | sed 's/.*"last_reminder_time"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/' || echo "0")
fi

time_since_last=$((current_time - last_reminder_time))
if [ "$time_since_last" -lt "$COOLDOWN_SECONDS" ]; then
    exit 0
fi

# Agent 推荐规则
recommended_agent=""
agent_description=""
agent_command=""

# 架构/设计相关
if echo "$user_input" | grep -qiE '(架构|设计|重构|microservice|monolith|系统设计|技术方案|architecture|design pattern)'; then
    if ! echo "$user_input" | grep -qiE '(诸葛|zhuge|/zhuge)'; then
        recommended_agent="诸葛 (ZhuGe)"
        agent_description="战略顾问，专注于架构设计和技术决策"
        agent_command="/zhuge"
    fi
fi

# 测试相关
if echo "$user_input" | grep -qiE '(测试|test|单元测试|集成测试|TDD|coverage|jest|pytest|mocha)'; then
    if ! echo "$user_input" | grep -qiE '(包拯|baozheng|/baozheng|/test)'; then
        recommended_agent="包拯 (BaoZheng)"
        agent_description="测试专家，专注于测试设计和质量保证"
        agent_command="/baozheng"
    fi
fi

# 安全相关
if echo "$user_input" | grep -qiE '(安全|漏洞|security|vulnerability|注入|XSS|CSRF|authentication|authorization)'; then
    if ! echo "$user_input" | grep -qiE '(墨子|mozi|/mozi|/security)'; then
        recommended_agent="墨子 (MoZi)"
        agent_description="安全防御专家，专注于安全审计和防御编程"
        agent_command="/mozi"
    fi
fi

# 性能相关
if echo "$user_input" | grep -qiE '(性能|优化|慢|slow|performance|bottleneck|缓存|cache|profil)'; then
    if ! echo "$user_input" | grep -qiE '(孙子|sunzi|/sunzi|/perf)'; then
        recommended_agent="孙子 (SunZi)"
        agent_description="性能优化专家，专注于性能分析和调优"
        agent_command="/sunzi"
    fi
fi

# 数据库相关
if echo "$user_input" | grep -qiE '(数据库|database|SQL|索引|index|migration|schema|表设计|query)'; then
    if ! echo "$user_input" | grep -qiE '(仓颉|cangjie|/cangjie|/db)'; then
        recommended_agent="仓颉 (CangJie)"
        agent_description="数据库专家，专注于数据建模和 SQL 优化"
        agent_command="/cangjie"
    fi
fi

# 文档相关
if echo "$user_input" | grep -qiE '(文档|document|README|changelog|API.*doc|注释|comment)'; then
    if ! echo "$user_input" | grep -qiE '(司马迁|simaqian|/simaqian|/doc)'; then
        recommended_agent="司马迁 (SimaQian)"
        agent_description="文档史官，专注于技术文档撰写"
        agent_command="/simaqian"
    fi
fi

# 代码审查相关
if echo "$user_input" | grep -qiE '(审查|review|code review|CR|PR.*review|检查代码)'; then
    if ! echo "$user_input" | grep -qiE '(魏征|weizheng|/weizheng|/review)'; then
        recommended_agent="魏征 (WeiZheng)"
        agent_description="代码审查专家，专注于代码规范和最佳实践"
        agent_command="/weizheng"
    fi
fi

# UI/UX 相关
if echo "$user_input" | grep -qiE '(UI|UX|界面|样式|design|布局|layout|组件.*设计|美化)'; then
    if ! echo "$user_input" | grep -qiE '(顾恺之|gukaizhi|/gukaizhi|/painter)'; then
        recommended_agent="顾恺之 (GuKaiZhi)"
        agent_description="界面美学师，专注于 UI/UX 设计"
        agent_command="/gukaizhi"
    fi
fi

# 如果没有推荐的 Agent，直接退出
if [ -z "$recommended_agent" ]; then
    exit 0
fi

# 更新状态文件
mkdir -p "$STATE_DIR"
cat > "$REMINDER_STATE_FILE" << EOF
{
  "last_reminder_time": $current_time,
  "last_recommended_agent": "$recommended_agent"
}
EOF

# 发送提醒
printf '{"systemMessage":"\\n\\n[AGENT RECOMMENDATION]\\n\\n**推荐使用专业 Agent**\\n\\n根据您的任务，推荐使用 **%s**:\\n- %s\\n\\n使用命令: `%s`\\n\\n*提示: 直接使用命令可以获得更专业的帮助*\\n"}\n' "$recommended_agent" "$agent_description" "$agent_command"

exit 0
