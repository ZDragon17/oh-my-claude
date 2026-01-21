#!/bin/bash

# ============================================================
# Post Tool Use Hook - Example Hook for oh-my-claude
# ============================================================
#
# This hook runs after any tool is executed.
# Use it to:
# 1. Validate tool outputs
# 2. Track tool usage
# 3. Provide follow-up suggestions
#
# Hook Type: PostToolUse
# Timeout: 2000ms
# ============================================================

# Configuration
HOOK_NAME="Post Tool Hook"
LOG_DIR="$HOME/.oh-my-claude/logs"
LOG_FILE="$LOG_DIR/post-tool-hook.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Read tool output from stdin
tool_output=$(cat)

# Log the trigger
log "Hook triggered after tool use"

# ============================================================
# Your Custom Logic Here
# ============================================================

# Example 1: Detect errors in tool output
if echo "$tool_output" | grep -qi "error\|failed\|exception\|traceback"; then
    echo ""
    echo "---"
    echo "[$HOOK_NAME] Error Detection"
    echo "---"
    echo ""
    echo "⚠️ Potential error detected in tool output."
    echo ""
    echo "Suggestions:"
    echo "- Review the error message carefully"
    echo "- Consider using /bianque for diagnosis"
    echo "- Check related logs for more context"
    echo ""
    log "Detected error in tool output"
fi

# Example 2: Detect successful file operations
if echo "$tool_output" | grep -qi "wrote file successfully\|file created\|saved"; then
    # Track file modifications for later review
    log "File operation completed successfully"
fi

# Example 3: Detect test results
if echo "$tool_output" | grep -qi "tests passed\|tests failed\|test results"; then
    if echo "$tool_output" | grep -qi "failed"; then
        echo ""
        echo "---"
        echo "[$HOOK_NAME] Test Results"
        echo "---"
        echo ""
        echo "🔴 Some tests failed."
        echo "Consider using /baozheng for test analysis and fixes."
        echo ""
        log "Detected failed tests"
    else
        log "Tests passed successfully"
    fi
fi

# Example 4: Detect large output that might need summarization
output_length=${#tool_output}
if [ $output_length -gt 10000 ]; then
    echo ""
    echo "---"
    echo "[$HOOK_NAME] Large Output Warning"
    echo "---"
    echo ""
    echo "📝 Large output detected (${output_length} characters)."
    echo "Consider asking for a summary of key points."
    echo ""
    log "Large output detected: $output_length chars"
fi

# ============================================================
# Exit successfully
# ============================================================
log "Hook completed successfully"
exit 0
