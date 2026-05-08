# ============================================================================
# Provider Adapter for Bash Hooks
# Auto-detects which AI tool is running and sets uniform variables/functions.
# Source this at the top of every hook script:
#   source "$(dirname "$0")/../lib/provider-adapter.sh"
# ============================================================================

# --- Provider Detection -------------------------------------------------------

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

    if [ -f "$HOME/.codex/plugins/oh-my-claude/config.json" ]; then
        PROVIDER="codex"
        return
    fi

    PROVIDER="generic"
}

# --- Provider-Specific Configuration ------------------------------------------

apply_provider_config() {
    case "$PROVIDER" in
        claude-code)
            SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
            PLUGIN_DIR="${OH_MY_CLAUDE_PLUGIN_DIR:-$HOME/.claude/plugins/oh-my-claude}"
            STATE_DIR="${OH_MY_CLAUDE_STATE_DIR:-$HOME/.oh-my-claude}"
            CONFIG_DIR="$STATE_DIR/config"
            CACHE_DIR="$STATE_DIR/cache"
            HOOK_OUTPUT_FORMAT="claude-code"
            DEFAULT_MODEL="${CLAUDE_MODEL:-claude-sonnet-4-6}"
            TOOL_BG_OUTPUT="background_output"
            TOOL_BG_STATUS="background_status"
            TOOL_BG_CANCEL="background_cancel"
            CMD_STOP_CONTINUATION="/stop-continuation"
            ;;

        codex)
            SESSION_ID="${CODEX_SESSION_ID:-codex-$$}"
            PLUGIN_DIR="${OH_MY_CLAUDE_PLUGIN_DIR:-$HOME/.codex/plugins/oh-my-claude}"
            STATE_DIR="${OH_MY_CLAUDE_STATE_DIR:-$HOME/.oh-my-claude-codex}"
            CONFIG_DIR="$STATE_DIR/config"
            CACHE_DIR="$STATE_DIR/cache"
            HOOK_OUTPUT_FORMAT="codex"
            DEFAULT_MODEL="${CODEX_MODEL:-gpt-4o}"
            TOOL_BG_OUTPUT="background_output"
            TOOL_BG_STATUS="background_status"
            TOOL_BG_CANCEL="background_cancel"
            CMD_STOP_CONTINUATION="/stop"
            ;;

        generic)
            SESSION_ID="${OMC_SESSION_ID:-session-$$}"
            PLUGIN_DIR="${OH_MY_CLAUDE_PLUGIN_DIR:-$HOME/.oh-my-claude}"
            STATE_DIR="${OH_MY_CLAUDE_STATE_DIR:-$HOME/.oh-my-claude}"
            CONFIG_DIR="$STATE_DIR/config"
            CACHE_DIR="$STATE_DIR/cache"
            HOOK_OUTPUT_FORMAT="generic"
            DEFAULT_MODEL="${OMC_MODEL:-default}"
            TOOL_BG_OUTPUT="bg_output"
            TOOL_BG_STATUS="bg_status"
            TOOL_BG_CANCEL="bg_cancel"
            CMD_STOP_CONTINUATION="/stop-loop"
            ;;
    esac

    mkdir -p "$STATE_DIR" "$CONFIG_DIR" "$CACHE_DIR"
}

# --- Uniform Input Parsing ----------------------------------------------------

parse_hook_input() {
    local stdin
    stdin=$(cat 2>/dev/null || echo '{}')

    if ! command -v jq >/dev/null 2>&1; then
        PROMPT=""
        TOOL_NAME=""
        TOOL_INPUT=""
        TOOL_OUTPUT=""
        MODEL=""
        AGENT=""
        return
    fi

    case "$PROVIDER" in
        claude-code)
            PROMPT=$(echo "$stdin" | jq -r '.prompt // empty' 2>/dev/null) || PROMPT=""
            TOOL_NAME=$(echo "$stdin" | jq -r '.tool_name // empty' 2>/dev/null) || TOOL_NAME=""
            TOOL_INPUT=$(echo "$stdin" | jq -r '.tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
            TOOL_OUTPUT=$(echo "$stdin" | jq -r '.tool_output // empty' 2>/dev/null) || TOOL_OUTPUT=""
            MODEL=$(echo "$stdin" | jq -r '.model // empty' 2>/dev/null) || MODEL=""
            AGENT=$(echo "$stdin" | jq -r '.agent // empty' 2>/dev/null) || AGENT=""
            ;;

        codex)
            PROMPT=$(echo "$stdin" | jq -r '.message // .prompt // empty' 2>/dev/null) || PROMPT=""
            TOOL_NAME=$(echo "$stdin" | jq -r '.tool // .tool_name // empty' 2>/dev/null) || TOOL_NAME=""
            TOOL_INPUT=$(echo "$stdin" | jq -r '.arguments // .tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
            TOOL_OUTPUT=$(echo "$stdin" | jq -r '.result // .tool_output // empty' 2>/dev/null) || TOOL_OUTPUT=""
            MODEL=$(echo "$stdin" | jq -r '.model // empty' 2>/dev/null) || MODEL=""
            AGENT=$(echo "$stdin" | jq -r '.agent // empty' 2>/dev/null) || AGENT=""
            ;;

        generic)
            PROMPT=$(echo "$stdin" | jq -r '.prompt // empty' 2>/dev/null) || PROMPT=""
            TOOL_NAME=$(echo "$stdin" | jq -r '.toolName // .tool_name // empty' 2>/dev/null) || TOOL_NAME=""
            TOOL_INPUT=$(echo "$stdin" | jq -r '.toolInput // .tool_input // empty' 2>/dev/null) || TOOL_INPUT=""
            TOOL_OUTPUT=$(echo "$stdin" | jq -r '.toolOutput // .tool_output // empty' 2>/dev/null) || TOOL_OUTPUT=""
            MODEL=$(echo "$stdin" | jq -r '.model // empty' 2>/dev/null) || MODEL=""
            AGENT=$(echo "$stdin" | jq -r '.agent // empty' 2>/dev/null) || AGENT=""
            ;;
    esac
}

# --- Uniform Output Formatting ------------------------------------------------

format_system_message() {
    local msg="$1"
    printf '{"systemMessage":"%s"}\n' "$msg"
}

format_block_decision() {
    local reason="$1"
    local context="$2"
    case "$PROVIDER" in
        claude-code)
            printf '{"decision":"block","reason":"%s","hookSpecificOutput":{"additionalContext":"%s"}}\n' \
                "$reason" "$context"
            ;;
        codex)
            printf '{"blocked":true,"reason":"%s","content":"%s"}\n' "$reason" "$context"
            ;;
        generic)
            printf '{"decision":"block","reason":"%s","additionalContext":"%s"}\n' \
                "$reason" "$context"
            ;;
    esac
}

# --- CLI Entry Point Resolution -----------------------------------------------

get_cli_entry() {
    local module="$1"
    echo "$PLUGIN_DIR/dist/lib/$module/cli.js"
}

# --- Initialization -----------------------------------------------------------

detect_provider
apply_provider_config
