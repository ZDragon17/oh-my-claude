---
name: yishan
description: |
  愚公移山循环技能 v2.0 - 实现自主持续执行机制。
  通过关键词触发 + Agent 智能分派 + TODO 强制执行，确保任务完成。
---

# 愚公移山循环 (Yishan Loop) v2.0

基于 oh-my-opencode 的 Sisyphus/ultrawork 机制重新设计，支持实际调用子 agents。

## 核心机制

### 1. 关键词触发

当用户消息包含以下关键词时，自动激活愚公移山模式：

| 关键词 | 说明 |
|--------|------|
| `ultrawork` / `ulw` | 英文触发词 |
| `yishan` / `yugong` | 拼音触发词 |
| `移山` / `愚公` | 中文触发词 |
| `persist` | 持续执行 |

### 2. 激活后行为

激活时，Agent 必须执行以下行为：

```
**必须**：首先向用户宣告 "🏔️ 愚公移山模式已激活！"
```

---

## Agent 智能分派（核心功能）

### Agent 映射表

愚公作为主编排者，会根据任务类型自动分派给专业 Agent：

| 中国文化 Agent | Claude subagent_type | 专长领域 |
|---------------|---------------------|----------|
| 悟空 (wukong) | `explore` | 代码侦察、文件探索 |
| 诸葛 (zhuge) | `oracle` | 架构设计、战略顾问 |
| 鲁班 (luban) | `general` | 代码实现、精工巧匠 |
| 扁鹊 (bianque) | `debugger` | Bug诊断、问题修复 |
| 司马迁 (simaqian) | `document-writer` | 文档撰写、变更记录 |
| 顾恺之 (gukaizhi) | `frontend-ui-ux-engineer` | UI/UX设计、界面美学 |
| 墨子 (mozi) | `security-auditor` | 安全审计、防御编程 |
| 孙子 (sunzi) | `performance-engineer` | 性能优化、系统调优 |
| 包拯 (baozheng) | `test-engineer` | 测试专家、TDD |
| 魏征 (weizheng) | `code-reviewer` | 代码审查、规范检查 |
| 老子 (laozi) | `general` | 代码简化、Clean Code |
| 仓颉 (cangjie) | `database-architect` | 数据库设计、SQL优化 |

### 任务分派规则

根据任务关键词自动识别需要的 Agent：

| 任务关键词 | 分派给 |
|-----------|--------|
| 探索、查找、定位 | 悟空 (explore) |
| 架构、设计、规划 | 诸葛 (oracle) |
| 实现、编码、开发 | 鲁班 (general) |
| 调试、诊断、修复 | 扁鹊 (debugger) |
| 文档、注释、记录 | 司马迁 (document-writer) |
| 界面、UI、样式 | 顾恺之 (frontend-ui-ux-engineer) |
| 安全、审计、防护 | 墨子 (security-auditor) |
| 性能、优化、加速 | 孙子 (performance-engineer) |
| 测试、验证、断言 | 包拯 (test-engineer) |
| 审查、检查、规范 | 魏征 (code-reviewer) |

### 实际调用方式

使用 `Task` 工具调用子 agents：

```
# 调用悟空探索代码
Task(subagent_type="explore", prompt="作为悟空（代码侦察专家），请探索项目中所有与用户认证相关的代码文件，分析其结构和依赖关系。")

# 调用诸葛设计架构
Task(subagent_type="oracle", prompt="作为诸葛（战略顾问），请评审当前的架构设计，提出改进建议。")

# 调用鲁班实现功能
Task(subagent_type="general", prompt="作为鲁班（精工巧匠），请实现用户登录功能，包括表单验证和API调用。")

# 调用顾恺之设计界面
Task(subagent_type="frontend-ui-ux-engineer", prompt="作为顾恺之（界面美学师），请设计并实现登录页面的UI组件。")
```

### 并行调用

独立任务应并行发起多个 agents：

```
# 并行启动探索和文档任务
Task(subagent_type="explore", prompt="悟空：探索现有代码结构...")
Task(subagent_type="document-writer", prompt="司马迁：整理现有文档...")

# 并行启动设计任务
Task(subagent_type="oracle", prompt="诸葛：设计系统架构...")
Task(subagent_type="database-architect", prompt="仓颉：设计数据库模型...")
```

---

## 标准工作流程

### 阶段 1：探索侦察

```
Task(subagent_type="explore", prompt="悟空：全面探索代码库，分析现有实现和依赖关系...")
```

等待探索结果，了解代码现状。

### 阶段 2：架构设计

```
Task(subagent_type="oracle", prompt="诸葛：基于探索结果，设计实现方案...")
```

获取架构建议和技术决策。

### 阶段 3：并行实现

```
# 后端实现
Task(subagent_type="general", prompt="鲁班：实现后端API和业务逻辑...")

# 前端实现（如需要）
Task(subagent_type="frontend-ui-ux-engineer", prompt="顾恺之：实现前端界面...")

# 数据库实现（如需要）
Task(subagent_type="database-architect", prompt="仓颉：实现数据库迁移...")
```

### 阶段 4：质量保证

```
# 并行进行测试和审查
Task(subagent_type="test-engineer", prompt="包拯：编写和运行测试...")
Task(subagent_type="code-reviewer", prompt="魏征：审查代码质量...")
Task(subagent_type="security-auditor", prompt="墨子：进行安全审计...")
```

### 阶段 5：优化收尾

```
Task(subagent_type="performance-engineer", prompt="孙子：分析和优化性能...")
Task(subagent_type="general", prompt="老子：简化代码，去除冗余...")
Task(subagent_type="document-writer", prompt="司马迁：更新文档...")
```

---

## TODO 强制执行

### 规则

1. **必须使用 TodoWrite** - 将任务分解为具体的 TODO 项
2. **实时更新状态** - 完成一个就标记一个，不要批量更新
3. **不允许中途停止** - TODO 未全部完成前不能结束对话
4. **自我检查** - 每次准备停止前，检查是否有未完成的 TODO

### 自检流程

```
准备停止时：
1. 读取当前 TODO 列表
2. 检查是否有 pending 或 in_progress 状态的项
3. 如果有 → 继续工作
4. 如果全部完成 → 可以停止
```

---

## 验证保证（NON-NEGOTIABLE）

**没有证据 = 没有完成。**

| 阶段 | 行动 | 所需证据 |
|------|------|----------|
| **构建** | 运行构建命令 | Exit code 0，无错误 |
| **测试** | 执行测试套件 | 所有测试通过 |
| **手动验证** | 测试实际功能 | 描述观察到的结果 |
| **回归** | 确保没有破坏现有功能 | 现有测试仍然通过 |

---

## 零容忍失败

| 违规 | 为什么失败 |
|------|-----------|
| "应该可以工作了" | 没有证据。运行它。 |
| "我添加了测试" | 它们通过了吗？显示输出。 |
| "修复了 bug" | 你怎么知道？你测试了什么？ |
| "实现完成" | 你根据成功标准验证了吗？ |
| 跳过测试执行 | 测试存在是为了运行，不只是写 |

---

## 禁止行为

- **禁止范围缩减**：不要做"demo"、"骨架"、"简化版"
- **禁止 MockUp**：用户要求 A，就 100% 完成 A
- **禁止部分完成**：不要在 60% 时说"你可以扩展..."
- **禁止提前停止**：TODO 全部完成前不能宣布完成
- **禁止删除测试**：不要删除失败测试来使构建通过

---

## 与 oh-my-opencode 的对应关系

| oh-my-opencode | oh-my-claude |
|----------------|--------------|
| Sisyphus | 愚公 (YuGong) |
| explore agent | 悟空 (WuKong) |
| oracle agent | 诸葛 (ZhuGe) |
| librarian agent | 司马迁 (SimaQian) |
| frontend-ui-ux-engineer | 顾恺之 (GuKaiZhi) |
| document-writer | 司马迁 (SimaQian) |
| ultrawork / ulw | ultrawork / ulw / 移山 |
| delegate_task() | Task(subagent_type=...) |

---

## 文化寓意

正如愚公所言：

> "虽我之死，有子存焉；子又生孙，孙又生子...
> 子子孙孙无穷匮也，而山不加增，何苦而不平？"

**坚持就是胜利。只要方向正确，任务必将完成。**
