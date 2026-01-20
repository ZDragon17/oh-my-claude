# oh-my-claude 🏔️

[![npm version](https://img.shields.io/npm/v/claude-pangu.svg)](https://www.npmjs.com/package/claude-pangu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blueviolet)](https://claude.ai)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README_EN.md)

> 基于中国传统文化的 Claude Code 智能编排插件

```
太行、王屋二山，方七百里，高万仞。
北山愚公者，年且九十，面山而居...
虽我之死，有子存焉；子又生孙，孙又生子；
子子孙孙无穷匮也，而山不加增，何苦而不平？

                                    —— 《列子·汤问》
```

## 🌟 项目理念

### 致敬 oh-my-opencode

本项目灵感来源于 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)，一个优秀的 Claude Code 插件生态项目。我们在学习借鉴的基础上，融入中国传统文化元素，打造了这个具有东方特色的版本。

### 愚公精神

> 子子孙孙无穷匮也，而山不加增，何苦而不平？

oh-my-claude 的核心理念源自「愚公移山」的精神：**只要方向正确，坚持就会成功。**

- 🏔️ **持续执行** - 任务未完成，绝不停止
- 🎯 **目标导向** - 分解大任务，逐个击破
- 💪 **永不放弃** - 遇到问题，调整策略继续前进

## ✨ 特性

### 🔷 现代化技术栈
- **完整 TypeScript 迁移** - 提供类型安全和现代开发体验
- **模块化架构** - 职责分离，支持扩展和维护
- **智能配置系统** - 分层配置、热重载、环境变量支持

### 🎭 智能 Agent 体系

基于中国传统文化人物的专业化 Agent：

| Agent | 名称 | 专长 | 命令 |
|-------|------|------|------|
| 🏔️ | **愚公** (YuGong) | 主编排，大规模任务 | `/yugong` `/yishan` |
| 🎯 | **诸葛** (ZhuGe) | 战略顾问，架构设计 | `/zhuge` `/longzhong` |
| 🔧 | **鲁班** (LuBan) | 精工巧匠，代码实现 | `/luban` `/qiaogong` |
| 🔍 | **悟空** (WuKong) | 代码侦察，快速探索 | `/wukong` `/huoyan` |
| 🩺 | **扁鹊** (BianQue) | Bug 诊断，问题修复 | `/bianque` `/wangwen` |
| 🛡️ | **墨子** (MoZi) | 安全审计，防御编程 | `/mozi` `/security` |
| ⚔️ | **孙子** (SunZi) | 性能优化，系统调优 | `/sunzi` `/perf` |
| 📜 | **司马迁** (SimaQian) | 文档撰写，变更记录 | `/simaqian` `/doc` |
| ⛵ | **郑和** (ZhengHe) | API 集成，外部服务 | `/zhenghe` `/api` |
| 🔭 | **张衡** (ZhangHeng) | 系统监控，可观测性 | `/zhangheng` `/monitor` |
| 🌊 | **李冰** (LiBing) | DevOps，基础设施 | `/libing` `/devops` |
| ☯️ | **老子** (LaoZi) | 代码简化，Clean Code | `/laozi` `/simplify` |
| ⚖️ | **包拯** (BaoZheng) | 测试专家，TDD | `/baozheng` `/test` |
| 🪞 | **魏征** (WeiZheng) | 代码审查，规范检查 | `/weizheng` `/review` |
| 📊 | **仓颉** (CangJie) | 数据库设计，SQL 优化 | `/cangjie` `/db` |
| ✨ | **李白** (LiBai) | 需求分析，用户故事 | `/libai` `/poet` |
| 🎨 | **顾恺之** (GuKaiZhi) | UI/UX 设计，界面美学 | `/gukaizhi` `/painter` |
| 🌙 | **嫦娥** (ChangE) | 云服务，DevOps 部署 | `/change` `/cloud` |
| 🖼️ | **绘图** (HuiTu) | 多模态分析，图像理解 | `/huitu` `/looker` |
| 🐢 | **玄武** (XuanWu) | 计划审查，风险评估 | `/xuanwu` `/momus` |

### 🔄 愚公移山模式

核心特性：**不完成，不罢休**

```bash
# 启动愚公移山模式
/yishan 重构整个认证模块

# 或使用英文
/ultrawork refactor the entire auth module
```

- ✅ 自动任务分解和追踪
- ✅ Todo 强制执行（未完成不能停止）
- ✅ 智能错误恢复
- ✅ 进度透明报告

### 🌐 中英双语支持

所有命令都支持中英文：

```bash
# 中文
/愚公 实现用户登录功能
/诸葛 分析这个架构设计
/扁鹊 这个报错怎么解决

# 英文
/persist implement user login
/strategy analyze this architecture
/debug how to fix this error
```

### 🪝 智能 Hook 系统

- **Todo 强制执行器**：检测未完成任务，阻止过早停止
- **关键词检测器**：自动激活相应模式
- **33+ 内置 Hooks**：上下文管理、错误恢复、会话通知等

### 🔌 内置 MCP 服务器 (v1.7.0 新增)

安装后自动配置，无需手动设置：

- **Context7** - 官方文档查询
- **Grep.app** - GitHub 代码搜索
- **DeepWiki** - 开源项目文档
- **WebSearch** - 网络搜索

### 🛠️ 高级工具

- **LSP 工具** - 代码诊断、重命名、定义跳转
- **AST-Grep** - 结构化代码搜索和替换
- **Session 工具** - 会话管理、历史搜索
- **Playwright** - 浏览器自动化技能

## 📦 安装

提供多种安装方式，选择最适合你的：

### 方式一：npm / npx（推荐）

```bash
# 使用 npx 直接安装（无需全局安装）
npx claude-pangu install

# 或全局安装后使用
npm install -g claude-pangu
claude-pangu install

# 也可以使用 bun / pnpm
bunx claude-pangu install
pnpm dlx claude-pangu install
```

> 💡 **包名说明**: npm 包名为 `claude-pangu`（盘古开天辟地），项目名仍为 `oh-my-claude`

### 方式二：一键安装

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.ps1 | iex
```

### 方式三：Homebrew (macOS)

```bash
# 添加 tap（首次使用）
brew tap ZDragon17/oh-my-claude https://github.com/ZDragon17/oh-my-claude

# 安装
brew install oh-my-claude

# 注册插件
claude plugins install ~/.claude/plugins/oh-my-claude
```

### 方式四：Scoop (Windows)

```powershell
# 添加 bucket（首次使用）
scoop bucket add oh-my-claude https://github.com/ZDragon17/oh-my-claude

# 安装
scoop install oh-my-claude

# 注册插件
claude plugins install $env:USERPROFILE\.claude\plugins\oh-my-claude
```

### 方式五：手动安装

```bash
# 克隆项目
git clone https://github.com/ZDragon17/oh-my-claude.git

# 进入目录
cd oh-my-claude

# 安装为 Claude Code 插件
claude plugins install .
```

### 验证安装

```bash
# 在 Claude Code 中输入
/yishan 你好

# 如果看到愚公移山模式的响应，说明安装成功
```

### 更新插件

```bash
# npm 方式更新（推荐）
npx claude-pangu@latest update

# 或重新运行一键安装脚本（会自动覆盖旧版本）
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.ps1 | iex
```

> ⚠️ **重要**: 更新后请**完全退出**并重新启动 Claude Code（仅关闭窗口可能不够）。macOS 使用 `Cmd+Q` 完全退出，Windows 确保从任务管理器中关闭所有进程。

### 卸载插件

```bash
# npm 方式卸载
npx claude-pangu uninstall

# 或手动删除
# macOS / Linux
rm -rf ~/.claude/commands/{yishan,yugong,zhuge,bianque,luban,wukong}.md  # 等其他命令文件
rm -rf ~/.claude/plugins/oh-my-claude

# Windows (PowerShell)
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\oh-my-claude"
# 命令文件需要单独删除
```

### 故障排除

如果安装后命令无法使用，请按以下步骤排查：

#### 1. 完全重启 Claude Code

```bash
# macOS: 使用 Cmd+Q 完全退出，不只是关闭窗口
# Windows: 确保从任务管理器中关闭所有 Claude 进程
```

#### 2. 验证文件是否安装成功

```bash
# 检查命令文件是否存在
ls ~/.claude/commands/yishan.md

# 查看所有已安装的命令
ls ~/.claude/commands/
```

#### 3. 清除缓存（macOS 特定问题）

macOS 上存在已知的命令发现 Bug ([Issue #13906](https://github.com/anthropics/claude-code/issues/13906))，清除缓存可能解决问题：

```bash
# 清除 Claude Code 缓存
rm ~/.claude.json

# 然后完全重启 Claude Code
```

#### 4. 检查 /help 输出

在 Claude Code 中输入 `/help`，查看是否显示 `yishan`、`zhuge` 等命令。

## 🚀 快速开始

### 1. 愚公移山 - 大规模任务

```bash
/yishan 重构整个用户模块，包括：
- 用户注册
- 用户登录
- 密码重置
- 个人资料管理
```

愚公会自动：
1. 分解任务为可执行的 TODO
2. 逐个完成子任务
3. 遇到问题调整策略继续
4. 所有任务完成才停止

### 2. 诸葛顾问 - 架构设计

```bash
/zhuge 我们的用户系统应该如何设计？需要考虑：
- 多租户支持
- 权限管理
- 高可用性
```

诸葛会提供：
- 架构方案对比
- 技术选型建议
- 风险评估
- 实施路线图

### 3. 扁鹊诊断 - Bug 修复

```bash
/bianque TypeError: Cannot read property 'name' of undefined
  at UserService.getProfile (user.service.ts:42)
```

扁鹊会进行：
- 望闻问切诊断
- 根因分析
- 修复方案
- 预防建议

### 4. 悟空侦察 - 代码探索

```bash
/wukong 找到所有处理用户认证的代码
```

悟空会快速：
- 定位相关文件
- 追踪调用链
- 汇报发现结果

### 5. 鲁班巧工 - 精密实现

```bash
/luban 实现一个带动画效果的 Toast 组件
```

鲁班会精心：
- 设计组件结构
- 实现核心功能
- 优化代码质量

## 📁 项目结构

```
oh-my-claude/
├── .claude-plugin/
│   └── plugin.json           # 插件配置
├── .github/                  # GitHub 配置
│   ├── ISSUE_TEMPLATE/       # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md
├── agents/                   # Agent 定义 (18 个)
│   ├── yugong.md             # 愚公 - 主编排
│   ├── zhuge.md              # 诸葛 - 战略顾问
│   ├── luban.md              # 鲁班 - 精工巧匠
│   ├── wukong.md             # 悟空 - 代码侦察
│   ├── bianque.md            # 扁鹊 - Bug 诊断
│   ├── mozi.md               # 墨子 - 安全审计
│   ├── sunzi.md              # 孙子 - 性能优化
│   ├── simaqian.md           # 司马迁 - 文档撰写
│   ├── zhenghe.md            # 郑和 - API 集成
│   ├── zhangheng.md          # 张衡 - 系统监控
│   ├── libing.md             # 李冰 - DevOps
│   ├── laozi.md              # 老子 - Clean Code
│   ├── baozheng.md           # 包拯 - 测试专家
│   ├── weizheng.md           # 魏征 - 代码审查
│   └── cangjie.md            # 仓颉 - 数据库设计
├── commands/                 # 斜杠命令
│   ├── yugong.md             # /yugong 愚公模式
│   ├── yishan.md             # /yishan 移山模式
│   ├── team.md               # /team 团队协作
│   ├── progress.md           # /progress 进度面板
│   └── ...                   # 其他 Agent 命令
├── scripts/                  # 安装脚本
│   ├── cli.js                # CLI 命令行工具
│   ├── install.js            # 独立安装脚本
│   ├── uninstall.js          # 独立卸载脚本
│   ├── install.sh            # Bash 一键安装
│   ├── install.ps1           # PowerShell 安装
│   ├── postinstall.js        # npm 安装后脚本
│   └── sync-version.js       # 版本同步工具
├── homebrew/                 # Homebrew 配置
│   └── oh-my-claude.rb       # Homebrew Formula
├── scoop/                    # Scoop 配置
│   └── oh-my-claude.json     # Scoop manifest
├── skills/                   # 技能定义
│   ├── bilingual/            # 双语支持
│   └── progress/             # 进度面板
├── hooks/                    # Hook 脚本
│   ├── hooks.json            # Hook 配置
│   ├── todo-enforcer.sh      # Todo 强制执行
│   ├── keyword-detector.sh   # 关键词检测
│   └── progress-notifier.sh  # 进度通知
├── docs/                     # 文档
│   └── AGENT_PROTOCOL.md     # Agent 协作协议
├── .npmignore                # npm 发布排除配置
├── package.json              # npm 包配置
├── CHANGELOG.md              # 变更日志
├── CONTRIBUTING.md           # 贡献指南
├── TROUBLESHOOTING.md        # 故障排查指南
├── LICENSE                   # MIT 许可证
├── README.md                 # 中文文档
└── README_EN.md              # English documentation
```

## 🎯 命令速查

> 💡 直接使用命令名即可，如 `/yishan`、`/zhuge`

### Agent 命令

| 命令 | 功能 |
|------|------|
| `/yugong` 或 `/yishan` | 启动愚公移山模式 |
| `/zhuge` | 召唤诸葛顾问 |
| `/luban` | 召唤鲁班巧匠 |
| `/wukong` | 召唤悟空侦察 |
| `/bianque` | 召唤扁鹊诊断 |
| `/mozi` | 召唤墨子安全 |
| `/sunzi` | 召唤孙子性能 |
| `/simaqian` | 召唤司马迁史官 |
| `/zhenghe` | 召唤郑和 API |
| `/zhangheng` | 召唤张衡监控 |
| `/libing` | 召唤李冰 DevOps |
| `/laozi` | 召唤老子简洁大师 |
| `/baozheng` | 召唤包拯测试专家 |
| `/weizheng` | 召唤魏征代码审查 |
| `/cangjie` | 召唤仓颉数据库专家 |
| `/libai` | 召唤李白需求炼金师 |
| `/gukaizhi` | 召唤顾恺之界面美学师 |
| `/change` | 召唤嫦娥云端仙子 |
| `/huitu` | 召唤绘图多模态分析 |
| `/xuanwu` | 召唤玄武计划审查 |

### 工具命令

| 命令 | 功能 |
|------|------|
| `/progress` | 📊 可视化进度面板 |
| `/team` | 🤝 多 Agent 团队协作 |

### 关键词触发

在任何提示中包含这些关键词会自动激活相应模式：

| 关键词 | 触发模式 |
|--------|----------|
| `ultrawork` `ulw` `移山` `yishan` `persist` `愚公` `yugong` | 愚公移山模式 |
| `架构` `设计` `策略` `architecture` `design` `strategy` `诸葛` `zhuge` `consult` `规划` `planning` | 诸葛顾问提示 |
| `fix bug` `fix error` `debug` `调试` `报错` `异常` `exception` `扁鹊` `bianque` `诊断` `diagnose` | 扁鹊诊断提示 |
| `安全` `漏洞` `注入` `security` `vulnerability` `injection` `墨子` `mozi` `audit` `审计` | 墨子安全提示 |
| `性能` `优化` `慢` `performance` `optimize` `slow` `孙子` `sunzi` `perf` `瓶颈` `bottleneck` | 孙子性能提示 |
| `文档` `注释` `记录` `document` `comment` `readme` `changelog` `司马迁` `simaqian` `史记` | 司马迁文档提示 |
| `API` `接口` `集成` `对接` `integrate` `webhook` `sdk` `郑和` `zhenghe` | 郑和 API 提示 |
| `监控` `日志` `告警` `追踪` `monitor` `logging` `alert` `张衡` `zhangheng` | 张衡监控提示 |
| `DevOps` `CI/CD` `部署` `运维` `docker` `kubernetes` `李冰` `libing` | 李冰 DevOps 提示 |
| `简洁` `简化` `重构` `KISS` `YAGNI` `DRY` `clean code` `老子` `laozi` `至简` | 老子简洁提示 |
| `测试` `单元测试` `test` `TDD` `jest` `pytest` `coverage` `包拯` `baozheng` | 包拯测试提示 |
| `审查` `code review` `review` `CR` `PR` `魏征` `weizheng` | 魏征审查提示 |
| `数据库` `database` `SQL` `表设计` `索引` `migration` `仓颉` `cangjie` | 仓颉数据库提示 |

## 🔧 配置

### 自定义 Agent

在 `~/.claude/agents/` 创建自定义 Agent：

```markdown
---
name: custom-agent
description: 我的自定义 Agent
allowed-tools:
  - Read
  - Write
  - Edit
model: sonnet
---

# 自定义 Agent

你的自定义指令...
```

### 配置管理系统

oh-my-claude 提供了强大的分层配置系统，支持多种配置方式和运行时热重载。

#### 配置层级（优先级从高到低）

1. **环境变量** - 最高优先级，用于 CI/CD 和容器化部署
2. **项目配置** - `./.oh-my-claude.json` 或 `./oh-my-claude.config.json`
3. **用户配置** - `~/.oh-my-claude/config.json`
4. **全局配置** - `~/.oh-my-claude/config/global.json`
5. **默认配置** - 内置的默认值

#### 配置命令

```bash
# 查看当前完整配置
oh-my-claude config show

# 获取特定配置值
oh-my-claude config get debug
oh-my-claude config get agents.defaultTimeout
oh-my-claude config get ui.theme

# 设置配置值
oh-my-claude config set debug true
oh-my-claude config set agents.defaultTimeout 60000
oh-my-claude config set ui.theme dark

# 保存当前配置到文件
oh-my-claude config save
oh-my-claude config save ~/.oh-my-claude/my-config.json

# 重置为默认配置
oh-my-claude config reset
```

#### 环境变量覆盖

支持以下环境变量进行配置覆盖：

```bash
# 基础配置
export OH_MY_CLAUDE_DEBUG=true
export OH_MY_CLAUDE_LOG_LEVEL=debug

# Agent 配置
export OH_MY_CLAUDE_AGENT_TIMEOUT=60000
export OH_MY_CLAUDE_MAX_CONCURRENT=5

# UI 配置
export OH_MY_CLAUDE_THEME=dark
export OH_MY_CLAUDE_LANGUAGE=en-US

# 网络配置
export OH_MY_CLAUDE_TIMEOUT=30000
export OH_MY_CLAUDE_PROXY=http://proxy.company.com:8080
```

#### 示例配置

项目提供了多种环境的配置示例：

```bash
# 查看配置示例
ls examples/configs/

# 使用开发环境配置
cp examples/configs/development.json ~/.oh-my-claude/config.json

# 使用生产环境配置
cp examples/configs/production.json ~/.oh-my-claude/config.json

# 使用最小化配置（适合新用户）
cp examples/configs/minimal.json ~/.oh-my-claude/config.json
```

**开发环境配置特点：**
- 启用调试和详细日志
- 更长的超时时间
- 禁用缓存确保最新代码
- 启用第三方插件支持

**生产环境配置特点：**
- 禁用调试，只显示重要日志
- 优化性能和资源使用
- 严格的安全策略
- 自动更新

#### 热重载

启用追踪功能后，配置文件修改会自动重新加载：

```bash
oh-my-claude config set advanced.enableTracing true
oh-my-claude config save
```

现在修改 `~/.oh-my-claude/config.json` 文件后会自动生效，无需重启。

### 自定义 Agent

在 `~/.claude/agents/` 创建自定义 Agent：

```markdown
---
name: custom-agent
description: 我的自定义 Agent
allowed-tools:
  - Read
  - Write
  - Edit
model: sonnet
---

# 自定义 Agent

你的自定义指令...
```

### 禁用 Hook

编辑 `hooks/hooks.json` 移除不需要的 Hook。

### 修改关键词

编辑 `hooks/keyword-detector.sh` 自定义触发关键词。

## 📖 文化背景

### 愚公 (YuGong)
《列子·汤问》中的老者，年近九十仍坚持移山。最终感动天帝，派夸娥氏二子背走大山。象征坚持不懈的精神。

### 诸葛 (ZhuGe)
三国时期蜀汉丞相诸葛亮，字孔明。"未出茅庐，已知三分天下"，是中国历史上最著名的战略家。

### 鲁班 (LuBan)
春秋战国时期工匠，发明了锯子、墨斗、刨子等工具。被尊为中国工匠的始祖，"百工圣祖"。

### 悟空 (WuKong)
《西游记》中的孙悟空，拥有火眼金睛和七十二变。能识破一切伪装，行动迅速敏捷。

### 扁鹊 (BianQue)
战国时期神医，创立望闻问切四诊法。医术高超，能起死回生。

### 墨子 (MoZi)
墨家学派创始人，主张"兼爱非攻"。精通防御工事和守城策略，以防御智慧著称。

### 孙子 (SunZi)
《孙子兵法》作者，"知己知彼，百战不殆"。世界公认的军事战略经典，强调分析和策略。

### 司马迁 (SimaQian)
西汉史学家，被誉为"史圣"。著有《史记》，开创纪传体通史先河，"究天人之际，通古今之变，成一家之言"。

### 郑和 (ZhengHe)
明代伟大航海家，七下西洋，远航至东南亚、印度洋、波斯湾和非洲东海岸。他的船队促进了中外文化交流和贸易往来，体现了"开放、探索、连接"的精神。

### 张衡 (ZhangHeng)
东汉杰出科学家、天文学家。发明了世界上第一台地震仪——候风地动仪，能够感知远方地震并指示方向。还改进了浑天仪，精确测量天体运行，体现了"观测、感知、预警"的智慧。

### 李冰 (LiBing)
战国时期蜀郡太守，主持修建都江堰水利工程。都江堰历经两千多年仍在发挥作用，体现了"顺势而为、分而治之"的工程智慧，被誉为世界水利史上的奇迹。

### 老子 (LaoZi)
道家学派创始人，著有《道德经》。他提出"道法自然"、"无为而治"的哲学思想，强调"大道至简"——最高深的道理往往是最简单的。老子的智慧在于：去除繁杂，回归本质。

### 包拯 (BaoZheng)
北宋名臣，人称"包青天"、"包公"。以铁面无私、明察秋毫著称，任开封府尹时公正严明，不畏权贵。龙头铡、虎头铡、狗头铡象征对各阶层的公正执法，体现"公正无私、明察秋毫"的精神。

### 魏征 (WeiZheng)
唐代著名谏臣，辅佐唐太宗开创贞观之治。以直言敢谏著称，唐太宗称其为"镜子"。"以铜为镜，可以正衣冠；以人为镜，可以明得失"，体现"直言不讳、明辨是非"的精神。

### 仓颉 (CangJie)
传说中的造字始祖，黄帝时期史官。相传他有四只眼睛，仰观天象、俯察鸟兽之迹，创造了汉字。体现"观察规律、创造结构"的智慧。

## 🗺️ 路线图

- [x] v0.1.0 - 基础 Agent 体系（5 个 Agent）
- [x] v0.2.0 - Agent 协作增强（`@agent` 调用语法、`/team` 命令）
- [x] v0.3.0 - 更多 Agent（墨子、孙子）
- [x] v0.4.0 - 可视化进度面板（`/progress` 命令）
- [x] v0.5.0 - 更多 Agent（司马迁）
- [x] v0.6.0 - 更多 Agent（郑和、张衡、李冰）
- [x] v0.7.0 - 更多 Agent（老子）
- [x] v0.8.0 - 更多 Agent（包拯、魏征、仓颉）
- [x] v0.9.0 - 更多 Agent（李白、顾恺之、嫦娥）
- [x] v1.0.0 - 首个正式版发布 🎉
- [x] v1.1.0 - 愚公移山循环 v2.0 重设计
- [x] v1.2.0 - CLI 模块化重构、测试覆盖率优化
- [x] v1.3.0 - P0 功能对齐（愚公增强、Git Master、Ralph Loop）
- [x] v1.4.0 - P1 功能对齐（重试 Hooks、会话恢复、Metis/Prometheus）
- [x] v1.5.0 - P2 增强功能（JSONC 配置、监控 Hooks）
- [x] v1.6.0 - **功能对齐完成** 🎯（与 oh-my-opencode 95% 对齐）
- [x] v1.7.0 - **100% 功能对齐** 🚀（MCP 自动安装、Session 工具、新 Agent）

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与。

你可以：

1. 🐛 提交 Issue 报告问题或建议
2. 🔧 Fork 后提交 Pull Request
3. 🎭 添加新的 Agent 或命令
4. 📝 改进文档
5. 🌐 完善国际化支持

## 📜 许可证

[MIT License](LICENSE) © 2025 oh-my-claude

## 🙏 致谢

- [Anthropic](https://anthropic.com) - Claude Code
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - 灵感来源
- 中国传统文化 - 智慧源泉

---

<div align="center">

**愚公精神：坚持必将成功 🏔️**

[报告问题](https://github.com/ZDragon17/oh-my-claude/issues) · [提出建议](https://github.com/ZDragon17/oh-my-claude/issues) · [贡献代码](CONTRIBUTING.md)

</div>
