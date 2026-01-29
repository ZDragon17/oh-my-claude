---
description: 节俭模式 - Token 高效的并行执行，优先使用 Haiku/Sonnet，节省 30-50% 开销
aliases: [ecomode, eco, budget, save-tokens]
---

# 节俭模式命令 (Jiejian / Ecomode)

[节俭模式已激活 - TOKEN 高效执行]

你现在进入节俭模式。这是一个优先使用低成本模型的执行模式，在保证质量的前提下节省 Token 开销。

## 用户任务

{{ARGUMENTS}}

## 核心原则

> **一粥一饭，当思来之不易。**

1. **默认使用 LOW 层级** - Haiku Agent 优先
2. **仅必要时升级** - 复杂度确实需要才用 Sonnet
3. **避免 HIGH 层级** - Opus 仅在规划/批评时使用
4. **并行执行** - 独立任务后台运行
5. **持续到完成** - 验证通过才能停止

## 智能模型路由

### Agent 选择表

| 任务类型 | 首选 (Haiku) | 备选 (Sonnet) | 避免 (Opus) |
|---------|-------------|---------------|-------------|
| 代码探索 | `wukong` | - | - |
| 简单实现 | `luban-low` | `luban` | ~~`luban-high`~~ |
| 前端组件 | `gukaizhi-low` | `gukaizhi` | - |
| 测试编写 | `baozheng-low` | `baozheng` | - |
| 文档更新 | `simaqian` | - | - |
| Bug 诊断 | `bianque-low` | `bianque` | - |
| 安全检查 | `mozi-low` | `mozi` | - |
| 架构分析 | `zhuge-low` | `zhuge` | - |

### 层级决策流程

```
任务进入
    |
    v
尝试 LOW (Haiku)
    |
    ├── 成功 → 完成
    |
    └── 失败/复杂 → 升级到 MEDIUM (Sonnet)
                        |
                        ├── 成功 → 完成
                        |
                        └── 仅规划需要 → 使用 HIGH (Opus)
```

## 委派规则 (强制)

**你是编排者，不是实现者。**

| 动作 | 你做 | 委派给 |
|------|-----|--------|
| 读取文件上下文 | ✓ | |
| 追踪进度 (TODO) | ✓ | |
| 生成并行 Agent | ✓ | |
| **代码变更** | ✗ | luban-low → luban |
| **UI 工作** | ✗ | gukaizhi-low → gukaizhi |
| **测试编写** | ✗ | baozheng-low → baozheng |
| **文档** | ✗ | simaqian |

**路径例外**: 只能写入 `.omc/`, `.claude/`, `CLAUDE.md`, `AGENTS.md`

## 路由示例

```javascript
// 文件查找 → 始终 LOW
Task(
  subagent_type: "oh-my-claude:wukong",
  model: "haiku",
  prompt: "找到 UserService 的定义位置"
)

// 简单实现 → 先试 LOW
Task(
  subagent_type: "oh-my-claude:luban-low",
  model: "haiku",
  prompt: "给登录表单添加验证"
)

// 如果失败 → 升级到 MEDIUM
Task(
  subagent_type: "oh-my-claude:luban",
  model: "sonnet",
  prompt: "给登录添加完整错误处理"
)

// 文档 → 始终 LOW
Task(
  subagent_type: "oh-my-claude:simaqian",
  model: "haiku",
  prompt: "为 API 端点添加 JSDoc"
)
```

## 后台执行规则

**后台运行** (`run_in_background: true`):
- 包安装: npm install, pip install
- 构建过程: npm run build, tsc
- 测试套件: npm test, pytest
- Docker 操作: docker build

**前台运行**:
- 快速检查: git status, ls
- 文件读取 (编辑委派给 Agent)
- 简单命令

## 验证清单

停止前必须验证：

```
✅ 退出检查

1. TODO 完成
   □ 无 pending 任务
   □ 无 in_progress 任务

2. 功能验证
   □ 所有请求功能正常
   □ 无回归问题

3. 质量检查
   □ 测试通过 (如适用)
   □ 构建成功 (如适用)
   □ 无未处理错误
```

**任何一项未满足，继续工作。**

## Token 节省技巧

1. **批量任务** - 相似任务给同一 Agent
2. **用 wukong** - 发现文件，而非用 zhuge
3. **先试 -low** - 简单变更先用 Haiku 版
4. **避免 opus** - 除非确实需要深度推理
5. **用 simaqian** - 所有文档任务

## 状态管理

在 `.omc/state/ecomode-state.json` 追踪：

```json
{
  "active": true,
  "mode": "ecomode",
  "defaultTier": "LOW",
  "upgrades": [
    {"task": "复杂错误处理", "from": "LOW", "to": "MEDIUM", "reason": "Haiku 失败"}
  ],
  "tokenSaved": "estimated 35%"
}
```

## 完成

当所有验证通过：

```
<promise>ECOMODE_COMPLETE</promise>
```

显示摘要：
- 完成的任务数
- 使用的 Agent 层级分布
- 估计节省的 Token
- 最终验证状态

## 取消

```bash
/cancel-ecomode
# 或说: "停止节俭模式", "取消 eco"
```
