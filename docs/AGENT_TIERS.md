# Agent 三层体系 (Agent Tier System)

oh-my-claude 采用三层 Agent 体系，根据任务复杂度智能选择模型，平衡成本与能力。

## 核心理念

> **量体裁衣，物尽其用。**
>
> 简单任务用 Haiku，复杂任务用 Sonnet，深度思考用 Opus。

---

## 三层定义

| 层级 | 后缀 | 模型 | 相对成本 | 适用场景 |
|------|------|------|----------|----------|
| **Low** | `-low` | Haiku | 1x | 快速探索、简单修改、格式化 |
| **Standard** | (无) | Sonnet | 5x | 复杂实现、重构、审查 |
| **High** | `-high` | Opus | 15x | 架构设计、深度分析、研究 |

---

## 分层 Agent 清单

### 完整三层支持

| Agent | Low (Haiku) | Standard (Sonnet) | High (Opus) |
|-------|-------------|-------------------|-------------|
| 悟空 (探索) | `wukong-low` | `wukong` | `wukong-high` |
| 鲁班 (实现) | `luban-low` | `luban` | `luban-high` |
| 墨子 (安全) | `mozi-low` | `mozi` | `mozi-high` |
| 扁鹊 (诊断) | `bianque-low` | `bianque` | `bianque-high` |
| 科学家 (研究) | `scientist-low` | `scientist` | `scientist-high` |
| QA测试 | `qa-tester-low` | `qa-tester` | `qa-tester-high` |

> **注意**: 悟空还有 `wukong-medium` 中等版本，与 `wukong` 同为 Sonnet 模型，提供更深入的代码分析。

### 双层支持 (Low + Standard)

| Agent | Low (Haiku) | Standard (Sonnet) | 说明 |
|-------|-------------|-------------------|------|
| 包拯 (测试) | `baozheng-low` | `baozheng` | 简单测试用 Low |
| 大禹 (构建) | `build-fixer-low` | `build-fixer` | 简单构建错误用 Low |
| 仓颉 (数据库) | `cangjie-low` | `cangjie` | 简单 SQL 用 Low |
| 顾恺之 (UI) | `gukaizhi-low` | `gukaizhi` | 组件调整用 Low |

### 双层支持 (Low + High)

| Agent | Low (Haiku) | High (Opus) | 说明 |
|-------|-------------|-------------|------|
| 诸葛 (架构) | `zhuge-low` | `zhuge` | 简单咨询用 Low，架构设计用 High |

### 仅标准版 (Sonnet)

| Agent | 模型 | 说明 |
|-------|------|------|
| 司马迁 (文档) | Sonnet | 文档质量需要 Sonnet |
| 魏征 (审查) | Sonnet | 审查需要完整理解 |
| 孙子 (性能) | Sonnet | 性能分析需要深度 |
| 老子 (简化) | Sonnet | 简化需要智慧 |
| 李白 (需求) | Sonnet | 需求理解需要 Sonnet |
| 郑和 (API) | Sonnet | API 设计需要 Sonnet |
| 李冰 (DevOps) | Sonnet | 基础设施需要 Sonnet |
| 张衡 (监控) | Sonnet | 监控设计需要 Sonnet |

### 仅高级版 (Opus)

| Agent | 说明 |
|-------|------|
| 火神 (深度工作) `huoshen` | 自主深度工作，端到端任务完成 |
| 神谕 (咨询) `oracle` | 只读高智商咨询，架构决策分析 |

---

## 选择指南

### 何时使用 Low (Haiku)

```
适合场景：
├── 快速文件搜索和定位
├── 简单代码格式化
├── 基础测试生成
├── 初步错误扫描
├── 文档查找
└── 并行 Worker 子任务
```

**示例**：
```bash
# 快速探索代码库
@wukong-low 找到所有处理用户认证的文件

# 简单测试
@baozheng-low 为这个工具函数写单元测试

# 初步安全扫描
@mozi-low 检查这个文件有没有明显的安全问题
```

### 何时使用 Standard (Sonnet)

```
适合场景：
├── 复杂功能实现
├── 代码重构
├── 深度代码审查
├── 完整测试设计
├── 架构评估
└── 大多数日常开发任务
```

**示例**：
```bash
# 复杂实现
@luban 实现用户认证模块，支持 JWT 和刷新令牌

# 深度诊断
@bianque 分析这个性能问题的根本原因

# 完整审查
@weizheng 审查这个 PR 的代码质量
```

### 何时使用 High (Opus)

```
适合场景：
├── 系统架构设计
├── 复杂问题深度分析
├── 多方案权衡评估
├── 跨系统设计
├── 研究性任务
└── 需要最强推理能力的场景
```

**示例**：
```bash
# 架构设计
@zhuge 设计一个支持百万用户的消息系统架构

# 深度研究
@scientist-high 分析这个算法的时间复杂度和优化空间

# 复杂实现
@luban-high 重构整个认证系统，引入 RBAC
```

---

## 自动升降级

### 升级规则

当 Low 版本无法完成任务时，系统会建议升级：

```
1. Haiku 失败 → 尝试 Sonnet
2. Sonnet 失败 → 仅在以下情况升级到 Opus:
   - 需要架构级决策
   - 涉及多系统交互设计
   - 需要深度推理分析
```

### 降级建议

主动降级可节省成本：

| 原计划 | 可降级情况 | 降级到 |
|--------|------------|--------|
| Opus | 只是简单文件修改 | Sonnet/Haiku |
| Sonnet | 只是查找或格式化 | Haiku |
| 并行任务 | Worker 子任务 | Haiku |

---

## 成本对比

假设一个典型任务需要 10K tokens：

| 模型 | 单价倍数 | 成本 | 适用比例建议 |
|------|----------|------|--------------|
| Haiku | 1x | $0.01 | 40-50% |
| Sonnet | 5x | $0.05 | 40-50% |
| Opus | 15x | $0.15 | 5-10% |

**遵循此规则可节省 30-50% 的 Token 开销。**

---

## 与执行模式的配合

### 节俭模式 (`/jiejian`)

自动优先使用 Low 版本：
```
/jiejian 实现用户登录功能
# 系统会优先分派给 @luban-low，必要时才升级
```

### 超级模式 (`/chaoji`)

Worker 使用 Haiku，协调者使用 Sonnet：
```
/chaoji 重构整个前端组件库
# 协调者: Sonnet
# Worker: Haiku (并行执行)
```

### 深度工作 (`/huoshen`)

探索用 Haiku，实现用 Sonnet/Opus：
```
/huoshen 设计并实现支付系统
# 探索阶段: @wukong (Haiku)
# 实现阶段: @luban/@luban-high (根据复杂度)
```

---

## 调用示例

### 指定版本

```bash
# 明确指定 Low 版本
@wukong-low 快速找到配置文件

# 明确指定 High 版本
@luban-high 实现复杂的状态机

# 使用标准版（默认）
@wukong 探索代码库结构
```

### 在 Task 中指定模型

```javascript
Task({
  subagent_type: "wukong",
  model: "haiku",  // 强制使用 Haiku
  prompt: "探索项目结构"
})

Task({
  subagent_type: "luban",
  model: "opus",  // 强制使用 Opus
  prompt: "设计复杂的认证系统"
})
```

---

## 最佳实践

1. **默认使用 Standard** - 不确定时使用标准版
2. **探索用 Low** - 搜索和定位任务优先用 Haiku
3. **实现用 Standard** - 大多数开发任务用 Sonnet
4. **设计用 High** - 架构决策和深度分析用 Opus
5. **并行用 Low** - Worker 子任务统一用 Haiku
6. **按需升级** - 遇到困难再考虑升级模型

---

## 相关文档

- [模型选择规则](../rules/model-selection.md) - 详细的模型选择策略
- [节俭模式](../skills/ecomode/skill.md) - Token 高效执行
- [Agent 自动委托](../rules/agent-auto-delegation.md) - 智能任务分派
