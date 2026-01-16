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
