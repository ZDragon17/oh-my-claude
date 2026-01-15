#!/bin/bash

# oh-my-claude 一键安装脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.sh | bash
# 或者: wget -qO- https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.sh | bash

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
INSTALL_DIR="$HOME/.claude/plugins/$PLUGIN_NAME"

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

    # 检查 git
    if ! command -v git &> /dev/null; then
        error "需要 git，请先安装: https://git-scm.com/"
    fi

    # 检查 Claude Code
    if ! command -v claude &> /dev/null; then
        warn "未检测到 Claude Code CLI"
        warn "请先安装 Claude Code: https://claude.ai/code"
        warn "安装后重新运行此脚本"
        exit 1
    fi

    success "依赖检查通过"
}

# 下载并安装
install_plugin() {
    info "正在下载 oh-my-claude..."

    # 创建临时目录
    TMP_DIR=$(mktemp -d)
    trap "rm -rf $TMP_DIR" EXIT

    # 克隆仓库
    git clone --depth 1 "https://github.com/$REPO.git" "$TMP_DIR" 2>/dev/null || \
        error "下载失败，请检查网络连接"

    success "下载完成"

    # 创建安装目录
    info "正在安装插件..."
    mkdir -p "$(dirname "$INSTALL_DIR")"

    # 如果已存在，先备份
    if [ -d "$INSTALL_DIR" ]; then
        warn "检测到已有安装，正在更新..."
        rm -rf "$INSTALL_DIR"
    fi

    # 复制文件
    mkdir -p "$INSTALL_DIR"
    cp -r "$TMP_DIR/agents" "$INSTALL_DIR/"
    cp -r "$TMP_DIR/commands" "$INSTALL_DIR/"
    cp -r "$TMP_DIR/hooks" "$INSTALL_DIR/"
    cp -r "$TMP_DIR/skills" "$INSTALL_DIR/"
    cp -r "$TMP_DIR/.claude-plugin" "$INSTALL_DIR/"
    cp "$TMP_DIR/README.md" "$INSTALL_DIR/" 2>/dev/null || true
    cp "$TMP_DIR/README_EN.md" "$INSTALL_DIR/" 2>/dev/null || true
    cp "$TMP_DIR/LICENSE" "$INSTALL_DIR/" 2>/dev/null || true

    # 设置权限
    chmod +x "$INSTALL_DIR/hooks/"*.sh 2>/dev/null || true

    success "插件文件安装完成"
    info "安装位置: $INSTALL_DIR"

    # 注册插件
    info "正在注册插件..."
    if claude plugins install "$INSTALL_DIR" 2>/dev/null; then
        success "插件注册成功"
    else
        warn "自动注册失败，请手动运行:"
        echo "  claude plugins install $INSTALL_DIR"
    fi
}

# 显示完成信息
show_success() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 安装完成!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}快速开始:${NC}"
    echo "  /yishan 或 /愚公  - 愚公移山模式（大规模任务）"
    echo "  /zhuge 或 /诸葛   - 诸葛顾问（架构设计）"
    echo "  /bianque 或 /扁鹊 - 扁鹊诊断（调试问题）"
    echo ""
    echo -e "${CYAN}查看所有 Agent:${NC}"
    echo "  https://github.com/$REPO#-agent-列表"
    echo ""
}

# 主程序
main() {
    show_banner
    check_dependencies
    install_plugin
    show_success
}

main "$@"
