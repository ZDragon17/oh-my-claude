# Agent 协作协议 / Agent Collaboration Protocol

本文档定义了 oh-my-claude 中各 Agent 之间的协作方式和通信规范。

This document defines the collaboration patterns and communication protocols between agents in oh-my-claude.

## Agent 职责矩阵 / Agent Responsibility Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                        愚公 (YuGong)                             │
│                    主编排 / Main Orchestrator                    │
│         负责任务分解、进度追踪、协调其他 Agent                     │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  诸葛 (ZhuGe)   │ │  悟空 (WuKong)  │ │  扁鹊 (BianQue) │
│   战略顾问      │ │   代码侦察      │ │   Bug 诊断      │
│  Strategy       │ │  Scout          │ │  Diagnostics    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │                   ▼                   │
         │          ┌─────────────────┐          │
         └─────────►│  鲁班 (LuBan)   │◄─────────┘
                    │   精工巧匠      │
                    │  Implementation │
                    └─────────────────┘
```

## 🔗 Agent 调用语法 / Agent Invocation Syntax

### 显式调用 / Explicit Invocation

在任何 Agent 的工作中，可以通过以下语法调用其他 Agent：

```markdown
@agent_name [任务描述]
```

**调用示例：**

```markdown
@wukong 探索所有与用户认证相关的代码文件
@zhuge 分析当前架构的扩展性问题
@luban 实现 UserService 的 getProfile 方法
@bianque 诊断这个 TypeError: Cannot read property 'name' of undefined
@yugong 协调完成整个用户模块的重构
```

### 调用响应格式 / Invocation Response

被调用的 Agent 应以以下格式响应：

```markdown
---
【Agent名称】接受任务
---

[任务执行过程和结果]

---
【Agent名称】任务完成 ✅
交还控制权给 @caller_agent
---
```

## 协作模式 / Collaboration Patterns

### 1. 任务委派模式 / Task Delegation

愚公作为主编排者，可以将任务委派给其他 Agent：

```
愚公 ──[需要架构设计]──► 诸葛
愚公 ──[需要代码探索]──► 悟空
愚公 ──[需要问题诊断]──► 扁鹊
愚公 ──[需要代码实现]──► 鲁班
```

### 2. 信息流动模式 / Information Flow

```
悟空 ──[探索结果]──► 诸葛 ──[设计方案]──► 鲁班
扁鹊 ──[诊断报告]──► 鲁班 ──[修复代码]──► 愚公(验证)
```

### 3. 链式协作 / Chain Collaboration

多个 Agent 按顺序协作完成复杂任务：

```mermaid
graph LR
    A[用户需求] --> B[愚公分解]
    B --> C[悟空侦察]
    C --> D[诸葛设计]
    D --> E[鲁班实现]
    E --> F[扁鹊检查]
    F --> G[任务完成]
```

### 4. 并行协作 / Parallel Collaboration

多个 Agent 同时执行独立子任务：

```mermaid
graph TB
    A[愚公分解任务] --> B[子任务1]
    A --> C[子任务2]
    A --> D[子任务3]
    B --> E[鲁班实现模块A]
    C --> F[鲁班实现模块B]
    D --> G[诸葛设计模块C]
    E --> H[愚公汇总]
    F --> H
    G --> H
```

## 协作场景示例 / Collaboration Examples

### 场景一：新功能开发 / New Feature Development

```mermaid
sequenceDiagram
    participant 用户
    participant 愚公
    participant 悟空
    participant 诸葛
    participant 鲁班

    用户->>愚公: 实现用户认证功能
    愚公->>悟空: @wukong 探索现有认证代码
    悟空-->>愚公: 发现现有 auth 模块
    愚公->>诸葛: @zhuge 设计认证架构
    诸葛-->>愚公: JWT + 刷新令牌方案
    愚公->>鲁班: @luban 实现认证模块
    鲁班-->>愚公: 代码完成
    愚公-->>用户: 任务完成
```

**实际交互示例：**

```markdown
【愚公开始任务】
用户需要实现用户认证功能，我来分解任务并协调各位专家。

首先，我需要了解现有代码库：
@wukong 探索所有与用户认证相关的代码，包括：
- 现有的 auth 目录结构
- 已有的用户模型
- 相关的中间件
```

```markdown
---
【悟空】接受任务
---

🔍 开始探索认证相关代码...

### 发现结果

**相关文件：**
- `src/auth/` - 认证模块目录
- `src/models/User.ts` - 用户模型
- `src/middleware/authMiddleware.ts` - 认证中间件

**当前状态：**
- 已有基础的 User 模型
- 缺少 JWT 相关实现
- 没有刷新令牌机制

---
【悟空】任务完成 ✅
交还控制权给 @yugong
---
```

### 场景二：Bug 修复 / Bug Fixing

```mermaid
sequenceDiagram
    participant 用户
    participant 愚公
    participant 扁鹊
    participant 悟空
    participant 鲁班

    用户->>愚公: 登录报错
    愚公->>扁鹊: @bianque 诊断错误原因
    扁鹊->>悟空: @wukong 追踪错误调用链
    悟空-->>扁鹊: 定位到 auth.service.ts
    扁鹊-->>愚公: 根因：Token 过期处理缺失
    愚公->>鲁班: @luban 修复 Token 过期逻辑
    鲁班-->>愚公: 修复完成
    愚公-->>用户: Bug 已修复
```

### 场景三：架构重构 / Architecture Refactoring

```markdown
【愚公开始重构任务】

这是一个大规模重构任务，需要多位专家协作：

**第一阶段：评估**
@wukong 探索当前架构，梳理模块依赖关系
@zhuge 评估现有架构的问题和改进空间

**第二阶段：设计**
@zhuge 设计新的架构方案，考虑：
- 模块解耦
- 可扩展性
- 向后兼容

**第三阶段：实施**
@luban 按照设计方案，分模块实施重构

**第四阶段：验证**
@bianque 验证重构后的功能正确性
```

## Agent 通信接口 / Agent Communication Interface

### 任务请求格式 / Task Request Format

```typescript
interface AgentTaskRequest {
  from: AgentName;        // 发起者
  to: AgentName;          // 目标 Agent
  type: TaskType;         // 任务类型
  context: string;        // 上下文信息
  requirements: string[]; // 具体要求
  priority: Priority;     // 优先级
}

type AgentName = 'yugong' | 'zhuge' | 'luban' | 'wukong' | 'bianque';
type TaskType = 'explore' | 'design' | 'implement' | 'diagnose' | 'review';
type Priority = 'high' | 'medium' | 'low';
```

### 任务响应格式 / Task Response Format

```typescript
interface AgentTaskResponse {
  from: AgentName;
  status: 'success' | 'partial' | 'failed';
  result: string;
  artifacts?: string[];   // 产出物（文件路径等）
  suggestions?: string[]; // 后续建议
  blockers?: string[];    // 遇到的阻碍
  handover?: AgentName;   // 建议下一个接手的 Agent
}
```

## 🎯 协作决策树 / Collaboration Decision Tree

当遇到任务时，按以下决策树选择合适的协作模式：

```
任务到达
    │
    ├─ 需要了解代码现状？
    │   └─ YES → @wukong 侦察
    │
    ├─ 需要架构/技术决策？
    │   └─ YES → @zhuge 咨询
    │
    ├─ 需要精密代码实现？
    │   └─ YES → @luban 实现
    │
    ├─ 遇到错误/异常？
    │   └─ YES → @bianque 诊断
    │
    └─ 大规模/多步骤任务？
        └─ YES → @yugong 编排
```

## 协作原则 / Collaboration Principles

### 1. 单一职责 / Single Responsibility

每个 Agent 专注于自己的领域：

| Agent | 核心职责 | 不应处理 |
|-------|----------|----------|
| 愚公 | 任务编排、进度追踪 | 具体实现细节 |
| 诸葛 | 架构设计、技术决策 | 代码编写 |
| 鲁班 | 代码实现、质量优化 | 架构决策 |
| 悟空 | 代码探索、信息收集 | 代码修改 |
| 扁鹊 | 问题诊断、根因分析 | 架构重构 |

### 2. 信息透明 / Information Transparency

- 所有 Agent 的工作结果对其他 Agent 可见
- 使用 TodoWrite 记录任务状态
- 关键决策要有文档记录

### 3. 渐进式交付 / Incremental Delivery

- 大任务分解为小步骤
- 每完成一步就更新进度
- 遇到阻碍及时反馈

### 4. 优雅交接 / Graceful Handover

- 明确标注任务开始和结束
- 提供清晰的上下文信息
- 建议下一步行动

## 🛠️ 团队协作命令 / Team Collaboration Command

使用 `/team` 命令可以启动多 Agent 协作模式：

```bash
/team [任务描述]
```

愚公会自动分析任务，召集合适的 Agent 组成团队，协作完成任务。

**示例：**

```bash
/team 重构用户模块，提高代码质量和可维护性
```

愚公会：
1. 召唤悟空探索现有代码
2. 召唤诸葛设计重构方案
3. 召唤鲁班执行代码修改
4. 召唤扁鹊验证功能正确性

## 扩展新 Agent / Adding New Agents

如需添加新的 Agent，请遵循以下步骤：

1. **定义角色**：明确新 Agent 的职责和专长
2. **确定协作关系**：如何与现有 Agent 配合
3. **创建 Agent 文件**：在 `agents/` 目录创建配置
4. **创建命令文件**：在 `commands/` 目录创建触发命令
5. **更新文档**：更新本协议和 README

### Agent 定义模板

```markdown
---
name: new-agent
description: |
  新 Agent 描述...
allowed-tools:
  - Read
  - Grep
  - Glob
  # 根据需要添加
model: sonnet  # 或 opus / haiku
---

# Agent 名称

Agent 详细说明...

## 与其他 Agent 的协作

- 如何被其他 Agent 调用
- 如何调用其他 Agent
- 协作输出格式
```

## 版本历史 / Version History

| 版本 | 日期 | 变更 |
|------|------|------|
| 0.2.0 | 2025-01 | 增强 Agent 协作机制，添加调用语法和 /team 命令 |
| 0.1.0 | 2025-01 | 初始版本，定义 5 个核心 Agent 的协作模式 |

---

> **注**：本协议会随着项目发展持续更新。欢迎通过 Issue 或 PR 提出改进建议。
