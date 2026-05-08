#!/usr/bin/env bash
# ============================================================================
# Atlas Hook - 核心编排引擎 (增强版)
# 对标 oh-my-opencode atlas v3.17.14
# ============================================================================
# 增强功能：
#   1. Boulder 计划状态追踪
#   2. 会话谱系管理
#   3. 继续提示注入（含进度）
#   4. 最终波次审批门控
#   5. 验证提醒
#   6. 保留原有的任务分类和委派建议
# ============================================================================

set -euo pipefail

HOOK_NAME="atlas"
INPUT=$(cat 2>/dev/null || echo '{}')

# Source provider adapter for CLI-agnostic paths and variables
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../lib/provider-adapter.sh"

CONFIG_DIR="$STATE_DIR"
ATLAS_STATE_FILE="$STATE_DIR/atlas-state.json"
ATLAS_CLI="$(get_cli_entry atlas)"

mkdir -p "$CONFIG_DIR"

USE_CLI=false
if command -v node &>/dev/null && [ -f "$ATLAS_CLI" ]; then
    USE_CLI=true
fi

# 获取会话 ID
SESSION_ID="${SESSION_ID:-unknown}"

# 解析 prompt
if command -v jq > /dev/null 2>&1; then
    PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null) || PROMPT=""
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
else
    PROMPT=$(echo "$INPUT" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || PROMPT=""
    TOOL_NAME=""
    TOOL_INPUT=""
fi

# ============================================================================
# 任务分类（保留原有逻辑）
# ============================================================================

classify_task() {
    local prompt="$1"
    local category="general"
    local confidence="low"

    if echo "$prompt" | grep -qiE '(style|css|tailwind|color|layout|animation|ui|ux|design|界面|样式|颜色|布局|动画)'; then
        category="visual"
        confidence="medium"
    elif echo "$prompt" | grep -qiE '(bug|fix|error|debug|crash|issue|问题|修复|报错|崩溃)'; then
        category="debugging"
        confidence="medium"
    elif echo "$prompt" | grep -qiE '(architecture|design|pattern|refactor|structure|架构|设计|重构|模式)'; then
        category="architecture"
        confidence="medium"
    elif echo "$prompt" | grep -qiE '(document|readme|changelog|docs|文档|说明)'; then
        category="documentation"
        confidence="high"
    elif echo "$prompt" | grep -qiE '(test|spec|coverage|测试|覆盖率)'; then
        category="testing"
        confidence="high"
    elif echo "$prompt" | grep -qiE '(performance|optimize|slow|memory|性能|优化|慢|内存)'; then
        category="performance"
        confidence="medium"
    elif echo "$prompt" | grep -qiE '(security|vulnerability|auth|安全|漏洞|认证)'; then
        category="security"
        confidence="medium"
    elif echo "$prompt" | grep -qiE '(deploy|release|publish|ci/cd|部署|发布)'; then
        category="deployment"
        confidence="high"
    fi

    echo "${category}|${confidence}"
}

# ============================================================================
# 工作流阶段检测
# ============================================================================

detect_phase() {
    local prompt="$1"
    local phase="implementation"

    if echo "$prompt" | grep -qiE '(explore|search|find|look|what|which|where|how does|搜索|查找|看看|在哪里|是什么)'; then
        phase="exploration"
    elif echo "$prompt" | grep -qiE '(plan|design|architecture|方案|设计|架构|规划)'; then
        phase="planning"
    elif echo "$prompt" | grep -qiE '(test|verify|check|validate|测试|验证|检查)'; then
        phase="verification"
    elif echo "$prompt" | grep -qiE '(deploy|release|ship|publish|部署|发布|上线)'; then
        phase="deployment"
    fi

    echo "$phase"
}

# ============================================================================
# Boulder 集成
# ============================================================================

# 检测 ultrawork/boulder 模式
if echo "$PROMPT" | grep -qiE '(ultrawork|ulw|ultrapilot|boulder|yishan|移山)'; then
    BOULDER_ACTIVE=true

    if $USE_CLI; then
        # 检查是否已有活动的 boulder
        BOULDER_STATE=$(node "$ATLAS_CLI" --action=state 2>/dev/null || echo '{}')
        ACTIVE_PLAN=$(echo "$BOULDER_STATE" | jq -r '.activePlan // empty' 2>/dev/null || echo '')

        if [ -z "$ACTIVE_PLAN" ]; then
            # 开始新的 boulder 计划
            PLAN_NAME=$(echo "$PROMPT" | head -1 | cut -c1-80)
            node "$ATLAS_CLI" --action=start-plan --name="$PLAN_NAME" 2>/dev/null || true
            node "$ATLAS_CLI" --action=append-lineage \
                --session="$SESSION_ID" \
                --plan="$PLAN_NAME" \
                --event="created" 2>/dev/null || true
        fi

        # 添加当前会话
        node "$ATLAS_CLI" --action=add-session \
            --session="$SESSION_ID" \
            --origin="direct" 2>/dev/null || true

        # 获取进度
        PROGRESS=$(node "$ATLAS_CLI" --action=progress 2>/dev/null || echo '{"completed":0,"total":0,"percent":0}')
        COMPLETED=$(echo "$PROGRESS" | jq -r '.completed // 0' 2>/dev/null || echo 0)
        TOTAL=$(echo "$PROGRESS" | jq -r '.total // 0' 2>/dev/null || echo 0)
    else
        BOULDER_ACTIVE=false
    fi
else
    BOULDER_ACTIVE=false
fi

# ============================================================================
# 委派建议
# ============================================================================

CLASSIFY_RESULT=$(classify_task "$PROMPT")
TASK_CATEGORY=$(echo "$CLASSIFY_RESULT" | cut -d'|' -f1)
TASK_CONFIDENCE=$(echo "$CLASSIFY_RESULT" | cut -d'|' -f2)
TASK_PHASE=$(detect_phase "$PROMPT")

# 类别到 Agent 的映射
get_recommended_agent() {
    case "$1" in
        visual)        echo "gukaizhi" ;;  # 顾恺之 - UI/UX
        debugging)     echo "bianque" ;;   # 扁鹊 - Bug 诊断
        architecture)  echo "zhuge" ;;     # 诸葛 - 架构设计
        documentation) echo "simaqian" ;;   # 司马迁 - 文档
        testing)       echo "baozheng" ;;  # 包拯 - 测试
        performance)   echo "sunzi" ;;     # 孙子 - 性能
        security)      echo "mozi" ;;      # 墨子 - 安全
        deployment)    echo "change" ;;    # 嫦娥 - 云部署
        *)             echo "yugong" ;;    # 愚公 - 通用编排
    esac
}

RECOMMENDED_AGENT=$(get_recommended_agent "$TASK_CATEGORY")

# ============================================================================
# 构建输出
# ============================================================================

OUTPUT_PARTS=""

# 基本分类信息
if [ "$TASK_CATEGORY" != "general" ]; then
    CATEGORY_EMOJI=""
    case "$TASK_CATEGORY" in
        visual)        CATEGORY_EMOJI="🎨" ;;
        debugging)     CATEGORY_EMOJI="🐛" ;;
        architecture)  CATEGORY_EMOJI="🏗️" ;;
        documentation) CATEGORY_EMOJI="📝" ;;
        testing)       CATEGORY_EMOJI="🧪" ;;
        performance)   CATEGORY_EMOJI="⚡" ;;
        security)      CATEGORY_EMOJI="🛡️" ;;
        deployment)    CATEGORY_EMOJI="🚀" ;;
        *)             CATEGORY_EMOJI="📋" ;;
    esac

    OUTPUT_PARTS="${OUTPUT_PARTS}${CATEGORY_EMOJI} **任务分类**: ${TASK_CATEGORY} | **阶段**: ${TASK_PHASE} | **置信度**: ${TASK_CONFIDENCE}\n"
    OUTPUT_PARTS="${OUTPUT_PARTS}🎯 **推荐 Agent**: @${RECOMMENDED_AGENT}\n"
fi

# Boulder 状态
if [ "$BOULDER_ACTIVE" = true ]; then
    OUTPUT_PARTS="${OUTPUT_PARTS}\n🪨 **Boulder 计划活跃**\n"
    if [ -n "${COMPLETED:-}" ] && [ -n "${TOTAL:-}" ] && [ "${TOTAL:-0}" -gt 0 ]; then
        OUTPUT_PARTS="${OUTPUT_PARTS}📊 进度: ${COMPLETED}/${TOTAL}\n"
    fi
fi

# 委派格式建议
OUTPUT_PARTS="${OUTPUT_PARTS}\n💡 **委派格式**: \`task(subagent_type=\"${RECOMMENDED_AGENT}\", description=\"...\", prompt=\"...\")\`\n"

# 并行机会检测
if echo "$PROMPT" | grep -qiE '(and|also|additionally|同时|另外|并且)'; then
    OUTPUT_PARTS="${OUTPUT_PARTS}⚡ **检测到可能的并行机会** — 考虑使用后台任务并行执行独立的子任务。\n"
fi

# 输出
if [ -n "$OUTPUT_PARTS" ]; then
    printf '%s\n' "$OUTPUT_PARTS"
fi

exit 0
