# oh-my-claude 🏔️

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

## 📦 安装

### 方式一：克隆安装

```bash
# 克隆项目
git clone https://github.com/ZDragon17/oh-my-claude.git

# 进入目录
cd oh-my-claude

# 安装为 Claude Code 插件
claude plugins install .
```

### 方式二：手动安装

1. 将 `oh-my-claude` 目录复制到 `~/.claude/plugins/`
2. 重启 Claude Code

### 验证安装

```bash
# 在 Claude Code 中输入
/yishan 你好

# 如果看到愚公移山模式的响应，说明安装成功
```

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
│   └── plugin.json          # 插件配置
├── .github/                  # GitHub 配置
│   ├── ISSUE_TEMPLATE/      # Issue 模板
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── new_agent.md
│   └── PULL_REQUEST_TEMPLATE.md
├── agents/                   # Agent 定义
│   ├── yugong.md            # 愚公 - 主编排
│   ├── zhuge.md             # 诸葛 - 战略顾问
│   ├── luban.md             # 鲁班 - 精工巧匠
│   ├── wukong.md            # 悟空 - 代码侦察
│   └── bianque.md           # 扁鹊 - Bug 诊断
├── commands/                 # 斜杠命令
│   ├── yugong.md            # /yugong 愚公模式
│   ├── yishan.md            # /yishan 移山模式
│   ├── zhuge.md             # /zhuge 顾问模式
│   ├── luban.md             # /luban 巧工模式
│   ├── wukong.md            # /wukong 侦察模式
│   └── bianque.md           # /bianque 诊断模式
├── skills/                   # 技能定义
│   └── bilingual/           # 双语支持
│       ├── skill.json       # 技能配置
│       └── SKILL.md
├── hooks/                    # Hook 脚本
│   ├── hooks.json           # Hook 配置
│   ├── todo-enforcer.sh     # Todo 强制执行
│   └── keyword-detector.sh  # 关键词检测
├── docs/                     # 文档
│   └── AGENT_PROTOCOL.md    # Agent 协作协议
├── .gitattributes           # Git 属性配置
├── CONTRIBUTING.md          # 贡献指南
├── CODE_OF_CONDUCT.md       # 行为准则
├── CHANGELOG.md             # 变更日志
├── LICENSE                  # MIT 许可证
├── README.md                # 中文文档
└── README_EN.md             # English documentation
```

## 🎯 命令速查

### Agent 命令

| 命令 | 别名 | 功能 |
|------|------|------|
| `/yugong` | `/yishan` `/persist` `/ultrawork` `/ulw` | 启动愚公移山模式 |
| `/zhuge` | `/longzhong` `/strategy` `/consult` | 召唤诸葛顾问 |
| `/luban` | `/qiaogong` `/craft` `/frontend` | 召唤鲁班巧匠 |
| `/wukong` | `/huoyan` `/explore` `/scout` | 召唤悟空侦察 |
| `/bianque` | `/wangwen` `/debug` `/diagnose` | 召唤扁鹊诊断 |
| `/mozi` | `/security` `/audit` `/安全` | 召唤墨子安全 |
| `/sunzi` | `/performance` `/perf` `/性能` `/优化` | 召唤孙子性能 |
| `/simaqian` | `/shiji` `/document` `/doc` `/司马迁` `/史记` | 召唤司马迁史官 |
| `/zhenghe` | `/xiyang` `/api` `/integrate` `/郑和` `/接口` | 召唤郑和 API |
| `/zhangheng` | `/didongyi` `/monitor` `/observe` `/张衡` `/监控` | 召唤张衡监控 |
| `/libing` | `/dujiangyan` `/devops` `/cicd` `/李冰` `/运维` | 召唤李冰 DevOps |
| `/laozi` | `/daodejing` `/simplify` `/clean` `/老子` `/简洁` `/至简` | 召唤老子简洁大师 |

### 工具命令

| 命令 | 别名 | 功能 |
|------|------|------|
| `/progress` | `/进度` `/dashboard` `/面板` `/status` | 📊 可视化进度面板 |

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

## 🗺️ 路线图

- [x] v0.1.0 - 基础 Agent 体系（5 个 Agent）
- [x] v0.2.0 - Agent 协作增强（`@agent` 调用语法、`/team` 命令）
- [x] v0.3.0 - 更多 Agent（墨子、孙子）
- [x] v0.4.0 - 可视化进度面板（`/progress` 命令）
- [x] v0.5.0 - 更多 Agent（司马迁）
- [x] v0.6.0 - 更多 Agent（郑和、张衡、李冰）
- [x] v0.7.0 - 更多 Agent（老子）
- [ ] v1.0.0 - 稳定版发布

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
