---
name: diagnose
description: 插件自诊断命令 - 全面检查 oh-my-claude 健康状态，检测问题并提供修复建议
aliases:
  - /诊断
  - /health-check
  - /doctor
allowed-tools:
  - Read
  - Glob
  - Bash
model: haiku
---

<command-name>/diagnose</command-name>

# 插件自诊断命令

全面检查 oh-my-claude 插件的运行状态，主动发现潜在问题并提供修复建议。

## 与 /verify 的区别

| 命令 | 用途 | 深度 |
|------|------|------|
| `/verify` | 安装验证 - 检查文件是否存在 | 浅层检查 |
| `/diagnose` | 运行诊断 - 检查功能是否正常 | 深度检查 |

## 执行流程

### 步骤 1: 显示诊断启动

```text
🏥 oh-my-claude 诊断中心
═══════════════════════════════════════════════════════════════

正在进行全面健康检查...
```

### 步骤 2: 执行诊断项目

依次执行以下诊断类别：

---

## 诊断类别

### 📦 1. 核心组件诊断

检查插件核心文件完整性：

```bash
# 检查插件目录
ls -d ~/.claude/plugins/oh-my-claude 2>/dev/null

# 检查 plugin.json
cat ~/.claude/plugins/oh-my-claude/.claude-plugin/plugin.json 2>/dev/null | head -10

# 检查 package.json 版本
cat ~/.claude/plugins/oh-my-claude/package.json 2>/dev/null | grep '"version"'

# 检查核心目录
ls -d ~/.claude/plugins/oh-my-claude/agents 2>/dev/null
ls -d ~/.claude/plugins/oh-my-claude/commands 2>/dev/null
ls -d ~/.claude/plugins/oh-my-claude/hooks 2>/dev/null
ls -d ~/.claude/plugins/oh-my-claude/skills 2>/dev/null
```

**诊断结果示例：**

```text
📦 核心组件
────────────────────────────────────────────────────────────────
✅ 插件目录        ~/.claude/plugins/oh-my-claude
✅ plugin.json     配置完整
✅ package.json    v2.1.3
✅ agents/         20 个 Agent 定义
✅ commands/       73 个命令定义
✅ hooks/          45 个 Hook 脚本
✅ skills/         14 个技能模块
```

---

### 🎭 2. Agent 可用性诊断

检查所有 Agent 是否可正常加载：

```bash
# 列出所有 Agent 文件
ls ~/.claude/plugins/oh-my-claude/agents/*.md 2>/dev/null

# 检查 Agent 文件格式是否正确（YAML frontmatter）
for f in ~/.claude/plugins/oh-my-claude/agents/*.md; do
  head -1 "$f" | grep -q "^---" && echo "ok:$(basename $f)" || echo "err:$(basename $f)"
done 2>/dev/null
```

**诊断结果示例：**

```text
🎭 Agent 可用性
────────────────────────────────────────────────────────────────
✅ yugong.md       愚公 - 主编排 Agent
✅ zhuge.md        诸葛 - 战略顾问
✅ luban.md        鲁班 - 精工巧匠
✅ wukong.md       悟空 - 代码侦察
✅ bianque.md      扁鹊 - Bug 诊断
✅ mozi.md         墨子 - 安全审计
✅ sunzi.md        孙子 - 性能优化
✅ simaqian.md     司马迁 - 文档撰写
✅ zhenghe.md      郑和 - API 集成
✅ zhangheng.md    张衡 - 系统监控
✅ libing.md       李冰 - DevOps
✅ laozi.md        老子 - Clean Code
✅ baozheng.md     包拯 - 测试专家
✅ weizheng.md     魏征 - 代码审查
✅ cangjie.md      仓颉 - 数据库设计
✅ libai.md        李白 - 需求分析
✅ gukaizhi.md     顾恺之 - UI/UX
✅ change.md       嫦娥 - 云服务
✅ lilou.md        离娄 - 多模态
✅ liubowen.md     刘伯温 - 计划审查

状态: 20/20 Agent 可用
```

---

### 🪝 3. Hook 状态诊断

检查 Hook 配置和执行权限：

```bash
# 检查 hooks.json 配置
cat ~/.claude/plugins/oh-my-claude/hooks/hooks.json 2>/dev/null | head -30

# 检查 Hook 脚本权限（Unix）
ls -la ~/.claude/plugins/oh-my-claude/hooks/*.sh 2>/dev/null | head -10

# 检查关键 Hook 是否存在
ls ~/.claude/plugins/oh-my-claude/hooks/todo-enforcer.sh 2>/dev/null
ls ~/.claude/plugins/oh-my-claude/hooks/progress-notifier.sh 2>/dev/null
ls ~/.claude/plugins/oh-my-claude/hooks/keyword-detector.sh 2>/dev/null
```

**诊断结果示例：**

```text
🪝 Hook 状态
────────────────────────────────────────────────────────────────
配置文件: ✅ hooks.json 有效

UserPromptSubmit Hooks (12 个):
  ✅ keyword-detector.sh         关键词检测
  ✅ agent-usage-reminder.sh     Agent 使用提醒
  ✅ auto-slash-command.sh       自动命令建议
  ✅ session-recovery.sh         会话恢复
  ✅ first-use-onboarding.sh     新手引导
  ⚠️ directory-readme-injector.sh  权限不足
  ...

PostToolUse Hooks (18 个):
  ✅ progress-notifier.sh        进度通知
  ✅ todo-enforcer.sh            TODO 强制执行
  ✅ failure-transparency.sh     失败透明度
  ...

Stop Hooks (5 个):
  ✅ ralph-loop.sh               Ralph Loop 检测
  ...

状态: 43/45 Hook 正常, 2 个需要修复
```

---

### 📋 4. 命令同步诊断

检查命令文件是否正确同步到 Claude Code：

```bash
# 统计源命令数
ls ~/.claude/plugins/oh-my-claude/commands/*.md 2>/dev/null | wc -l

# 统计已安装命令数
ls ~/.claude/commands/*.md 2>/dev/null | wc -l

# 检查关键命令是否已同步
ls ~/.claude/commands/yishan.md 2>/dev/null && echo "yishan:synced" || echo "yishan:missing"
ls ~/.claude/commands/do.md 2>/dev/null && echo "do:synced" || echo "do:missing"
ls ~/.claude/commands/help.md 2>/dev/null && echo "help:synced" || echo "help:missing"
```

**诊断结果示例：**

```text
📋 命令同步
────────────────────────────────────────────────────────────────
源命令:     73 个 (plugins/oh-my-claude/commands/)
已同步:     73 个 (~/.claude/commands/)

核心命令检查:
  ✅ /yishan      已同步
  ✅ /do          已同步
  ✅ /help        已同步
  ✅ /verify      已同步
  ✅ /progress    已同步
  ✅ /diagnose    已同步

状态: ✅ 所有命令已正确同步
```

---

### 🎯 5. 技能模块诊断

检查 Skill 加载状态：

```bash
# 列出所有技能目录
ls -d ~/.claude/plugins/oh-my-claude/skills/*/ 2>/dev/null

# 检查技能 SKILL.md 是否存在
for d in ~/.claude/plugins/oh-my-claude/skills/*/; do
  ls "$d/SKILL.md" 2>/dev/null && echo "ok:$(basename $d)" || echo "missing:$(basename $d)"
done 2>/dev/null
```

**诊断结果示例：**

```text
🎯 技能模块
────────────────────────────────────────────────────────────────
✅ yishan/            愚公移山循环技能
✅ bilingual/         中英双语支持
✅ progress/          进度面板技能
✅ git-master/        Git 操作技能
✅ playwright/        浏览器自动化
✅ agent-handoff/     Agent 交接
✅ context/           上下文管理
✅ error-friendly/    友好错误显示
✅ preferences/       用户偏好
✅ workflow/          工作流模板
...

状态: 14/14 技能正常
```

---

### 🔌 6. MCP 服务器诊断

检查 MCP 配置状态：

```bash
# 检查 MCP 配置文件
cat ~/.claude/.mcp.json 2>/dev/null | head -20
```

**诊断结果示例：**

```text
🔌 MCP 服务器
────────────────────────────────────────────────────────────────
配置文件: ✅ ~/.claude/.mcp.json 存在

已配置的 MCP:
  ✅ context7         官方文档查询
  ✅ grep-app         GitHub 代码搜索
  ⚠️ deepwiki         未配置（可选）
  ⚠️ open-websearch   未配置（可选）

状态: 2/4 MCP 已配置
提示: 运行 npx claude-pangu install --mcp 安装全部 MCP
```

---

### 🔄 7. 更新状态诊断

检查是否有可用更新：

```bash
# 获取当前版本
cat ~/.claude/plugins/oh-my-claude/package.json 2>/dev/null | grep '"version"'

# 检查 npm 最新版本（如果有网络）
npm view claude-pangu version 2>/dev/null || echo "无法检查远程版本"
```

**诊断结果示例：**

```text
🔄 更新状态
────────────────────────────────────────────────────────────────
当前版本:   v2.1.3
最新版本:   v2.1.4 (有更新可用)

更新命令:   npx claude-pangu@latest update
或:         /update-omc
```

---

## 诊断报告汇总

### 全部健康

```text
╔══════════════════════════════════════════════════════════════╗
║          🎉 oh-my-claude 诊断完成 - 一切正常                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📊 诊断汇总                                                 ║
║  ────────────────────────────────────────────────────────    ║
║  📦 核心组件     ✅ 全部正常                                  ║
║  🎭 Agent        ✅ 20/20 可用                                ║
║  🪝 Hook         ✅ 45/45 正常                                ║
║  📋 命令同步     ✅ 73/73 已同步                              ║
║  🎯 技能模块     ✅ 14/14 正常                                ║
║  🔌 MCP 服务器   ✅ 4/4 已配置                                ║
║  🔄 版本         ✅ 已是最新                                  ║
║                                                              ║
║  🚀 系统运行正常，可以开始工作！                              ║
║                                                              ║
║  快速开始:                                                   ║
║    /do [任务描述]  - 万能入口                                 ║
║    /help           - 查看命令帮助                             ║
║    /tutorial       - 交互式教程                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### 发现问题

```text
╔══════════════════════════════════════════════════════════════╗
║          ⚠️ oh-my-claude 诊断完成 - 发现 3 个问题             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📊 诊断汇总                                                 ║
║  ────────────────────────────────────────────────────────    ║
║  📦 核心组件     ✅ 全部正常                                  ║
║  🎭 Agent        ✅ 20/20 可用                                ║
║  🪝 Hook         ⚠️ 43/45 正常 (2 个权限问题)                 ║
║  📋 命令同步     ❌ 68/73 已同步 (缺少 5 个)                  ║
║  🎯 技能模块     ✅ 14/14 正常                                ║
║  🔌 MCP 服务器   ⚠️ 2/4 已配置                                ║
║  🔄 版本         ⚠️ 有新版本 v2.1.4                           ║
║                                                              ║
║  ══════════════════════════════════════════════════════════  ║
║                                                              ║
║  🔧 问题详情与修复建议                                        ║
║  ────────────────────────────────────────────────────────    ║
║                                                              ║
║  问题 1: Hook 权限不足                                        ║
║  ────────                                                    ║
║  受影响: directory-readme-injector.sh, atlas.sh              ║
║  修复:                                                       ║
║    chmod +x ~/.claude/plugins/oh-my-claude/hooks/*.sh        ║
║                                                              ║
║  问题 2: 命令未同步                                           ║
║  ────────                                                    ║
║  缺少: workflow.md, preferences.md, diagnose.md 等           ║
║  修复:                                                       ║
║    npx claude-pangu@latest install                           ║
║                                                              ║
║  问题 3: 版本过旧                                             ║
║  ────────                                                    ║
║  当前: v2.1.3 → 最新: v2.1.4                                 ║
║  更新:                                                       ║
║    npx claude-pangu@latest update                            ║
║                                                              ║
║  ══════════════════════════════════════════════════════════  ║
║                                                              ║
║  💡 一键修复全部问题:                                         ║
║     npx claude-pangu@latest install --force                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 参数选项

### `/diagnose` (无参数)

完整诊断，输出详细报告。

### `/diagnose --quick` 或 `/diagnose -q`

快速诊断，仅检查核心组件：

```text
🏥 快速诊断
───────────────────────────────────────
📦 核心组件  ✅    🎭 Agent  ✅
🪝 Hook     ⚠️     📋 命令   ✅
───────────────────────────────────────
状态: 1 个问题 | 详情: /diagnose
```

### `/diagnose --fix`

自动修复检测到的问题：

```text
🔧 正在修复检测到的问题...

[1/3] 修复 Hook 权限...
      chmod +x ~/.claude/plugins/oh-my-claude/hooks/*.sh
      ✅ 已修复

[2/3] 同步命令文件...
      复制 5 个缺失的命令
      ✅ 已同步

[3/3] 更新插件...
      npx claude-pangu@latest update
      ⏭️ 跳过 (需要手动执行)

🎉 修复完成！请重启 Claude Code。
```

### `/diagnose --json`

输出 JSON 格式的诊断结果（供脚本使用）：

```json
{
  "status": "warning",
  "version": "2.1.3",
  "latestVersion": "2.1.4",
  "components": {
    "core": { "status": "ok", "details": {} },
    "agents": { "status": "ok", "available": 20, "total": 20 },
    "hooks": { "status": "warning", "available": 43, "total": 45, "issues": ["permission"] },
    "commands": { "status": "error", "synced": 68, "total": 73 },
    "skills": { "status": "ok", "available": 14, "total": 14 },
    "mcp": { "status": "warning", "configured": 2, "total": 4 }
  },
  "issues": [
    { "type": "hook_permission", "affected": ["directory-readme-injector.sh"] },
    { "type": "command_missing", "affected": ["workflow.md", "preferences.md"] },
    { "type": "update_available", "current": "2.1.3", "latest": "2.1.4" }
  ],
  "fixes": [
    "chmod +x ~/.claude/plugins/oh-my-claude/hooks/*.sh",
    "npx claude-pangu@latest install",
    "npx claude-pangu@latest update"
  ]
}
```

---

## 使用场景

1. **安装后确认** - 安装完成后运行 `/diagnose` 确保一切正常
2. **功能异常时** - 某个命令或 Agent 不工作时诊断问题
3. **定期检查** - 定期运行确保插件健康
4. **更新前后** - 更新前后对比诊断结果

---

## 别名

- `/diagnose` - 主命令
- `/诊断` - 中文别名
- `/health-check` - 健康检查
- `/doctor` - 医生（扁鹊风格）
