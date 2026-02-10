#!/usr/bin/env bash

# ast-grep.sh - AST-Grep 结构化代码搜索工具
# 基于 AST (抽象语法树) 的代码搜索和重构
# 对标 oh-my-opencode 的 25+ 语言 AST-Grep 支持

AST_LOG="$HOME/.oh-my-claude/logs/ast-grep.log"
AST_CACHE="$HOME/.oh-my-claude/cache/ast"
AST_PATTERNS="$HOME/.oh-my-claude/config/ast-patterns.yaml"

# 确保目录存在
mkdir -p "$(dirname "$AST_LOG")" 2>/dev/null
mkdir -p "$AST_CACHE" 2>/dev/null

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$AST_LOG"
}

# ==================== 语言支持配置 ====================

# 支持的语言列表
declare -a SUPPORTED_LANGUAGES=(
    "c" "cpp" "csharp" "css" "dart" "elixir" "go"
    "haskell" "html" "java" "javascript" "json" "kotlin"
    "lua" "markdown" "objc" "perl" "php" "python"
    "r" "ruby" "rust" "scala" "sql" "swift" "toml"
    "tsx" "typescript" "vue" "yaml"
)

# 文件扩展名到语言映射
declare -A EXT_TO_LANG
EXT_TO_LANG["c"]="c"
EXT_TO_LANG["h"]="c"
EXT_TO_LANG["cpp"]="cpp"
EXT_TO_LANG["cc"]="cpp"
EXT_TO_LANG["cxx"]="cpp"
EXT_TO_LANG["hpp"]="cpp"
EXT_TO_LANG["cs"]="csharp"
EXT_TO_LANG["css"]="css"
EXT_TO_LANG["dart"]="dart"
EXT_TO_LANG["ex"]="elixir"
EXT_TO_LANG["exs"]="elixir"
EXT_TO_LANG["go"]="go"
EXT_TO_LANG["hs"]="haskell"
EXT_TO_LANG["html"]="html"
EXT_TO_LANG["htm"]="html"
EXT_TO_LANG["java"]="java"
EXT_TO_LANG["js"]="javascript"
EXT_TO_LANG["mjs"]="javascript"
EXT_TO_LANG["cjs"]="javascript"
EXT_TO_LANG["json"]="json"
EXT_TO_LANG["kt"]="kotlin"
EXT_TO_LANG["kts"]="kotlin"
EXT_TO_LANG["lua"]="lua"
EXT_TO_LANG["md"]="markdown"
EXT_TO_LANG["m"]="objc"
EXT_TO_LANG["pl"]="perl"
EXT_TO_LANG["pm"]="perl"
EXT_TO_LANG["php"]="php"
EXT_TO_LANG["py"]="python"
EXT_TO_LANG["pyw"]="python"
EXT_TO_LANG["r"]="r"
EXT_TO_LANG["R"]="r"
EXT_TO_LANG["rb"]="ruby"
EXT_TO_LANG["rs"]="rust"
EXT_TO_LANG["scala"]="scala"
EXT_TO_LANG["sc"]="scala"
EXT_TO_LANG["sql"]="sql"
EXT_TO_LANG["swift"]="swift"
EXT_TO_LANG["toml"]="toml"
EXT_TO_LANG["tsx"]="tsx"
EXT_TO_LANG["ts"]="typescript"
EXT_TO_LANG["vue"]="vue"
EXT_TO_LANG["yaml"]="yaml"
EXT_TO_LANG["yml"]="yaml"

# ==================== 常用 AST 模式 ====================

# 预定义的搜索模式
declare -A PREDEFINED_PATTERNS

# JavaScript/TypeScript 模式
PREDEFINED_PATTERNS["js_unused_var"]='const $VAR = $EXPR'
PREDEFINED_PATTERNS["js_console_log"]='console.log($$$)'
PREDEFINED_PATTERNS["js_async_func"]='async function $NAME($$$) { $$$ }'
PREDEFINED_PATTERNS["js_arrow_func"]='const $NAME = ($$$) => { $$$ }'
PREDEFINED_PATTERNS["js_import"]='import { $$$ } from $MODULE'
PREDEFINED_PATTERNS["js_export_default"]='export default $EXPR'
PREDEFINED_PATTERNS["js_try_catch"]='try { $$$ } catch ($E) { $$$ }'
PREDEFINED_PATTERNS["js_promise"]='new Promise(($RESOLVE, $REJECT) => { $$$ })'
PREDEFINED_PATTERNS["js_await"]='await $EXPR'
PREDEFINED_PATTERNS["js_react_hook"]='use$HOOK($$$)'
PREDEFINED_PATTERNS["js_useeffect"]='useEffect(() => { $$$ }, [$$$])'
PREDEFINED_PATTERNS["js_usestate"]='const [$STATE, $SETTER] = useState($INIT)'

# Python 模式
PREDEFINED_PATTERNS["py_function"]='def $NAME($$$): $$$'
PREDEFINED_PATTERNS["py_class"]='class $NAME($$$): $$$'
PREDEFINED_PATTERNS["py_async_def"]='async def $NAME($$$): $$$'
PREDEFINED_PATTERNS["py_decorator"]='@$DECORATOR'
PREDEFINED_PATTERNS["py_import"]='from $MODULE import $$$'
PREDEFINED_PATTERNS["py_with"]='with $EXPR as $VAR: $$$'
PREDEFINED_PATTERNS["py_try_except"]='try: $$$ except $E: $$$'
PREDEFINED_PATTERNS["py_list_comp"]='[$EXPR for $VAR in $ITER]'
PREDEFINED_PATTERNS["py_dict_comp"]='{$KEY: $VAL for $VAR in $ITER}'

# Rust 模式
PREDEFINED_PATTERNS["rs_function"]='fn $NAME($$$) -> $RET { $$$ }'
PREDEFINED_PATTERNS["rs_struct"]='struct $NAME { $$$ }'
PREDEFINED_PATTERNS["rs_enum"]='enum $NAME { $$$ }'
PREDEFINED_PATTERNS["rs_impl"]='impl $TRAIT for $TYPE { $$$ }'
PREDEFINED_PATTERNS["rs_match"]='match $EXPR { $$$ }'
PREDEFINED_PATTERNS["rs_unwrap"]='$EXPR.unwrap()'
PREDEFINED_PATTERNS["rs_async"]='async fn $NAME($$$) { $$$ }'

# Go 模式
PREDEFINED_PATTERNS["go_function"]='func $NAME($$$) $RET { $$$ }'
PREDEFINED_PATTERNS["go_method"]='func ($RECV $TYPE) $NAME($$$) $RET { $$$ }'
PREDEFINED_PATTERNS["go_struct"]='type $NAME struct { $$$ }'
PREDEFINED_PATTERNS["go_interface"]='type $NAME interface { $$$ }'
PREDEFINED_PATTERNS["go_goroutine"]='go $EXPR'
PREDEFINED_PATTERNS["go_defer"]='defer $EXPR'
PREDEFINED_PATTERNS["go_channel"]='make(chan $TYPE)'

# ==================== 核心功能函数 ====================

# 检查 ast-grep 是否可用
check_ast_grep() {
    if command -v ast-grep &> /dev/null; then
        return 0
    elif command -v sg &> /dev/null; then
        # ast-grep 的别名
        return 0
    else
        return 1
    fi
}

# 获取 ast-grep 命令
get_ast_grep_cmd() {
    if command -v ast-grep &> /dev/null; then
        echo "ast-grep"
    elif command -v sg &> /dev/null; then
        echo "sg"
    fi
}

# 检测文件语言
detect_language() {
    local file="$1"
    local ext="${file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    if [ -n "${EXT_TO_LANG[$ext]}" ]; then
        echo "${EXT_TO_LANG[$ext]}"
    else
        echo "unknown"
    fi
}

# AST 模式搜索
ast_search() {
    local pattern="$1"
    local path="${2:-.}"
    local lang="${3:-}"

    log "AST 搜索: pattern='$pattern', path='$path', lang='$lang'"

    echo "---"
    echo "🔍 AST 结构化搜索"
    echo "📋 模式: $pattern"
    echo "📁 路径: $path"
    [ -n "$lang" ] && echo "🗣️ 语言: $lang"
    echo ""

    if check_ast_grep; then
        local cmd=$(get_ast_grep_cmd)
        echo "📋 搜索结果 (使用 $cmd):"
        echo ""

        if [ -n "$lang" ]; then
            $cmd run --pattern "$pattern" --lang "$lang" "$path" 2>/dev/null | head -50
        else
            $cmd run --pattern "$pattern" "$path" 2>/dev/null | head -50
        fi
    else
        echo "⚠️ ast-grep 未安装，使用后备方案"
        echo ""
        echo "📋 后备搜索结果 (使用正则表达式):"

        # 将 AST 模式转换为正则表达式 (简化版)
        local regex=$(echo "$pattern" | sed 's/\$[A-Z_]*/.*/g' | sed 's/\$\$\$/.*?/g')

        if command -v rg &> /dev/null; then
            rg --multiline "$regex" "$path" 2>/dev/null | head -30
        else
            grep -rn "$regex" "$path" 2>/dev/null | head -30
        fi

        echo ""
        echo "💡 提示: 安装 ast-grep 获得完整 AST 搜索能力"
        echo "   npm install -g @ast-grep/cli"
        echo "   或 cargo install ast-grep"
    fi

    echo "---"
}

# AST 模式替换
ast_replace() {
    local pattern="$1"
    local replacement="$2"
    local path="${3:-.}"
    local lang="${4:-}"

    log "AST 替换: pattern='$pattern', replacement='$replacement', path='$path'"

    echo "---"
    echo "🔄 AST 结构化替换"
    echo "📋 搜索模式: $pattern"
    echo "📝 替换为: $replacement"
    echo "📁 路径: $path"
    echo ""

    if check_ast_grep; then
        local cmd=$(get_ast_grep_cmd)
        echo "📋 预览替换 (使用 $cmd):"
        echo ""

        if [ -n "$lang" ]; then
            $cmd run --pattern "$pattern" --rewrite "$replacement" --lang "$lang" "$path" 2>/dev/null | head -50
        else
            $cmd run --pattern "$pattern" --rewrite "$replacement" "$path" 2>/dev/null | head -50
        fi

        echo ""
        echo "⚠️ 这是预览模式，未实际修改文件"
        echo "💡 确认后使用 --update 参数执行实际替换"
    else
        echo "⚠️ ast-grep 未安装，无法执行 AST 替换"
        echo "💡 安装命令: npm install -g @ast-grep/cli"
    fi

    echo "---"
}

# 使用预定义模式搜索
search_with_preset() {
    local preset_name="$1"
    local path="${2:-.}"

    log "预设模式搜索: $preset_name"

    if [ -n "${PREDEFINED_PATTERNS[$preset_name]}" ]; then
        local pattern="${PREDEFINED_PATTERNS[$preset_name]}"
        echo "🎯 使用预设模式: $preset_name"
        echo "📋 模式: $pattern"
        echo ""
        ast_search "$pattern" "$path"
    else
        echo "---"
        echo "❌ 未知的预设模式: $preset_name"
        echo ""
        echo "📋 可用预设模式:"
        echo ""
        echo "JavaScript/TypeScript:"
        echo "   js_unused_var, js_console_log, js_async_func, js_arrow_func"
        echo "   js_import, js_export_default, js_try_catch, js_promise"
        echo "   js_await, js_react_hook, js_useeffect, js_usestate"
        echo ""
        echo "Python:"
        echo "   py_function, py_class, py_async_def, py_decorator"
        echo "   py_import, py_with, py_try_except, py_list_comp, py_dict_comp"
        echo ""
        echo "Rust:"
        echo "   rs_function, rs_struct, rs_enum, rs_impl"
        echo "   rs_match, rs_unwrap, rs_async"
        echo ""
        echo "Go:"
        echo "   go_function, go_method, go_struct, go_interface"
        echo "   go_goroutine, go_defer, go_channel"
        echo "---"
    fi
}

# 分析代码模式
analyze_code_patterns() {
    local path="${1:-.}"
    local lang="${2:-}"

    log "分析代码模式: path='$path', lang='$lang'"

    echo "---"
    echo "📊 代码模式分析"
    echo "📁 路径: $path"
    [ -n "$lang" ] && echo "🗣️ 语言: $lang"
    echo ""

    if check_ast_grep; then
        local cmd=$(get_ast_grep_cmd)

        echo "📋 常见模式统计:"
        echo ""

        # 根据语言选择分析模式
        case "$lang" in
            "javascript"|"typescript"|"tsx")
                echo "🔹 console.log 调用:"
                $cmd run --pattern 'console.log($$$)' "$path" 2>/dev/null | wc -l

                echo "🔹 async 函数:"
                $cmd run --pattern 'async function $NAME($$$) { $$$ }' "$path" 2>/dev/null | wc -l

                echo "🔹 箭头函数:"
                $cmd run --pattern 'const $NAME = ($$$) => $$$' "$path" 2>/dev/null | wc -l

                echo "🔹 try-catch 块:"
                $cmd run --pattern 'try { $$$ } catch ($E) { $$$ }' "$path" 2>/dev/null | wc -l
                ;;
            "python")
                echo "🔹 函数定义:"
                $cmd run --pattern 'def $NAME($$$): $$$' "$path" 2>/dev/null | wc -l

                echo "🔹 类定义:"
                $cmd run --pattern 'class $NAME($$$): $$$' "$path" 2>/dev/null | wc -l

                echo "🔹 异步函数:"
                $cmd run --pattern 'async def $NAME($$$): $$$' "$path" 2>/dev/null | wc -l
                ;;
            "rust")
                echo "🔹 函数定义:"
                $cmd run --pattern 'fn $NAME($$$) { $$$ }' "$path" 2>/dev/null | wc -l

                echo "🔹 结构体:"
                $cmd run --pattern 'struct $NAME { $$$ }' "$path" 2>/dev/null | wc -l

                echo "🔹 unwrap 调用:"
                $cmd run --pattern '$EXPR.unwrap()' "$path" 2>/dev/null | wc -l
                ;;
            "go")
                echo "🔹 函数定义:"
                $cmd run --pattern 'func $NAME($$$) { $$$ }' "$path" 2>/dev/null | wc -l

                echo "🔹 goroutine:"
                $cmd run --pattern 'go $EXPR' "$path" 2>/dev/null | wc -l

                echo "🔹 defer 调用:"
                $cmd run --pattern 'defer $EXPR' "$path" 2>/dev/null | wc -l
                ;;
            *)
                echo "⚠️ 语言未指定或不支持，进行通用分析"
                ;;
        esac
    else
        echo "⚠️ ast-grep 未安装"
        echo ""
        echo "📋 后备分析 (使用正则):"

        # 简单的代码统计
        echo "🔹 函数/方法数量:"
        grep -rn -E '(function|def |fn |func )' "$path" 2>/dev/null | wc -l

        echo "🔹 类定义数量:"
        grep -rn -E '(class |struct |interface )' "$path" 2>/dev/null | wc -l

        echo "🔹 import/require 语句:"
        grep -rn -E '(import |require\(|from .* import)' "$path" 2>/dev/null | wc -l
    fi

    echo "---"
}

# 显示帮助信息
show_ast_help() {
    echo "---"
    echo "🛠️ AST-Grep 结构化搜索帮助"
    echo ""
    echo "📋 基本用法:"
    echo "   • 搜索模式: \"AST 搜索 console.log(\$\$\$)\""
    echo "   • 替换模式: \"AST 替换 console.log(\$X) 为 logger.info(\$X)\""
    echo "   • 预设搜索: \"查找所有 js_console_log\""
    echo "   • 代码分析: \"分析 src/ 目录的代码模式\""
    echo ""
    echo "📋 元变量语法:"
    echo "   • \$VAR    - 匹配单个标识符"
    echo "   • \$EXPR   - 匹配任意表达式"
    echo "   • \$\$\$     - 匹配零个或多个元素"
    echo "   • _       - 通配符，匹配任意内容"
    echo ""
    echo "🗣️ 支持的语言 (${#SUPPORTED_LANGUAGES[@]} 种):"
    echo "   ${SUPPORTED_LANGUAGES[*]}"
    echo ""
    echo "📋 常用预设模式:"
    echo "   JavaScript: js_console_log, js_async_func, js_react_hook"
    echo "   Python: py_function, py_class, py_decorator"
    echo "   Rust: rs_function, rs_unwrap, rs_async"
    echo "   Go: go_function, go_goroutine, go_defer"
    echo ""
    echo "💡 安装 ast-grep:"
    echo "   npm install -g @ast-grep/cli"
    echo "   cargo install ast-grep --features language-all"
    echo "---"
}

# ==================== 命令检测和处理 ====================

# 检测 AST-Grep 相关命令
detect_ast_commands() {
    local input="$1"

    # AST 搜索请求
    if echo "$input" | grep -qiE "(ast.?grep|ast.?search|ast.?搜索|结构化搜索|语法树搜索)"; then
        return 0
    fi

    # AST 替换请求
    if echo "$input" | grep -qiE "(ast.?replace|ast.?替换|结构化替换)"; then
        return 0
    fi

    # 预设模式请求
    if echo "$input" | grep -qiE "(预设模式|preset|js_|py_|rs_|go_)"; then
        return 0
    fi

    # 代码模式分析请求
    if echo "$input" | grep -qiE "(代码模式|code pattern|模式分析|pattern analysis)"; then
        return 0
    fi

    # 元变量语法相关
    if echo "$input" | grep -qE '\$[A-Z_]+|\$\$\$'; then
        return 0
    fi

    return 1
}

# 解析 AST 命令参数
parse_ast_command() {
    local input="$1"

    # 解析搜索模式
    local pattern=$(echo "$input" | grep -oP "(?<=模式|pattern)['\"]?[^'\"]+['\"]?" | head -1 | tr -d "'\"\`")

    # 解析路径
    local path=$(echo "$input" | grep -oP "(?<=路径|path|目录|dir)['\"]?[a-zA-Z0-9_./\\-]+['\"]?" | head -1 | tr -d "'\"\`")

    # 解析语言
    local lang=$(echo "$input" | grep -oP "(?<=语言|lang|language)['\"]?[a-zA-Z]+['\"]?" | head -1 | tr -d "'\"\`")

    echo "$pattern|$path|$lang"
}

# ==================== 主处理函数 ====================

main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 检测 AST-Grep 命令
    if detect_ast_commands "$input"; then
        log "检测到 AST-Grep 命令请求"

        # 帮助请求
        if echo "$input" | grep -qiE "(帮助|help|用法|usage)"; then
            show_ast_help
            exit 0
        fi

        # 预设模式请求
        local preset=$(echo "$input" | grep -oE "(js_|py_|rs_|go_)[a-z_]+" | head -1)
        if [ -n "$preset" ]; then
            local path=$(echo "$input" | grep -oE "[a-zA-Z0-9_./\\-]+/" | head -1)
            path=${path:-.}
            search_with_preset "$preset" "$path"
            exit 0
        fi

        # 代码模式分析
        if echo "$input" | grep -qiE "(分析|analyze|统计|stat)"; then
            local path=$(echo "$input" | grep -oE "[a-zA-Z0-9_./\\-]+/" | head -1)
            path=${path:-.}
            local lang=$(echo "$input" | grep -oiE "(javascript|typescript|python|rust|go)" | head -1 | tr '[:upper:]' '[:lower:]')
            analyze_code_patterns "$path" "$lang"
            exit 0
        fi

        # 通用搜索请求
        local params=$(parse_ast_command "$input")
        local pattern=$(echo "$params" | cut -d'|' -f1)
        local path=$(echo "$params" | cut -d'|' -f2)
        local lang=$(echo "$params" | cut -d'|' -f3)

        if [ -n "$pattern" ]; then
            path=${path:-.}
            ast_search "$pattern" "$path" "$lang"
        else
            # 尝试直接从输入中提取模式
            pattern=$(echo "$input" | grep -oP "(?<=搜索|search|查找|find)['\"]?[^'\"]+['\"]?" | head -1 | tr -d "'\"\`")
            if [ -n "$pattern" ]; then
                ast_search "$pattern" "."
            else
                show_ast_help
            fi
        fi

        exit 0
    fi

    # 没有检测到 AST 命令，正常退出
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
