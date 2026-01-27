---
name: librarian
description: |
  Librarian (司书) - 文档与代码搜索命令
  召唤 Librarian 进行官方文档查询、开源实现搜索。
  只读搜索，提供有证据支持的答案。
aliases:
  - /librarian
  - /docs
  - /search-docs
  - /司书
  - /查文档
  - /找例子
---

# /librarian - 召唤文档搜索专家

召唤 Librarian (司书) 进行文档查询和代码搜索。Librarian 专注于查找官方文档、开源实现示例，提供有证据支持的答案。

## 使用场景

| 场景 | 示例 |
|------|------|
| 官方文档 | `/librarian React useEffect 的清理函数怎么写？` |
| 开源示例 | `/librarian 找一些生产级别的 Express 认证实现` |
| 库用法 | `/librarian Prisma 怎么做数据库迁移？` |
| 最佳实践 | `/librarian Next.js 的 ISR 最佳实践是什么？` |

## 搜索能力

### 1. 官方文档查询 (Context7)
直接查询库/框架的官方文档。

### 2. GitHub 代码搜索 (grep.app)
搜索 GitHub 上的真实代码实现。

### 3. 网络搜索
搜索博客、文章、讨论等资源。

## 示例

```bash
# 查询官方文档
/librarian React Server Components 是什么？怎么用？

# 查找实现示例
/librarian 找一些 TypeScript 项目中处理环境变量的最佳实践

# 理解库行为
/librarian 为什么 Zod 的 transform 和 refine 顺序会影响结果？

# 查找轮子
/librarian 有没有好用的 Node.js 任务队列库？推荐一下
```

## 输出格式

Librarian 会提供：
- 官方文档摘要
- 代码示例（带来源）
- 生产环境实践
- 注意事项
- 参考链接
- **置信度标注**（高/中/低）

## 与 /wukong 的区别

| 命令 | 搜索范围 | 用途 |
|------|----------|------|
| `/librarian` | 外部（文档、GitHub、网络） | 学习库/框架用法 |
| `/wukong` | 内部（当前项目代码） | 理解项目代码结构 |

## 注意

Librarian 是搜索专家，不是执行者。获得信息后，需要由其他 Agent 来执行具体的代码编写。
