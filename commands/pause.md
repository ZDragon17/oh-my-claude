---
name: pause
description: 安全暂停当前任务 - 保存进度，稍后可恢复
aliases:
  - /暂停
  - /yishan-pause
allowed-tools:
  - Write
  - TodoRead
model: haiku
---

<command-name>/pause</command-name>

# 任务安全暂停

安全暂停当前的愚公移山任务，保存进度以便后续恢复。

## 职责

1. 保存当前 TODO 状态
2. 记录执行上下文
3. 创建检查点文件
4. 提供恢复指引

## 暂停流程

1. **检查当前状态**
   - 确认是否有活跃的愚公移山任务
   - 获取当前 TODO 列表

2. **保存检查点**
   - 保存到 `~/.oh-my-claude/yishan-checkpoint.json`
   - 包含：任务描述、TODO 状态、参与 Agent、时间戳

3. **输出确认**

```text
⏸️ 愚公移山 - 已安全暂停

📊 进度快照:
   ═══════════════════════════════════════
   任务: [任务描述]
   进度: ████████████░░░░░░░░░░░░ 40% (4/10)

   ✅ 已完成: 4 项
   🔄 进行中: 1 项 (实现用户登录)
   ⏳ 待完成: 5 项
   ═══════════════════════════════════════

💾 检查点已保存
   位置: ~/.oh-my-claude/yishan-checkpoint.json
   时间: [当前时间]

🔄 恢复方式:
   • /yishan-resume - 从此处继续
   • /yishan [新任务] - 开始新任务

💡 提示: 检查点会保留 7 天，之后自动清理
```

## 检查点数据结构

**重要**: 使用统一的检查点格式，与 `/interrupt` 保持一致。

```json
{
  "version": "1.0",
  "type": "pause",
  "timestamp": "2025-01-21T10:30:00Z",
  "task": {
    "description": "重构认证模块",
    "started_at": "2025-01-21T10:00:00Z"
  },
  "todos": [
    {"content": "探索代码结构", "status": "completed", "activeForm": "探索代码结构"},
    {"content": "设计实现方案", "status": "completed", "activeForm": "设计实现方案"},
    {"content": "实现用户登录", "status": "in_progress", "activeForm": "实现用户登录"},
    {"content": "添加单元测试", "status": "pending", "activeForm": "添加单元测试"}
  ],
  "progress": {
    "completed": 2,
    "in_progress": "实现用户登录",
    "pending": 1,
    "total": 4,
    "percent": 50
  },
  "agents_used": ["wukong", "zhuge", "luban"],
  "current_agent": "luban",
  "context_summary": "已完成代码探索和方案设计，正在实现登录功能",
  "status": "paused"
}
```

**字段说明**:

- `type`: 检查点类型，`pause` 或 `interrupt`
- `progress`: 进度对象，便于恢复时快速显示
- `status`: 当前状态，`paused`、`interrupted`、`resumed`

## 无任务时

如果没有活跃任务：

```text
ℹ️ 当前没有活跃的愚公移山任务

💡 提示:
   • /yishan [任务] - 启动新任务
   • /yishan-resume - 恢复之前的任务（如有）
```

## 响应要求

1. **确保数据保存** - 暂停必须成功保存状态
2. **清晰的恢复路径** - 明确告知如何继续
3. **友好的确认** - 让用户安心任务不会丢失
