#!/bin/bash

# ============================================================
# My Custom Hook - Example Hook for oh-my-claude
# ============================================================
#
# This hook demonstrates how to create a custom hook that:
# 1. Reads user input from stdin
# 2. Processes the input
# 3. Outputs contextual messages
#
# Hook Type: UserPromptSubmit
# Timeout: 3000ms
# ============================================================

# Configuration
HOOK_NAME="My Custom Hook"
LOG_DIR="$HOME/.oh-my-claude/logs"
LOG_FILE="$LOG_DIR/my-custom-hook.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Read input from stdin
input=$(cat)

# Log the trigger
log "Hook triggered with input length: ${#input}"

# ============================================================
# Your Custom Logic Here
# ============================================================

# Example 1: Detect specific keywords
if echo "$input" | grep -qi "urgent\|critical\|asap"; then
    echo ""
    echo "---"
    echo "[$HOOK_NAME] Priority Detection"
    echo "---"
    echo ""
    echo "⚠️ Detected urgent/priority keywords in your request."
    echo ""
    echo "Recommendations:"
    echo "- Consider breaking down the task into smaller steps"
    echo "- Verify requirements before proceeding"
    echo "- Create checkpoints for complex operations"
    echo ""
    log "Detected priority keywords"
fi

# Example 2: Detect potential risky operations
if echo "$input" | grep -qi "delete all\|rm -rf\|drop table\|format"; then
    echo ""
    echo "---"
    echo "[$HOOK_NAME] Risk Warning"
    echo "---"
    echo ""
    echo "🚨 Detected potentially destructive operation keywords."
    echo ""
    echo "Please ensure:"
    echo "- You have a backup of important data"
    echo "- You understand the scope of the operation"
    echo "- You have tested in a safe environment first"
    echo ""
    log "Detected risky operation keywords"
fi

# Example 3: Detect technology mentions and suggest relevant agents
if echo "$input" | grep -qi "database\|sql\|postgresql\|mysql"; then
    echo ""
    echo "---"
    echo "[$HOOK_NAME] Agent Suggestion"
    echo "---"
    echo ""
    echo "💡 Database-related task detected."
    echo "Consider using: /cangjie for database design and SQL optimization"
    echo ""
    log "Suggested cangjie agent for database task"
fi

if echo "$input" | grep -qi "security\|auth\|password\|token"; then
    echo ""
    echo "---"
    echo "[$HOOK_NAME] Agent Suggestion"
    echo "---"
    echo ""
    echo "💡 Security-related task detected."
    echo "Consider using: /mozi for security audit and defensive programming"
    echo ""
    log "Suggested mozi agent for security task"
fi

# Example 4: Track session activity
# Uncomment to enable session tracking
# echo "Session activity logged at $(date)" >> "$LOG_DIR/session-activity.log"

# ============================================================
# Exit successfully
# ============================================================
log "Hook completed successfully"
exit 0
