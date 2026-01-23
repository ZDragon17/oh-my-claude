---
name: learn
description: |
  项目学习命令 - 自动分析项目结构、代码模式，生成项目画像。
  别名：/孔子 (孔子学无止境，温故知新)
aliases:
  - /孔子
  - /求学
  - /学习
  - /analyze
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
model: sonnet
---

<command-name>/learn</command-name>

# 项目学习模式

自动分析项目，生成项目画像，让 Agent 深入理解项目背景。

## 使用方法

```bash
/learn                 # 学习当前项目
/learn project         # 同上
/learn refresh         # 刷新项目画像
/learn show            # 显示当前项目画像
```

## 参数说明

用户输入: `$ARGUMENTS`

根据参数执行：

- 无参数或 `project`: 分析项目并生成画像
- `refresh`: 重新分析并更新画像
- `show`: 显示当前项目画像（不重新分析）

## 学习流程

### 阶段 1: 项目结构扫描

并行执行以下探索任务:

```bash
# 1. 目录结构
ls -la
find . -type d -maxdepth 2 | head -50

# 2. 识别关键文件
ls package.json requirements.txt go.mod Cargo.toml pom.xml 2>/dev/null

# 3. 读取 README
cat README.md 2>/dev/null | head -200
```

### 阶段 2: 技术栈识别

识别项目使用的技术:

| 检测文件 | 技术栈 |
|----------|--------|
| package.json | JavaScript/TypeScript 生态 |
| requirements.txt | Python 生态 |
| go.mod | Go 生态 |
| Cargo.toml | Rust 生态 |
| pom.xml | Java/Maven 生态 |
| composer.json | PHP 生态 |

### 阶段 3: 代码模式分析

分析代码风格和架构模式:

- 目录结构模式 (src/lib/tests)
- 命名规范 (camelCase, snake_case)
- 框架特定模式 (React hooks, Django views)
- 测试框架和风格

### 阶段 4: 生成项目画像

将分析结果保存到 `.oh-my-claude/project-profile.md`

## 项目画像结构

```markdown
# 项目画像

## 基本信息

- **项目名称**: my-awesome-project
- **类型**: Web 应用
- **语言**: TypeScript
- **框架**: React 18 + Next.js 14
- **生成时间**: 2026-01-23T10:30:00Z

## 技术栈

### 前端
- React 18 (App Router)
- TypeScript 5.x
- TailwindCSS
- Zustand (状态管理)

### 后端
- Next.js API Routes
- Prisma ORM
- PostgreSQL

### 测试
- Jest + React Testing Library
- Playwright (E2E)

## 项目结构

```
src/
├── app/           # Next.js App Router
├── components/    # React 组件
├── lib/           # 工具函数
├── hooks/         # 自定义 Hooks
└── types/         # TypeScript 类型
```

## 代码规范

- 组件: 函数式 + Hooks
- 命名: PascalCase (组件), camelCase (函数)
- 状态: Zustand stores
- API: tRPC + Prisma

## 关键模块

### 认证系统 (src/lib/auth/)
使用 NextAuth.js，支持 OAuth 和邮箱登录。

### 数据层 (src/lib/db/)
Prisma schema 定义在 prisma/schema.prisma。

## 最近活动

- 最后修改: src/components/Header.tsx (2小时前)
- 活跃分支: feature/user-profile

## Agent 建议

- 代码实现: 鲁班 (熟悉 React + TypeScript)
- 架构设计: 诸葛 (Next.js App Router 专家)
- 测试: 包拯 (Jest + Playwright)
```

## 输出格式

### 学习中

```
🎓 项目学习中...
═══════════════════════════════════════════════════════════════════

📁 扫描项目结构...
   ✅ 识别到 12 个目录
   ✅ 找到 package.json

🔍 识别技术栈...
   ✅ React 18.2.0
   ✅ TypeScript 5.3.2
   ✅ Next.js 14.0.4
   ✅ Prisma 5.7.0

📖 阅读文档...
   ✅ README.md (1,234 字)
   ✅ CONTRIBUTING.md (567 字)

🧩 分析代码模式...
   ✅ 组件风格: 函数式
   ✅ 状态管理: Zustand
   ✅ API 风格: tRPC

═══════════════════════════════════════════════════════════════════
```

### 学习完成

```
🎓 项目学习完成！
═══════════════════════════════════════════════════════════════════

📋 项目画像已生成: .oh-my-claude/project-profile.md

🎯 项目概要:
   名称: my-awesome-project
   类型: 全栈 Web 应用
   语言: TypeScript
   框架: Next.js 14 + React 18

🛠️ 技术栈:
   前端: React, TailwindCSS, Zustand
   后端: Next.js API, Prisma, PostgreSQL
   测试: Jest, Playwright

📁 关键目录:
   src/app/        → Next.js 路由
   src/components/ → React 组件
   src/lib/        → 工具函数
   prisma/         → 数据库 Schema

🤖 推荐 Agent:
   实现: 🔧 鲁班 (React + TypeScript)
   架构: 🎯 诸葛 (Next.js)
   测试: ⚖️ 包拯 (Jest)

═══════════════════════════════════════════════════════════════════

💡 项目画像已加载，后续对话中 Agent 将自动了解项目背景
💡 使用 /learn show 查看完整画像
💡 使用 /learn refresh 更新画像
```

### 显示画像 (`/learn show`)

```
📋 项目画像
═══════════════════════════════════════════════════════════════════

[显示 .oh-my-claude/project-profile.md 的内容]

═══════════════════════════════════════════════════════════════════

⏱️ 生成时间: 2026-01-23 10:30:00
💡 使用 /learn refresh 更新画像
```

## 自动加载机制

项目画像生成后，会在以下场景自动加载:

1. **启动新会话** - 自动读取 project-profile.md
2. **调用 Agent** - Agent 自动获得项目背景
3. **使用 /yishan** - 愚公自动了解项目架构

Agent 响应示例:

```
🔧 鲁班 (已加载项目画像)

我了解到这是一个 Next.js 14 + React 18 项目，使用 TypeScript 和 Zustand 状态管理。

根据项目规范，我将：
- 使用函数式组件 + Hooks
- 遵循 PascalCase 组件命名
- 状态管理使用 Zustand store
- 类型定义放在 src/types/

现在开始实现...
```

## 画像更新策略

| 触发条件 | 行为 |
|----------|------|
| 首次运行 /learn | 完整分析，生成画像 |
| /learn refresh | 重新分析，更新画像 |
| 检测到重大变更 | 提示刷新画像 |
| 超过 7 天未更新 | 建议刷新 |

## 与其他功能集成

### 与 /init 集成

`/init` 创建的配置会被 `/learn` 读取并整合。

### 与 /yishan 集成

愚公在执行任务时会参考项目画像:

```
🏔️ 愚公 (已加载项目画像)

根据项目架构，我将按以下顺序执行:
1. 在 src/components/ 创建组件
2. 在 src/hooks/ 添加自定义 Hook
3. 使用 Zustand 管理状态
4. 用 Jest 编写测试
```

### 与 Agent 集成

所有 Agent 都能访问项目画像，提供更精准的建议。

## 响应要求

1. **全面分析** - 覆盖结构、技术栈、代码模式
2. **快速执行** - 并行分析，2 分钟内完成
3. **可读输出** - 画像格式清晰易读
4. **持久保存** - 保存到文件，跨会话可用
5. **智能更新** - 检测变更，提示刷新
