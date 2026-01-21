# Custom Agent Example

This directory contains an example of how to create a custom Agent for oh-my-claude.

## Quick Start

1. Copy the example files to your Claude config directory:

```bash
# macOS / Linux
cp my-agent.md ~/.claude/agents/

# Windows (PowerShell)
Copy-Item my-agent.md $env:USERPROFILE\.claude\agents\
```

2. Restart Claude Code completely (not just close window, but full restart)

3. Use your custom Agent:

```
/my-agent Help me with my task
```

## File Structure

```
custom-agent/
├── README.md           # This file
├── my-agent.md         # Agent definition (main file)
└── my-agent-command.md # Optional: slash command definition
```

## Agent Definition Format

The Agent definition file uses YAML frontmatter with the following fields:

```yaml
---
name: my-agent                    # Agent name (required)
description: |                    # Description (required)
  What your agent does...
allowed-tools:                    # Tools the agent can use
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
model: sonnet                     # Model to use (sonnet/opus/haiku)
---
```

## Best Practices

1. **Clear Responsibility**: Define a clear, focused responsibility for your Agent
2. **Tool Selection**: Only enable tools the Agent actually needs
3. **Detailed Instructions**: Provide clear instructions in the markdown body
4. **Examples**: Include usage examples in the Agent description
5. **Collaboration**: Define how your Agent interacts with other Agents

## Available Tools

| Tool | Description |
|------|-------------|
| Read | Read file contents |
| Write | Write file contents |
| Edit | Edit file contents |
| Bash | Execute shell commands |
| Glob | Find files by pattern |
| Grep | Search file contents |
| WebFetch | Fetch web content |
| TodoWrite | Manage todo lists |
| TodoRead | Read todo lists |

## Example Agents for Inspiration

- **Code Reviewer**: Focuses on code quality and best practices
- **Test Writer**: Specializes in writing unit tests
- **Documentation Writer**: Creates technical documentation
- **Performance Analyst**: Analyzes and optimizes performance
