# 贡献指南 | Contributing Guide

[English](#english) | [中文](#中文)

---

## 中文

感谢你对 oh-my-claude 的关注！我们欢迎任何形式的贡献。

### 🎯 如何贡献

#### 报告 Bug

1. 在 [Issues](https://github.com/ZDragon17/oh-my-claude/issues) 页面搜索是否已有类似问题
2. 如果没有，创建新 Issue，使用 Bug 报告模板
3. 提供详细的复现步骤和环境信息

#### 提出新功能

1. 在 Issues 页面创建 Feature Request
2. 描述功能的使用场景和预期效果
3. 如果可能，提供设计思路或参考

#### 提交代码

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交变更：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Type 类型：**

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 其他杂项 |

**示例：**

```bash
feat(agent): add new agent for code review
fix(hook): fix todo-enforcer not detecting pending tasks
docs: update README with new examples
```

### 📂 项目结构

```
oh-my-claude/
├── lib/             # TypeScript 源码（核心逻辑）
├── scripts/         # CLI 和工具脚本（TypeScript）
├── dist/            # TypeScript 编译输出（npm 入口）
├── agents/          # Agent 定义文件
├── commands/        # 斜杠命令定义
├── hooks/           # Hook 脚本
├── skills/          # 技能定义
└── .claude-plugin/  # 插件配置
```

### 🛠️ 开发流程

本项目使用 **TypeScript** 开发，npm 包入口是 `dist/scripts/cli.js`。

**开发前准备：**

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 或使用监听模式（开发时推荐）
npm run build:watch
```

**重要说明：**

- **源码位置**：`lib/*.ts` 和 `scripts/*.ts`
- **编译输出**：`dist/lib/*.js` 和 `dist/scripts/*.js`
- **npm 入口**：`dist/scripts/cli.js`（由 `package.json` 的 `bin` 字段指定）

**修改代码后：**

1. 运行 `npm run build` 重新编译
2. 运行 `npm run type-check` 检查类型
3. 运行 `npm run lint` 检查代码风格
4. 运行 `npm test` 运行测试

### 🎭 添加新 Agent

1. 在 `agents/` 目录创建 `<agent-name>.md`
2. 使用 YAML front matter 定义元数据
3. 编写 Agent 的角色描述和工作指南
4. 如需要，在 `commands/` 添加对应的斜杠命令
5. 更新 README 中的 Agent 列表

**Agent 模板：**

```markdown
---
name: agent-name
description: |
  Agent 描述...
allowed-tools:
  - Read
  - Write
  - Edit
model: sonnet
---

# Agent 名称

## 核心精神
[引用或格言]

## 职责范围
[Agent 的专长领域]

## 工作流程
[执行步骤]

## 核心原则
[行为准则]
```

### 🔧 添加新 Hook

1. 在 `hooks/` 目录创建脚本文件
2. 在 `hooks/hooks.json` 中注册 Hook
3. Hook 应该从 stdin 读取 JSON 输入
4. 通过 stdout 输出 JSON 响应

**支持的 Hook 事件：**

| 事件 | 触发时机 |
|------|----------|
| `UserPromptSubmit` | 用户提交提示时 |
| `Stop` | Agent 准备停止时 |

### 🌐 国际化

- 保持中英双语支持
- 新功能的文档需要同时提供中英文
- 在 `skills/bilingual/SKILL.md` 中更新命令映射

### ✅ 代码审查清单

- [ ] 代码符合项目风格
- [ ] 有适当的文档说明
- [ ] 提供中英双语支持（如适用）
- [ ] 测试过功能正常工作
- [ ] 更新了相关文档

---

## English

Thank you for your interest in oh-my-claude! We welcome contributions of all kinds.

### 🎯 How to Contribute

#### Reporting Bugs

1. Search existing [Issues](https://github.com/ZDragon17/oh-my-claude/issues) first
2. If not found, create a new Issue using the Bug Report template
3. Provide detailed reproduction steps and environment info

#### Suggesting Features

1. Create a Feature Request in Issues
2. Describe the use case and expected behavior
3. Provide design ideas or references if possible

#### Submitting Code

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create a Pull Request

### 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Code style (no functional change) |
| `refactor` | Refactoring |
| `test` | Testing |
| `chore` | Miscellaneous |

### 🛠️ Development Workflow

This project uses **TypeScript**. The npm package entry point is `dist/scripts/cli.js`.

**Setup:**

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Or use watch mode (recommended for development)
npm run build:watch
```

**Important Notes:**

- **Source code**: `lib/*.ts` and `scripts/*.ts`
- **Compiled output**: `dist/lib/*.js` and `dist/scripts/*.js`
- **npm entry**: `dist/scripts/cli.js` (specified in `package.json` `bin` field)

**After making changes:**

1. Run `npm run build` to recompile
2. Run `npm run type-check` for type checking
3. Run `npm run lint` for code style
4. Run `npm test` to run tests

### 🎭 Adding a New Agent

1. Create `<agent-name>.md` in `agents/` directory
2. Define metadata using YAML front matter
3. Write role description and work guidelines
4. Add corresponding slash command in `commands/` if needed
5. Update the Agent list in README

### 🌐 Internationalization

- Maintain bilingual (Chinese/English) support
- New feature docs should include both languages
- Update command mappings in `skills/bilingual/SKILL.md`

### ✅ Code Review Checklist

- [ ] Code follows project style
- [ ] Proper documentation included
- [ ] Bilingual support provided (if applicable)
- [ ] Functionality tested
- [ ] Related docs updated
