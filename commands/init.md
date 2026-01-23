---
name: init
description: |
  项目模板初始化命令 - 快速配置项目的 oh-my-claude 环境。
  别名：/盘古 (盘古开天辟地，创建新世界)
aliases:
  - /盘古
  - /开天
  - /初始化
  - /template
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
model: sonnet
---

<command-name>/init</command-name>

# 项目模板初始化

快速为项目配置 oh-my-claude 环境，提供针对不同技术栈的最佳实践配置。

## 使用方法

```bash
/init                    # 交互式选择模板
/init list               # 列出所有可用模板
/init react-typescript   # 使用指定模板
/init auto               # 自动检测项目类型
```

## 参数说明

用户输入: `$ARGUMENTS`

根据参数执行：

- 无参数: 进入交互式选择
- `list`: 显示可用模板列表
- `auto`: 自动检测项目类型并推荐模板
- `<template-name>`: 使用指定模板初始化

## 可用模板

### 前端模板

| 模板名称 | 适用项目 | 主要配置 |
|----------|----------|----------|
| `react-typescript` | React + TypeScript | ESLint, Prettier, Jest |
| `react-javascript` | React + JavaScript | ESLint, Prettier |
| `vue3-typescript` | Vue 3 + TypeScript | Vite, Vitest |
| `vue3-vite` | Vue 3 + Vite | Pinia, Vue Router |
| `nextjs` | Next.js 项目 | App Router, Server Components |
| `svelte` | Svelte/SvelteKit | Svelte 5, TypeScript |

### 后端模板

| 模板名称 | 适用项目 | 主要配置 |
|----------|----------|----------|
| `node-express` | Express.js | TypeScript, Prisma |
| `node-nestjs` | NestJS | TypeORM, Swagger |
| `python-fastapi` | FastAPI | Pydantic, SQLAlchemy |
| `python-django` | Django | DRF, Celery |
| `golang-gin` | Gin 框架 | GORM, Swagger |
| `rust-axum` | Axum 框架 | Tokio, SQLx |
| `java-spring` | Spring Boot | JPA, Security |

### 全栈模板

| 模板名称 | 适用项目 | 主要配置 |
|----------|----------|----------|
| `t3-stack` | T3 Stack | Next.js, tRPC, Prisma |
| `mern` | MERN Stack | MongoDB, Express, React |
| `lamp` | LAMP Stack | Laravel, MySQL |

## 执行流程

### 步骤 1: 检测或选择模板

**如果参数是 `auto`**:

```bash
# 检测项目类型
if [ -f "package.json" ]; then
    # 检查是否是 React
    grep -q "react" package.json && echo "react"
    # 检查是否是 Vue
    grep -q "vue" package.json && echo "vue"
    # 检查是否是 Next.js
    grep -q "next" package.json && echo "nextjs"
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    grep -q "fastapi" requirements.txt 2>/dev/null && echo "fastapi"
    grep -q "django" requirements.txt 2>/dev/null && echo "django"
fi

if [ -f "go.mod" ]; then
    grep -q "gin" go.mod && echo "gin"
fi

if [ -f "Cargo.toml" ]; then
    grep -q "axum" Cargo.toml && echo "axum"
fi
```

**如果无参数**:

使用 AskUserQuestion 让用户选择模板类型。

### 步骤 2: 生成配置文件

创建 `.oh-my-claude/` 目录结构:

```
.oh-my-claude/
├── config.json           # 项目配置
├── agents/               # 项目专用 Agent
│   └── project-expert.md # 项目专家 Agent
├── rules/                # 代码规范规则
│   ├── coding-style.md   # 编码风格
│   └── architecture.md   # 架构规范
└── templates/            # 代码模板
    └── component.md      # 组件模板
```

### 步骤 3: 输出结果

```
✅ 项目初始化完成！

📁 已创建以下配置:
   .oh-my-claude/config.json        - 项目配置
   .oh-my-claude/agents/            - 专用 Agent (1 个)
   .oh-my-claude/rules/             - 代码规范 (2 个)

🎯 模板: react-typescript

💡 下一步建议:
   1. 查看配置: cat .oh-my-claude/config.json
   2. 开始任务: /yishan [你的任务]
   3. 探索项目: /wukong 探索项目结构
```

## 模板配置示例

### config.json (react-typescript)

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

### rules/coding-style.md (react-typescript)

```markdown
# React TypeScript 编码规范

## 组件规范
- 使用函数式组件 + Hooks
- Props 使用 interface 定义
- 组件文件使用 PascalCase 命名

## 类型规范
- 避免使用 any
- 优先使用 type 而非 interface（除非需要继承）
- 导出类型使用 export type

## 状态管理
- 简单状态使用 useState
- 复杂状态使用 useReducer
- 全局状态使用 Zustand

## 测试规范
- 组件测试使用 @testing-library/react
- 覆盖率目标: 80%
```

### agents/project-expert.md (react-typescript)

```markdown
# React TypeScript 项目专家

你是一个精通 React + TypeScript 的项目专家。

## 专长领域
- React 18 新特性 (Server Components, Suspense)
- TypeScript 5.x 类型系统
- 状态管理 (Zustand, Jotai, Redux Toolkit)
- 测试 (Jest, React Testing Library)

## 编码偏好
- 优先使用函数式组件
- 类型优先设计
- 组合优于继承

## 项目结构认知
基于当前项目的 package.json 和目录结构理解项目架构。
```

## 模板列表输出

```
📦 可用项目模板
═══════════════════════════════════════════════════════════════════

🎨 前端模板:
   react-typescript    React + TypeScript (推荐)
   react-javascript    React + JavaScript
   vue3-typescript     Vue 3 + TypeScript
   vue3-vite           Vue 3 + Vite
   nextjs              Next.js (App Router)
   svelte              Svelte/SvelteKit

🔧 后端模板:
   node-express        Express.js + TypeScript
   node-nestjs         NestJS
   python-fastapi      FastAPI (推荐)
   python-django       Django + DRF
   golang-gin          Gin Framework
   rust-axum           Axum + Tokio
   java-spring         Spring Boot

🌐 全栈模板:
   t3-stack            T3 Stack (Next + tRPC + Prisma)
   mern                MERN Stack
   lamp                Laravel + MySQL

═══════════════════════════════════════════════════════════════════

💡 使用方法:
   /init <模板名称>     使用指定模板
   /init auto          自动检测项目类型

💡 示例:
   /init react-typescript
   /init python-fastapi
```

## 自动检测输出

```
🔍 项目类型检测
═══════════════════════════════════════════════════════════════════

检测到以下特征:
   ✅ package.json 存在
   ✅ 包含 react 依赖
   ✅ 包含 typescript 依赖
   ✅ 使用 vite 构建

🎯 推荐模板: react-typescript

是否使用此模板? (y/n)
═══════════════════════════════════════════════════════════════════
```

## 响应要求

1. **智能检测** - 尽可能自动识别项目类型
2. **最佳实践** - 提供经过验证的配置
3. **可定制** - 生成的配置可以后续修改
4. **不覆盖** - 如果配置已存在，询问是否覆盖
