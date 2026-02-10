#!/usr/bin/env bash

# rules-injector.sh - 规则注入系统
# 根据项目和目录自动注入自定义规则
# 对标 oh-my-opencode 的 rules-injector

RULES_LOG="$HOME/.oh-my-claude/logs/rules-injector.log"
GLOBAL_RULES_DIR="$HOME/.oh-my-claude/rules"
PROJECT_RULES_DIR=".claude/rules"

# 确保目录存在
mkdir -p "$(dirname "$RULES_LOG")" 2>/dev/null
mkdir -p "$GLOBAL_RULES_DIR" 2>/dev/null

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$RULES_LOG"
}

# ==================== 规则加载 ====================

# 加载单个规则文件
load_rule_file() {
    local file="$1"

    if [ ! -f "$file" ]; then
        return 1
    fi

    log "加载规则文件: $file"

    # 读取文件内容
    local content=$(cat "$file")
    local filename=$(basename "$file" .md)

    echo "📋 规则: $filename"
    echo "$content"
    echo ""
}

# 加载目录中的所有规则
load_rules_from_dir() {
    local dir="$1"
    local pattern="${2:-*.md}"

    if [ ! -d "$dir" ]; then
        return 1
    fi

    log "加载规则目录: $dir"

    local count=0
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            load_rule_file "$file"
            ((count++))
        fi
    done < <(find "$dir" -maxdepth 1 -name "$pattern" -type f 2>/dev/null)

    log "加载了 $count 个规则文件"
    return $count
}

# 加载项目规则
load_project_rules() {
    local project_dir="${1:-.}"
    local rules_dir="$project_dir/$PROJECT_RULES_DIR"

    echo "---"
    echo "📂 项目规则"
    echo ""

    if [ -d "$rules_dir" ]; then
        load_rules_from_dir "$rules_dir"
    else
        echo "💡 项目无自定义规则"
        echo "   创建目录: $PROJECT_RULES_DIR/"
        echo "   添加规则文件: *.md"
    fi

    echo "---"
}

# 加载全局规则
load_global_rules() {
    echo "---"
    echo "🌐 全局规则"
    echo ""

    if [ -d "$GLOBAL_RULES_DIR" ]; then
        load_rules_from_dir "$GLOBAL_RULES_DIR"
    else
        echo "💡 无全局规则"
        echo "   目录: $GLOBAL_RULES_DIR/"
    fi

    echo "---"
}

# 加载按语言分类的规则
load_language_rules() {
    local lang="$1"
    local rules_file="$GLOBAL_RULES_DIR/${lang}.md"

    if [ -f "$rules_file" ]; then
        echo "---"
        echo "🗣️ $lang 语言规则"
        echo ""
        load_rule_file "$rules_file"
        echo "---"
    fi
}

# ==================== 规则匹配 ====================

# 基于文件路径匹配规则
match_path_rules() {
    local filepath="$1"
    local rules_config="$2"

    # 检查是否有路径匹配规则
    if [ ! -f "$rules_config" ]; then
        return 0
    fi

    # 读取配置并匹配
    while IFS= read -r line; do
        local pattern=$(echo "$line" | cut -d'|' -f1)
        local rule_file=$(echo "$line" | cut -d'|' -f2)

        if echo "$filepath" | grep -qE "$pattern"; then
            log "路径匹配: $filepath -> $rule_file"
            load_rule_file "$rule_file"
        fi
    done < "$rules_config"
}

# 基于任务类型匹配规则
match_task_rules() {
    local task="$1"

    local matched=false

    # 代码审查任务
    if echo "$task" | grep -qiE "(review|审查|检查|code review)"; then
        if [ -f "$GLOBAL_RULES_DIR/code-review.md" ]; then
            load_rule_file "$GLOBAL_RULES_DIR/code-review.md"
            matched=true
        fi
    fi

    # 测试任务
    if echo "$task" | grep -qiE "(test|测试|单元测试|集成测试)"; then
        if [ -f "$GLOBAL_RULES_DIR/testing.md" ]; then
            load_rule_file "$GLOBAL_RULES_DIR/testing.md"
            matched=true
        fi
    fi

    # API 设计任务
    if echo "$task" | grep -qiE "(api|接口|REST|GraphQL)"; then
        if [ -f "$GLOBAL_RULES_DIR/api-design.md" ]; then
            load_rule_file "$GLOBAL_RULES_DIR/api-design.md"
            matched=true
        fi
    fi

    # 数据库任务
    if echo "$task" | grep -qiE "(database|数据库|SQL|migration|迁移)"; then
        if [ -f "$GLOBAL_RULES_DIR/database.md" ]; then
            load_rule_file "$GLOBAL_RULES_DIR/database.md"
            matched=true
        fi
    fi

    # 安全相关任务
    if echo "$task" | grep -qiE "(security|安全|认证|授权|加密)"; then
        if [ -f "$GLOBAL_RULES_DIR/security.md" ]; then
            load_rule_file "$GLOBAL_RULES_DIR/security.md"
            matched=true
        fi
    fi

    # 性能优化任务
    if echo "$task" | grep -qiE "(performance|性能|优化|缓存)"; then
        if [ -f "$GLOBAL_RULES_DIR/performance.md" ]; then
            load_rule_file "$GLOBAL_RULES_DIR/performance.md"
            matched=true
        fi
    fi

    # 文档任务
    if echo "$task" | grep -qiE "(document|文档|README|changelog)"; then
        if [ -f "$GLOBAL_RULES_DIR/documentation.md" ]; then
            load_rule_file "$GLOBAL_RULES_DIR/documentation.md"
            matched=true
        fi
    fi

    if [ "$matched" = false ]; then
        log "无匹配的任务规则: $task"
    fi
}

# ==================== 规则管理 ====================

# 列出所有可用规则
list_available_rules() {
    echo "---"
    echo "📋 可用规则列表"
    echo ""

    echo "🌐 全局规则 ($GLOBAL_RULES_DIR):"
    if [ -d "$GLOBAL_RULES_DIR" ]; then
        ls -1 "$GLOBAL_RULES_DIR"/*.md 2>/dev/null | while read -r file; do
            local name=$(basename "$file" .md)
            local desc=$(head -1 "$file" | sed 's/^#\s*//')
            printf "   %-20s %s\n" "$name" "$desc"
        done
    else
        echo "   (无)"
    fi

    echo ""
    echo "📂 项目规则 ($PROJECT_RULES_DIR):"
    if [ -d "$PROJECT_RULES_DIR" ]; then
        ls -1 "$PROJECT_RULES_DIR"/*.md 2>/dev/null | while read -r file; do
            local name=$(basename "$file" .md)
            local desc=$(head -1 "$file" | sed 's/^#\s*//')
            printf "   %-20s %s\n" "$name" "$desc"
        done
    else
        echo "   (无)"
    fi

    echo "---"
}

# 创建新规则
create_rule() {
    local name="$1"
    local scope="${2:-global}"  # global 或 project

    local target_dir="$GLOBAL_RULES_DIR"
    if [ "$scope" = "project" ]; then
        target_dir="$PROJECT_RULES_DIR"
        mkdir -p "$target_dir" 2>/dev/null
    fi

    local rule_file="$target_dir/${name}.md"

    if [ -f "$rule_file" ]; then
        echo "⚠️ 规则已存在: $rule_file"
        return 1
    fi

    # 创建规则模板
    cat > "$rule_file" << 'EOF'
# 规则名称

## 描述

在此描述规则的目的和适用场景。

## 规则内容

### 代码规范

- 规则 1
- 规则 2
- 规则 3

### 最佳实践

- 实践 1
- 实践 2

### 禁止事项

- 禁止 1
- 禁止 2

## 示例

### 正确示例

```
// 正确的代码示例
```

### 错误示例

```
// 错误的代码示例
```

## 参考

- 参考链接 1
- 参考链接 2
EOF

    log "创建规则: $rule_file"
    echo "✅ 规则已创建: $rule_file"
    echo "💡 请编辑文件填写具体规则内容"
}

# 删除规则
delete_rule() {
    local name="$1"
    local scope="${2:-global}"

    local target_dir="$GLOBAL_RULES_DIR"
    if [ "$scope" = "project" ]; then
        target_dir="$PROJECT_RULES_DIR"
    fi

    local rule_file="$target_dir/${name}.md"

    if [ ! -f "$rule_file" ]; then
        echo "⚠️ 规则不存在: $rule_file"
        return 1
    fi

    rm "$rule_file"
    log "删除规则: $rule_file"
    echo "✅ 规则已删除: $rule_file"
}

# ==================== 规则注入生成 ====================

# 生成完整的规则注入
generate_full_injection() {
    local project_dir="${1:-.}"
    local task="$2"

    echo "---"
    echo "📜 规则注入"
    echo ""

    # 检测项目语言
    local lang=""
    if [ -f "$project_dir/package.json" ]; then
        lang="typescript"
    elif [ -f "$project_dir/requirements.txt" ] || [ -f "$project_dir/pyproject.toml" ]; then
        lang="python"
    elif [ -f "$project_dir/go.mod" ]; then
        lang="go"
    elif [ -f "$project_dir/Cargo.toml" ]; then
        lang="rust"
    elif [ -f "$project_dir/pom.xml" ]; then
        lang="java"
    fi

    # 1. 加载语言规则
    if [ -n "$lang" ]; then
        load_language_rules "$lang"
    fi

    # 2. 加载全局规则
    load_global_rules

    # 3. 加载项目规则
    load_project_rules "$project_dir"

    # 4. 基于任务匹配规则
    if [ -n "$task" ]; then
        echo "---"
        echo "🎯 任务相关规则"
        echo ""
        match_task_rules "$task"
        echo "---"
    fi

    echo ""
    echo "💡 规则加载完成"
    echo "   使用 '/rules list' 查看所有可用规则"
    echo "   使用 '/rules create <name>' 创建新规则"
    echo "---"
}

# 显示帮助
show_help() {
    echo "---"
    echo "🛠️ 规则注入系统"
    echo ""
    echo "📋 功能:"
    echo "   • 自动加载项目和全局规则"
    echo "   • 基于任务类型匹配规则"
    echo "   • 支持语言特定规则"
    echo "   • 规则创建和管理"
    echo ""
    echo "📋 命令:"
    echo "   /rules list          - 列出所有规则"
    echo "   /rules load          - 加载规则"
    echo "   /rules create <name> - 创建新规则"
    echo "   /rules delete <name> - 删除规则"
    echo ""
    echo "📋 规则文件位置:"
    echo "   全局: $GLOBAL_RULES_DIR/"
    echo "   项目: $PROJECT_RULES_DIR/"
    echo ""
    echo "📋 规则文件格式:"
    echo "   • Markdown 格式 (.md)"
    echo "   • 第一行为规则标题 (# 标题)"
    echo "   • 支持代码示例、列表、链接"
    echo "---"
}

# ==================== 命令检测 ====================

detect_rules_commands() {
    local input="$1"

    # 规则相关命令
    if echo "$input" | grep -qiE "(规则|rules|rule)"; then
        return 0
    fi

    # 列出规则
    if echo "$input" | grep -qiE "(列出|list|显示).*规则"; then
        return 0
    fi

    # 创建规则
    if echo "$input" | grep -qiE "(创建|create|新建).*规则"; then
        return 0
    fi

    return 1
}

# ==================== 主函数 ====================

main() {
    local input="$1"

    if [ -z "$input" ]; then
        # 无输入时，执行默认注入
        generate_full_injection
        exit 0
    fi

    # 检测规则命令
    if detect_rules_commands "$input"; then
        log "检测到规则命令"

        # 帮助
        if echo "$input" | grep -qiE "(帮助|help)"; then
            show_help
            exit 0
        fi

        # 列出规则
        if echo "$input" | grep -qiE "(列出|list|显示)"; then
            list_available_rules
            exit 0
        fi

        # 创建规则
        if echo "$input" | grep -qiE "(创建|create|新建)"; then
            local name=$(echo "$input" | grep -oE '[a-zA-Z0-9_-]+$' | tail -1)
            if [ -n "$name" ]; then
                create_rule "$name"
            else
                echo "⚠️ 请指定规则名称: /rules create <name>"
            fi
            exit 0
        fi

        # 删除规则
        if echo "$input" | grep -qiE "(删除|delete|remove)"; then
            local name=$(echo "$input" | grep -oE '[a-zA-Z0-9_-]+$' | tail -1)
            if [ -n "$name" ]; then
                delete_rule "$name"
            else
                echo "⚠️ 请指定规则名称: /rules delete <name>"
            fi
            exit 0
        fi

        # 默认：加载规则
        generate_full_injection "." "$input"
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
