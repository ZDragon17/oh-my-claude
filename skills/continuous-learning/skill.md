---
name: continuous-learning
description: |
  持续学习技能 - 自动从会话中提取可复用模式并保存为学习成果。
  灵感来自 ECC (Enhanced Claude Code) 的持续学习机制。

  核心功能：
  - 自动识别会话中的可复用模式
  - 保存学习成果到 .claude/learned-patterns/
  - 支持手动触发学习 (/xuetu)
  - 通过 Stop hook 自动触发
---

# 持续学习技能 (Continuous Learning)

基于 ECC 的持续学习机制，自动从开发会话中提取可复用的模式和经验。

## 核心理念

> **"学而时习之，不亦说乎"** —— 《论语》
>
> 从每次会话中学习，积累经验，持续进步。

## 工作原理

```
┌─────────────────────────────────────────────────┐
│              持续学习工作流程                    │
├─────────────────────────────────────────────────┤
│                                                 │
│   会话进行中                                     │
│       │                                         │
│       ▼                                         │
│   ┌──────────────┐                              │
│   │ 模式识别     │                              │
│   │ - 代码模式   │                              │
│   │ - 解决方案   │                              │
│   │ - 最佳实践   │                              │
│   └──────┬───────┘                              │
│          │                                      │
│          ▼                                      │
│   ┌──────────────┐                              │
│   │ 价值评估     │                              │
│   │ - 可复用性   │                              │
│   │ - 通用性     │                              │
│   │ - 正确性     │                              │
│   └──────┬───────┘                              │
│          │                                      │
│          ▼                                      │
│   ┌──────────────┐                              │
│   │ 保存学习     │                              │
│   │ → .claude/   │                              │
│   │   learned-   │                              │
│   │   patterns/  │                              │
│   └──────────────┘                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 学习内容分类

### 1. 代码模式 (Code Patterns)

从实现中提取可复用的代码模式：

```markdown
## 模式：React 表单验证

### 触发条件
- 实现表单验证逻辑
- 使用 react-hook-form

### 模式代码
\`\`\`typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(8, '密码至少8位'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // 处理提交
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 表单字段 */}
    </form>
  );
}
\`\`\`

### 学习来源
- 会话: 2026-02-03-login-form
- 项目: my-app
```

### 2. 问题解决方案 (Solutions)

记录遇到的问题和解决方案：

```markdown
## 解决方案：Next.js 13+ 中 cookies 在服务端组件中不可用

### 问题描述
在 Next.js 13+ 的服务端组件中尝试使用 cookies() 时报错：
"cookies can only be called in a Server Component or a Route Handler"

### 根本原因
cookies() 需要在异步上下文中调用，且只能在特定位置使用。

### 解决方案
\`\`\`typescript
// 1. 在 Server Component 中使用
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  // ...
}

// 2. 或在 Route Handler 中使用
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  // ...
}
\`\`\`

### 学习来源
- 会话: 2026-02-03-auth-fix
```

### 3. 项目特定知识 (Project Knowledge)

记录项目特定的约定和知识：

```markdown
## 项目知识：API 响应格式

### 项目
my-saas-app

### 约定
所有 API 响应遵循统一格式：

\`\`\`typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    total?: number;
  };
}
\`\`\`

### 示例
\`\`\`typescript
// 成功响应
{
  "success": true,
  "data": { "id": 1, "name": "John" },
  "meta": { "page": 1, "total": 100 }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱格式不正确"
  }
}
\`\`\`
```

### 4. 最佳实践 (Best Practices)

记录发现的最佳实践：

```markdown
## 最佳实践：数据库事务处理

### 场景
多表操作需要保证原子性

### 推荐做法
\`\`\`typescript
// 使用 Prisma 事务
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const profile = await tx.profile.create({
    data: { ...profileData, userId: user.id }
  });
  return { user, profile };
});

// 使用 try-catch 处理事务失败
try {
  const result = await prisma.$transaction([
    prisma.user.create({ data: userData }),
    prisma.order.create({ data: orderData }),
  ]);
} catch (error) {
  // 事务自动回滚
  console.error('事务失败:', error);
  throw error;
}
\`\`\`

### 避免
- 手动管理事务状态
- 在事务中进行外部 API 调用
- 事务粒度过大
```

## 存储结构

学习成果存储在 `.claude/learned-patterns/` 目录：

```
.claude/
└── learned-patterns/
    ├── index.json              # 学习索引
    ├── code-patterns/          # 代码模式
    │   ├── react-form.md
    │   └── api-error-handling.md
    ├── solutions/              # 问题解决方案
    │   ├── nextjs-cookies.md
    │   └── prisma-connection.md
    ├── project-knowledge/      # 项目知识
    │   └── api-conventions.md
    └── best-practices/         # 最佳实践
        ├── database-transactions.md
        └── error-handling.md
```

### 索引文件格式

```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-03T10:30:00Z",
  "patterns": [
    {
      "id": "react-form-validation",
      "category": "code-patterns",
      "title": "React 表单验证",
      "tags": ["react", "form", "validation", "zod"],
      "file": "code-patterns/react-form.md",
      "createdAt": "2026-02-03T10:30:00Z",
      "usageCount": 3
    }
  ]
}
```

## 触发方式

### 1. 手动触发

```bash
# 从当前会话学习
/xuetu

# 查看已学习的模式
/xuetu list

# 搜索学习成果
/xuetu search "form validation"

# 应用学习成果
/xuetu apply react-form-validation
```

### 2. 自动触发 (Stop Hook)

会话结束时自动分析并提取有价值的模式。

配置 `.claude/settings.json`:

```json
{
  "omc": {
    "continuousLearning": {
      "enabled": true,
      "autoLearn": true,
      "minSessionLength": 10,
      "categories": ["code-patterns", "solutions", "best-practices"]
    }
  }
}
```

## 学习评估标准

### 值得学习的内容

| 标准 | 权重 | 说明 |
|------|------|------|
| 可复用性 | 40% | 在其他场景能否复用 |
| 通用性 | 30% | 是否适用于多种项目 |
| 正确性 | 20% | 是否是正确的做法 |
| 复杂度 | 10% | 是否值得记录（过于简单的不记录） |

### 不学习的内容

- 项目特定的业务逻辑（除非明确标记）
- 临时的调试代码
- 明显的错误尝试
- 敏感信息（API key、密码等）

## 学习模式识别

### 自动识别信号

```
可学习内容的信号：
├── 重复出现的代码模式
├── 解决了特定问题的代码
├── 用户明确表示"这个方案好"
├── 通过测试验证的实现
└── 遵循最佳实践的代码

应跳过的信号：
├── 调试代码 (console.log, debugger)
├── TODO/FIXME 注释
├── 被删除或回滚的代码
├── 明确标记为临时的代码
└── 包含硬编码敏感信息的代码
```

## 与其他功能集成

### 与 /learn 集成

`/learn` 生成项目画像，`/xuetu` 积累个人/团队经验：

```
/learn    → 项目级知识（结构、技术栈、规范）
/xuetu    → 个人级知识（解决方案、模式、经验）
```

### 与 /yishan 集成

愚公在执行任务时会参考学习成果：

```
🏔️ 愚公

检测到相关学习成果：
- react-form-validation: React 表单验证模式
- api-error-handling: API 错误处理最佳实践

将参考这些模式进行实现...
```

### 与 Agent 集成

所有 Agent 都能访问学习成果：

- 🔧 鲁班: 参考代码模式
- 🎯 诸葛: 参考架构决策
- 📝 司马迁: 参考文档模板

## 使用示例

### 示例 1: 学习表单验证模式

```bash
# 会话中实现了一个表单验证
# Claude 自动识别这是一个可复用模式

/xuetu save "React 表单验证" --category code-patterns --tags react,form,zod
```

### 示例 2: 搜索学习成果

```bash
/xuetu search "authentication"

# 输出:
# 找到 3 个相关学习成果:
# 1. [solution] JWT 刷新令牌实现
# 2. [code-pattern] NextAuth 配置模式
# 3. [best-practice] 安全认证最佳实践
```

### 示例 3: 应用学习成果

```bash
/xuetu apply jwt-refresh-token

# Claude 会读取学习成果并应用到当前上下文
```

## 最佳实践

1. **定期回顾** - 每周回顾学习成果，清理过时的内容
2. **标签管理** - 使用一致的标签便于搜索
3. **团队共享** - 将 learned-patterns 目录加入版本控制与团队共享
4. **质量控制** - 只保存验证过的、正确的模式

## 隐私说明

- 学习成果存储在本地 `.claude/` 目录
- 不会自动上传到任何服务器
- 可通过 `.gitignore` 排除敏感内容
- 敏感信息会被自动过滤
