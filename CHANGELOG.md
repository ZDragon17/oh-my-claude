# Changelog / 变更日志

All notable changes to this project will be documented in this file.
本文件记录项目的所有重要变更。

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased] / 未发布

### Added / 新增
- More agents planned (墨子、孙子...) / 更多 Agent 计划中
- Agent collaboration improvements / Agent 协作增强
- More hook events support / 更多 Hook 事件支持

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
| 0.1.0 | 2025-01-15 | Initial release with 5 agents / 首次发布，包含 5 个 Agent |

---

<div align="center">

**愚公精神：坚持必将成功 🏔️**

**YuGong Spirit: Persistence Leads to Success**

</div>
