---
name: ide
description: |
  IDE 深度集成技能 - 为主流 IDE 提供集成配置。
  支持 VSCode、JetBrains、Vim/Neovim。
experimental: true
---

# IDE 深度集成技能 (IDE Integration)

为主流 IDE 提供 oh-my-claude 的深度集成。

## 支持的 IDE

| IDE | 状态 | 功能 |
|-----|------|------|
| 💙 VSCode | ✅ 支持 | 侧边栏、快捷键、内联建议 |
| 🔶 JetBrains | ✅ 支持 | 工具窗口、意图动作 |
| 💚 Vim/Neovim | ✅ 支持 | 快捷键、命令模式 |

---

## VSCode 集成

### 安装

1. 安装 VSCode 扩展（即将发布）
2. 或手动配置 `.vscode/oh-my-claude.json`

### 功能

#### 侧边栏 Agent 面板

```text
┌─────────────────────────┐
│ 🔮 OH MY CLAUDE         │
├─────────────────────────┤
│ 📊 状态: 🟢 活跃        │
│ 📋 TODO: 3/8 完成       │
├─────────────────────────┤
│ 🔍 悟空 - 空闲          │
│ 🔧 鲁班 - 工作中 45%    │
│ 🩺 扁鹊 - 空闲          │
│ 📜 诸葛 - 空闲          │
├─────────────────────────┤
│ [运行命令] [查看进度]   │
└─────────────────────────┘
```

#### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+A` | 显示 Agent 面板 |
| `Ctrl+Shift+C` | 运行命令 |
| `Ctrl+Shift+P` | 显示进度 |

#### 代码内联建议

```typescript
// 选中代码后右键菜单
// → Oh My Claude
//   → 让扁鹊调试这段代码
//   → 让老子简化这段代码
//   → 让魏征审查这段代码
```

### 配置文件

`.vscode/oh-my-claude.json`:

```json
{
  "enabled": true,
  "showSidebar": true,
  "keybindings": {
    "showAgents": "ctrl+shift+a",
    "runCommand": "ctrl+shift+c"
  },
  "inlineActions": true
}
```

---

## JetBrains 集成

### 支持的 IDE

- IntelliJ IDEA
- WebStorm
- PyCharm
- GoLand
- 其他 JetBrains IDE

### 功能

#### 工具窗口

```text
┌─────────────────────────────────────┐
│ OMC Agents          [─] [□] [×]    │
├─────────────────────────────────────┤
│                                     │
│  🔍 悟空    [探索]                  │
│  🔧 鲁班    [实现]                  │
│  🩺 扁鹊    [调试]                  │
│  📜 诸葛    [设计]                  │
│                                     │
├─────────────────────────────────────┤
│  当前任务: 实现登录功能             │
│  进度: ████████░░ 80%              │
└─────────────────────────────────────┘
```

#### 意图动作 (Alt+Enter)

在代码中按 `Alt+Enter`:

```text
💡 可用动作:
   • Ask Agent about this code
   • Debug with 扁鹊
   • Refactor with 老子
   • Review with 魏征
```

### 配置文件

`.idea/oh-my-claude.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="OhMyClaudeSettings">
    <option name="enabled" value="true" />
    <option name="showToolWindow" value="true" />
    <option name="enableIntentions" value="true" />
  </component>
</project>
```

---

## Vim/Neovim 集成

### 安装

#### Vim

```vim
" 在 .vimrc 中添加
Plug 'zdragon17/oh-my-claude.vim'
```

#### Neovim (Lua)

```lua
-- 在 init.lua 中添加
use 'zdragon17/oh-my-claude.nvim'
```

### 功能

#### 快捷键映射

| 快捷键 | 命令 | 功能 |
|--------|------|------|
| `<leader>oa` | `:OMCAgents` | 显示 Agent 列表 |
| `<leader>oc` | `:OMCCommand` | 运行命令 |
| `<leader>op` | `:OMCProgress` | 显示进度 |
| `<leader>od` | `:OMCDebug` | 调试当前文件 |
| `<leader>oe` | `:OMCExplore` | 探索代码库 |

#### 命令模式

```vim
:OMCAgents          " 列出可用 Agent
:OMCCommand /wukong 探索登录模块
:OMCProgress        " 显示任务进度
:OMCDebug           " 调试当前文件
```

#### 浮动窗口 (Neovim)

```text
┌─────────────────────────────┐
│ 🔮 Oh My Claude             │
├─────────────────────────────┤
│ 🔍 悟空  🔧 鲁班  🩺 扁鹊   │
│ 📜 诸葛  🧹 老子  🛡️ 墨子   │
├─────────────────────────────┤
│ > 输入命令...               │
└─────────────────────────────┘
```

### 配置文件

`.vim/oh-my-claude.vim`:

```vim
" Oh My Claude 配置
let g:omc_enabled = 1
let g:omc_show_statusline = 1
let g:omc_float_window = 1

" 自定义快捷键
let g:omc_leader = '<leader>o'
```

---

## 通用配置

### 项目级配置

`.oh-my-claude/ide.json`:

```json
{
  "ide": {
    "autoDetect": true,
    "preferred": "vscode",
    "features": {
      "sidebar": true,
      "inlineActions": true,
      "statusBar": true,
      "notifications": true
    }
  }
}
```

### 全局配置

`~/.oh-my-claude/ide.json`:

```json
{
  "defaultIDE": "vscode",
  "syncSettings": true,
  "theme": "auto"
}
```

---

## 开发中功能

🚧 **即将推出**：

1. VSCode 扩展市场发布
2. JetBrains 插件市场发布
3. Neovim 原生 Lua 插件
4. Emacs 集成

---

## 最佳实践

1. **配置同步** - 将 IDE 配置加入版本控制
2. **快捷键** - 根据习惯自定义快捷键
3. **侧边栏** - 开发时保持 Agent 面板可见
4. **内联动作** - 善用右键菜单快速调用
