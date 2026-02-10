#!/usr/bin/env bash
# Agent 自动交接提示 Hook
# 当 Agent 完成任务后，智能推荐下一步操作
#
# 触发时机: PostToolUse (Task 工具完成后)
# 功能: 根据完成的 Agent 类型，智能推荐下一步操作
#
# 兼容性: macOS (bash 3.2+), Linux (bash 4.0+), Windows (Git Bash)

# 错误捕获：任何错误都静默退出，不影响用户体验
trap 'exit 0' ERR EXIT

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$_STDIN_INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$_STDIN_INPUT" | jq -r '(.tool_output // empty) | if type == "object" then tostring else . end' 2>/dev/null) || TOOL_OUTPUT=""
else
    TOOL_NAME=$(echo "$_STDIN_INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_OUTPUT=$(echo "$_STDIN_INPUT" | grep -o '"tool_output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_output"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_OUTPUT=""
fi
LAST_AGENT=""

# 安全检查：如果没有工具输出，静默退出
if [ -z "$TOOL_OUTPUT" ]; then
    exit 0
fi

# 安全检查：如果工具输出过长（超过 50KB），跳过处理以避免性能问题
# 使用 wc -c 替代 ${#var}，更兼容老版本
OUTPUT_LENGTH=$(printf '%s' "$TOOL_OUTPUT" | wc -c | tr -d ' ')
if [ "$OUTPUT_LENGTH" -gt 51200 ]; then
    exit 0
fi

# 检测是否是 Task 工具完成（使用 POSIX 兼容的方式）
case "$TOOL_NAME" in
    *task*|*Task*)
        # 是 Task 工具，继续处理
        ;;
    *)
        # 不是 Task 工具，静默退出
        exit 0
        ;;
esac

# 根据最近使用的 Agent 推荐下一步
generate_handoff_prompt() {
    local agent="$1"
    local output="$2"
    
    case "$agent" in
        *bianque*|*扁鹊*|*debug*|*diagnose*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🩺 扁鹊诊断完成。根据诊断结果，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /luban    实施修复（推荐）                    │
│  2. /wukong   深入探索相关代码                    │
│  3. /baozheng 添加测试防止复发                    │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *wukong*|*悟空*|*explore*|*scout*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🔍 悟空探索完成。根据发现结果，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /luban    修改代码（推荐）                    │
│  2. /zhuge    设计架构方案                        │
│  3. /bianque  诊断潜在问题                        │
│  4. /weizheng 审查代码质量                        │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *zhuge*|*诸葛*|*strategy*|*architect*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🎯 诸葛设计完成。根据架构方案，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /yishan   开始实现（推荐）                    │
│  2. /luban    实现核心模块                        │
│  3. /liubowen 审查计划可行性                      │
│  4. /cangjie  设计数据库结构                      │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *luban*|*鲁班*|*craft*|*implement*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🔧 鲁班实现完成。代码已就绪，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /baozheng 添加测试（推荐）                    │
│  2. /weizheng 代码审查                            │
│  3. /git      提交更改                            │
│  4. /sunzi    性能检查                            │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *baozheng*|*包拯*|*test*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

⚖️ 包拯测试完成。测试结果已出，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /weizheng 代码审查（推荐）                    │
│  2. /git      提交更改                            │
│  3. /luban    修复测试发现的问题                  │
│  4. /libing   准备部署                            │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *weizheng*|*魏征*|*review*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🪞 魏征审查完成。审查意见已出，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /luban    修复审查问题（如有）                │
│  2. /git      提交更改（推荐）                    │
│  3. /libing   准备部署                            │
│  4. /simaqian 更新文档                            │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *mozi*|*墨子*|*security*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🛡️ 墨子安全审计完成。审计报告已出，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /luban    修复安全漏洞（推荐）                │
│  2. /baozheng 添加安全测试                        │
│  3. /weizheng 审查修复代码                        │
│  4. /simaqian 记录安全变更                        │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *sunzi*|*孙子*|*perf*|*performance*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

⚔️ 孙子性能分析完成。优化建议已出，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /luban    实施优化（推荐）                    │
│  2. /baozheng 添加性能测试                        │
│  3. /zhangheng 设置监控                           │
│  4. /weizheng 审查优化代码                        │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *libai*|*李白*|*requirements*|*poet*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

✨ 李白需求分析完成。用户故事已提取，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /zhuge    设计架构方案（推荐）                │
│  2. /yishan   直接开始实现                        │
│  3. /liubowen 审查需求可行性                      │
│  4. /cangjie  设计数据模型                        │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *simaqian*|*司马迁*|*document*|*doc*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

📜 司马迁文档完成。文档已更新，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /git      提交更改（推荐）                    │
│  2. /weizheng 审查文档质量                        │
│  3. /share    分享给团队                          │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *cangjie*|*仓颉*|*database*|*db*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

📊 仓颉数据库设计完成。数据模型已就绪，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /luban    实现数据访问层（推荐）              │
│  2. /yishan   开始功能实现                        │
│  3. /weizheng 审查数据模型                        │
│  4. /baozheng 添加数据层测试                      │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *gukaizhi*|*顾恺之*|*ui*|*ux*|*painter*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🎨 顾恺之 UI 设计完成。界面方案已就绪，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /luban    实现前端组件（推荐）                │
│  2. /weizheng 审查 UI 代码                        │
│  3. /baozheng 添加 UI 测试                        │
│  4. /sunzi    检查渲染性能                        │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *libing*|*李冰*|*devops*|*deploy*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🌊 李冰 DevOps 操作完成。基础设施已就绪，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /zhangheng 设置监控告警（推荐）               │
│  2. /mozi      安全检查                           │
│  3. /simaqian  更新运维文档                       │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *change*|*嫦娥*|*cloud*|*serverless*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

🌙 嫦娥云服务配置完成。云资源已就绪，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /libing   配置 CI/CD（推荐）                  │
│  2. /zhangheng 设置云监控                         │
│  3. /mozi      云安全检查                         │
│  4. /simaqian  更新架构文档                       │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *laozi*|*老子*|*simplify*|*clean*)
            cat << 'EOF'

[SYSTEM REMINDER - Agent 交接建议]

☯️ 老子简化完成。代码已精简，建议下一步：

┌─────────────────────────────────────────────────┐
│  推荐操作                                        │
├─────────────────────────────────────────────────┤
│  1. /baozheng 验证功能正确性（推荐）              │
│  2. /weizheng 审查简化结果                        │
│  3. /git      提交更改                            │
│  4. /sunzi    检查性能影响                        │
└─────────────────────────────────────────────────┘

💡 输入数字或命令继续，或描述其他需求。

EOF
            ;;
        
        *)
            # 默认不输出提示
            exit 0
            ;;
    esac
}

# 检测最后使用的 Agent（从输出中推断）
# 使用多个 grep 调用替代 \| 语法，提高 macOS 兼容性
detect_agent() {
    local output="$1"
    
    # 检测常见的 Agent 标识（每个 Agent 使用独立的条件判断）
    if echo "$output" | grep -qi "扁鹊" || \
       echo "$output" | grep -qi "bianque" || \
       echo "$output" | grep -qi "望闻问切"; then
        echo "bianque"
    elif echo "$output" | grep -qi "悟空" || \
         echo "$output" | grep -qi "wukong" || \
         echo "$output" | grep -qi "火眼金睛"; then
        echo "wukong"
    elif echo "$output" | grep -qi "诸葛" || \
         echo "$output" | grep -qi "zhuge" || \
         echo "$output" | grep -qi "架构设计"; then
        echo "zhuge"
    elif echo "$output" | grep -qi "鲁班" || \
         echo "$output" | grep -qi "luban" || \
         echo "$output" | grep -qi "精工巧匠"; then
        echo "luban"
    elif echo "$output" | grep -qi "包拯" || \
         echo "$output" | grep -qi "baozheng" || \
         echo "$output" | grep -qi "测试专家"; then
        echo "baozheng"
    elif echo "$output" | grep -qi "魏征" || \
         echo "$output" | grep -qi "weizheng" || \
         echo "$output" | grep -qi "代码审查"; then
        echo "weizheng"
    elif echo "$output" | grep -qi "墨子" || \
         echo "$output" | grep -qi "mozi" || \
         echo "$output" | grep -qi "安全审计"; then
        echo "mozi"
    elif echo "$output" | grep -qi "孙子" || \
         echo "$output" | grep -qi "sunzi" || \
         echo "$output" | grep -qi "性能优化"; then
        echo "sunzi"
    elif echo "$output" | grep -qi "李白" || \
         echo "$output" | grep -qi "libai" || \
         echo "$output" | grep -qi "需求分析"; then
        echo "libai"
    elif echo "$output" | grep -qi "司马迁" || \
         echo "$output" | grep -qi "simaqian" || \
         echo "$output" | grep -qi "文档撰写"; then
        echo "simaqian"
    elif echo "$output" | grep -qi "仓颉" || \
         echo "$output" | grep -qi "cangjie" || \
         echo "$output" | grep -qi "数据库设计"; then
        echo "cangjie"
    elif echo "$output" | grep -qi "顾恺之" || \
         echo "$output" | grep -qi "gukaizhi" || \
         echo "$output" | grep -qi "界面美学"; then
        echo "gukaizhi"
    elif echo "$output" | grep -qi "李冰" || \
         echo "$output" | grep -qi "libing" || \
         echo "$output" | grep -qi "DevOps"; then
        echo "libing"
    elif echo "$output" | grep -qi "嫦娥" || \
         echo "$output" | grep -qi "change" || \
         echo "$output" | grep -qi "云服务"; then
        echo "change"
    elif echo "$output" | grep -qi "老子" || \
         echo "$output" | grep -qi "laozi" || \
         echo "$output" | grep -qi "大道至简"; then
        echo "laozi"
    else
        echo "unknown"
    fi
}

# 主逻辑
main() {
    local agent=""
    
    # 优先使用环境变量中的 Agent 信息
    if [ -n "$LAST_AGENT" ]; then
        agent="$LAST_AGENT"
    else
        agent=$(detect_agent "$TOOL_OUTPUT")
    fi
    
    # 如果识别到了 Agent，生成交接提示
    if [ "$agent" != "unknown" ] && [ -n "$agent" ]; then
        generate_handoff_prompt "$agent" "$TOOL_OUTPUT"
    fi
}

# 移除 EXIT trap 以允许正常输出
trap - EXIT

# 执行主函数
main
