---
name: ultrapilot
description: |
  超级并行模式 (Ultrapilot) - 文件所有权分区的并行自动驾驶。
  通过任务分解和独占文件分配，实现最多 5 倍的执行加速。
---

# 超级并行模式 (Ultrapilot)

基于 oh-my-opencode 的 ultrapilot 机制，融入中国传统文化元素。

## 核心理念

> **千军万马，各司其职，协同作战。**

灵感来自中国古代的军事编制：
- **分而治之**：将大任务分解为独立子任务
- **各守其土**：每个 Worker 独占文件区域
- **协同作战**：并行执行，最后整合

---

## 关键词触发

| 关键词 | 说明 |
|--------|------|
| `ultrapilot` / `up` | 英文触发词 |
| `chaoji` / `超级` | 中文触发词 |
| `parallel build` / `并行构建` | 描述性触发 |
| `swarm build` / `蜂群构建` | 描述性触发 |

---

## 架构概览

```
用户输入: "构建一个全栈 Todo 应用"
           |
           v
  [超级模式协调器 - 愚公]
           |
   任务分解 + 文件分区
           |
   +-------+-------+-------+-------+
   |       |       |       |       |
   v       v       v       v       v
[W-1]   [W-2]   [W-3]   [W-4]   [W-5]
后端    前端    数据库   文档    测试
鲁班    顾恺之   仓颉    司马迁   包拯
(src/  (src/   (src/    (docs/)  (tests/)
 api/)  ui/)    db/)
   |       |       |       |       |
   +---+---+---+---+---+---+---+---+
       |
       v
  [整合阶段 - 诸葛]
  (共享文件: package.json, tsconfig.json 等)
       |
       v
  [验证阶段 - 魏征]
  (全系统测试)
```

---

## 五阶段流程

### 阶段 0: 任务分析

**目标**: 判断任务是否可并行化

**检查项**:
- 能否拆分为 2+ 个独立子任务？
- 文件边界是否清晰？
- 子任务间依赖是否最小？

**输出**: 可行/不可行决策（不可行则回退到标准愚公模式）

### 阶段 1: 任务分解

**目标**: 将任务拆解为并行安全的子任务

**执行者**: 诸葛 (Opus 级别)

**分解结果示例**:

```json
{
  "subtasks": [
    {
      "id": "1",
      "description": "后端 API 路由",
      "files": ["src/api/routes.ts", "src/api/handlers.ts"],
      "blockedBy": [],
      "agent": "luban",
      "tier": "MEDIUM"
    },
    {
      "id": "2", 
      "description": "前端组件",
      "files": ["src/ui/App.tsx", "src/ui/TodoList.tsx"],
      "blockedBy": [],
      "agent": "gukaizhi",
      "tier": "MEDIUM"
    },
    {
      "id": "3",
      "description": "前后端对接",
      "files": ["src/client/api.ts"],
      "blockedBy": ["1", "2"],
      "agent": "luban-low",
      "tier": "LOW"
    }
  ],
  "sharedFiles": ["package.json", "tsconfig.json", "README.md"],
  "parallelGroups": [["1", "2"], ["3"]]
}
```

### 阶段 2: 文件所有权分区

**目标**: 为每个 Worker 分配独占文件集

**规则**:
1. **独占所有权** - 同一文件不能分配给多个 Worker
2. **共享文件延迟** - 在整合阶段顺序处理
3. **边界文件追踪** - 记录跨边界导入的文件

**所有权映射** (`.omc/state/ultrapilot-ownership.json`):

```json
{
  "sessionId": "ultrapilot-20260129-1234",
  "workers": {
    "worker-1-luban": {
      "ownedFiles": ["src/api/routes.ts", "src/api/handlers.ts"],
      "ownedGlobs": ["src/api/**"],
      "boundaryImports": ["src/types.ts"]
    },
    "worker-2-gukaizhi": {
      "ownedFiles": ["src/ui/App.tsx", "src/ui/TodoList.tsx"],
      "ownedGlobs": ["src/ui/**"],
      "boundaryImports": ["src/types.ts"]
    }
  },
  "sharedFiles": ["package.json", "tsconfig.json", "src/types.ts"],
  "conflictPolicy": "coordinator-handles"
}
```

### 阶段 3: 并行执行

**目标**: 同时运行所有 Worker

**Worker 生成模板**:

```javascript
Task(
  subagent_type: "oh-my-claude:luban",
  model: "sonnet",
  run_in_background: true,
  prompt: `超级模式 WORKER [1/5]

你的独占文件: src/api/**
任务: 实现后端 API 路由

【关键规则】
1. 只能修改你所有权内的文件
2. 如需修改共享文件，在输出中记录变更需求
3. 不要在所有权外创建新文件
4. 追踪所有边界文件的导入

完成后输出: 代码变更 + 边界依赖列表`
)
```

**监控**:
- 轮询各 Worker 的 TaskOutput
- 追踪完成状态
- 及早检测冲突
- 累积边界依赖

**最大 Worker 数**: 5 (Claude Code 限制)

### 阶段 4: 整合

**目标**: 合并所有 Worker 变更，处理共享文件

**流程**:
1. **收集输出** - 汇总所有 Worker 的交付物
2. **检测冲突** - 检查意外的文件重叠
3. **处理共享文件** - 顺序更新 package.json 等
4. **整合边界文件** - 合并类型定义、共享工具
5. **解析导入** - 确保跨边界导入有效

**执行者**: 诸葛 (Sonnet) - 顺序处理

### 阶段 5: 验证

**目标**: 验证整合后的系统正常工作

**检查项 (并行)**:
1. **构建** - `npm run build` 或等效命令
2. **Lint** - `npm run lint`
3. **类型检查** - `tsc --noEmit`
4. **单元测试** - 所有测试通过
5. **集成测试** - 跨组件测试

**执行者 (并行)**:
- 扁鹊 (Sonnet) - 修复构建错误
- 诸葛 (Opus) - 功能完整性
- 墨子 (Opus) - 跨组件安全漏洞

**重试策略**: 最多 3 轮验证。若持续失败，向用户报告详细错误。

---

## 状态管理

### 会话状态

**位置**: `.omc/ultrapilot-state.json`

```json
{
  "sessionId": "ultrapilot-20260129-1234",
  "taskDescription": "构建一个全栈 Todo 应用",
  "phase": "execution",
  "startTime": "2026-01-29T10:30:00Z",
  "decomposition": { /* 阶段 1 的结果 */ },
  "workers": {
    "worker-1-luban": {
      "status": "running",
      "taskId": "task-abc123",
      "startTime": "2026-01-29T10:31:00Z"
    }
  },
  "conflicts": [],
  "validationAttempts": 0
}
```

### 进度追踪

**位置**: `.omc/ultrapilot/progress.json`

```json
{
  "totalWorkers": 5,
  "completedWorkers": 3,
  "activeWorkers": 2,
  "failedWorkers": 0,
  "estimatedTimeRemaining": "2m30s"
}
```

---

## Agent 智能分派

| 子任务类型 | 默认 Agent | 备选 Agent |
|-----------|-----------|-----------|
| 后端 API | 鲁班 | 鲁班-low |
| 前端 UI | 顾恺之 | 顾恺之-low |
| 数据库 | 仓颉 | 仓颉-low |
| 测试 | 包拯 | 包拯-low |
| 文档 | 司马迁 | 司马迁-low |
| 安全 | 墨子 | - |
| 性能 | 孙子 | - |

---

## 配置选项

可在 `.claude/settings.json` 中配置：

```json
{
  "omc": {
    "ultrapilot": {
      "maxWorkers": 5,
      "maxValidationRounds": 3,
      "conflictPolicy": "coordinator-handles",
      "fallbackToYishan": true,
      "parallelThreshold": 2,
      "pauseAfterDecomposition": false,
      "verboseProgress": true
    }
  }
}
```

---

## 使用示例

### 示例 1: 全栈应用

```bash
/chaoji 构建一个 Todo 应用，包含 React 前端、Express 后端和 PostgreSQL 数据库
```

**Worker 分配**:
1. 顾恺之 - 前端 (src/client/)
2. 鲁班 - 后端 (src/server/)
3. 仓颉 - 数据库 (src/db/)
4. 包拯 - 测试 (tests/)
5. 司马迁 - 文档 (docs/)

**预计时间**: ~15 分钟 (vs 顺序执行 ~75 分钟)

### 示例 2: 多服务重构

```bash
/ultrapilot 将所有服务重构为依赖注入模式
```

**Worker 分配**:
1. 鲁班-1 - 认证服务
2. 鲁班-2 - 用户服务
3. 鲁班-3 - 支付服务
4. 鲁班-4 - 通知服务

**预计时间**: ~8 分钟 (vs 顺序执行 ~32 分钟)

---

## 取消与恢复

### 取消

```bash
/cancel-ultrapilot
# 或说: "停止超级模式", "取消并行"
```

**行为**:
- 所有活跃 Worker 优雅终止
- 部分进度保存到状态文件
- 会话可恢复

### 恢复

```bash
/ultrapilot resume
# 或: /chaoji 继续
```

**恢复逻辑**:
- 仅重启失败的 Worker
- 复用已完成 Worker 的输出
- 从上次阶段继续

---

## 与标准愚公模式的区别

| 特性 | 愚公移山 | 超级模式 |
|------|---------|---------|
| 执行方式 | 顺序 | 并行 (最多 5x) |
| 适用场景 | 单线程任务 | 多组件系统 |
| 复杂度 | 较低 | 较高 |
| 速度 | 标准 | 3-5 倍加速 |
| 文件冲突 | 无 | 所有权分区 |
| 回退 | - | 可回退到愚公模式 |

**经验法则**: 任务有 3+ 个独立组件时，使用超级模式。否则使用标准愚公模式。

---

## 文化寓意

超级模式的智慧源自中国古代军事思想：

> **"运筹帷幄之中，决胜千里之外。"** —— 《史记·高祖本纪》

- **分而治之**: 将复杂问题分解为简单问题
- **各司其职**: 每个专家负责擅长领域
- **协同作战**: 最终整合形成完整方案

**智者善分，愚公能聚。**
