#!/usr/bin/env bash

# think-mode.sh - 思维模式 Hook
# 启用深度思考和推理模式，增强复杂问题分析
# 对标 oh-my-opencode 的 think-mode hook

THINK_LOG="$HOME/.oh-my-claude/logs/think-mode.log"
THINK_STATE="$HOME/.oh-my-claude/state/think-mode.json"

# 确保目录存在
mkdir -p "$(dirname "$THINK_LOG")" 2>/dev/null
mkdir -p "$(dirname "$THINK_STATE")" 2>/dev/null

# 配置
THINK_MODE_ENABLED="${OH_MY_CLAUDE_THINK_MODE:-false}"
THINK_DEPTH="${OH_MY_CLAUDE_THINK_DEPTH:-medium}"  # shallow, medium, deep

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$THINK_LOG"
}

# ==================== 思维模式配置 ====================

# 获取当前思维模式状态
get_think_mode_state() {
    if [ -f "$THINK_STATE" ]; then
        cat "$THINK_STATE"
    else
        echo '{"enabled": false, "depth": "medium", "last_updated": null}'
    fi
}

# 设置思维模式状态
set_think_mode_state() {
    local enabled="$1"
    local depth="${2:-$THINK_DEPTH}"

    cat > "$THINK_STATE" << EOF
{
  "enabled": $enabled,
  "depth": "$depth",
  "last_updated": "$(date -Iseconds 2>/dev/null || date \"+%Y-%m-%dT%H:%M:%S%z\" 2>/dev/null || date \"+%Y-%m-%dT%H:%M:%S\")"
}
EOF

    log "思维模式状态更新: enabled=$enabled, depth=$depth"
}

# 启用思维模式
enable_think_mode() {
    local depth="${1:-medium}"
    set_think_mode_state "true" "$depth"

    echo "---"
    echo "🧠 思维模式已启用"
    echo ""
    echo "📊 配置:"
    echo "   • 深度: $depth"
    echo "   • 状态: 已激活"
    echo ""
    echo "💡 思维模式将:"
    echo "   1. 在回答前进行深度分析"
    echo "   2. 展示思考过程和推理链"
    echo "   3. 考虑多个解决方案"
    echo "   4. 评估各方案的优缺点"
    echo ""
    echo "📋 关闭命令: /think off"
    echo "---"
}

# 禁用思维模式
disable_think_mode() {
    set_think_mode_state "false"

    echo "---"
    echo "🧠 思维模式已关闭"
    echo ""
    echo "💡 将使用标准回答模式"
    echo "📋 重新启用: /think on"
    echo "---"
}

# 检查思维模式是否启用
is_think_mode_enabled() {
    local state=$(get_think_mode_state)
    local enabled=$(echo "$state" | grep -o '"enabled":\s*true' | wc -l)

    [ "$enabled" -gt 0 ]
}

# ==================== 思维引导 ====================

# 生成思维引导提示
generate_thinking_prompt() {
    local task="$1"
    local depth="$2"

    local prompt="---
🧠 深度思考模式

请在回答之前，按照以下结构进行思考：

"

    case "$depth" in
        "shallow")
            prompt="${prompt}### 1. 问题理解
简要理解问题的核心需求。

### 2. 快速分析
识别关键点和约束条件。

### 3. 解决方案
提出直接的解决方案。
"
            ;;

        "medium")
            prompt="${prompt}### 1. 问题分析
- 核心问题是什么？
- 有哪些约束条件？
- 期望的结果是什么？

### 2. 方案探索
- 方案 A: ...
- 方案 B: ...
- 方案 C: ...

### 3. 方案评估
| 方案 | 优点 | 缺点 | 风险 |
|------|------|------|------|
| A    |      |      |      |
| B    |      |      |      |

### 4. 推荐方案
基于评估选择最佳方案，并说明理由。

### 5. 实施计划
按步骤列出实施方案。
"
            ;;

        "deep")
            prompt="${prompt}### 1. 问题深度分析
#### 1.1 表面问题
描述用户直接提出的问题。

#### 1.2 根本问题
分析问题背后的真正需求。

#### 1.3 上下文考量
考虑技术栈、架构、团队能力等因素。

#### 1.4 约束识别
- 技术约束
- 时间约束
- 资源约束
- 业务约束

### 2. 深度方案探索
#### 2.1 方案 A: [名称]
- 描述：
- 技术实现：
- 优点：
- 缺点：
- 风险：
- 成本评估：

#### 2.2 方案 B: [名称]
（同上结构）

#### 2.3 方案 C: [名称]
（同上结构）

### 3. 多维度评估
| 维度 | 权重 | 方案 A | 方案 B | 方案 C |
|------|------|--------|--------|--------|
| 可行性 | 30% |        |        |        |
| 可维护性 | 25% |        |        |        |
| 性能 | 20% |        |        |        |
| 扩展性 | 15% |        |        |        |
| 安全性 | 10% |        |        |        |

### 4. 风险分析
- 技术风险：
- 实施风险：
- 业务风险：
- 缓解策略：

### 5. 决策与建议
基于全面分析，推荐方案及理由。

### 6. 详细实施计划
按里程碑拆分实施步骤：
1. 阶段 1: ...
2. 阶段 2: ...
3. 阶段 3: ...

### 7. 反思与备选
- 如果主方案失败的备选策略
- 需要监控的关键指标
- 回滚方案
"
            ;;
    esac

    prompt="${prompt}
---

📋 任务内容:
$task

请按照上述思维框架进行分析，然后给出回答。
---"

    echo "$prompt"
}

# ==================== 任务复杂度检测 ====================

# 分析任务复杂度
analyze_task_complexity() {
    local task="$1"

    local complexity_score=0

    # 检测复杂度指标
    # 1. 任务长度
    local length=${#task}
    if [ "$length" -gt 500 ]; then
        complexity_score=$((complexity_score + 2))
    elif [ "$length" -gt 200 ]; then
        complexity_score=$((complexity_score + 1))
    fi

    # 2. 技术关键词
    local tech_keywords=$(echo "$task" | grep -oiE "(架构|设计|重构|优化|安全|性能|并发|分布式|微服务)" | wc -l)
    complexity_score=$((complexity_score + tech_keywords))

    # 3. 需求复杂度关键词
    local req_keywords=$(echo "$task" | grep -oiE "(多个|所有|整体|全面|完整|系统)" | wc -l)
    complexity_score=$((complexity_score + req_keywords))

    # 4. 问题类型
    if echo "$task" | grep -qiE "(为什么|如何选择|比较|评估|分析)"; then
        complexity_score=$((complexity_score + 2))
    fi

    # 5. 多步骤任务
    if echo "$task" | grep -qiE "(然后|接着|之后|最后|首先|其次)"; then
        complexity_score=$((complexity_score + 1))
    fi

    # 返回复杂度级别
    if [ "$complexity_score" -ge 6 ]; then
        echo "high"
    elif [ "$complexity_score" -ge 3 ]; then
        echo "medium"
    else
        echo "low"
    fi
}

# 自动建议思维深度
suggest_think_depth() {
    local task="$1"
    local complexity=$(analyze_task_complexity "$task")

    case "$complexity" in
        "high")
            echo "deep"
            ;;
        "medium")
            echo "medium"
            ;;
        *)
            echo "shallow"
            ;;
    esac
}

# ==================== 思维模式触发检测 ====================

# 检测是否应该触发思维模式
should_trigger_think_mode() {
    local input="$1"

    # 1. 显式触发词
    if echo "$input" | grep -qiE "(深度思考|think|分析一下|详细分析|仔细考虑)"; then
        return 0
    fi

    # 2. 架构/设计相关
    if echo "$input" | grep -qiE "(架构设计|系统设计|技术选型|方案对比)"; then
        return 0
    fi

    # 3. 复杂决策
    if echo "$input" | grep -qiE "(应该选择|哪个更好|如何权衡|利弊分析)"; then
        return 0
    fi

    # 4. 问题诊断
    if echo "$input" | grep -qiE "(根本原因|为什么会|深层原因|问题分析)"; then
        return 0
    fi

    return 1
}

# ==================== 显示帮助 ====================

show_help() {
    echo "---"
    echo "🧠 思维模式帮助"
    echo ""
    echo "📋 功能:"
    echo "   • 启用深度思考和推理模式"
    echo "   • 结构化分析复杂问题"
    echo "   • 多方案评估和决策支持"
    echo ""
    echo "📋 命令:"
    echo "   /think on [depth]   - 启用思维模式"
    echo "   /think off          - 关闭思维模式"
    echo "   /think status       - 查看状态"
    echo "   /think help         - 显示帮助"
    echo ""
    echo "📋 深度级别:"
    echo "   shallow - 快速分析，适合简单问题"
    echo "   medium  - 中度分析，适合一般问题 (默认)"
    echo "   deep    - 深度分析，适合复杂问题"
    echo ""
    echo "📋 自动触发:"
    echo "   包含以下关键词时自动启用:"
    echo "   • 深度思考、分析、架构设计"
    echo "   • 技术选型、方案对比、如何权衡"
    echo "---"
}

# 显示状态
show_status() {
    local state=$(get_think_mode_state)
    local enabled=$(echo "$state" | grep -o '"enabled":\s*[a-z]*' | cut -d: -f2 | tr -d ' ')
    local depth=$(echo "$state" | grep -o '"depth":\s*"[^"]*"' | cut -d'"' -f4)

    echo "---"
    echo "🧠 思维模式状态"
    echo ""
    echo "📊 当前配置:"
    echo "   • 状态: $([ "$enabled" = "true" ] && echo "✅ 已启用" || echo "❌ 已关闭")"
    echo "   • 深度: $depth"
    echo ""
    echo "📋 使用统计:"
    local log_count=$(wc -l < "$THINK_LOG" 2>/dev/null || echo "0")
    echo "   • 日志条数: $log_count"
    echo "---"
}

# ==================== 命令检测 ====================

detect_think_commands() {
    local input="$1"

    # 思维模式命令
    if echo "$input" | grep -qiE "^/?think|思维模式"; then
        return 0
    fi

    return 1
}

# ==================== 主函数 ====================

main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 检测思维模式命令
    if detect_think_commands "$input"; then
        log "检测到思维模式命令"

        # 帮助
        if echo "$input" | grep -qiE "(help|帮助)"; then
            show_help
            exit 0
        fi

        # 状态
        if echo "$input" | grep -qiE "(status|状态)"; then
            show_status
            exit 0
        fi

        # 关闭
        if echo "$input" | grep -qiE "(off|关闭|禁用)"; then
            disable_think_mode
            exit 0
        fi

        # 启用
        if echo "$input" | grep -qiE "(on|启用|开启)"; then
            # 检测深度参数
            local depth="medium"
            if echo "$input" | grep -qiE "shallow|浅层"; then
                depth="shallow"
            elif echo "$input" | grep -qiE "deep|深层|深度"; then
                depth="deep"
            fi

            enable_think_mode "$depth"
            exit 0
        fi

        # 默认显示状态
        show_status
        exit 0
    fi

    # 检查是否应该自动触发
    if should_trigger_think_mode "$input"; then
        log "自动触发思维模式"

        # 分析复杂度并建议深度
        local suggested_depth=$(suggest_think_depth "$input")

        echo "---"
        echo "🧠 检测到复杂任务，建议启用思维模式"
        echo ""
        echo "📊 任务复杂度: $(analyze_task_complexity "$input")"
        echo "💡 建议深度: $suggested_depth"
        echo ""
        echo "📋 使用 '/think on $suggested_depth' 启用"
        echo "   或直接继续，使用标准模式回答"
        echo "---"

        exit 0
    fi

    # 如果思维模式已启用，注入思维提示
    if is_think_mode_enabled; then
        local state=$(get_think_mode_state)
        local depth=$(echo "$state" | grep -o '"depth":\s*"[^"]*"' | cut -d'"' -f4)

        log "思维模式已启用，注入思维提示 (depth=$depth)"
        generate_thinking_prompt "$input" "$depth"
        exit 0
    fi

    exit 0
}

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
_STDIN_INPUT=$(cat 2>/dev/null) || _STDIN_INPUT=""
if [ -z "$_STDIN_INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 的 prompt 字段
if command -v jq > /dev/null 2>&1; then
    _STDIN_PROMPT=$(echo "$_STDIN_INPUT" | jq -r '.prompt // empty' 2>/dev/null) || _STDIN_PROMPT=""
else
    _STDIN_PROMPT=$(echo "$_STDIN_INPUT" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || _STDIN_PROMPT=""
fi

# 执行主函数
main "$_STDIN_PROMPT"
