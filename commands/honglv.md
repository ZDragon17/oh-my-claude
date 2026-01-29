---
name: honglv
description: |
  TDD 红绿重构 - 测试驱动开发模式
  先写测试，再写实现，Red → Green → Refactor
  别名：/tdd /test-first
trigger: always
---

# /honglv - TDD 测试驱动开发命令

## 概述

`/honglv` 启动测试驱动开发模式，强制执行「先写测试，再写实现」的开发流程。
红绿重构循环：Red（写失败测试）→ Green（写最少代码通过）→ Refactor（重构优化）。

## 使用方法

```bash
# 基本用法
/honglv <功能描述>

# 严格模式
/honglv --strict <功能>

# BDD 风格
/honglv --bdd <用户故事>

# 指定框架
/honglv --framework=jest <功能>
```

## 别名

- `/tdd` - 英文命令
- `/test-first` - 测试先行
- `/红绿` - 中文别名

## 示例

```bash
# 基本使用
/honglv 实现邮箱验证函数

# 严格 TDD
/tdd --strict 用户注册服务

# BDD 风格
/honglv --bdd 作为用户我想要登录系统

# 指定测试框架
/tdd --framework=vitest React 组件测试
```

## TDD 循环

```
  🔴 RED      →  编写失败的测试（定义预期行为）
      ↓
  🟢 GREEN    →  编写最少代码使测试通过
      ↓
  🔵 REFACTOR →  重构代码（保持测试通过）
      ↓
    循环 ↻    →  下一个测试用例
```

## 模式选项

| 选项 | 说明 |
|------|------|
| `--strict` | 严格模式，禁止跳过测试 |
| `--bdd` | BDD 风格（Given-When-Then） |
| `--framework=X` | 指定测试框架 |
| `--coverage` | 要求覆盖率达标 |

## 支持的框架

| 框架 | 语言 |
|------|------|
| `jest` | JavaScript/TypeScript |
| `vitest` | JavaScript/TypeScript |
| `pytest` | Python |
| `rspec` | Ruby |
| `junit` | Java |

## 与其他命令的区别

| 命令 | 时机 | 用途 |
|------|------|------|
| `/honglv` | 开发前/中 | 新功能 TDD |
| `/baozheng` | 开发后 | 补充测试 |
| `/ceshi` | 完成后 | 测试循环验证 |

## 提示

- 每次只写一个失败的测试
- 看到红灯后再写代码
- 只写足够通过测试的代码
- 重构时保持测试通过
- 测试用例要覆盖边界情况
