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

## [2.1.18] - 2026-01-27

### 🔧 Changed / 变更

#### GitHub Packages 发布支持 / GitHub Packages Publishing Support

新增 GitHub Packages 发布功能，实现双平台包分发：

- **CI/CD 增强** - 添加 GitHub Packages 发布步骤
  - NPM: `claude-pangu` (保持不变)
  - GitHub Packages: `@zdragon17/claude-pangu`
- **权限配置** - 添加 `packages: write` 权限
- **自动转换** - 发布时自动转换包名为 scoped 格式

**安装方式**：
```bash
# NPM (推荐)
npx claude-pangu install

# GitHub Packages
npm install @zdragon17/claude-pangu --registry=https://npm.pkg.github.com
```

---

## [2.1.17] - 2026-01-27

### ✨ Added / 新增

#### Feature Parity with oh-my-opencode / 与 oh-my-opencode 功能对齐

本版本新增多个 Agent 定义和 Skill 文档，对标 oh-my-opencode 的设计理念。

##### P0: Planning Triad / 规划三角

- **Metis Agent** - 预规划分析顾问 (`agents/metis.md`, `commands/metis.md`)
  - 在执行前分析请求，识别隐藏意图和潜在问题
  - 提供结构化的分析报告：隐藏意图、歧义点、AI 失败风险、建议改进
  - 别名：`/metis`, `/pre-plan`, `/分析`

- **Momus/刘伯温增强** - 严格验证标准 (`agents/liubowen.md`)
  - 新增 Momus 风格的严格验证框架
  - 三重验证：清晰度验证、可验证性检查、完整性审计
  - 每项使用 ✅/❌ 明确标记通过/失败

##### P1: Core Agents & Skills / 核心 Agent 和技能

- **Oracle Agent** - 只读高智商咨询顾问 (`agents/oracle.md`, `commands/oracle.md`)
  - 使用 opus 模型进行深度分析
  - 专注：架构决策、代码审查、复杂调试、设计评审
  - 严格只读：仅限 Read、Grep、Glob、WebSearch、LSP 工具
  - 别名：`/oracle`, `/神谕`, `/consult`

- **Librarian Agent** - 文档和代码搜索专家 (`agents/librarian.md`, `commands/librarian.md`)
  - 集成 Context7 查询官方文档
  - 集成 grep.app 搜索 GitHub 代码示例
  - 提供带置信度的证据支持答案
  - 别名：`/librarian`, `/图书馆`, `/docs`

- **Frontend UI/UX Skill** - 设计师转开发者技能 (`skills/frontend-ui-ux/SKILL.md`)
  - 即使没有设计稿也能创建精美 UI
  - 包含：美学方向、排版系统、色彩系统、动效原则
  - 响应式设计和可访问性内置

- **Git Master Skill 增强** - 三角色专业化 (`skills/git-master/SKILL.md`)
  - Commit Architect：原子提交、依赖排序
  - Rebase Surgeon：历史重写、冲突解决
  - History Archaeologist：blame、bisect、log -S
  - 自动风格检测（分析最近 30 次提交）
  - 强制多提交规则（3+ 文件 → 2+ 提交）

##### P2: Visualization & Browser / 可视化和浏览器

- **Tmux Visualization Skill** - 多 Agent 工作可视化 (`skills/tmux-visualization/SKILL.md`, `hooks/tmux-agent-visualizer.sh`)
  - ✅ 已实现（实验性）：通过 PostToolUse hook 自动检测后台任务
  - 在 tmux 环境中自动创建窗格显示 Agent 输出
  - 仅 Unix/Linux/macOS 环境支持

- **Agent Browser Skill** - 双引擎浏览器自动化指南 (`skills/agent-browser/SKILL.md`)
  - Playwright MCP 与 Vercel agent-browser 功能对比
  - 选择指南和使用建议
  - 配置参考

### 📋 新增文件 / New Files

| 文件 | 功能 |
|------|------|
| `agents/metis.md` | Metis 预规划分析 Agent |
| `agents/oracle.md` | Oracle 只读咨询 Agent |
| `agents/librarian.md` | Librarian 文档搜索 Agent |
| `commands/metis.md` | /metis 命令 |
| `commands/oracle.md` | /oracle 命令 |
| `commands/librarian.md` | /librarian 命令 |
| `skills/frontend-ui-ux/SKILL.md` | 前端 UI/UX 设计技能 |
| `skills/tmux-visualization/SKILL.md` | Tmux 可视化技能文档 |
| `skills/agent-browser/SKILL.md` | 双引擎浏览器自动化技能 |
| `hooks/tmux-agent-visualizer.sh` | Tmux 可视化 Hook（实验性） |

### 📝 Modified / 修改

| 文件 | 变更 |
|------|------|
| `agents/liubowen.md` | 新增 Momus 严格验证标准 |
| `skills/git-master/SKILL.md` | 三角色专业化、自动风格检测、原子提交规则 |

### 📊 Statistics / 统计

- 新增 Agent 定义: 3 个（Metis, Oracle, Librarian）
- 新增 Skill: 3 个（frontend-ui-ux, tmux-visualization, agent-browser）
- 新增 Hook: 1 个（tmux-agent-visualizer.sh）
- 注意: Librarian 依赖 context7/grep-app MCP；tmux-visualization 已实现（实验性，仅 Unix/macOS）

---

## [2.1.16] - 2026-01-26

### 🐛 Fixed / 修复

#### 关键词检测器触发词精准度优化 / Keyword Detector Precision Improvement

修复 `keyword-detector.sh` 中部分触发词过于宽泛导致误触发的问题：

**愚公模式 (Yishan)** - 模式5优化：
- 问题：单独的 "批量"、"全部"、"所有"、"整个" 等词太容易误触发
- 修复：改为需要与动作词组合，如 "批量处理"、"全部重构"、"所有文件迁移"

**李白模式 (Libai)** - 需求分析优化：
- 问题："想要"、"希望"、"期望" 几乎匹配任何用户请求
- 修复：移除这些过于通用的词，改为需要产品/需求相关上下文

**顾恺之模式 (Gukaizhi)** - UI/UX 优化：
- 问题："好看"、"美观" 在讨论代码风格时可能误触发
- 修复：需要界面/UI 相关上下文，如 "界面好看"、"页面美观"

**相关文件**：
- `hooks/keyword-detector.sh` - 关键词检测器触发词精准度优化

---

## [2.1.15] - 2026-01-26

### ✨ Added / 新增

#### 启动时自动更新 / Auto-Update on Startup

新增 `SessionStart` Hook，Claude Code 启动时自动检查和更新 oh-my-claude：

- **自动检查**：每小时最多检查一次新版本
- **后台静默更新**：不阻塞启动，不影响使用
- **智能通知**：仅在有更新时显示提示

**配置选项**（环境变量）：
```bash
OH_MY_CLAUDE_AUTO_UPDATE=false      # 禁用自动更新（默认开启）
OH_MY_CLAUDE_UPDATE_CHECK_INTERVAL=12  # 检查间隔（小时，默认 1）
```

**相关文件**：
- `hooks/hooks.json` - 添加 `SessionStart` Hook
- `hooks/auto-update-checker.sh` - 增强启动时检查逻辑

### 🐛 Fixed / 修复

- **`hooks/hooks.json`** - 修复 SessionStart Hook 配置结构
  - 问题：错误使用嵌套 `hooks` 结构但未配置 `matcher`
  - 修复：使用与其他 Hook 一致的扁平结构

---

## [2.1.14] - 2026-01-26

### ✨ Added / 新增

#### 自然语言自动激活 / Natural Language Auto-Activation

本版本实现了所有 Agent 的自然语言自动激活功能，用户无需再手动输入命令，系统会根据自然语言自动识别意图并激活对应模式。

##### 直接激活模式升级

将 16 个 Agent 从"建议使用命令"升级为"直接激活模式"：

| Agent | 触发场景 | 激活模式 |
|-------|----------|----------|
| 墨子 (MoZi) | 安全审计 | `<mozi-mode>` |
| 仓颉 (CangJie) | 数据库设计 | `<cangjie-mode>` |
| 孙子 (SunZi) | 性能优化 | `<sunzi-mode>` |
| 郑和 (ZhengHe) | API 集成 | `<zhenghe-mode>` |
| 李冰 (LiBing) | DevOps | `<libing-mode>` |
| 张衡 (ZhangHeng) | 监控告警 | `<zhangheng-mode>` |
| 嫦娥 (ChangE) | 云原生 | `<change-mode>` |
| 老子 (LaoZi) | 代码简化 | `<laozi-mode>` |
| 顾恺之 (GuKaiZhi) | UI/UX 设计 | `<gukaizhi-mode>` |
| 鲁班 (LuBan) | 前端开发 | `<luban-mode>` |
| 李白 (LiBai) | 需求分析 | `<libai-mode>` |
| 司马迁 (SimaQian) | 文档撰写 | `<simaqian-mode>` |
| 诸葛 (ZhuGe) | 架构设计 | `<zhuge-mode>` |
| 悟空 (WuKong) | 代码探索 | `<wukong-mode>` |
| 刘伯温 (LiuBoWen) | 计划审查 | `<liubowen-mode>` |
| 离娄 (LiLou) | 多模态分析 | `<lilou-mode>` |

##### 使用示例

```bash
# 以前需要输入命令
/mozi 检查代码安全性

# 现在直接说自然语言，系统自动激活
"帮我检查一下这个代码有没有安全漏洞"  # → 自动激活墨子安全模式

"这个查询太慢了，帮我优化"  # → 自动激活孙子性能模式

"设计一下用户表结构"  # → 自动激活仓颉数据库模式
```

### Changed / 变更

- **`hooks/keyword-detector.sh`** - 关键词检测器重构
  - 所有 Agent 触发改为直接注入完整模式指令
  - 移除"建议使用命令"的间接引导
  - 每个模式包含详细的工作流程和检查清单

---

## [2.1.13] - 2026-01-26

### ✨ Added / 新增

#### 帮助系统增强 / Help System Enhancement

- **更新 `commands/help.md`** - 新增"遇到问题？"章节
  - 引导用户使用错误恢复命令
  - 提供 `/quickfix`、`/stuck`、`/retry`、`/skip`、`/rollback` 快速入口

- **更新 `hooks/keyword-detector.sh`** - 错误恢复关键词检测
  - 检测用户输入中的错误恢复意图
  - 自动提示相关恢复命令

---

## [2.1.11] - 2026-01-26

### 🐛 Fixed / 修复

- **`hooks/progress-notifier.sh`** - 修复语法错误
  - 问题：`if/else` 块缺少 `fi` 闭合语句
  - 修复：在第 215 行 `else` 块后添加 `fi`

---

## [2.1.12] - 2026-01-26

### ✨ Added / 新增

#### 用户体验优化 - 第四轮 / UX Optimization Round 4

本版本专注于降低新用户的入门门槛，提供场景化快速开始向导和常用命令英文别名。

##### 场景化快速开始 `/quickstart`

- **新增 `commands/quickstart.md`** - 场景化快速开始向导
  - 5 种常见场景：Bug修复、功能实现、代码探索、代码审查、项目了解
  - 交互式选择或直接指定场景编号
  - 每个场景提供清晰的工作流程和建议命令
  - 别名：`/qs`、`/fast`、`/开始`

##### 常用 Agent 英文别名

为方便英文用户和减少记忆负担，新增以下英文别名：

| 中文命令 | 英文别名 | 功能 |
|----------|----------|------|
| `/sunzi` | `/perf` | 性能优化 |
| `/mozi` | `/secure` | 安全审计 |
| `/baozheng` | `/test` | 测试设计 |
| `/wukong` | `/explore` | 代码探索 |
| `/zhuge` | `/arch` | 架构设计 |
| `/simaqian` | `/doc` | 文档撰写 |

新增文件：
- `commands/perf.md`
- `commands/secure.md`
- `commands/test.md`
- `commands/explore.md`
- `commands/arch.md`
- `commands/doc.md`

##### 帮助系统优化

- **更新 `commands/help.md`** - 首推 `/quickstart` 命令
- **更新 `hooks/first-use-onboarding.sh`** - 新手引导优先推荐 `/quickstart`
- **更新 `docs/ESSENTIAL_COMMANDS.md`** - 添加英文别名列

### 📝 Changed / 变更

- **README.md** - 添加场景化快速开始章节、Agent 表格添加英文别名列

---

## [2.1.10] - 2026-01-23

### 🐛 Fixed / 修复

- **ESM/CommonJS 兼容性修复**: 修复 v2.1.9 仍存在的 npx 安装问题
  - 问题：`import.meta` 在 CommonJS 环境（如 Jest）下是语法错误，无法通过 try-catch 捕获
  - 修复：完全移除 `import.meta` 相关代码，改用纯 CommonJS 兼容方案
  - 方案：优先使用 `__dirname`，其次使用 `fs.realpathSync(process.argv[1])` 解析符号链接
  - 影响：2.1.0 - 2.1.9 版本的 npx 安装可能失败，commands 和 skills 未被复制

---

## [2.1.9] - 2026-01-23

### 🐛 Fixed / 修复

- **npx 安装失败修复**: 修复 `npx claude-pangu install` 命令无法正常执行的问题
  - 原因：`isMainModule` 检查过于严格，在 npx 符号链接环境下判断失败
  - 修复：增强主模块检测逻辑，支持 npx、全局安装、符号链接等多种场景

---

## [2.1.8] - 2026-01-23

### ✨ Enhanced / 增强

- **项目本地旧版本清理**: 安装/更新时自动清理当前项目目录的 `.claude/commands/zcf` 残留
  - 解决用户更新到新版本后仍看到 `/zcf:yishan (project)` 的问题
  - 故障排除指引中增加项目本地残留的清理说明

---

## [2.1.7] - 2026-01-23

### ✨ Enhanced / 增强

#### 自然语言交互增强

提升用户与愚公模式的自然语言交互体验。

- **自然语言停止支持**: 新增 `keyword-detector.sh` 停止请求检测
  - 用户输入"停止"、"取消"、"stop"等词时，提供清晰的停止指引
  - 只在有活跃循环时才触发，避免误干扰
  - 告知用户如何正确停止愚公模式

- **自然语言进度查询**: 新增 `keyword-detector.sh` 进度查询检测
  - 用户输入"显示进度"、"当前状态"、"show progress"等词时，触发进度展示
  - 提示系统读取 TODO 列表并格式化展示
  - 支持在活跃会话中使用自然语言查看进度

### 🐛 Fixed / 修复

- **PR 关键词误匹配修复**: 修复 `pr` 被 `progress`、`print` 等词误匹配
  - 将 `pr` 改为 `\bpr\b`（单词边界匹配）
  - 避免"显示进度"、"打印结果"误触发代码审查模式

---

## [2.1.6] - 2026-01-23

### ✨ Enhanced / 增强

#### 愚公移山循环稳定性增强

提升了愚公移山模式的可靠性和用户体验。

- **自检流程强化**: 优化 `todo-continuation.sh` 和 `ralph-loop.sh`
  - 明确要求调用 `mcp_todoread` 工具检查 TODO 状态
  - 简化退出方式：完成后直接说"任务已全部完成"即可
  - 移除繁琐的 `<promise>` 语法要求

- **Hook 输出去重**: 优化 `agent-usage-reminder.sh`
  - 增加与 `keyword-detector.sh` 的协调，避免重复推荐
  - 冷却期从 5 分钟增加到 10 分钟，减少打扰
  - 如果 keyword-detector 已推荐，不再重复输出

### 🐛 Fixed / 修复

#### 意图识别精准度优化

修复了关键词检测器的多个误判问题，提升 Agent 路由准确性。

- **性能优化关键词**: 移除单独的"优化"/"optimize"
  - 修复："优化按钮样式" 不再误触发孙子（性能）
  - 保留："优化加载速度"、"性能优化" 正确触发孙子
  - 新增上下文判断：`优化.{0,5}(性能|速度|响应|延迟|内存|cpu|加载|渲染)`

- **测试关键词**: 移除单独的"测试"/"test"
  - 修复："测试一下这个功能" 不再误触发包拯（测试）
  - 保留："写单元测试"、"添加测试用例" 正确触发包拯

- **API/接口关键词**: 移除单独的"接口"
  - 修复："接口返回了错误" 不再误触发郑和（API）
  - 保留："对接支付宝API"、"设计接口" 正确触发郑和

- **文档关键词**: 移除单独的"记录"
  - 修复："记录一下状态" 不再误触发司马迁（文档）
  - 保留："写README文档"、"编写技术文档" 正确触发司马迁

---

## [2.1.5] - 2026-01-23

### 🐛 Fixed / 修复

#### macOS 兼容性修复

本版本修复了 macOS 平台上的 Shell 脚本兼容性问题。

- **Shebang 标准化**: 将所有 Hook 脚本的 shebang 统一为 `#!/usr/bin/env bash`
  - 修复 `#!/bin/bash` 硬编码路径问题（macOS 某些环境可能找不到）
  - 修复 `#!/usr/bin/env sh` 与 bash 特性（如 `local` 关键字）不兼容的问题
  - 涉及 40+ 个 Hook 脚本

- **grep 命令兼容性**: 修复 grep 在 macOS 上的行为差异
  - `error-friendly-display.sh`: 修复 `grep -E` 用法
  - `agent-handoff-prompt.sh`: 修复 grep 参数兼容性

- **install.sh 修复**: 将 `&>` 重定向改为 `>/dev/null 2>&1`（兼容更多 Shell）

---

## [2.1.4] - 2026-01-23

### ✨ Added / 新增

#### 用户体验优化 - 第三轮

本版本专注于提升用户体验，新增多个实用功能和系统优化。

##### P0 功能 - 核心增强

- **工作流模板系统 `/workflow`**: 预定义的开发工作流模板
  - 内置 6 种工作流：feature（功能开发）、bugfix（问题修复）、refactor（重构）、security（安全审计）、review（代码审查）、deploy（部署发布）
  - 支持自定义工作流：`/workflow save <name>`
  - 多阶段执行和进度追踪
  - 别名：`/工作流`、`/wf`

- **Agent 自动交接提示 Hook**: 智能下一步建议
  - Agent 完成任务后自动推荐下一步操作
  - 根据任务类型推荐合适的后续 Agent
  - 新增 `hooks/agent-handoff-prompt.sh`

##### P1 功能 - 效率增强

- **进度面板增强 `/progress`**: 新增多种可视化模式
  - 时间线模式：显示任务执行历史
  - 协作视图：显示各 Agent 工作状态
  - 质量仪表盘：显示代码质量指标
  - 工作流进度：显示当前工作流阶段
  - 上下文状态：显示上下文使用率

- **用户偏好设置 `/preferences`**: 个性化配置系统
  - 设置默认 Agent、语言偏好、输出详细度
  - 自动学习用户使用模式
  - 支持导入导出配置
  - 新增 `skills/preferences/SKILL.md`
  - 别名：`/偏好`、`/prefs`、`/settings`

- **友好错误显示系统**: 三级错误信息展示
  - 简洁模式：一句话问题描述 + 快速修复按钮
  - 标准模式：问题描述 + 可能原因 + 推荐操作
  - 详细模式：完整错误信息 + 堆栈 + 上下文
  - 新增 `skills/error-friendly/SKILL.md`
  - 新增 `hooks/error-friendly-display.sh` PostToolUse Hook

##### P2 功能 - 辅助工具

- **插件自诊断 `/diagnose`**: 全面健康检查
  - 核心组件诊断：插件目录、配置文件完整性
  - Agent 可用性诊断：检查所有 Agent 是否可加载
  - Hook 状态诊断：配置有效性、执行权限
  - 命令同步诊断：检查命令是否正确安装
  - 技能模块诊断：Skill 加载状态
  - MCP 服务器诊断：MCP 配置状态
  - 更新状态诊断：检查是否有新版本
  - 支持 `--quick`（快速诊断）、`--fix`（自动修复）、`--json`（JSON 输出）
  - 别名：`/诊断`、`/health-check`、`/doctor`

- **交互式教程增强 `/tutorial`**: 完善新手引导
  - 新增渐进式学习设计理念
  - 新增教程 5（团队协作）和教程 6（自定义 Agent）
  - 新增教程进度追踪功能
  - 新增快速入口：`/tutorial quick`（5 分钟速成）
  - 新增命令速查：`/tutorial commands`
  - 新增专家介绍：`/tutorial agents`
  - 支持互动反馈指令
  - 别名：`/教程`、`/学习`、`/guide`

### 📋 新增文件

| 文件 | 功能 |
|------|------|
| `commands/workflow.md` | 工作流模板命令 |
| `commands/preferences.md` | 用户偏好设置命令 |
| `commands/diagnose.md` | 插件自诊断命令 |
| `skills/workflow/SKILL.md` | 工作流模板技能 |
| `skills/workflow/workflows.json` | 内置工作流定义（6 种工作流配置） |
| `skills/preferences/SKILL.md` | 用户偏好技能 |
| `skills/error-friendly/SKILL.md` | 友好错误显示技能 |
| `hooks/agent-handoff-prompt.sh` | Agent 交接提示 Hook |

### 📝 Modified / 修改

- **commands/progress.md**: 添加时间线、协作视图、质量仪表盘等新模式
- **commands/tutorial.md**: 添加 YAML frontmatter、新教程内容、进度追踪
- **hooks/hooks.json**: 添加 agent-handoff-prompt.sh Hook 注册

---

## [2.1.3] - 2026-01-23

### 🔧 Fixed / 修复

- **修复版本检测 bug**: `.claude-plugin/plugin.json` 版本号未同步导致更新命令显示错误的已安装版本
  - 添加 `prepublishOnly` 钩子自动同步版本号到 plugin.json
  - 新增 `scripts/sync-version.cjs` 版本同步脚本

---

## [2.1.2] - 2026-01-23

### 📝 Changed / 变更

- **简化用户体验**: `/do` 作为唯一需要记住的命令入口
  - README 快速开始部分重构，突出 `/do` 万能入口
  - `/help` 默认显示精简版（5 个核心命令），`--all` 显示完整版
  - `/cheatsheet` 默认显示 5 秒速查，`--full` 显示完整参考
  - `/start` 新用户引导聚焦 `/do` 命令

### 🔧 Fixed / 修复

- **修复 cheatsheet.md**: 移除不兼容的 HTML `<details>` 标签，改用纯 Markdown 格式
- **Markdown 格式规范**: 代码块添加语言标识，表格格式统一

---

## [2.1.1] - 2026-01-23

### 🔧 Fixed / 修复

- **移除冲突别名**: 移除可能与其他工具（如 opencode、Claude 原生命令）冲突的通用英文别名
  - 移除: `/code`, `/analyze`, `/history`, `/speak`, `/template`, `/diagnose`, `/err`, `/statistics`, `/copilot`, `/pairing`, `/restructure`, `/code-review`
  - 保留: 中文别名（oh-my-claude 特色）+ 必要的短别名如 `/rf`
  - 原因: 避免与其他 CLI 工具产生命令名冲突

---

## [2.1.0] - 2026-01-23

### 🎉 Major Feature Release / 重大功能发布

本版本是 v2 系列的重大功能升级，新增 13 个命令、14 个技能目录、105 个测试用例。

### ✨ Added / 新增

#### P1 功能 - 效率增强

- **统计分析 `/stats`**: Agent 性能统计和历史数据分析
  - `agents` - Agent 调用次数、成功率、耗时、Token 消耗
  - `hooks` - Hook 执行统计
  - `session` - 当前会话统计
  - `history` - 历史趋势分析
  - 别名: `/张衡stats`, `/统计`, `/statistics`

- **项目初始化 `/init`**: 快速配置项目 oh-my-claude 环境
  - `list` - 列出所有可用模板
  - `auto` - 自动检测项目类型
  - `<template>` - 使用指定模板初始化
  - 支持前端/后端/全栈多种模板
  - 别名: `/盘古`, `/开天`, `/初始化`

- **代码审查 `/review`**: 多 Agent 协作代码审查
  - `full` - 完整多维度审查
  - `quick` - 快速审查
  - `security` - 安全专项审查
  - `performance` - 性能专项审查
  - 别名: `/审查`, `/cr`

- **学习模式 `/learn`**: 项目学习和画像生成
  - 自动分析项目结构和技术栈
  - 生成项目画像文档
  - 提取关键设计决策
  - 别名: `/孔子`, `/求学`, `/项目学习`

#### P2 功能 - 知识增强

- **交互式调试 `/debug`**: 智能调试助手
  - `trace` - 追踪错误
  - `analyze` - 分析代码路径
  - `fix` - 自动修复建议
  - 别名: `/调试`, `/排错`

- **代码片段库 `/snippet`**: 常用代码片段管理
  - `save <name>` - 保存代码片段
  - `list` - 列出所有片段
  - `search <keyword>` - 搜索片段
  - `use <name>` - 使用片段
  - 别名: `/蔡伦`, `/锦囊`, `/代码片段`

- **团队协作 `/share`**: 知识分享和协作
  - `export` - 导出会话摘要
  - `import` - 导入团队知识
  - `sync` - 同步团队配置
  - 别名: `/孔融`, `/让梨`, `/分享`

- **智能重构 `/refactor`**: 代码重构建议（增强）
  - `rename` - 重命名符号
  - `extract` - 提取函数/组件
  - `move` - 移动代码
  - `inline` - 内联代码
  - 支持并行分析和安全验证
  - 别名: `/重构`, `/rf`

- **错误知识库 `/error`**: 错误解决方案管理
  - `save <name>` - 保存错误及解决方案
  - `search <keyword>` - 搜索相关错误
  - `show <id>` - 查看错误详情
  - `stats` - 错误统计分析
  - 别名: `/华佗kb`, `/药方`, `/错误`

#### P3 功能 - 实验性

- **语音交互 `/voice`** (实验性): 语音命令支持
  - `start` - 开始语音监听
  - `stop` - 停止监听
  - `config` - 配置语音参数
  - 别名: `/伯牙`, `/知音`, `/语音`

- **AI 结对编程 `/pair`** (实验性): 持续协作模式
  - `start` - 开始结对会话
  - `pause` - 暂停结对
  - `resume` - 恢复结对
  - `end` - 结束结对
  - 别名: `/管鲍`, `/结对`, `/pair-programming`

- **代码时间旅行 `/timeline`**: 代码历史可视化
  - `show [file]` - 显示文件变更历史
  - `diff <commit1> <commit2>` - 比较版本差异
  - `blame <file>` - 查看行级贡献
  - `restore <commit> [file]` - 恢复历史版本
  - 别名: `/太史`, `/春秋`, `/时间线`

- **Agent 创建向导 `/agent`**: 自定义 Agent 管理
  - `list` - 列出所有 Agent
  - `create` - 交互式创建新 Agent
  - `edit <name>` - 编辑现有 Agent
  - `delete <name>` - 删除 Agent
  - `show <name>` - 查看 Agent 详情
  - 别名: `/女娲`, `/造物`, `/自定义agent`

### 🎨 Improved / 改进

- **传统文化对齐**: 所有新命令添加中国传统文化别名
  - 伯牙 - 语音交互（知音难觅）
  - 管鲍 - 结对编程（管鲍之交）
  - 太史 - 时间线（太史公记史）
  - 女娲 - Agent 创建（女娲造人）
  - 蔡伦 - 代码片段（发明造纸术）
  - 孔融 - 团队分享（孔融让梨）
  - 盘古 - 项目初始化（开天辟地）
  - 孔子 - 学习模式（万世师表）
  - 华佗 - 错误知识库（悬壶济世）
  - 张衡 - 统计分析（天文观测）

### 📚 Documentation / 文档

- 更新 README.md 添加 v2.0.25 功能表格
- 所有新命令包含详细使用说明和示例

---

## [2.0.24] - 2026-01-23

### ✨ Added / 新增

- **会话持久化 `/session`**: 跨会话保存和恢复工作进度
  - `save [name]` - 保存当前会话状态（TODO、上下文摘要、关键决策）
  - `list` - 列出所有可恢复的会话
  - `resume [id]` - 恢复指定会话
  - `info [id]` - 查看会话详情
  - `delete [id]` - 删除会话
  - 别名: `/会话`, `/ses`

- **上下文管理 `/context`**: 监控和优化上下文使用
  - `status` - 显示上下文使用率和组成分析
  - `compact` - 压缩对话历史释放空间
  - `clean` - 清理缓存和临时数据
  - `export` - 导出重要信息到文件
  - 多级预警: 70% 提示 → 85% 警告 → 95% 紧急
  - 别名: `/上下文`, `/ctx`

- **并行 Agent 执行 `/parallel`**: 同时运行多个 Agent
  - 支持 `@agent` 语法指定多个 Agent
  - 推荐组合: 探索组、质量组、优化组
  - 自动汇总各 Agent 执行结果
  - 别名: `/并行`, `/concurrent`, `/prl`

- **智能上下文预警 Hook**: `context-smart-alert.sh`
  - 可视化进度条显示使用率
  - 与 `/context` 命令集成

### ⚙️ Changed / 变更

- **启用并行执行**: `hooks.json` 中 `parallel_execution` 设为 `true`
- **最大并行数**: 新增 `max_parallel_agents: 3` 配置

---

## [2.0.23] - 2026-01-23

### 🐛 Fixed / 修复

- **Windows 通知兼容**: 修复 Windows 平台上的通知功能
- **进度条 Windows 兼容**: 修复进度条在 Windows 上的显示问题

---

## [2.0.22] - 2026-01-22

### ✨ Added / 新增

- **自动更新功能**: Claude Code 启动时自动检测并更新插件
  - 自动检测插件是否已安装（npm 全局/插件目录/npx）
  - 已安装且有新版本：**后台自动更新（非阻塞）**
  - 更新在后台执行，不影响当前操作（如 `/yishan`）
  - 下次启动时显示更新结果
  - 未安装：静默跳过
  - 默认开启，可通过 `OH_MY_CLAUDE_AUTO_UPDATE=false` 禁用
  - 检查间隔：24 小时（可通过 `OH_MY_CLAUDE_UPDATE_CHECK_INTERVAL` 配置）

### 🐛 Fixed / 修复

- **Hooks 无法加载的严重问题**: 修复插件未注册到 Claude Code 导致 hooks 不工作的问题
  - **根本原因**: 安装脚本复制了插件文件到 `~/.claude/plugins/oh-my-claude/`，但未在 Claude Code 的 `installed_plugins.json` 中注册
  - **影响**: 进度条、任务通知、Agent 就绪通知等所有 hooks 功能失效
  - **修复**: 安装时自动注册插件到 `installed_plugins.json`，卸载时自动移除注册
  - **注意**: 已安装用户需要重新运行 `npx claude-pangu install` 来修复此问题

---

## [2.0.21] - 2026-01-22

### 🔧 Fixed / 修复

- **版本号修正**: 修复 v2.0.20 版本号未正确发布到 npm 的问题

---

## [2.0.20] - 2026-01-22

### ✨ Added / 新增

- **核心命令速查文档**: 新增 `docs/ESSENTIAL_COMMANDS.md`，帮助新用户快速入门
  - 5 个核心命令覆盖 90% 使用场景：`/do`, `/help`, `/status`, `/retry`, `/stuck`
  - 按功能分类的完整命令表
  - @语法召唤专家指南

- **`/status` 命令增强**: 新增插件健康状态检查
  - 显示命令、Hook、Agent、Skill 加载状态
  - 检测安装问题并提供修复建议

### 🔧 Fixed / 修复

- **POSIX 兼容性**: 将 Hook 脚本从 `bash` 改为 `sh`，移除 `pipefail` 选项
  - 提升 Windows Git Bash 和其他 POSIX shell 的兼容性

- **Hook 配置补全**: 将 `hook-performance-monitor.sh cleanup` 注册到 `hooks.json`

---

## [2.0.19] - 2026-01-22

### ✨ Added / 新增

- **用户体验持续优化**: 第二轮深度优化

#### 新命令 / New Commands

| 命令 | 功能 | 用途 |
|------|------|------|
| `/map` | 命令关系速查图 | 可视化展示 55 个命令的关系和选择逻辑 |
| `/verify` | 安装验证命令 | 检查插件安装状态，支持 `--verbose` 和 `--fix` 模式 |
| `/expert` | 专家模式开关 | 为高级用户提供精简输出，跳过引导信息 |

#### 新技能 / New Skills

| 技能 | 功能 |
|------|------|
| `expert-mode` | 专家模式 - 控制各命令的输出详细程度 |

#### `/map` 命令特性

- 完整的命令关系可视化图
- 按场景分类的命令推荐（错误恢复、工作流、Git）
- 决策树帮助用户选择正确命令
- 命令别名对照表

#### `/verify` 命令特性

- 自动检测插件目录、命令、Agent、Hook、Skill
- 生成详细验证报告
- `--verbose` 详细诊断模式
- `--fix` 自动修复模式

#### `/expert` 命令特性

- `on/off/status` 三种操作模式
- 无参数时切换模式
- 影响所有命令的输出详细程度
- 跳过新手引导、精简输出、减少确认步骤

#### Hook 性能监控

- 新增 `hooks/hook-performance-monitor.sh` - Hook 执行时间追踪
- 新增 `/hook-perf` 命令 - 查看性能报告
- 支持性能阈值告警（500ms/2000ms）
- JSON 格式性能摘要输出

### 📖 Documentation / 文档

- 新增 `docs/COMMAND_ALIASES.md` - 命令别名完整说明文档
- 新增 `docs/ESSENTIAL_COMMANDS.md` - 核心命令速查（5 个命令完成 90% 工作）
- 包含所有 55 个命令的别名对照表
- 别名选择建议和冲突说明

### 🔧 Fixed / 修复

- **Windows 兼容性修复**: 将 `progress-notifier.sh` 和 `hook-performance-monitor.sh` 的 shebang 从 `bash` 改为 `sh`
- **hooks.json 同步**: 添加 `hook-performance-monitor.sh` 到配置文件
- **插件健康检查**: `/status` 命令现在显示插件健康状态，帮助用户确认功能正常

### 📊 Statistics / 统计

- 命令总数: 55 个（新增 4 个）
- Agent 总数: 20 个
- Hook 总数: 45 个（新增 2 个）
- Skill 总数: 10 个（新增 1 个）

---

## [2.0.18] - 2026-01-22

### 🐛 Fixed / 修复

- **修复 Hooks 无法加载问题**: 关键修复！
  - **plugin.json 添加 hooks 字段**: 声明 hooks 配置文件路径 (`./hooks/hooks.json`)
  - **hooks.json 路径修复**: 使用 `${CLAUDE_PLUGIN_ROOT}` 变量替代相对路径
  - **progress-notifier.sh 改进**: 使用 `hookSpecificOutput.additionalContext` 确保进度信息显示
  - **shebang 修复**: 统一使用 `#!/usr/bin/env bash` 确保跨平台兼容

**根本原因**: plugin.json 缺少 `hooks` 字段导致 Claude Code 无法加载插件的 hooks 配置

---

## [2.0.17] - 2026-01-22

### 🐛 Fixed / 修复

- **修复 "Unknown slash command" 问题**: 命令目录结构调整
  - 命令文件现在直接安装到 `~/.claude/commands/` 根目录
  - 之前安装到 `~/.claude/commands/zcf/` 子目录导致 Claude Code 无法识别
  - 更新 shell 脚本和 PowerShell 安装脚本
  - CLI (`npx claude-pangu`) 已是正确行为，本次统一所有安装方式

### 📖 Documentation / 文档

- **更新 Claude Code 安装说明**: Claude Code 已切换为原生安装器
  - README.md/README_EN.md 添加 `claude install` 前提条件
  - TROUBLESHOOTING.md 更新安装指引
- **新增 "Unknown slash command" 故障排查**: 详细步骤解决命令不识别问题

---

## [2.0.16] - 2026-01-22

### 📖 Documentation / 文档

- **活跃会话命令限制说明**: 解决用户困惑的关键问题
  - 明确说明 Claude Code 的技术限制：斜杠命令不支持在活跃技能中嵌套触发
  - 提供自然语言替代方案表格（`显示进度`、`@扁鹊`、`停止` 等）
  - 更新 `/quickfix`、`/yishan`、`/progress` 文档添加相关说明
  - 指导用户在活跃会话中使用自然语言和 `@Agent` 语法

---

## [2.0.15] - 2026-01-22

### ✨ Added / 新增

- **用户体验深度优化**: 基于重度用户视角的全面改进
  - `/what` - 意图识别推荐，分析用户目标自动推荐最合适的命令
  - `/quickfix` - 快速修复入口，错误诊断和恢复命令一站式服务
  - `/recipes` - 场景使用指南，按工作流程（而非 Agent）组织的 cookbook

### 📝 Changed / 变更

- **bilingual skill 扩展**: 新增命令的中英文别名
  - `/what` → `/想` → `/intent`
  - `/quickfix` → `/急救` → `/fix`
  - `/recipes` → `/场景` → `/cookbook`

### 📖 Documentation / 文档

- 新增场景指南，覆盖功能开发、问题修复、界面开发、性能优化等常见工作流
- 完善错误处理引导，自动推荐恢复命令

---

## [2.0.14] - 2026-01-22

### ✨ Added / 新增

- **易用性增强三件套**: 大幅降低用户学习成本
  - `/do` - 极简万能入口，等同于 `/yishan`，两个字符完成任何任务
  - `/suggest` - 智能命令推荐，根据任务描述推荐最合适的命令
  - `/cheatsheet` - 快速参考卡，一页纸概览所有常用命令

### 📝 Changed / 变更

- **bilingual skill 更新**: 新增中英文别名支持
  - `/do` → `/做` → `/just`
  - `/suggest` → `/推荐` → `/recommend`
  - `/cheatsheet` → `/速查` → `/quickref`

---

## [2.0.13] - 2026-01-22

### 🔍 Enhanced / 增强

- **历史版本检测增强**: 支持仅有 zcf 目录的旧版本（v1.0.8）检测
  - 新增 `hasLegacyZcf` 检查，避免仅安装旧版时显示"未安装"
  - 确保各种历史版本都能被正确识别和清理

---

## [2.0.12] - 2026-01-22

### 🐛 Fixed / 修复

- **CI 构建修复**: 移除未使用的变量和函数
  - 移除 `getCommandFilesFromPackage`、`getSkillDirsFromPackage` 函数
  - 移除 `packageDir` 变量
  - 解决 TypeScript TS6133 编译错误

---

## [2.0.11] - 2026-01-22

### 🐛 Fixed / 修复

- **始终使用完整清理列表**: 彻底修复旧版命令残留问题
  - npx 可能缓存旧版本包，动态扫描使用过时的文件列表
  - 卸载时始终使用硬编码的完整列表，包含所有历史版本文件
  - 确保 `huitu.md`、`xuanwu.md` 等已重命名文件能被正确清理

---

## [2.0.10] - 2026-01-22

### 🐛 Fixed / 修复

- **备用清理列表生效**: 修复动态扫描返回空时未使用备用列表的问题
  - 当 npx 缓存目录不包含 commands/skills 时，动态扫描返回空数组
  - 现在会正确 fallback 到硬编码的备用列表
  - 确保卸载时能正确删除所有命令和技能文件

---

## [2.0.9] - 2026-01-22

### 🐛 Fixed / 修复

- **卸载残留文件检测**: 修复插件目录不存在时跳过清理的问题
  - 即使插件目录已删除，仍会检测并清理残留的 commands/skills 文件
  - 只有在完全没有残留文件时才显示"插件未安装"
  - 解决用户反馈的"卸载后命令仍可用"问题

---

## [2.0.8] - 2026-01-22

### 🧹 Fixed / 修复

- **历史版本命令清理**: 卸载时清理已重命名的旧版命令文件
  - 清理 `huitu.md`（已重命名为 `lilou.md`）
  - 清理 `xuanwu.md`（已重命名为 `liubowen.md`）
  - 确保所有历史版本遗留文件都被正确清理

---

## [2.0.7] - 2026-01-21

### 🔍 Enhanced / 增强

- **全局 zcf 扫描清理**: 卸载时自动扫描并清理所有项目中的旧版 zcf 目录
  - 扫描用户主目录下的常见项目目录（projects、dev、workspace、code 等）
  - 支持 Windows 多盘符扫描（C:、D:、E:、F:）
  - 支持 macOS/Linux 常见路径（/var/www、/opt/projects 等）
  - 递归扫描深度限制（4 层），避免性能问题
  - 智能跳过 node_modules、.git 等目录
  - 完全自动化，无需手动指定路径

---

## [2.0.6] - 2026-01-21

### 🧹 Fixed / 修复

- **项目本地 zcf 清理**: 安装和卸载时自动清理项目目录的旧版命令
  - 清理 `<项目>/.claude/commands/zcf/` 目录
  - 解决旧版本在项目本地安装导致 `/zcf:yishan` 等命令残留的问题
  - install 和 uninstall 都会执行此清理
  - 跨平台兼容（Windows/macOS/Linux）

---

## [2.0.5] - 2026-01-21

### 🧹 Fixed / 修复

- **卸载完整清理**: `uninstall` 命令现在会清理所有安装的文件
  - 删除 `~/.claude/commands/` 中本插件安装的所有命令文件
  - 删除 `~/.claude/skills/` 中本插件安装的所有 skill 目录
  - 清理旧版本 `zcf` 子目录（v1.0.8 及之前版本遗留）
  - 清理本地状态文件（ralph-loop、checkpoint 等）
  - 清理全局日志目录
  - 支持动态扫描和备用列表双重保障，跨平台兼容

---

## [2.0.4] - 2026-01-21

### 🔧 Fixed / 修复

- **版本同步修复**: `plugin.json` 版本号与 `package.json` 同步
  - 修复 `update` 命令总是显示旧版本的问题
  - 更新检测现在正确读取已安装版本

---

## [2.0.3] - 2026-01-21

### 🏔️ 愚公移山 v2.1 - 智能动态工作流

#### ✨ Added / 新增

- **动态工作流系统**
  - 任务类型自动识别（Bug修复/新功能/重构/优化/简单修改）
  - 按需跳过不必要的阶段
  - 根据任务复杂度智能调整流程

- **Agent 智能分派**
  - 12 个专业 Agent 按需调用
  - 触发条件明确定义
  - 职责映射清晰

- **测试-修复循环机制**
  - 测试失败自动回到诊断-修复阶段
  - 最大循环限制（单测试 5 次，整体 10 次）
  - 循环直到测试通过

- **强制代码清理阶段**
  - 清理调试代码（console.log/debugger/print）
  - 删除临时文件和注释掉的代码
  - 清理未使用的导入

- **质量退出条件**
  - 功能完成 + 质量达标 + 代码清洁
  - 不允许"假设通过"退出
  - TODO 全部完成才能退出

---

## [2.0.2] - 2026-01-21

### 🔧 Fixed / 修复

- **Agent 关键词检测优化**
  - 缩小悟空（WuKong）的触发关键词范围，避免过度触发
  - 调整 Agent 优先级顺序：紧急问题 > 安全 > 测试 > 其他
  - 修复"搜索"、"查找"等通用词误触发悟空的问题

---

## [2.0.1] - 2026-01-21

### ✨ Added / 新增

- **Agent 就绪通知** (`agent-ready-notification.sh`)
  - Agent 停止时发送 OS 级桌面通知
  - 支持 Windows Toast / macOS osascript / Linux notify-send
  - 30 秒最小间隔防止通知刷屏
  - 类似 OpenCode 的"Agent is ready for input"功能

---

## [2.0.0] - 2026-01-21 🎉

### 🚀 Major Release / 重大版本发布

**本版本是一个重大 UX 优化版本**，包含 14 项用户体验改进、新命令、新 Hook 和完善的任务恢复机制。

This is a major UX optimization release with 14 user experience improvements, new commands, new hooks, and a refined task recovery mechanism.

### ✨ Added / 新增

#### 新命令 / New Commands

| 命令 | 功能 | 用途 |
|------|------|------|
| `/retry` | 重试最近失败的操作 | 自动恢复最近失败的命令执行 |
| `/skip` | 跳过当前阻塞的任务 | 标记任务完成并继续后续工作 |
| `/rollback` | 回滚到上一个检查点 | 撤销最近的更改，恢复到稳定状态 |

#### 新 Hooks / New Hooks

| Hook | 功能 | 触发时机 |
|------|------|---------|
| `agent-usage-tracker.sh` | Agent 使用追踪 | UserPromptSubmit |
| `operation-history.sh` | 操作历史记录 | PostToolUse |
| `hooks/lib/message-dedup.sh` | 消息去重库 | 共享库 |

#### 渐进式新手引导 / Progressive Onboarding

- **5 阶段渐进式引导系统**
  - 阶段 1-2：新用户，详细推荐提示
  - 阶段 3-5：中级用户，简洁单行提示
  - 阶段 6+：熟练用户，静默模式（不打扰）
- 基于实际使用次数自动调整提示详细程度
- 追踪每个 Agent 的使用情况

#### 统一检查点格式 / Unified Checkpoint Format

```json
{
  "version": "2.0",
  "timestamp": "ISO 8601",
  "task_context": { "original_request": "", "current_phase": "" },
  "completed_items": ["..."],
  "pending_items": ["..."],
  "next_action": "",
  "recovery_hint": ""
}
```

### 🔧 Changed / 变更

#### UX 优化 / UX Improvements

- **P0: 任务中断恢复增强**
  - `/interrupt` 命令强制包含显式状态保存步骤
  - `/pause` 命令使用统一检查点格式

- **P1: 失败透明度提升**
  - `failure-transparency.sh` 添加内容哈希去重
  - 集成 `message-dedup.sh` 库防止重复消息

- **P2: 子任务移交规范**
  - `SKILL.md` 强制要求完整的移交报告
  - 包含工件清单、验证状态、后续步骤

- **P2: 进度通知去重**
  - `progress-notifier.sh` 集成消息去重
  - 60 秒 TTL 防止重复通知

- **P3: 帮助文档完善**
  - `/help` 命令显示最近使用的命令
  - 添加 jq 未安装时的降级方案说明

#### 安装流程修复 / Installation Fix

- **递归 Hook 权限设置**
  - `setHookPermissions()` 现在递归处理 `hooks/lib/` 子目录
  - `install.sh` 使用 `find` 命令递归设置 `.sh` 文件权限

### 📋 文件变更清单 / File Changes

**新增文件 / New Files:**
- `commands/retry.md` - 重试命令
- `commands/skip.md` - 跳过命令
- `commands/rollback.md` - 回滚命令
- `hooks/agent-usage-tracker.sh` - Agent 使用追踪
- `hooks/operation-history.sh` - 操作历史记录
- `hooks/lib/message-dedup.sh` - 消息去重共享库

**修改文件 / Modified Files:**
- `commands/interrupt.md` - 添加显式状态保存步骤
- `commands/pause.md` - 使用统一检查点格式
- `commands/yishan-resume.md` - 检查点格式文档
- `commands/cancel-yishan.md` - 检查点清理选项
- `commands/help.md` - 最近使用 + jq 降级说明
- `hooks/first-use-onboarding.sh` - 5 阶段渐进引导
- `hooks/failure-transparency.sh` - 内容哈希 + 去重集成
- `hooks/progress-notifier.sh` - 去重集成
- `skills/yishan/SKILL.md` - 强制移交报告
- `lib/file-operations.ts` - 递归 Hook 权限
- `scripts/install.sh` - 递归 chmod

### 🏆 版本升级原因 / Why 2.0

此版本升级到 2.0 的原因：

1. **用户体验重大改进** - 14 项 UX 优化覆盖从新手引导到专家使用的完整用户旅程
2. **新命令系统** - `/retry`、`/skip`、`/rollback` 三个关键恢复命令
3. **统一检查点机制** - 全新的任务状态保存和恢复架构
4. **智能去重系统** - 避免重复消息干扰用户
5. **渐进式引导** - 根据用户熟练度自动调整提示详细程度

---

## [1.7.3] - 2026-01-21

### ✨ Added / 新增

#### 文档国际化 / Documentation Internationalization

新增 5 篇英文技术文档，帮助国际用户理解系统架构：

| 文档 | 内容 |
|------|------|
| `docs/AGENT_PROTOCOL_EN.md` | Agent 协作协议 |
| `docs/AGENT_COLLABORATION_PROTOCOL_EN.md` | 多 Agent 协作详解 |
| `docs/CONTEXT_COMPRESSION_EN.md` | 上下文压缩机制 |
| `docs/ERROR_RECOVERY_EN.md` | 错误恢复与重试机制 |
| `docs/TASK_CHECKPOINTING_EN.md` | 任务检查点与恢复机制 |

#### 示例项目 / Example Projects

新增完整的自定义示例，帮助用户快速上手：

- `examples/custom-agent/` - 自定义 Agent 示例（3 个文件）
- `examples/custom-hook/` - 自定义 Hook 示例（3 个 Shell 脚本）
- `examples/configs/development.jsonc` - 开发环境配置
- `examples/configs/enterprise.jsonc` - 企业级安全配置

### 🔧 Changed / 变更

#### 性能优化 / Performance Optimization

- **新增 Hook 懒加载模块** (`lib/hook-loader.ts`)
  - 支持 30 秒 TTL 缓存
  - 按事件类型过滤 Hook
  - Hook 统计和状态检查
  - 单例模式，便于使用

#### 用户体验增强 / UX Enhancement

- **安装后引导增强** (`scripts/postinstall.cjs`)
  - 自动检测语言环境（中/英文）
  - 显示快速入门命令
  - 显示功能亮点
  - 提供文档链接和帮助资源

- **错误处理增强** (`lib/error-handler.ts`)
  - 新增双语错误消息
  - 新增 `getEnhancedError()` 提供恢复建议
  - 新增 `formatEnhancedError()` 用户友好输出
  - 新增错误类型支持（ECONNREFUSED、ETIMEDOUT、ENOTFOUND）

### 🐛 Fixed / 修复

- 修复 `config-manager.test.ts` 类型定义缺少 `categories` 属性的问题

---

## [1.7.2] - 2026-01-21

### 🎭 Changed / 变更

#### Agent 重命名 - 文化深度提升 / Agent Renaming for Cultural Depth

为提升文化内涵和辨识度，重命名了两个 Agent：

| 旧名称 | 新名称 | 文化背景 |
|--------|--------|---------|
| 绘图 (HuiTu) | **离娄** (LiLou) | 《孟子》中视力超群之人，"离娄之明，察秋毫之末"，成语"明察秋毫"由此而来 |
| 玄武 (XuanWu) | **刘伯温** (LiuBoWen) | 明代开国军师，"前知五百年，后知五百年"，善于预判风险、审时度势 |

**命令变更**：
- `/huitu` → `/lilou` (多模态分析)
- `/xuanwu` → `/liubowen` (计划审查)

**别名保持不变**：
- `/looker` - 调用离娄
- `/momus` - 调用刘伯温

---

## [1.7.1] - 2026-01-20

### 🔧 Fixed / 修复

- **修复更新时的误报警告** - 源目录不存在时不再记录为错误
  - 可选目录（如 `mcps/`）不存在时静默跳过
  - 避免用户看到不必要的 "复制完成（有警告）" 信息
  
- **更新流程错误信息输出** - 与安装流程保持一致
  - 现在 `update` 命令也会输出详细的错误信息
  - 帮助用户了解具体哪些文件复制失败

---

## [1.7.0] - 2026-01-20

### 🚀 Complete Feature Alignment / 完整功能对齐

**本版本完成了与 oh-my-opencode 100% 功能对齐**（多模型支持为设计差异）。

This release achieves 100% feature alignment with oh-my-opencode (multi-model support is a design difference).

#### 功能对齐率 / Alignment Rate: ~100%

| 维度 | oh-my-opencode | oh-my-claude | 状态 |
|------|---------------|--------------|------|
| **Agent 数量** | 7 | 20 | ✅ 超越 |
| **Hook 数量** | 35+ | 33 | ✅ 基本持平 |
| **命令数量** | ~20 | 33 | ✅ 超越 |
| **技能数量** | ~3 | 5 | ✅ 超越 |
| **MCP 服务器** | 3 | 3 | ✅ 等效 |
| **Session 工具** | 4 | 4 | ✅ 等效 |
| **多模型支持** | ✅ | ❌ | 🔵 设计差异 |

### ✨ Added / 新增

#### 内置 MCP 服务器自动安装 / Built-in MCP Auto-Install

- **新增 `.mcp.json`** - 安装插件时自动配置 MCP 服务器到 Claude Code
- 自动启用的 MCP：
  - **context7** - 官方文档查询
  - **grep-app** - GitHub 代码搜索
  - **deepwiki** - 开源项目文档
  - **open-websearch** - 网络搜索 (DuckDuckGo/Bing)
- 新增 `mcps/` 目录 - MCP 配置参考文件
- 新增 `lib/mcp/mcp-loader.ts` - MCP 配置加载模块
- **安装后即可使用**，无需手动配置

#### Session 工具集 / Session Tools

- 新增 `lib/session/session-tools.ts` - 完整会话管理工具
- **sessionList()** - 列出所有会话及元数据
- **sessionRead()** - 读取会话历史和消息
- **sessionSearch()** - 全文搜索会话内容
- **sessionInfo()** - 获取会话详细信息

#### 新 Agent / New Agents

- **绘图 (HuiTu)** - 多模态分析 Agent (`agents/huitu.md`)
  - 图像内容分析和描述
  - PDF 文档解析和提取
  - 架构图/流程图理解
  - UI 截图分析
  - 图表数据提取
  - 命令：`/huitu`, `/looker`

- **玄武 (XuanWu)** - 计划审查 Agent (`agents/xuanwu.md`)
  - TODO 列表完整性审查
  - 执行计划可行性评估
  - 任务依赖关系分析
  - 风险识别和预警
  - 命令：`/xuanwu`, `/momus`

#### 新 Hooks / New Hooks

- **atlas.sh** - 核心编排逻辑
  - 任务分类（visual/debugging/architecture/documentation/testing/performance/security）
  - 委派建议生成
  - 工作流阶段检测（exploration/planning/implementation/verification/deployment）
  - 并行执行机会检测

- **directory-readme-injector.sh** - 目录 README 注入
  - 自动检测项目 README.md
  - 提取关键信息注入上下文
  - 支持缓存加速
  - 检测项目类型（nodejs/rust/golang/python/java/dotnet）

- **auto-slash-command.sh** - 自动斜杠命令
  - 检测用户意图
  - 建议对应的专业 Agent 命令
  - 支持 18+ 种任务类型映射

- **session-notification.sh** - 会话通知
  - 跨平台 OS 通知支持（macOS/Linux/Windows）
  - 后台任务完成通知
  - 构建/测试完成通知
  - 错误告警通知
  - 愚公移山完成通知

- **edit-error-recovery.sh** - 编辑错误恢复
  - 检测 oldString 未找到错误
  - 检测多次匹配错误
  - 检测文件不存在错误
  - 检测权限错误
  - 提供详细恢复建议

- **background-compaction.sh** - 后台任务压缩
  - 监控后台任务数量
  - 达到阈值时建议清理
  - 状态持久化

- **anthropic-context-window-limit-recovery.sh** - 上下文限制恢复
  - 检测上下文窗口限制错误
  - 检测接近限制警告
  - 提供恢复步骤和紧急保存脚本

#### 新 Skill / New Skill

- **Playwright Skill** (`skills/playwright/`) - 浏览器自动化
  - 页面导航和交互
  - 截图功能
  - 内容提取
  - 等待机制
  - 可选集成 Playwright MCP 服务器

### 🔧 Enhanced / 增强

#### 配置系统扩展 / Config System Extensions

- **MCP 配置** - `disabled_mcps`, 自定义 MCP 定义
- **Agent 权限** - `edit`, `bash`, `webfetch`, `doom_loop`, `external_directory`
- **Category 委派** - `visual`, `business-logic`, `quick` 类别与 Agent 路由
- **并发控制** - `defaultConcurrency`, `agentConcurrency`, `maxTotalConcurrency`

### 📋 hooks.json 更新

新增以下 hooks 到 UserPromptSubmit：
- `atlas.sh` - 核心编排
- `directory-readme-injector.sh` - README 注入
- `auto-slash-command.sh` - 自动命令建议

新增以下 hooks 到 PostToolUse：
- `session-notification.sh` - OS 通知
- `edit-error-recovery.sh` - 编辑错误恢复
- `background-compaction.sh` - 后台任务管理
- `anthropic-context-window-limit-recovery.sh` - 上下文恢复

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
| 2.0.0 | 2026-01-21 | 🎉 Major UX optimization: 14 improvements, new commands, progressive onboarding / 重大 UX 优化版本 |
| 1.7.3 | 2026-01-21 | 📚 Documentation i18n, examples, performance & UX enhancements / 文档国际化、示例、性能优化 |
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
