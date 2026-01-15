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
- More agents / 更多 Agent

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
