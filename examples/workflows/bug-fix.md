# Bug 修复工作流

快速诊断和修复代码问题的标准流程。

## 适用场景

- 遇到报错信息
- 功能异常
- 系统崩溃
- 用户反馈的问题

## 快速修复流程

```
┌─────────────────────────────────────────────────────────────┐
│                      Bug 修复工作流                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🩺 诊断问题    /bianque [错误信息]                          │
│       ↓                                                     │
│  🔍 定位代码    /wukong 找相关代码                           │
│       ↓                                                     │
│  🔧 修复问题    /luban 或自动修复                            │
│       ↓                                                     │
│  ✅ 验证修复    /baozheng 运行测试                           │
│       ↓                                                     │
│  🛡️ 防止回归    /baozheng 添加回归测试                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 详细步骤

### 步骤 1：诊断问题

```bash
# 直接粘贴错误信息
/bianque TypeError: Cannot read property 'name' of undefined
  at UserService.getProfile (user.service.ts:42)
  at async ProfileController.show (profile.controller.ts:15)
```

扁鹊会：
- 分析错误类型
- 定位问题根因
- 提供修复建议

### 步骤 2：定位相关代码

```bash
# 如果需要更多上下文
/wukong 找到 UserService.getProfile 的实现
```

悟空会：
- 定位相关文件
- 展示代码上下文
- 追踪调用链

### 步骤 3：修复问题

扁鹊诊断后通常会直接修复。如果需要手动修复：

```bash
/luban 修复 user.service.ts 中的空值检查问题
```

### 步骤 4：验证修复

```bash
# 运行相关测试
/baozheng 运行 UserService 的测试

# 或手动验证
/baozheng 验证 getProfile 功能是否正常
```

### 步骤 5：防止回归

```bash
# 添加回归测试
/baozheng 为 getProfile 添加空值场景的测试用例
```

---

## 快捷方式

### 一键修复（推荐）

```bash
/bianque [错误信息]
```

扁鹊会自动完成诊断→定位→修复→验证的全流程。

### 快速诊断中心

```bash
/quickfix [问题描述]
```

获取快速诊断和恢复建议。

---

## 常见问题类型

### 1. 运行时错误

```bash
# TypeError, ReferenceError 等
/bianque TypeError: Cannot read property 'xxx' of undefined
```

### 2. 构建失败

```bash
# TypeScript 编译错误
/bianque 构建失败: TS2339: Property 'xxx' does not exist on type 'yyy'
```

### 3. 测试失败

```bash
# 测试用例不通过
/bianque 测试失败: Expected 'hello' but received 'undefined'
```

### 4. 性能问题

```bash
# 响应慢、超时等
/sunzi 分析 /api/users 接口为什么慢
```

### 5. 逻辑错误

```bash
# 功能不符合预期
/bianque 用户登录后没有跳转到首页，而是停留在登录页
```

---

## 紧急修复清单

当生产环境出问题时：

```bash
# 1. 快速诊断
/bianque [生产错误日志]

# 2. 评估影响
/zhuge 评估这个问题的影响范围

# 3. 最小化修复
/luban 修复问题（只改必要的代码）

# 4. 快速验证
/baozheng 运行关键测试

# 5. 如果需要回滚
/rollback
```

---

## 注意事项

1. **先诊断后修复**：不要盲目修改
2. **最小化改动**：只改必须改的
3. **务必验证**：修复后一定要测试
4. **添加测试**：防止同类问题再次发生
5. **记录问题**：便于后续回顾

---

## 示例：修复登录 500 错误

```bash
# 1. 诊断
/bianque 用户登录时返回 500 错误，日志：
Error: connect ECONNREFUSED 127.0.0.1:3306
  at TCPConnectWrap.afterConnect

# 2. 扁鹊分析后发现是数据库连接问题，但代码层面可以改进
# 添加错误处理

/luban 在登录逻辑中添加数据库连接失败的优雅处理

# 3. 验证
/baozheng 测试登录功能在数据库不可用时的行为

# 4. 添加回归测试
/baozheng 添加数据库连接失败场景的测试用例
```
