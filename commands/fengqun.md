---
description: 蜂群模式 - N 个协调 Agent 共享任务列表的高效并行执行
aliases: [swarm, sw]
---

# 蜂群模式命令 (Fengqun / Swarm)

[蜂群模式已激活 - 多 AGENT 协同执行]

你现在进入蜂群模式。这是一个多 Agent 共享任务池的并行执行模式，像蜂群一样高效协作。

## 语法

```bash
/fengqun N:agent类型 "任务描述"
```

- **N**: Agent 数量 (1-5)
- **agent类型**: luban, gukaizhi, baozheng, bianque, mozi, simaqian, cangjie, zhuge
- **任务描述**: 要分解和分配的高级任务

## 用户任务

{{ARGUMENTS}}

## 核心原则

> **众人拾柴火焰高。**

1. **任务池共享** - 所有 Agent 从同一池中认领任务
2. **原子认领** - 每个任务仅被一个 Agent 认领
3. **心跳监控** - 检测死亡 Agent，释放其任务
4. **自动恢复** - 超时任务自动释放给其他 Agent

## 工作流程

### 阶段 1: 解析与验证

```javascript
// 解析输入
const { count, agentType, task } = parseInput("{{ARGUMENTS}}");

// 验证
if (count > 5) throw "最多 5 个 Agent (Claude Code 限制)";
if (!validAgentType(agentType)) throw "无效的 Agent 类型";
```

### 阶段 2: 任务分解

基于任务分析代码库，拆分为文件级子任务：

```javascript
// 示例: "修复所有 TypeScript 错误"
const tasks = [
  { id: "1", description: "修复 src/auth/login.ts 的类型错误" },
  { id: "2", description: "修复 src/api/users.ts 的类型错误" },
  { id: "3", description: "修复 src/utils/helpers.ts 的类型错误" },
  // ...更多任务
];
```

### 阶段 3: 生成 Agent

```javascript
for (let i = 1; i <= count; i++) {
  Task(
    subagent_type: `oh-my-claude:${agentType}`,
    model: "sonnet",
    run_in_background: true,
    prompt: `蜂群 WORKER [${i}/${count}]

你是蜂群的一员。遵循以下循环:

1. 调用 claimTask("agent-${i}") 认领任务
2. 执行任务
3. 调用 completeTask() 或 failTask()
4. 每 60 秒发送心跳
5. 重复直到无剩余任务

【关键规则】
- 只处理你认领的任务
- 完成后立即认领下一个
- 遇到问题标记 failed 并继续
- 无任务时安全退出`
  );
}
```

### 阶段 4: 监控与协调

```javascript
while (!isSwarmComplete()) {
  // 追踪进度
  const stats = getSwarmStats();
  console.log(`进度: ${stats.doneTasks}/${stats.totalTasks}`);
  console.log(`活跃: ${stats.activeAgents}, 失败: ${stats.failedTasks}`);
  
  // 清理超时任务
  cleanupStaleClaims();
  
  // 等待
  await sleep(10000);
}
```

### 阶段 5: 完成报告

```
╔══════════════════════════════════════════════════════════════╗
║  🐝 蜂群模式 - 任务完成！                                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📋 任务: 修复所有 TypeScript 错误                            ║
║                                                              ║
║  📊 执行统计:                                                 ║
║     • 总任务数: 15                                           ║
║     • 成功完成: 14                                           ║
║     • 失败任务: 1                                            ║
║     • Agent 数: 5                                            ║
║                                                              ║
║  👥 Agent 贡献:                                               ║
║     • 鲁班-1: 4 个任务                                        ║
║     • 鲁班-2: 3 个任务                                        ║
║     • 鲁班-3: 3 个任务                                        ║
║     • 鲁班-4: 2 个任务                                        ║
║     • 鲁班-5: 2 个任务                                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## Agent 类型映射

| 指定类型 | Agent 名称 | 专长 |
|---------|-----------|------|
| `luban` | 鲁班 | 代码实现、Bug 修复 |
| `gukaizhi` | 顾恺之 | 前端、UI 组件 |
| `baozheng` | 包拯 | 测试编写 |
| `bianque` | 扁鹊 | Bug 诊断 |
| `mozi` | 墨子 | 安全审计 |
| `simaqian` | 司马迁 | 文档编写 |
| `cangjie` | 仓颉 | 数据库相关 |
| `zhuge` | 诸葛 | 架构分析 |

## 使用示例

### 示例 1: 批量修复类型错误

```bash
/fengqun 5:luban "修复所有 TypeScript 类型错误"
```

5 个鲁班并行工作，各自认领不同文件的错误修复。

### 示例 2: UI 组件样式

```bash
/fengqun 3:gukaizhi "为 src/components/ 下所有组件添加响应式布局"
```

3 个顾恺之并行工作，各自处理不同的组件。

### 示例 3: 安全审计

```bash
/fengqun 4:mozi "审查所有 API 端点的安全漏洞"
```

4 个墨子并行审计不同的端点。

### 示例 4: 批量添加测试

```bash
/fengqun 3:baozheng "为 src/services/ 下所有服务添加单元测试"
```

3 个包拯并行编写不同服务的测试。

## 关键参数

| 参数 | 默认值 | 说明 |
|------|-------|------|
| 最大 Agent | 5 | Claude Code 限制 |
| 租约超时 | 5 分钟 | 任务认领的最大时间 |
| 心跳间隔 | 60 秒 | Agent 存活信号间隔 |
| 清理间隔 | 60 秒 | 检查超时任务的间隔 |

## 错误处理

### Agent 崩溃
- 任务 5 分钟无心跳自动释放
- 其他 Agent 可认领被释放的任务

### 任务失败
- 标记为 failed，记录错误
- 可选择重试或跳过

### 所有 Agent 空闲
- 检测到无剩余任务时
- 触发完成报告

## 状态文件

位置: `.omc/state/swarm-state.json`

```json
{
  "sessionId": "swarm-20260129-1234",
  "agentType": "luban",
  "agentCount": 5,
  "tasks": {
    "total": 15,
    "pending": 3,
    "claimed": 2,
    "done": 9,
    "failed": 1
  },
  "agents": {
    "agent-1": { "status": "working", "currentTask": "5" },
    "agent-2": { "status": "working", "currentTask": "8" },
    "agent-3": { "status": "idle" },
    "agent-4": { "status": "idle" },
    "agent-5": { "status": "idle" }
  }
}
```

## 取消

```bash
/cancel-swarm
# 或说: "停止蜂群", "取消协作"
```

**行为**:
- 向所有 Agent 发送退出信号
- 保留部分进度
- 可通过 `/fengqun resume` 恢复
