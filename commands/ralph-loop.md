---
name: ralph-loop
description: |
  Ralph Loop 命令 - 自引用开发循环，持续运行直到任务完成。
  灵感来自 Anthropic 的 Ralph Wiggum 插件。
  别名：/ralph, /loop
---

# 🔄 Ralph Loop 模式已激活！

你已进入 **Ralph Loop** 自引用开发循环模式。这是一个持续运行直到任务完成的循环机制。

## ⚠️ 首要步骤：激活循环

**立即执行**：使用 Write 工具创建状态文件来激活循环机制。

```
Write(
  filePath=".claude/ralph-loop.local.md",
  content="---\niteration: 1\nmax_iterations: 100\ncompletion_promise: DONE\n---\n\n[用户任务]\n$ARGUMENTS\n"
)
```

这个状态文件会让 Stop Hook 阻止你停止，直到任务完成。

## 工作原理

1. 你将持续工作在任务上
2. 当你认为任务**完全**完成时，输出: `<promise>DONE</promise>`
3. 系统会自动检测完成承诺并结束循环
4. 如果你在没有完成承诺的情况下停止，系统会自动让你继续

## 循环控制

### 继续条件
- TODO 列表中有未完成项
- 没有检测到完成承诺 `<promise>DONE</promise>`
- 未达到最大迭代次数（默认 100）

### 结束条件
- 检测到完成承诺 `<promise>DONE</promise>`
- 达到最大迭代次数
- 用户使用 `/cancel-ralph` 取消

## 执行规则

### 1. TODO 强制执行
- 必须使用 TodoWrite 分解任务
- 完成一个就标记一个
- TODO 未全部完成前不能声明完成

### 2. 验证保证
- 没有证据 = 没有完成
- 运行测试/构建，展示输出
- 描述你验证了什么

### 3. 完成时
当所有任务完成后：

```bash
# 1. 删除状态文件
Bash(command="rm .claude/ralph-loop.local.md")

# 2. 输出完成标记
```

然后输出：

```
<promise>DONE</promise>
```

## 用户的任务

$ARGUMENTS

---

## 开始执行

现在我将：

1. **激活循环** - 创建 `.claude/ralph-loop.local.md` 状态文件
2. **分析任务** - 理解你想要什么
3. **分解任务** - 使用 TodoWrite 创建详细任务列表
4. **执行任务** - 逐个完成子任务
5. **验证结果** - 运行测试/构建确保可用
6. **自检确认** - 确保所有 TODO 完成
7. **完成循环** - 删除状态文件并输出 `<promise>DONE</promise>`

**Ralph Loop：持续工作直到完成。**
