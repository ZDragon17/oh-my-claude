---
name: parallel
description: |
  并行 Agent 执行 - 同时启动多个 Agent 处理独立任务。
  适用于互不依赖的分析、审计、探索任务。

  用法：
  /parallel
    @wukong 探索认证模块
    @mozi 审计安全配置
    @baozheng 检查测试覆盖率

  或单行: /parallel @wukong @mozi @baozheng 全面分析代码

  别名：/并行, /concurrent, /prl
aliases:
  - /并行
  - /concurrent
  - /prl
allowed-tools:
  - Task
  - TodoWrite
  - TodoRead
  - Read
  - Grep
model: sonnet
---

<command-name>/parallel</command-name>

# 并行 Agent 执行器

同时调度多个专业 Agent，并行处理独立任务。

## 核心理念

> 兵贵神速，分进合击。
> 多路并进，效率倍增。

## 适用场景

### ✅ 适合并行的任务

| 场景 | 推荐 Agent 组合 |
|------|----------------|
| 全面代码分析 | @wukong + @mozi + @sunzi |
| 质量检查 | @bianque + @baozheng + @weizheng |
| 技术调研 | @wukong + @simaqian |
| 架构评审 | @zhuge + @cangjie |

### ❌ 不适合并行的任务

- 有依赖关系的实现任务
- 需要上一步输出的任务
- 文件修改类任务（可能冲突）

---

## 命令解析

**输入格式**：

```bash
# 多行格式
/parallel
  @wukong 探索认证模块的代码结构
  @mozi 审计认证模块的安全漏洞
  @baozheng 检查认证模块的测试覆盖率

# 单行格式
/parallel @wukong @mozi @baozheng 全面分析认证模块
```

**解析规则**：
1. 识别所有 `@agent` 标记
2. 提取每个 Agent 的任务描述
3. 如果是单行格式，共享任务描述分配给所有 Agent

---

## 执行流程

### 步骤 1: 解析 Agent 和任务

从 `$ARGUMENTS` 中提取：
- Agent 列表（通过 @标记识别）
- 每个 Agent 的任务描述

**支持的 Agent**（来自 agent-mapping.json）：

| Agent | 名称 | 专长 | subagent_type |
|-------|------|------|---------------|
| @wukong | 悟空 | 代码探索 | explore |
| @zhuge | 诸葛 | 架构设计 | oracle |
| @luban | 鲁班 | 代码实现 | general |
| @bianque | 扁鹊 | Bug 诊断 | debugger |
| @mozi | 墨子 | 安全审计 | security-auditor |
| @sunzi | 孙子 | 性能优化 | performance-engineer |
| @baozheng | 包拯 | 测试设计 | test-engineer |
| @weizheng | 魏征 | 代码审查 | code-reviewer |
| @simaqian | 司马迁 | 文档撰写 | document-writer |
| @cangjie | 仓颉 | 数据库设计 | database-architect |
| @laozi | 老子 | 代码简化 | general |

### 步骤 2: 验证并行可行性

检查 Agent 组合是否在推荐的并行组中：

```json
{
  "exploration": ["wukong", "simaqian"],
  "design": ["zhuge", "cangjie"],
  "implementation": ["luban", "gukaizhi"],
  "quality": ["bianque", "baozheng", "weizheng"],
  "optimization": ["sunzi", "laozi", "mozi"]
}
```

如果 Agent 跨组或包含实现类 Agent，发出警告。

### 步骤 3: 创建并行任务组

为每个 Agent 创建 TODO，使用 `[并行]` 标记：

```
使用 TodoWrite 创建任务列表：
- [并行] @wukong: 探索认证模块代码结构
- [并行] @mozi: 审计认证模块安全漏洞
- [并行] @baozheng: 检查认证模块测试覆盖率
```

### 步骤 4: 并行执行

使用 Task 工具的 `run_in_background: true` 参数，并行启动所有 Agent：

```
对于每个 Agent:
  Task(
    subagent_type=agent.subagent_type,
    description="[并行任务] " + agent.name,
    prompt=agent.task,
    run_in_background=true
  )
```

### 步骤 5: 显示执行状态

输出并行任务面板，等待所有任务完成。

### 步骤 6: 汇总结果

收集所有 Agent 的输出，生成汇总报告。

---

## 输出格式

### 启动阶段

```text
🚀 并行执行已启动
═══════════════════════════════════════════════════

📋 并行任务组: parallel_1706012345
   任务数: 3
   预计时间: 2-5 分钟

┌──────────────────────────────────────────────────┐
│  Agent      任务                        状态     │
├──────────────────────────────────────────────────┤
│  🔍 悟空    探索认证模块代码结构        ⏳ 启动中 │
│  🛡️ 墨子    审计认证模块安全漏洞        ⏳ 启动中 │
│  ⚖️ 包拯    检查认证模块测试覆盖率      ⏳ 启动中 │
└──────────────────────────────────────────────────┘

═══════════════════════════════════════════════════
💡 各 Agent 将独立执行，完成后自动汇总结果
💡 可使用 /progress 查看详细进度
```

### 执行中（实时更新）

```text
🚀 并行执行中...
═══════════════════════════════════════════════════

┌──────────────────────────────────────────────────┐
│  Agent      任务                        状态     │
├──────────────────────────────────────────────────┤
│  🔍 悟空    探索认证模块代码结构        ✅ 完成   │
│  🛡️ 墨子    审计认证模块安全漏洞        🔄 60%   │
│  ⚖️ 包拯    检查认证模块测试覆盖率      🔄 40%   │
└──────────────────────────────────────────────────┘

⏱️ 已用时: 1分30秒

═══════════════════════════════════════════════════
```

### 完成阶段

```text
✅ 并行执行完成
═══════════════════════════════════════════════════

📊 执行摘要:
   总任务: 3
   成功: 3
   失败: 0
   总用时: 3分25秒

═══════════════════════════════════════════════════

## 🔍 悟空的发现 (代码探索)

### 认证模块结构
- 入口文件: `src/auth/index.ts`
- 核心逻辑: `src/auth/services/AuthService.ts`
- 中间件: `src/auth/middleware/`
- 共发现 12 个相关文件

### 调用关系
```
AuthController → AuthService → UserRepository
                            → TokenService
                            → RedisClient
```

---

## 🛡️ 墨子的发现 (安全审计)

### 发现的问题
1. **高危**: Token 存储未加密 (`src/auth/services/TokenService.ts:42`)
2. **中危**: 密码复杂度验证不足 (`src/auth/validators/password.ts:15`)
3. **低危**: 日志中可能泄露敏感信息 (`src/auth/middleware/logger.ts:28`)

### 建议
- 立即修复高危问题
- 添加密码强度验证
- 脱敏日志输出

---

## ⚖️ 包拯的发现 (测试覆盖)

### 覆盖率报告
- 整体覆盖率: 67%
- AuthService: 82%
- TokenService: 45% ⚠️
- AuthMiddleware: 71%

### 缺失测试
- Token 刷新逻辑
- 异常场景处理
- 并发登录测试

═══════════════════════════════════════════════════

📋 后续建议:
   1. 优先修复墨子发现的高危安全问题
   2. 补充包拯指出的缺失测试
   3. 根据悟空的结构分析规划重构

💡 使用 /yishan 开始执行修复任务
```

---

## 错误处理

### 部分失败

```text
⚠️ 并行执行部分完成
═══════════════════════════════════════════════════

📊 执行摘要:
   总任务: 3
   成功: 2
   失败: 1
   总用时: 2分15秒

┌──────────────────────────────────────────────────┐
│  Agent      任务                        状态     │
├──────────────────────────────────────────────────┤
│  🔍 悟空    探索认证模块代码结构        ✅ 完成   │
│  🛡️ 墨子    审计认证模块安全漏洞        ✅ 完成   │
│  ⚖️ 包拯    检查认证模块测试覆盖率      ❌ 失败   │
└──────────────────────────────────────────────────┘

❌ 失败详情:
   包拯: 测试框架配置文件缺失

═══════════════════════════════════════════════════
💡 可使用 /retry 重试失败的任务
💡 或使用 /baozheng 单独执行测试检查
```

### 全部失败

```text
❌ 并行执行失败
═══════════════════════════════════════════════════

所有任务均未能完成。

可能原因:
- 项目结构不符合预期
- 缺少必要的配置文件
- Agent 任务描述不清晰

═══════════════════════════════════════════════════
💡 建议: 先使用 /wukong 单独探索项目结构
```

---

## 帮助信息

当 `$ARGUMENTS` 为空或为 `help` 时显示：

```text
📖 并行执行命令
═══════════════════════════════════════════════════

用法: /parallel @agent1 @agent2 ... [任务描述]

格式示例:

  # 多行格式（推荐）
  /parallel
    @wukong 探索认证模块
    @mozi 审计安全配置
    @baozheng 检查测试覆盖

  # 单行格式
  /parallel @wukong @mozi @baozheng 分析认证模块

推荐的并行组合:

  探索组: @wukong + @simaqian
  设计组: @zhuge + @cangjie
  质量组: @bianque + @baozheng + @weizheng
  优化组: @sunzi + @laozi + @mozi

注意事项:
  - 适合独立的分析、审计任务
  - 不适合有依赖关系的实现任务
  - 不适合会修改同一文件的任务

═══════════════════════════════════════════════════
💡 示例: /parallel @wukong @mozi 全面分析代码安全
```

---

## 执行规则

1. **验证 Agent** - 确保所有 @agent 标记有效
2. **检查兼容性** - 警告不推荐的 Agent 组合
3. **并行启动** - 使用 run_in_background 真正并行
4. **实时反馈** - 显示各任务执行状态
5. **智能汇总** - 合并所有 Agent 的发现

## 现在执行

解析 `$ARGUMENTS`，提取 Agent 和任务，执行并行流程。

$ARGUMENTS
