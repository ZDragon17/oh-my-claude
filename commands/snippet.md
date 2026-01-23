---
name: snippet
description: |
  代码片段库命令 - 保存、管理和使用常用代码片段。
  别名：/蔡伦 (蔡伦造纸，收集整理智慧)
aliases:
  - /蔡伦
  - /锦囊
  - /代码片段
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
model: sonnet
---

<command-name>/snippet</command-name>

# 代码片段库

保存、管理和使用常用代码片段，提升开发效率。

## 使用方法

```bash
/snippet save <name>             # 保存选中的代码为片段
/snippet list                    # 列出所有片段
/snippet use <name>              # 使用指定片段
/snippet search <keyword>        # 搜索片段
/snippet delete <name>           # 删除片段
/snippet edit <name>             # 编辑片段
/snippet export                  # 导出所有片段
/snippet import <path>           # 导入片段
```

## 参数说明

用户输入: `$ARGUMENTS`

根据参数执行：

- `save <name>`: 保存代码片段
- `list`: 列出所有片段
- `use <name>`: 使用片段（根据上下文调整）
- `search <keyword>`: 搜索片段
- `delete <name>`: 删除片段
- `edit <name>`: 编辑片段
- `export`: 导出片段集合
- `import <path>`: 导入片段集合

## 存储结构

片段存储在 `~/.oh-my-claude/snippets/`:

```
~/.oh-my-claude/snippets/
├── index.json              # 片段索引
├── react-query-hook.md     # 片段文件
├── auth-middleware.md
├── prisma-crud.md
└── ...
```

### 片段文件格式

```markdown
---
name: react-query-hook
description: React Query 数据获取 Hook
language: typescript
tags: [react, query, hook, data-fetching]
author: 鲁班
created: 2026-01-23T10:30:00Z
updated: 2026-01-23T10:30:00Z
---

# React Query 数据获取 Hook

使用 React Query 获取数据的自定义 Hook 模板。

## 变量

- `{{EntityName}}`: 实体名称 (如 User, Product)
- `{{endpoint}}`: API 端点 (如 /api/users)

## 代码

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function use{{EntityName}}s() {
  return useQuery({
    queryKey: ['{{EntityName}}s'],
    queryFn: () => fetch('{{endpoint}}').then(res => res.json()),
  });
}

export function use{{EntityName}}(id: string) {
  return useQuery({
    queryKey: ['{{EntityName}}', id],
    queryFn: () => fetch(`{{endpoint}}/${id}`).then(res => res.json()),
    enabled: !!id,
  });
}

export function useCreate{{EntityName}}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetch('{{endpoint}}', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{{EntityName}}s'] });
    },
  });
}
```

## 使用示例

```typescript
// 替换变量后
const { data: users } = useUsers();
const { data: user } = useUser(id);
const createUser = useCreateUser();
```
```

## 输出格式

### 保存片段

```
💾 保存代码片段
═══════════════════════════════════════════════════════════════════

请提供片段信息：

📝 名称: react-query-hook (已设置)

请输入以下信息：
> 描述: React Query 数据获取 Hook
> 语言: typescript
> 标签 (逗号分隔): react, query, hook

═══════════════════════════════════════════════════════════════════

✅ 片段已保存！

📁 位置: ~/.oh-my-claude/snippets/react-query-hook.md
📊 大小: 1.2 KB
🏷️ 标签: react, query, hook

💡 使用 /snippet use react-query-hook 来使用此片段
```

### 列出片段

```
📚 代码片段库
═══════════════════════════════════════════════════════════════════

共 12 个片段

┌─────────────────────┬────────────┬─────────────────────────────┐
│ 名称                │ 语言       │ 描述                        │
├─────────────────────┼────────────┼─────────────────────────────┤
│ react-query-hook    │ typescript │ React Query 数据获取 Hook   │
│ auth-middleware     │ typescript │ Express 认证中间件          │
│ prisma-crud         │ typescript │ Prisma CRUD 操作模板        │
│ react-form          │ typescript │ React Hook Form 表单        │
│ error-boundary      │ typescript │ React 错误边界组件          │
│ api-route           │ typescript │ Next.js API 路由模板        │
│ python-decorator    │ python     │ Python 装饰器模板           │
│ fastapi-router      │ python     │ FastAPI 路由模板            │
│ go-handler          │ go         │ Gin HTTP 处理器             │
│ docker-compose      │ yaml       │ Docker Compose 模板         │
│ github-action       │ yaml       │ GitHub Actions 工作流       │
│ readme-template     │ markdown   │ README 文档模板             │
└─────────────────────┴────────────┴─────────────────────────────┘

═══════════════════════════════════════════════════════════════════

💡 使用 /snippet use <名称> 来使用片段
💡 使用 /snippet search <关键词> 搜索片段
```

### 使用片段

```
📋 使用代码片段: react-query-hook
═══════════════════════════════════════════════════════════════════

📝 片段描述: React Query 数据获取 Hook

🔧 检测到变量:
   • {{EntityName}}: 实体名称
   • {{endpoint}}: API 端点

请提供变量值：
> EntityName: User
> endpoint: /api/users

═══════════════════════════════════════════════════════════════════

✅ 代码已生成:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['Users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['User', id],
    queryFn: () => fetch(`/api/users/${id}`).then(res => res.json()),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Users'] });
    },
  });
}
```

═══════════════════════════════════════════════════════════════════

💡 代码已复制到剪贴板
💡 或指定文件路径自动写入: /snippet use react-query-hook --output src/hooks/useUser.ts
```

### 搜索片段

```
🔍 搜索片段: "react"
═══════════════════════════════════════════════════════════════════

找到 4 个匹配:

1. react-query-hook (typescript)
   React Query 数据获取 Hook
   标签: react, query, hook

2. react-form (typescript)
   React Hook Form 表单
   标签: react, form, validation

3. error-boundary (typescript)
   React 错误边界组件
   标签: react, error, boundary

4. react-context (typescript)
   React Context 状态管理
   标签: react, context, state

═══════════════════════════════════════════════════════════════════

💡 使用 /snippet use <名称> 来使用片段
```

## 内置片段

系统预置常用片段：

| 类别 | 片段 | 描述 |
|------|------|------|
| React | react-query-hook | 数据获取 Hook |
| React | react-form | 表单处理 |
| React | error-boundary | 错误边界 |
| Next.js | api-route | API 路由 |
| Next.js | server-action | Server Action |
| Express | auth-middleware | 认证中间件 |
| Prisma | prisma-crud | CRUD 操作 |
| Python | fastapi-router | FastAPI 路由 |
| Go | gin-handler | Gin 处理器 |
| DevOps | docker-compose | Docker 配置 |
| CI/CD | github-action | GitHub Actions |

## 变量替换

片段支持 `{{变量名}}` 格式的变量：

```typescript
// 片段中
export function use{{EntityName}}() { ... }

// 使用时
> EntityName: Product

// 生成结果
export function useProduct() { ... }
```

## 与 Agent 集成

保存片段时可记录创建 Agent：

```bash
# 鲁班生成了优质代码后
/snippet save auth-middleware --agent 鲁班
```

这样可以追踪哪个 Agent 创建的片段最有用。

## 响应要求

1. **分类清晰** - 按语言和用途分类
2. **变量支持** - 支持变量替换
3. **即用即走** - 快速选择和使用
4. **可扩展** - 支持导入导出
5. **智能匹配** - 根据上下文推荐片段
