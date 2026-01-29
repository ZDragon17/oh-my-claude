# 流水线模式命令

> 🔗 顺序链执行，环环相扣

启动流水线模式，让多个 Agent 按顺序执行，前一步的输出作为后一步的输入。

## 命令格式

```bash
# 基本格式：用箭头连接 Agent
/liushuixian 悟空 → 诸葛 → 鲁班 <任务描述>

# 英文格式
/pipeline explore → architect → implement <task>

# 简写格式
/pipe wukong > zhuge > luban <task>
```

## 预设流水线

```bash
# Bug 修复流程：诊断 → 修复 → 测试
/liushuixian bugfix 修复登录超时问题

# 功能开发流程：需求 → 设计 → 实现 → 测试
/liushuixian feature 实现用户头像上传

# 重构流程：探索 → 规划 → 实现 → 审查
/liushuixian refactor 重构认证模块

# 安全修复流程：审计 → 诊断 → 修复
/liushuixian security 修复 SQL 注入漏洞

# 性能优化流程：分析 → 规划 → 优化
/liushuixian perf 优化首页加载速度
```

## 流水线控制

```bash
# 查看当前流水线状态
/liushuixian status

# 从某个阶段重新开始
/liushuixian resume stage:2

# 跳过当前阶段
/liushuixian skip

# 取消流水线
/liushuixian cancel
```

## 高级选项

```bash
# 节俭模式流水线（使用低成本模型）
/liushuixian --eco 悟空 → 诸葛 → 鲁班

# 持久模式流水线（失败自动重试）
/liushuixian --persistent 扁鹊 → 鲁班 → 包拯
```

## 命令别名

- `/liushuixian` - 流水线（中文）
- `/pipeline` - Pipeline（英文）
- `/chain` - 链式执行
- `/pipe` - 简写

---

加载 pipeline 技能以获取详细指南。
