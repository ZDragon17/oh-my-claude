# Multi-Agent Collaboration Protocol

## Overview

The Multi-Agent Collaboration Protocol is one of the core features of oh-my-claude, enabling seamless collaboration and information transfer between different Agents. This protocol is based on the `@agent` invocation syntax, implementing a collaboration model similar to oh-my-opencode.

## Protocol Specification

### Invocation Syntax

```
@AgentName [task description]
```

**Supported Agent Name Mappings:**

| Chinese Name | English Name | Aliases |
|--------------|--------------|---------|
| 诸葛 | zhuge | Zhuge Liang |
| 鲁班 | luban | Master LuBan |
| 悟空 | wukong | Sun WuKong |
| 扁鹊 | bianque | Doctor BianQue |
| 墨子 | mozi | Mo Di |
| 孙子 | sunzi | Sun Wu |
| 司马迁 | simaqian | Shiji |
| 郑和 | zhenghe | Voyager |
| 张衡 | zhangheng | Seismograph |
| 李冰 | libing | Dujiangyan |
| 老子 | laozi | Tao Te Ching |
| 包拯 | baozheng | Lord Bao |
| 魏征 | weizheng | Wei Zheng |
| 仓颉 | cangjie | Character Creator |
| 李白 | libai | Immortal Poet |
| 顾恺之 | gukaizhi | Master Painter |
| 嫦娥 | change | Moon Palace |
| 愚公 | yugong | Mountain Mover |

### Invocation Examples

```markdown
@zhuge Please analyze the architecture requirements of this system
@luban Please implement the user authentication module
@bianque Please check the code quality
@wukong Please explore the project structure
```

## Collaboration Workflow

### 1. Invocation Detection

When user input contains `@agent` syntax, the `agent-collaboration.sh` hook will:

1. Detect all Agent invocations
2. Parse Agent names and task descriptions
3. Normalize Agent name mappings
4. Generate collaboration protocol messages

### 2. Protocol Message Format

```markdown
---
【Multi-Agent Collaboration】Agent Invocation
Collaboration ID: collab_1640995200_zhuge
Target Agent: zhuge
Task Description: Please analyze the architecture requirements of this system
Invocation Time: 2023-12-31 12:00:00
Status: Pending
---

Please @zhuge handle the following task:
Please analyze the architecture requirements of this system

---
【Collaboration Protocol】Please respond in the following format:
✅ Task Accepted - Starting processing
🔄 In Progress - [progress percentage] [current step]
❌ Cannot Process - [reason explanation]
✅ Task Complete - [result summary]
---
```

### 3. Agent Response Format

The invoked Agent should respond in the following formats:

**Task Accepted:**
```markdown
✅ Task Accepted - Starting processing
```

**Progress Report:**
```markdown
🔄 In Progress - 60% Requirements analysis complete, developing architecture plan
```

**Cannot Process:**
```markdown
❌ Cannot Process - This task requires database design knowledge, I recommend calling @cangjie
```

**Task Complete:**
```markdown
✅ Task Complete - System architecture design completed, including 3-tier architecture and API specifications
```

## State Management

### Collaboration Session Tracking

Each Agent invocation creates a collaboration session:

```json
{
  "id": "collab_1640995200_zhuge",
  "timestamp": "2023-12-31T12:00:00.000Z",
  "agents": ["zhuge"],
  "task": {
    "description": "Please analyze the architecture requirements of this system",
    "status": "active"
  },
  "messages": [],
  "context": {}
}
```

### Collaboration History Records

All collaboration activities are logged in `~/.oh-my-claude/logs/agent-collaboration.log`:

```
[2023-12-31 12:00:00] Detected Agent invocation: zhuge Please analyze the architecture requirements of this system
[2023-12-31 12:00:01] Parsed Agent invocation: zhuge -> 'Please analyze the architecture requirements of this system'
[2023-12-31 12:05:00] Task complete: System architecture design completed
```

## Advanced Collaboration Patterns

### Simultaneous Multi-Agent Invocation

```markdown
@zhuge Please analyze architecture requirements
@luban Please prepare technical solution
@wukong Please explore existing code
```

### Chain Invocation Collaboration

Agents can invoke other Agents during processing:

```markdown
🔄 In Progress - 50% Architecture analysis complete, need technical details

@luban Please implement the user module based on this architecture design
@cangjie Please design the database structure
```

### Collaboration Status Synchronization

```markdown
---
【YuGong】Multi-Agent Collaboration Status Sync
Active Tasks: 3
├── @zhuge: Architecture Design (80% complete)
├── @luban: User Module Implementation (45% complete)
└── @cangjie: Database Design (90% complete)
Overall Progress: 72%
---
```

## Error Handling and Retry

### Automatic Retry Mechanism

- Agent no response: Automatically retry 3 times
- Processing timeout: Set timeout based on task complexity
- Processing failure: Log error reason, provide fallback solution

### Fallback Strategies

1. **Agent Unavailable**: Try invoking a similar-function Agent
2. **Task Too Complex**: Break down into smaller subtasks
3. **Insufficient Resources**: Queue or suggest manual processing

## Performance Optimization

### Context Compression

- Automatically detect duplicate information
- Generate summaries preserving key content
- Intelligently clean expired context

### Parallel Processing

- Support multiple Agents working simultaneously
- Coordinate resource allocation to avoid conflicts
- Real-time progress synchronization

### Caching Mechanism

- Cache Agent response results
- Reuse solutions from similar tasks
- Maintain knowledge base to accelerate processing

## Monitoring and Analysis

### Collaboration Metrics

- **Response Time**: Time from Agent accepting task to completion
- **Collaboration Efficiency**: Multi-Agent collaboration vs single Agent processing efficiency comparison
- **Success Rate**: Task completion rate and quality score
- **Resource Utilization**: Workload distribution across Agents

### Log Analysis

```bash
# View collaboration logs
tail -f ~/.oh-my-claude/logs/agent-collaboration.log

# Analyze collaboration patterns
grep "Collaboration ID:" ~/.oh-my-claude/logs/agent-collaboration.log | sort | uniq -c
```

## Best Practices

### Task Assignment Principles

1. **Match Expertise**: Assign tasks based on Agent specialties
2. **Load Balancing**: Avoid overloading a single Agent
3. **Dependency Management**: Properly handle task dependencies

### Collaboration Etiquette

1. **Clear Description**: Task descriptions should be specific and clear
2. **Timely Response**: Acknowledge promptly upon receiving invocation
3. **Progress Reporting**: Regularly report processing progress
4. **Result Summary**: Provide clear summary upon completion

### Troubleshooting

1. **No Response to Invocation**: Check Agent name spelling
2. **Collaboration Stuck**: Check logs to analyze blocking reasons
3. **Poor Quality**: Provide more detailed task descriptions

## Extension Development

### Adding New Agents

1. Create Agent definition file in `agents/`
2. Update name mapping table
3. Test collaboration invocation functionality

### Custom Collaboration Protocol

1. Modify `agent-collaboration.sh` script
2. Update response format specifications
3. Extend state management logic

### Integrating External Tools

1. Add tool invocations in hook scripts
2. Handle tool output formatting
3. Implement error handling and retry

---

**The Multi-Agent Collaboration Protocol enables oh-my-claude to perform intelligent orchestration and collaborative processing of complex tasks like oh-my-opencode, greatly improving development efficiency and task quality.**
