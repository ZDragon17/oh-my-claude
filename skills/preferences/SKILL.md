---
name: preferences
description: |
  用户偏好学习技能 - 学习用户使用习惯，提供个性化体验。
  支持偏好设置、使用统计、智能推荐。
---

# 用户偏好学习系统

学习用户的使用习惯，提供更个性化的 oh-my-claude 体验。

## 触发条件

1. 用户输入 `/preferences` 命令
2. 用户输入 `/pref`、`/偏好`、`/设置`、`/config`
3. 系统需要做个性化决策时

## 核心功能

### 1. 偏好设置管理

#### 可配置项

```json
{
  "basic": {
    "language": "auto",        // zh, en, auto
    "verbosity": "normal",     // minimal, normal, detailed
    "theme": "default",        // default, minimal, colorful
    "timezone": "auto"         // IANA timezone
  },
  "agent": {
    "default_agent": "yishan",
    "agent_order": "auto",     // auto = 按使用频率
    "parallel_agents": 3
  },
  "execution": {
    "auto_confirm": false,
    "auto_commit": false,
    "test_first": true,
    "lint_on_save": true
  },
  "notification": {
    "level": "important",      // all, important, none
    "sound": false,
    "desktop": true
  },
  "code_style": {
    "indent_style": "auto",    // spaces, tabs, auto
    "indent_size": "auto",     // 2, 4, auto
    "quote_style": "auto",     // single, double, auto
    "semicolons": "auto"       // always, never, auto
  }
}
```

### 2. 使用习惯学习

系统自动收集以下信息：

#### Agent 使用统计

```json
{
  "agent_usage": {
    "yishan": { "count": 42, "success_rate": 0.95 },
    "bianque": { "count": 23, "success_rate": 0.91 },
    "wukong": { "count": 18, "success_rate": 0.88 }
  }
}
```

#### 任务类型分布

```json
{
  "task_types": {
    "bugfix": 0.35,
    "feature": 0.30,
    "review": 0.15,
    "refactor": 0.10,
    "docs": 0.10
  }
}
```

#### 代码风格检测

```json
{
  "detected_style": {
    "indent": 2,
    "quotes": "single",
    "semicolons": false,
    "line_length": 100
  }
}
```

#### 活跃时段

```json
{
  "active_hours": {
    "morning": 0.35,   // 9-12
    "afternoon": 0.45, // 14-18
    "evening": 0.20    // 19-22
  }
}
```

### 3. 智能推荐

基于学习数据提供推荐：

#### Agent 推荐顺序

当用户输入 `/do [任务]` 时，如果无法确定最佳 Agent，按以下顺序推荐：

1. **历史成功率高**的 Agent
2. **使用频率高**的 Agent
3. **任务类型匹配**的 Agent

#### 工作流推荐

```
检测到你正在做 Bug 修复任务。
基于你的历史使用模式，推荐工作流：
  /workflow run bugfix [描述]

此工作流包含: 诊断 → 修复 → 测试
符合你 80% 的 Bug 修复流程。
```

### 4. 偏好应用

#### 在 /do 中应用

```python
def select_agent(task, preferences):
    # 1. 尝试关键词匹配
    agent = keyword_match(task)
    if agent:
        return agent
    
    # 2. 根据学习数据推荐
    if preferences.agent_order == "auto":
        return get_most_used_agent(preferences.learned.agent_usage)
    
    # 3. 使用默认 Agent
    return preferences.default_agent
```

#### 在输出中应用

```python
def format_output(content, preferences):
    if preferences.verbosity == "minimal":
        return content.summary
    elif preferences.verbosity == "detailed":
        return content.full + content.explanation
    else:
        return content.standard
```

## 数据存储

### 文件位置

```
~/.oh-my-claude/
├── preferences.json          # 用户显式设置
├── learned-preferences.json  # 学习到的偏好
└── usage-stats.json          # 使用统计数据
```

### 数据格式

```json
{
  "version": "1.0",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-23T15:45:00Z",
  "preferences": { ... },
  "learned": { ... },
  "stats": { ... }
}
```

## 隐私保护

### 数据仅存本地

- 所有偏好数据仅存储在用户本地
- 不会上传到任何服务器
- 用户可随时清除

### 可控的学习范围

- 只学习使用模式，不学习代码内容
- 用户可禁用特定学习项
- 支持完全重置

## 响应格式

### 显示偏好

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ 用户偏好设置                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 基础设置                                                 │
│  ──────────────────────────────────────────────────────     │
│  language      : zh                                         │
│  verbosity     : normal                                     │
│  ...                                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 设置成功

```
✅ 偏好已更新

  language: auto → zh

💡 此设置会在下次会话中生效。
```

### 学习报告

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 学习到的偏好                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Agent 使用频率                                           │
│  1. 愚公    ████████████████████ 42 次                      │
│  2. 扁鹊    ███████████░░░░░░░░░ 23 次                      │
│  ...                                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 与其他功能集成

### 与 /do 集成

偏好影响 Agent 选择和输出格式。

### 与 /workflow 集成

偏好影响工作流执行策略和并行度。

### 与 /progress 集成

偏好影响进度面板的显示风格。

### 与 Hook 集成

偏好影响 Hook 的执行和通知行为。
