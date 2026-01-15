# oh-my-claude 🏔️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blueviolet)](https://claude.ai)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![中文](https://img.shields.io/badge/语言-中文-red.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README_EN.md)

> A Claude Code intelligent orchestration plugin inspired by Chinese traditional culture

```
The Taihang and Wangwu Mountains, covering seven hundred li,
rose to a great height...
The Foolish Old Man said: "When I die, my sons will carry on;
when they die, there will be my grandsons, and then their sons
and grandsons. So generations will go on and on without end,
while the mountains cannot grow any higher."

                                    — "Liezi: Questions of Tang"
```

## 🌟 Philosophy

### Tribute to oh-my-opencode

This project is inspired by [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode), an excellent Claude Code plugin ecosystem project. Building upon their pioneering work, we've infused Chinese traditional cultural elements to create this Eastern-flavored version.

### The YuGong Spirit

> "So generations will go on and on without end, while the mountains cannot grow any higher."

oh-my-claude's core philosophy comes from the spirit of "YuGong Moves Mountains": **With the right direction, persistence leads to success.**

- 🏔️ **Persistent Execution** - Never stop until the task is complete
- 🎯 **Goal-Oriented** - Break down big tasks, conquer them one by one
- 💪 **Never Give Up** - Adjust strategy and keep going when facing obstacles

## ✨ Features

### 🎭 Intelligent Agent System

Specialized agents based on Chinese cultural figures:

| Agent | Name | Specialty | Commands |
|-------|------|-----------|----------|
| 🏔️ | **YuGong** (愚公) | Main orchestrator, large-scale tasks | `/yugong` `/yishan` |
| 🎯 | **ZhuGe** (诸葛) | Strategic advisor, architecture | `/zhuge` `/longzhong` |
| 🔧 | **LuBan** (鲁班) | Master craftsman, implementation | `/luban` `/qiaogong` |
| 🔍 | **WuKong** (悟空) | Code scout, fast exploration | `/wukong` `/huoyan` |
| 🩺 | **BianQue** (扁鹊) | Bug diagnosis, problem fixing | `/bianque` `/wangwen` |

### 🔄 YuGong Moving Mountains Mode

Core feature: **Never stop until it's done**

```bash
# Start YuGong mode
/yishan refactor the entire auth module

# Or use English aliases
/ultrawork refactor the entire auth module
```

- ✅ Automatic task decomposition and tracking
- ✅ Todo enforcement (cannot stop with incomplete tasks)
- ✅ Intelligent error recovery
- ✅ Transparent progress reporting

### 🌐 Bilingual Support

All commands support both Chinese and English:

```bash
# Chinese
/愚公 implement user login
/诸葛 analyze this architecture
/扁鹊 how to fix this error

# English
/persist implement user login
/strategy analyze this architecture
/debug how to fix this error
```

### 🪝 Smart Hook System

- **Todo Enforcer**: Detects incomplete tasks, prevents premature stopping
- **Keyword Detector**: Auto-activates appropriate modes

## 📦 Installation

### Option 1: Clone and Install

```bash
# Clone the project
git clone https://github.com/ZDragon17/oh-my-claude.git

# Enter directory
cd oh-my-claude

# Install as Claude Code plugin
claude plugins install .
```

### Option 2: Manual Installation

1. Copy the `oh-my-claude` directory to `~/.claude/plugins/`
2. Restart Claude Code

### Verify Installation

```bash
# In Claude Code, type
/yishan hello

# If you see YuGong mode response, installation is successful
```

## 🚀 Quick Start

### 1. YuGong Mode - Large-scale Tasks

```bash
/yishan Refactor the entire user module, including:
- User registration
- User login
- Password reset
- Profile management
```

YuGong will automatically:
1. Decompose tasks into executable TODOs
2. Complete subtasks one by one
3. Adjust strategy and continue when facing issues
4. Stop only when all tasks are complete

### 2. ZhuGe Advisor - Architecture Design

```bash
/zhuge How should we design our user system? Consider:
- Multi-tenancy support
- Permission management
- High availability
```

ZhuGe will provide:
- Architecture comparison
- Technology recommendations
- Risk assessment
- Implementation roadmap

### 3. BianQue Diagnosis - Bug Fixing

```bash
/bianque TypeError: Cannot read property 'name' of undefined
  at UserService.getProfile (user.service.ts:42)
```

BianQue will perform:
- Four-step diagnosis (望闻问切)
- Root cause analysis
- Fix recommendations
- Prevention suggestions

### 4. WuKong Scout - Code Exploration

```bash
/wukong Find all code handling user authentication
```

WuKong will quickly:
- Locate relevant files
- Trace call chains
- Report findings

### 5. LuBan Craftsman - Precision Implementation

```bash
/luban Implement a Toast component with animations
```

LuBan will carefully:
- Design component structure
- Implement core functionality
- Optimize code quality

## 📁 Project Structure

```
oh-my-claude/
├── .claude-plugin/
│   └── plugin.json          # Plugin configuration
├── .github/                  # GitHub configuration
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── new_agent.md
│   └── PULL_REQUEST_TEMPLATE.md
├── agents/                   # Agent definitions
│   ├── yugong.md            # YuGong - Main orchestrator
│   ├── zhuge.md             # ZhuGe - Strategic advisor
│   ├── luban.md             # LuBan - Master craftsman
│   ├── wukong.md            # WuKong - Code scout
│   └── bianque.md           # BianQue - Bug diagnosis
├── commands/                 # Slash commands
│   ├── yugong.md            # /yugong YuGong mode
│   ├── yishan.md            # /yishan moving mountains mode
│   ├── zhuge.md             # /zhuge advisor mode
│   ├── luban.md             # /luban craftsman mode
│   ├── wukong.md            # /wukong scout mode
│   └── bianque.md           # /bianque diagnostic mode
├── skills/                   # Skill definitions
│   └── bilingual/           # Bilingual support
│       ├── skill.json       # Skill configuration
│       └── SKILL.md
├── hooks/                    # Hook scripts
│   ├── hooks.json           # Hook configuration
│   ├── todo-enforcer.sh     # Todo enforcement
│   └── keyword-detector.sh  # Keyword detection
├── docs/                     # Documentation
│   └── AGENT_PROTOCOL.md    # Agent collaboration protocol
├── .gitattributes           # Git attributes configuration
├── CONTRIBUTING.md          # Contribution guide
├── CODE_OF_CONDUCT.md       # Code of conduct
├── CHANGELOG.md             # Changelog
├── LICENSE                  # MIT License
├── README.md                # 中文文档 (Chinese)
└── README_EN.md             # English documentation
```

## 🎯 Command Reference

### Agent Commands

| Command | Aliases | Function |
|---------|---------|----------|
| `/yugong` | `/yishan` `/persist` `/ultrawork` `/ulw` | Start YuGong mode |
| `/zhuge` | `/longzhong` `/strategy` `/consult` | Summon ZhuGe advisor |
| `/luban` | `/qiaogong` `/craft` `/frontend` | Summon LuBan craftsman |
| `/wukong` | `/huoyan` `/explore` `/scout` | Summon WuKong scout |
| `/bianque` | `/wangwen` `/debug` `/diagnose` | Summon BianQue diagnostician |

### Keyword Triggers

Including these keywords in any prompt auto-activates the corresponding mode:

| Keywords | Triggered Mode |
|----------|----------------|
| `ultrawork` `ulw` `移山` `yishan` `persist` `愚公` `yugong` | YuGong mode |
| `架构` `设计` `策略` `architecture` `design` `strategy` `诸葛` `zhuge` `consult` `规划` `planning` | ZhuGe advisor hint |
| `fix bug` `fix error` `debug` `调试` `报错` `异常` `exception` `扁鹊` `bianque` `诊断` `diagnose` | BianQue diagnostic hint |

## 🔧 Configuration

### Custom Agents

Create custom agents in `~/.claude/agents/`:

```markdown
---
name: custom-agent
description: My custom agent
allowed-tools:
  - Read
  - Write
  - Edit
model: sonnet
---

# Custom Agent

Your custom instructions...
```

### Disable Hooks

Edit `hooks/hooks.json` to remove unwanted hooks.

### Modify Keywords

Edit `hooks/keyword-detector.sh` to customize trigger keywords.

## 📖 Cultural Background

### YuGong (愚公) - The Foolish Old Man
From "Liezi: Questions of Tang" - An old man nearly ninety who persisted in moving mountains. He eventually moved the gods, who sent giants to carry the mountains away. Symbolizes unwavering persistence.

### ZhuGe (诸葛) - Zhuge Liang
Prime Minister of Shu Han during the Three Kingdoms period. Famous for "knowing the world would be divided into three before leaving his thatched cottage." China's most renowned strategist.

### LuBan (鲁班) - Master Lu
Craftsman from the Spring and Autumn period who invented the saw, ink line, plane, and other tools. Revered as the ancestor of Chinese craftsmen, the "Sage of All Trades."

### WuKong (悟空) - Sun Wukong
The Monkey King from "Journey to the West." Possesses fiery golden eyes that see through all disguises and 72 transformations. Swift and perceptive.

### BianQue (扁鹊) - Divine Physician
Legendary doctor from the Warring States period who created the four diagnostic methods (望闻问切 - observe, listen, inquire, examine). Known for miraculous healing abilities.

## 🗺️ Roadmap

- [x] v0.1.0 - Basic agent system (5 agents)
- [ ] v0.2.0 - Enhanced agent collaboration
- [ ] v0.3.0 - More agents (Mozi, Sunzi...)
- [ ] v0.4.0 - Visual progress dashboard
- [ ] v1.0.0 - Stable release

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to participate.

You can:

1. 🐛 Submit Issues to report problems or suggestions
2. 🔧 Fork and submit Pull Requests
3. 🎭 Add new agents or commands
4. 📝 Improve documentation
5. 🌐 Enhance internationalization support

## 📜 License

[MIT License](LICENSE) © 2025 oh-my-claude

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) - Claude Code
- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - Inspiration
- Chinese Traditional Culture - Source of wisdom

---

<div align="center">

**YuGong Spirit: Persistence Leads to Success 🏔️**

[Report Issue](https://github.com/ZDragon17/oh-my-claude/issues) · [Suggest Feature](https://github.com/ZDragon17/oh-my-claude/issues) · [Contribute](CONTRIBUTING.md)

</div>
