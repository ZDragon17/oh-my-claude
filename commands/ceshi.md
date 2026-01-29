# 自主 QA 循环命令 - 持续测试直到通过

> 🧪 神农尝百草，不惧试错

自动化测试循环，持续运行测试并修复失败，直到所有测试通过。

## 命令格式

```bash
# 基本用法：运行所有测试直到通过
/ceshi

# 指定目标
/ceshi 运行所有测试直到通过

# 英文命令
/ultraqa run all tests until pass

# 简写
/qa
```

## 测试模式

```bash
# 全量测试（默认）
/ceshi

# 增量测试（只测试改动相关）
/ceshi --incremental

# 指定测试范围
/ceshi --path=src/auth

# 指定测试类型
/ceshi --type=unit        # 单元测试
/ceshi --type=integration # 集成测试
/ceshi --type=e2e         # 端到端测试
```

## 高级选项

```bash
# 设置最大循环次数
/ceshi --max-cycles=5

# 设置单次超时 (秒)
/ceshi --timeout=300

# 快速失败模式
/ceshi --fail-fast

# 覆盖率阈值
/ceshi --coverage=80

# CI 模式（适用于持续集成）
/ceshi --ci
```

## 循环流程

1. **运行测试** - 执行测试套件，收集结果
2. **分析失败** - 分类失败原因，确定优先级
3. **自动修复** - 生成并应用修复方案
4. **重新测试** - 验证修复效果
5. **循环** - 直到全部通过或达到最大次数

## 与包拯的区别

| 特性 | 包拯 (`/baozheng`) | UltraQA (`/ceshi`) |
|------|-------------------|-------------------|
| 模式 | 单次测试 + 分析 | 持续循环直到通过 |
| 修复 | 提供建议 | 自动修复 |
| 适用 | 测试设计、策略 | 测试执行、验证 |

**选择建议**：
- 设计测试策略 → `/baozheng`
- 确保测试通过 → `/ceshi`

## 命令别名

- `/ceshi` - 测试（中文）
- `/ultraqa` - UltraQA（英文）
- `/qa` - 简写
- `/testloop` - 测试循环

---

加载 ultraqa 技能以获取详细指南。
