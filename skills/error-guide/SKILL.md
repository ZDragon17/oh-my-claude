---
name: error-guide
description: |
  错误智能引导技能 - 当 Agent 执行失败时，提供清晰的下一步建议。
  避免用户在错误发生时不知所措。
---

# 错误智能引导系统

当 Agent 执行遇到问题时，自动提供诊断建议和恢复路径。

## 核心原则

**用户永远不应该在错误面前感到无助。**

每次错误发生时必须提供：

1. 错误的简明描述
2. 可能的原因
3. 具体的下一步操作

## 错误分类与引导

### 1. Agent 执行失败

当 Task 调用的子 Agent 返回错误时：

```text
⚠️ Agent 执行遇到问题

🔍 问题: [Agent名称] 执行失败
📝 原因: [简要错误信息]

💡 建议操作:
   [1] /bianque - 调用扁鹊诊断问题
   [2] /retry  - 重试当前操作
   [3] /skip   - 跳过此步骤继续

🔧 快速修复:
   如果是权限问题 → 检查文件权限
   如果是依赖问题 → npm install / pip install
   如果是语法错误 → 查看具体报错行号
```

### 2. 重复失败检测

当同一操作失败超过 2 次时：

```text
🔴 重复失败检测 [第3次]

同一操作已失败 3 次，建议换一种方式。

📊 失败历史:
   1. 尝试直接修复 → 语法错误
   2. 尝试重构 → 类型不匹配
   3. 尝试简化 → 仍然失败

💡 升级建议:
   • /bianque - 让扁鹊进行深度诊断
   • /zhuge - 让诸葛重新评估方案
   • 或描述具体问题，我来分析

⚠️ 继续重试可能无效，建议换策略
```

### 3. 构建/测试失败

当 npm build、npm test 等命令失败时：

```text
❌ 构建失败

📋 错误摘要:
   • 文件: src/services/user.ts:42
   • 错误: Property 'name' does not exist on type 'User'
   • 类型: TypeScript 类型错误

💡 快速修复建议:
   1. 检查 User 接口定义是否包含 name 字段
   2. 确认导入的类型是否正确
   3. 运行 /bianque 获取详细诊断

🔧 相关命令:
   /bianque [错误信息] - 诊断此错误
   /wukong 找到 User 接口定义 - 定位相关代码
```

### 4. 超时/无响应

当操作超过预期时间无响应时：

```text
⏰ 操作超时 [已等待 60 秒]

当前操作似乎卡住了。

💡 可能原因:
   • 网络请求超时
   • 死循环或无限递归
   • 资源锁定

🔧 建议操作:
   [1] 按 Ctrl+C 中断当前操作
   [2] /status - 查看当前状态
   [3] /cancel-yishan - 取消愚公移山任务

如需保留进度: /pause 安全暂停
```

### 5. 文件操作失败

当读写文件出现问题时：

```text
❌ 文件操作失败

📁 文件: /path/to/file.ts
🔍 问题: Permission denied / File not found / ...

💡 常见解决方案:

如果是权限问题:
   chmod 644 /path/to/file.ts  # Unix
   或以管理员身份运行

如果是文件不存在:
   /wukong 找到类似文件 [文件名关键词]

如果是路径错误:
   检查路径是否正确，注意大小写
```

## 自动诊断触发

以下情况自动建议调用扁鹊诊断：

| 触发条件 | 建议 |
|---------|------|
| 同一错误出现 2+ 次 | 建议 `/bianque` 深度诊断 |
| 错误信息包含 "undefined" | 建议检查变量初始化 |
| 错误信息包含 "null" | 建议检查空值处理 |
| 测试失败 3+ 个 | 建议 `/bianque` 批量诊断 |
| 类型错误 | 建议检查类型定义 |

## 错误恢复快捷命令

| 命令 | 功能 |
|------|------|
| `/retry` | 重试上一个失败的操作 |
| `/skip` | 跳过当前失败的步骤 |
| `/rollback` | 回滚到上一个成功状态 |
| `/diagnose` | 等同于 `/bianque` |

## 错误日志

所有错误会记录到 `~/.oh-my-claude/logs/errors.log`，格式：

```json
{
  "timestamp": "2025-01-21T10:30:00Z",
  "agent": "luban",
  "operation": "edit_file",
  "error": "Permission denied",
  "context": "尝试修改 src/index.ts",
  "suggested_action": "/bianque"
}
```

用户可以通过 `/logs` 查看最近的错误记录。

## 与愚公移山的集成

在 yishan 模式下，错误引导会自动嵌入：

```text
📊 ████████░░░░░░░░░░░░░░░░░░░░░░ 25% (2/8) 💪
🔄 当前: 实现用户登录
⚠️ 上一步遇到问题，已自动重试

如需帮助: /bianque 或 /status
```

## 用户反馈循环

当错误引导帮助用户解决问题后：

```text
✅ 问题已解决！

📝 本次诊断记录:
   问题: TypeScript 类型错误
   解决: 添加了缺失的类型定义
   耗时: 2 分钟

💡 预防建议:
   • 启用 strict 模式提前发现类型问题
   • 添加类型测试确保接口稳定
```

---

## 人性化错误信息翻译

将技术性错误信息翻译为用户友好的描述：

### 常见错误翻译表

| 技术性错误 | 用户友好描述 |
|-----------|--------------|
| `ENOENT: no such file or directory` | 📁 找不到文件，请检查路径是否正确 |
| `EACCES: permission denied` | 🔒 没有权限访问此文件，尝试以管理员身份运行 |
| `EADDRINUSE: address already in use` | 🔌 端口已被占用，换一个端口或关闭占用的程序 |
| `TypeError: Cannot read property 'x' of undefined` | ⚠️ 变量未定义就被使用了，需要检查数据来源 |
| `SyntaxError: Unexpected token` | ✏️ 代码有语法错误，检查括号、引号等是否匹配 |
| `ReferenceError: x is not defined` | 📛 使用了未声明的变量，检查拼写或是否忘记导入 |
| `RangeError: Maximum call stack size exceeded` | 🔄 代码陷入了无限循环，检查递归或循环条件 |
| `ETIMEDOUT` | ⏰ 网络请求超时，检查网络连接或增加超时时间 |
| `ECONNREFUSED` | 🚫 无法连接到服务器，确认服务是否启动 |

### 输出格式

当检测到这些错误时，自动翻译并提供建议：

```text
❌ 发生错误

📋 问题: 找不到文件 '/src/config.ts'
   (原始: ENOENT: no such file or directory)

💡 可能原因:
   1. 文件路径拼写错误
   2. 文件已被删除或移动
   3. 相对路径基于错误的目录

🔧 推荐操作:
   /wukong 找 config.ts
   或检查目录结构: ls -la src/
```

---

## 错误严重程度分级

### 🔴 严重 (需立即处理)
- 构建失败
- 测试全部失败
- 核心功能报错

### 🟠 警告 (建议处理)
- 部分测试失败
- Lint 错误
- 类型警告

### 🟡 提示 (可选处理)
- TODO 注释
- 未使用的变量
- 文档缺失

### 视觉展示

```text
🔴 严重 (1)
   └─ 构建失败: TypeScript 编译错误

🟠 警告 (3)
   ├─ 测试失败: 2 个用例
   └─ Lint: 1 个错误

🟡 提示 (5)
   ├─ TODO: 3 处
   └─ 未使用变量: 2 个

💡 建议先处理严重问题: /bianque 诊断构建错误
```
