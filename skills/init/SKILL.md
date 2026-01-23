---
name: init
description: |
  项目模板初始化技能 - 为不同技术栈项目提供最佳实践配置。
  支持前端、后端、全栈多种项目模板。
---

# 项目模板初始化技能 (Project Template Init)

为不同类型的项目提供 oh-my-claude 的最佳实践配置。

## 核心理念

> 约定优于配置。
> 最佳实践开箱即用。

## 模板分类

### 前端模板

| 模板 | 框架 | 语言 | 特点 |
|------|------|------|------|
| react-typescript | React 18 | TypeScript | ⭐ 推荐，完整生态 |
| react-javascript | React 18 | JavaScript | 简单项目 |
| vue3-typescript | Vue 3 | TypeScript | Composition API |
| vue3-vite | Vue 3 + Vite | TypeScript | 快速开发 |
| nextjs | Next.js 14 | TypeScript | 全栈框架 |
| svelte | SvelteKit | TypeScript | 高性能 |

### 后端模板

| 模板 | 框架 | 语言 | 特点 |
|------|------|------|------|
| node-express | Express | TypeScript | 轻量灵活 |
| node-nestjs | NestJS | TypeScript | 企业级 |
| python-fastapi | FastAPI | Python | ⭐ 推荐，现代 API |
| python-django | Django | Python | 全功能 |
| golang-gin | Gin | Go | 高性能 |
| rust-axum | Axum | Rust | 安全高效 |
| java-spring | Spring Boot | Java | 企业级 |

### 全栈模板

| 模板 | 技术栈 | 特点 |
|------|--------|------|
| t3-stack | Next.js + tRPC + Prisma | 类型安全全栈 |
| mern | MongoDB + Express + React + Node | 经典组合 |
| lamp | Laravel + MySQL | PHP 全栈 |

## 生成的配置结构

```
.oh-my-claude/
├── config.json           # 项目配置
│   ├── projectType       # 项目类型
│   ├── preferences       # 工具偏好
│   ├── agentPreferences  # Agent 偏好
│   └── conventions       # 编码约定
│
├── agents/               # 项目专用 Agent
│   └── project-expert.md # 了解项目的专家 Agent
│
├── rules/                # 代码规范
│   ├── coding-style.md   # 编码风格规范
│   └── architecture.md   # 架构规范
│
└── templates/            # 代码模板（可选）
    ├── component.md      # 组件模板
    └── service.md        # 服务模板
```

## 配置详解

### config.json

```json
{
  "projectType": "react-typescript",
  "framework": "React",
  "language": "TypeScript",
  "createdAt": "2026-01-23T10:30:00Z",

  "preferences": {
    "testFramework": "jest",
    "linter": "eslint",
    "formatter": "prettier",
    "stateManagement": "zustand"
  },

  "agentPreferences": {
    "defaultCoder": "luban",
    "defaultReviewer": "weizheng",
    "defaultTester": "baozheng"
  },

  "conventions": {
    "componentStyle": "functional",
    "fileNaming": "PascalCase",
    "importOrder": ["react", "third-party", "local"],
    "maxFileLines": 300
  }
}
```

### Agent 偏好设置

根据项目类型推荐不同的默认 Agent:

| 项目类型 | 默认实现 | 默认审查 | 默认测试 |
|----------|----------|----------|----------|
| 前端 | 鲁班 | 魏征 | 包拯 |
| 后端 | 鲁班 | 墨子 | 包拯 |
| 全栈 | 鲁班 | 魏征+墨子 | 包拯 |

### 编码约定

每个模板包含特定的编码约定:

**React TypeScript:**
- 函数式组件 + Hooks
- Props 使用 interface
- 状态管理用 Zustand

**Python FastAPI:**
- Pydantic 模型
- 依赖注入
- async/await 优先

**Go Gin:**
- 目录结构: cmd/internal/pkg
- 错误处理模式
- 中间件链

## 自动检测逻辑

```
检测优先级:
1. package.json → 识别 JS/TS 框架
2. requirements.txt/pyproject.toml → 识别 Python 框架
3. go.mod → 识别 Go 框架
4. Cargo.toml → 识别 Rust 框架
5. pom.xml/build.gradle → 识别 Java 框架
6. composer.json → 识别 PHP 框架
```

## 使用示例

### 交互式初始化

```bash
/init
```

系统会询问项目类型和偏好。

### 指定模板初始化

```bash
/init react-typescript
```

直接使用指定模板。

### 自动检测初始化

```bash
/init auto
```

自动检测项目类型并推荐模板。

## 与其他功能集成

### 与 /yishan 集成

初始化后，愚公会自动加载项目配置:

```
🏔️ 检测到项目配置: react-typescript
📋 应用编码规范: React 函数式组件
🎯 默认 Agent: 鲁班 (实现) | 魏征 (审查)
```

### 与 /learn 集成

`/learn project` 会读取并扩展 `.oh-my-claude/config.json`。

### 与 Agent 集成

项目专用 Agent (`project-expert.md`) 会被自动加载，提供项目特定的建议。

## 注意事项

1. **不覆盖原则**: 如果 `.oh-my-claude/` 已存在，会询问是否覆盖
2. **可定制**: 生成的配置可以手动修改
3. **版本控制**: 建议将 `.oh-my-claude/` 提交到版本控制

## 扩展模板

可以在 `~/.oh-my-claude/templates/` 添加自定义模板:

```
~/.oh-my-claude/templates/
└── my-company-react/
    ├── template.json     # 模板配置
    ├── config.json       # 项目配置模板
    ├── agents/           # Agent 模板
    └── rules/            # 规则模板
```
