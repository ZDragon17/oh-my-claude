# TDD 测试驱动开发技能 v1.0

> 灵感来源：鲁班造锯 - 先有需求，后有工具
> 核心理念：Red → Green → Refactor，测试先行

## 概述

TDD（测试驱动开发）是一种**测试先行的开发方法论**技能，
强制执行「先写测试，再写实现」的开发流程，确保代码质量和可维护性。

与普通开发的区别：
- **普通开发**：写代码 → 写测试（或不写）
- **TDD**：写测试 → 看失败 → 写代码 → 测试通过 → 重构

## TDD 循环

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD 红绿重构循环                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         ┌────────────────────────────────────┐              │
│         │           🔴 RED                    │              │
│         │     编写失败的测试                  │              │
│         │   (定义预期行为)                    │              │
│         └──────────────┬─────────────────────┘              │
│                        │                                    │
│                        ↓                                    │
│         ┌────────────────────────────────────┐              │
│         │           🟢 GREEN                  │              │
│         │     编写最少代码通过测试            │              │
│         │   (只求通过，不求完美)              │              │
│         └──────────────┬─────────────────────┘              │
│                        │                                    │
│                        ↓                                    │
│         ┌────────────────────────────────────┐              │
│         │           🔵 REFACTOR               │              │
│         │     重构代码改善质量                │              │
│         │   (保持测试通过)                    │              │
│         └──────────────┬─────────────────────┘              │
│                        │                                    │
│                        ↓                                    │
│                   下一个测试                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 使用方式

### 命令格式

```bash
# 中文命令
/tdd 实现用户登录功能

# 英文命令
/tdd implement user login feature

# 简写
/honglv 密码验证功能
```

### TDD 模式

```bash
# 标准 TDD
/tdd 实现购物车功能

# 严格模式（禁止跳过测试）
/tdd --strict 支付模块

# BDD 风格
/tdd --bdd 用户注册流程

# 指定测试框架
/tdd --framework=jest 组件测试
```

## TDD 原则

### 三大法则

1. **不可编写任何产品代码，除非是为了使一个失败的单元测试通过**
2. **不可编写多于一个的单元测试，一个测试失败即停止**
3. **不可编写多于能让一个失败测试通过的产品代码**

### FIRST 原则

| 原则 | 说明 |
|------|------|
| **F**ast | 测试要快速执行 |
| **I**ndependent | 测试相互独立 |
| **R**epeatable | 可重复运行 |
| **S**elf-validating | 自动验证结果 |
| **T**imely | 及时编写 |

## 工作流程

### 阶段一：Red（红灯）

```typescript
// 1. 先写测试，定义预期行为
describe('UserService', () => {
  it('should validate email format', () => {
    const service = new UserService();
    
    expect(service.isValidEmail('test@example.com')).toBe(true);
    expect(service.isValidEmail('invalid-email')).toBe(false);
  });
});

// 运行测试：应该失败 ❌
// Error: UserService is not defined
```

### 阶段二：Green（绿灯）

```typescript
// 2. 写最少代码使测试通过
class UserService {
  isValidEmail(email: string): boolean {
    return email.includes('@');  // 最简实现
  }
}

// 运行测试：应该通过 ✅
```

### 阶段三：Refactor（重构）

```typescript
// 3. 重构改善代码质量
class UserService {
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  isValidEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }
}

// 运行测试：仍然通过 ✅
```

## 测试类型指南

### 单元测试

```typescript
// 测试单个函数/方法
describe('calculateTotal', () => {
  it('should sum all item prices', () => {
    const items = [
      { price: 10 },
      { price: 20 },
      { price: 30 }
    ];
    expect(calculateTotal(items)).toBe(60);
  });
  
  it('should return 0 for empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

### 集成测试

```typescript
// 测试组件交互
describe('OrderService', () => {
  it('should create order and update inventory', async () => {
    const orderService = new OrderService(inventoryService, paymentService);
    
    await orderService.createOrder({
      items: [{ productId: '1', quantity: 2 }],
      userId: 'user-1'
    });
    
    expect(inventoryService.getStock('1')).toBe(8);  // 从 10 减到 8
  });
});
```

### E2E 测试

```typescript
// 测试完整用户流程
describe('Checkout Flow', () => {
  it('should complete purchase', async () => {
    await page.goto('/products');
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="checkout"]');
    await page.fill('[name="card"]', '4242424242424242');
    await page.click('[type="submit"]');
    
    await expect(page).toHaveURL('/order/confirmation');
  });
});
```

## 测试金字塔

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲         少量（慢、贵）
                 ╱──────╲
                ╱        ╲
               ╱ 集成测试 ╲      适量
              ╱────────────╲
             ╱              ╲
            ╱   单元测试     ╲   大量（快、便宜）
           ╱──────────────────╲
```

## TDD 模板

### 功能测试模板

```typescript
describe('[功能名称]', () => {
  // 设置
  beforeEach(() => {
    // 初始化测试环境
  });
  
  // 清理
  afterEach(() => {
    // 清理测试数据
  });
  
  describe('正常场景', () => {
    it('should [预期行为] when [条件]', () => {
      // Arrange（准备）
      const input = /* 测试数据 */;
      
      // Act（执行）
      const result = /* 调用被测函数 */;
      
      // Assert（断言）
      expect(result).toBe(/* 预期结果 */);
    });
  });
  
  describe('边界场景', () => {
    it('should handle empty input', () => { /* ... */ });
    it('should handle null/undefined', () => { /* ... */ });
    it('should handle maximum values', () => { /* ... */ });
  });
  
  describe('错误场景', () => {
    it('should throw error when [错误条件]', () => {
      expect(() => /* 调用 */).toThrow(/* 错误类型 */);
    });
  });
});
```

### BDD 模板

```typescript
describe('用户登录', () => {
  describe('Given 用户在登录页面', () => {
    describe('When 输入有效的邮箱和密码', () => {
      it('Then 应该成功登录并跳转到首页', async () => {
        // 实现
      });
    });
    
    describe('When 输入无效的密码', () => {
      it('Then 应该显示错误消息', async () => {
        // 实现
      });
    });
  });
});
```

## TDD 检查清单

### 开始前

- [ ] 理解需求和预期行为
- [ ] 确定测试边界和场景
- [ ] 选择合适的测试框架

### 开发中

- [ ] 每次只写一个失败的测试
- [ ] 看到测试失败再写代码
- [ ] 只写足够通过测试的代码
- [ ] 测试通过后再重构
- [ ] 重构后测试仍然通过

### 完成后

- [ ] 所有测试通过
- [ ] 覆盖率达标（建议 80%+）
- [ ] 测试可读性良好
- [ ] 没有重复代码

## 常见测试框架

| 框架 | 语言 | 特点 |
|------|------|------|
| Jest | JavaScript/TypeScript | 零配置、快照测试 |
| Vitest | JavaScript/TypeScript | Vite 原生支持、快速 |
| pytest | Python | 简洁、强大的断言 |
| JUnit | Java | 行业标准 |
| RSpec | Ruby | BDD 风格 |
| Go test | Go | 内置支持 |

## 触发关键词

| 关键词 | 说明 |
|--------|------|
| `tdd` `测试驱动` | 主要触发 |
| `红绿重构` `honglv` | 中文别名 |
| `test first` | 英文触发 |
| `先写测试` | 自然语言 |
| `红灯绿灯` | 自然语言 |

## 命令别名

| 命令 | 说明 |
|------|------|
| `/tdd` | TDD 模式（主命令） |
| `/honglv` | 红绿重构（中文） |
| `/test-first` | 测试先行 |

## 使用示例

```bash
# 实现功能
/tdd 实现用户密码重置功能

# 严格 TDD
/tdd --strict 购物车结算模块

# BDD 风格
/tdd --bdd 用户注册流程

# 指定框架
/tdd --framework=vitest 组件单元测试
```

## 与包拯测试的区别

| 特性 | TDD 技能 | 包拯测试 Agent |
|------|----------|---------------|
| 重点 | 开发方法论 | 测试编写和执行 |
| 时机 | 编码前/中 | 编码后 |
| 输出 | 测试+代码 | 测试用例 |
| 适用 | 新功能开发 | 现有代码测试 |

**选择建议**：
- 新功能开发 → `/tdd`
- 现有代码补测试 → `/baozheng`
