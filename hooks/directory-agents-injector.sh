#!/usr/bin/env bash

# directory-agents-injector.sh - 目录特定代理注入器
# 根据当前工作目录自动注入相关的 Agent 配置
# 对标 oh-my-opencode 的 directory-agents-injector

INJECTOR_LOG="$HOME/.oh-my-claude/logs/directory-agents.log"
AGENTS_CONFIG="$HOME/.oh-my-claude/config/directory-agents.json"

# 确保目录存在
mkdir -p "$(dirname "$INJECTOR_LOG")" 2>/dev/null
mkdir -p "$(dirname "$AGENTS_CONFIG")" 2>/dev/null

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$INJECTOR_LOG"
}

# ==================== 目录检测 ====================

# 检测项目类型
detect_project_type() {
    local dir="${1:-.}"

    # 检测 Node.js 项目
    if [ -f "$dir/package.json" ]; then
        echo "nodejs"
        return
    fi

    # 检测 Python 项目
    if [ -f "$dir/requirements.txt" ] || [ -f "$dir/setup.py" ] || [ -f "$dir/pyproject.toml" ]; then
        echo "python"
        return
    fi

    # 检测 Go 项目
    if [ -f "$dir/go.mod" ]; then
        echo "go"
        return
    fi

    # 检测 Rust 项目
    if [ -f "$dir/Cargo.toml" ]; then
        echo "rust"
        return
    fi

    # 检测 Java 项目
    if [ -f "$dir/pom.xml" ] || [ -f "$dir/build.gradle" ]; then
        echo "java"
        return
    fi

    # 检测 .NET 项目
    if ls "$dir"/*.csproj &>/dev/null || ls "$dir"/*.sln &>/dev/null; then
        echo "dotnet"
        return
    fi

    # 检测 Flutter 项目
    if [ -f "$dir/pubspec.yaml" ]; then
        echo "flutter"
        return
    fi

    # 检测 Ruby 项目
    if [ -f "$dir/Gemfile" ]; then
        echo "ruby"
        return
    fi

    # 检测 PHP 项目
    if [ -f "$dir/composer.json" ]; then
        echo "php"
        return
    fi

    echo "unknown"
}

# 检测项目子类型（框架）
detect_framework() {
    local dir="${1:-.}"
    local project_type="$2"

    case "$project_type" in
        "nodejs")
            # 检测 React
            if grep -q '"react"' "$dir/package.json" 2>/dev/null; then
                # 检测 Next.js
                if grep -q '"next"' "$dir/package.json" 2>/dev/null; then
                    echo "nextjs"
                    return
                fi
                echo "react"
                return
            fi

            # 检测 Vue
            if grep -q '"vue"' "$dir/package.json" 2>/dev/null; then
                # 检测 Nuxt
                if grep -q '"nuxt"' "$dir/package.json" 2>/dev/null; then
                    echo "nuxt"
                    return
                fi
                echo "vue"
                return
            fi

            # 检测 Express
            if grep -q '"express"' "$dir/package.json" 2>/dev/null; then
                echo "express"
                return
            fi

            # 检测 NestJS
            if grep -q '"@nestjs/core"' "$dir/package.json" 2>/dev/null; then
                echo "nestjs"
                return
            fi
            ;;

        "python")
            # 检测 Django
            if grep -q 'django' "$dir/requirements.txt" 2>/dev/null || [ -f "$dir/manage.py" ]; then
                echo "django"
                return
            fi

            # 检测 FastAPI
            if grep -q 'fastapi' "$dir/requirements.txt" 2>/dev/null; then
                echo "fastapi"
                return
            fi

            # 检测 Flask
            if grep -q 'flask' "$dir/requirements.txt" 2>/dev/null; then
                echo "flask"
                return
            fi
            ;;

        "java")
            # 检测 Spring Boot
            if grep -q 'spring-boot' "$dir/pom.xml" 2>/dev/null || grep -q 'spring-boot' "$dir/build.gradle" 2>/dev/null; then
                echo "spring"
                return
            fi
            ;;
    esac

    echo "generic"
}

# 检测目录类型（src/tests/docs等）
detect_directory_context() {
    local dir="${1:-.}"
    local basename=$(basename "$dir")

    case "$basename" in
        "src"|"source"|"lib"|"app")
            echo "source"
            ;;
        "test"|"tests"|"spec"|"specs"|"__tests__")
            echo "test"
            ;;
        "docs"|"documentation"|"doc")
            echo "docs"
            ;;
        "scripts"|"bin"|"tools")
            echo "scripts"
            ;;
        "config"|"configs"|"configuration")
            echo "config"
            ;;
        "components"|"views"|"pages")
            echo "frontend"
            ;;
        "api"|"routes"|"controllers"|"handlers")
            echo "backend"
            ;;
        "models"|"entities"|"schemas")
            echo "data"
            ;;
        "migrations"|"seeds"|"fixtures")
            echo "database"
            ;;
        "assets"|"static"|"public")
            echo "assets"
            ;;
        *)
            echo "general"
            ;;
    esac
}

# ==================== Agent 推荐 ====================

# 获取推荐的 Agent 列表
get_recommended_agents() {
    local project_type="$1"
    local framework="$2"
    local context="$3"

    local agents=""

    # 基于项目类型推荐
    case "$project_type" in
        "nodejs")
            agents="luban wukong"
            [ "$framework" = "react" ] || [ "$framework" = "nextjs" ] && agents="$agents gukaizhi"
            [ "$framework" = "express" ] || [ "$framework" = "nestjs" ] && agents="$agents zhenghe"
            ;;
        "python")
            agents="luban wukong"
            [ "$framework" = "django" ] || [ "$framework" = "fastapi" ] && agents="$agents zhenghe cangjie"
            ;;
        "go")
            agents="luban wukong sunzi"
            ;;
        "rust")
            agents="luban wukong sunzi"
            ;;
        "java")
            agents="luban wukong"
            [ "$framework" = "spring" ] && agents="$agents zhenghe cangjie"
            ;;
    esac

    # 基于目录上下文调整
    case "$context" in
        "test")
            agents="$agents baozheng"
            ;;
        "docs")
            agents="$agents simaqian"
            ;;
        "frontend")
            agents="$agents gukaizhi"
            ;;
        "backend")
            agents="$agents zhenghe"
            ;;
        "database"|"data")
            agents="$agents cangjie"
            ;;
        "config")
            agents="$agents libing"
            ;;
    esac

    # 去重
    echo "$agents" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

# 生成 Agent 注入提示
generate_agent_injection() {
    local project_type="$1"
    local framework="$2"
    local context="$3"
    local recommended_agents="$4"

    local injection="---
🎯 目录特定 Agent 配置

📁 项目类型: $project_type
🔧 框架: $framework
📂 目录上下文: $context

👥 推荐 Agent:
"

    for agent in $recommended_agents; do
        case "$agent" in
            "luban")
                injection="${injection}   🔧 @luban - 精工巧匠，代码实现
"
                ;;
            "wukong")
                injection="${injection}   🔍 @wukong - 代码侦察，快速探索
"
                ;;
            "baozheng")
                injection="${injection}   ⚖️ @baozheng - 测试专家，质量保证
"
                ;;
            "simaqian")
                injection="${injection}   📜 @simaqian - 文档史官，变更记录
"
                ;;
            "gukaizhi")
                injection="${injection}   🎨 @gukaizhi - 界面美学，UI/UX 设计
"
                ;;
            "zhenghe")
                injection="${injection}   🌊 @zhenghe - API 远航，接口集成
"
                ;;
            "cangjie")
                injection="${injection}   📚 @cangjie - 数据库设计，SQL 优化
"
                ;;
            "sunzi")
                injection="${injection}   ⚔️ @sunzi - 性能优化，系统调优
"
                ;;
            "libing")
                injection="${injection}   🏗️ @libing - DevOps，基础设施
"
                ;;
        esac
    done

    injection="${injection}
💡 使用方式:
   @luban 实现这个功能
   @baozheng 添加测试用例
   @simaqian 更新文档
---"

    echo "$injection"
}

# ==================== 配置管理 ====================

# 读取自定义配置
read_custom_config() {
    local dir="${1:-.}"

    # 检查项目级配置
    local project_config="$dir/.oh-my-claude/agents.json"
    if [ -f "$project_config" ]; then
        cat "$project_config"
        return
    fi

    # 检查全局配置
    if [ -f "$AGENTS_CONFIG" ]; then
        cat "$AGENTS_CONFIG"
        return
    fi

    echo "{}"
}

# 保存配置
save_config() {
    local config="$1"
    local dir="${2:-.}"

    local config_dir="$dir/.oh-my-claude"
    mkdir -p "$config_dir" 2>/dev/null

    echo "$config" > "$config_dir/agents.json"
    log "配置已保存: $config_dir/agents.json"
}

# ==================== 主处理逻辑 ====================

# 检测并注入 Agent 配置
inject_directory_agents() {
    local dir="${1:-$(pwd)}"

    log "检测目录: $dir"

    # 检测项目信息
    local project_type=$(detect_project_type "$dir")
    local framework=$(detect_framework "$dir" "$project_type")
    local context=$(detect_directory_context "$dir")

    log "项目类型: $project_type, 框架: $framework, 上下文: $context"

    # 获取推荐 Agent
    local recommended=$(get_recommended_agents "$project_type" "$framework" "$context")

    log "推荐 Agent: $recommended"

    # 生成注入内容
    generate_agent_injection "$project_type" "$framework" "$context" "$recommended"
}

# 显示帮助
show_help() {
    echo "---"
    echo "🛠️ 目录特定 Agent 注入器"
    echo ""
    echo "📋 功能:"
    echo "   • 自动检测项目类型和框架"
    echo "   • 根据目录上下文推荐 Agent"
    echo "   • 支持自定义配置覆盖"
    echo ""
    echo "📋 用法:"
    echo "   • 自动注入: 进入项目目录后自动生效"
    echo "   • 手动触发: \"注入目录 Agent\" 或 \"directory agents\""
    echo "   • 查看配置: \"显示 Agent 配置\""
    echo ""
    echo "📋 配置文件:"
    echo "   • 项目级: .oh-my-claude/agents.json"
    echo "   • 全局: ~/.oh-my-claude/config/directory-agents.json"
    echo ""
    echo "📋 配置示例:"
    echo '   {
     "rules": [
       {
         "pattern": "src/components/*",
         "agents": ["luban", "gukaizhi"]
       },
       {
         "pattern": "tests/*",
         "agents": ["baozheng"]
       }
     ]
   }'
    echo "---"
}

# ==================== 命令检测 ====================

detect_injector_commands() {
    local input="$1"

    # 目录 Agent 相关命令
    if echo "$input" | grep -qiE "(目录|directory).*agent|agent.*注入|inject"; then
        return 0
    fi

    # 配置查看
    if echo "$input" | grep -qiE "(显示|show|查看).*agent.*配置"; then
        return 0
    fi

    return 1
}

# ==================== 主函数 ====================

main() {
    local input="$1"

    if [ -z "$input" ]; then
        # 无输入时，执行自动检测
        inject_directory_agents
        exit 0
    fi

    # 检测命令
    if detect_injector_commands "$input"; then
        log "检测到 Agent 注入命令"

        # 帮助
        if echo "$input" | grep -qiE "(帮助|help)"; then
            show_help
            exit 0
        fi

        # 执行注入
        inject_directory_agents

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
