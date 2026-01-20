---
name: start-work
description: |
  开始工作流命令 - 从 GitHub Issue 或任务描述开始完整工作流程。
  自动分析需求、创建 TODO、执行实现、验证结果。
  别名：/work, /begin
---

# 🚀 开始工作流

你正在启动 **开始工作流** 模式。这是一个完整的从需求到交付的工作流程。

## 工作流程

### 阶段 1: 需求分析

**理解任务**:

```
1. 解析用户提供的任务描述或 GitHub Issue
2. 识别：
   - 核心需求是什么？
   - 成功标准是什么？
   - 有什么约束条件？
   - 涉及哪些文件/模块？
```

**如果是 GitHub Issue**:

```bash
# 获取 Issue 详情
gh issue view <issue_number>

# 获取相关讨论
gh issue view <issue_number> --comments
```

### 阶段 2: 探索现有代码

**并行发起探索**:

```
# 探索相关代码
background_task(agent="explore", prompt="找到与 [需求] 相关的现有代码...")

# 探索测试模式
background_task(agent="explore", prompt="找到类似功能的测试模式...")

# 如果涉及外部库，探索文档
background_task(agent="librarian", prompt="获取 [库名] 的最佳实践...")
```

### 阶段 3: 创建工作计划

**使用 TodoWrite 创建详细计划**:

```
TodoWrite([
  { id: "1", content: "分析需求和现有代码", status: "pending", priority: "high" },
  { id: "2", content: "设计实现方案", status: "pending", priority: "high" },
  { id: "3", content: "实现核心功能", status: "pending", priority: "high" },
  { id: "4", content: "添加测试", status: "pending", priority: "medium" },
  { id: "5", content: "验证和文档", status: "pending", priority: "medium" }
])
```

### 阶段 4: 执行实现

**根据任务类型分派**:

| 任务类型 | 分派给 | 行动 |
|----------|--------|------|
| 架构设计 | 诸葛 (oracle) | 设计方案评审 |
| 代码实现 | 鲁班 (general) | 核心实现 |
| UI/UX | 顾恺之 (frontend) | 界面设计实现 |
| 测试 | 包拯 (test-engineer) | 测试编写 |
| 文档 | 司马迁 (document-writer) | 文档更新 |

### 阶段 5: 验证

**验证清单**:

```
□ 代码编译/构建通过
□ lsp_diagnostics 无错误
□ 测试通过（如有）
□ 满足成功标准
□ 无回归问题
```

### 阶段 6: 交付

**根据需求交付**:

- 如果需要 PR → 创建 PR
- 如果是本地任务 → 报告完成
- 如果涉及 Issue → 引用 Issue 编号

## 输入格式

支持多种输入格式：

```bash
# GitHub Issue
/start-work #123

# Issue URL
/start-work https://github.com/org/repo/issues/123

# 任务描述
/start-work 实现用户登录功能

# 详细需求
/start-work 添加一个 REST API 端点 /api/users，支持 CRUD 操作
```

## 用户的任务

$ARGUMENTS

---

## 开始执行

现在我将：

1. **分析需求** - 理解你想要什么
2. **探索代码** - 了解现有实现
3. **创建计划** - 使用 TodoWrite 分解任务
4. **执行实现** - 逐步完成子任务
5. **验证结果** - 确保质量和正确性
6. **交付成果** - 完成 PR 或报告

**工作流启动...**
