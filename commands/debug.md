---
name: debug
description: |
  交互式调试命令 - 智能诊断错误、分析堆栈、提供修复建议。
  支持：error (错误诊断)、trace (堆栈分析)、watch (变量监控建议)
aliases:
  - /调试
  - /排错
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - Task
  - TodoWrite
model: sonnet
---

<command-name>/debug</command-name>

# 交互式调试助手

智能诊断错误、分析堆栈、提供修复建议的调试助手。

## 使用方法

```bash
/debug                    # 诊断最近的错误
/debug error <message>    # 诊断指定错误信息
/debug trace              # 分析最近的堆栈跟踪
/debug file <path>        # 诊断指定文件的问题
/debug interactive        # 进入交互式调试模式
```

## 参数说明

用户输入: `$ARGUMENTS`

根据参数选择调试模式：

- 无参数: 诊断最近的错误（从终端输出或日志）
- `error <message>`: 诊断指定的错误信息
- `trace`: 分析堆栈跟踪
- `file <path>`: 诊断指定文件
- `interactive`: 进入持续调试会话

## 调试流程

### 步骤 1: 收集错误信息

```bash
# 检查最近的错误日志
tail -50 npm-debug.log 2>/dev/null
tail -50 yarn-error.log 2>/dev/null

# 检查测试输出
cat test-results.json 2>/dev/null | head -100
```

### 步骤 2: 分析错误类型

识别错误类别：

| 错误类型 | 特征 | 处理策略 |
|----------|------|----------|
| 语法错误 | SyntaxError, Unexpected token | 定位语法问题 |
| 类型错误 | TypeError, undefined is not | 类型检查 |
| 引用错误 | ReferenceError, not defined | 变量作用域 |
| 运行时错误 | Runtime, Memory | 逻辑分析 |
| 网络错误 | fetch, CORS, timeout | 网络诊断 |
| 数据库错误 | Connection, Query | 数据库诊断 |

### 步骤 3: 定位问题源

使用 Grep 和 Read 工具定位相关代码：

```bash
# 根据错误信息中的文件和行号
grep -n "相关代码" src/
```

### 步骤 4: 生成诊断报告

## 输出格式

### 错误诊断报告

```
🩺 调试诊断报告
═══════════════════════════════════════════════════════════════════

❌ 错误信息:
   TypeError: Cannot read properties of undefined (reading 'map')

📍 错误位置:
   文件: src/components/UserList.tsx
   行号: 45
   函数: UserList

═══════════════════════════════════════════════════════════════════

🔍 问题分析:

   尝试在 undefined 值上调用 .map() 方法。
   这通常发生在异步数据尚未加载时访问数据。

📝 相关代码:
   ```typescript
   // src/components/UserList.tsx:43-47
   const UserList = ({ users }) => {
     return (
       <ul>
         {users.map(user => <li>{user.name}</li>)}  // ← 错误行
       </ul>
     );
   };
   ```

🎯 根因分析:
   1. `users` prop 可能是 undefined
   2. 数据加载完成前组件已渲染
   3. 缺少空值检查

═══════════════════════════════════════════════════════════════════

💡 修复建议:

   方案 1: 添加可选链操作符 (推荐)
   ```typescript
   {users?.map(user => <li>{user.name}</li>)}
   ```

   方案 2: 添加默认值
   ```typescript
   const UserList = ({ users = [] }) => {
   ```

   方案 3: 添加条件渲染
   ```typescript
   {users && users.map(user => <li>{user.name}</li>)}
   ```

   方案 4: 添加加载状态
   ```typescript
   if (!users) return <Loading />;
   return <ul>{users.map(...)}</ul>;
   ```

═══════════════════════════════════════════════════════════════════

🔧 自动修复:

   是否应用方案 1 (可选链)?
   使用 /debug fix 1 应用修复

═══════════════════════════════════════════════════════════════════
```

### 堆栈分析报告

```
🩺 堆栈跟踪分析
═══════════════════════════════════════════════════════════════════

📚 调用栈:

   1. ❌ UserList (src/components/UserList.tsx:45)
      └─ users.map 失败

   2. ⬆️ renderWithHooks (react-dom.development.js:14985)
      └─ React 渲染钩子

   3. ⬆️ mountIndeterminateComponent (react-dom.development.js:17811)
      └─ 组件首次挂载

   4. ⬆️ beginWork (react-dom.development.js:19049)
      └─ React 工作循环

🎯 根因定位:
   问题发生在 UserList 组件首次渲染时，
   此时 users prop 尚未从 API 获取数据。

💡 修复方向:
   在组件中添加数据加载状态检查

═══════════════════════════════════════════════════════════════════
```

### 交互式调试模式

```
🩺 交互式调试模式
═══════════════════════════════════════════════════════════════════

进入调试会话。可用命令：

  error <message>  - 诊断错误信息
  trace           - 分析堆栈
  watch <var>     - 建议变量监控点
  breakpoint      - 建议断点位置
  fix <n>         - 应用第 n 个修复方案
  history         - 查看诊断历史
  exit            - 退出调试模式

当前监控:
  • src/components/UserList.tsx (有问题)
  • src/hooks/useUsers.ts (相关)

输入命令或粘贴错误信息：
> _

═══════════════════════════════════════════════════════════════════
```

## 常见错误模式

### JavaScript/TypeScript

| 错误 | 常见原因 | 快速修复 |
|------|----------|----------|
| Cannot read property of undefined | 空值访问 | 可选链 ?. |
| X is not a function | 类型错误 | 检查导入 |
| Module not found | 路径错误 | 检查路径 |
| Unexpected token | 语法错误 | 检查语法 |

### Python

| 错误 | 常见原因 | 快速修复 |
|------|----------|----------|
| AttributeError | 空值/类型 | 添加检查 |
| ImportError | 模块缺失 | pip install |
| KeyError | 字典键不存在 | .get() |
| IndentationError | 缩进问题 | 修复缩进 |

### 数据库

| 错误 | 常见原因 | 快速修复 |
|------|----------|----------|
| Connection refused | 服务未启动 | 启动数据库 |
| Duplicate key | 主键冲突 | 检查数据 |
| Query timeout | 慢查询 | 优化索引 |

## 与 Agent 集成

调试命令内部会调用 🩺 扁鹊 进行深度诊断：

```
/debug → 🩺 扁鹊 (debugger agent)
```

扁鹊会：
1. 分析错误上下文
2. 检索相似历史错误
3. 提供针对性修复建议

## 错误知识库

诊断结果可保存到知识库：

```bash
/debug
# ... 诊断完成后 ...
/error save "空值检查修复"
# 保存到 ~/.oh-my-claude/errors/
```

下次遇到相似错误会自动提示历史解决方案。

## 响应要求

1. **快速定位** - 精确到文件和行号
2. **清晰分析** - 解释错误原因
3. **多方案** - 提供多种修复选择
4. **可操作** - 给出具体代码修改
5. **学习积累** - 支持保存到知识库
