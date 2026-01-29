---
description: 超级并行模式 - 文件所有权分区的并行自动驾驶，实现最多 5 倍加速
aliases: [ultrapilot, up, parallel-build]
---

# 超级模式命令 (Chaoji / Ultrapilot)

[超级模式已激活 - 并行自主执行]

你现在进入超级模式。这是一个并行自动驾驶模式，通过文件所有权分区生成多个 Worker 以最大化速度。

## 用户任务

{{ARGUMENTS}}

## 你的使命

通过并行执行将此任务转化为可工作的代码：

1. **分析** - 判断任务是否可并行化
2. **分解** - 拆分为带文件分区的并行安全子任务
3. **并行执行** - 生成最多 5 个独占文件所有权的 Worker
4. **整合** - 顺序处理共享文件
5. **验证** - 全系统完整性检查

## 阶段 0: 任务分析

判断任务是否适合并行执行：

**可并行化条件**:
- 能拆分为 2+ 个独立子任务
- 文件边界清晰
- 子任务间依赖最小

**若不可并行化**: 回退到标准 `/yishan` 愚公移山模式

## 阶段 1: 任务分解

将任务拆解为并行安全的子任务：

1. 识别独立组件（如：前端、后端、数据库、测试）
2. 将每个子任务映射到不重叠的文件集
3. 识别共享文件（package.json, tsconfig.json）用于顺序处理
4. 创建带清晰所有权的任务列表

**输出**: 带文件所有权分配的子任务定义

## 阶段 2: 文件分区

创建独占所有权映射：

```
Worker 1 (鲁班):   src/api/**     (独占)
Worker 2 (顾恺之): src/ui/**      (独占)
Worker 3 (仓颉):   src/db/**      (独占)
Worker 4 (司马迁): docs/**        (独占)
Worker 5 (包拯):   tests/**       (独占)
共享文件:          package.json, tsconfig.json (顺序处理)
```

**规则**: 任意两个 Worker 不能操作相同文件

## 阶段 3: 并行执行

使用 Task 工具生成 Worker，设置 `run_in_background: true`:

```javascript
Task(
  subagent_type: "oh-my-claude:luban",
  model: "sonnet",
  run_in_background: true,
  prompt: `超级模式 WORKER [1/5]

独占文件: src/api/**
任务: [具体子任务]

你对这些文件有独占所有权。
不要操作所有权外的文件。
完成后发送 WORKER_COMPLETE 信号。`
)
```

**关键规则**:
- 最多 5 个并行 Worker (Claude Code 限制)
- 每个 Worker 拥有独占文件集
- 通过 TaskOutput 监控
- 通过重新分配或修复处理失败

## 阶段 4: 整合

所有 Worker 完成后：

1. 顺序处理共享文件（package.json, 配置文件）
2. 解决任何整合问题
3. 确保所有部分协同工作

## 阶段 5: 验证

召唤诸葛进行全系统验证：

```javascript
Task(
  subagent_type: "oh-my-claude:zhuge",
  model: "opus",
  prompt: `超级模式验证

验证完整实现:
1. 所有子任务成功完成
2. 无整合冲突
3. 系统整体正常工作
4. 测试通过（如适用）`
)
```

## 委派规则 (强制)

**你是协调者，不是实现者。**

| 动作 | 你做 | 委派 |
|------|-----|------|
| 分解任务 | ✓ | |
| 分区文件 | ✓ | |
| 生成 Worker | ✓ | |
| 追踪进度 | ✓ | |
| **任何代码变更** | ✗ 绝不 | 专家 Worker |

**路径例外**: 只能写入 `.omc/`, `.claude/`, `CLAUDE.md`, `AGENTS.md`

## 状态管理

在 `.omc/ultrapilot-state.json` 中追踪状态：

```json
{
  "active": true,
  "mode": "ultrapilot",
  "workers": [
    {"id": "w1", "agent": "luban", "status": "running", "files": ["src/api/**"]},
    {"id": "w2", "agent": "gukaizhi", "status": "complete", "files": ["src/ui/**"]}
  ],
  "shared_files": ["package.json", "tsconfig.json"],
  "phase": "parallel_execution"
}
```

## 完成

当所有阶段完成且诸葛验证通过：

```
<promise>ULTRAPILOT_COMPLETE</promise>
```

显示摘要：
- 相对顺序执行的时间节省
- 生成的 Worker 数
- 每个 Worker 修改的文件
- 最终验证状态

## Agent 分派表

| 子任务类型 | 推荐 Agent | 备选 |
|-----------|-----------|------|
| 后端 API | 鲁班 | 鲁班-low |
| 前端 UI | 顾恺之 | 顾恺之-low |
| 数据库 | 仓颉 | 仓颉-low |
| 测试 | 包拯 | 包拯-low |
| 文档 | 司马迁 | 司马迁-low |
| 整合验证 | 诸葛 | - |
| 安全审计 | 墨子 | - |

## 取消

```bash
/cancel-ultrapilot
# 或说: "停止超级模式", "取消并行"
```
