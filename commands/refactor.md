---
name: refactor
description: |
  智能重构命令 - LSP + AST-grep + 架构分析 + 测试验证的系统化重构。
  支持重命名、提取、移动等重构操作，带确定性执行和持续验证。
aliases:
  - /重构
  - /rf
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
  - Edit
  - Write
  - Bash
  - TodoWrite
  - mcp_lsp_goto_definition
  - mcp_lsp_find_references
  - mcp_lsp_symbols
  - mcp_lsp_diagnostics
  - mcp_lsp_prepare_rename
  - mcp_lsp_rename
  - mcp_ast_grep_search
  - mcp_ast_grep_replace
model: sonnet
---

<command-name>/refactor</command-name>

# 智能重构命令

## 用法

```
/refactor <重构目标> [--scope=<file|module|project>] [--strategy=<safe|aggressive>]

参数:
  重构目标: 可以是文件路径、符号名、模式或描述

选项:
  --scope: 重构范围（默认: module）
  --strategy: 风险容忍度（默认: safe）
```

---

# 阶段 0: 意图门控（必须首先执行）

## 步骤 0.1: 解析请求类型

| 信号 | 分类 | 操作 |
|------|------|------|
| 具体文件/符号 | 明确 | 进入代码库分析 |
| "将 X 重构为 Y" | 清晰转换 | 进入代码库分析 |
| "改进"、"清理" | 开放式 | **必须询问**: "具体改进什么？" |
| 范围模糊 | 不确定 | **必须询问**: "哪些模块/文件？" |

## 步骤 0.2: 验证理解

确认以下各项：
- [ ] 目标已明确识别
- [ ] 期望结果已理解
- [ ] 范围已定义
- [ ] 成功标准可以阐述

**如果有任何不清楚，询问澄清问题。**

## 步骤 0.3: 创建初始 Todos

```
TodoWrite([
  {"id": "phase-1", "content": "阶段 1: 代码库分析 - 启动并行探索 Agent", "status": "pending", "priority": "high"},
  {"id": "phase-2", "content": "阶段 2: 构建代码地图 - 映射依赖和影响区域", "status": "pending", "priority": "high"},
  {"id": "phase-3", "content": "阶段 3: 测试评估 - 分析测试覆盖和验证策略", "status": "pending", "priority": "high"},
  {"id": "phase-4", "content": "阶段 4: 计划生成 - 调用诸葛生成详细重构计划", "status": "pending", "priority": "high"},
  {"id": "phase-5", "content": "阶段 5: 执行重构 - 逐步执行并持续验证", "status": "pending", "priority": "high"},
  {"id": "phase-6", "content": "阶段 6: 最终验证 - 完整测试套件和回归检查", "status": "pending", "priority": "high"}
])
```

---

# 阶段 1: 代码库分析（并行探索）

**将 phase-1 标记为 in_progress。**

## 1.1: 启动并行探索 Agent（后台）

同时启动所有探索：

```
// Agent 1: 查找重构目标
task(subagent_type="explore", run_in_background=true, load_skills=[], description="查找重构目标", prompt="查找 [TARGET] 的所有出现和定义。报告: 文件路径、行号、使用模式。")

// Agent 2: 查找相关代码
task(subagent_type="explore", run_in_background=true, load_skills=[], description="查找依赖", prompt="查找所有导入、使用或依赖 [TARGET] 的代码。报告: 依赖链、导入图。")

// Agent 3: 查找类似模式
task(subagent_type="explore", run_in_background=true, load_skills=[], description="查找类似模式", prompt="查找代码库中与 [TARGET] 类似的模式。报告: 类似实现、已建立的约定。")

// Agent 4: 查找测试
task(subagent_type="explore", run_in_background=true, load_skills=[], description="查找测试", prompt="查找与 [TARGET] 相关的所有测试文件。报告: 测试文件路径、测试用例名、覆盖指标。")
```

## 1.2: 直接工具探索（Agent 运行同时）

### LSP 工具精确分析

```
mcp_lsp_goto_definition — 跳转到定义
mcp_lsp_find_references — 查找所有引用
mcp_lsp_symbols — 文件/工作区符号
mcp_lsp_diagnostics — 当前诊断基线
```

### AST-Grep 模式分析

```
mcp_ast_grep_search — 结构化模式搜索
mcp_ast_grep_replace(dryRun=true) — 预览重构（始终先预览）
```

## 1.3: 收集后台结果

所有结果收集后，**将 phase-1 标记为 completed。**

---

# 阶段 2: 构建代码地图

**将 phase-2 标记为 in_progress。**

基于阶段 1 结果构建：

```
## CODEMAP: [TARGET]

### 核心文件（直接影响）
### 依赖图
### 影响区域
| 区域 | 风险等级 | 影响文件 | 测试覆盖 |
|------|----------|----------|----------|
```

识别重构约束：
- **必须遵循**: 已识别的现有模式
- **不能破坏**: 关键依赖
- **安全可改**: 隔离的代码区域

**将 phase-2 标记为 completed。**

---

# 阶段 3: 测试评估

**将 phase-3 标记为 in_progress。**

| 覆盖等级 | 策略 |
|----------|------|
| 高 (>80%) | 每步后运行现有测试 |
| 中 (50-80%) | 运行测试 + 添加安全断言 |
| 低 (<50%) | **暂停**: 建议先添加测试 |
| 无 | **阻止**: 拒绝激进重构 |

**将 phase-3 标记为 completed。**

---

# 阶段 4: 计划生成

**将 phase-4 标记为 in_progress。**

调用诸葛 (plan agent) 生成详细重构计划：

```
task(subagent_type="plan", load_skills=[], run_in_background=false, description="重构计划",
  prompt="创建详细重构计划:
  ## 重构目标: [用户原始请求]
  ## 代码地图: [阶段 2 结果]
  ## 测试覆盖: [阶段 3 结果]
  ## 要求: 原子步骤、可独立验证、按依赖排序")
```

将计划转换为细粒度 todos。

**将 phase-4 标记为 completed。**

---

# 阶段 5: 执行重构（确定性执行）

**将 phase-5 标记为 in_progress。**

对每个重构步骤：

### 执行前
1. 标记步骤 todo 为 `in_progress`
2. 读取当前文件状态
3. 验证 lsp_diagnostics 基线

### 执行
根据类型选择工具：
- **符号重命名**: `mcp_lsp_prepare_rename` → `mcp_lsp_rename`
- **模式转换**: `mcp_ast_grep_replace(dryRun=true)` 预览 → 执行
- **结构变更**: Edit 工具精确修改

### 执行后验证（强制）

```
1. mcp_lsp_diagnostics — 必须干净或与基线相同
2. 运行测试命令
3. 类型检查
```

### 失败恢复协议

如果任何验证失败：
1. **停止** — 立即
2. **回滚** — 撤销失败的变更
3. **诊断** — 分析出了什么问题
4. **决定** — 修复重试、跳过、或咨询 Oracle

**绝不在测试失败的情况下继续下一步。**

**将 phase-5 标记为 completed。**

---

# 阶段 6: 最终验证

**将 phase-6 标记为 in_progress。**

1. 完整测试套件
2. 类型检查
3. Lint 检查
4. 构建验证（如适用）
5. 所有变更文件的 lsp_diagnostics

### 生成摘要

```
## 重构完成

### 变更内容
- [变更列表]

### 验证结果
- 测试: 通过 (X/Y)
- 类型检查: 干净
- 构建: 成功

### 无回归检测
所有现有测试通过。未引入新错误。
```

**将 phase-6 标记为 completed。**

---

# 关键规则

## 绝不
- 跳过 lsp_diagnostics 检查
- 在测试失败时继续
- 使用 `as any`、`@ts-ignore`、`@ts-expect-error`
- 删除测试使其通过
- 不理解现有模式就重构

## 始终
- 先理解再修改
- 先预览再应用 (ast_grep dryRun=true)
- 每次变更后验证
- 遵循现有代码库模式
- 实时更新 todos
- 发现问题立即报告

## 中止条件
- 目标代码测试覆盖为零
- 变更将破坏公共 API
- 3 次连续验证失败

---

## 用户的请求

$ARGUMENTS

---

**安全重构开始...**
