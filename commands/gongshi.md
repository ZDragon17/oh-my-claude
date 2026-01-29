# 迭代规划共识命令 - 三方协作规划

> 🎯 三顾茅庐，隆中对策

通过 Planner（规划者）+ Architect（架构师）+ Critic（审查者）三方迭代，达成高质量规划共识。

## 命令格式

```bash
# 基本用法：三方协作规划
/gongshi 设计用户认证系统

# 英文命令
/ralplan design user authentication system

# 简写
/plan+ 实现微服务架构
```

## 规划模式

```bash
# 完整三方规划（默认）
/gongshi 实现新功能

# 快速规划（省略审查）
/gongshi --quick 小型功能

# 深度规划（多轮迭代）
/gongshi --deep 复杂系统设计

# 技术导向
/gongshi --tech-focus API 重构
```

## 高级选项

```bash
# 设置最大迭代次数
/gongshi --max-rounds=5

# 指定输出格式
/gongshi --format=prd      # PRD 文档
/gongshi --format=tasks    # 任务列表
/gongshi --format=roadmap  # 路线图

# 包含工作量估算
/gongshi --estimate

# 保存规划结果
/gongshi --save=plan.md
```

## 三方角色

| 角色 | Agent | 职责 |
|------|-------|------|
| 🎯 Planner | 诸葛 | 制定规划、目标分解 |
| 🏗️ Architect | 诸葛/鲁班 | 技术评估、方案设计 |
| 🔍 Critic | 刘伯温 | 风险识别、改进建议 |

## 与诸葛规划的区别

| 特性 | 诸葛 (`/zhuge`) | RalPlan (`/gongshi`) |
|------|----------------|---------------------|
| 深度 | 快速规划 | 深度迭代 |
| 角色 | 单一规划者 | 三方协作 |
| 适用 | 中小任务 | 复杂系统 |

## 命令别名

- `/gongshi` - 共识（中文）
- `/ralplan` - RalPlan（英文）
- `/plan+` - 增强规划
- `/consensus` - 共识

---

加载 ralplan 技能以获取详细指南。
