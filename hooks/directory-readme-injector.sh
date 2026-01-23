#!/usr/bin/env bash
# Directory README Injector Hook
# 功能：检测当前目录的 README.md 并将关键信息注入上下文
# 帮助 Agent 快速理解项目结构和约定

# 环境变量
HOOK_NAME="directory-readme-injector"
PROMPT="${CLAUDE_PROMPT:-}"
WORKING_DIR="${CLAUDE_WORKING_DIR:-$(pwd)}"

# 配置
MAX_README_SIZE=5000  # 最大 README 内容长度
CACHE_DIR="${HOME}/.oh-my-claude/cache/readme"

# 确保缓存目录存在
mkdir -p "$CACHE_DIR"

# ============================================================================
# 核心函数
# ============================================================================

# 计算目录哈希（用于缓存）
get_dir_hash() {
    local dir="$1"
    echo "$dir" | md5sum 2>/dev/null | cut -d' ' -f1 || echo "$(echo "$dir" | shasum | cut -d' ' -f1)"
}

# 检测项目类型
detect_project_type() {
    local dir="$1"
    local project_type=""
    
    if [ -f "$dir/package.json" ]; then
        project_type="nodejs"
        if [ -f "$dir/next.config.js" ] || [ -f "$dir/next.config.mjs" ]; then
            project_type="nextjs"
        elif [ -f "$dir/vite.config.ts" ] || [ -f "$dir/vite.config.js" ]; then
            project_type="vite"
        fi
    elif [ -f "$dir/Cargo.toml" ]; then
        project_type="rust"
    elif [ -f "$dir/go.mod" ]; then
        project_type="golang"
    elif [ -f "$dir/requirements.txt" ] || [ -f "$dir/pyproject.toml" ]; then
        project_type="python"
    elif [ -f "$dir/pom.xml" ] || [ -f "$dir/build.gradle" ]; then
        project_type="java"
    elif [ -f "$dir/*.csproj" ] || [ -f "$dir/*.sln" ]; then
        project_type="dotnet"
    fi
    
    echo "$project_type"
}

# 提取 README 关键信息
extract_readme_info() {
    local readme_path="$1"
    local max_size="$2"
    
    if [ ! -f "$readme_path" ]; then
        return
    fi
    
    # 读取并截断 README
    local content=$(head -c "$max_size" "$readme_path" 2>/dev/null)
    
    if [ -z "$content" ]; then
        return
    fi
    
    # 提取关键部分
    echo "=== README Summary ==="
    echo ""
    
    # 提取项目标题（第一个 # 标题）
    local title=$(echo "$content" | grep -m1 '^# ' | sed 's/^# //')
    if [ -n "$title" ]; then
        echo "Project: $title"
    fi
    
    # 提取描述（标题后的第一段）
    local desc=$(echo "$content" | sed -n '/^# /,/^$/p' | tail -n +2 | head -5)
    if [ -n "$desc" ]; then
        echo "Description: $desc"
    fi
    
    # 检测技术栈标签
    local tech_stack=""
    if echo "$content" | grep -qiE 'typescript|javascript|react|vue|angular'; then
        tech_stack="$tech_stack frontend"
    fi
    if echo "$content" | grep -qiE 'node\.js|express|fastify|nestjs'; then
        tech_stack="$tech_stack backend-node"
    fi
    if echo "$content" | grep -qiE 'python|django|flask|fastapi'; then
        tech_stack="$tech_stack backend-python"
    fi
    if echo "$content" | grep -qiE 'rust|cargo'; then
        tech_stack="$tech_stack rust"
    fi
    if echo "$content" | grep -qiE 'docker|kubernetes|k8s'; then
        tech_stack="$tech_stack devops"
    fi
    
    if [ -n "$tech_stack" ]; then
        echo "Tech Stack:$tech_stack"
    fi
    
    # 提取安装/使用命令
    if echo "$content" | grep -qiE '```(bash|sh|shell)'; then
        echo ""
        echo "Key Commands:"
        echo "$content" | sed -n '/```\(bash\|sh\|shell\)/,/```/p' | head -20
    fi
    
    # 检测是否有贡献指南
    if echo "$content" | grep -qiE 'contributing|贡献'; then
        echo ""
        echo "Note: This project has contribution guidelines."
    fi
    
    echo ""
    echo "=== End README Summary ==="
}

# 查找项目根目录
find_project_root() {
    local dir="$1"
    local current="$dir"
    
    # 向上查找，直到找到 .git 或 package.json 等项目标记
    while [ "$current" != "/" ] && [ "$current" != "" ]; do
        if [ -d "$current/.git" ] || [ -f "$current/package.json" ] || [ -f "$current/Cargo.toml" ] || [ -f "$current/go.mod" ]; then
            echo "$current"
            return
        fi
        current=$(dirname "$current")
    done
    
    # 未找到，返回原始目录
    echo "$dir"
}

# ============================================================================
# 主逻辑
# ============================================================================

main() {
    # 只在有提示时运行
    if [ -z "$PROMPT" ]; then
        exit 0
    fi
    
    # 查找项目根目录
    local project_root=$(find_project_root "$WORKING_DIR")
    
    # 检查 README 是否存在
    local readme_path=""
    for name in "README.md" "readme.md" "README.MD" "Readme.md"; do
        if [ -f "$project_root/$name" ]; then
            readme_path="$project_root/$name"
            break
        fi
    done
    
    if [ -z "$readme_path" ]; then
        exit 0
    fi
    
    # 检查缓存
    local dir_hash=$(get_dir_hash "$project_root")
    local cache_file="$CACHE_DIR/${dir_hash}.txt"
    local readme_mtime=$(stat -c %Y "$readme_path" 2>/dev/null || stat -f %m "$readme_path" 2>/dev/null)
    local cache_mtime=$(stat -c %Y "$cache_file" 2>/dev/null || stat -f %m "$cache_file" 2>/dev/null || echo "0")
    
    # 如果缓存有效，使用缓存
    if [ -f "$cache_file" ] && [ "$cache_mtime" -gt "$readme_mtime" ] 2>/dev/null; then
        cat "$cache_file"
        exit 0
    fi
    
    # 生成项目信息
    local output=""
    
    # 检测项目类型
    local project_type=$(detect_project_type "$project_root")
    if [ -n "$project_type" ]; then
        output="[Directory Context] Project Type: $project_type\n"
    fi
    
    # 提取 README 信息
    local readme_info=$(extract_readme_info "$readme_path" "$MAX_README_SIZE")
    if [ -n "$readme_info" ]; then
        output="${output}${readme_info}"
    fi
    
    # 缓存结果
    if [ -n "$output" ]; then
        echo -e "$output" > "$cache_file"
        echo -e "$output"
    fi
}

# 执行
main
