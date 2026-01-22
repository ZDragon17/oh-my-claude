---
name: update-omc
description: oh-my-claude 更新命令 - 检查并更新到最新版本
aliases:
  - /upgrade-omc
  - /更新插件
  - /update-plugin
allowed-tools:
  - Bash
  - Read
model: haiku
---

<command-name>/update-omc</command-name>

# oh-my-claude 更新命令

检查并更新 oh-my-claude 插件到最新版本。

## 执行流程

### 步骤 1: 显示更新检查提示

```text
🔄 正在检查 oh-my-claude 更新...
```

### 步骤 2: 获取当前安装版本

执行以下检查获取当前版本（从 plugin.json 读取）：

```bash
cat ~/.claude/plugins/oh-my-claude/.claude-plugin/plugin.json 2>/dev/null | grep '"version"' | head -1 | sed 's/.*"version".*"\\([^"]*\\)".*/\\1/'
```

如果插件未安装，输出：

```text
❌ oh-my-claude 未安装

请先安装插件:
  npx claude-pangu install
```

### 步骤 3: 获取 NPM 最新版本

```bash
npm view claude-pangu version 2>/dev/null
```

### 步骤 4: 比较版本

根据版本比较结果决定下一步：

#### 已是最新版本

```text
╔══════════════════════════════════════════════════════════════╗
║            ✅ oh-my-claude 已是最新版本                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📦 当前版本: v{current_version}                             ║
║  🌐 NPM 最新: v{npm_version}                                 ║
║                                                              ║
║  无需更新，当前版本是最新的！                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

#### 有新版本可用

```text
╔══════════════════════════════════════════════════════════════╗
║            🆕 发现新版本                                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📦 当前版本: v{current_version}                             ║
║  🆕 最新版本: v{npm_version}                                 ║
║                                                              ║
║  正在更新...                                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

然后执行更新：

```bash
npx claude-pangu@latest update
```

### 步骤 5: 验证更新结果

更新完成后，验证新版本：

```bash
cat ~/.claude/plugins/oh-my-claude/.claude-plugin/plugin.json 2>/dev/null | grep '"version"' | head -1 | sed 's/.*"version".*"\\([^"]*\\)".*/\\1/'
```

### 步骤 6: 输出更新结果

#### 更新成功

```text
╔══════════════════════════════════════════════════════════════╗
║            🎉 oh-my-claude 更新成功！                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📦 旧版本: v{old_version}                                   ║
║  ✨ 新版本: v{new_version}                                   ║
║                                                              ║
║  ⚠️ 建议: 重启 Claude Code 以使更新完全生效                   ║
║                                                              ║
║  📋 查看更新内容:                                            ║
║  https://github.com/ZDragon17/oh-my-claude/releases          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

#### 更新失败

```text
╔══════════════════════════════════════════════════════════════╗
║            ❌ 更新失败                                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  更新过程中遇到错误。                                         ║
║                                                              ║
║  🔧 请尝试手动更新:                                          ║
║  ────────────────────────────────────────────────────────    ║
║                                                              ║
║  方式一: 使用 npx                                            ║
║  npx claude-pangu@latest install --force                     ║
║                                                              ║
║  方式二: 先卸载再安装                                        ║
║  npx claude-pangu uninstall                                  ║
║  npx claude-pangu@latest install                             ║
║                                                              ║
║  如果问题持续，请提交 Issue:                                  ║
║  https://github.com/ZDragon17/oh-my-claude/issues            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 强制更新模式

`/update-omc --force` 或 `/update-omc -f`

即使版本相同也强制重新安装：

```bash
npx claude-pangu@latest install --force
```

---

## 检查模式（不更新）

`/update-omc --check` 或 `/update-omc -c`

只检查是否有更新，不执行更新：

```text
📊 oh-my-claude 版本检查
═══════════════════════════════════════════════════

📦 当前版本: v2.0.22
🌐 最新版本: v2.0.25

🆕 有新版本可用！
   运行 /update-omc 进行更新
```

---

## 显示更新日志

`/update-omc --changelog`

显示最近的更新日志（从 GitHub 获取）：

```bash
curl -s https://raw.githubusercontent.com/ZDragon17/oh-my-claude/main/CHANGELOG.md | head -100
```

---

## 别名

- `/update-omc` - 主命令
- `/upgrade-omc` - 别名
- `/更新插件` - 中文别名
- `/update-plugin` - 英文别名

---

## 常见问题

### Q: 更新后需要重启吗？

A: 建议重启 Claude Code，以确保所有 hooks 和新功能完全生效。

### Q: 更新失败怎么办？

A: 尝试以下步骤：
1. 检查网络连接
2. 使用 `npx claude-pangu@latest install --force` 强制安装
3. 如果仍然失败，先卸载再重新安装

### Q: 如何回滚到旧版本？

A: 指定版本安装：
```bash
npx claude-pangu@2.0.20 install
```
