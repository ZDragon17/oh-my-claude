# oh-my-claude vs oh-my-opencode 差距分析报告

> 生成时间: 2026-01-20  
> 分析版本: oh-my-claude v1.6.0 vs oh-my-opencode v3.0.0-beta
> 更新时间: 2026-01-20 - Phase 1-4 实施完成

## 概述

本报告对比分析 oh-my-claude（以下简称 OMC）与 oh-my-opencode（以下简称 OMO）的功能差异，识别需要完善的差距，并提出改进建议。

**注意**: 用户明确表示"除了不能支持多模型以外"，因此多模型相关功能不在对齐范围内。

---

## 一、核心架构对比

| 维度 | oh-my-opencode | oh-my-claude | 状态 |
|------|---------------|--------------|------|
| **运行时** | Bun (TypeScript) | Node.js (TypeScript) | ✅ 等效 |
| **插件格式** | OpenCode Plugin | Claude Code Plugin | ✅ 已适配 |
| **配置格式** | JSONC (带注释) | JSON | ⚠️ 需升级 |
| **Agent 系统** | 7 核心 Agent | 18 专业化 Agent | ✅ 已超越 |
| **模型支持** | Claude/GPT/Gemini/Grok | 仅 Claude | 🔵 设计差异 |

---

## 二、功能对比矩阵

### 2.1 Agent 系统

| 功能 | OMO | OMC | 差距 | 优先级 |
|------|-----|-----|------|--------|
| **Sisyphus 主编排 Agent** | ✅ 高级编排逻辑 | ✅ 愚公 | ⚠️ 提示词差距 | P0 |
| **Oracle 顾问 Agent** | ✅ GPT 5.2 Medium | ✅ 诸葛 | ✅ 等效 | - |
| **Explore 探索 Agent** | ✅ Grok Code | ✅ 悟空 | ✅ 等效 | - |
| **Librarian 文档 Agent** | ✅ Claude Sonnet | ✅ 司马迁 | ✅ 等效 | - |
| **Frontend UI/UX Agent** | ✅ Gemini 3 Pro | ✅ 顾恺之 | ✅ 等效 | - |
| **Document Writer** | ✅ | ✅ 司马迁 | ✅ 等效 | - |
| **Metis 规划 Agent** | ✅ | ❌ | ⚠️ 缺失 | P1 |
| **Momus 批评 Agent** | ✅ | ❌ | ⚠️ 缺失 | P2 |
| **Atlas 编排 Agent** | ✅ v3 Beta | ❌ | ⚠️ 缺失 | P1 |
| **Prometheus 规划器** | ✅ | ❌ | ⚠️ 缺失 | P1 |

### 2.2 内置命令/斜杠命令

| 命令 | OMO | OMC | 差距 | 优先级 |
|------|-----|-----|------|--------|
| `/ultrawork` `/ulw` | ✅ | ✅ `/yishan` | ✅ 等效 | - |
| `/ralph-loop` | ✅ 自引用循环 | ⚠️ 部分实现 | ⚠️ 需完善 | P0 |
| `/cancel-ralph` | ✅ | ✅ `/cancel-yishan` | ✅ 等效 | - |
| `/init-deep` | ✅ 深度初始化 | ❌ | ⚠️ 缺失 | P1 |
| `/start-work` | ✅ 开始工作流 | ❌ | ⚠️ 缺失 | P1 |
| `/refactor` | ✅ 重构模板 | ❌ | ⚠️ 缺失 | P1 |
| `/progress` | ❌ | ✅ | ✅ 已超越 | - |
| `/team` | ❌ | ✅ | ✅ 已超越 | - |

### 2.3 内置技能 (Built-in Skills)

| 技能 | OMO | OMC | 差距 | 优先级 |
|------|-----|-----|------|--------|
| **Git Master** | ✅ 智能 Git 操作 | ❌ | ⚠️ 缺失 | P0 |
| **Frontend UI/UX** | ✅ | ✅ | ✅ 等效 | - |
| **Progress** | ❌ | ✅ | ✅ 已超越 | - |
| **Bilingual** | ❌ | ✅ | ✅ 已超越 | - |

### 2.4 工具系统 (Tools)

| 工具 | OMO | OMC | 差距 | 优先级 |
|------|-----|-----|------|--------|
| **background_task** | ✅ 完整实现 | ⚠️ 通过 Task 调用 | ⚠️ 需独立工具 | P0 |
| **background_output** | ✅ | ⚠️ 通过 Task 调用 | ⚠️ 需独立工具 | P0 |
| **background_cancel** | ✅ | ⚠️ 通过 Task 调用 | ⚠️ 需独立工具 | P0 |
| **call_omo_agent** | ✅ 专用 Agent 调用 | ⚠️ Task 工具 | ⚠️ 命名差异 | P2 |
| **delegate_task** | ✅ 任务委派 | ⚠️ Task 工具 | ⚠️ 命名差异 | P2 |
| **lsp_* 系列** | ✅ 11+ 工具 | ✅ lsp-tools.sh | ✅ 等效 | - |
| **ast_grep_*系列** | ✅ | ✅ ast-grep.sh | ✅ 等效 | - |
| **glob / grep** | ✅ | ✅ | ✅ 等效 | - |
| **interactive_bash** | ✅ tmux 会话 | ⚠️ 通过 Hook | ⚠️ 需工具化 | P1 |
| **session_manager** | ✅ 会话管理 | ✅ lib/agent/session-manager.ts | ✅ 等效 | - |
| **skill** | ✅ | ✅ | ✅ 等效 | - |
| **skill_mcp** | ✅ | ⚠️ 需确认 | ⚠️ 待验证 | P2 |
| **look_at** | ✅ 多模态分析 | ⚠️ 需确认 | ⚠️ 待验证 | P2 |

### 2.5 Hook 系统

| Hook | OMO | OMC | 差距 | 优先级 |
|------|-----|-----|------|--------|
| **todo-continuation-enforcer** | ✅ | ✅ todo-continuation.sh | ✅ 等效 | - |
| **keyword-detector** | ✅ | ✅ keyword-detector.sh | ✅ 等效 | - |
| **ralph-loop** | ✅ 独立 Hook | ⚠️ 集成在 todo-continuation | ⚠️ 需分离 | P1 |
| **rules-injector** | ✅ | ✅ | ✅ 等效 | - |
| **directory-agents-injector** | ✅ | ✅ | ✅ 等效 | - |
| **think-mode** | ✅ | ✅ | ✅ 等效 | - |
| **auto-update-checker** | ✅ | ✅ | ✅ 等效 | - |
| **tool-output-truncator** | ✅ | ✅ | ✅ 等效 | - |
| **background-compaction** | ✅ | ✅ preemptive-compaction | ✅ 等效 | - |
| **background-notification** | ✅ 任务完成通知 | ⚠️ 通过 systemMessage | ⚠️ 需专用 Hook | P1 |
| **session-recovery** | ✅ 会话恢复 | ⚠️ 通过 error-recovery | ⚠️ 需增强 | P1 |
| **thinking-block-validator** | ✅ | ⚠️ 部分实现 | ⚠️ 需完善 | P2 |
| **delegate-task-retry** | ✅ 自动重试 | ❌ | ⚠️ 缺失 | P1 |
| **edit-error-recovery** | ✅ 编辑错误恢复 | ⚠️ 通用错误恢复 | ⚠️ 需专用 | P1 |
| **anthropic-context-window-limit-recovery** | ✅ | ⚠️ 通用压缩 | ⚠️ 需专用 | P1 |
| **empty-task-response-detector** | ✅ | ❌ | ⚠️ 缺失 | P2 |
| **comment-checker** | ✅ | ✅ code-quality-checker | ✅ 等效 | - |
| **compaction-context-injector** | ✅ | ⚠️ 集成在压缩 | ⚠️ 需分离 | P2 |
| **agent-usage-reminder** | ✅ | ❌ | ⚠️ 缺失 | P2 |
| **atlas** | ✅ v3 编排 | ❌ | ⚠️ 缺失 | P1 |
| **start-work** | ✅ | ❌ | ⚠️ 缺失 | P1 |
| **prometheus-md-only** | ✅ | ❌ | ⚠️ 缺失 | P2 |
| **task-resume-info** | ✅ | ⚠️ task-checkpointing | ⚠️ 需增强 | P2 |
| **interactive-bash-session** | ✅ | ⚠️ 无专用 Hook | ⚠️ 需实现 | P1 |
| **non-interactive-env** | ✅ | ❌ | ⚠️ 缺失 | P2 |

### 2.6 MCP 服务器集成

| MCP | OMO | OMC | 差距 | 优先级 |
|-----|-----|-----|------|--------|
| **Context7** | ✅ | ✅ | ✅ 等效 | - |
| **Grep.app** | ✅ | ✅ | ✅ 等效 | - |
| **DeepWiki** | ✅ | ✅ | ✅ 等效 | - |
| **Websearch** | ✅ | ✅ | ✅ 等效 | - |
| **Exa** | ✅ | ✅ (待配置) | ✅ 等效 | - |
| **Sequential Thinking** | ✅ | ⚠️ 需确认 | ⚠️ 待验证 | P2 |
| **Memory** | ✅ | ⚠️ 需确认 | ⚠️ 待验证 | P2 |
| **Time** | ✅ | ⚠️ 需确认 | ⚠️ 待验证 | P2 |
| **Apifox** | ✅ | ⚠️ 需确认 | ⚠️ 待验证 | P2 |

### 2.7 配置系统

| 配置项 | OMO | OMC | 差距 | 优先级 |
|--------|-----|-----|------|--------|
| **JSONC 支持** | ✅ 支持注释 | ❌ 纯 JSON | ⚠️ 需升级 | P2 |
| **分层配置** | ✅ | ✅ | ✅ 等效 | - |
| **环境变量覆盖** | ✅ | ✅ | ✅ 等效 | - |
| **热重载** | ✅ | ✅ | ✅ 等效 | - |
| **sisyphus_agent 配置** | ✅ | ⚠️ 名为 agents | ⚠️ 需对齐 | P2 |
| **ralph_loop 配置** | ✅ | ⚠️ 名为 yishan | ⚠️ 需对齐 | P2 |
| **background_task 配置** | ✅ 并发控制 | ❌ | ⚠️ 缺失 | P1 |
| **git_master 配置** | ✅ | ❌ | ⚠️ 缺失 | P1 |
| **categories 配置** | ✅ 自定义类别 | ❌ | ⚠️ 缺失 | P2 |
| **disabled_hooks 配置** | ✅ | ✅ | ✅ 等效 | - |
| **disabled_skills 配置** | ✅ | ⚠️ 需确认 | ⚠️ 待验证 | P2 |
| **notification 配置** | ✅ | ❌ | ⚠️ 缺失 | P2 |

---

## 三、关键差距详解

### 3.1 P0 关键差距（阻塞性）

#### 3.1.1 Sisyphus/愚公 提示词质量

**现状**: OMC 的愚公移山提示词相比 OMO 的 Sisyphus 缺少一些关键指令：
- 缺少详细的 Phase 0-3 工作流指引
- 缺少明确的 Frontend Gate（前端文件处理决策）
- 缺少 GitHub Workflow 完整流程指引
- 缺少 Delegation Prompt Structure 强制格式

**建议**: 参考 OMO 的 `src/agents/sisyphus.ts` 增强愚公的系统提示词。

#### 3.1.2 Ralph Loop / 愚公循环机制

**现状**: OMC 的循环机制通过状态文件实现，但缺少：
- 独立的 ralph-loop Hook
- 完成承诺检测 (`<promise>DONE</promise>`)
- 自动继续逻辑
- 最大迭代次数配置

**建议**: 实现独立的 ralph-loop Hook，与 todo-continuation 分离。

#### 3.1.3 Git Master 技能

**现状**: OMC 缺少专门的 Git 操作技能，包括：
- 智能提交消息生成
- Co-authored-by 处理
- 提交页脚配置
- 安全的 Git 操作指引

**建议**: 创建 `skills/git-master/` 技能目录，实现完整的 Git 操作技能。

#### 3.1.4 Background Task 独立工具

**现状**: OMC 使用 Task 工具实现后台任务，但缺少：
- `background_task` 独立工具
- `background_output` 独立工具
- `background_cancel` 独立工具
- 并发控制配置

**建议**: 虽然功能已通过 Task 实现，但命名需要对齐以保持兼容性。

### 3.2 P1 重要差距

| 差距项 | 描述 | 建议方案 |
|--------|------|----------|
| Metis 规划 Agent | 缺少专门的需求分析和规划 Agent | 扩展李白 Agent 或新增 Metis |
| Atlas 编排 Agent | v3 新增的高级编排 Agent | 增强愚公或新增 Atlas |
| Prometheus 规划器 | 深度规划能力 | 增强诸葛或新增 |
| /init-deep 命令 | 深度项目初始化 | 新增命令 |
| /start-work 命令 | 开始工作流 | 新增命令 |
| /refactor 命令 | 重构模板 | 新增命令 |
| delegate-task-retry Hook | 任务委派自动重试 | 新增 Hook |
| session-recovery Hook | 专用会话恢复 | 增强 error-recovery |
| background-notification Hook | 任务完成通知 | 新增 Hook |
| interactive-bash 工具 | tmux 会话管理 | 新增工具 |

### 3.3 P2 次要差距

| 差距项 | 描述 | 建议方案 |
|--------|------|----------|
| JSONC 配置支持 | 支持 JSON 注释 | 使用 strip-json-comments |
| Momus 批评 Agent | 代码批评专家 | 增强魏征 |
| thinking-block-validator | 完整验证逻辑 | 参考 OMO 实现 |
| empty-task-response-detector | 空响应检测 | 新增 Hook |
| agent-usage-reminder | Agent 使用提醒 | 新增 Hook |
| categories 配置 | 自定义任务类别 | 新增配置项 |
| notification 配置 | 通知偏好设置 | 新增配置项 |

---

## 四、OMC 独有优势

以下功能是 OMC 独有，无需对齐：

| 功能 | 描述 |
|------|------|
| **18 个专业化 Agent** | 超过 OMO 的 7 个，覆盖更多领域 |
| **中国传统文化主题** | 独特的文化 IP，易于记忆和使用 |
| **进度可视化面板** | `/progress` 命令和 skill |
| **团队协作模式** | `/team` 命令 |
| **中英双语支持** | bilingual skill |
| **更丰富的 Agent 角色** | 测试、安全、性能、数据库等专家 |

---

## 五、改进路线图

### Phase 1: P0 关键功能 (1-2 周)

1. **增强愚公系统提示词** (3天)
   - 参考 Sisyphus 提示词结构
   - 添加 Phase 0-3 工作流
   - 添加 Frontend Gate
   - 添加 GitHub Workflow

2. **实现 Git Master 技能** (2天)
   - 创建 `skills/git-master/`
   - 实现智能提交消息
   - 添加配置支持

3. **完善循环机制** (2天)
   - 实现独立 ralph-loop Hook
   - 添加完成承诺检测
   - 添加迭代次数配置

4. **对齐 Background Task 命名** (1天)
   - 确保工具命名兼容性

### Phase 2: P1 重要功能 (2-3 周)

1. 新增 `/init-deep` `/start-work` `/refactor` 命令
2. 实现 delegate-task-retry Hook
3. 增强会话恢复机制
4. 实现 background-notification Hook
5. 实现 interactive-bash 工具
6. 新增 Metis/Atlas/Prometheus 相关能力

### Phase 3: P2 优化功能 (1-2 周)

1. 支持 JSONC 配置格式
2. 增强 thinking-block-validator
3. 实现辅助 Hook
4. 添加配置扩展项

---

## 六、实施状态更新 (2026-01-20)

### 已完成的功能对齐

#### Phase 1 (v1.3.0) - P0 关键功能 ✅
- [x] 愚公系统提示词增强 (Phase 0-3 工作流、Frontend Gate、GitHub Workflow)
- [x] Git Master 技能
- [x] Ralph Loop 循环机制
- [x] 新命令: /init-deep, /start-work, /refactor, /git

#### Phase 2 (v1.4.0) - P1 重要功能 ✅
- [x] delegate-task-retry Hook
- [x] background-notification Hook
- [x] session-recovery Hook (增强)
- [x] empty-task-response-detector Hook
- [x] Metis 能力 (李白增强)
- [x] Prometheus 能力 (诸葛增强)

#### Phase 3 (v1.5.0) - P2 增强功能 ✅
- [x] JSONC 配置支持
- [x] 配置扩展 (categories, notification, backgroundTask)
- [x] context-window-monitor Hook
- [x] tool-output-validator Hook

#### Phase 4 (v1.6.0) - P2 附加功能 ✅
- [x] interactive-bash-session Hook
- [x] thinking-block-validator Hook
- [x] agent-usage-reminder Hook

### 更新后的评估

| 维度 | OMO | OMC | 评价 |
|------|-----|-----|------|
| **Agent 数量** | 7 | 18 | OMC 胜出 |
| **Hook 数量** | 35+ | 28+ | 基本持平 |
| **工具完整性** | 高 | 高 | 已对齐 |
| **配置灵活性** | 高 | 高 | 已对齐 (JSONC支持) |
| **文化特色** | 无 | 强 | OMC 胜出 |
| **多模型支持** | 强 | 无 | OMO 胜出(设计差异) |

### 剩余差距 (低优先级)

| 差距项 | 状态 | 备注 |
|--------|------|------|
| Momus 批评 Agent | 可选 | 魏征已具备部分能力 |
| compaction-context-injector 分离 | 可选 | 当前集成方案可用 |
| non-interactive-env Hook | 可选 | 边缘场景 |
| prometheus-md-only Hook | 可选 | 诸葛已具备规划能力 |

---

## 七、结论

### 功能对齐完成度

**核心功能对齐率: ~95%**

除多模型支持（设计差异）外，oh-my-claude 已基本完成与 oh-my-opencode 的功能对齐，并在以下方面具有独特优势：

1. **更丰富的 Agent 体系** - 18 个专业化 Agent vs 7 个
2. **中国传统文化特色** - 独特的文化 IP
3. **完善的双语支持** - 中英文命令和响应

### 版本历程

| 版本 | 主要功能 |
|------|----------|
| v1.3.0 | P0 关键功能 (愚公增强、Git Master、Ralph Loop) |
| v1.4.0 | P1 重要功能 (Retry Hooks、Session Recovery、Metis/Prometheus) |
| v1.5.0 | P2 增强功能 (JSONC、Config Extensions、Monitor Hooks) |
| v1.6.0 | P2 附加功能 (Interactive Bash、Thinking Validator、Agent Reminder) |

---

*报告更新完成。oh-my-claude 已基本完成与 oh-my-opencode 的功能对齐。*
