#!/usr/bin/env bash
# Atlas Hook - 核心编排逻辑
# 灵感来自希腊神话中托举天空的巨人阿特拉斯
# 功能：提供工作流编排的核心指导和约束

# 环境变量
HOOK_NAME="atlas"

# 从 stdin 读取 JSON 数据（Claude Code Hook API 通过 stdin 传递事件数据）
INPUT=$(cat 2>/dev/null) || INPUT=""
if [ -z "$INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null) || PROMPT=""
else
    PROMPT=$(echo "$INPUT" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || PROMPT=""
fi

# 配置
CONFIG_DIR="${HOME}/.oh-my-claude"
ATLAS_STATE_FILE="${CONFIG_DIR}/atlas-state.json"

# 确保配置目录存在
mkdir -p "$CONFIG_DIR"

# ============================================================================
# 核心编排规则
# ============================================================================

# 规则 1: 任务分类和委派
classify_task() {
    local prompt="$1"
    local category=""
    
    # Visual/UI 任务检测
    if echo "$prompt" | grep -qiE '(style|css|tailwind|color|layout|animation|ui|ux|design|界面|样式|颜色|布局|动画)'; then
        category="visual"
    # 调试/修复任务检测
    elif echo "$prompt" | grep -qiE '(bug|fix|error|debug|crash|issue|问题|修复|报错|崩溃)'; then
        category="debugging"
    # 架构/设计任务检测
    elif echo "$prompt" | grep -qiE '(architecture|design|pattern|refactor|structure|架构|设计|重构|模式)'; then
        category="architecture"
    # 文档任务检测
    elif echo "$prompt" | grep -qiE '(document|readme|changelog|docs|文档|说明)'; then
        category="documentation"
    # 测试任务检测
    elif echo "$prompt" | grep -qiE '(test|spec|coverage|测试|覆盖率)'; then
        category="testing"
    # 性能任务检测
    elif echo "$prompt" | grep -qiE '(performance|optimize|slow|memory|性能|优化|慢|内存)'; then
        category="performance"
    # 安全任务检测
    elif echo "$prompt" | grep -qiE '(security|vulnerability|auth|安全|漏洞|认证)'; then
        category="security"
    else
        category="general"
    fi
    
    echo "$category"
}

# 规则 2: 委派建议生成
generate_delegation_hint() {
    local category="$1"
    local hint=""
    
    case "$category" in
        "visual")
            hint="[ATLAS] Visual/UI task detected. Consider delegating to frontend-ui-ux-engineer agent for styling and layout work."
            ;;
        "debugging")
            hint="[ATLAS] Debugging task detected. Consider using /bianque for systematic diagnosis, or delegate complex issues to debugger agent."
            ;;
        "architecture")
            hint="[ATLAS] Architecture task detected. Consider consulting oracle agent for design decisions, or use /zhuge for strategic planning."
            ;;
        "documentation")
            hint="[ATLAS] Documentation task detected. Consider delegating to document-writer agent, or use /simaqian for comprehensive docs."
            ;;
        "testing")
            hint="[ATLAS] Testing task detected. Consider using /baozheng for test design, or delegate to test-engineer agent."
            ;;
        "performance")
            hint="[ATLAS] Performance task detected. Consider using /sunzi for optimization strategy, or delegate to performance-engineer agent."
            ;;
        "security")
            hint="[ATLAS] Security task detected. Consider using /mozi for security audit, or delegate to security-auditor agent."
            ;;
        *)
            hint=""
            ;;
    esac
    
    echo "$hint"
}

# 规则 3: 工作流阶段检测
detect_workflow_phase() {
    local prompt="$1"
    local phase=""
    
    # 探索阶段
    if echo "$prompt" | grep -qiE '(find|search|explore|where|which|找|搜索|探索|在哪)'; then
        phase="exploration"
    # 规划阶段
    elif echo "$prompt" | grep -qiE '(plan|design|how to|strategy|计划|设计|怎么|策略)'; then
        phase="planning"
    # 实现阶段
    elif echo "$prompt" | grep -qiE '(implement|create|add|build|实现|创建|添加|构建)'; then
        phase="implementation"
    # 验证阶段
    elif echo "$prompt" | grep -qiE '(test|verify|check|validate|测试|验证|检查)'; then
        phase="verification"
    # 部署阶段
    elif echo "$prompt" | grep -qiE '(deploy|release|publish|部署|发布)'; then
        phase="deployment"
    else
        phase="general"
    fi
    
    echo "$phase"
}

# 规则 4: 生成工作流提示
generate_workflow_hint() {
    local phase="$1"
    local hint=""
    
    case "$phase" in
        "exploration")
            hint="[ATLAS] Exploration phase: Use explore agents in parallel for codebase search. Fire multiple background_task(agent='explore', ...) calls simultaneously."
            ;;
        "planning")
            hint="[ATLAS] Planning phase: Create detailed TODO list before implementation. Consider consulting oracle for architecture decisions."
            ;;
        "implementation")
            hint="[ATLAS] Implementation phase: Mark TODO items in_progress before starting. Verify with lsp_diagnostics after each change."
            ;;
        "verification")
            hint="[ATLAS] Verification phase: Run build and tests. Check lsp_diagnostics on all changed files."
            ;;
        "deployment")
            hint="[ATLAS] Deployment phase: Ensure all tests pass. Update version numbers and changelog."
            ;;
        *)
            hint=""
            ;;
    esac
    
    echo "$hint"
}

# 规则 5: 并行执行提示
check_parallel_opportunity() {
    local prompt="$1"
    local hint=""
    
    # 检测多个独立任务
    if echo "$prompt" | grep -qE '(and|also|additionally|同时|另外|还要)'; then
        hint="[ATLAS] Multiple tasks detected. Consider parallel execution: Fire independent tool calls or background_task in single response."
    fi
    
    # 检测搜索任务
    if echo "$prompt" | grep -qiE '(find all|search for|locate|找到所有|搜索)'; then
        hint="[ATLAS] Search task: Use parallel explore agents. Example:
background_task(agent='explore', prompt='Find X in module A')
background_task(agent='explore', prompt='Find X in module B')
# Continue immediately, collect results later"
    fi
    
    echo "$hint"
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 只在 UserPromptSubmit 时运行
    if [ -z "$PROMPT" ]; then
        exit 0
    fi
    
    local output=""
    
    # 任务分类
    local category=$(classify_task "$PROMPT")
    local delegation_hint=$(generate_delegation_hint "$category")
    
    # 工作流阶段
    local phase=$(detect_workflow_phase "$PROMPT")
    local workflow_hint=$(generate_workflow_hint "$phase")
    
    # 并行机会检测
    local parallel_hint=$(check_parallel_opportunity "$PROMPT")
    
    # 构建输出
    if [ -n "$delegation_hint" ]; then
        output="${output}${delegation_hint}\n"
    fi
    
    if [ -n "$workflow_hint" ]; then
        output="${output}${workflow_hint}\n"
    fi
    
    if [ -n "$parallel_hint" ]; then
        output="${output}${parallel_hint}\n"
    fi
    
    # 输出提示（如果有）
    if [ -n "$output" ]; then
        echo -e "\n$output"
    fi
}

# 执行
main
