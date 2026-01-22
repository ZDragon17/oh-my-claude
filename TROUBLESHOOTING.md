# 故障排查指南

本文档帮助您解决 oh-my-claude 插件的常见问题。

## 目录

- [安装问题](#安装问题)
- [运行时问题](#运行时问题)
- [命令/技能问题](#命令技能问题)
- [权限问题](#权限问题)
- [获取帮助](#获取帮助)

---

## 安装问题

### 1. "未检测到 Claude Code CLI"

**症状**：安装时提示 `未检测到 Claude Code CLI`

**原因**：系统中未安装 Claude Code 或未正确配置 PATH

**解决方案**：
```bash
# 检查 Claude Code 是否安装
claude --version

# 如果未安装，请先安装 Claude Code
# Claude Code 现已切换为原生安装器：
claude install
# 或访问: https://docs.anthropic.com/en/docs/claude-code/getting-started
```

### 2. npm 安装权限错误

**症状**：`EACCES: permission denied` 或类似错误

**解决方案**：

```bash
# 方案 1: 使用 npx (推荐)
npx oh-my-claude install

# 方案 2: 修复 npm 权限
# macOS/Linux:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 然后重新安装
npm install -g oh-my-claude
```

### 3. PowerShell 执行策略错误

**症状**：Windows 上运行脚本时提示 "无法加载文件...因为在此系统上禁止运行脚本"

**解决方案**：
```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. 插件注册失败

**症状**：文件已复制但 `claude plugins install` 失败

**解决方案**：
```bash
# 手动注册插件
claude plugins install ~/.claude/plugins/oh-my-claude

# Windows:
claude plugins install %USERPROFILE%\.claude\plugins\oh-my-claude

# 如果仍然失败，检查插件目录结构
ls ~/.claude/plugins/oh-my-claude
# 应该包含: agents/ commands/ hooks/ skills/ .claude-plugin/
```

---

## 运行时问题

### 1. 命令无响应

**症状**：输入 `/yishan` 等命令后没有反应

**可能原因**：
- 插件未正确注册
- 命令文件损坏

**解决方案**：
```bash
# 检查插件状态
claude plugins list

# 重新安装插件
oh-my-claude uninstall
oh-my-claude install
```

### 2. Agent 行为异常

**症状**：Agent 没有按预期工作

**解决方案**：
1. 确认使用了正确的命令格式
2. 检查是否有其他插件冲突
3. 尝试使用完整命令名而非别名

### 3. 中文显示乱码

**症状**：中文内容显示为乱码

**解决方案**：

```bash
# macOS/Linux: 确保终端使用 UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Windows PowerShell:
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

---

## 命令/技能问题

### 1. 找不到命令

**症状**：提示命令不存在

**可能原因**：
- 命令名拼写错误
- 对应的 .md 文件缺失

**解决方案**：
```bash
# 检查命令文件是否存在
ls ~/.claude/plugins/oh-my-claude/commands/

# 常用命令列表:
# /yishan (愚公移山模式)
# /zhuge (诸葛顾问)
# /baozheng (包青天代码审判)
# /sunzi (孙子兵法)
```

### 2. 技能加载失败

**症状**：技能无法正常工作

**解决方案**：
```bash
# 检查技能文件
ls ~/.claude/plugins/oh-my-claude/skills/

# 确认文件格式正确 (应为 .md 文件)
```

---

## 权限问题

### 1. 文件写入权限

**症状**：无法创建或修改文件

**解决方案**：
```bash
# 检查目录权限
ls -la ~/.claude/plugins/

# 修复权限 (macOS/Linux)
chmod -R 755 ~/.claude/plugins/oh-my-claude
```

### 2. Hook 脚本无法执行

**症状**：Hook 脚本不执行或报权限错误

**解决方案**：
```bash
# 设置可执行权限 (macOS/Linux)
chmod +x ~/.claude/plugins/oh-my-claude/hooks/*.sh

# Windows 上 Hook 脚本需要是 .bat 或 .ps1 格式
```

---

## 验证安装

运行以下命令验证安装是否正确：

```bash
# 1. 检查插件目录
ls ~/.claude/plugins/oh-my-claude

# 期望输出:
# agents/  commands/  hooks/  skills/  .claude-plugin/  README.md  LICENSE

# 2. 检查已注册插件
claude plugins list

# 3. 检查关键文件
cat ~/.claude/plugins/oh-my-claude/.claude-plugin/manifest.json
```

---

## 完全重装

如果以上方法都无效，尝试完全重装：

```bash
# 1. 完全卸载
oh-my-claude uninstall
rm -rf ~/.claude/plugins/oh-my-claude

# 2. 清除 npm 缓存
npm cache clean --force

# 3. 重新安装
npm install -g oh-my-claude
oh-my-claude install
```

---

## 获取帮助

如果问题仍未解决：

1. **搜索已知问题**：[GitHub Issues](https://github.com/ZDragon17/oh-my-claude/issues)

2. **提交新问题**：请包含以下信息：
   - 操作系统和版本
   - Node.js 版本 (`node --version`)
   - Claude Code 版本 (`claude --version`)
   - 完整的错误信息
   - 复现步骤

3. **社区讨论**：[GitHub Discussions](https://github.com/ZDragon17/oh-my-claude/discussions)

---

## 常见问题速查表

| 问题 | 快速解决方案 |
|------|-------------|
| 未检测到 Claude Code | 安装 Claude Code 并确保在 PATH 中 |
| npm 权限错误 | 使用 `npx` 或修复 npm 权限 |
| PowerShell 执行策略 | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| 命令无响应 | 重新安装: `oh-my-claude uninstall && oh-my-claude install` |
| 中文乱码 | 设置终端编码为 UTF-8 |
| Hook 不执行 | `chmod +x ~/.claude/plugins/oh-my-claude/hooks/*.sh` |
