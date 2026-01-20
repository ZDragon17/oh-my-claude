# Changelog / 变更日志

All notable changes to this project will be documented in this file.
本文件记录项目的所有重要变更。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased] / 未发布

### Planned / 计划中

- Agent memory persistence / Agent 记忆持久化
- More specialized agents / 更多专业 Agent

---

## [1.6.0] - 2026-01-20

### 🎯 Feature Alignment Complete / 功能对齐完成

**本版本完成了与 oh-my-opencode 的全面功能对齐**（多模型支持除外）。

This release completes comprehensive feature alignment with oh-my-opencode (except multi-model support).

#### 功能对齐率 / Alignment Rate: ~95%

| 维度 | oh-my-opencode | oh-my-claude | 状态 |
|------|---------------|--------------|------|
| **Agent 数量** | 7 | 18 | ✅ 超越 |
| **Hook 数量** | 35+ | 26 | ✅ 基本持平 |
| **命令数量** | ~20 | 31 | ✅ 超越 |
| **技能数量** | ~3 | 4 | ✅ 等效 |
| **多模型支持** | ✅ | ❌ | 🔵 设计差异 |

### 🔧 P2 Additional Hooks / P2 附加 Hooks

本版本新增多个辅助 Hooks，完善 oh-my-opencode 功能对齐。

### ✨ Added / 新增

#### Interactive Bash Session Hook / 交互式 Bash 会话 Hook

- 新增 `hooks/interactive-bash-session.sh` - tmux 会话管理
- **长时间运行检测** - 识别 dev server、docker、kubectl 等长时间运行命令
- **tmux 会话建议** - 提供会话创建和管理的命令示例
- **会话命名规范** - 使用 `omo-{name}` 格式
- **tmux 可用性检查** - 未安装时提供安装建议

#### Thinking Block Validator Hook / 思维块验证 Hook

- 新增 `hooks/thinking-block-validator.sh` - Extended thinking 错误检测
- **预算超出检测** - 识别 thinking token 预算超出
- **格式错误检测** - 识别思考块格式问题
- **超时检测** - 识别思考过程超时
- **流式输出错误** - 检测 streaming 相关问题
- **响应截断检测** - 识别 API 响应被截断
- **上下文超出检测** - 识别上下文窗口限制

#### Agent Usage Reminder Hook / Agent 使用提醒 Hook

- 新增 `hooks/agent-usage-reminder.sh` - 智能 Agent 推荐
- **任务类型识别** - 根据用户输入识别任务类型
- **Agent 推荐** - 为不同任务推荐合适的专业 Agent：
  - 架构/设计 → 诸葛 (ZhuGe)
  - 测试 → 包拯 (BaoZheng)
  - 安全 → 墨子 (MoZi)
  - 性能 → 孙子 (SunZi)
  - 数据库 → 仓颉 (CangJie)
  - 文档 → 司马迁 (SimaQian)
  - 代码审查 → 魏征 (WeiZheng)
  - UI/UX → 顾恺之 (GuKaiZhi)
- **冷却期机制** - 5 分钟内不重复提醒
- **智能过滤** - 已使用相关 Agent 时不再提醒

### 📋 hooks.json 更新

- 添加 `interactive-bash-session.sh` 到 UserPromptSubmit hooks
- 添加 `thinking-block-validator.sh` 到 PostToolUse hooks
- 添加 `agent-usage-reminder.sh` 到 UserPromptSubmit hooks

---

## [1.5.0] - 2026-01-20

### 🛠️ P2 Enhancement Features / P2 增强功能

本版本新增 JSONC 配置支持、扩展配置选项和辅助监控 hooks。

### ✨ Added / 新增

#### JSONC 配置支持 / JSONC Config Support

- 新增 `lib/jsonc-parser.ts` - JSONC (JSON with Comments) 解析器
- **单行注释支持** - 支持 `//` 风格的单行注释
- **多行注释支持** - 支持 `/* */` 风格的多行注释
- **尾随逗号支持** - 允许数组和对象末尾的逗号
- **错误定位** - 解析错误时提供行号和列号信息
- **配置文件扩展** - 现在支持 `.json` 和 `.jsonc` 两种格式

#### 配置扩展 / Config Extensions

新增以下配置选项：

**agents.categories** - Agent 分类配置
```json
{
  "agents": {
    "categories": {
      "enabled": ["core", "development", "operations"],
      "disabled": [],
      "custom": {}
    }
  }
}
```

**notification** - 通知配置
```json
{
  "notification": {
    "enabled": true,
    "level": "important",
    "backgroundTaskCompletion": true,
    "taskFailure": true,
    "sessionRecovery": true,
    "quietHours": {
      "enabled": false,
      "start": 22,
      "end": 8
    }
  }
}
```

**backgroundTask** - 后台任务配置
```json
{
  "backgroundTask": {
    "maxConcurrency": 5,
    "defaultTimeout": 120000,
    "autoRetry": 2,
    "retryDelay": 5000,
    "enablePriorityQueue": true,
    "saveHistory": true,
    "historyRetentionDays": 7
  }
}
```

#### 辅助监控 Hooks / Helper Monitor Hooks

- 新增 `hooks/context-window-monitor.sh` - 上下文窗口监控
  - **使用率估算** - 估算当前上下文 token 使用量
  - **阈值警告** - 在 70% 和 85% 使用率时提供警告
  - **压缩建议** - 提供上下文压缩和会话管理建议
  
- 新增 `hooks/tool-output-validator.sh` - 工具输出验证
  - **权限错误检测** - EACCES、EPERM 等
  - **文件不存在检测** - ENOENT 等
  - **超时错误检测** - ETIMEDOUT 等
  - **连接错误检测** - ECONNREFUSED 等
  - **内存错误检测** - ENOMEM 等
  - **磁盘空间检测** - ENOSPC 等
  - **语法错误检测** - SyntaxError 等
  - **修复建议** - 为每种错误类型提供针对性建议

### 📋 hooks.json 更新

- 添加 `context-window-monitor.sh` 到 PostToolUse hooks
- 添加 `tool-output-validator.sh` 到 PostToolUse hooks

### 🔧 Enhanced / 增强

- **ConfigManager** - 现在支持加载 `.jsonc` 格式的配置文件
- **配置文件搜索顺序** - 同时搜索 `.json` 和 `.jsonc` 扩展名

---

## [1.4.0] - 2026-01-20

### 🔄 P1 Important Features / P1 重要功能

本版本继续对齐 oh-my-opencode 的重要功能，新增多个增强 Hook 和 Agent 能力升级。

### ✨ Added / 新增

#### Delegate Task Retry Hook / 任务委派重试 Hook

- 新增 `hooks/delegate-task-retry.sh` - 自动检测失败的委派任务
- **失败检测** - 识别 error、failed、timeout 等错误模式
- **重试建议** - 提供详细的重试指导和调整建议
- **状态追踪** - 记录失败任务以便后续分析

#### Background Notification Hook / 后台任务通知 Hook

- 新增 `hooks/background-notification.sh` - 后台任务完成通知
- **状态监控** - 追踪 completed、running、failed 状态
- **批量通知** - 支持多个任务同时完成的通知
- **结果摘要** - 提供任务完成情况的简洁摘要

#### Session Recovery Hook / 会话恢复 Hook

- 新增 `hooks/session-recovery.sh` - 增强的会话恢复机制
- **Thinking Block 错误检测** - 识别 extended thinking 相关错误
- **上下文窗口限制检测** - 识别 token limit 相关问题
- **会话中断检测** - 识别连接断开等问题
- **TODO 状态恢复** - 从保存的状态文件中恢复任务进度
- **检查点恢复** - 支持从任务检查点继续执行

#### Empty Task Response Detector Hook / 空任务响应检测 Hook

- 新增 `hooks/empty-task-response-detector.sh` - 检测委派任务的空响应
- **空响应检测** - 识别完全空的任务结果
- **占位符检测** - 识别 TODO、PLACEHOLDER 等占位符响应
- **模板响应检测** - 识别 Agent 只给出意图但未执行的情况
- **错误响应检测** - 识别包含错误信息的响应

### 🔧 Enhanced / 增强

#### 李白 (LiBai) - Metis 能力集成

- **INVEST 原则验证** - 用户故事质量检查
- **MoSCoW 优先级框架** - 需求优先级排序
- **RICE 评分系统** - 功能价值评估
- **需求追踪矩阵** - 从业务目标到测试用例的完整追踪
- **与愚公协作增强** - 自动将结构化需求转换为任务列表

#### 诸葛 (ZhuGe) - Prometheus 能力集成

- **Work Breakdown Structure** - 任务分解到 Epic/Feature/Story/Task 层级
- **执行计划生成** - 带时间估算和依赖关系的计划
- **关键路径分析** - 识别阻塞依赖和并行机会
- **架构决策记录 (ADR)** - 标准化的决策文档格式
- **与愚公协作增强** - 将执行计划转换为 TODO 列表

### 📋 hooks.json 更新

- 添加 `delegate-task-retry.sh` 到 PostToolUse hooks
- 添加 `background-notification.sh` 到 PostToolUse hooks
- 添加 `empty-task-response-detector.sh` 到 PostToolUse hooks
- 添加 `session-recovery.sh` 到 UserPromptSubmit hooks

---

## [1.3.0] - 2026-01-20

### 🎯 Major Feature Alignment / 重大功能对齐

本版本重点对齐 oh-my-opencode 的核心功能（多模型支持除外）。

### ✨ Added / 新增

#### 愚公系统提示词增强 / Yugong System Prompt Enhancement

- **Phase 0-3 工作流** - 添加完整的 Intent Gate → Codebase Assessment → Implementation → Completion 工作流
- **Frontend Gate 决策** - 添加 Frontend 文件变更类型分类（视觉/逻辑/混合）和委派规则
- **GitHub Workflow** - 添加从 Issue 到 PR 的完整工作周期指引
- **Delegation Prompt Structure** - 强制 7 部分委派提示格式（TASK, EXPECTED OUTCOME, REQUIRED SKILLS, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT）
- **并行执行指引** - 明确 explore/librarian agent 应并行后台调用

#### Git Master 技能 / Git Master Skill

- 新增 `skills/git-master/` 目录
- **安全协议** - 禁止破坏性操作（force push, hard reset）、跳过 hooks、未经请求提交
- **Conventional Commits** - 支持 feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert 类型
- **Co-authored-by** - 自动添加 AI 协作者标记
- **Git Commit --amend 规则** - 明确 amend 的使用条件
- 新增 `/git` 命令

#### Ralph Loop 循环机制 / Ralph Loop Mechanism

- 新增 `hooks/ralph-loop.sh` - 独立的自引用循环控制 Hook
- **完成承诺检测** - 检测 `<promise>DONE</promise>` 标记
- **自动继续** - 未完成时自动阻止停止
- **迭代控制** - 支持最大迭代次数配置（默认 100）
- 新增 `/ralph-loop` 命令 - 启动 Ralph Loop
- 新增 `/cancel-ralph` 命令 - 取消循环

#### 新命令 / New Commands

- `/init-deep` - 深度项目初始化，全面分析项目结构、技术栈、依赖关系
- `/start-work` - 开始工作流，从需求/Issue 到交付的完整流程
- `/refactor` - 安全重构模板，支持重命名、提取、移动、简化等操作

### 🛠️ Improved / 改进

- **hooks.json** - 添加 ralph-loop.sh 到 Stop hooks
- **Agent 委派表** - 明确各领域委派给哪个 Agent

### 📚 Documentation / 文档

- 新增 `docs/GAP_ANALYSIS_REPORT.md` - 与 oh-my-opencode 的详细差距分析
- 新增 `docs/IMPLEMENTATION_ROADMAP.md` - 功能对齐实施路线图
- 更新 `docs/FEATURE_ALIGNMENT.md` - 功能对齐状态

---

## [1.2.5] - 2025-01-20

### 🔧 Fixed / 修复

- **修复 ESLint any 类型警告** - 创建 `ConfigExportData` 接口替代 any 类型
  - `exportConfig()` 和 `importConfig()` 方法现在使用强类型定义
  - 测试文件中合理使用 eslint-disable 注释

### 🛠️ Improved / 改进

- **优化 Agent 状态管理器初始化** - 改进测试环境兼容性
  - 添加 `skipAutoInit` 选项支持测试环境
  - 新增 `waitForInit()` 方法用于确保初始化完成
  - 测试环境中跳过自动状态加载，避免异步操作悬挂

- **改进 Zod Schema 类型注释** - 添加设计意图说明
  - 在 `lib/agent/types.ts` 中说明 `z.any()` 的使用原因
  - 上下文数据使用 any 是故意的设计决策（动态 JSON 结构）

### 🧹 Chores / 杂项

- **删除 Windows 保留文件** - 移除意外创建的 `nul` 文件
- **优化测试设置** - 简化 `tests/setup.ts` 中的清理逻辑

---

## [1.2.4] - 2025-01-19

### 🔧 Fixed / 修复

- **彻底修复 npx 更新失败问题** - 使用 `process.argv[1]` 定位包根目录
  - `process.argv[1]` 包含入口脚本的完整路径，在所有环境下都可用
  - 从脚本路径向上遍历查找包含 `package.json` 和 `agents/` 目录的包根目录
  - 完全兼容 ESM、CommonJS、npx、全局安装等所有环境

---

## [1.2.3] - 2025-01-19

### 🔧 Fixed / 修复

- **尝试修复 npx 更新失败问题** - 使用运行时检测 ESM/CJS 环境
  - 使用 `new Function` 动态获取 `import.meta.url`（此方法在严格 ESM 环境下仍不工作）

---

## [1.2.2] - 2025-01-19

### 🔧 Fixed / 修复

- **修复 npx 更新失败问题** - `npx claude-pangu@latest update` 命令现在可以正常工作
  - 重写 `getPackageDir()` 函数，支持 npx 临时缓存目录环境
  - 重写 `getPackageVersion()` 函数，正确遍历查找 package.json
  - 添加包目录有效性验证（检查 agents 目录是否存在）

### 🛠️ CI/CD

- **修复 GitHub Actions 发布流程** - Release job 现在只在 tag push 时运行
  - 避免每次 main 分支 push 都尝试 npm publish
  - 更新为使用 `softprops/action-gh-release@v1` 自动生成 release notes
  - 配置 NPM_TOKEN secret 支持自动发布

---

## [1.2.1] - 2025-01-19

### 🧪 Testing / 测试

#### 测试覆盖率优化 / Test Coverage Optimization

**重大改进**：显著提升测试覆盖率，从 ~60% 提升至 ~75%。

##### 新增测试文件 / New Test Files

| 测试文件 | 测试数 | 覆盖模块 |
|----------|--------|----------|
| `tests/session-manager.test.ts` | 45 | SessionManager 会话管理 |
| `tests/context-compression.test.ts` | 25 | 上下文压缩模块 |
| `tests/config-commands.test.ts` | 23 | CLI 配置命令 |
| `tests/messages.test.ts` | 20 | UI 消息输出 |
| `tests/progress.test.ts` | 18 | 进度指示器 |
| `tests/skill-loader.test.ts` | 27 | 技能加载器 |
| `tests/error-handler.test.ts` | 14 | 错误处理 |
| `tests/file-operations.test.ts` | 14 | 文件操作 |
| `tests/plugin-installer.test.ts` | 11 | 插件安装器 |
| `tests/config-manager.test.ts` | 11 | 配置管理 |
| `tests/lock-manager.test.ts` | 9 | 锁管理器 |
| `tests/verifier.test.ts` | 8 | 安装验证 |
| `tests/installer.test.ts` | 8 | 安装器模块 |
| `tests/complexity-analysis.test.ts` | 5 | 复杂度分析 |

##### 代码覆盖率提升 / Coverage Improvement

| 指标 | 之前 | 之后 | 提升 |
|------|------|------|------|
| Statements | ~60% | 74.3% | +14% |
| Branches | ~45% | 59.5% | +14% |
| Functions | ~60% | 76.2% | +16% |
| Lines | ~60% | 74.5% | +14% |

##### 100% 覆盖率模块 / Modules with 100% Coverage

- `lib/agent/session-manager.ts` - **新增**
- `lib/agent/types.ts`
- `lib/agent-state-manager.ts`
- `lib/ui/progress.ts`

### 🔧 Fixed / 修复

- **修复 `tests/setup.ts` lint 错误** - 将 `require` 语句改为 ESM `import` 导入

### 📦 Technical / 技术改进

- **Agent 模块重构** - 将 `agent-state-manager.ts` 拆分为独立模块：
  - `lib/agent/session-manager.ts` - 会话管理
  - `lib/agent/context-compression.ts` - 上下文压缩
  - `lib/agent/state-manager.ts` - 状态管理
  - `lib/agent/persistence.ts` - 持久化
  - `lib/agent/types.ts` - 类型定义

- **新增复杂度分析模块** - `lib/complexity-analyzer.ts` 从 `cli.ts` 提取

- **测试基础设施完善**
  - 15 个测试套件
  - 253 个测试用例
  - Jest 配置覆盖率阈值：statements 60%, branches 45%, functions 60%, lines 60%

---

## [1.2.0] - 2025-01-19

### 🔧 Refactored / 重构

#### 📦 CLI 模块化重构 / CLI Modular Refactoring

**重大改进**：将 1900+ 行的 `cli.ts` 拆分为 10+ 个独立模块，显著提升代码可维护性。

##### 新增模块 / New Modules

| 模块 | 行数 | 职责 |
|------|------|------|
| `lib/constants.ts` | 122 | 常量配置（版本、路径、时间、Agent配置） |
| `lib/error-handler.ts` | 93 | 错误处理、日志记录、敏感信息脱敏 |
| `lib/file-operations.ts` | 277 | 安全文件读写、智能复制、目录操作 |
| `lib/lock-manager.ts` | 224 | 文件锁机制、并发控制、回滚保护 |
| `lib/installer.ts` | 224 | 安装/卸载/更新主流程 |
| `lib/plugin-installer.ts` | 165 | Commands 和 Skills 安装逻辑 |
| `lib/verifier.ts` | 172 | 安装验证和健康检查 |
| `lib/config-commands.ts` | 240 | CLI 配置命令处理 |
| `lib/ui/progress.ts` | 89 | ProgressIndicator 进度显示类 |
| `lib/ui/messages.ts` | 141 | UI 消息输出函数 |

##### 代码质量改进 / Code Quality Improvements

- **版本号动态读取** - 从 `package.json` 动态读取版本号，确保一致性
- **async/await 修复** - 移除 `config-manager.ts` 中不必要的 async 声明
- **类型安全增强** - 引入 `ContextValue`、`ContextRecord`、`MessageRecord`、`CheckpointData` 类型替代 `any`
- **单一职责原则** - 每个模块职责明确，不超过 300 行

##### 重构前后对比 / Before vs After

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| cli.ts 行数 | 1917 行 | 220 行 (-88.5%) |
| 模块数量 | 3 个 | 13 个 |
| 单文件最大行数 | 1917 行 | 617 行 |
| any 类型使用 | 34+ 处 | 显著减少 |

### ✨ Added / 新增

#### 类型系统增强 / Type System Enhancement

在 `types/index.ts` 中新增以下类型定义：

```typescript
// 通用上下文值类型 - 替代 any
export type ContextValue = string | number | boolean | null | ContextValue[] | { [key: string]: ContextValue };

// 上下文记录类型
export type ContextRecord = Record<string, ContextValue>;

// 消息记录类型
export interface MessageRecord { ... }

// 检查点数据类型
export interface CheckpointData { ... }
```

### 🔧 Fixed / 修复

- **版本号硬编码问题** - cli.ts 中的版本号从硬编码改为从 package.json 动态读取
- **async/await 不一致** - config-manager.ts 中 `loadConfig()` 和 `saveConfig()` 移除不必要的 async

---

## [1.1.0] - 2025-01-19

### 🔄 Changed / 变更

#### 🏔️ 愚公移山循环 v2.0 - 重新设计（含 Agent 调用机制）

**重大变更**：循环机制从外部脚本依赖改为内置于 Agent 行为规范中。

##### 问题诊断
旧版本依赖外部工具存在以下问题：
- 依赖 `jq` 工具，Windows 环境通常未安装
- 依赖 `bash` 脚本解析 JSONL，跨平台兼容性差
- Stop Hook 需要读取 transcript 文件，路径解析复杂

##### 新设计（参考 oh-my-opencode）
- **关键词触发**：检测 `ultrawork`/`ulw`/`移山`/`愚公` 等关键词自动激活
- **System Prompt 强化**：循环规则内置于 Agent 行为规范中
- **TODO 强制执行**：通过行为规范而非外部脚本确保任务完成
- **自检机制**：Agent 准备停止前自动检查未完成的 TODO

##### 移除的依赖
- 不再需要 `jq` 工具
- 不再需要创建 `.claude/yishan-loop.local.md` 状态文件
- 不再依赖外部 Stop Hook 脚本

##### Agent 智能分派机制（新增）

愚公作为主编排者，可以调用专业 Agent 协作完成任务：

| 中国文化 Agent | Claude Code subagent_type | 专长 |
|---------------|---------------------------|------|
| 悟空 (wukong) | `explore` | 代码侦察 |
| 诸葛 (zhuge) | `oracle` | 架构顾问 |
| 鲁班 (luban) | `general` | 代码实现 |
| 扁鹊 (bianque) | `debugger` | Bug诊断 |
| 司马迁 (simaqian) | `document-writer` | 文档撰写 |
| 顾恺之 (gukaizhi) | `frontend-ui-ux-engineer` | UI/UX |
| 包拯 (baozheng) | `test-engineer` | 测试 |
| 魏征 (weizheng) | `code-reviewer` | 代码审查 |

调用示例：
```
Task(subagent_type="explore", prompt="悟空：探索代码结构...")
Task(subagent_type="oracle", prompt="诸葛：设计架构方案...")
```

##### 对应 oh-my-opencode 机制
| oh-my-opencode | oh-my-claude |
|----------------|--------------|
| ultrawork / ulw | ultrawork / ulw / 移山 |
| Sisyphus | 愚公 (YuGong) |
| explore agent | 悟空 (WuKong) |
| oracle agent | 诸葛 (ZhuGe) |
| delegate_task() | Task(subagent_type=...) |
| Todo Continuation Enforcer | TODO 强制执行规则 |
| Ralph Loop | 移山循环 |

#### 文件变更
- `skills/yishan/SKILL.md` - 重写为 v2.0 规范，包含 Agent 调用机制
- `skills/yishan/skill.json` - 更新为 v2.0 配置
- `skills/yishan/agent-mapping.json` - **新增** Agent 映射表
- `commands/yishan.md` - 简化并加入 Agent 调用示例
- `commands/yugong.md` - 同步更新
- `hooks/hooks.json` - 移除 Stop hooks 中的外部脚本依赖
- `hooks/keyword-detector.sh` - 增强 ultrawork 模式消息

### ⚠️ Deprecated / 废弃

以下文件已废弃，保留仅供参考：
- `hooks/yishan-stop-hook.sh` - v1.0 外部循环控制脚本
- `hooks/yishan-stop-hook.ps1` - PowerShell 版本
- `hooks/todo-enforcer.sh` - 外部 TODO 检查脚本

---

## [1.0.19] - 2025-01-16

### ✨ Added / 新增

#### 🏔️ 愚公移山循环 (Yishan Loop) - 自主持续执行机制
- **Stop Hook 拦截机制** - 当 Claude 尝试停止时，自动检查任务是否完成
- **完成标记检测** - 通过 `<promise>...</promise>` 标签精确判断任务完成状态
- **迭代次数控制** - 支持设置最大迭代次数，防止无限循环
- **跨平台支持** - 提供 Bash 和 PowerShell 两个版本的 Stop Hook
- **状态文件管理** - 使用 `.claude/yishan-loop.local.md` 存储循环状态

#### 新增文件 / New Files
- `hooks/yishan-stop-hook.sh` - Bash 版本的 Stop Hook
- `hooks/yishan-stop-hook.ps1` - PowerShell 版本的 Stop Hook
- `commands/cancel-yishan.md` - 取消循环命令
- `scripts/setup-yishan-loop.sh` - 循环初始化脚本
- `skills/yishan/` - 愚公移山技能配置

#### 命令更新 / Command Updates
- 更新 `/yishan` 和 `/yugong` 命令，添加自主循环机制说明
- 新增 `/cancel-yishan` 命令用于取消循环

---

## [1.0.18] - 2025-01-16

### 📦 Release / 发布

- **正式发布版本** - 包含 1.0.17 的所有质量改进
- **npm 包名：`claude-pangu`** - 可通过 `npm install -g claude-pangu` 安装

---

## [1.0.17] - 2025-01-16

### 🔧 Fixed / 修复

#### 版本一致性修复 / Version Consistency Fix
- **统一所有位置的版本号** - 修复 package.json、plugin.json、config-manager.ts、cli.ts 中版本号不一致的问题
- **移除重复的 zod 依赖** - zod 从 devDependencies 中移除，仅保留在 dependencies 中

#### 跨平台兼容性 / Cross-Platform Compatibility
- **修复 Windows 上 clean 脚本不兼容问题** - 使用 rimraf 替代 rm -rf，确保跨平台兼容
- **添加 rimraf 作为开发依赖** - 提供跨平台的目录删除功能

#### 代码质量改进 / Code Quality Improvements
- **消除类型重复定义** - cli.ts 现在从 types/index.ts 导入类型，避免重复定义
- **替换过时的 substr 方法** - 将所有 `.substr(2, 9)` 替换为 `.substring(2, 11)`，遵循现代 JavaScript 标准
- **修复 postinstall.cjs** - CJS 模块不再尝试导入 ESM logger，改为内联颜色定义
- **更新测试文件版本号** - 测试用例中的版本号与实际版本保持同步

### 📦 Dependencies / 依赖变更

#### Added / 新增
- `rimraf@^5.0.5` (devDependency) - 跨平台目录删除工具

#### Removed / 移除
- `zod` from devDependencies (保留在 dependencies 中)

---

## [1.0.10] - 2025-01-16

### ✨ Added / 新增

#### 🔷 Complete TypeScript Migration / 完整 TypeScript 迁移
- **Type Safety Throughout** - 完整的类型安全，支持 IntelliSense 和编译时检查
- **Modern JavaScript/TypeScript** - 使用现代 JS/TS 模式和最佳实践
- **Enhanced Development Experience** - 提升开发体验，减少运行时错误

#### 🏗️ Agent State Management System / Agent 状态管理系统
- **Multi-Agent Collaboration Tracking** - 高级多 Agent 协作追踪
- **Intelligent Context Compression** - 智能上下文压缩和内存管理
- **Real-time Performance Monitoring** - 实时性能监控和分析
- **Session Persistence and Recovery** - 会话持久化和恢复机制

#### ⚙️ Hierarchical Configuration System / 分层配置系统
- **Hot Reload Support** - 配置变更立即生效，无需重启
- **Environment Variable Overrides** - 支持 `OH_MY_CLAUDE_*` 环境变量覆盖
- **Multiple Config Sources** - 环境 → 项目 → 用户 → 全局 → 默认配置层级
- **Type-Safe Validation** - 完整的 Zod 模式验证和错误提示

#### 🛠️ Configuration CLI Commands / 配置管理 CLI 命令
- **`oh-my-claude config show`** - 显示当前完整配置
- **`oh-my-claude config get <key>`** - 获取特定配置值
- **`oh-my-claude config set <key> <value>`** - 设置配置值
- **`oh-my-claude config save [file]`** - 保存配置到文件
- **`oh-my-claude config reset`** - 重置为默认配置

#### 📁 Configuration Examples / 配置示例
- **Development Config** - 开发环境配置（调试友好，扩展超时）
- **Production Config** - 生产环境配置（性能优化，严格安全）
- **Minimal Config** - 最小化配置（适合新用户）

### 🔧 Technical Improvements / 技术改进

#### 🏗️ Modular Architecture / 模块化架构
- **Separated Concerns** - 职责分离，专用模块
- **Maintainability & Extensibility** - 提升可维护性和扩展性
- **Better Error Handling** - 改进错误处理和恢复

#### 🧪 Comprehensive Testing Suite / 完善测试套件
- **80%+ Code Coverage** - 80%+ 代码覆盖率
- **31 Test Cases** - 31 个测试用例覆盖主要功能
- **Integration Tests** - CLI 命令集成测试
- **Automated CI/CD** - 自动化测试和发布流程

#### 🚀 CI/CD Pipeline / CI/CD 流水线
- **GitHub Actions** - 自动化测试、多平台构建
- **Cross-Platform Builds** - Linux/Windows/macOS 支持
- **Security Scanning** - 自动化安全扫描和依赖更新

#### 📚 Enhanced Documentation / 增强文档
- **Complete API Docs** - 完整的 API 文档
- **Developer Guides** - 开发者指南和贡献指南
- **Configuration Tutorials** - 配置教程和示例

### 🔄 Migration Guide / 迁移指南

#### From v1.0.9 and earlier / 从 v1.0.9 及更早版本
- **Backward Compatible** - 完全向后兼容，所有现有功能保留
- **Automatic Migration** - 配置系统自动处理旧设置
- **Enhanced CLI** - 在现有命令基础上新增配置管理命令

#### Breaking Changes / 破坏性变更
- CLI 现在需要 TypeScript 运行时环境
- 某些内部 API 已重构（不影响用户界面）

### 📦 Installation & Usage / 安装和使用

#### npm Installation / npm 安装
```bash
npm install -g claude-pangu@1.0.10
```

#### Configuration Usage / 配置使用
```bash
# View current config / 查看当前配置
claude-pangu config show

# Get specific values / 获取特定值
claude-pangu config get debug
claude-pangu config get agents.defaultTimeout

# Set configuration / 设置配置
claude-pangu config set debug true
claude-pangu config set agents.defaultTimeout 60000

# Save configuration / 保存配置
claude-pangu config save
```

### 🤝 Contributing / 贡献

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## [1.0.9] - 2025-01-16

### Fixed / 修复

- **修复 macOS 上命令无法识别的问题** - 移除子目录命名空间并添加故障排除指南
  - **根因分析**：
    - 问题一：Claude Code 子目录命名空间 Bug ([Issue #2422](https://github.com/anthropics/claude-code/issues/2422)) - 状态 NOT_PLANNED
    - 问题二：macOS 命令发现 Bug ([Issue #13906](https://github.com/anthropics/claude-code/issues/13906)) - 缓存损坏导致命令不加载
  - **修复措施**：
    - 移除 `zcf` 子目录，commands 直接安装到 `~/.claude/commands/`
    - 更新时自动清理旧版本的 `zcf` 子目录
    - 显示命令格式变更提示（`/zcf:yishan` → `/yishan`）
  - **新增故障排除指南**：
    - macOS 特定提示：清除 `~/.claude.json` 缓存
    - 详细的三步排查流程
    - 安装位置验证命令

---

## [1.0.8] - 2025-01-16

### Fixed / 修复

- **修复 npm 安装后命令不生效的问题** - `cli.js` 的 install/update 命令未将文件安装到正确位置
  - 问题：npm 安装方式 (`npx claude-pangu install`) 只安装到 plugins 目录，未安装到 commands 目录
  - 原因：curl 安装脚本会安装到 `~/.claude/commands/zcf/`，但 npm 方式缺少这一步骤
  - 修复：现在 npm 安装也会将 commands 复制到 `~/.claude/commands/zcf/`
  - 同时安装 skills 到 `~/.claude/skills/`
  - 安装后自动验证关键文件是否正确安装
  - 显示更明确的重启提示（macOS 需要 Cmd+Q 完全退出）

---

## [1.0.7] - 2025-01-16

### Added / 新增

- **安装验证功能** - 安装完成后自动验证关键文件是否正确安装
  - 检查 yishan.md 是否存在
  - 统计已安装的命令数量
  - 如有问题会显示警告信息

### Changed / 变更

- **更明确的重启提示** - 强调需要"完全退出"而非仅关闭窗口
  - macOS 用户需要 Cmd+Q 完全退出应用
  - 仅关闭窗口可能不会重新加载命令

---

## [1.0.6] - 2025-01-16

### Fixed / 修复

- **修复 CLI 版本号未同步的问题** - `cli.js` 中的 VERSION 常量未与 `package.json` 同步
  - 导致 `npx claude-pangu update` 显示错误的版本号
  - 现已修复，版本号正确显示为 1.0.6

---

## [1.0.5] - 2025-01-16

### Fixed / 修复

- **修复 macOS 安装后命令不生效的问题** - 添加重启提示
  - 安装完成后显示明确提示：请重启 Claude Code 以加载新命令
  - Claude Code 需要重启才能识别新安装的 slash commands 和 skills
  - 同时更新 install.sh 和 install.ps1 脚本

---

## [1.0.4] - 2025-01-16

### Fixed / 修复

- **修复安装后自动启动 Claude Code 的问题** - 移除 `claude plugins install` 命令
  - 安装完成后不再自动启动 Claude Code
  - 不再自动输入 "plugins" 到 Claude Code
  - Commands 和 Skills 已直接安装到标准目录，无需额外注册

### Changed / 变更

- 安装脚本优化：commands 安装到 `~/.claude/commands/zcf/`
- 安装脚本优化：skills 安装到 `~/.claude/skills/`
- 使用 `/zcf:` 前缀调用命令（如 `/zcf:yishan`）

---

## [1.0.3] - 2025-01-16

### Fixed / 修复

- 修复 commands 安装路径问题
- 修复 skills 安装路径问题

---

## [1.0.2] - 2025-01-16

### Changed / 变更

- 版本号同步

---

## [1.0.1] - 2025-01-16

### Fixed / 修复

- 修复安装路径问题
- 新增三位 Agent

---

## [1.0.0] - 2025-01-15 🎉

### 🎊 首个正式版发布 / First Stable Release

经过多次迭代和完善，oh-my-claude 正式发布 1.0.0 稳定版！

After multiple iterations and improvements, oh-my-claude officially releases version 1.0.0!

### Added / 新增

#### 📦 npm 包发布 / npm Package Release

- **npm 包名**: `claude-pangu`（盘古开天辟地）
- **安装命令**: `npx claude-pangu install`
- 支持 npm / bun / pnpm 安装
- 双命令入口：`claude-pangu` 和 `oh-my-claude` 都可使用

### Changed / 变更

- npm 包名从 `oh-my-claude` 更改为 `claude-pangu`（因原名已被占用）
- README 安装文档更新，npm/npx 安装方式提升为首选推荐
- 安装方式重新编号（共 6 种安装方式）

### Highlights / 亮点

- ✅ **18 个专业 Agent** - 覆盖软件开发全生命周期
- ✅ **6 种安装方式** - npm/npx、curl/PowerShell 一键安装、Homebrew、Scoop、手动安装
- ✅ **中英双语支持** - 所有命令和响应支持中英文
- ✅ **智能 Hook 系统** - Todo 强制执行、关键词自动激活
- ✅ **可视化进度面板** - ASCII 进度条和任务追踪
- ✅ **跨平台兼容** - Windows、macOS、Linux 全支持

---

## [0.9.0] - 2025-01-15

### Added / 新增

#### 🎭 新增 Agent / New Agents

- **李白 (LiBai)** - 需求炼金师 Agent
  - 需求分析与梳理
  - 用户故事编写
  - 产品功能规划
  - 模糊想法具象化
  - 命令: `/libai` `/poet`

- **顾恺之 (GuKaiZhi)** - 界面美学师 Agent
  - UI 界面设计评审
  - 用户体验优化建议
  - 组件设计与样式规范
  - 设计系统构建
  - 命令: `/gukaizhi` `/painter`

- **嫦娥 (ChangE)** - 云端仙子 Agent
  - 云服务架构设计 (AWS/Azure/GCP/阿里云)
  - DevOps 流水线配置
  - 容器化与 Kubernetes 部署
  - 基础设施即代码 (IaC)
  - 命令: `/change` `/cloud`

现在 Agent 总数：**18 个**，覆盖软件开发全生命周期。

---

## [0.8.2] - 2025-01-15

### Added / 新增

#### 🛠️ CLI 命令增强 / CLI Command Enhancements

- **`update` 命令** - 更新插件到最新版本
  - 别名: `upgrade`, `up`
  - 自动检测版本差异
  - 智能更新（保留用户配置）

- **`verify` 命令** - 验证安装是否正确
  - 别名: `check`, `doctor`
  - 检查目录结构完整性
  - 验证核心文件存在
  - 检查 Claude Code CLI 可用性

#### 📄 开发者工具 / Developer Tools

- **版本同步脚本** (`scripts/sync-version.js`)
  - 一键同步所有配置文件中的版本号
  - 支持 package.json、cli.js、Homebrew、Scoop
  - 自动验证版本号格式

- **故障排查文档** (`TROUBLESHOOTING.md`)
  - 常见安装问题及解决方案
  - 运行时问题排查指南
  - 权限问题处理
  - 完全重装步骤

- **npm 发布优化** (`.npmignore`)
  - 排除开发文件，减小包体积
  - 保留核心插件文件

#### 🔒 安全增强 / Security Enhancements

- **并发锁机制** - 防止多个 CLI 实例同时操作导致数据损坏
  - 使用文件锁实现互斥
  - 支持锁超时和陈旧锁检测
  - 可重入锁（同一进程多次获取）

- **命令注入防护** - 使用 `spawnSync` 替代 `execSync`
  - 禁用 shell 模式，参数数组传递
  - 适用于 `registerPlugin` 和 `uninstall` 函数

- **路径遍历防护增强** - `todo-enforcer.sh` 使用 `realpath/readlink`
  - 规范化路径后再验证
  - 防止符号链接绕过

- **日志脱敏** - `logErrorToFile` 函数自动脱敏敏感信息
  - 替换用户主目录路径
  - 替换用户名
  - 隐藏长 hex/base64 字符串（可能是 token）

### Fixed / 修复

- 修复 Scoop manifest 中变量引用错误 (`$dir_$dir` → `Join-Path`)
- 修复 plugin.json 版本号与 package.json 不一致问题
- 修复 verify 命令中 manifest 路径错误（`manifest.json` → `plugin.json`）
- 改进全局错误处理，始终显示完整堆栈信息
- 添加错误日志文件记录（位于临时目录）
- 添加安装回滚机制，失败时自动恢复（cli.js/install.sh/install.ps1 三处统一实现）
- 加强 hook 脚本路径安全验证（防止命令注入和路径遍历攻击）
- 修复 todo-enforcer.sh 在 Windows/WSL/Git Bash 环境下路径验证问题

### Changed / 变更

- CLI 帮助信息更新，展示新命令
- 未知命令现在会显示错误提示并输出帮助
- 重构 cli.js，抽取 `executeWithRollback` 公共函数消除重复代码
- 安装脚本增加重试机制（3 次重试 + 指数退避）
- 安装失败时提供详细的故障排除建议
- plugin.json 添加完整元数据（contributors、repository、engines 等）
- 卸载命令增加确认提示（可用 `-y` 跳过）
- 错误信息增加用户友好的说明（EACCES/EPERM/ENOSPC 等错误码映射为中文提示）

### Performance / 性能优化

- **大文件流式复制** - 超过 1MB 的文件使用流式复制
  - 减少内存占用
  - 保留文件时间戳

- **进度反馈机制** - `ProgressIndicator` 类
  - 交互式终端显示进度条
  - 非交互式终端显示步骤日志
  - 显示操作耗时

- **代码质量改进**
  - 提取硬编码魔数为常量（锁超时、缓冲区大小等）
  - 空目录处理优化（可选保留空目录）
  - GitHub 仓库地址统一为常量

---

## [0.8.1] - 2025-01-15

### Added / 新增

#### 📦 多种安装方式 / Multiple Installation Methods

- **一键安装脚本 / One-line Install Scripts**
  - Bash 脚本 (macOS/Linux): `curl -fsSL ... | bash`
  - PowerShell 脚本 (Windows): `irm ... | iex`

- **npm/bun/pnpm 支持 / npm/bun/pnpm Support**
  - `npx oh-my-claude install`
  - `bunx oh-my-claude install`
  - `pnpm dlx oh-my-claude install`

- **Homebrew 支持 (macOS) / Homebrew Support**
  - `brew tap ZDragon17/oh-my-claude && brew install oh-my-claude`

- **Scoop 支持 (Windows) / Scoop Support**
  - `scoop bucket add oh-my-claude && scoop install oh-my-claude`

#### 🛠️ CLI 工具 / CLI Tool

- 新增 `oh-my-claude` CLI 命令
- 支持 `install`, `uninstall`, `version`, `help` 子命令
- 跨平台支持 (Windows, macOS, Linux)

### Changed / 变更

- 更新 README 安装文档，提供 5 种安装方式
- 新增 `scripts/` 目录存放安装脚本
- 新增 `homebrew/` 目录存放 Homebrew Formula
- 新增 `scoop/` 目录存放 Scoop manifest

---

## [0.8.0] - 2025-01-15

### Added / 新增

#### 🎭 新 Agent / New Agents

- **包拯 (BaoZheng)** - 测试专家 / Testing Expert
  - 单元测试设计和实现 / Unit test design and implementation
  - 集成测试和 E2E 测试 / Integration and E2E testing
  - TDD 测试驱动开发指导 / TDD guidance
  - 测试覆盖率分析 / Test coverage analysis

- **魏征 (WeiZheng)** - 代码审查专家 / Code Review Expert
  - 代码规范检查 / Code standards checking
  - 逻辑审查和设计评审 / Logic and design review
  - 最佳实践指导 / Best practices guidance
  - 分级反馈（MUST/SHOULD/COULD/NICE）/ Graded feedback

- **仓颉 (CangJie)** - 数据库专家 / Database Expert
  - 数据建模和表结构设计 / Data modeling and schema design
  - SQL 查询优化 / SQL query optimization
  - 数据库迁移策略 / Database migration strategies
  - 索引设计和性能调优 / Index design and performance tuning

#### ⚡ 新命令 / New Commands

- `/baozheng` (`/kaifeng`, `/test`, `/tdd`, `/包拯`, `/开封`, `/测试`) - 包拯测试模式
- `/weizheng` (`/jian`, `/review`, `/cr`, `/魏征`, `/谏`, `/审查`) - 魏征代码审查模式
- `/cangjie` (`/zaozi`, `/database`, `/db`, `/sql`, `/仓颉`, `/造字`, `/数据库`) - 仓颉数据库模式

#### 🪝 Hook 增强 / Hook Enhancements

- **测试关键词检测** - 检测 "测试"、"test"、"TDD"、"coverage" 等关键词
- **审查关键词检测** - 检测 "审查"、"review"、"CR"、"PR" 等关键词
- **数据库关键词检测** - 检测 "数据库"、"SQL"、"索引"、"migration" 等关键词

### Changed / 变更

- Agent 数量从 12 个增加到 15 个
- 更新 bilingual skill 支持新命令别名
- 更新 keyword-detector hook 支持新关键词

---

## [0.7.0] - 2025-01-15

### Added / 新增

#### 🎭 新 Agent / New Agent

- **老子 (LaoZi)** - 简洁之道大师 / Code Simplicity Master
  - 代码简化（识别并简化过度复杂的代码）/ Code simplification
  - Clean Code 原则检查 / Clean Code principle checking
  - KISS、YAGNI、DRY 原则应用 / KISS, YAGNI, DRY principles
  - 代码异味检测与重构建议 / Code smell detection and refactoring

#### ⚡ 新命令 / New Commands

- `/laozi` (`/daodejing`, `/simplify`, `/clean`, `/老子`, `/道德经`, `/简洁`, `/至简`) - 老子简洁之道模式

#### 🪝 Hook 增强 / Hook Enhancements

- **代码简化关键词检测** - 检测 "简洁"、"简化"、"重构"、"KISS"、"clean code" 等关键词

### Changed / 变更

- Agent 数量从 11 个增加到 12 个
- 更新 bilingual skill 支持新命令别名
- 更新 keyword-detector hook 支持代码简化关键词

---

## [0.6.0] - 2025-01-15

### Added / 新增

#### 🎭 新 Agent / New Agents

- **郑和 (ZhengHe)** - API 远航家 / API Integration Expert
  - API 集成（REST、GraphQL、WebSocket、gRPC）/ API integration
  - SDK 封装与客户端库设计 / SDK wrapping and client library design
  - 错误处理与重试策略 / Error handling and retry strategies
  - 数据转换与映射 / Data transformation and mapping

- **张衡 (ZhangHeng)** - 监控观测家 / Monitoring & Observability Expert
  - 系统监控（CPU、内存、磁盘、网络）/ System monitoring
  - 日志分析与结构化日志 / Log analysis and structured logging
  - 链路追踪与分布式追踪 / Distributed tracing
  - 告警配置与通知策略 / Alert configuration

- **李冰 (LiBing)** - DevOps 水利家 / DevOps & Infrastructure Expert
  - CI/CD 流水线（GitHub Actions、GitLab CI）/ CI/CD pipelines
  - 容器化部署（Docker、Kubernetes）/ Container deployment
  - 基础设施即代码（Terraform、Pulumi）/ Infrastructure as Code
  - 自动化运维脚本 / Automation scripts

#### ⚡ 新命令 / New Commands

- `/zhenghe` (`/xiyang`, `/api`, `/integrate`, `/郑和`, `/西洋`, `/接口`) - 郑和 API 模式
- `/zhangheng` (`/didongyi`, `/monitor`, `/observe`, `/张衡`, `/地动仪`, `/监控`) - 张衡监控模式
- `/libing` (`/dujiangyan`, `/devops`, `/cicd`, `/李冰`, `/都江堰`, `/运维`) - 李冰 DevOps 模式

#### 🪝 Hook 增强 / Hook Enhancements

- **API 关键词检测** - 检测 "API"、"接口"、"集成"、"webhook" 等关键词
- **监控关键词检测** - 检测 "监控"、"日志"、"告警"、"prometheus" 等关键词
- **DevOps 关键词检测** - 检测 "devops"、"docker"、"kubernetes"、"pipeline" 等关键词

### Changed / 变更

- Agent 数量从 8 个增加到 11 个
- 更新 bilingual skill 支持新命令别名
- 更新 keyword-detector hook 支持新关键词

---

## [0.5.0] - 2025-01-15

### Added / 新增

#### 🎭 新 Agent / New Agent

- **司马迁 (SimaQian)** - 文档史官 / Documentation Historian
  - 技术文档撰写（README、API 文档、架构文档）/ Technical documentation
  - 变更记录（CHANGELOG、Release Notes）/ Change logging
  - 代码注释（JSDoc、TSDoc）/ Code comments
  - 知识整理（ADR、FAQ）/ Knowledge organization

#### ⚡ 新命令 / New Commands

- `/simaqian` (`/shiji`, `/document`, `/doc`, `/司马迁`, `/史记`) - 司马迁文档模式

#### 🪝 Hook 增强 / Hook Enhancements

- **文档关键词检测** - 检测 "文档"、"注释"、"document"、"changelog" 等关键词

### Changed / 变更

- Agent 数量从 7 个增加到 8 个
- 更新 bilingual skill 支持新命令别名
- 更新 keyword-detector hook 支持文档关键词

---

## [0.4.0] - 2025-01-15

### Added / 新增

#### 📊 可视化进度面板 / Visual Progress Dashboard

- **`/progress` 命令** - 显示任务执行进度的可视化面板
  - 完整模式：ASCII 艺术边框的详细面板
  - 简洁模式：单行进度显示
  - 统计模式：任务统计数据
  - 别名：`/进度`, `/dashboard`, `/面板`, `/status`

- **ASCII 进度条** - 30 字符宽度的可视化进度条
  - `████████████░░░░░░░░░░░░░░░░░░ 40%`
  - 里程碑 Emoji：🚀(0-25%) 💪(26-50%) 🎯(51-75%) 🏃(76-99%) 🎉(100%)

- **状态图标系统**
  - ✅ 已完成 | 🔄 进行中 | ⏳ 待处理 | 🚫 被阻塞

- **Agent 图标**
  - 🏔️ 愚公 | 🎯 诸葛 | 🔧 鲁班 | 🔍 悟空 | 🩺 扁鹊 | 🛡️ 墨子 | ⚔️ 孙子

#### ⚡ 新命令 / New Commands

- `/progress` (`/进度`, `/dashboard`, `/面板`, `/status`) - 可视化进度面板

#### 🛠️ 新 Skill / New Skills

- **progress** - 进度面板生成技能，支持多种展示模式

### Changed / 变更

- 更新 bilingual skill 支持 `/progress` 命令别名
- 总命令数从 8 个增加到 9 个

---

## [0.3.0] - 2025-01-15

### Added / 新增

#### 🎭 新 Agent / New Agents

- **墨子 (MoZi)** - 安全防御专家 / Security Defense Expert
  - 漏洞检测（SQL 注入、XSS、CSRF 等）/ Vulnerability detection
  - 防御性编程建议 / Defensive programming advice
  - OWASP Top 10 安全审计 / OWASP Top 10 security audit
  - 安全加固方案 / Security hardening solutions

- **孙子 (SunZi)** - 性能优化专家 / Performance Optimization Expert
  - 性能分析和瓶颈定位 / Performance analysis and bottleneck identification
  - 优化策略制定（缓存、异步、索引等）/ Optimization strategies
  - 资源使用分析 / Resource usage analysis
  - 优化效果验证 / Optimization verification

#### ⚡ 新命令 / New Commands

- `/mozi` (`/security`, `/audit`, `/墨子`, `/安全`) - 墨子安全审计模式
- `/sunzi` (`/performance`, `/perf`, `/孙子`, `/性能`, `/优化`) - 孙子性能优化模式

#### 🪝 Hook 增强 / Hook Enhancements

- **安全关键词检测** - 检测 "安全"、"漏洞"、"security" 等关键词
- **性能关键词检测** - 检测 "性能"、"优化"、"performance" 等关键词

### Changed / 变更

- Agent 数量从 5 个增加到 7 个
- 更新团队协作支持新 Agent（@mozi、@sunzi）
- 更新 bilingual skill 支持新命令别名

---

## [0.2.0] - 2025-01-15

### Added / 新增

#### 🤝 Agent 协作增强 / Agent Collaboration

- **Agent 调用语法** - 使用 `@agent_name` 在 Agent 间调用协作
  - `@wukong` - 召唤悟空探索代码
  - `@zhuge` - 召唤诸葛设计架构
  - `@luban` - 召唤鲁班实现代码
  - `@bianque` - 召唤扁鹊诊断问题
  - `@yugong` - 召唤愚公编排任务

- **协作响应格式** - 标准化的任务交接格式

- **协作决策树** - 根据任务类型自动选择合适的 Agent

#### ⚡ 新命令 / New Commands

- `/team` (`/teamwork`, `/协作`, `/合作`, `/团队`) - 启动多 Agent 团队协作模式
  - 愚公作为主编排者协调各专家
  - 支持链式协作和并行协作
  - 自动任务分配和结果汇总

#### 🪝 Hook 增强 / Hook Enhancements

- **团队协作关键词检测** - 检测 "团队"、"协作"、"teamwork" 等关键词
- 自动提示使用 `/team` 命令

### Changed / 变更

- 更新 Agent 定义文件，添加协作响应格式
- 增强 AGENT_PROTOCOL.md 协作协议文档
- 更新 bilingual skill 支持 /team 命令别名

### Documentation / 文档

- 新增协作场景示例（新功能开发、Bug 修复、架构重构）
- 新增链式协作和并行协作的流程图
- 更新命令速查表

---

## [0.1.0] - 2025-01-15

### Added / 新增

#### 🎭 Agent System / Agent 系统

- **愚公 (YuGong)** - Main orchestrator agent for large-scale tasks / 大规模任务主编排 Agent
  - Persistent execution mode ("不完成，不罢休") / 持续执行模式
  - Automatic task decomposition with TodoWrite integration / TodoWrite 自动任务分解
  - Error recovery and strategy adjustment / 错误恢复和策略调整

- **诸葛 (ZhuGe)** - Strategic advisor agent / 战略顾问 Agent
  - Architecture design consultation / 架构设计咨询
  - Technology selection guidance / 技术选型指导
  - Risk assessment and planning / 风险评估和规划

- **鲁班 (LuBan)** - Craftsman agent / 精工巧匠 Agent
  - Precision code implementation / 精密代码实现
  - Code quality optimization / 代码质量优化
  - Tool and script development / 工具和脚本开发

- **悟空 (WuKong)** - Scout agent / 代码侦察 Agent
  - Fast codebase exploration / 快速代码库探索
  - Pattern recognition and location / 模式识别和定位
  - Dependency tracking / 依赖关系追踪

- **扁鹊 (BianQue)** - Diagnostic agent / Bug 诊断 Agent
  - Bug root cause analysis (望闻问切) / Bug 根因分析
  - Fix recommendations / 修复方案建议
  - Prevention suggestions / 预防措施制定

#### ⚡ Commands / 命令

- `/yishan` (`/yugong`, `/persist`, `/ultrawork`, `/ulw`) - YuGong moving mountains mode / 愚公移山模式
- `/zhuge` (`/longzhong`, `/strategy`, `/consult`) - ZhuGe advisor mode / 诸葛顾问模式
- `/luban` (`/qiaogong`, `/craft`, `/frontend`) - LuBan craftsman mode / 鲁班巧工模式
- `/wukong` (`/huoyan`, `/explore`, `/scout`) - WuKong scout mode / 悟空侦察模式
- `/bianque` (`/wangwen`, `/debug`, `/diagnose`) - BianQue diagnostic mode / 扁鹊诊断模式

#### 🪝 Hook System / Hook 系统

- **Todo Enforcer** - Prevents stopping with incomplete tasks / 阻止未完成任务时停止
- **Keyword Detector** - Auto-activates modes based on keywords / 关键词自动激活模式

#### 🌐 Internationalization / 国际化

- Full Chinese/English bilingual support / 完整中英双语支持
- Language auto-detection for responses / 响应语言自动检测
- Command aliases in both languages / 双语命令别名

### Technical / 技术实现

- Plugin configuration via `.claude-plugin/plugin.json` / 插件配置
- Shell-based hook scripts with jq fallback / 基于 Shell 的 Hook 脚本（支持 jq 回退）
- Markdown-based agent and command definitions / 基于 Markdown 的 Agent 和命令定义
- Cross-platform compatibility (Windows/macOS/Linux) / 跨平台兼容

---

## Version History / 版本历史

| Version / 版本 | Date / 日期 | Highlights / 亮点 |
|----------------|-------------|-------------------|
| 1.6.0 | 2026-01-20 | 🔧 P2 additional hooks: interactive-bash, thinking-validator, agent-reminder / P2 附加 Hooks |
| 1.5.0 | 2026-01-20 | 🛠️ P2 features: JSONC config, notification/backgroundTask config, monitor hooks / P2 增强功能 |
| 1.4.0 | 2026-01-20 | 🔄 P1 features: retry hooks, session recovery, Metis/Prometheus integration / P1 功能对齐 |
| 1.3.0 | 2026-01-20 | 🎯 P0 features: Yugong enhancement, Git Master, Ralph Loop / P0 功能对齐 |
| 1.2.1 | 2025-01-19 | 🧪 Test coverage optimization (253 tests, 75% coverage) / 测试覆盖率优化 |
| 1.2.0 | 2025-01-19 | 🔧 CLI modular refactoring / CLI 模块化重构 |
| 1.1.0 | 2025-01-19 | 🏔️ Yishan Loop v2.0 redesign / 愚公移山循环 v2.0 重新设计 |
| 1.0.0 | 2025-01-15 | 🎉 First stable release, npm package `claude-pangu` / 首个正式版，npm 包 `claude-pangu` |
| 0.9.0 | 2025-01-15 | 3 new agents (LiBai, GuKaiZhi, ChangE) / 新增李白、顾恺之、嫦娥 |
| 0.8.2 | 2025-01-15 | CLI enhancements (update, verify), dev tools / CLI 增强，开发者工具 |
| 0.8.1 | 2025-01-15 | Multiple install methods / 多种安装方式 |
| 0.8.0 | 2025-01-15 | 3 new agents (BaoZheng, WeiZheng, CangJie) / 新增包拯、魏征、仓颉 |
| 0.7.0 | 2025-01-15 | LaoZi agent (code simplicity) / 老子简洁之道大师 |
| 0.6.0 | 2025-01-15 | 3 new agents (ZhengHe, ZhangHeng, LiBing) / 新增郑和、张衡、李冰 |
| 0.5.0 | 2025-01-15 | SimaQian agent (documentation) / 司马迁文档史官 |
| 0.4.0 | 2025-01-15 | Visual progress dashboard / 可视化进度面板 |
| 0.3.0 | 2025-01-15 | 2 new agents (MoZi, SunZi) / 新增墨子、孙子 Agent |
| 0.2.0 | 2025-01-15 | Agent collaboration & /team command / Agent 协作增强和 /team 命令 |
| 0.1.0 | 2025-01-15 | Initial release with 5 agents / 首次发布，包含 5 个 Agent |

---

<div align="center">

**愚公精神：坚持必将成功 🏔️**

**YuGong Spirit: Persistence Leads to Success**

</div>
