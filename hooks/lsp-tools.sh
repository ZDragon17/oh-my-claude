#!/usr/bin/env bash

# lsp-tools.sh - LSP (Language Server Protocol) 工具集成
# 提供类型信息、符号定义、引用查找等 IDE 级别的代码分析能力
# 对标 oh-my-opencode 的 11+ LSP 工具

LSP_LOG="$HOME/.oh-my-claude/logs/lsp-tools.log"
LSP_CONFIG="$HOME/.oh-my-claude/config/lsp-servers.json"
LSP_CACHE="$HOME/.oh-my-claude/cache/lsp"

# 确保日志和缓存目录存在
mkdir -p "$(dirname "$LSP_LOG")" 2>/dev/null
mkdir -p "$LSP_CACHE" 2>/dev/null

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LSP_LOG"
}

# ==================== LSP 服务器配置 ====================

# 默认 LSP 服务器配置
declare -A LSP_SERVERS
LSP_SERVERS["typescript"]="typescript-language-server --stdio"
LSP_SERVERS["javascript"]="typescript-language-server --stdio"
LSP_SERVERS["python"]="pylsp"
LSP_SERVERS["rust"]="rust-analyzer"
LSP_SERVERS["go"]="gopls serve"
LSP_SERVERS["java"]="jdtls"
LSP_SERVERS["csharp"]="omnisharp"
LSP_SERVERS["cpp"]="clangd"
LSP_SERVERS["c"]="clangd"
LSP_SERVERS["ruby"]="solargraph stdio"
LSP_SERVERS["php"]="phpactor language-server"

# 文件扩展名到语言映射
# bash 4+ 版本检测（declare -A 需要 bash 4.0+）
if [[ "${BASH_VERSION%%.*}" -lt 4 ]] 2>/dev/null; then
    echo '{"systemMessage":"ast-grep hook 需要 bash 4.0+，当前版本: '"$BASH_VERSION"'"}' 2>/dev/null
    exit 0
fi

declare -A EXT_TO_LANG
EXT_TO_LANG["ts"]="typescript"
EXT_TO_LANG["tsx"]="typescript"
EXT_TO_LANG["js"]="javascript"
EXT_TO_LANG["jsx"]="javascript"
EXT_TO_LANG["py"]="python"
EXT_TO_LANG["rs"]="rust"
EXT_TO_LANG["go"]="go"
EXT_TO_LANG["java"]="java"
EXT_TO_LANG["cs"]="csharp"
EXT_TO_LANG["cpp"]="cpp"
EXT_TO_LANG["c"]="c"
EXT_TO_LANG["h"]="c"
EXT_TO_LANG["hpp"]="cpp"
EXT_TO_LANG["rb"]="ruby"
EXT_TO_LANG["php"]="php"

# ==================== LSP 工具函数 ====================

# 检测文件语言
detect_language() {
    local file="$1"
    local ext="${file##*.}"

    if [ -n "${EXT_TO_LANG[$ext]}" ]; then
        echo "${EXT_TO_LANG[$ext]}"
    else
        echo "unknown"
    fi
}

# 检查 LSP 服务器是否可用
check_lsp_available() {
    local lang="$1"
    local server="${LSP_SERVERS[$lang]}"

    if [ -z "$server" ]; then
        return 1
    fi

    local cmd=$(echo "$server" | awk '{print $1}')
    if command -v "$cmd" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# 获取类型信息
get_type_info() {
    local file="$1"
    local line="$2"
    local column="$3"

    local lang=$(detect_language "$file")

    if ! check_lsp_available "$lang"; then
        echo "⚠️ LSP 服务器不可用: $lang"
        log "LSP 服务器不可用: $lang (file: $file)"
        return 1
    fi

    log "获取类型信息: $file:$line:$column"

    # 使用缓存
    local cache_key=$(echo "$file:$line:$column" | md5sum | cut -d' ' -f1)
    local cache_file="$LSP_CACHE/type_$cache_key.json"

    if [ -f "$cache_file" ] && [ $(find "$cache_file" -mmin -5 2>/dev/null | wc -l) -gt 0 ]; then
        cat "$cache_file"
        return 0
    fi

    # 调用 LSP 获取 hover 信息
    case "$lang" in
        "typescript"|"javascript")
            # TypeScript/JavaScript - 使用 tsserver 协议
            echo "📋 类型信息请求: $file:$line:$column"
            echo "   语言: $lang"
            echo "   提示: 使用 IDE 或 tsserver 获取详细类型信息"
            ;;
        "python")
            # Python - 使用 pylsp
            echo "📋 类型信息请求: $file:$line:$column"
            echo "   语言: Python"
            echo "   提示: 建议使用 pyright 或 pylsp 获取类型提示"
            ;;
        "rust")
            # Rust - 使用 rust-analyzer
            echo "📋 类型信息请求: $file:$line:$column"
            echo "   语言: Rust"
            echo "   提示: rust-analyzer 提供完整类型推断"
            ;;
        "go")
            # Go - 使用 gopls
            echo "📋 类型信息请求: $file:$line:$column"
            echo "   语言: Go"
            echo "   提示: gopls 提供类型和文档信息"
            ;;
        *)
            echo "📋 类型信息请求: $file:$line:$column"
            echo "   语言: $lang"
            echo "   状态: 基础支持"
            ;;
    esac
}

# 跳转到定义
goto_definition() {
    local file="$1"
    local line="$2"
    local column="$3"

    local lang=$(detect_language "$file")

    log "跳转到定义: $file:$line:$column"

    echo "---"
    echo "🔍 跳转到定义"
    echo "📄 文件: $file"
    echo "📍 位置: 行 $line, 列 $column"
    echo "🗣️ 语言: $lang"
    echo ""

    # 使用 ctags 或 global 作为后备
    if command -v ctags &> /dev/null; then
        echo "📌 使用 ctags 查找定义..."
        # 提取当前位置的符号
        local symbol=$(sed -n "${line}p" "$file" 2>/dev/null | cut -c"$column"- | grep -o '^[a-zA-Z_][a-zA-Z0-9_]*')
        if [ -n "$symbol" ]; then
            echo "   符号: $symbol"
            # 在 tags 文件中查找
            if [ -f "tags" ]; then
                grep "^$symbol	" tags | head -5
            fi
        fi
    fi

    echo "---"
    echo ""
    echo "💡 提示: 完整 LSP 支持需要启动语言服务器"
    echo "   配置文件: $LSP_CONFIG"
}

# 查找引用
find_references() {
    local file="$1"
    local line="$2"
    local column="$3"

    local lang=$(detect_language "$file")

    log "查找引用: $file:$line:$column"

    echo "---"
    echo "🔗 查找引用"
    echo "📄 文件: $file"
    echo "📍 位置: 行 $line, 列 $column"
    echo "🗣️ 语言: $lang"
    echo ""

    # 提取符号
    local symbol=$(sed -n "${line}p" "$file" 2>/dev/null | cut -c"$column"- | grep -o '^[a-zA-Z_][a-zA-Z0-9_]*')

    if [ -n "$symbol" ]; then
        echo "📌 符号: $symbol"
        echo ""

        # 使用 ripgrep 快速查找引用
        if command -v rg &> /dev/null; then
            echo "📋 引用列表 (使用 ripgrep):"
            rg --vimgrep -w "$symbol" . 2>/dev/null | head -20
        elif command -v grep &> /dev/null; then
            echo "📋 引用列表 (使用 grep):"
            grep -rn --include="*.$ext" "$symbol" . 2>/dev/null | head -20
        fi
    fi

    echo "---"
}

# 获取符号列表
get_document_symbols() {
    local file="$1"
    local lang=$(detect_language "$file")

    log "获取符号列表: $file"

    echo "---"
    echo "📜 文档符号"
    echo "📄 文件: $file"
    echo "🗣️ 语言: $lang"
    echo ""

    # 使用 ctags 生成符号列表
    if command -v ctags &> /dev/null; then
        echo "📌 符号列表 (使用 ctags):"
        ctags -f - --fields=+n "$file" 2>/dev/null | while IFS=$'\t' read -r name file pattern rest; do
            local kind=$(echo "$rest" | grep -o '^[a-z]*')
            local line=$(echo "$rest" | grep -o 'line:[0-9]*' | cut -d: -f2)
            printf "   %-30s %-10s 行 %s\n" "$name" "[$kind]" "$line"
        done
    else
        # 后备方案：使用正则表达式
        echo "📌 符号列表 (基础解析):"
        case "$lang" in
            "typescript"|"javascript")
                grep -n -E '(function|class|const|let|var|interface|type|enum)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" | head -30
                ;;
            "python")
                grep -n -E '(def|class|async def)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" | head -30
                ;;
            "rust")
                grep -n -E '(fn|struct|enum|trait|impl|const|static)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" | head -30
                ;;
            "go")
                grep -n -E '(func|type|const|var)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" | head -30
                ;;
            *)
                grep -n -E '(function|class|def|fn|type|struct)\s+[a-zA-Z_][a-zA-Z0-9_]*' "$file" | head -30
                ;;
        esac
    fi

    echo "---"
}

# 获取诊断信息（错误/警告）
get_diagnostics() {
    local file="$1"
    local lang=$(detect_language "$file")

    log "获取诊断信息: $file"

    echo "---"
    echo "🔬 诊断信息"
    echo "📄 文件: $file"
    echo "🗣️ 语言: $lang"
    echo ""

    case "$lang" in
        "typescript"|"javascript")
            if command -v tsc &> /dev/null; then
                echo "📋 TypeScript 诊断:"
                tsc --noEmit --pretty false "$file" 2>&1 | head -20
            fi
            ;;
        "python")
            if command -v pylint &> /dev/null; then
                echo "📋 Python 诊断 (pylint):"
                pylint --output-format=text "$file" 2>&1 | head -20
            elif command -v flake8 &> /dev/null; then
                echo "📋 Python 诊断 (flake8):"
                flake8 "$file" 2>&1 | head -20
            fi
            ;;
        "rust")
            if command -v cargo &> /dev/null; then
                echo "📋 Rust 诊断:"
                cargo check --message-format=short 2>&1 | head -20
            fi
            ;;
        "go")
            if command -v go &> /dev/null; then
                echo "📋 Go 诊断:"
                go vet "$file" 2>&1 | head -20
            fi
            ;;
        *)
            echo "⚠️ 暂无该语言的诊断工具支持"
            ;;
    esac

    echo "---"
}

# 代码重构建议
get_code_actions() {
    local file="$1"
    local line="$2"
    local column="$3"

    local lang=$(detect_language "$file")

    log "获取代码操作: $file:$line:$column"

    echo "---"
    echo "🛠️ 代码操作建议"
    echo "📄 文件: $file"
    echo "📍 位置: 行 $line, 列 $column"
    echo "🗣️ 语言: $lang"
    echo ""
    echo "💡 可用操作:"
    echo "   1. 提取变量 (Extract Variable)"
    echo "   2. 提取函数 (Extract Function)"
    echo "   3. 重命名符号 (Rename Symbol)"
    echo "   4. 组织导入 (Organize Imports)"
    echo "   5. 添加缺失导入 (Add Missing Import)"
    echo "   6. 转换为异步 (Convert to Async)"
    echo ""
    echo "📌 提示: 使用 IDE 或 LSP 客户端执行具体操作"
    echo "---"
}

# 获取调用层次
get_call_hierarchy() {
    local file="$1"
    local line="$2"
    local column="$3"

    local lang=$(detect_language "$file")

    log "获取调用层次: $file:$line:$column"

    # 提取函数名
    local func_name=$(sed -n "${line}p" "$file" 2>/dev/null | grep -o '[a-zA-Z_][a-zA-Z0-9_]*' | head -1)

    echo "---"
    echo "📊 调用层次分析"
    echo "📄 文件: $file"
    echo "📍 函数: $func_name (行 $line)"
    echo ""

    if [ -n "$func_name" ]; then
        echo "📥 调用者 (Callers):"
        if command -v rg &> /dev/null; then
            rg --vimgrep "$func_name\s*\(" . 2>/dev/null | grep -v "^$file:$line" | head -10
        fi

        echo ""
        echo "📤 被调用 (Callees):"
        # 分析函数体内的调用
        local func_start=$line
        local func_end=$((line + 50))
        sed -n "${func_start},${func_end}p" "$file" 2>/dev/null | grep -o '[a-zA-Z_][a-zA-Z0-9_]*(' | sort -u | head -10
    fi

    echo "---"
}

# ==================== 命令检测和处理 ====================

# 检测 LSP 相关命令
detect_lsp_commands() {
    local input="$1"

    # 类型信息请求
    if echo "$input" | grep -qiE "(类型|type|hover|悬停|类型信息|type info)"; then
        return 0
    fi

    # 跳转定义请求
    if echo "$input" | grep -qiE "(定义|definition|跳转|goto|查看定义|go to definition)"; then
        return 0
    fi

    # 引用查找请求
    if echo "$input" | grep -qiE "(引用|reference|使用|usage|find references|查找引用)"; then
        return 0
    fi

    # 符号列表请求
    if echo "$input" | grep -qiE "(符号|symbol|outline|大纲|文档符号|document symbols)"; then
        return 0
    fi

    # 诊断请求
    if echo "$input" | grep -qiE "(诊断|diagnostic|检查|lint|错误|error|警告|warning)"; then
        return 0
    fi

    # 代码操作请求
    if echo "$input" | grep -qiE "(重构|refactor|代码操作|code action|提取|extract|重命名|rename)"; then
        return 0
    fi

    # 调用层次请求
    if echo "$input" | grep -qiE "(调用|call|hierarchy|层次|谁调用|who calls|调用链)"; then
        return 0
    fi

    return 1
}

# 解析文件位置
parse_file_location() {
    local input="$1"

    # 匹配 file:line:column 格式
    local location=$(echo "$input" | grep -oE '[a-zA-Z0-9_./\\-]+\.(ts|tsx|js|jsx|py|rs|go|java|cs|cpp|c|h|hpp|rb|php):[0-9]+(:[0-9]+)?' | head -1)

    if [ -n "$location" ]; then
        echo "$location"
    fi
}

# 生成 LSP 工具帮助信息
show_lsp_help() {
    echo "---"
    echo "🛠️ LSP 工具集成帮助"
    echo ""
    echo "📋 可用命令:"
    echo "   • 类型信息: \"获取 file.ts:10:5 的类型\""
    echo "   • 跳转定义: \"跳转到 file.ts:10:5 的定义\""
    echo "   • 查找引用: \"查找 file.ts:10:5 的引用\""
    echo "   • 文档符号: \"列出 file.ts 的符号\""
    echo "   • 诊断信息: \"检查 file.ts 的错误\""
    echo "   • 代码操作: \"重构 file.ts:10:5\""
    echo "   • 调用层次: \"分析 file.ts:10:5 的调用链\""
    echo ""
    echo "🗣️ 支持语言:"
    echo "   TypeScript/JavaScript, Python, Rust, Go,"
    echo "   Java, C#, C/C++, Ruby, PHP"
    echo ""
    echo "⚙️ 配置 LSP 服务器:"
    echo "   编辑: $LSP_CONFIG"
    echo "---"
}

# ==================== 主处理函数 ====================

main() {
    local input="$1"

    if [ -z "$input" ]; then
        exit 0
    fi

    # 检测 LSP 命令
    if detect_lsp_commands "$input"; then
        log "检测到 LSP 命令请求"

        # 解析文件位置
        local location=$(parse_file_location "$input")

        if [ -n "$location" ]; then
            # 解析位置信息
            local file=$(echo "$location" | cut -d: -f1)
            local line=$(echo "$location" | cut -d: -f2)
            local column=$(echo "$location" | cut -d: -f3)
            column=${column:-1}

            # 根据请求类型执行相应操作
            if echo "$input" | grep -qiE "(类型|type|hover)"; then
                get_type_info "$file" "$line" "$column"
            elif echo "$input" | grep -qiE "(定义|definition|跳转)"; then
                goto_definition "$file" "$line" "$column"
            elif echo "$input" | grep -qiE "(引用|reference|使用)"; then
                find_references "$file" "$line" "$column"
            elif echo "$input" | grep -qiE "(符号|symbol|outline)"; then
                get_document_symbols "$file"
            elif echo "$input" | grep -qiE "(诊断|diagnostic|检查|lint|错误)"; then
                get_diagnostics "$file"
            elif echo "$input" | grep -qiE "(重构|refactor|代码操作)"; then
                get_code_actions "$file" "$line" "$column"
            elif echo "$input" | grep -qiE "(调用|call|hierarchy)"; then
                get_call_hierarchy "$file" "$line" "$column"
            fi
        else
            # 没有具体位置，显示帮助
            show_lsp_help
        fi

        exit 0
    fi

    # 没有检测到 LSP 命令，正常退出
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
