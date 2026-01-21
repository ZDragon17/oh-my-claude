---
name: interrupt
description: 紧急任务插入 - 暂停当前任务，处理紧急事项，完成后自动提示恢复
aliases:
  - /紧急
  - /urgent
  - /插入
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - TodoWrite
  - TodoRead
model: sonnet
---

<command-name>/interrupt</command-name>

# 紧急任务插入

当用户在执行愚公移山任务时遇到紧急事项，使用此命令可以：

1. 安全暂停当前任务
2. 处理紧急任务
3. 完成后自动提示恢复

## 使用方式

```bash
/interrupt [紧急任务描述]
```

## 执行流程（严格按步骤执行）

### 步骤 1: 检测并收集当前状态

首先，**必须执行以下操作**：

1. 读取当前 TODO 列表状态（使用 TodoRead）
2. 收集以下信息：
   - `completed_count`: 已完成的任务数量
   - `in_progress_item`: 当前正在进行的任务内容
   - `pending_count`: 待完成的任务数量
   - `total_count`: 任务总数
   - `context_summary`: 当前工作的简要总结

### 步骤 2: 保存状态到检查点文件

**必须使用 Write 工具**将状态保存到 `~/.oh-my-claude/yishan-checkpoint.json`：

```json
{
  "version": "1.0",
  "type": "interrupt",
  "timestamp": "[当前 ISO 时间]",
  "interrupt_id": "int_[时间戳]",
  "task": {
    "description": "[从 TODO 列表推断的主任务]",
    "started_at": "[如有记录]"
  },
  "todos": [
    // 从 TodoRead 获取的完整 TODO 列表
  ],
  "progress": {
    "completed": [completed_count],
    "in_progress": "[in_progress_item]",
    "pending": [pending_count],
    "total": [total_count],
    "percent": [百分比]
  },
  "context_summary": "[context_summary]",
  "urgent_task": "[用户描述的紧急任务]",
  "status": "interrupted"
}
```

同时保存到 `~/.oh-my-claude/interrupt-state.json` 记录中断信息。

### 步骤 3: 显示暂停确认

保存成功后显示：

```text
⏸️ 当前任务已暂停
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 进度快照: ████████████░░░░░░░░░░░░ [percent]% ([completed]/[total])
🔄 暂停于: [in_progress_item]
💾 已保存到: ~/.oh-my-claude/yishan-checkpoint.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 开始处理紧急任务...
```

### 步骤 4: 处理紧急任务

切换到紧急任务模式：

```text
🆘 紧急任务模式
═══════════════════════════════════════════════════

📋 任务: [用户描述的紧急任务]
⏱️ 开始: [当前时间]

💡 提示:
   • 专注处理此紧急任务
   • 完成后输入 /done 或描述已完成
   • 如需取消紧急任务: /cancel-interrupt

═══════════════════════════════════════════════════
```

### 步骤 5: 紧急任务完成后

当检测到用户表示任务完成（"完成了"、"好了"、"done"等），**必须读取检查点文件**然后显示恢复提示：

```text
✅ 紧急任务已完成！
═══════════════════════════════════════════════════

📋 处理的紧急任务: [任务描述]
⏱️ 耗时: [X] 分钟

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📂 之前暂停的任务:
   📋 任务: [原任务描述]
   📊 进度: 40% (4/10)
   🔄 暂停于: [暂停的任务项]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 是否恢复之前的任务？

   [1] /yishan-resume - 继续之前的任务
   [2] /yishan [新任务] - 开始新任务
   [3] 稍后再说 - 保持暂停状态

═══════════════════════════════════════════════════
```

## 紧急任务状态文件

保存到 `~/.oh-my-claude/interrupt-state.json`：

```json
{
  "interrupt_id": "int_[timestamp]",
  "started_at": "[ISO时间]",
  "urgent_task": "[紧急任务描述]",
  "paused_task": {
    "checkpoint_path": "~/.oh-my-claude/yishan-checkpoint.json",
    "progress_percent": 40,
    "current_item": "[暂停的任务项]"
  },
  "status": "in_progress"
}
```

## 特殊场景处理

### 无活跃任务时

```text
ℹ️ 当前没有活跃的愚公移山任务

直接处理你的任务即可，无需使用 /interrupt。

💡 或者你可以:
   • /yishan [任务描述] - 启动持续执行模式
   • 直接描述任务，我来帮你处理
```

### 紧急任务中再次 /interrupt

```text
⚠️ 已经在紧急任务模式中

当前紧急任务: [任务描述]

选择操作:
   [1] 继续当前紧急任务
   [2] 取消当前紧急任务，处理新的紧急事项
   [3] 完成当前紧急任务: /done
```

## 相关命令

| 命令                  | 功能                       |
| --------------------- | -------------------------- |
| `/interrupt [任务]`   | 插入紧急任务               |
| `/done`               | 标记紧急任务完成           |
| `/cancel-interrupt`   | 取消紧急任务，恢复原任务   |
| `/yishan-resume`      | 恢复之前的任务             |

## 响应要求

1. **快速响应** - 紧急任务需要立即处理
2. **状态保存** - 确保原任务进度不丢失
3. **清晰反馈** - 让用户知道当前状态
4. **主动提醒** - 完成后主动提示恢复选项
