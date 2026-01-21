# Custom Hook Example

This directory contains examples of how to create custom Hooks for oh-my-claude.

## What are Hooks?

Hooks are scripts that run at specific events during Claude Code's operation:

| Event | When it Fires |
|-------|---------------|
| `UserPromptSubmit` | When user submits a prompt |
| `PostToolUse` | After a tool is executed |
| `Stop` | When assistant is about to stop |

## Quick Start

1. Copy the example hook to the hooks directory:

```bash
# From oh-my-claude root directory
cp examples/custom-hook/my-custom-hook.sh hooks/
chmod +x hooks/my-custom-hook.sh
```

2. Add the hook to `hooks/hooks.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "bash hooks/my-custom-hook.sh",
        "timeout": 3000,
        "continueOnError": true,
        "description": "My custom hook description"
      }
    ]
  }
}
```

3. Restart Claude Code

## Hook Script Format

Hooks are bash scripts that:
- Receive the user input or tool output via stdin
- Can output messages to inject into the context
- Should exit with code 0 on success

### Input Format

The script receives JSON input via stdin:

```json
{
  "input": "User's prompt text",
  "timestamp": "2025-01-21T10:00:00Z",
  "session_id": "ses_abc123"
}
```

### Output Format

Output plain text that will be injected into the conversation:

```
[MY HOOK] Detected something important!

Recommendation: Do something about it.
```

## Best Practices

1. **Fast Execution**: Keep hooks fast (< 3 seconds)
2. **Error Handling**: Handle errors gracefully, don't crash
3. **Minimal Output**: Only output when necessary
4. **Exit Codes**: Use appropriate exit codes
5. **Logging**: Log to `~/.oh-my-claude/logs/` for debugging

## Example Hooks

### 1. Keyword Detector
Detects specific keywords and suggests relevant actions.

### 2. Code Quality Checker
Checks code submissions for common issues.

### 3. Progress Tracker
Tracks task progress and provides reminders.

## Debugging

Enable logging in your hook:

```bash
LOG_FILE="$HOME/.oh-my-claude/logs/my-hook.log"
echo "[$(date)] Hook triggered" >> "$LOG_FILE"
```

View logs:
```bash
tail -f ~/.oh-my-claude/logs/my-hook.log
```
