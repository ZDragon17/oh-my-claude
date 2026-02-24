---
name: start-work
description: |
  开始工作流命令 - 从 Prometheus 计划或 GitHub Issue 开始完整工作流程。
  自动分析需求、加载计划、创建 TODO、执行实现、验证结果。
  别名：/work, /begin
---

# 开始工作会话

你正在启动一个 Sisyphus 工作会话。

## 执行步骤

### 1. 查找可用计划

搜索 Prometheus 生成的计划文件：

```
查找 .sisyphus/plans/ 目录
查找 .claude/plans/ 目录
查找任何 *-plan.md 文件
```

### 2. 检查活跃状态

读取 `.sisyphus/boulder.json`（如果存在）。

### 3. 决策逻辑

- 如果 `boulder.json` 存在且计划未完成（有未勾选项）：
  - 继续现有计划的工作
- 如果没有活跃计划或计划已完成：
  - 列出可用计划文件
  - 如果只有一个计划：自动选择
  - 如果有多个计划：显示列表让用户选择
- 如果没有任何计划文件：
  - 解析用户提供的任务描述或 GitHub Issue
  - 创建新的 TODO 列表

### 4. 创建/更新状态

```json
{
  "active_plan": "/absolute/path/to/plan.md",
  "started_at": "ISO_TIMESTAMP",
  "plan_name": "plan-name"
}
```

### 5. 读取计划并开始执行

读取完整计划文件，按照 atlas 工作流开始执行任务。

---

## 输出格式

### 列出计划时

```
可用工作计划

当前时间: {ISO timestamp}

1. [plan-name-1.md] - 修改: {date} - 进度: 3/10 任务
2. [plan-name-2.md] - 修改: {date} - 进度: 0/5 任务

选择要执行的计划？（输入编号或计划名）
```

### 恢复现有工作时

```
恢复工作会话

活跃计划: {plan-name}
进度: {completed}/{total} 任务

读取计划并从上次未完成的任务继续...
```

### 自动选择单一计划时

```
启动工作会话

计划: {plan-name}
开始时间: {timestamp}

读取计划并开始执行...
```

---

## 如果是 GitHub Issue

```bash
# 获取 Issue 详情
gh issue view <issue_number>

# 获取相关讨论
gh issue view <issue_number> --comments
```

---

## 任务分派参考

| 任务类型 | 分派建议 | 说明 |
|----------|----------|------|
| 架构设计 | oracle | 只读咨询，设计方案评审 |
| 前端实现 | visual-engineering | 带 frontend-ui-ux 技能 |
| 后端实现 | deep/unspecified-high | 带相关技能 |
| 测试编写 | unspecified-high | 带 tdd-workflow 技能 |
| 文档更新 | writing | 带相关技能 |
| 简单修改 | quick | 快速任务 |

---

## 关键规则

- 读取完整计划文件后再委派任何任务
- 始终在开始工作前更新状态文件
- 遵循 Category+Skills 委派协议

## 输入格式

```bash
# GitHub Issue
/start-work #123

# Issue URL
/start-work https://github.com/org/repo/issues/123

# 任务描述
/start-work 实现用户登录功能

# 无参数（查找现有计划）
/start-work
```

## 用户的任务

$ARGUMENTS

---

**工作流启动...**
