---
name: session
description: |
  会话管理命令 - 保存、恢复和管理工作会话。
  支持跨会话断点续传，保留 TODO 状态和上下文。
  
  ⚡ v2.2.2: 集成 MCP 工具，自动读取 Claude Code 原生会话历史！

  子命令：
  - save [name]   保存当前会话（增强功能）
  - list          列出所有会话（原生 + 自定义）
  - resume [id]   恢复指定会话
  - info [id]     查看会话详情
  - delete [id]   删除会话
  - search [query] 搜索会话内容

  别名：/会话, /ses
aliases:
  - /会话
  - /ses
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - TodoRead
  - TodoWrite
  - mcp_session_list
  - mcp_session_read
  - mcp_session_search
  - mcp_session_info
model: sonnet
---

<command-name>/session</command-name>

# 会话管理器

跨会话保存和恢复工作进度，实现断点续传。

## 核心理念

> 工欲善其事，必先利其器。
> 会话管理让长任务不再因中断而丢失进度。

## ⚡ 重要更新 (v2.2.2)

**现在 `/session list` 会自动读取 Claude Code 原生会话历史！**

- 使用 MCP 内置工具 `mcp_session_list` 读取 `~/.claude/transcripts/` 数据
- 无需手动保存，自动有历史记录
- 保留 `/session save` 作为增强功能（添加 TODO 快照和上下文摘要）

## 命令解析

根据 `$ARGUMENTS` 执行对应操作：

| 参数 | 操作 |
|------|------|
| `save [name]` | 保存当前会话（增强：含 TODO 和上下文） |
| `list` | 列出所有会话（原生 + 自定义） |
| `resume [id]` | 恢复指定会话 |
| `info [id]` | 查看会话详情 |
| `delete [id]` | 删除指定会话 |
| `search [query]` | 🆕 搜索会话内容 |
| (空) | 显示帮助 |

---

## 操作流程

### 1. /session save [name]

**保存当前会话状态（增强功能）**

> 💡 注意：Claude Code 会自动保存对话历史到 `~/.claude/transcripts/`。
> `/session save` 是**增强功能**，额外保存 TODO 状态和上下文摘要，方便恢复时快速了解进度。

执行步骤：

1. **收集当前 TODO 状态**
   - 使用 TodoRead 获取所有任务
   - 记录完成/进行中/待办数量

2. **生成会话 ID**
   ```
   ses_{timestamp}_{random4}
   例: ses_1706012345_a1b2
   ```

3. **收集上下文摘要**
   - 当前项目路径
   - 已使用的 Agent 列表
   - 关键决策点
   - 当前进度百分比

4. **写入会话文件**
   ```bash
   # 确保目录存在
   mkdir -p ~/.oh-my-claude/sessions
   ```

5. **更新索引**
   - 读取 `~/.oh-my-claude/sessions/index.json`
   - 添加新会话条目
   - 写回索引文件

**输出格式**：
```text
💾 会话已保存
═══════════════════════════════════════════════════

📋 会话信息:
   ID: ses_1706012345_a1b2
   名称: $NAME
   保存时间: 2026-01-23 14:30:00

📊 进度快照:
   ████████████░░░░░░░░░░░░ 40% (4/10)

   ✅ 已完成: 4 项
   🔄 进行中: 1 项
   ⏳ 待完成: 5 项

💡 恢复命令: /session resume ses_1706012345_a1b2

═══════════════════════════════════════════════════
```

---

### 2. /session list

**列出所有可恢复会话**

执行步骤：

1. **首先调用 MCP 工具获取 Claude 原生会话**
   ```
   调用 mcp_session_list(limit=10) 获取最近 10 个原生会话
   ```

2. **然后读取 oh-my-claude 自定义会话**（如有）
   - 读取 `~/.oh-my-claude/sessions/index.json`

3. **合并显示，原生会话优先**

**输出格式**：
```text
📂 会话历史
═══════════════════════════════════════════════════

🔵 Claude Code 原生会话 (自动记录):
────────────────────────────────────────────────────
Session ID                       消息数  日期        Agents
ses_3f803d400ffeqQhnIgcXJCicub   221     2026-01-29  sisyphus, compaction
ses_402f9b282ffeAeJFapgAfmdyWG   83      2026-01-27  sisyphus, compaction
ses_406f114ceffed43sk6bd2qCKqR   225     2026-01-26  sisyphus, compaction

💡 使用 /session info ses_xxx 查看详情
💡 使用 /session search "关键词" 搜索内容

🟢 oh-my-claude 增强会话 (手动保存):
────────────────────────────────────────────────────
序号  ID                    名称              进度    保存时间
[1]   ses_1706012345_a1b2   重构认证模块       40%     2小时前

💡 使用 /session resume [序号或ID] 恢复增强会话

═══════════════════════════════════════════════════
```

**无自定义会话时**：
```text
📂 会话历史
═══════════════════════════════════════════════════

🔵 Claude Code 原生会话 (自动记录):
────────────────────────────────────────────────────
[显示 mcp_session_list 结果]

💡 使用 /session info ses_xxx 查看详情
💡 使用 /session search "关键词" 搜索内容

🟢 oh-my-claude 增强会话:
────────────────────────────────────────────────────
😴 暂无增强会话

💡 使用 /session save "任务名称" 保存当前 TODO 和上下文

═══════════════════════════════════════════════════
```

---

### 3. /session resume [id]

**恢复指定会话**

执行步骤：

1. **解析会话标识**
   - 支持序号: `1`, `2`, `3`
   - 支持完整 ID: `ses_1706012345_a1b2`
   - 支持部分 ID: `a1b2`

2. **读取会话文件**
   ```
   ~/.oh-my-claude/sessions/{session_id}.json
   ```

3. **恢复 TODO 状态**
   - 使用 TodoWrite 写入保存的任务列表
   - 保持原有状态 (completed/in_progress/pending)

4. **注入上下文摘要**
   - 显示关键决策和进度
   - 提示当前任务

**输出格式**：
```text
🔄 会话恢复中...
═══════════════════════════════════════════════════

📋 会话: 重构认证模块
   保存于: 2026-01-23 14:30:00 (2小时前)

📊 恢复的进度:
   ████████████░░░░░░░░░░░░ 40% (4/10)

✅ 已完成任务:
   • 分析现有认证代码
   • 设计新认证架构
   • 实现 JWT 生成
   • 实现 Token 验证

🔄 当前任务:
   • 实现刷新 Token 机制

⏳ 待完成任务:
   • 实现登出功能
   • 添加单元测试
   • 集成测试
   • 更新 API 文档
   • 代码审查

📝 上下文摘要:
   采用 JWT + Refresh Token 方案，使用 Redis 存储会话。
   当前正在实现 Token 刷新逻辑。

═══════════════════════════════════════════════════
✅ 会话已恢复！可以继续工作。
💡 使用 /yishan 继续愚公移山模式
```

---

### 4. /session info [id]

**查看会话详细信息**

执行步骤：

1. **判断会话类型**
   - 如果 ID 以 `ses_` 开头且长度 > 20 字符 → Claude 原生会话
   - 如果 ID 是短格式或序号 → oh-my-claude 增强会话

2. **原生会话（Claude Code 自动记录）**
   ```
   调用 mcp_session_info(session_id="ses_xxx") 获取元数据
   调用 mcp_session_read(session_id="ses_xxx", limit=5) 获取最近消息预览
   ```

3. **增强会话（oh-my-claude 保存）**
   - 读取 `~/.oh-my-claude/sessions/{session_id}.json`

**原生会话输出格式**：
```text
📋 会话详情 (Claude Code 原生)
═══════════════════════════════════════════════════

🏷️ 基本信息:
   Session ID: ses_3f803d400ffeqQhnIgcXJCicub
   消息数量: 221
   时间范围: 2026-01-29 10:30:00 ~ 15:45:30
   使用的 Agent: sisyphus, compaction

📝 最近消息预览:
   [user] 修复 /session 命令问题...
   [assistant] 我来检查 session 命令的实现...
   ...

═══════════════════════════════════════════════════
💡 使用 /session search "关键词" 在此会话中搜索
```

**增强会话输出格式**：
```text
📋 会话详情 (oh-my-claude 增强)
═══════════════════════════════════════════════════

🏷️ 基本信息:
   ID: ses_1706012345_a1b2
   名称: 重构认证模块
   创建时间: 2026-01-23 12:00:00
   更新时间: 2026-01-23 14:30:00
   项目路径: /projects/my-app

📊 进度统计:
   总任务数: 10
   已完成: 4 (40%)
   进行中: 1 (10%)
   待完成: 5 (50%)

🎭 使用的 Agent:
   • 悟空 (探索) - 3次
   • 诸葛 (设计) - 2次
   • 鲁班 (实现) - 5次

📝 关键决策:
   • 采用 JWT + Refresh Token 方案
   • 使用 Redis 存储会话
   • Token 有效期 15 分钟

🔧 最后操作:
   实现 JWT Token 验证中间件

═══════════════════════════════════════════════════
💡 使用 /session resume ses_1706012345_a1b2 恢复此会话
```

---

### 5. /session search [query]

**🆕 搜索会话内容**

执行步骤：

1. **调用 MCP 搜索工具**
   ```
   调用 mcp_session_search(query="关键词", limit=20)
   ```

2. **显示搜索结果**

**输出格式**：
```text
🔍 搜索结果: "认证"
═══════════════════════════════════════════════════

找到 3 个匹配项:

[ses_3f803d400ffe...] 消息 msg_001 (user)
   ...实现 JWT **认证**模块...

[ses_3f803d400ffe...] 消息 msg_005 (assistant)
   ...我来设计**认证**流程架构...

[ses_402f9b282ffe...] 消息 msg_012 (user)
   ...OAuth **认证**集成...

═══════════════════════════════════════════════════
💡 使用 /session info ses_xxx 查看会话详情
```

---

### 6. /session delete [id]

**删除指定会话**

> ⚠️ 注意：只能删除 oh-my-claude 增强会话。Claude Code 原生会话由系统管理，不支持删除。

执行步骤：

1. 解析会话标识
2. 确认是增强会话（原生会话拒绝删除）
3. 确认删除（显示会话名称）
4. 删除会话文件
5. 更新索引

**输出格式**：
```text
🗑️ 会话已删除
═══════════════════════════════════════════════════

已删除会话: 重构认证模块 (ses_1706012345_a1b2)

═══════════════════════════════════════════════════
```

**尝试删除原生会话时**：
```text
⚠️ 无法删除
═══════════════════════════════════════════════════

ses_3f803d400ffeqQhnIgcXJCicub 是 Claude Code 原生会话，
由系统自动管理，不支持手动删除。

💡 如需清理，请查看 ~/.claude/transcripts/ 目录

═══════════════════════════════════════════════════
```

---

## 数据结构

### 索引文件 (~/.oh-my-claude/sessions/index.json)

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

### 会话文件 (~/.oh-my-claude/sessions/{id}.json)

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
    {"content": "分析现有认证代码", "status": "completed", "activeForm": "分析认证代码"},
    {"content": "设计新认证架构", "status": "completed", "activeForm": "设计认证架构"},
    {"content": "实现 JWT 生成", "status": "completed", "activeForm": "实现JWT生成"},
    {"content": "实现 Token 验证", "status": "completed", "activeForm": "实现Token验证"},
    {"content": "实现刷新 Token 机制", "status": "in_progress", "activeForm": "实现刷新Token"},
    {"content": "实现登出功能", "status": "pending", "activeForm": "实现登出功能"},
    {"content": "添加单元测试", "status": "pending", "activeForm": "添加单元测试"},
    {"content": "集成测试", "status": "pending", "activeForm": "集成测试"},
    {"content": "更新 API 文档", "status": "pending", "activeForm": "更新API文档"},
    {"content": "代码审查", "status": "pending", "activeForm": "代码审查"}
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

---

## 帮助信息

当 `$ARGUMENTS` 为空或为 `help` 时显示：

```text
📖 会话管理命令 (v2.2.2 集成 MCP 工具)
═══════════════════════════════════════════════════

用法: /session <子命令> [参数]

子命令:
  list           列出所有会话 (原生 + 增强)
                 🆕 自动读取 Claude Code 原生会话历史！
                 例: /session list

  info [id]      查看会话详细信息
                 支持原生会话 ID 和增强会话 ID
                 例: /session info ses_3f803d400ffe...
                 例: /session info 1

  search [query] 🆕 搜索会话内容
                 例: /session search "认证"
                 例: /session search "JWT token"

  save [name]    保存当前会话 (增强功能)
                 额外保存 TODO 状态和上下文摘要
                 例: /session save "重构认证模块"

  resume [id]    恢复增强会话
                 支持序号或ID
                 例: /session resume 1
                 例: /session resume ses_1706012345_a1b2

  delete [id]    删除增强会话
                 注意：不能删除原生会话
                 例: /session delete 1

═══════════════════════════════════════════════════
💡 提示: Claude Code 自动记录对话历史，无需手动保存
💡 提示: /session save 用于添加 TODO 快照等增强信息
```

---

## 执行规则

1. **优先使用 MCP 工具** - list/info/search 使用 mcp_session_* 工具
2. **自动收集上下文** - 保存时自动收集当前任务和决策
3. **保持 TODO 状态** - 恢复时完整还原任务状态
4. **友好的时间显示** - 使用相对时间（2小时前、昨天）
5. **支持多种标识方式** - 序号、完整ID、部分ID
6. **Windows 兼容** - 使用 `$HOME` 路径变量

## MCP 工具使用说明

执行 `/session list` 时：
```
1. 调用 mcp_session_list(limit=10) 获取原生会话
2. 读取 ~/.oh-my-claude/sessions/index.json 获取增强会话
3. 合并显示
```

执行 `/session info ses_xxx` 时：
```
1. 如果是长 ID (>20字符) → 调用 mcp_session_info(session_id="ses_xxx")
2. 如果是短 ID 或序号 → 读取 ~/.oh-my-claude/sessions/{id}.json
```

执行 `/session search "关键词"` 时：
```
调用 mcp_session_search(query="关键词", limit=20)
```

## 现在执行

根据 `$ARGUMENTS` 的内容，执行对应的操作流程。

$ARGUMENTS
