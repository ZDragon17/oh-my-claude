# 任务断点续传机制

## 概述

任务断点续传机制是解决 Claude 上下文窗口限制的关键功能，允许长任务在中断后从断点恢复，避免重新开始整个任务。

## 核心原理

### 上下文窗口限制

Claude 的上下文窗口有长度限制，当对话过长时会：
- 自动截断早期消息
- 丢失历史上下文
- 导致任务状态不连续

### 断点续传解决方案

```
任务执行 → 检测状态变化 → 自动创建断点 → 上下文压缩 → 状态持久化 → 中断恢复 → 智能续传
```

## 断点类型

### 1. 自动断点 (Smart Checkpoint)

基于任务状态变化自动创建：

- **任务完成节点**：每个子任务完成时
- **阶段切换点**：从一个阶段进入下一个阶段
- **关键决策点**：需要人工确认或重要选择时
- **定期检查点**：基于时间间隔的定期保存

### 2. 手动断点 (Manual Checkpoint)

用户主动创建的断点：

```markdown
/yishan checkpoint "架构设计完成，即将开始实现"
```

### 3. 紧急断点 (Emergency Checkpoint)

系统检测到潜在风险时创建：

- 复杂操作前
- 大量代码修改前
- 外部依赖调用前

## 断点数据结构

```json
{
  "id": "checkpoint_1640995200",
  "taskId": "task_12345",
  "timestamp": "2023-12-31T12:00:00.000Z",
  "step": 3,
  "totalSteps": 10,
  "progress": 30,
  "contextSnapshot": {
    "summary": "已完成需求分析和架构设计",
    "keyDecisions": ["采用微服务架构", "使用 PostgreSQL"],
    "completedTasks": ["需求文档", "系统架构图"],
    "pendingTasks": ["数据库设计", "API 规范"]
  },
  "agentStates": {
    "zhuge": { "status": "completed", "output": "架构设计文档" },
    "luban": { "status": "waiting", "dependsOn": ["zhuge"] }
  },
  "nextAction": "开始数据库设计",
  "recoveryPlan": {
    "steps": [
      "恢复架构上下文",
      "同步 Agent 状态",
      "继续数据库设计"
    ],
    "estimatedTime": "2小时",
    "riskLevel": "低"
  }
}
```

## 断点创建流程

### 1. 状态检测

Hook 系统实时监控任务状态变化：

```bash
# task-checkpointing.sh 检测逻辑
if echo "$input" | grep -q "✅\|❌\|🔄\|任务完成\|状态同步"; then
    create_smart_checkpoint "$input"
fi
```

### 2. 上下文压缩

自动提取和压缩关键上下文：

```javascript
// 上下文压缩算法
function compressContext(contextData) {
  return {
    summary: generateSummary(contextData),
    keyPoints: extractKeyPoints(contextData),
    references: extractImportantReferences(contextData),
    size: calculateCompressedSize(contextData)
  };
}
```

### 3. 断点保存

将断点数据持久化保存：

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

## 任务恢复流程

### 1. 恢复检测

检测恢复请求并定位断点：

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

### 2. 断点选择

智能选择最佳恢复点：

```javascript
function selectBestCheckpoint(taskId) {
  const checkpoints = getCheckpointsForTask(taskId);

  // 按优先级选择：
  // 1. 最新的自动断点
  // 2. 手动创建的断点
  // 3. 关键节点断点
  return checkpoints
    .sort((a, b) => b.priority - a.priority)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
}
```

### 3. 上下文恢复

逐步恢复任务上下文：

```javascript
async function restoreTaskContext(checkpoint) {
  // 1. 恢复基础上下文
  await restoreBasicContext(checkpoint.contextSnapshot);

  // 2. 同步 Agent 状态
  await syncAgentStates(checkpoint.agentStates);

  // 3. 重建任务依赖
  await rebuildTaskDependencies(checkpoint.taskGraph);

  // 4. 验证恢复完整性
  await validateRestoration(checkpoint);
}
```

### 4. 智能续传

从断点继续执行：

```javascript
async function resumeFromCheckpoint(checkpoint) {
  const nextAction = checkpoint.nextAction;

  // 生成续传指导
  const guidance = generateResumeGuidance(checkpoint);

  // 协调相关 Agent
  await coordinateAgentsForResume(checkpoint.agentStates);

  // 开始续传执行
  return await executeFromCheckpoint(checkpoint, nextAction);
}
```

## 续传策略

### 1. 精确续传 (Exact Resume)

从确切的断点位置继续：

```
原执行: 任务A → 任务B → [断点] → 任务C → 任务D
续传:                    [恢复] → 任务C → 任务D
```

### 2. 智能续传 (Smart Resume)

基于当前状态智能调整续传路径：

```
原计划: 任务A → 任务B → 任务C
实际情况: 任务A 已手动完成，任务B 部分完成
智能续传: 跳过任务A，直接从任务B 剩余部分开始
```

### 3. 降级续传 (Degraded Resume)

当精确续传不可行时：

```
无法恢复: 外部依赖已变化，API 已更新
降级策略: 重新验证依赖，从安全点重新开始
```

## 监控和优化

### 续传成功率统计

```javascript
const recoveryMetrics = {
  totalAttempts: 150,
  successfulRecoveries: 142,
  averageRecoveryTime: '3.2分钟',
  successRate: 94.7,
  commonFailureReasons: [
    '上下文丢失': 45%,
    '外部依赖变化': 30%,
    '手动修改': 15%
  ]
};
```

### 性能优化

1. **断点压缩**：减小断点数据大小
2. **增量保存**：只保存变化的部分
3. **智能清理**：自动清理过期断点
4. **预加载**：预测性加载可能需要的上下文

## 使用指南

### 创建断点

```markdown
/yishan checkpoint "数据库设计完成，准备开始 API 开发"
```

### 恢复任务

```markdown
/yishan resume checkpoint_1640995200
```

### 查看断点

```bash
oh-my-claude status  # 查看可用断点
```

### 断点管理

```bash
# 清理过期断点
oh-my-claude cleanup checkpoints --older-than 30d

# 导出断点数据
oh-my-claude export checkpoint_1640995200
```

## 最佳实践

### 断点创建时机

1. **阶段完成时**：每个主要阶段结束后
2. **重要决策前**：重大技术决策前
3. **复杂操作前**：涉及多个文件或外部服务的操作前
4. **定期保存**：长时间任务每 30-60 分钟保存一次

### 续传优化

1. **验证环境**：恢复前检查外部依赖是否变化
2. **逐步恢复**：从小规模验证开始，逐步扩大范围
3. **备份策略**：重要操作前创建额外备份
4. **监控进度**：续传过程中密切监控执行状态

### 故障排除

1. **续传失败**：检查断点数据完整性
2. **上下文不匹配**：手动调整恢复的上下文
3. **依赖冲突**：重新解析和重建依赖关系
4. **性能问题**：优化断点大小和恢复策略

---

**断点续传机制让 oh-my-claude 能够像 oh-my-opencode 一样处理超长任务，确保即使在 Claude 上下文限制下也能保持任务连续性和执行质量。**