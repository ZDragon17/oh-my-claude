---
name: share
description: |
  团队协作命令 - 分享配置、Agent 定义和代码片段。
  别名：/孔融 (孔融让梨，乐于分享)
aliases:
  - /孔融
  - /让梨
  - /分享
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
model: haiku
---

<command-name>/share</command-name>

# 团队协作命令

分享 oh-my-claude 配置、Agent 定义和代码片段给团队成员。

## 使用方法

```bash
/share config                    # 导出项目配置
/share agent <name>              # 分享 Agent 定义
/share snippet <name>            # 分享代码片段
/share all                       # 导出所有配置
/share import <path>             # 导入分享的配置
```

## 参数说明

用户输入: `$ARGUMENTS`

## 导出格式

### 配置导出 (`/share config`)

```
📤 导出项目配置
═══════════════════════════════════════════════════════════════════

导出内容:
   ✅ .oh-my-claude/config.json
   ✅ .oh-my-claude/rules/ (2 个规则)
   ✅ .oh-my-claude/agents/ (1 个 Agent)

📁 导出文件: oh-my-claude-config.zip
📊 大小: 4.2 KB

═══════════════════════════════════════════════════════════════════

💡 分享方式:
   1. 直接发送 zip 文件
   2. 复制到团队仓库的 .oh-my-claude/ 目录
   3. 运行 /share import <path> 导入
```

### Agent 分享 (`/share agent`)

```
📤 分享 Agent: 项目专家
═══════════════════════════════════════════════════════════════════

📝 Agent 信息:
   名称: project-expert
   描述: React TypeScript 项目专家
   文件: .oh-my-claude/agents/project-expert.md

📋 内容预览:
   ```markdown
   # React TypeScript 项目专家

   你是一个精通 React + TypeScript 的项目专家...
   ```

═══════════════════════════════════════════════════════════════════

📤 导出选项:
   [1] 复制到剪贴板
   [2] 导出为文件
   [3] 生成分享链接 (需要 Gist)

选择: _
```

### 完整导出 (`/share all`)

```
📤 导出完整配置
═══════════════════════════════════════════════════════════════════

导出清单:

📁 配置文件:
   ✅ config.json
   ✅ project-profile.md

📜 规则文件:
   ✅ rules/coding-style.md
   ✅ rules/architecture.md

🤖 Agent 定义:
   ✅ agents/project-expert.md

📝 代码片段:
   ✅ snippets/ (12 个片段)

═══════════════════════════════════════════════════════════════════

📁 导出文件: oh-my-claude-full-export.zip
📊 总大小: 28.5 KB

💡 团队成员使用 /share import 导入
```

## 导入流程

```
📥 导入配置
═══════════════════════════════════════════════════════════════════

检测到导入包: oh-my-claude-config.zip

📋 包含内容:
   • config.json
   • rules/coding-style.md
   • rules/architecture.md
   • agents/project-expert.md

⚠️ 冲突检测:
   • rules/coding-style.md 已存在

选择处理方式:
   [1] 覆盖现有文件
   [2] 跳过冲突文件
   [3] 合并 (保留两者)
   [4] 取消导入

选择: _
```

## 分享最佳实践

1. **项目配置** - 团队统一的编码规范和工具配置
2. **自定义 Agent** - 针对项目定制的专家 Agent
3. **代码片段** - 团队积累的高质量代码模板
4. **规则文件** - 项目特定的代码审查规则

## 响应要求

1. **清晰列表** - 显示导出内容清单
2. **冲突处理** - 导入时检测并处理冲突
3. **版本兼容** - 检查配置版本兼容性
4. **安全提示** - 提醒不要分享敏感信息
