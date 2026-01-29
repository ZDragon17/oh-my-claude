---
name: swarm
description: |
  蜂群模式 (Swarm) - N 个协调 Agent 共享任务列表的并行执行。
  基于原子任务认领机制，像蜂群一样高效协作。
---

# 蜂群模式 (Swarm)

基于 oh-my-opencode 的 swarm 机制，融入中国传统文化的集体智慧。

## 核心理念

> **众人拾柴火焰高。**

蜂群模式体现集体协作的智慧：
- **分工协作**：每个 Agent 认领适合的任务
- **各尽其能**：根据专长分配工作
- **齐心协力**：共同完成大目标

---

## 关键词触发

| 关键词 | 说明 |
|--------|------|
| `swarm` / `sw` | 英文触发词 |
| `fengqun` / `蜂群` | 中文触发词 |
| `多人协作` / `团队作战` | 描述性触发 |

---

## 使用语法

```bash
/fengqun N:agent类型 "任务描述"
/swarm N:agent-type "task description"
```

### 参数说明

- **N** - Agent 数量 (1-5，Claude Code 限制)
- **agent类型** - 要生成的 Agent（如：luban, baozheng, zhuge）
- **任务** - 要分解和分配的高级任务

### 示例

```bash
/fengqun 5:luban "修复所有 TypeScript 类型错误"
/swarm 3:bianque "修复 src/ 目录下的构建错误"
/fengqun 4:gukaizhi "为所有组件实现响应式布局"
/swarm 2:zhuge "分析并文档化所有 API 端点"
```

---

## 架构概览

```
用户: "/fengqun 5:luban 修复所有 TypeScript 错误"
              |
              v
      [蜂群编排器 - 愚公]
              |
   +--+--+--+--+--+
   |  |  |  |  |
   v  v  v  v  v
  L1 L2 L3 L4 L5
  鲁  鲁  鲁  鲁  鲁
  班  班  班  班  班
   |  |  |  |  |
   +--+--+--+--+
          |
          v
    [共享任务池]
    ┌─────────────────────┐
    │ 任务表               │
    ├─────────────────────┤
    │ id, 描述            │
    │ 状态 (pending,      │
    │   claimed, done,    │
    │   failed)           │
    │ 认领者, 认领时间     │
    │ 完成时间, 结果       │
    │ 错误信息            │
    ├─────────────────────┤
    │ 心跳表              │
    │ (Agent 监控)        │
    └─────────────────────┘
```

---

## 工作流程

### 1. 解析输入
- 提取 N (Agent 数量)
- 提取 Agent 类型
- 提取任务描述
- 验证 N <= 5

### 2. 创建任务池
- 基于任务分析代码库
- 拆分为文件级子任务
- 初始化任务池
- 每个任务包含: id, 描述, 状态 (pending)

### 3. 生成 Agent
- 通过 Task 工具启动 N 个 Agent
- 所有 Agent 设置 `run_in_background: true`
- 每个 Agent 连接到共享任务池
- Agent 自动进入认领循环

### 4. 任务认领协议

每个 Agent 遵循此循环：

```
循环:
  1. 调用 claimTask(agentId)
  2. 原子操作:
     - 找到第一个 pending 任务
     - 更新 status='claimed', claimed_by=agentId
     - 原子提交 (仅一个 Agent 成功)
  3. 执行任务
  4. 调用 completeTask() 或 failTask()
  5. 返回循环 (直到无待处理任务)
```

**原子认领细节**:
- 事务保证无竞争条件
- 仅成功更新行的 Agent 获得任务
- 认领失败时 Agent 重试下一个任务
- 租约超时: 每任务 5 分钟
- 超时且无心跳时，任务自动释放回 pending

### 5. 心跳协议
- Agent 每 60 秒发送心跳
- 心跳记录: agent_id, 上次心跳时间, 当前任务 id
- 编排器每 60 秒运行清理检查
- 心跳超时 (>5 分钟) 且任务被认领时，任务自动释放

### 6. 进度追踪
- 编排器通过 TaskOutput 监控
- 显示实时进度: pending/claimed/done/failed 计数
- 通过 getActiveAgents() 获取活跃 Agent 数
- 检测空闲 Agent (所有任务已被其他人认领)

### 7. 完成条件

满足以下任一条件时退出：
- isSwarmComplete() 返回 true (所有任务 done 或 failed)
- 所有 Agent 空闲 (无 pending 任务，无 claimed 任务)
- 用户通过 `/cancel-swarm` 取消

---

## 状态存储

### 任务表结构

```
tasks 表:
  id          TEXT PRIMARY KEY
  description TEXT NOT NULL
  status      TEXT DEFAULT 'pending'
              -- pending: 等待认领
              -- claimed: 被 Agent 认领，进行中
              -- done: 成功完成
              -- failed: 完成但有错误
  claimed_by  TEXT          -- 认领此任务的 Agent ID
  claimed_at  INTEGER       -- 认领时间戳
  completed_at INTEGER      -- 完成时间戳
  result      TEXT          -- 任务输出/结果
  error       TEXT          -- 失败时的错误信息
```

### 心跳表结构

```
heartbeats 表:
  agent_id       TEXT PRIMARY KEY
  last_heartbeat INTEGER NOT NULL  -- 上次心跳时间戳
  current_task_id TEXT             -- Agent 当前工作的任务
```

### 会话表结构

```
session 表:
  id           TEXT PRIMARY KEY
  agent_count  INTEGER NOT NULL
  started_at   INTEGER NOT NULL
  completed_at INTEGER
  active       INTEGER DEFAULT 1
```

---

## Agent 类型映射

| 指定类型 | 实际 Agent | 专长 |
|---------|-----------|------|
| `luban` | 鲁班 | 代码实现、修复 |
| `gukaizhi` | 顾恺之 | 前端、UI 组件 |
| `baozheng` | 包拯 | 测试编写 |
| `bianque` | 扁鹊 | Bug 诊断修复 |
| `mozi` | 墨子 | 安全审计 |
| `simaqian` | 司马迁 | 文档编写 |
| `cangjie` | 仓颉 | 数据库相关 |
| `zhuge` | 诸葛 | 架构分析 |

---

## 关键参数

- **最大 Agent 数**: 5 (Claude Code 后台任务限制)
- **租约超时**: 5 分钟 (默认，可配置)
  - 认领超过此时间且无心跳的任务自动释放
- **心跳间隔**: 60 秒 (推荐)
  - Agent 应至少每此间隔发送心跳
  - 防止长任务时的误超时
- **清理间隔**: 60 秒
  - 编排器自动运行清理释放孤立任务

---

## 错误处理与恢复

### Agent 崩溃
- 任务被认领但 Agent 停止发送心跳
- 5 分钟无心跳后，清理检查释放任务
- 任务返回 'pending' 状态供其他 Agent 认领
- 原 Agent 的未完成工作安全放弃

### 任务完成失败
- Agent 调用 completeTask() 但不再是所有者（已被释放）
- 更新静默失败（WHERE 子句不匹配）
- Agent 可通过返回值检测此情况
- Agent 应记录错误并继续下一个任务

### 所有 Agent 空闲
- 编排器检测到 getActiveAgents() === 0 或 hasPendingWork() === false
- 触发最终清理并标记蜂群完成
- 剩余失败任务保留在数据库中

### 无可用任务
- claimTask() 返回 success=false，原因 '无 pending 任务可用'
- Agent 应在循环前检查 hasPendingWork()
- 无剩余工作时 Agent 可安全退出

---

## 使用示例

### 示例 1: 修复所有类型错误

```bash
/fengqun 5:luban "修复所有 TypeScript 类型错误"
```

生成 5 个鲁班，各自认领和修复独立文件。

### 示例 2: 实现 UI 组件

```bash
/swarm 3:gukaizhi "为 src/components/ 下所有组件实现 Material-UI 样式"
```

生成 3 个顾恺之，各自样式化不同的组件文件。

### 示例 3: 安全审计

```bash
/fengqun 4:mozi "审查所有 API 端点的安全漏洞"
```

生成 4 个墨子，各自审计不同的端点。

### 示例 4: 文档冲刺

```bash
/swarm 2:simaqian "为所有导出函数添加 JSDoc 注释"
```

生成 2 个司马迁，各自文档化不同的模块。

---

## 配置选项

可在 `.claude/settings.json` 中配置：

```json
{
  "omc": {
    "swarm": {
      "maxAgents": 5,
      "leaseTimeout": 300000,
      "heartbeatInterval": 60000,
      "cleanupInterval": 60000,
      "retryFailedTasks": true,
      "verboseProgress": true
    }
  }
}
```

---

## 取消蜂群

```bash
/cancel-swarm
# 或说: "停止蜂群", "取消协作"
```

**行为**:
- 停止编排器监控
- 向所有后台 Agent 发送退出信号
- 保留部分进度
- 标记会话为 "cancelled"

---

## 状态清理

**重要: 完成时删除状态文件 - 不要只设置 `active: false`**

当所有任务完成：

```bash
# 删除蜂群状态文件
rm -f .omc/state/swarm-state.json
rm -f .omc/state/swarm-tasks.json
```

---

## 文化寓意

蜂群模式的智慧源自中国传统的集体协作精神：

> **"人心齐，泰山移。"**

- **分工明确**：每个成员有清晰职责
- **协同配合**：通过机制保证无冲突
- **共同目标**：所有人朝同一方向努力

**众志成城，蜂群高效。**
