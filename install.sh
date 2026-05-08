#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# oh-my-claude install script
# Deploys files to the plugin directory for the detected AI coding tool.
#
# Usage:
#   bash install.sh                    # auto-detect provider and install
#   bash install.sh --provider codex   # force a specific provider
#   bash install.sh --target /some/dir # install to a custom directory
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"  # install.sh lives at the project root

# --- Provider detection -------------------------------------------------------
detect_provider() {
    if [ -n "${OH_MY_CLAUDE_PROVIDER:-}" ]; then
        PROVIDER="$OH_MY_CLAUDE_PROVIDER"
        return
    fi
    if [ -n "${CLAUDE_SESSION_ID:-}" ]; then
        PROVIDER="claude-code"
        return
    fi
    if [ -n "${CODEX_SESSION_ID:-}" ]; then
        PROVIDER="codex"
        return
    fi
    if [ -f "$HOME/.claude/plugins/oh-my-claude/hooks.json" ]; then
        PROVIDER="claude-code"
        return
    fi
    PROVIDER="claude-code"  # default
}

PROVIDER=""
FORCE_PROVIDER=""
CUSTOM_TARGET=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --provider|-p)
            FORCE_PROVIDER="$2"
            shift 2
            ;;
        --target|-t)
            CUSTOM_TARGET="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: bash install.sh [--provider claude-code|codex|generic] [--target /path]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

detect_provider
PROVIDER="${FORCE_PROVIDER:-$PROVIDER}"

# --- Install path per provider ------------------------------------------------
if [ -n "$CUSTOM_TARGET" ]; then
    INSTALL_DIR="$CUSTOM_TARGET"
else
    case "$PROVIDER" in
        claude-code) INSTALL_DIR="$HOME/.claude/plugins/oh-my-claude" ;;
        codex)       INSTALL_DIR="$HOME/.codex/plugins/oh-my-claude" ;;
        generic)     INSTALL_DIR="$HOME/.oh-my-claude" ;;
        *)           INSTALL_DIR="$HOME/.claude/plugins/oh-my-claude" ;;
    esac
fi

echo "==> oh-my-claude installer"
echo "    Provider:    $PROVIDER"
echo "    Target dir:  $INSTALL_DIR"
echo ""

# --- Deploy -------------------------------------------------------------------
mkdir -p "$INSTALL_DIR"

copy_dir() {
    local src="$PROJECT_DIR/$1"
    local dst="$INSTALL_DIR/$1"
    if [ -d "$src" ]; then
        rm -rf "$dst"
        cp -r "$src" "$dst"
        echo "  ✓ $1/"
    else
        echo "  ⚠ $1/ (not found, skipping)"
    fi
}

copy_dir hooks
copy_dir lib
copy_dir dist
copy_dir bin
copy_dir provider

# Root config files
for file in hooks.json skill.json SKILL.md codex-plugin.json CODEX_INTEGRATION.md package.json; do
    src="$PROJECT_DIR/$file"
    if [ -f "$src" ]; then
        cp "$src" "$INSTALL_DIR/$file"
        echo "  ✓ $file"
    fi
done

# --- Permissions --------------------------------------------------------------
chmod +x "$INSTALL_DIR/hooks/"*.sh 2>/dev/null || true
chmod +x "$INSTALL_DIR/bin/omc" 2>/dev/null || true

echo ""
echo "==> Install complete!"
echo "    Plugin directory: $INSTALL_DIR"
echo ""
echo "    To use omc standalone, add to your PATH or use:"
echo "      $INSTALL_DIR/bin/omc --help"
