---
name: yishan
description: |
  愚公移山循环技能 - 实现类似 Ralph Wiggum 的自主持续执行机制。
  当 Claude 想停止时，Stop Hook 检查任务是否完成，未完成则自动继续。
---

# 愚公移山循环 (Yishan Loop)

基于 Claude Code Stop Hook 机制实现的自主持续执行系统。

## 核心概念

### 问题背景

默认情况下，Claude 会在给出建议或完成一个步骤后等待用户确认才继续。这种模式虽然安全，但对于复杂任务效率较低。

### 解决方案

愚公移山循环通过 Stop Hook 拦截 Claude 的停止行为：

1. 当 Claude 尝试停止时，Stop Hook 被触发
2. Hook 检查状态文件判断是否有活跃的循环
3. 如果有循环且未完成，阻止停止并重新注入任务 prompt
4. Claude 继续工作，直到检测到完成标记

## 工作流程

```
用户发起任务 → Claude 创建状态文件 → 开始工作
       ↓
    工作完成?
       ↓
   ┌───┴───┐
   是      否
   ↓       ↓
输出完成  Stop Hook
标记      阻止退出
   ↓       ↓
循环结束  重新注入
          prompt
           ↓
        继续工作
```

## 组件说明

### 1. 状态文件

路径: `.claude/yishan-loop.local.md`

```markdown
---
iteration: 1           # 当前迭代次数
max_iterations: 50     # 最大迭代次数 (0 = 无限制)
completion_promise: "移山完毕"  # 完成标记文本
---

<原始任务描述>
```

### 2. Stop Hook

文件: `hooks/yishan-stop-hook.sh` (Bash) / `hooks/yishan-stop-hook.ps1` (PowerShell)

功能:
- 检查状态文件是否存在
- 验证迭代次数未超限
- 从 transcript 读取 Claude 最后输出
- 检测完成标记 `<promise>...</promise>`
- 未完成时返回 JSON 阻止退出

### 3. 完成标记

格式: `<promise>完成标记文本</promise>`

示例:
```
任务已全部完成！

<promise>移山完毕</promise>
```

## 使用方法

### 启动循环

**方式 1: 使用命令**

```
/yishan 实现用户认证功能
```

Claude 会自动创建状态文件并开始工作。

**方式 2: 手动初始化**

```bash
./scripts/setup-yishan-loop.sh 50 "移山完毕"
```

然后向 Claude 发送任务描述。

### 取消循环

```
/cancel-yishan
```

或手动删除状态文件:
```bash
rm .claude/yishan-loop.local.md
```

## 配置选项

### max_iterations

最大迭代次数，防止无限循环。

- 默认值: 50
- 设为 0: 无限制（谨慎使用）
- 建议值: 20-100

### completion_promise

完成标记文本，Claude 必须精确匹配才能结束循环。

- 默认值: "移山完毕"
- 可自定义: "DONE", "任务完成", 等

## 安全机制

### 1. 迭代次数限制

防止失控循环消耗过多资源。

### 2. 精确匹配检测

完成标记必须精确匹配，防止误触发。

### 3. 状态文件验证

Hook 会验证状态文件格式，损坏时自动终止。

### 4. 错误恢复

任何解析错误都会安全终止循环。

## 与其他功能集成

### TodoWrite 集成

愚公循环强制要求使用 TodoWrite 跟踪进度：

1. 任务分解为具体 TODO 项
2. 逐个完成并标记
3. 所有项完成后才输出完成标记

### Agent 协作

可以在循环中召唤其他 Agent：

```
我需要 /luban 帮我实现前端组件
```

### 进度报告

每完成一个子任务，报告进度：

```
📊 移山进度：3 / 10
✅ 刚完成：实现登录 API
🔄 正在进行：添加认证中间件
⏳ 待处理：7 个
```

## 常见问题

### Q: 循环不启动？

检查:
1. hooks.json 是否正确配置
2. 状态文件是否正确创建
3. .claude 目录是否存在

### Q: 无法停止循环？

使用 `/cancel-yishan` 或删除状态文件。

### Q: 达到最大迭代次数？

循环会安全终止，可以用 `/yishan` 重新开始。

## 灵感来源

此功能灵感来自：
- Claude Code 官方 Ralph Wiggum 插件
- oh-my-opencode 的自主执行机制
- 中国古代愚公移山的坚持精神

正如愚公所言：
> "虽我之死，有子存焉；子又生孙，孙又生子...
> 子子孙孙无穷匮也，而山不加增，何苦而不平？"
