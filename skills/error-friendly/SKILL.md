---
name: error-friendly
description: |
  友好错误显示技能 - 分层展示错误信息，为不同水平用户提供合适的信息量。
  简洁版给普通用户，详细版给高级用户。
---

# 友好错误显示系统

当出现错误时，提供分层的错误信息显示，让所有用户都能理解并处理错误。

## 触发条件

1. 任何工具执行失败时
2. Agent 任务执行出错时
3. 用户请求查看错误详情时

## 错误分层原则

### 三层错误信息

| 层级 | 目标用户 | 内容 | 显示方式 |
|------|----------|------|----------|
| **简洁层** | 所有用户 | 错误摘要 + 快速修复 | 默认显示 |
| **标准层** | 一般开发者 | 错误位置 + 原因分析 | 按需展开 |
| **详细层** | 高级用户 | 完整堆栈 + 技术细节 | 明确请求 |

## 错误类型分类

### 1. 文件操作错误

**简洁层**：
```
❌ 文件编辑失败

💡 快速修复：
   /retry - 重试操作
   /rollback - 回滚更改
```

**标准层**（输入"详情"或"detail"展开）：
```
❌ 文件编辑失败

📍 位置: src/services/user.ts:42
🔍 原因: 要替换的文本在文件中未找到

可能的原因:
• 文件内容已被修改
• 文本中有特殊字符
• 行尾符不一致

💡 建议操作:
1. 使用 Read 工具重新读取文件
2. 确认要修改的内容
3. 重新执行编辑
```

**详细层**（输入"完整错误"或"full error"展开）：
```
❌ 文件编辑失败

═══════════════════════════════════════════════════════════
错误类型: EditToolError
时间: 2025-01-23 15:45:32
工具: Edit
═══════════════════════════════════════════════════════════

参数:
  filePath: src/services/user.ts
  oldString: "function getUser..."
  newString: "async function getUser..."

错误信息:
  oldString not found in content

调试信息:
  文件行数: 156
  搜索范围: 全文
  匹配结果: 0
  相似匹配: 第 38 行 (相似度 85%)

堆栈追踪:
  at EditTool.apply (edit.ts:42)
  at ToolRunner.execute (runner.ts:128)
  ...
═══════════════════════════════════════════════════════════
```

### 2. 命令执行错误

**简洁层**：
```
❌ 命令执行失败: npm test

💡 快速修复：
   /retry - 重试命令
   /bianque - 诊断问题
```

**标准层**：
```
❌ 命令执行失败: npm test

📍 退出码: 1
🔍 原因: 测试用例失败

失败的测试:
• user.test.ts > getUser > should return user by id
• user.test.ts > createUser > should validate email

💡 建议操作:
1. 查看失败的测试用例
2. 检查相关代码修改
3. 修复后重新运行测试
```

### 3. Agent 任务错误

**简洁层**：
```
❌ 任务执行失败

💡 快速修复：
   /retry - 重试任务
   /skip - 跳过此步骤
```

**标准层**：
```
❌ 任务执行失败

📍 任务: 实现用户注册功能
🔍 失败阶段: 代码实现
🎭 执行 Agent: @鲁班

失败原因:
• 依赖模块未找到: @utils/validator

💡 建议操作:
1. 检查依赖是否已安装
2. 确认导入路径正确
3. /retry 重试任务
```

### 4. 网络/API 错误

**简洁层**：
```
❌ 网络请求失败

💡 快速修复：
   /retry - 重试请求
   检查网络连接
```

**标准层**：
```
❌ 网络请求失败

📍 URL: https://api.example.com/users
🔍 状态码: 503 Service Unavailable

可能的原因:
• 服务器暂时不可用
• 网络连接问题
• 请求超时

💡 建议操作:
1. 等待几秒后重试
2. 检查网络连接
3. 确认服务状态
```

### 5. 权限错误

**简洁层**：
```
❌ 权限不足

💡 快速修复：
   检查文件权限
   以管理员身份运行
```

**标准层**：
```
❌ 权限不足

📍 操作: 写入文件
🔍 路径: /etc/hosts

原因:
• 当前用户没有该路径的写入权限

💡 建议操作:
1. 使用 sudo 执行命令
2. 修改文件权限
3. 选择其他位置
```

## 错误恢复建议

根据错误类型提供智能恢复建议：

### 恢复命令映射

| 错误类型 | 推荐命令 | 说明 |
|----------|----------|------|
| 文件编辑失败 | `/retry` | 重新读取文件后重试 |
| 测试失败 | `/bianque` | 诊断测试失败原因 |
| 构建失败 | `/bianque` | 诊断构建错误 |
| 权限错误 | 提示用户手动处理 | 需要用户操作 |
| 网络错误 | `/retry` (延迟) | 等待后重试 |
| 类型错误 | `/luban` | 修复类型问题 |
| 语法错误 | `/luban` | 修复语法问题 |

### 智能建议生成

```python
def generate_suggestions(error):
    suggestions = []
    
    # 基于错误类型
    if error.type == "EditToolError":
        suggestions.append("/retry - 重新读取文件后重试编辑")
        suggestions.append("/rollback - 如果需要撤销之前的更改")
    
    # 基于历史成功修复
    similar_fixes = find_similar_fixes(error)
    if similar_fixes:
        suggestions.append(f"历史上类似错误通过 {similar_fixes[0]} 解决")
    
    # 基于当前上下文
    if context.has_uncommitted_changes:
        suggestions.append("/git stash - 暂存当前更改")
    
    return suggestions
```

## 用户交互流程

### 1. 错误发生时

```
❌ [简洁错误信息]

💡 快速修复: [推荐操作]

📋 输入"详情"查看更多信息
```

### 2. 用户请求详情

```
# 用户输入
详情

# 或英文
detail
more info
what happened
```

### 3. 显示标准层

```
[标准错误信息]

📋 输入"完整错误"查看技术细节
```

### 4. 用户请求完整信息

```
# 用户输入
完整错误

# 或英文
full error
stack trace
debug info
```

## 配置选项

### 偏好设置

在 `/preferences` 中可配置：

```json
{
  "error_verbosity": "auto",  // auto, minimal, full
  "show_stack_trace": false,  // 是否默认显示堆栈
  "error_language": "auto"    // 错误信息语言
}
```

### auto 模式逻辑

```python
def determine_verbosity(user_preferences, error):
    if user_preferences.error_verbosity != "auto":
        return user_preferences.error_verbosity
    
    # 新用户显示更多帮助
    if user.is_new:
        return "standard"
    
    # 常见错误显示简洁版
    if error.is_common:
        return "minimal"
    
    # 复杂错误显示标准版
    return "standard"
```

## 与其他功能集成

### 与 /retry 集成

错误信息中的 `/retry` 会记住失败的操作，智能重试。

### 与 /error 知识库集成

```
💡 在知识库中找到相似错误的解决方案:
   /error show ERR-2024-001
```

### 与 /bianque 集成

复杂错误自动建议使用扁鹊诊断：

```
💡 这个错误可能需要深入诊断:
   /bianque [粘贴的错误信息]
```

## 响应语言

根据用户语言偏好自动切换：

- 中文环境显示中文错误信息
- 英文环境显示英文错误信息
- 技术术语保持原样（如 stack trace）
