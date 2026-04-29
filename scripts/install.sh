#!/usr/bin/env bash

# oh-my-claude 一键安装脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.sh | bash
# 或者: wget -qO- https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.sh | bash
#
# 兼容性: macOS (bash 3.2+), Linux (bash 4.0+), Windows (Git Bash)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
REPO="ZDragon17/oh-my-claude"
PLUGIN_NAME="oh-my-claude"

# Windows 兼容性：确保 HOME 变量正确设置
if [[ "$(uname -s)" == MINGW* ]] || [[ "$(uname -s)" == MSYS* ]] || [[ "$(uname -s)" == CYGWIN* ]]; then
    # Windows Git Bash 环境
    IS_WINDOWS=true
    # 如果 HOME 未设置或为空，使用 USERPROFILE
    if [ -z "$HOME" ] && [ -n "$USERPROFILE" ]; then
        HOME=$(cygpath -u "$USERPROFILE" 2>/dev/null || echo "$USERPROFILE" | sed 's|\\|/|g' | sed 's|^\([A-Za-z]\):|/\L\1|')
    fi
    # 确保 HOME 是 Unix 风格路径 (/c/Users/xxx)
    HOME=$(cygpath -u "$HOME" 2>/dev/null || echo "$HOME")
else
    IS_WINDOWS=false
fi

INSTALL_DIR="$HOME/.claude/plugins/$PLUGIN_NAME"
COMMANDS_DIR="$HOME/.claude/commands"
SKILLS_DIR="$HOME/.claude/skills"
SETTINGS_FILE="$HOME/.claude/settings.json"

# 输出函数
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🏔️  oh-my-claude 安装程序"
    echo "   基于中国传统文化的 Claude Code 智能编排插件"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
}

# 检查依赖
check_dependencies() {
    info "检查依赖..."

    # 检查 git (使用 >/dev/null 2>&1 替代 &> 以兼容 bash 3.2)
    if ! command -v git >/dev/null 2>&1; then
        error "需要 git，请先安装: https://git-scm.com/"
    fi

    # 检查 Claude Code
    if ! command -v claude >/dev/null 2>&1; then
        warn "未检测到 Claude Code CLI"
        warn "请先安装 Claude Code: https://claude.ai/code"
        warn "安装后重新运行此脚本"
        exit 1
    fi

    success "依赖检查通过"
}

# 带重试的 Git 克隆
git_clone_with_retry() {
    local repo_url="$1"
    local dest_dir="$2"
    local max_retries="${3:-3}"
    local delay_seconds="${4:-5}"

    local attempt=0
    local last_error=""

    while [ $attempt -lt $max_retries ]; do
        attempt=$((attempt + 1))
        info "下载尝试 $attempt/$max_retries..."

        # 清理目标目录（如果存在）
        rm -rf "$dest_dir" 2>/dev/null || true

        # 尝试克隆
        if last_error=$(git clone --depth 1 "$repo_url" "$dest_dir" 2>&1); then
            return 0
        fi

        if [ $attempt -lt $max_retries ]; then
            warn "下载失败，${delay_seconds} 秒后重试..."
            sleep $delay_seconds
            # 指数退避
            delay_seconds=$((delay_seconds * 2))
        fi
    done

    # 所有重试都失败
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}下载失败，请尝试以下解决方案：${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}1. 检查网络连接${NC}"
    echo "   ping github.com"
    echo ""
    echo -e "${YELLOW}2. 检查 Git 配置${NC}"
    echo "   git config --global http.sslVerify false  # 临时禁用 SSL 验证"
    echo ""
    echo -e "${YELLOW}3. 使用代理（如有）${NC}"
    echo "   git config --global http.proxy http://your-proxy:port"
    echo ""
    echo -e "${YELLOW}4. 手动下载${NC}"
    echo "   访问: https://github.com/$REPO/releases"
    echo "   下载 tar.gz 后解压到: $INSTALL_DIR"
    echo ""
    if [ -n "$last_error" ]; then
        echo "错误详情: $last_error"
    fi

    return 1
}

# 下载并安装
install_plugin() {
    info "正在下载 oh-my-claude..."

    # 创建临时目录
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # 带重试的克隆
    if ! git_clone_with_retry "https://github.com/$REPO.git" "$TMP_DIR"; then
        exit 1
    fi

    success "下载完成"

    # 创建安装目录
    info "正在安装插件..."
    mkdir -p "$(dirname "$INSTALL_DIR")"

    # 备份变量（用于回滚）
    BACKUP_DIR=""

    # 如果已存在，先备份（而不是直接删除）
    if [ -d "$INSTALL_DIR" ]; then
        warn "检测到已有安装，正在备份..."
        BACKUP_DIR="${INSTALL_DIR}.backup-$(date +%s)"
        mv "$INSTALL_DIR" "$BACKUP_DIR"
    fi

    # 安装函数（便于错误处理）
    do_install() {
        # 复制文件
        mkdir -p "$INSTALL_DIR"
        cp -r "$TMP_DIR/agents" "$INSTALL_DIR/" || return 1
        cp -r "$TMP_DIR/commands" "$INSTALL_DIR/" || return 1
        cp -r "$TMP_DIR/hooks" "$INSTALL_DIR/" || return 1
        cp -r "$TMP_DIR/skills" "$INSTALL_DIR/" || return 1
        cp -r "$TMP_DIR/.claude-plugin" "$INSTALL_DIR/" || return 1
        cp "$TMP_DIR/README.md" "$INSTALL_DIR/" 2>/dev/null || true
        cp "$TMP_DIR/README_EN.md" "$INSTALL_DIR/" 2>/dev/null || true
        cp "$TMP_DIR/LICENSE" "$INSTALL_DIR/" 2>/dev/null || true

        # 设置 hook 脚本执行权限（递归处理子目录如 hooks/lib/）
        find "$INSTALL_DIR/hooks" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

        # 安装 slash commands 到 ~/.claude/commands/
        info "正在安装 slash commands..."
        mkdir -p "$COMMANDS_DIR"
        if [ -d "$TMP_DIR/commands" ]; then
            cp "$TMP_DIR/commands/"*.md "$COMMANDS_DIR/" 2>/dev/null || true
            success "Slash commands 安装完成"
            info "Commands 位置: $COMMANDS_DIR"
        fi

        # 安装 skills 到 ~/.claude/skills/
        info "正在安装 skills..."
        if [ -d "$TMP_DIR/skills" ]; then
            for skill_dir in "$TMP_DIR/skills"/*/; do
                if [ -d "$skill_dir" ]; then
                    skill_name=$(basename "$skill_dir")
                    skill_dest="$SKILLS_DIR/$skill_name"
                    mkdir -p "$skill_dest"

                    # 复制 SKILL.md (如果存在)
                    if [ -f "$skill_dir/SKILL.md" ]; then
                        cp "$skill_dir/SKILL.md" "$skill_dest/"
                    fi

                    # 复制其他支持文件（排除 skill.json）
                    find "$skill_dir" -maxdepth 1 -type f ! -name "skill.json" -exec cp {} "$skill_dest/" \; 2>/dev/null || true
                fi
            done
            success "Skills 安装完成"
            info "Skills 位置: $SKILLS_DIR"
        fi

        return 0
    }

    # 执行安装
    if do_install; then
        success "插件文件安装完成"
        info "插件位置: $INSTALL_DIR"

        # 安装成功，删除备份
        if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
            rm -rf "$BACKUP_DIR"
        fi
        # 注意：不再需要 claude plugins install，因为 commands 和 skills 已安装到标准目录
    else
        # 安装失败，回滚
        error "安装失败"

        # 清理失败的安装
        if [ -d "$INSTALL_DIR" ]; then
            rm -rf "$INSTALL_DIR"
        fi

        # 恢复备份
        if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
            info "正在恢复之前的安装..."
            mv "$BACKUP_DIR" "$INSTALL_DIR"
            success "已恢复之前的安装"
        fi

        exit 1
    fi
}

# 同步 hooks 配置到 settings.json
setup_hooks() {
    info "正在配置 hooks..."

    # 检查 settings.json 是否存在
    if [ ! -f "$SETTINGS_FILE" ]; then
        warn "未找到 $SETTINGS_FILE，跳过 hooks 配置"
        warn "请手动将 hooks/hooks.json 中的配置添加到 settings.json"
        return 0
    fi

    # 备份 settings.json
    cp "$SETTINGS_FILE" "${SETTINGS_FILE}.backup-$(date +%s)" 2>/dev/null || true

    # 检查是否已经配置了 oh-my-claude hooks（通过检查 progress-notifier）
    if grep -q "progress-notifier.sh" "$SETTINGS_FILE" 2>/dev/null; then
        success "hooks 已配置，跳过"
        return 0
    fi

    # 尝试使用 Python 合并 JSON（跨平台兼容）
    if command -v python3 >/dev/null 2>&1; then
        PYTHON_CMD="python3"
    elif command -v python >/dev/null 2>&1; then
        PYTHON_CMD="python"
    else
        warn "未找到 Python，无法自动配置 hooks"
        warn "请手动将以下内容添加到 $SETTINGS_FILE 的 hooks 部分："
        echo ""
        echo '  "hooks": {'
        echo '    "PostToolUse": ['
        echo '      {'
        echo '        "type": "command",'
        echo "        \"command\": \"bash \\\"$INSTALL_DIR/hooks/progress-notifier.sh\\\"\","
        echo '        "timeout": 3000'
        echo '      }'
        echo '    ]'
        echo '  }'
        echo ""
        return 0
    fi

    # 使用 Python 脚本合并 hooks 配置
    # 安全：通过环境变量传参，使用 quoted heredoc 防止 shell 注入
    export _OH_MY_CLAUDE_SETTINGS_FILE="$SETTINGS_FILE"
    export _OH_MY_CLAUDE_INSTALL_DIR="$INSTALL_DIR"
    $PYTHON_CMD << 'PYTHON_SCRIPT'
import json
import sys
import os
import platform
import re

settings_file = os.environ.get('_OH_MY_CLAUDE_SETTINGS_FILE', '')
install_dir = os.environ.get('_OH_MY_CLAUDE_INSTALL_DIR', '')

# Windows 兼容性：确保路径格式正确
# Claude Code 在 Windows 上执行 bash 命令时需要 Unix 风格路径
def normalize_path_for_hooks(path):
    """将路径转换为 Git Bash 兼容格式"""
    if platform.system() == 'Windows':
        # 如果是 Windows 原生路径 (C:\Users\...)，转换为 /c/Users/...
        if re.match(r'^[A-Za-z]:', path):
            drive = path[0].lower()
            rest = path[2:].replace('\\\\', '/').replace('\\', '/')
            return f'/{drive}{rest}'
        # 如果已经是 Unix 风格但使用了反斜杠
        path = path.replace('\\\\', '/').replace('\\', '/')
    return path

install_dir = normalize_path_for_hooks(install_dir)

# Windows 上需要使用 bash -c '. script' 格式，否则 stdout 不会被捕获
is_windows = platform.system() == 'Windows'

# 使用 $HOME 环境变量，让 bash 在运行时解析路径
# 这样可以兼容 Git Bash、WSL 等不同环境
hooks_base_path = r'$HOME/.claude/plugins/oh-my-claude/hooks'

def make_hook_command(script_name):
    """生成 hook 命令，使用 $HOME 环境变量"""
    script_path = f"{hooks_base_path}/{script_name}"
    # 统一使用 bash -c '. "script"' 格式
    # $HOME 在 bash 执行时会被解析为正确的用户目录
    return f"bash -c '. \"{script_path}\"'"

try:
    with open(settings_file, 'r', encoding='utf-8') as f:
        settings = json.load(f)
except Exception as e:
    print(f"读取 settings.json 失败: {e}", file=sys.stderr)
    sys.exit(1)

# 定义核心 hooks（使用 $HOME 环境变量，运行时解析）
core_hooks = {
    "PostToolUse": [
        {
            "matcher": "TodoWrite",
            "hooks": [
                {
                    "type": "command",
                    "command": make_hook_command("progress-notifier.sh"),
                    "timeout": 3000
                }
            ]
        },
        {
            "matcher": "*",
            "hooks": [
                {
                    "type": "command",
                    "command": make_hook_command("context-smart-alert.sh"),
                    "timeout": 2000
                }
            ]
        }
    ],
    "Stop": [
        {
            "matcher": "*",
            "hooks": [
                {
                    "type": "command",
                    "command": make_hook_command("todo-continuation.sh"),
                    "timeout": 3000
                }
            ]
        },
        {
            "matcher": "*",
            "hooks": [
                {
                    "type": "command",
                    "command": make_hook_command("ralph-loop.sh"),
                    "timeout": 3000
                }
            ]
        }
    ]
}

# 合并 hooks
if "hooks" not in settings:
    settings["hooks"] = {}

def extract_commands_from_hooks(hooks_list):
    """从 hooks 列表中提取所有 command"""
    commands = []
    for h in hooks_list:
        if isinstance(h, dict):
            # 新格式: {"matcher": "...", "hooks": [{"command": "..."}]}
            if "hooks" in h:
                for inner_hook in h.get("hooks", []):
                    if "command" in inner_hook:
                        commands.append(inner_hook["command"])
            # 旧格式: {"type": "command", "command": "..."}
            elif "command" in h:
                commands.append(h["command"])
    return commands

for hook_type, hooks in core_hooks.items():
    if hook_type not in settings["hooks"]:
        settings["hooks"][hook_type] = []

    # 添加新的 hooks（避免重复）
    existing_commands = extract_commands_from_hooks(settings["hooks"][hook_type])
    for hook in hooks:
        # 从新格式中提取 command
        hook_command = hook.get("hooks", [{}])[0].get("command", "")
        if hook_command and hook_command not in existing_commands:
            settings["hooks"][hook_type].append(hook)

# 写回文件
try:
    with open(settings_file, 'w', encoding='utf-8') as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)
    print("hooks 配置成功")
except Exception as e:
    print(f"写入 settings.json 失败: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

    if [ $? -eq 0 ]; then
        success "hooks 配置完成"
    else
        warn "hooks 自动配置失败，请手动配置"
    fi
}

# 验证安装
verify_installation() {
    info "验证安装..."
    local errors=0

    # 检查关键命令文件
    if [ -f "$COMMANDS_DIR/yishan.md" ]; then
        success "✓ yishan.md 已安装"
    else
        warn "✗ yishan.md 未找到"
        errors=$((errors + 1))
    fi

    # 检查命令数量
    local cmd_count=$(ls -1 "$COMMANDS_DIR"/*.md 2>/dev/null | wc -l)
    if [ "$cmd_count" -gt 0 ]; then
        success "✓ 已安装 $cmd_count 个命令"
    else
        warn "✗ 未检测到任何命令文件"
        errors=$((errors + 1))
    fi

    if [ $errors -gt 0 ]; then
        warn "安装可能不完整，请检查上述警告"
    fi
}

# 显示完成信息
show_success() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 安装完成!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  重要：请完全退出并重新启动 Claude Code 以加载新命令${NC}"
    echo -e "${YELLOW}   (仅关闭窗口可能不够，需要完全退出应用)${NC}"
    echo ""
    echo -e "${CYAN}快速开始:${NC}"
    echo "  /yishan  - 愚公移山模式（大规模任务）"
    echo "  /zhuge   - 诸葛顾问（架构设计）"
    echo "  /bianque - 扁鹊诊断（调试问题）"
    echo "  /luban   - 鲁班巧工（前端开发）"
    echo "  /wukong  - 悟空探索（代码搜索）"
    echo ""
    echo -e "${CYAN}查看所有 Agent:${NC}"
    echo "  https://github.com/$REPO#-agent-列表"
    echo ""
    echo -e "${CYAN}安装位置:${NC}"
    echo "  Commands: $COMMANDS_DIR"
    echo "  Skills:   $SKILLS_DIR"
    echo "  Plugin:   $INSTALL_DIR"
    echo ""
}

# 主程序
main() {
    show_banner
    check_dependencies
    install_plugin
    setup_hooks
    verify_installation
    show_success
}

main "$@"
