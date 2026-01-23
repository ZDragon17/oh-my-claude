---
name: verify
description: 安装验证命令 - 检查 oh-my-claude 安装状态和功能完整性
allowed-tools:
  - Read
  - Glob
  - Bash
model: haiku
---

<command-name>/verify</command-name>

# 安装验证命令

验证 oh-my-claude 插件安装是否正确，检查各组件状态。

## 执行流程

### 步骤 1: 显示验证进度

```text
🔍 正在验证 oh-my-claude 安装状态...
```

### 步骤 2: 执行验证检查

依次检查以下项目：

#### 1. 插件目录检查

```bash
# 检查插件目录是否存在
ls -d ~/.claude/plugins/oh-my-claude 2>/dev/null
```

#### 2. 命令文件检查

```bash
# 检查核心命令是否存在
ls ~/.claude/commands/yishan.md 2>/dev/null
ls ~/.claude/commands/zhuge.md 2>/dev/null
ls ~/.claude/commands/bianque.md 2>/dev/null
ls ~/.claude/commands/luban.md 2>/dev/null
ls ~/.claude/commands/wukong.md 2>/dev/null
```

统计命令总数：
```bash
ls ~/.claude/commands/*.md 2>/dev/null | wc -l
```

#### 3. Agent 文件检查

```bash
# 检查 Agent 定义是否存在
ls ~/.claude/plugins/oh-my-claude/agents/*.md 2>/dev/null | wc -l
```

#### 4. Hook 配置检查

```bash
# 检查 Hook 配置
cat ~/.claude/plugins/oh-my-claude/hooks/hooks.json 2>/dev/null | head -5
```

#### 5. Skill 检查

```bash
# 检查技能定义
ls ~/.claude/plugins/oh-my-claude/skills/*/SKILL.md 2>/dev/null | wc -l
```

#### 6. 版本检查

```bash
# 获取版本号
cat ~/.claude/plugins/oh-my-claude/package.json 2>/dev/null | grep '"version"'
```

### 步骤 3: 生成验证报告

根据检查结果生成报告：

#### 全部通过时

```text
╔══════════════════════════════════════════════════════════════╗
║            ✅ oh-my-claude 安装验证通过                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📦 版本: v2.0.16                                            ║
║                                                              ║
║  📋 组件状态                                                 ║
║  ────────────────────────────────────────────────────────    ║
║  ✅ 插件目录    ~/.claude/plugins/oh-my-claude               ║
║  ✅ 命令文件    51 个命令已安装                               ║
║  ✅ Agent 定义  20 个专家已就绪                               ║
║  ✅ Hook 配置   43 个 Hook 已激活                             ║
║  ✅ 技能模块    9 个技能已加载                                ║
║                                                              ║
║  🚀 快速开始                                                 ║
║  ────────────────────────────────────────────────────────    ║
║  /do [任务]      极简万能入口                                 ║
║  /help           查看命令帮助                                 ║
║  /tutorial       交互式教程                                   ║
║  /agents         查看所有专家                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

#### 部分问题时

```text
╔══════════════════════════════════════════════════════════════╗
║            ⚠️ oh-my-claude 安装需要修复                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📋 组件状态                                                 ║
║  ────────────────────────────────────────────────────────    ║
║  ✅ 插件目录    存在                                         ║
║  ⚠️ 命令文件    缺少 5 个核心命令                             ║
║  ✅ Agent 定义  20 个专家已就绪                               ║
║  ❌ Hook 配置   未找到配置文件                                ║
║  ✅ 技能模块    9 个技能已加载                                ║
║                                                              ║
║  🔧 修复建议                                                 ║
║  ────────────────────────────────────────────────────────    ║
║  1. 重新安装插件:                                            ║
║     npx claude-pangu@latest install                          ║
║                                                              ║
║  2. 或手动同步命令:                                          ║
║     cp ~/.claude/plugins/oh-my-claude/commands/*.md \        ║
║        ~/.claude/commands/                                   ║
║                                                              ║
║  3. 重启 Claude Code（完全退出后重新打开）                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

#### 未安装时

```text
╔══════════════════════════════════════════════════════════════╗
║            ❌ oh-my-claude 未安装                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  未检测到 oh-my-claude 插件。                                ║
║                                                              ║
║  🚀 安装方式                                                 ║
║  ────────────────────────────────────────────────────────    ║
║                                                              ║
║  方式一：npx 安装（推荐）                                    ║
║  npx claude-pangu install                                    ║
║                                                              ║
║  方式二：一键脚本                                            ║
║  curl -fsSL https://raw.githubusercontent.com/ZDragon17/\    ║
║       oh-my-claude/main/scripts/install.sh | bash            ║
║                                                              ║
║  方式三：手动安装                                            ║
║  git clone https://github.com/ZDragon17/oh-my-claude         ║
║  cd oh-my-claude                                             ║
║  claude plugins install .                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 详细诊断模式

`/verify --verbose` 或 `/verify -v`

显示详细的检查信息，包括：

```text
🔍 详细验证报告
═══════════════════════════════════════════════════════════════

📁 目录结构
────────────────────────────────────────────────────────────────
~/.claude/
├── commands/           51 files ✅
├── plugins/
│   └── oh-my-claude/
│       ├── agents/     20 files ✅
│       ├── commands/   51 files ✅
│       ├── hooks/      43 files ✅
│       ├── skills/     9 dirs  ✅
│       └── package.json ✅
└── settings.json       存在 ✅

📋 核心命令清单
────────────────────────────────────────────────────────────────
✅ /yishan  (愚公移山)    ✅ /zhuge   (诸葛顾问)
✅ /luban   (鲁班巧匠)    ✅ /bianque (扁鹊诊断)
✅ /wukong  (悟空侦察)    ✅ /weizheng(魏征审查)
✅ /sunzi   (孙子兵法)    ✅ /mozi    (墨子安全)
✅ /baozheng(包拯测试)    ✅ /simaqian(司马迁史记)
... (查看全部: /agents)

🪝 Hook 状态
────────────────────────────────────────────────────────────────
✅ todo-enforcer.sh      Todo 强制执行
✅ keyword-detector.sh   关键词检测
✅ progress-notifier.sh  进度通知
✅ session-restore.sh    会话恢复
... 共 43 个 Hook

🎯 功能测试
────────────────────────────────────────────────────────────────
✅ 命令解析正常
✅ Agent 调用正常
✅ Skill 加载正常
⚠️ MCP 服务器未配置（可选）

💡 建议
────────────────────────────────────────────────────────────────
• 运行 /tutorial 了解基本用法
• 尝试 /do [任务] 开始第一个任务
```

---

## 快速修复模式

`/verify --fix`

自动尝试修复检测到的问题：

```text
🔧 正在修复检测到的问题...

1. 同步命令文件...
   cp ~/.claude/plugins/oh-my-claude/commands/*.md ~/.claude/commands/
   ✅ 已同步 51 个命令

2. 检查 Hook 权限...
   chmod +x ~/.claude/plugins/oh-my-claude/hooks/*.sh
   ✅ 已修复权限

3. 验证配置完整性...
   ✅ 配置文件完整

🎉 修复完成！请重启 Claude Code 使更改生效。
```

---

## 深度诊断

如果验证发现问题但修复无效，或需要更详细的系统分析：

```bash
# 运行深度诊断
/diagnose
```

`/diagnose` 命令提供更全面的检查，包括：
- 环境配置检查
- 依赖完整性验证
- Hook 性能分析
- MCP 服务器状态
- 权限和路径问题诊断

---

## 别名

- `/verify` - 主命令
- `/check` - 简写别名
- `/验证` - 中文别名
- `/检查` - 中文别名
- `/health` - 健康检查别名
