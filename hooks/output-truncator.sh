#!/bin/bash

# output-truncator.sh - 输出管理和截断器
# 智能截断大型输出，防止令牌溢出
# 对标 oh-my-opencode 的 grep-output-truncator

TRUNCATOR_LOG="$HOME/.oh-my-claude/logs/output-truncator.log"
TRUNCATOR_CACHE="$HOME/.oh-my-claude/cache/truncated"

# 确保目录存在
mkdir -p "$(dirname "$TRUNCATOR_LOG")" 2>/dev/null
mkdir -p "$TRUNCATOR_CACHE" 2>/dev/null

# 配置参数
MAX_LINES="${OH_MY_CLAUDE_MAX_OUTPUT_LINES:-200}"           # 最大行数
MAX_CHARS="${OH_MY_CLAUDE_MAX_OUTPUT_CHARS:-10000}"         # 最大字符数
MAX_FILE_SIZE="${OH_MY_CLAUDE_MAX_FILE_SIZE:-50000}"        # 最大文件大小（字节）
AGGRESSIVE_MODE="${OH_MY_CLAUDE_AGGRESSIVE_TRUNCATION:-false}"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$TRUNCATOR_LOG"
}

# ==================== 输出截断函数 ====================

# 截断文本输出
truncate_text() {
    local text="$1"
    local max_lines="${2:-$MAX_LINES}"
    local max_chars="${3:-$MAX_CHARS}"

    local line_count=$(echo "$text" | wc -l)
    local char_count=${#text}

    log "截断检查: $line_count 行, $char_count 字符"

    # 如果在限制内，直接返回
    if [ "$line_count" -le "$max_lines" ] && [ "$char_count" -le "$max_chars" ]; then
        echo "$text"
        return 0
    fi

    local truncated=""
    local truncated_lines=0
    local truncated_chars=0

    # 按行截断
    if [ "$line_count" -gt "$max_lines" ]; then
        # 保留前半部分和后半部分
        local head_lines=$((max_lines / 2))
        local tail_lines=$((max_lines / 2))

        local head_part=$(echo "$text" | head -n "$head_lines")
        local tail_part=$(echo "$text" | tail -n "$tail_lines")
        local omitted=$((line_count - max_lines))

        truncated="$head_part

... 📋 省略 $omitted 行 (共 $line_count 行) ...

$tail_part"
        truncated_lines=$omitted
    else
        truncated="$text"
    fi

    # 按字符截断
    local current_chars=${#truncated}
    if [ "$current_chars" -gt "$max_chars" ]; then
        local head_chars=$((max_chars / 2))
        local tail_chars=$((max_chars / 2))

        local head_part="${truncated:0:$head_chars}"
        local tail_part="${truncated: -$tail_chars}"
        local omitted=$((current_chars - max_chars))

        truncated="$head_part

... 📝 省略 $omitted 字符 (共 $current_chars 字符) ...

$tail_part"
        truncated_chars=$omitted
    fi

    log "截断完成: 省略 $truncated_lines 行, $truncated_chars 字符"
    echo "$truncated"
}

# 截断 grep/ripgrep 输出
truncate_grep_output() {
    local output="$1"
    local max_matches="${2:-50}"

    local match_count=$(echo "$output" | wc -l)

    log "Grep 输出截断: $match_count 个匹配"

    if [ "$match_count" -le "$max_matches" ]; then
        echo "$output"
        return 0
    fi

    # 保留前后部分
    local head_matches=$((max_matches / 2))
    local tail_matches=$((max_matches / 2))

    local head_part=$(echo "$output" | head -n "$head_matches")
    local tail_part=$(echo "$output" | tail -n "$tail_matches")
    local omitted=$((match_count - max_matches))

    echo "$head_part"
    echo ""
    echo "... 🔍 省略 $omitted 个匹配结果 (共 $match_count 个) ..."
    echo ""
    echo "$tail_part"
    echo ""
    echo "💡 提示: 使用更精确的模式缩小搜索范围"
}

# 截断文件内容
truncate_file_content() {
    local file="$1"
    local max_size="${2:-$MAX_FILE_SIZE}"

    if [ ! -f "$file" ]; then
        echo "⚠️ 文件不存在: $file"
        return 1
    fi

    local file_size=$(stat -f%z "$file" 2>/dev/null || stat --printf="%s" "$file" 2>/dev/null || echo "0")
    local line_count=$(wc -l < "$file" 2>/dev/null)

    log "文件截断检查: $file ($file_size 字节, $line_count 行)"

    if [ "$file_size" -le "$max_size" ]; then
        cat "$file"
        return 0
    fi

    echo "---"
    echo "📄 文件: $file"
    echo "📊 大小: $file_size 字节 (超过限制 $max_size)"
    echo "📊 行数: $line_count"
    echo ""

    # 显示文件头部
    echo "📋 文件开头:"
    head -n 30 "$file"

    echo ""
    echo "... 📂 文件过大，已截断显示 ..."
    echo ""

    # 显示文件尾部
    echo "📋 文件结尾:"
    tail -n 20 "$file"

    echo ""
    echo "💡 提示:"
    echo "   • 使用 head/tail 查看特定部分"
    echo "   • 使用 grep 搜索特定内容"
    echo "   • 使用编辑器打开完整文件"
    echo "---"
}

# 截断 JSON 输出
truncate_json() {
    local json="$1"
    local max_depth="${2:-3}"
    local max_array="${3:-10}"

    local json_length=${#json}

    log "JSON 截断: $json_length 字符"

    if [ "$json_length" -le "$MAX_CHARS" ]; then
        echo "$json"
        return 0
    fi

    # 使用 jq 截断（如果可用）
    if command -v jq &> /dev/null; then
        # 截断数组和深层结构
        local truncated=$(echo "$json" | jq -c "
            walk(
                if type == \"array\" and length > $max_array then
                    .[:$max_array] + [\"... 更多项已省略\"]
                elif type == \"string\" and length > 200 then
                    .[:200] + \"...\"
                else
                    .
                end
            )
        " 2>/dev/null)

        if [ -n "$truncated" ]; then
            echo "$truncated" | jq '.'
            return 0
        fi
    fi

    # 后备：简单文本截断
    truncate_text "$json"
}

# 截断日志输出
truncate_logs() {
    local logs="$1"
    local max_entries="${2:-100}"

    local entry_count=$(echo "$logs" | grep -c -E '^\[|^[0-9]{4}-[0-9]{2}-[0-9]{2}|^ERROR|^WARN|^INFO|^DEBUG')

    log "日志截断: 约 $entry_count 条"

    if [ "$entry_count" -le "$max_entries" ]; then
        echo "$logs"
        return 0
    fi

    # 优先保留错误和警告
    local errors=$(echo "$logs" | grep -i -E 'error|exception|fail' | head -n 20)
    local warnings=$(echo "$logs" | grep -i -E 'warn' | head -n 10)
    local recent=$(echo "$logs" | tail -n 30)

    echo "---"
    echo "📋 日志摘要 (共约 $entry_count 条)"
    echo ""

    if [ -n "$errors" ]; then
        echo "❌ 错误 (最多 20 条):"
        echo "$errors"
        echo ""
    fi

    if [ -n "$warnings" ]; then
        echo "⚠️ 警告 (最多 10 条):"
        echo "$warnings"
        echo ""
    fi

    echo "📜 最近日志 (30 条):"
    echo "$recent"
    echo ""
    echo "💡 提示: 使用 grep 过滤特定日志级别或关键词"
    echo "---"
}

# ==================== 激进截断模式 ====================

# 激进截断（用于紧急情况）
aggressive_truncate() {
    local content="$1"
    local target_size="${2:-2000}"

    log "激进截断: 目标 $target_size 字符"

    local content_length=${#content}

    if [ "$content_length" -le "$target_size" ]; then
        echo "$content"
        return 0
    fi

    # 提取最重要的信息
    local summary=""

    # 提取错误信息
    local errors=$(echo "$content" | grep -i -E 'error|fail|exception' | head -3)
    if [ -n "$errors" ]; then
        summary="${summary}❌ 错误:\n$errors\n\n"
    fi

    # 提取关键结果
    local results=$(echo "$content" | grep -i -E 'result|success|complete|done' | head -3)
    if [ -n "$results" ]; then
        summary="${summary}✅ 结果:\n$results\n\n"
    fi

    # 提取数字统计
    local stats=$(echo "$content" | grep -o -E '[0-9]+ (files?|errors?|warnings?|lines?|matches?)' | head -5)
    if [ -n "$stats" ]; then
        summary="${summary}📊 统计: $stats\n\n"
    fi

    # 添加内容片段
    local snippet_size=$((target_size - ${#summary} - 200))
    if [ "$snippet_size" -gt 0 ]; then
        local head_size=$((snippet_size / 2))
        local tail_size=$((snippet_size / 2))

        summary="${summary}📄 内容片段:\n${content:0:$head_size}\n...\n${content: -$tail_size}"
    fi

    echo -e "---
🗜️ 激进截断模式
📊 原始大小: $content_length 字符
📊 目标大小: $target_size 字符

$summary
---"
}

# ==================== PostToolUse 处理 ====================

# 处理工具输出
process_tool_output() {
    local tool_name="$1"
    local output="$2"

    log "处理工具输出: $tool_name"

    case "$tool_name" in
        "Grep"|"grep"|"rg"|"ripgrep")
            truncate_grep_output "$output"
            ;;
        "Read"|"cat"|"less"|"more")
            truncate_text "$output"
            ;;
        "Bash"|"bash"|"sh")
            # 检测输出类型
            if echo "$output" | head -1 | grep -qE '^\s*\{|\[\s*\{'; then
                truncate_json "$output"
            elif echo "$output" | grep -qE '^\[|^[0-9]{4}-[0-9]{2}-[0-9]{2}'; then
                truncate_logs "$output"
            else
                truncate_text "$output"
            fi
            ;;
        "glob"|"find"|"ls")
            truncate_text "$output" 100  # 文件列表限制更严格
            ;;
        *)
            truncate_text "$output"
            ;;
    esac
}

# ==================== 命令检测 ====================

detect_truncation_commands() {
    local input="$1"

    # 截断相关命令
    if echo "$input" | grep -qiE "(截断|truncate|省略|limit|限制).*输出"; then
        return 0
    fi

    # 输出管理
    if echo "$input" | grep -qiE "(输出|output).*管理|设置"; then
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

    # 检测截断命令
    if detect_truncation_commands "$input"; then
        log "检测到截断命令"

        echo "---"
        echo "📋 输出截断器配置"
        echo ""
        echo "当前设置:"
        echo "   • 最大行数: $MAX_LINES"
        echo "   • 最大字符: $MAX_CHARS"
        echo "   • 最大文件: $MAX_FILE_SIZE 字节"
        echo "   • 激进模式: $AGGRESSIVE_MODE"
        echo ""
        echo "环境变量配置:"
        echo "   OH_MY_CLAUDE_MAX_OUTPUT_LINES=200"
        echo "   OH_MY_CLAUDE_MAX_OUTPUT_CHARS=10000"
        echo "   OH_MY_CLAUDE_MAX_FILE_SIZE=50000"
        echo "   OH_MY_CLAUDE_AGGRESSIVE_TRUNCATION=false"
        echo "---"

        exit 0
    fi

    # 检测是否需要截断当前输入
    local input_lines=$(echo "$input" | wc -l)
    local input_chars=${#input}

    if [ "$input_lines" -gt "$MAX_LINES" ] || [ "$input_chars" -gt "$MAX_CHARS" ]; then
        log "输入需要截断: $input_lines 行, $input_chars 字符"

        if [ "$AGGRESSIVE_MODE" = "true" ]; then
            aggressive_truncate "$input"
        else
            truncate_text "$input"
        fi

        exit 0
    fi

    exit 0
}

# 执行主函数
main "$@"
