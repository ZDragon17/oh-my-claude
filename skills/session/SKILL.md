---
name: session
description: |
  会话持久化与恢复技能 - 跨会话保存和恢复工作进度，实现断点续传。
  支持保存 TODO 状态、上下文摘要、关键决策等信息。
---

# 会话持久化与恢复 (Session Persistence)

跨会话保存和恢复工作进度，实现断点续传。

## 核心理念

> 工欲善其事，必先利其器。
> 会话管理让长任务不再因中断而丢失进度。

## 功能概述

### 1. 会话保存 (/session save)

保存当前工作状态，包括：
- TODO 任务列表及状态
- 上下文摘要
- 关键技术决策
- 使用的 Agent 记录
- 当前进度百分比

### 2. 会话列表 (/session list)

列出所有可恢复的会话：
- 按时间倒序排列
- 显示进度百分比
- 相对时间显示（如"2小时前"）

### 3. 会话恢复 (/session resume)

恢复指定会话：
- 恢复 TODO 列表
- 注入上下文摘要
- 显示恢复状态概览

### 4. 会话详情 (/session info)

查看会话详细信息：
- 基本信息（ID、名称、时间）
- 进度统计
- Agent 使用记录
- 关键决策列表

### 5. 会话删除 (/session delete)

删除不再需要的会话：
- 确认删除
- 清理存储文件

## 数据存储

### 存储位置

```
~/.oh-my-claude/sessions/
├── index.json              # 会话索引
├── ses_xxx_a1b2.json       # 会话详情文件
├── ses_xxx_c3d4.json
└── ...
```

### 索引文件结构

```json
{
  "version": "1.0",
  "sessions": [
    {
      "id": "ses_1706012345_a1b2",
      "name": "重构认证模块",
      "createdAt": "2026-01-23T12:00:00Z",
      "updatedAt": "2026-01-23T14:30:00Z",
      "projectPath": "/projects/my-app",
      "progress": 40,
      "status": "paused"
    }
  ]
}
```

### 会话文件结构

```json
{
  "id": "ses_1706012345_a1b2",
  "name": "重构认证模块",
  "metadata": {
    "createdAt": "2026-01-23T12:00:00Z",
    "updatedAt": "2026-01-23T14:30:00Z",
    "projectPath": "/projects/my-app",
    "agentsUsed": [
      {"name": "wukong", "count": 3},
      {"name": "zhuge", "count": 2},
      {"name": "luban", "count": 5}
    ]
  },
  "todos": [
    {
      "content": "分析现有认证代码",
      "status": "completed",
      "activeForm": "分析认证代码"
    },
    {
      "content": "实现刷新 Token 机制",
      "status": "in_progress",
      "activeForm": "实现刷新Token"
    }
  ],
  "context": {
    "summary": "正在重构认证模块，采用 JWT + Refresh Token 方案",
    "keyDecisions": [
      "采用 JWT + Refresh Token 方案",
      "使用 Redis 存储会话",
      "Token 有效期 15 分钟"
    ],
    "currentTask": "实现刷新 Token 机制",
    "blockers": []
  }
}
```

## 会话 ID 生成规则

```
格式: ses_{timestamp}_{random4}
示例: ses_1706012345_a1b2

timestamp: Unix 时间戳（秒）
random4: 4 位随机字母数字
```

## 进度条生成

```
宽度: 24 字符
满格: █
空格: ░

示例:
████████████░░░░░░░░░░░░ 50% (5/10)
```

## 时间显示

使用相对时间，更友好：

| 时间差 | 显示 |
|--------|------|
| < 1分钟 | 刚刚 |
| < 1小时 | N分钟前 |
| < 24小时 | N小时前 |
| < 7天 | 昨天/N天前 |
| ≥ 7天 | 具体日期 |

## 使用示例

### 保存会话

```bash
# 命名保存
/session save "重构认证模块"

# 快速保存（自动生成名称）
/session save
```

### 列出会话

```bash
/session list

# 输出：
# 📂 已保存的会话
# ═══════════════════════════════════════════════════
#
# 序号  ID                    名称              进度    保存时间
# ────  ────────────────────  ────────────────  ──────  ──────────────
# [1]   ses_1706012345_a1b2   重构认证模块       40%     2小时前
# [2]   ses_1706011234_c3d4   API文档编写        100%    昨天
```

### 恢复会话

```bash
# 通过序号恢复
/session resume 1

# 通过完整 ID 恢复
/session resume ses_1706012345_a1b2

# 通过部分 ID 恢复
/session resume a1b2
```

### 查看详情

```bash
/session info 1
```

### 删除会话

```bash
/session delete 1
```

## 最佳实践

### 1. 定期保存

在重要节点保存会话：
- 完成阶段性任务后
- 做出关键技术决策后
- 即将离开工作前

### 2. 命名规范

使用有意义的名称：
- ✅ "重构认证模块"
- ✅ "修复订单Bug-#123"
- ❌ "test"
- ❌ "111"

### 3. 定期清理

删除不再需要的会话：
- 已完成的任务
- 已废弃的方案
- 过期的探索

### 4. 配合愚公移山

在 `/yishan` 执行前保存：

```bash
/session save "开始重构前"
/yishan 开始重构认证模块
```

执行中途需要暂停：

```bash
# 使用 /pause 暂停（自动保存）
/pause

# 稍后恢复
/session resume 1
/yishan-resume
```

## 与其他技能集成

### 与 TodoWrite 集成

- 保存时自动读取 TODO 状态
- 恢复时自动写入 TODO 列表

### 与上下文管理集成

- 保存时记录上下文摘要
- 恢复时注入关键上下文

### 与愚公移山集成

- `/pause` 命令自动触发会话保存
- `/yishan-resume` 从会话恢复后继续

## 跨平台兼容

- 使用 `~/.oh-my-claude/` 作为存储目录
- Windows 上自动展开为 `$HOME/.oh-my-claude/`
- 路径使用正斜杠 `/`
