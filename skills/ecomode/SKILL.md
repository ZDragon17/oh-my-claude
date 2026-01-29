---
name: ecomode
description: |
  节俭模式 (Ecomode) - Token 高效的并行执行模式。
  优先使用 Haiku 和 Sonnet Agent，节省 30-50% Token 开销。
---

# 节俭模式 (Ecomode)

基于 oh-my-opencode 的 ecomode 机制，融入中国传统文化的节俭美德。

## 核心理念

> **一粥一饭，当思来之不易；半丝半缕，恒念物力维艰。** —— 《朱子家训》

节俭模式体现中国传统的节俭智慧：
- **物尽其用**：简单任务用简单模型
- **量入为出**：根据任务复杂度分配资源
- **勤俭持家**：在保证质量的前提下节省开销

---

## 关键词触发

| 关键词 | 说明 |
|--------|------|
| `ecomode` / `eco` | 英文触发词 |
| `jiejian` / `节俭` | 中文触发词 |
| `save-tokens` / `budget` | 描述性触发 |
| `efficient` / `高效` | 描述性触发 |

---

## 智能模型路由

### 核心原则

**默认使用低层级，仅在必要时升级。**

| 决策 | 规则 |
|------|------|
| 默认 | 使用 LOW 层级 (Haiku) |
| 升级 | 任务复杂度确实需要时用 MEDIUM (Sonnet) |
| 避免 | HIGH 层级 (Opus) - 仅规划/批评时用 |

### Agent 路由表

| 领域 | 首选 (Haiku) | 备选 (Sonnet) | 避免 (Opus) |
|------|-------------|---------------|-------------|
| **分析** | `zhuge-low` | `zhuge` | ~~`zhuge-high`~~ |
| **执行** | `luban-low` | `luban` | ~~`luban-high`~~ |
| **探索** | `wukong` | `wukong-medium` | ~~`wukong-high`~~ |
| **前端** | `gukaizhi-low` | `gukaizhi` | ~~`gukaizhi-high`~~ |
| **测试** | `baozheng-low` | `baozheng` | ~~`baozheng-high`~~ |
| **文档** | `simaqian` | - | - |
| **安全** | `mozi-low` | `mozi` | - |
| **数据库** | `cangjie-low` | `cangjie` | - |
| **调试** | `bianque-low` | `bianque` | - |

### 层级选择指南

| 任务复杂度 | 层级 | 示例 |
|-----------|------|------|
| 简单查询 | LOW | "这个函数返回什么？", "找到 X 的定义" |
| 标准工作 | LOW 先试，失败再 MEDIUM | "添加错误处理", "实现这个功能" |
| 复杂分析 | MEDIUM | "调试这个问题", "重构这个模块" |
| 仅规划 | HIGH (如必要) | "为新系统设计架构" |

### 路由示例

```javascript
// 简单问题 → LOW 层级 (默认)
Task(
  subagent_type: "oh-my-claude:zhuge-low",
  model: "haiku",
  prompt: "这个函数返回什么？"
)

// 标准实现 → 先试 LOW
Task(
  subagent_type: "oh-my-claude:luban-low",
  model: "haiku",
  prompt: "给登录表单添加验证"
)

// 如果 LOW 失败，升级到 MEDIUM
Task(
  subagent_type: "oh-my-claude:luban",
  model: "sonnet",
  prompt: "给登录添加错误处理"
)

// 文件查找 → 始终 LOW
Task(
  subagent_type: "oh-my-claude:wukong",
  model: "haiku",
  prompt: "找到 UserService 的定义位置"
)
```

---

## 委派强制规则 (关键)

**你是编排者，不是实现者。**

| 动作 | 你做 | 委派 |
|------|-----|------|
| 读取文件获取上下文 | ✓ | |
| 追踪进度 (TODO) | ✓ | |
| 生成并行 Agent | ✓ | |
| **任何代码变更** | ✗ 绝不 | luban-low/luban |
| **UI 工作** | ✗ 绝不 | gukaizhi-low/gukaizhi |
| **文档** | ✗ 绝不 | simaqian |

**路径例外**: 只能写入 `.omc/`, `.claude/`, `CLAUDE.md`, `AGENTS.md`

---

## 后台执行规则

**后台运行** (设置 `run_in_background: true`):
- 包安装: npm install, pip install, cargo build
- 构建过程: npm run build, make, tsc
- 测试套件: npm test, pytest, cargo test
- Docker 操作: docker build, docker pull

**前台运行** (阻塞):
- 快速状态检查: git status, ls, pwd
- 文件读取 (不是编辑 - 编辑委派给 luban-low)
- 简单命令

---

## 验证清单

停止前必须验证：
- [ ] TODO 列表: 无 pending/in_progress 任务
- [ ] 功能: 所有请求的功能正常工作
- [ ] 测试: 所有测试通过 (如适用)
- [ ] 错误: 无未处理的错误

**任何一项未勾选，继续工作。**

---

## Token 节省技巧

1. **批量相似任务** 给同一个 Agent，而不是生成多个
2. **用 wukong (haiku)** 发现文件，而不是 zhuge
3. **优先 luban-low** 做简单变更 - 失败再升级
4. **避免 opus agent** 除非任务确实需要深度推理
5. **用 simaqian (haiku)** 做所有文档任务

---

## 与标准模式的对比

| 方面 | 节俭模式 | 标准模式 |
|------|---------|---------|
| **默认层级** | Haiku (LOW) | Sonnet (MEDIUM) |
| **备选层级** | Sonnet (MEDIUM) | Opus (HIGH) |
| **Opus 使用** | 避免 (仅规划时) | 用于复杂任务 |
| **Token 开销** | 较低 | 较高 |
| **适用场景** | 标准开发工作 | 复杂挑战 |

---

## 配置选项

可在 `.claude/settings.json` 中配置：

```json
{
  "omc": {
    "ecomode": {
      "defaultTier": "LOW",
      "fallbackTier": "MEDIUM",
      "avoidOpus": true,
      "batchSimilarTasks": true,
      "verboseRouting": false
    }
  }
}
```

---

## 使用示例

### 示例 1: 标准功能开发

```bash
/jiejian 实现用户注册功能
```

**路由决策**:
- 探索代码结构 → wukong (Haiku)
- 实现注册逻辑 → luban-low (Haiku) 先试
- 如果复杂度需要 → 升级到 luban (Sonnet)
- 编写测试 → baozheng-low (Haiku)

### 示例 2: Bug 修复

```bash
/ecomode 修复登录报错 500
```

**路由决策**:
- 定位问题 → wukong (Haiku)
- 诊断根因 → bianque-low (Haiku) 先试
- 如果复杂 → 升级到 bianque (Sonnet)
- 修复代码 → luban-low (Haiku)
- 验证修复 → baozheng-low (Haiku)

### 示例 3: 文档更新

```bash
/eco 更新 API 文档
```

**路由决策**:
- 扫描 API 端点 → wukong (Haiku)
- 生成文档 → simaqian (Haiku)
- 无需升级 - 文档任务始终用 Haiku

---

## 设置为默认模式

运行 `/preferences` 将节俭模式设置为默认并行执行模式。

设置后，说 "fast" 或 "parallel" 会激活节俭模式而非标准模式。

---

## 状态清理

**重要: 完成时删除状态文件 - 不要只设置 `active: false`**

当节俭模式完成（所有验证通过）：

```bash
# 删除节俭模式状态文件
rm -f .omc/state/ecomode-state.json
```

---

## 文化寓意

节俭模式的智慧源自中国传统美德：

> **"俭，德之共也；侈，恶之大也。"** —— 《左传》

- **量入为出**：根据任务需求分配资源
- **物尽其用**：让每个 Token 都发挥价值
- **勤俭持家**：长期可持续的资源使用

**智者善俭，愚公勤勉。**
