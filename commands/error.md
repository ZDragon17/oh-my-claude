---
name: error
description: |
  错误知识库命令 - 保存、搜索和复用错误解决方案。
  别名：/华佗 (华佗神医，治病救人)
aliases:
  - /华佗kb
  - /药方
  - /错误
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - TodoWrite
model: haiku
---

<command-name>/error</command-name>

# 📚 错误知识库

你正在使用 **错误知识库** 功能，管理和复用错误解决方案。

---

## 命令解析

根据用户输入 `$ARGUMENTS` 执行相应操作：

### 子命令分发

| 命令 | 说明 |
|------|------|
| `/error` 或 `/error list` | 列出最近的错误记录 |
| `/error save <name>` | 保存当前错误及解决方案 |
| `/error search <keyword>` | 搜索相关错误 |
| `/error show <id>` | 查看错误详情 |
| `/error delete <id>` | 删除错误记录 |
| `/error stats` | 错误统计分析 |

---

## 执行流程

### 1. 列出错误 (`/error` 或 `/error list`)

```text
📚 错误知识库
═══════════════════════════════════════════════════════════════

最近解决的错误:

1. [2026-01-20] TypeError: Cannot read property 'map' of undefined
   标签: react, array, undefined
   解决: 添加空值检查

2. [2026-01-18] ECONNREFUSED 127.0.0.1:5432
   标签: postgres, connection, docker
   解决: 启动 PostgreSQL 容器

3. [2026-01-15] Module not found: '@/components/Button'
   标签: nextjs, import, alias
   解决: 配置 tsconfig paths

共 15 条记录 | /error search <关键词> 搜索
═══════════════════════════════════════════════════════════════
```

### 2. 保存错误 (`/error save <name>`)

交互式收集错误信息：

1. **错误信息** - 完整错误消息
2. **错误类型** - 分类（语法/类型/运行时/网络等）
3. **环境** - 语言、框架、版本
4. **根因** - 问题的根本原因
5. **解决方案** - 具体修复步骤
6. **标签** - 便于搜索的关键词

保存到: `~/.oh-my-claude/errors/<name>.md`

### 3. 搜索错误 (`/error search <keyword>`)

搜索匹配的错误记录：

```text
🔍 搜索结果: "undefined"
═══════════════════════════════════════════════════════════════

找到 3 条相关记录:

1. ⭐ TypeError: Cannot read property 'map' of undefined
   相关度: 95% | 使用次数: 12

2. ReferenceError: x is not defined
   相关度: 78% | 使用次数: 5

3. undefined is not a function
   相关度: 72% | 使用次数: 3

输入 /error show <序号> 查看详情
═══════════════════════════════════════════════════════════════
```

### 4. 查看详情 (`/error show <id>`)

```text
📋 错误详情
═══════════════════════════════════════════════════════════════

❌ TypeError: Cannot read property 'map' of undefined

📍 类型: 类型错误
🏷️ 标签: react, array, undefined, map
📅 记录: 2026-01-20
⭐ 使用: 12 次

🔍 根因分析:
   数组变量在渲染时可能为 undefined，直接调用 map 方法导致错误。
   常见于异步数据加载未完成时的渲染。

💡 解决方案:

   方案 1: 可选链 (推荐)
   ```jsx
   {data?.map(item => <Item key={item.id} />)}
   ```

   方案 2: 默认值
   ```jsx
   {(data || []).map(item => <Item key={item.id} />)}
   ```

   方案 3: 条件渲染
   ```jsx
   {data && data.map(item => <Item key={item.id} />)}
   ```

🔗 相关错误:
   - TypeError: Cannot read property 'length' of undefined
   - TypeError: undefined is not iterable

═══════════════════════════════════════════════════════════════
```

### 5. 统计分析 (`/error stats`)

```text
📊 错误统计分析
═══════════════════════════════════════════════════════════════

📈 总览
   • 记录总数: 45
   • 本月新增: 8
   • 解决率: 100%

🏷️ 按类型分布
   • TypeError     ████████████░░░░ 35%
   • ReferenceError ██████░░░░░░░░░░ 15%
   • NetworkError  █████░░░░░░░░░░░ 12%
   • SyntaxError   ████░░░░░░░░░░░░ 10%
   • 其他          ███████████░░░░░ 28%

🔥 高频错误 TOP 5
   1. Cannot read property 'x' of undefined (12 次)
   2. ECONNREFUSED (8 次)
   3. Module not found (6 次)
   4. CORS policy blocked (5 次)
   5. Unexpected token (4 次)

💡 建议关注:
   undefined 相关错误占比较高，建议团队加强空值检查意识

═══════════════════════════════════════════════════════════════
```

---

## 错误记录格式

每个错误保存为 Markdown 文件：

```markdown
---
id: err_20260120_001
name: array-map-undefined
error: "TypeError: Cannot read property 'map' of undefined"
type: TypeError
language: javascript
framework: react
tags: [react, array, undefined, map]
created: 2026-01-20T10:30:00Z
usage_count: 12
---

# TypeError: Cannot read property 'map' of undefined

## 错误信息

完整错误消息...

## 环境

- 语言: JavaScript/TypeScript
- 框架: React 18
- 运行时: Node.js 20

## 根因分析

问题的根本原因分析...

## 解决方案

### 方案 1: 可选链 (推荐)

代码示例...

### 方案 2: 默认值

代码示例...

## 预防措施

如何避免再次发生...

## 相关错误

- 错误 1
- 错误 2
```

---

## 存储结构

```text
~/.oh-my-claude/errors/
├── index.json              # 错误索引
├── array-map-undefined.md  # 错误记录
├── postgres-connection.md
└── ...
```

---

## 与 /debug 集成

诊断错误时自动查询知识库：

```text
/debug error "TypeError: Cannot read property 'map' of undefined"

🩺 诊断中...

📚 知识库匹配:
   找到 1 条相关记录，相关度 95%

   💡 已知解决方案: 添加空值检查
   详情: /error show array-map-undefined
```

---

## 用户的请求

$ARGUMENTS

---

## 开始执行

根据用户请求执行相应操作...
