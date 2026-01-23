---
name: error
description: |
  错误知识库技能 - 保存、搜索和复用错误解决方案。
  积累团队的错误处理经验，避免重复踩坑。
---

# 错误知识库技能 (Error Knowledge Base)

保存、搜索和复用错误解决方案，积累团队经验。

## 核心理念

> 错误是学习的机会。
> 记录一次，受益终身。

## 功能概述

### 📝 保存错误

记录错误及其解决方案：

```bash
/error save array-map-undefined
```

保存内容：
- 完整错误信息
- 错误类型分类
- 环境信息（语言、框架、版本）
- 根因分析
- 解决方案（可多个）
- 预防措施
- 相关标签

### 🔍 搜索错误

按关键词搜索：

```bash
/error search undefined
/error search "connection refused"
/error search --tag react
/error search --type TypeError
```

### 📋 查看详情

查看错误的完整信息：

```bash
/error show array-map-undefined
/error show 1  # 按序号
```

### 📊 统计分析

了解错误分布和趋势：

```bash
/error stats
```

## 错误类型

| 类型 | 图标 | 常见原因 |
|------|------|----------|
| TypeError | 🔴 | 空值访问、类型不匹配 |
| ReferenceError | 🟠 | 变量未定义、导入缺失 |
| SyntaxError | 🟡 | 拼写错误、格式问题 |
| NetworkError | 🔵 | 连接失败、超时、CORS |
| DatabaseError | 🟣 | 连接问题、查询错误 |
| RuntimeError | ⚫ | 内存溢出、死循环 |

## 存储结构

```text
~/.oh-my-claude/errors/
├── index.json              # 错误索引
├── array-map-undefined.md  # 错误记录
├── postgres-connection.md
└── ...
```

## 错误记录格式

```markdown
---
id: err_20260120_001
name: array-map-undefined
error: "TypeError: Cannot read property 'map' of undefined"
type: TypeError
language: javascript
framework: react
tags: [react, array, undefined]
created: 2026-01-20T10:30:00Z
usage_count: 12
---

# 错误标题

## 错误信息
...

## 根因分析
...

## 解决方案
...

## 预防措施
...
```

## 与 /debug 集成

诊断错误时自动查询知识库：

1. 用户执行 `/debug error "TypeError..."`
2. 扁鹊诊断的同时，自动搜索知识库
3. 如有匹配记录，显示已知解决方案
4. 用户可直接应用历史方案

## 最佳实践

### 记录时机

- ✅ 解决了一个新类型的错误
- ✅ 找到了更好的解决方案
- ✅ 错误涉及团队常用技术栈
- ❌ 明显的拼写错误
- ❌ 一次性的配置问题

### 命名规范

使用 kebab-case 描述错误：

- `array-map-undefined` ✓
- `postgres-connection-refused` ✓
- `nextjs-module-not-found` ✓
- `error1` ✗
- `bug` ✗

### 标签使用

添加有意义的标签便于搜索：

- 技术栈：`react`, `nextjs`, `postgres`
- 错误类型：`undefined`, `null`, `async`
- 场景：`render`, `api`, `deploy`

### 解决方案

提供多种方案，标注推荐：

```markdown
### 方案 1: 可选链 (推荐)
最简洁的现代 JavaScript 写法

### 方案 2: 默认值
兼容性更好的传统写法

### 方案 3: 条件渲染
适合需要显示加载状态的场景
```

## 团队协作

### 共享知识库

将 `~/.oh-my-claude/errors/` 目录：
1. 加入版本控制
2. 或使用 `/share export errors` 导出

### 导入团队知识库

```bash
/share import team-errors.zip
```

## 统计指标

- **记录总数** - 知识库规模
- **本月新增** - 活跃度
- **解决率** - 记录质量
- **使用次数** - 价值评估
- **高频错误** - 重点关注

## 常见问题

### Q: 错误记录太多怎么办？

定期清理：
- 删除过时的记录（框架版本更新后不再适用）
- 合并相似的记录
- 归档很少使用的记录

### Q: 如何判断相关度？

搜索算法考虑：
- 错误信息匹配度（权重 1.0）
- 名称匹配度（权重 0.8）
- 标签匹配度（权重 0.7）
- 解决方案关键词（权重 0.5）
