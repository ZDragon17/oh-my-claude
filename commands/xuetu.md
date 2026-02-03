---
name: xuetu
description: |
  学徒命令 - 从经验中学习
  基于持续学习技能，从会话中提取可复用模式。
  别名：/apprentice, /learner, /remember
arguments:
  - name: action
    description: "操作类型: (空)=分析学习, list=列出, search=搜索, apply=应用, save=保存"
    required: false
  - name: query
    description: "搜索关键词或模式 ID"
    required: false
---

# /xuetu - 学徒命令

> 📚 学而时习之，温故而知新

从会话中提取可复用的模式和经验，建立个人/团队知识库。

## 命令格式

```bash
# 基本用法：从当前会话提取学习
/xuetu

# 指定提取内容
/xuetu "如何处理认证错误"

# 列出所有已学习的模式
/xuetu list

# 按分类列出
/xuetu list --category code-patterns

# 搜索特定模式
/xuetu search "认证"
/xuetu search --tags auth,jwt

# 应用已学习的模式
/xuetu apply jwt-refresh-token

# 手动保存模式
/xuetu save "模式名称" --category code-patterns --tags react,form

# 删除过时的学习成果
/xuetu delete <pattern-id>

# 导出知识库
/xuetu export > patterns.json

# 导入知识库
/xuetu import patterns.json
```

## 执行流程

<xuetu>
## 学徒学习流程

### 阶段 1: 会话分析

分析当前会话中的：
- 实现的功能代码
- 解决的问题
- 使用的模式
- 讨论的最佳实践

### 阶段 2: 模式识别

识别以下信号：
- [ ] 重复出现的代码结构
- [ ] 解决了特定问题的方案
- [ ] 用户肯定的实现方式
- [ ] 通过验证的代码

### 阶段 3: 价值评估

对每个候选内容评估：
| 维度 | 权重 | 说明 |
|------|------|------|
| 可复用性 | 40% | 能否在其他场景使用 |
| 通用性 | 30% | 是否项目无关 |
| 正确性 | 20% | 是否是正确做法 |
| 复杂度 | 10% | 是否值得记录 |

### 阶段 4: 保存学习成果

将有价值的内容保存到 `.claude/learned-patterns/`

分类：
- `code-patterns/` - 代码模式
- `solutions/` - 问题解决方案
- `best-practices/` - 最佳实践
- `project-knowledge/` - 项目知识

### 阶段 5: 汇报结果

```markdown
## 📚 学习报告

### 本次学习
从当前会话识别并保存了以下模式：

#### 1. [code-pattern] React 表单验证
- **文件**: `code-patterns/react-form-validation.md`
- **标签**: react, form, zod
- **来源**: 实现登录表单

#### 2. [solution] Prisma 连接池配置
- **文件**: `solutions/prisma-connection-pool.md`
- **标签**: prisma, database
- **来源**: 修复连接超时

### 统计
- 总学习成果: 42 个
- 本次新增: 2 个
```
</xuetu>

## 学习成果格式

### 代码模式

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

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  // ...
}
\`\`\`

### 学习来源
- 会话: 2026-02-03-login
```

### 解决方案

```markdown
## 解决方案：Next.js Cookies 问题

### 问题描述
在服务端组件中 cookies() 报错

### 根本原因
cookies() 需要在异步上下文中调用

### 解决方案
\`\`\`typescript
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
}
\`\`\`
```

## 存储位置

```
.claude/
└── learned-patterns/
    ├── index.json              # 学习索引
    ├── code-patterns/          # 代码模式
    ├── solutions/              # 解决方案
    ├── best-practices/         # 最佳实践
    └── project-knowledge/      # 项目知识
```

## 配置选项

在 `.claude/settings.json` 中配置：

```json
{
  "omc": {
    "continuousLearning": {
      "enabled": true,
      "autoLearn": true,
      "storage": "project",
      "minConfidence": 0.7
    }
  }
}
```

## 与其他命令的关系

| 命令 | 功能 | 范围 |
|------|------|------|
| `/learn` | 项目画像 | 项目结构、技术栈 |
| `/xuetu` | 个人经验 | 模式、解决方案 |
| `/snippet` | 代码片段 | 可直接复制的代码 |

## 命令别名

- `/xuetu` - 学徒（中文）
- `/apprentice` - 英文别名
- `/learner` - 学习者
- `/remember` - 记住

---

加载 continuous-learning 技能以获取详细指南。
