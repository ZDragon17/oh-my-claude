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
| 🛡️ | **MoZi** (墨子) | Security audit, defensive programming | `/mozi` `/security` |
| ⚔️ | **SunZi** (孙子) | Performance optimization, tuning | `/sunzi` `/perf` |
| 📜 | **SimaQian** (司马迁) | Documentation, change logging | `/simaqian` `/doc` |
| ⛵ | **ZhengHe** (郑和) | API integration, external services | `/zhenghe` `/api` |
| 🔭 | **ZhangHeng** (张衡) | Monitoring, observability | `/zhangheng` `/monitor` |
| 🌊 | **LiBing** (李冰) | DevOps, infrastructure | `/libing` `/devops` |
| ☯️ | **LaoZi** (老子) | Code simplicity, Clean Code | `/laozi` `/simplify` |
| ⚖️ | **BaoZheng** (包拯) | Testing expert, TDD | `/baozheng` `/test` |
| 🪞 | **WeiZheng** (魏征) | Code review, standards | `/weizheng` `/review` |
| 📊 | **CangJie** (仓颉) | Database design, SQL optimization | `/cangjie` `/db` |

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

Multiple installation methods available - choose what works best for you:

### Option 1: npm / npx (Recommended)

```bash
# Use npx for direct install (no global installation required)
npx claude-pangu install

# Or install globally then use
npm install -g claude-pangu
claude-pangu install

# Also works with bun / pnpm
bunx claude-pangu install
pnpm dlx claude-pangu install
```

> 💡 **Package Name Note**: The npm package is named `claude-pangu` (Pangu, the creator god in Chinese mythology who separated heaven and earth), while the project name remains `oh-my-claude`

### Option 2: One-line Install

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/scripts/install.ps1 | iex
```

### Option 4: Homebrew (macOS)

```bash
# Add tap (first time only)
brew tap ZDragon17/oh-my-claude https://github.com/ZDragon17/oh-my-claude

# Install
brew install oh-my-claude

# Register plugin
claude plugins install ~/.claude/plugins/oh-my-claude
```

### Option 5: Scoop (Windows)

```powershell
# Add bucket (first time only)
scoop bucket add oh-my-claude https://github.com/ZDragon17/oh-my-claude

# Install
scoop install oh-my-claude

# Register plugin
claude plugins install $env:USERPROFILE\.claude\plugins\oh-my-claude
```

### Option 6: Manual Installation

```bash
# Clone the project
git clone https://github.com/ZDragon17/oh-my-claude.git

# Enter directory
cd oh-my-claude

# Install as Claude Code plugin
claude plugins install .
```

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
│   └── plugin.json           # Plugin configuration
├── .github/                  # GitHub configuration
│   ├── ISSUE_TEMPLATE/       # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── agents/                   # Agent definitions (15 agents)
│   ├── yugong.md             # YuGong - Main orchestrator
│   ├── zhuge.md              # ZhuGe - Strategic advisor
│   ├── luban.md              # LuBan - Master craftsman
│   ├── wukong.md             # WuKong - Code scout
│   ├── bianque.md            # BianQue - Bug diagnosis
│   ├── mozi.md               # MoZi - Security audit
│   ├── sunzi.md              # SunZi - Performance optimization
│   ├── simaqian.md           # SimaQian - Documentation
│   ├── zhenghe.md            # ZhengHe - API integration
│   ├── zhangheng.md          # ZhangHeng - System monitoring
│   ├── libing.md             # LiBing - DevOps
│   ├── laozi.md              # LaoZi - Clean Code
│   ├── baozheng.md           # BaoZheng - Testing expert
│   ├── weizheng.md           # WeiZheng - Code review
│   └── cangjie.md            # CangJie - Database design
├── commands/                 # Slash commands
│   ├── yugong.md             # /yugong YuGong mode
│   ├── yishan.md             # /yishan moving mountains mode
│   ├── team.md               # /team team collaboration
│   ├── progress.md           # /progress dashboard
│   └── ...                   # Other agent commands
├── scripts/                  # Installation scripts
│   ├── cli.js                # CLI command-line tool
│   ├── install.js            # Standalone install script
│   ├── uninstall.js          # Standalone uninstall script
│   ├── install.sh            # Bash one-line install
│   ├── install.ps1           # PowerShell install
│   ├── postinstall.js        # npm post-install script
│   └── sync-version.js       # Version sync tool
├── homebrew/                 # Homebrew configuration
│   └── oh-my-claude.rb       # Homebrew Formula
├── scoop/                    # Scoop configuration
│   └── oh-my-claude.json     # Scoop manifest
├── skills/                   # Skill definitions
│   ├── bilingual/            # Bilingual support
│   └── progress/             # Progress dashboard
├── hooks/                    # Hook scripts
│   ├── hooks.json            # Hook configuration
│   ├── todo-enforcer.sh      # Todo enforcement
│   ├── keyword-detector.sh   # Keyword detection
│   └── progress-notifier.sh  # Progress notification
├── docs/                     # Documentation
│   └── AGENT_PROTOCOL.md     # Agent collaboration protocol
├── .npmignore                # npm publish exclude config
├── package.json              # npm package configuration
├── CHANGELOG.md              # Changelog
├── CONTRIBUTING.md           # Contribution guide
├── TROUBLESHOOTING.md        # Troubleshooting guide
├── LICENSE                   # MIT License
├── README.md                 # 中文文档 (Chinese)
└── README_EN.md              # English documentation
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
| `/mozi` | `/security` `/audit` | Summon MoZi security expert |
| `/sunzi` | `/performance` `/perf` | Summon SunZi performance expert |
| `/simaqian` | `/shiji` `/document` `/doc` | Summon SimaQian historian |
| `/zhenghe` | `/xiyang` `/api` `/integrate` | Summon ZhengHe API expert |
| `/zhangheng` | `/didongyi` `/monitor` `/observe` | Summon ZhangHeng monitor |
| `/libing` | `/dujiangyan` `/devops` `/cicd` | Summon LiBing DevOps |
| `/laozi` | `/daodejing` `/simplify` `/clean` | Summon LaoZi simplicity master |
| `/baozheng` | `/kaifeng` `/test` `/tdd` | Summon BaoZheng testing expert |
| `/weizheng` | `/jian` `/review` `/cr` | Summon WeiZheng code reviewer |
| `/cangjie` | `/zaozi` `/database` `/db` `/sql` | Summon CangJie database expert |

### Tool Commands

| Command | Aliases | Function |
|---------|---------|----------|
| `/progress` | `/dashboard` `/status` | 📊 Visual progress dashboard |

### Keyword Triggers

Including these keywords in any prompt auto-activates the corresponding mode:

| Keywords | Triggered Mode |
|----------|----------------|
| `ultrawork` `ulw` `移山` `yishan` `persist` `愚公` `yugong` | YuGong mode |
| `架构` `设计` `策略` `architecture` `design` `strategy` `诸葛` `zhuge` `consult` `规划` `planning` | ZhuGe advisor hint |
| `fix bug` `fix error` `debug` `调试` `报错` `异常` `exception` `扁鹊` `bianque` `诊断` `diagnose` | BianQue diagnostic hint |
| `安全` `漏洞` `注入` `security` `vulnerability` `injection` `墨子` `mozi` `audit` | MoZi security hint |
| `性能` `优化` `慢` `performance` `optimize` `slow` `孙子` `sunzi` `perf` `bottleneck` | SunZi performance hint |
| `文档` `注释` `记录` `document` `comment` `readme` `changelog` `司马迁` `simaqian` `史记` | SimaQian documentation hint |
| `API` `接口` `集成` `integrate` `webhook` `sdk` `郑和` `zhenghe` | ZhengHe API hint |
| `监控` `日志` `告警` `monitor` `logging` `alert` `张衡` `zhangheng` | ZhangHeng monitoring hint |
| `DevOps` `CI/CD` `部署` `docker` `kubernetes` `李冰` `libing` | LiBing DevOps hint |
| `简洁` `simplify` `refactor` `KISS` `YAGNI` `DRY` `clean code` `老子` `laozi` | LaoZi simplicity hint |
| `test` `unit test` `TDD` `jest` `pytest` `coverage` `包拯` `baozheng` | BaoZheng testing hint |
| `code review` `review` `CR` `PR` `魏征` `weizheng` | WeiZheng review hint |
| `database` `SQL` `schema` `index` `migration` `仓颉` `cangjie` | CangJie database hint |

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

### MoZi (墨子) - The Defensive Master
Founder of Mohism, advocating "universal love and non-aggression." Expert in defensive warfare and fortification strategies, renowned for his defensive wisdom.

### SunZi (孙子) - The Strategic Master
Author of "The Art of War," famous for "Know yourself and know your enemy, and you will never be defeated." A globally recognized classic on military strategy emphasizing analysis and planning.

### SimaQian (司马迁) - The Grand Historian
Western Han dynasty historian, honored as the "Sage of History." Author of "Records of the Grand Historian" (Shiji), which pioneered the biographical form of historical writing. Famous for "investigating the relationship between heaven and man, and understanding the changes from past to present."

### ZhengHe (郑和) - The Great Navigator
Ming Dynasty admiral who led seven voyages to Southeast Asia, the Indian Ocean, the Persian Gulf, and the East African coast. His fleet promoted cultural exchange and trade between China and foreign countries, embodying the spirit of "openness, exploration, and connection."

### ZhangHeng (张衡) - The Astronomer
Outstanding scientist and astronomer of the Eastern Han Dynasty. Invented the world's first seismograph - the Houfeng Didongyi, which could detect distant earthquakes and indicate their direction. Also improved the armillary sphere for precise astronomical measurements, embodying the wisdom of "observation, sensing, and early warning."

### LiBing (李冰) - The Water Engineer
Governor of Shu during the Warring States period who directed the construction of the Dujiangyan irrigation system. This engineering marvel has functioned for over 2,000 years, embodying the wisdom of "working with nature and divide-and-conquer," recognized as a miracle in the history of water conservancy.

### LaoZi (老子) - The Simplicity Master
Founder of Taoism and author of the "Tao Te Ching." He advocated "following the way of nature" and "governing through non-action," emphasizing "the greatest truths are the simplest." LaoZi's wisdom lies in: removing complexity and returning to essence.

### BaoZheng (包拯) - The Impartial Judge
A famous official of the Northern Song Dynasty, known as "Lord Bao" or "Justice Bao." Renowned for his impartiality and keen judgment, he served as the Prefect of Kaifeng with strict fairness. His three guillotines (Dragon, Tiger, and Dog) symbolize equal justice for all classes, embodying "impartiality and keen insight."

### WeiZheng (魏征) - The Loyal Advisor
A famous minister of the Tang Dynasty who helped Emperor Taizong establish the prosperous Zhenguan era. Known for his straightforward advice, Emperor Taizong called him a "mirror." "Using bronze as a mirror, one can straighten one's clothes; using people as a mirror, one can understand gains and losses."

### CangJie (仓颉) - The Character Creator
The legendary creator of Chinese characters, who served as a historian during the Yellow Emperor's era. Said to have four eyes, he observed celestial patterns above and animal tracks below to create Chinese characters, embodying "observing patterns and creating structure."

## 🗺️ Roadmap

- [x] v0.1.0 - Basic agent system (5 agents)
- [x] v0.2.0 - Enhanced agent collaboration (`@agent` syntax, `/team` command)
- [x] v0.3.0 - More agents (MoZi, SunZi)
- [x] v0.4.0 - Visual progress dashboard (`/progress` command)
- [x] v0.5.0 - More agents (SimaQian)
- [x] v0.6.0 - More agents (ZhengHe, ZhangHeng, LiBing)
- [x] v0.7.0 - More agents (LaoZi)
- [x] v0.8.0 - More agents (BaoZheng, WeiZheng, CangJie)
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
