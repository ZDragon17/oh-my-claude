# Task Checkpoint and Resume Mechanism

## Overview

The Task Checkpoint and Resume Mechanism is a key feature for addressing Claude's context window limitations. It allows long-running tasks to resume from checkpoints after interruption, avoiding the need to restart the entire task.

## Core Principles

### Context Window Limitations

Claude's context window has length limits. When conversations become too long:
- Earlier messages are automatically truncated
- Historical context is lost
- Task state becomes discontinuous

### Checkpoint Resume Solution

```
Task Execution → Detect State Change → Auto Create Checkpoint → Context Compression → State Persistence → Interruption Recovery → Smart Resume
```

## Checkpoint Types

### 1. Smart Checkpoint (Automatic)

Created automatically based on task state changes:

- **Task Completion Node**: When each subtask completes
- **Phase Switch Point**: When transitioning from one phase to the next
- **Key Decision Point**: When manual confirmation or important choices are needed
- **Periodic Checkpoint**: Regular saves based on time intervals

### 2. Manual Checkpoint

Checkpoints actively created by users:

```markdown
/yishan checkpoint "Architecture design complete, about to start implementation"
```

### 3. Emergency Checkpoint

Created when the system detects potential risks:

- Before complex operations
- Before large code modifications
- Before external dependency calls

## Checkpoint Data Structure

```json
{
  "id": "checkpoint_1640995200",
  "taskId": "task_12345",
  "timestamp": "2023-12-31T12:00:00.000Z",
  "step": 3,
  "totalSteps": 10,
  "progress": 30,
  "contextSnapshot": {
    "summary": "Requirements analysis and architecture design completed",
    "keyDecisions": ["Adopt microservices architecture", "Use PostgreSQL"],
    "completedTasks": ["Requirements document", "System architecture diagram"],
    "pendingTasks": ["Database design", "API specification"]
  },
  "agentStates": {
    "zhuge": { "status": "completed", "output": "Architecture design document" },
    "luban": { "status": "waiting", "dependsOn": ["zhuge"] }
  },
  "nextAction": "Start database design",
  "recoveryPlan": {
    "steps": [
      "Restore architecture context",
      "Sync Agent states",
      "Continue database design"
    ],
    "estimatedTime": "2 hours",
    "riskLevel": "Low"
  }
}
```

## Checkpoint Creation Flow

### 1. State Detection

The Hook system monitors task state changes in real-time:

```bash
# task-checkpointing.sh detection logic
if echo "$input" | grep -q "✅\|❌\|🔄\|任务完成\|状态同步"; then
    create_smart_checkpoint "$input"
fi
```

### 2. Context Compression

Automatically extract and compress key context:

```javascript
// Context compression algorithm
function compressContext(contextData) {
  return {
    summary: generateSummary(contextData),
    keyPoints: extractKeyPoints(contextData),
    references: extractImportantReferences(contextData),
    size: calculateCompressedSize(contextData)
  };
}
```

### 3. Checkpoint Save

Persist checkpoint data:

```javascript
function createTaskCheckpoint(checkpointData) {
  const checkpoint = {
    id: generateCheckpointId(),
    timestamp: new Date().toISOString(),
    ...checkpointData
  };

  saveToPersistentStorage(checkpoint);
  return checkpoint.id;
}
```

## Task Recovery Flow

### 1. Recovery Detection

Detect recovery requests and locate checkpoints:

```javascript
function detectRecoveryRequest(input) {
  const patterns = [
    /恢复.*断点/,
    /继续.*任务/,
    /resume.*checkpoint/i,
    /continue.*task/i
  ];

  return patterns.some(pattern => pattern.test(input));
}
```

### 2. Checkpoint Selection

Intelligently select the best recovery point:

```javascript
function selectBestCheckpoint(taskId) {
  const checkpoints = getCheckpointsForTask(taskId);

  // Select by priority:
  // 1. Latest automatic checkpoint
  // 2. Manually created checkpoint
  // 3. Key node checkpoint
  return checkpoints
    .sort((a, b) => b.priority - a.priority)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
}
```

### 3. Context Recovery

Progressively restore task context:

```javascript
async function restoreTaskContext(checkpoint) {
  // 1. Restore basic context
  await restoreBasicContext(checkpoint.contextSnapshot);

  // 2. Sync Agent states
  await syncAgentStates(checkpoint.agentStates);

  // 3. Rebuild task dependencies
  await rebuildTaskDependencies(checkpoint.taskGraph);

  // 4. Validate restoration integrity
  await validateRestoration(checkpoint);
}
```

### 4. Smart Resume

Continue execution from checkpoint:

```javascript
async function resumeFromCheckpoint(checkpoint) {
  const nextAction = checkpoint.nextAction;

  // Generate resume guidance
  const guidance = generateResumeGuidance(checkpoint);

  // Coordinate related Agents
  await coordinateAgentsForResume(checkpoint.agentStates);

  // Start resume execution
  return await executeFromCheckpoint(checkpoint, nextAction);
}
```

## Resume Strategies

### 1. Exact Resume

Continue from the exact checkpoint position:

```
Original Execution: Task A → Task B → [Checkpoint] → Task C → Task D
Resume:                               [Recovery] → Task C → Task D
```

### 2. Smart Resume

Intelligently adjust resume path based on current state:

```
Original Plan: Task A → Task B → Task C
Actual Situation: Task A manually completed, Task B partially complete
Smart Resume: Skip Task A, start directly from remaining Task B
```

### 3. Degraded Resume

When exact resume is not feasible:

```
Cannot Recover: External dependencies changed, API updated
Degradation Strategy: Re-validate dependencies, restart from safe point
```

## Monitoring and Optimization

### Resume Success Rate Statistics

```javascript
const recoveryMetrics = {
  totalAttempts: 150,
  successfulRecoveries: 142,
  averageRecoveryTime: '3.2 minutes',
  successRate: 94.7,
  commonFailureReasons: [
    'Context lost': 45%,
    'External dependency change': 30%,
    'Manual modification': 15%
  ]
};
```

### Performance Optimization

1. **Checkpoint Compression**: Reduce checkpoint data size
2. **Incremental Save**: Only save changed portions
3. **Smart Cleanup**: Automatically clean expired checkpoints
4. **Preloading**: Predictively load potentially needed context

## Usage Guide

### Create Checkpoint

```markdown
/yishan checkpoint "Database design complete, ready to start API development"
```

### Resume Task

```markdown
/yishan resume checkpoint_1640995200
```

### View Checkpoints

```bash
oh-my-claude status  # View available checkpoints
```

### Checkpoint Management

```bash
# Clean expired checkpoints
oh-my-claude cleanup checkpoints --older-than 30d

# Export checkpoint data
oh-my-claude export checkpoint_1640995200
```

## Best Practices

### Checkpoint Creation Timing

1. **Phase Completion**: After each major phase ends
2. **Before Important Decisions**: Before major technical decisions
3. **Before Complex Operations**: Before operations involving multiple files or external services
4. **Regular Saves**: Save every 30-60 minutes for long-running tasks

### Resume Optimization

1. **Verify Environment**: Check if external dependencies changed before recovery
2. **Progressive Recovery**: Start with small-scale validation, gradually expand scope
3. **Backup Strategy**: Create additional backups before important operations
4. **Monitor Progress**: Closely monitor execution status during resume

### Troubleshooting

1. **Resume Failed**: Check checkpoint data integrity
2. **Context Mismatch**: Manually adjust recovered context
3. **Dependency Conflict**: Re-parse and rebuild dependencies
4. **Performance Issues**: Optimize checkpoint size and recovery strategy

---

**The Checkpoint and Resume Mechanism enables oh-my-claude to handle ultra-long tasks like oh-my-opencode, ensuring task continuity and execution quality even under Claude's context limitations.**
