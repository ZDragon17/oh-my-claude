---
name: snippet
description: |
  代码片段库技能 - 保存、管理和使用常用代码片段。
  支持变量替换、分类管理、导入导出。
---

# 代码片段库技能 (Code Snippets)

保存、管理和使用常用代码片段，提升开发效率。

## 核心理念

> 好代码值得复用。
> 积累片段，提升效率。

## 片段结构

### 片段文件格式

```markdown
---
name: react-query-hook
description: React Query 数据获取 Hook
language: typescript
tags: [react, query, hook]
author: 鲁班
created: 2026-01-23T10:30:00Z
---

# 标题

描述...

## 变量

- `{{VarName}}`: 说明

## 代码

```typescript
// 代码内容
```

## 使用示例

```typescript
// 示例
```
```

### 存储结构

```
~/.oh-my-claude/snippets/
├── index.json              # 索引文件
├── react-query-hook.md     # 片段文件
├── auth-middleware.md
└── ...
```

## 变量系统

### 变量格式

使用 `{{变量名}}` 格式定义变量：

```typescript
export function use{{EntityName}}() {
  return fetch('{{endpoint}}');
}
```

### 变量替换

使用片段时提供变量值：

```
> EntityName: User
> endpoint: /api/users
```

生成结果：

```typescript
export function useUser() {
  return fetch('/api/users');
}
```

## 内置片段

### React

| 片段 | 描述 |
|------|------|
| react-query-hook | 数据获取 Hook |
| react-form | 表单处理 |
| error-boundary | 错误边界 |
| react-context | Context 管理 |

### Next.js

| 片段 | 描述 |
|------|------|
| api-route | API 路由 |
| server-action | Server Action |
| middleware | 中间件 |

### Express

| 片段 | 描述 |
|------|------|
| auth-middleware | 认证中间件 |
| error-handler | 错误处理 |
| rate-limiter | 限流 |

### Python

| 片段 | 描述 |
|------|------|
| fastapi-router | FastAPI 路由 |
| python-decorator | 装饰器 |
| async-context | 异步上下文 |

### DevOps

| 片段 | 描述 |
|------|------|
| docker-compose | Docker 配置 |
| dockerfile | Dockerfile |
| github-action | CI/CD 流程 |

## 操作指南

### 保存片段

```bash
# 保存当前代码为片段
/snippet save my-hook

# 指定元数据
/snippet save my-hook --lang typescript --tags "react,hook"
```

### 使用片段

```bash
# 使用片段
/snippet use react-query-hook

# 直接输出到文件
/snippet use react-query-hook --output src/hooks/useUser.ts
```

### 搜索片段

```bash
# 按关键词搜索
/snippet search react

# 按标签筛选
/snippet search --tag authentication
```

### 管理片段

```bash
# 列出所有
/snippet list

# 编辑片段
/snippet edit my-hook

# 删除片段
/snippet delete my-hook
```

### 导入导出

```bash
# 导出所有片段
/snippet export --output snippets.zip

# 导入片段
/snippet import snippets.zip
```

## Agent 集成

### 记录创建 Agent

保存片段时可记录 Agent：

```bash
/snippet save auth-middleware --agent 鲁班
```

### 统计优质片段来源

```bash
/snippet stats
# 显示各 Agent 创建的片段数量和使用频率
```

## 智能推荐

根据当前上下文推荐相关片段：

```
检测到 React 项目...

💡 推荐片段:
   1. react-query-hook - 数据获取
   2. react-form - 表单处理
   3. error-boundary - 错误处理
```

## 分类体系

| 类别 | 包含 |
|------|------|
| 前端 | React, Vue, Angular, Svelte |
| 后端 | Express, FastAPI, Gin, Spring |
| 数据库 | Prisma, TypeORM, SQLAlchemy |
| DevOps | Docker, Kubernetes, CI/CD |
| 测试 | Jest, Pytest, Go Test |

## 最佳实践

1. **命名规范** - 使用 kebab-case: `react-query-hook`
2. **详细描述** - 说明用途和使用场景
3. **定义变量** - 使用变量提高复用性
4. **添加示例** - 包含使用示例
5. **打标签** - 添加相关标签便于搜索

## 与其他功能集成

### 与 /learn 集成

学习项目后推荐相关片段：

```
项目使用 React + TypeScript
推荐片段: react-query-hook, react-form
```

### 与 Agent 集成

Agent 生成代码后提示保存：

```
🔧 鲁班完成代码生成

💡 代码质量不错，是否保存为片段?
   /snippet save auth-hook
```
