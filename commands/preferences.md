---
name: preferences
description: 用户偏好设置命令 - 个性化配置、使用模式学习、偏好导入导出
aliases:
  - /偏好
  - /prefs
  - /settings
allowed-tools:
  - Read
  - Write
  - Bash
model: haiku
---

<command-name>/preferences</command-name>

# 用户偏好设置 (User Preferences)

**个性化你的 oh-my-claude 体验。**

---

## 核心理念

oh-my-claude 会学习你的使用习惯，提供更个性化的体验：

- 🎯 **智能推荐** - 根据使用频率调整 Agent 推荐顺序
- 🎨 **风格适配** - 记住你偏好的沟通风格和输出详细度
- 🌐 **语言偏好** - 自动匹配你习惯的语言
- ⚡ **效率优化** - 基于历史数据优化执行策略

---

## 使用方式

```
/preferences [子命令] [参数]
```

### 子命令列表

| 子命令 | 功能 | 示例 |
|--------|------|------|
| `show` | 显示当前偏好设置 | `/preferences show` |
| `set <key> <value>` | 设置偏好项 | `/preferences set language zh` |
| `reset` | 重置为默认设置 | `/preferences reset` |
| `export` | 导出配置 | `/preferences export` |
| `import` | 导入配置 | `/preferences import config.json` |
| `learn` | 查看学习到的偏好 | `/preferences learn` |

---

## 偏好设置项

### 1. 基础设置

| 设置项 | 默认值 | 可选值 | 说明 |
|--------|--------|--------|------|
| `language` | `auto` | `zh`, `en`, `auto` | 界面语言 |
| `verbosity` | `normal` | `minimal`, `normal`, `detailed` | 输出详细度 |
| `theme` | `default` | `default`, `minimal`, `colorful` | 界面风格 |
| `timezone` | `auto` | IANA 时区 | 时间显示 |

### 2. Agent 偏好

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `default_agent` | `yishan` | 默认 Agent（当 /do 无法判断时） |
| `agent_order` | `auto` | Agent 推荐顺序（auto=按使用频率） |
| `parallel_agents` | `3` | 最大并行 Agent 数 |

### 3. 执行偏好

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `auto_confirm` | `false` | 危险操作是否自动确认 |
| `auto_commit` | `false` | 是否自动 git commit |
| `test_first` | `true` | 修改代码前是否先运行测试 |
| `lint_on_save` | `true` | 保存时是否自动 lint |

### 4. 通知偏好

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `notifications` | `important` | 通知级别：`all`, `important`, `none` |
| `sound` | `false` | 任务完成是否播放提示音 |
| `desktop_notify` | `true` | 是否发送桌面通知 |

### 5. 代码风格

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `indent_style` | `auto` | 缩进风格：`spaces`, `tabs`, `auto` |
| `indent_size` | `auto` | 缩进大小：`2`, `4`, `auto` |
| `quote_style` | `auto` | 引号风格：`single`, `double`, `auto` |
| `semicolons` | `auto` | 是否使用分号：`always`, `never`, `auto` |

---

## 显示偏好设置

### `/preferences show` 或 `/preferences`

显示当前所有偏好设置：

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ oh-my-claude 用户偏好设置                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 基础设置                                                 │
│  ──────────────────────────────────────────────────────     │
│  language      : zh (中文)                                  │
│  verbosity     : normal (标准详细度)                         │
│  theme         : default                                    │
│  timezone      : Asia/Shanghai                              │
│                                                             │
│  🎭 Agent 偏好                                               │
│  ──────────────────────────────────────────────────────     │
│  default_agent : yishan (愚公)                              │
│  agent_order   : auto (按使用频率)                           │
│  parallel_agents: 3                                         │
│                                                             │
│  ⚡ 执行偏好                                                 │
│  ──────────────────────────────────────────────────────     │
│  auto_confirm  : false (危险操作需确认)                      │
│  auto_commit   : false (需手动提交)                          │
│  test_first    : true (修改前运行测试)                       │
│  lint_on_save  : true (保存时检查)                           │
│                                                             │
│  🔔 通知偏好                                                 │
│  ──────────────────────────────────────────────────────     │
│  notifications : important (仅重要通知)                      │
│  sound         : false (静音)                                │
│  desktop_notify: true (桌面通知开启)                         │
│                                                             │
│  💻 代码风格                                                 │
│  ──────────────────────────────────────────────────────     │
│  indent_style  : auto (跟随项目)                             │
│  indent_size   : auto (跟随项目)                             │
│  quote_style   : auto (跟随项目)                             │
│                                                             │
│  💡 使用 /preferences set <key> <value> 修改设置             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 设置偏好

### `/preferences set <key> <value>`

```bash
# 设置语言为中文
/preferences set language zh

# 设置输出为简洁模式
/preferences set verbosity minimal

# 设置默认 Agent 为诸葛
/preferences set default_agent zhuge

# 关闭桌面通知
/preferences set desktop_notify false

# 设置最大并行 Agent 数
/preferences set parallel_agents 5
```

设置成功后显示：

```
✅ 偏好已更新

  language: auto → zh

💡 此设置会在下次会话中生效。
```

---

## 学习到的偏好

### `/preferences learn`

显示系统从你的使用中学习到的偏好：

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 学习到的偏好                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Agent 使用频率 (最近 30 天)                              │
│  ──────────────────────────────────────────────────────     │
│  1. 🏔️ 愚公    ████████████████████ 42 次                   │
│  2. 🩺 扁鹊    ███████████░░░░░░░░░ 23 次                   │
│  3. 🔍 悟空    ████████░░░░░░░░░░░░ 18 次                   │
│  4. 🪞 魏征    ██████░░░░░░░░░░░░░░ 12 次                   │
│  5. 🔧 鲁班    █████░░░░░░░░░░░░░░░ 10 次                   │
│                                                             │
│  ⏰ 活跃时段                                                 │
│  ──────────────────────────────────────────────────────     │
│  上午 (9-12)   ████████████░░░░░░░░ 35%                     │
│  下午 (14-18)  ████████████████░░░░ 45%                     │
│  晚上 (19-22)  ████████░░░░░░░░░░░░ 20%                     │
│                                                             │
│  🎯 常见任务类型                                             │
│  ──────────────────────────────────────────────────────     │
│  • Bug 修复     35%                                          │
│  • 功能实现     30%                                          │
│  • 代码审查     15%                                          │
│  • 重构优化     10%                                          │
│  • 文档撰写     10%                                          │
│                                                             │
│  💡 发现的模式                                               │
│  ──────────────────────────────────────────────────────     │
│  • 你倾向于使用中文命令                                       │
│  • Bug 修复后经常进行代码审查                                 │
│  • 大任务偏好使用 /workflow feature                          │
│  • 代码风格：2 空格缩进、单引号                               │
│                                                             │
│  💡 基于学习，系统已自动优化：                                │
│  • Agent 推荐顺序已按使用频率调整                             │
│  • /do 会优先考虑 Bug 修复场景                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 导出和导入

### 导出配置

```bash
/preferences export
```

输出：

```json
{
  "version": "1.0",
  "preferences": {
    "language": "zh",
    "verbosity": "normal",
    "theme": "default",
    "default_agent": "yishan",
    "parallel_agents": 3,
    "auto_confirm": false,
    "notifications": "important"
  },
  "learned": {
    "top_agents": ["yishan", "bianque", "wukong"],
    "code_style": {
      "indent": 2,
      "quotes": "single"
    }
  }
}
```

### 导入配置

```bash
/preferences import my-config.json
```

或直接粘贴配置：

```bash
/preferences import {"language": "zh", "verbosity": "minimal"}
```

---

## 重置偏好

### 全部重置

```bash
/preferences reset
```

确认后重置所有设置为默认值。

### 部分重置

```bash
/preferences reset agent      # 仅重置 Agent 相关设置
/preferences reset code       # 仅重置代码风格设置
/preferences reset learned    # 清除学习数据
```

---

## 配置文件位置

偏好相关文件存储在 `~/.oh-my-claude/` 目录：

```
~/.oh-my-claude/
├── preferences.json          # 用户显式设置的偏好
├── learned-preferences.json  # 系统学习到的偏好模式
└── usage-stats.json          # 使用统计数据（Agent 调用次数等）
```

> **注意**：所有数据仅存储在本地，不会上传到任何服务器。

---

## 别名

- `/preferences` - 主命令
- `/pref` - 简写
- `/偏好` - 中文别名
- `/设置` - 中文别名
- `/config` - 配置别名

---

## 与其他功能集成

### 与 /do 集成

偏好设置影响 `/do` 的 Agent 选择逻辑。

### 与 /workflow 集成

偏好设置影响工作流执行策略。

### 与 /progress 集成

偏好设置影响进度面板的显示风格。

---

> 💡 **提示**：首次使用时，建议保持默认设置。系统会自动学习你的偏好。
