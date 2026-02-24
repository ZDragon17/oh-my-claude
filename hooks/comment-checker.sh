#!/usr/bin/env bash
# ============================================================================
# Comment Checker Hook
# ============================================================================
# 对标 oh-my-opencode 的 comment-checker hook
# 检测 AI 生成的低质量注释（解释"做什么"而非"为什么"）
#
# Hook 类型: PostToolUse
# 触发条件: Write 或 Edit 工具调用成功后
# 行为: 扫描输出中的注释模式，警告 AI-slop 注释
# ============================================================================

HOOK_NAME="comment-checker"

# 从 stdin 读取 JSON 数据
INPUT=$(cat 2>/dev/null) || INPUT=""
if [ -z "$INPUT" ]; then
    exit 0
fi

# 解析 stdin JSON 字段
if command -v jq > /dev/null 2>&1; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
else
    TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tool_name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' 2>/dev/null) || TOOL_NAME=""
    TOOL_INPUT=""
fi

# 只处理 Write 和 Edit 工具
case "$TOOL_NAME" in
    Write|write|Edit|edit)
        ;;
    *)
        exit 0
        ;;
esac

# 获取写入/编辑的内容
CONTENT=""
if command -v jq > /dev/null 2>&1; then
    # Write 工具: content 字段; Edit 工具: new_text/newString 字段
    CONTENT=$(echo "$INPUT" | jq -r '(.tool_input.content // .tool_input.new_text // .tool_input.newString // .tool_input.text // empty)' 2>/dev/null) || CONTENT=""
fi

# 没有内容可检查
if [ -z "$CONTENT" ]; then
    exit 0
fi

# ============================================================================
# AI-slop 注释模式检测
# ============================================================================

SLOP_COUNT=0
SLOP_EXAMPLES=""

# 模式1: "// 导入xxx" "// Import xxx" — 解释显而易见的 import
if echo "$CONTENT" | grep -qEi '//\s*(Import|导入|引入)\s'; then
    SLOP_COUNT=$((SLOP_COUNT + 1))
    SLOP_EXAMPLES="${SLOP_EXAMPLES}\n  - '// Import xxx' — import 语句自文档化，无需注释"
fi

# 模式2: "// 定义xxx变量/函数/类" — 直接描述代码
if echo "$CONTENT" | grep -qEi '//\s*(Define|定义|声明|Create|创建)\s+(a |the |an )?(variable|function|class|constant|interface|type|变量|函数|类|常量|接口)'; then
    SLOP_COUNT=$((SLOP_COUNT + 1))
    SLOP_EXAMPLES="${SLOP_EXAMPLES}\n  - '// Define xxx' — 代码本身已经表明在定义什么"
fi

# 模式3: "// 设置xxx为xxx" "// Set xxx to xxx"
if echo "$CONTENT" | grep -qEi '//\s*(Set|设置|Assign|赋值)\s+\w+\s+(to|为|=)'; then
    SLOP_COUNT=$((SLOP_COUNT + 1))
    SLOP_EXAMPLES="${SLOP_EXAMPLES}\n  - '// Set xxx to xxx' — 赋值语句自文档化"
fi

# 模式4: "// 返回xxx" "// Return xxx"
if echo "$CONTENT" | grep -qEi '//\s*(Return|返回)\s+(the |a )?'; then
    SLOP_COUNT=$((SLOP_COUNT + 1))
    SLOP_EXAMPLES="${SLOP_EXAMPLES}\n  - '// Return xxx' — return 语句不需要注释"
fi

# 模式5: "// 循环遍历xxx" "// Loop through xxx" "// Iterate over xxx"
if echo "$CONTENT" | grep -qEi '//\s*(Loop|循环|Iterate|遍历|For each)\s'; then
    SLOP_COUNT=$((SLOP_COUNT + 1))
    SLOP_EXAMPLES="${SLOP_EXAMPLES}\n  - '// Loop through xxx' — for/forEach 本身已经清楚表达了遍历"
fi

# 模式6: "// 检查是否xxx" "// Check if xxx"
if echo "$CONTENT" | grep -qEi '//\s*(Check if|检查是否|Verify that|验证)\s'; then
    SLOP_COUNT=$((SLOP_COUNT + 1))
    SLOP_EXAMPLES="${SLOP_EXAMPLES}\n  - '// Check if xxx' — if 条件自文档化，注释应解释为什么要检查"
fi

# 模式7: "// 处理xxx错误" "// Handle xxx error"（泛化的错误处理注释）
if echo "$CONTENT" | grep -qEi '//\s*(Handle|处理)\s+(the |an )?(error|exception|错误|异常)$'; then
    SLOP_COUNT=$((SLOP_COUNT + 1))
    SLOP_EXAMPLES="${SLOP_EXAMPLES}\n  - '// Handle error' — catch 块不需要泛化注释，应说明恢复策略"
fi

# 如果没有检测到问题，正常退出
if [ "$SLOP_COUNT" -eq 0 ]; then
    exit 0
fi

# 输出警告
printf '[Comment Checker] 检测到 %d 处 AI-slop 注释模式:\n' "$SLOP_COUNT"
printf '%b\n' "$SLOP_EXAMPLES"
cat << 'EOF'

📝 **注释原则**: 解释"为什么"(WHY)，而不是"做什么"(WHAT)。
  - ❌ `// 导入 React` → 代码自文档化
  - ✅ `// 使用 16.8+ 以支持 hooks API` → 解释了技术决策
  - ❌ `// 循环遍历用户列表` → for 语句已经说明了
  - ✅ `// 批量处理避免 N+1 查询` → 解释了为什么这样做

请审查并移除不必要的注释，或将其改为解释"为什么"。
EOF

exit 0
