#!/usr/bin/env bash

# code-quality-checker.sh - 代码质量检查器
# 包含 comment-checker 和 thinking-block-validator 功能
# 对标 oh-my-opencode 的代码质量 Hook

QUALITY_LOG="$HOME/.oh-my-claude/logs/code-quality.log"
QUALITY_CONFIG="$HOME/.oh-my-claude/config/code-quality.json"

# 确保目录存在
mkdir -p "$(dirname "$QUALITY_LOG")" 2>/dev/null

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$QUALITY_LOG"
}

# ==================== 注释检查器 ====================

# 检查代码注释完整性
check_comments() {
    local file="$1"
    local lang=$(detect_language "$file")
    local issues=""
    local warnings=0
    local errors=0

    log "检查注释: $file (语言: $lang)"

    if [ ! -f "$file" ]; then
        echo "⚠️ 文件不存在: $file"
        return 1
    fi

    # 根据语言选择注释风格
    case "$lang" in
        "javascript"|"typescript"|"java"|"csharp"|"cpp"|"c"|"go"|"rust"|"swift"|"kotlin")
            # C 风格注释
            local func_count=$(grep -c -E '(function|def|fn|func|public|private|protected)\s+[a-zA-Z_]' "$file" 2>/dev/null)
            local commented_func=$(grep -B2 -E '(function|def|fn|func|public|private|protected)\s+[a-zA-Z_]' "$file" 2>/dev/null | grep -c -E '(//|/\*|\*/)' 2>/dev/null)

            if [ "$func_count" -gt 0 ] && [ "$commented_func" -lt "$func_count" ]; then
                local missing=$((func_count - commented_func))
                issues="${issues}\n   ⚠️ $missing 个函数缺少注释"
                warnings=$((warnings + missing))
            fi

            # 检查 TODO 注释
            local todos=$(grep -c -E '//\s*TODO|/\*\s*TODO' "$file" 2>/dev/null | tr -d '\n' || echo "0")
            todos=${todos:-0}
            if [ "$todos" -gt 0 ] 2>/dev/null; then
                issues="${issues}\n   📝 发现 $todos 个 TODO 注释"
            fi

            # 检查 FIXME 注释
            local fixmes=$(grep -c -E '//\s*FIXME|/\*\s*FIXME' "$file" 2>/dev/null | tr -d '\n' || echo "0")
            fixmes=${fixmes:-0}
            if [ "$fixmes" -gt 0 ] 2>/dev/null; then
                issues="${issues}\n   🔧 发现 $fixmes 个 FIXME 注释"
                warnings=$((warnings + fixmes))
            fi
            ;;

        "python"|"ruby"|"perl"|"r")
            # 脚本语言注释
            local func_count=$(grep -c -E '^\s*(def |class )' "$file" 2>/dev/null)
            local docstring_count=$(grep -c -E '"""|\x27\x27\x27' "$file" 2>/dev/null)

            if [ "$func_count" -gt 0 ]; then
                local ratio=$((docstring_count * 100 / func_count / 2))
                if [ "$ratio" -lt 50 ]; then
                    issues="${issues}\n   ⚠️ 文档字符串覆盖率较低 (~$ratio%)"
                    warnings=$((warnings + 1))
                fi
            fi

            # 检查 TODO
            local todos=$(grep -c -E '#\s*TODO' "$file" 2>/dev/null || echo "0")
            if [ "$todos" -gt 0 ]; then
                issues="${issues}\n   📝 发现 $todos 个 TODO 注释"
            fi
            ;;

        *)
            issues="${issues}\n   ℹ️ 语言不支持详细注释检查"
            ;;
    esac

    # 检查文件头注释
    local first_line=$(head -1 "$file" 2>/dev/null)
    if ! echo "$first_line" | grep -qE '(//|/\*|#|--|"""|\x27\x27\x27)'; then
        issues="${issues}\n   💡 建议添加文件头注释"
    fi

    # 输出结果
    echo "---"
    echo "📝 注释检查: $(basename "$file")"

    if [ -n "$issues" ]; then
        echo -e "$issues"
    else
        echo "   ✅ 注释检查通过"
    fi

    echo "---"
    echo "📊 统计: $warnings 警告, $errors 错误"

    return $warnings
}

# 批量检查目录中的文件
check_comments_directory() {
    local dir="${1:-.}"
    local total_warnings=0
    local file_count=0

    echo "---"
    echo "📁 批量注释检查: $dir"
    echo ""

    # 查找源代码文件
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            ((file_count++))
            check_comments "$file"
            total_warnings=$((total_warnings + $?))
        fi
    done < <(find "$dir" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" -o -name "*.go" -o -name "*.rs" \) 2>/dev/null | head -20)

    echo ""
    echo "📊 总计: 检查 $file_count 个文件, $total_warnings 个警告"
    echo "---"
}

# ==================== 思维块验证器 ====================

# 验证 thinking block 格式
validate_thinking_block() {
    local content="$1"
    local errors=0
    local warnings=0

    log "验证 thinking block 格式"

    echo "---"
    echo "🧠 Thinking Block 验证"
    echo ""

    # 检查 <thinking> 标签配对
    local open_count=$(echo "$content" | grep -c '<thinking>' 2>/dev/null || echo "0")
    local close_count=$(echo "$content" | grep -c '</thinking>' 2>/dev/null || echo "0")

    if [ "$open_count" -ne "$close_count" ]; then
        echo "   ❌ thinking 标签不配对: 开始 $open_count, 结束 $close_count"
        errors=$((errors + 1))
    else
        echo "   ✅ thinking 标签配对正确"
    fi

    # 检查 <reflection> 标签配对
    local ref_open=$(echo "$content" | grep -c '<reflection>' 2>/dev/null || echo "0")
    local ref_close=$(echo "$content" | grep -c '</reflection>' 2>/dev/null || echo "0")

    if [ "$ref_open" -ne "$ref_close" ]; then
        echo "   ❌ reflection 标签不配对: 开始 $ref_open, 结束 $ref_close"
        errors=$((errors + 1))
    elif [ "$ref_open" -gt 0 ]; then
        echo "   ✅ reflection 标签配对正确"
    fi

    # 检查 <output> 标签配对
    local out_open=$(echo "$content" | grep -c '<output>' 2>/dev/null || echo "0")
    local out_close=$(echo "$content" | grep -c '</output>' 2>/dev/null || echo "0")

    if [ "$out_open" -ne "$out_close" ]; then
        echo "   ❌ output 标签不配对: 开始 $out_open, 结束 $out_close"
        errors=$((errors + 1))
    elif [ "$out_open" -gt 0 ]; then
        echo "   ✅ output 标签配对正确"
    fi

    # 检查嵌套顺序
    if [ "$open_count" -gt 0 ]; then
        # 简单检查：thinking 应该在 output 之前
        local thinking_pos=$(echo "$content" | grep -n '<thinking>' | head -1 | cut -d: -f1)
        local output_pos=$(echo "$content" | grep -n '<output>' | head -1 | cut -d: -f1)

        if [ -n "$output_pos" ] && [ -n "$thinking_pos" ]; then
            if [ "$output_pos" -lt "$thinking_pos" ]; then
                echo "   ⚠️ output 应该在 thinking 之后"
                warnings=$((warnings + 1))
            fi
        fi
    fi

    # 检查思维块内容质量
    local thinking_content=$(echo "$content" | sed -n '/<thinking>/,/<\/thinking>/p')
    if [ -n "$thinking_content" ]; then
        local thinking_length=${#thinking_content}

        if [ "$thinking_length" -lt 50 ]; then
            echo "   ⚠️ thinking 块内容过短 ($thinking_length 字符)"
            warnings=$((warnings + 1))
        elif [ "$thinking_length" -gt 5000 ]; then
            echo "   💡 thinking 块较长 ($thinking_length 字符), 考虑精简"
        else
            echo "   ✅ thinking 块内容长度合适 ($thinking_length 字符)"
        fi
    fi

    echo ""
    echo "📊 验证结果: $errors 错误, $warnings 警告"
    echo "---"

    return $((errors + warnings))
}

# ==================== 代码风格检查 ====================

# 检查代码风格问题
check_code_style() {
    local file="$1"
    local lang=$(detect_language "$file")
    local issues=""

    log "检查代码风格: $file"

    echo "---"
    echo "🎨 代码风格检查: $(basename "$file")"
    echo ""

    # 检查行长度
    local long_lines=$(awk 'length > 120' "$file" 2>/dev/null | wc -l)
    if [ "$long_lines" -gt 0 ]; then
        echo "   ⚠️ $long_lines 行超过 120 字符"
    fi

    # 检查尾随空格
    local trailing=$(grep -c '[[:space:]]$' "$file" 2>/dev/null || echo "0")
    if [ "$trailing" -gt 0 ]; then
        echo "   ⚠️ $trailing 行有尾随空格"
    fi

    # 检查混合缩进
    local tabs=$(grep -c $'^\t' "$file" 2>/dev/null || echo "0")
    local spaces=$(grep -c '^  ' "$file" 2>/dev/null || echo "0")
    if [ "$tabs" -gt 0 ] && [ "$spaces" -gt 0 ]; then
        echo "   ⚠️ 混合使用 Tab 和空格缩进"
    fi

    # 检查连续空行
    local blank_lines=$(grep -c '^$' "$file" 2>/dev/null || echo "0")
    if [ "$blank_lines" -gt 10 ]; then
        echo "   💡 较多空行 ($blank_lines), 考虑精简"
    fi

    # 语言特定检查
    case "$lang" in
        "javascript"|"typescript")
            # 检查 console.log
            local consoles=$(grep -c 'console.log' "$file" 2>/dev/null || echo "0")
            if [ "$consoles" -gt 3 ]; then
                echo "   ⚠️ 过多 console.log 调用 ($consoles)"
            fi

            # 检查 debugger
            local debuggers=$(grep -c 'debugger' "$file" 2>/dev/null || echo "0")
            if [ "$debuggers" -gt 0 ]; then
                echo "   ❌ 发现 debugger 语句 ($debuggers)"
            fi
            ;;

        "python")
            # 检查 print 语句
            local prints=$(grep -c '^[^#]*print(' "$file" 2>/dev/null || echo "0")
            if [ "$prints" -gt 5 ]; then
                echo "   ⚠️ 较多 print 调用 ($prints), 考虑使用 logging"
            fi

            # 检查 pass 语句
            local passes=$(grep -c '^\s*pass\s*$' "$file" 2>/dev/null || echo "0")
            if [ "$passes" -gt 0 ]; then
                echo "   💡 发现 $passes 个空 pass 语句"
            fi
            ;;
    esac

    echo ""
    echo "   ✅ 风格检查完成"
    echo "---"
}

# ==================== 辅助函数 ====================

# 检测文件语言
detect_language() {
    local file="$1"
    local ext="${file##*.}"

    case "$ext" in
        ts|tsx) echo "typescript" ;;
        js|jsx|mjs|cjs) echo "javascript" ;;
        py|pyw) echo "python" ;;
        rs) echo "rust" ;;
        go) echo "go" ;;
        java) echo "java" ;;
        cs) echo "csharp" ;;
        cpp|cc|cxx|hpp) echo "cpp" ;;
        c|h) echo "c" ;;
        rb) echo "ruby" ;;
        php) echo "php" ;;
        swift) echo "swift" ;;
        kt|kts) echo "kotlin" ;;
        *) echo "unknown" ;;
    esac
}

# 显示帮助
show_help() {
    echo "---"
    echo "🛠️ 代码质量检查器"
    echo ""
    echo "📋 功能:"
    echo "   • 注释检查: 验证函数注释、文档字符串"
    echo "   • Thinking Block 验证: 检查标签配对和格式"
    echo "   • 代码风格: 检查行长度、缩进、空格"
    echo ""
    echo "📋 用法:"
    echo "   • 检查文件注释: \"检查 file.ts 的注释\""
    echo "   • 批量检查: \"检查 src/ 目录的代码质量\""
    echo "   • 验证思维块: \"验证 thinking block\""
    echo "   • 风格检查: \"检查 file.ts 的代码风格\""
    echo "---"
}

# ==================== 命令检测 ====================

detect_quality_commands() {
    local input="$1"

    # 注释检查 (支持多种顺序)
    if echo "$input" | grep -qiE "(注释|comment|文档|docstring).*(检查|check)|检查.*(注释|comment)"; then
        return 0
    fi

    # 思维块验证
    if echo "$input" | grep -qiE "(thinking|思维|验证|validate).*block|block.*(验证|validate)"; then
        return 0
    fi

    # 代码风格
    if echo "$input" | grep -qiE "(风格|style|lint|格式|format).*(检查|check)|检查.*(风格|style)"; then
        return 0
    fi

    # 代码质量
    if echo "$input" | grep -qiE "(代码质量|code quality|质量检查|quality check)"; then
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

    # 检测代码质量命令
    if detect_quality_commands "$input"; then
        log "检测到代码质量命令"

        # 帮助
        if echo "$input" | grep -qiE "(帮助|help)"; then
            show_help
            exit 0
        fi

        # 提取文件路径
        local file=$(echo "$input" | grep -oE '[a-zA-Z0-9_./\\-]+\.(ts|tsx|js|jsx|py|rs|go|java|cs|cpp|c|rb|php)' | head -1)
        local dir=$(echo "$input" | grep -oE '[a-zA-Z0-9_./\\-]+/' | head -1)

        # 注释检查
        if echo "$input" | grep -qiE "(注释|comment)"; then
            if [ -n "$file" ]; then
                check_comments "$file"
            elif [ -n "$dir" ]; then
                check_comments_directory "$dir"
            else
                check_comments_directory "."
            fi
            exit 0
        fi

        # 思维块验证
        if echo "$input" | grep -qiE "(thinking|思维)"; then
            validate_thinking_block "$input"
            exit 0
        fi

        # 代码风格
        if echo "$input" | grep -qiE "(风格|style)"; then
            if [ -n "$file" ]; then
                check_code_style "$file"
            fi
            exit 0
        fi

        # 综合质量检查
        if [ -n "$file" ]; then
            check_comments "$file"
            check_code_style "$file"
        elif [ -n "$dir" ]; then
            check_comments_directory "$dir"
        fi

        exit 0
    fi

    exit 0
}

# 执行主函数
main "$@"
