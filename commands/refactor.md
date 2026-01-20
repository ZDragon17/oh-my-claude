---
name: refactor
description: |
  重构命令 - 安全、系统化的代码重构模板。
  支持重命名、提取、移动等重构操作，带并行分析和验证。
  别名：/rf, /restructure
---

# 🔧 重构模式

你正在执行 **安全重构** 模式。这是一个系统化的代码重构流程，确保重构安全可靠。

## 重构原则

### 安全第一

1. **先理解，后重构** - 不要盲目重构
2. **小步前进** - 每次只做一个小改动
3. **持续验证** - 每步都运行测试
4. **保持功能** - 重构不改变行为

### 黄金规则

> **Bug 修复时不要重构，重构时不要修复 Bug**

---

## 重构类型

### 1. 重命名 (Rename)

**目标**: 改善命名，提高可读性

```
# 阶段 1: 找到所有出现位置
background_task(
  agent="explore",
  prompt="找到 [TARGET] 的所有定义和使用位置。
  报告: 文件路径、行号、使用模式。"
)

# 阶段 2: 找到依赖
background_task(
  agent="explore", 
  prompt="找到所有导入、使用或依赖 [TARGET] 的代码。
  报告: 依赖链、导入图。"
)

# 阶段 3: 执行重命名
使用 LSP rename 或全局搜索替换

# 阶段 4: 验证
lsp_diagnostics 检查
运行测试
```

### 2. 提取 (Extract)

**目标**: 提取函数、类、模块

```
# 提取函数
1. 识别要提取的代码块
2. 确定输入参数和返回值
3. 创建新函数
4. 替换原代码为函数调用
5. 验证行为不变

# 提取类/模块
1. 识别相关的功能集
2. 设计新类/模块接口
3. 移动代码
4. 更新导入
5. 验证
```

### 3. 移动 (Move)

**目标**: 改善代码组织

```
# 阶段 1: 分析依赖
background_task(
  agent="explore",
  prompt="分析 [TARGET] 的所有依赖和被依赖关系。
  确定移动的影响范围。"
)

# 阶段 2: 执行移动
1. 在新位置创建代码
2. 更新所有导入路径
3. 删除旧位置代码
4. 验证
```

### 4. 简化 (Simplify)

**目标**: 减少复杂度

```
# 召唤老子进行简化
Task(
  subagent_type="general",
  prompt="作为老子（简洁之道），请简化以下代码：
  - 消除重复
  - 简化条件
  - 减少嵌套
  - 提高可读性
  
  文件: [FILE]
  范围: [RANGE]"
)
```

---

## 并行分析模板

对于大型重构，使用并行 Agent 分析：

```
# Agent 1: 找到重构目标
background_task(
  agent="explore",
  prompt="找到 [TARGET] 的所有出现位置和定义。
  报告: 文件路径、行号、使用模式。"
)

# Agent 2: 找到相关代码
background_task(
  agent="explore", 
  prompt="找到所有导入、使用或依赖 [TARGET] 的代码。
  报告: 依赖链、导入图。"
)

# Agent 3: 找到类似模式
background_task(
  agent="explore",
  prompt="找到代码库中与 [TARGET] 类似的模式。
  报告: 相似代码、可能的统一机会。"
)

# Agent 4: 检查测试覆盖
background_task(
  agent="explore",
  prompt="找到覆盖 [TARGET] 的测试。
  报告: 测试文件、测试用例、覆盖范围。"
)
```

---

## 验证清单

每次重构后验证：

```
□ lsp_diagnostics 无新错误
□ 所有测试通过
□ 行为没有改变
□ 代码质量提升
□ 没有引入新的依赖问题
```

---

## 常见重构场景

| 场景 | 建议操作 |
|------|----------|
| 函数太长 | 提取子函数 |
| 重复代码 | 提取公共函数/组件 |
| 命名不清 | 重命名 |
| 文件太大 | 拆分模块 |
| 依赖混乱 | 重组导入、提取接口 |
| 嵌套太深 | 提前返回、提取函数 |
| 魔术数字 | 提取常量 |

---

## 使用示例

```bash
# 重命名
/refactor rename getUserById -> findUserById

# 提取函数
/refactor extract calculateTotal from OrderService.processOrder

# 移动
/refactor move utils/helpers.ts -> lib/helpers/

# 简化
/refactor simplify src/components/Dashboard.tsx
```

## 用户的请求

$ARGUMENTS

---

## 开始重构

现在我将：

1. **分析目标** - 理解要重构什么
2. **并行探索** - 找到所有相关代码
3. **评估影响** - 确定重构范围
4. **制定计划** - 创建重构步骤
5. **执行重构** - 小步安全重构
6. **验证结果** - 确保没有破坏

**安全重构开始...**
