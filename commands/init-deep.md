---
name: init-deep
description: |
  深度项目初始化命令 - 生成层级化 AGENTS.md 知识库。
  根目录 + 复杂度评分子目录，全面分析项目结构。
  别名：/deep-init, /analyze-project
---

# /init-deep

生成层级化 AGENTS.md 文件。根目录 + 复杂度评分子目录。

## 用法

```
/init-deep                      # 更新模式：修改现有 + 在需要处创建新的
/init-deep --create-new         # 读取现有 → 删除全部 → 从头重新生成
/init-deep --max-depth=2        # 限制目录深度（默认：3）
```

---

## 工作流（高层视图）

1. **发现 + 分析**（并行） — 启动后台探索 Agent + bash 结构分析 + 读取现有 AGENTS.md
2. **评分 & 决策** — 从合并结果确定 AGENTS.md 位置
3. **生成** — 先根目录，然后子目录并行
4. **审查** — 去重、裁剪、验证

**必须使用 TodoWrite 跟踪所有阶段，实时标记 in_progress → completed。**

```
TodoWrite([
  { id: "discovery", content: "启动探索 Agent + 结构分析 + 读取现有", status: "pending", priority: "high" },
  { id: "scoring", content: "评分目录，确定 AGENTS.md 位置", status: "pending", priority: "high" },
  { id: "generate", content: "生成 AGENTS.md 文件（根目录 + 子目录）", status: "pending", priority: "high" },
  { id: "review", content: "去重、验证、裁剪", status: "pending", priority: "medium" }
])
```

---

## 阶段 1: 发现 + 分析（并行）

**将 "discovery" 标记为 in_progress。**

### 立即启动后台探索 Agent

不要等待 — 这些异步运行，同时主会话继续工作。

```
task(subagent_type="explore", load_skills=[], description="项目结构探索", run_in_background=true, prompt="项目结构：预测检测到的语言的标准模式 → 仅报告偏差")
task(subagent_type="explore", load_skills=[], description="入口点查找", run_in_background=true, prompt="入口点：查找 main 文件 → 报告非标准组织")
task(subagent_type="explore", load_skills=[], description="约定查找", run_in_background=true, prompt="约定：查找配置文件 → 报告项目特定规则")
task(subagent_type="explore", load_skills=[], description="反模式查找", run_in_background=true, prompt="反模式：查找 'DO NOT', 'NEVER', 'ALWAYS', 'DEPRECATED' 注释 → 列出禁止的模式")
task(subagent_type="explore", load_skills=[], description="构建/CI 探索", run_in_background=true, prompt="构建/CI：查找 workflows, Makefile → 报告非标准模式")
task(subagent_type="explore", load_skills=[], description="测试模式探索", run_in_background=true, prompt="测试模式：查找测试配置、测试结构 → 报告独特约定")
```

### 动态 Agent 生成

bash 分析后，根据项目规模生成额外探索 Agent：

| 因素 | 阈值 | 额外 Agent |
|------|------|-----------|
| 文件总数 | >100 | 每 100 文件 +1 |
| 代码行数 | >10k | 每 10k 行 +1 |
| 目录深度 | ≥4 | +2 深度探索 |
| 大文件(>500行) | >10 | +1 复杂度热点 |
| Monorepo | 检测到 | 每个包/工作区 +1 |

### 主会话：并行分析

**后台 Agent 运行时**，主会话执行：

1. **Bash 结构分析** — 目录深度、文件计数、代码集中度、现有 AGENTS.md
2. **读取现有 AGENTS.md** — 提取关键信息、约定、反模式
3. **LSP 代码地图**（如可用）— 入口点、符号密度、引用中心度

收集所有后台 Agent 结果后，合并 bash + LSP + 现有 + 探索发现。**将 "discovery" 标记为 completed。**

---

## 阶段 2: 评分 & 位置决策

**将 "scoring" 标记为 in_progress。**

### 评分矩阵

| 因素 | 权重 | 高阈值 | 来源 |
|------|------|--------|------|
| 文件数 | 3x | >20 | bash |
| 子目录数 | 2x | >5 | bash |
| 代码比例 | 2x | >70% | bash |
| 独特模式 | 1x | 有自己的配置 | explore |
| 模块边界 | 2x | 有 index.ts/__init__.py | bash |
| 符号密度 | 2x | >30 符号 | LSP |
| 引用中心度 | 3x | >20 引用 | LSP |

### 决策规则

| 评分 | 操作 |
|------|------|
| **根目录 (.)** | 始终创建 |
| **>15** | 创建 AGENTS.md |
| **8-15** | 如果是不同领域则创建 |
| **<8** | 跳过（父目录覆盖） |

**将 "scoring" 标记为 completed。**

---

## 阶段 3: 生成 AGENTS.md

**将 "generate" 标记为 in_progress。**

**文件写入规则**: 如果 AGENTS.md 已存在 → 使用 Edit 工具。如果不存在 → 使用 Write 工具。

### 根 AGENTS.md 模板

```markdown
# PROJECT KNOWLEDGE BASE

**Generated:** {TIMESTAMP}
**Commit:** {SHORT_SHA}

## OVERVIEW
{1-2 句话: 做什么 + 核心技术栈}

## STRUCTURE
{目录树，仅标注非显而易见的用途}

## WHERE TO LOOK
| 任务 | 位置 | 备注 |
|------|------|------|

## CONVENTIONS
{仅标准之外的偏差}

## ANTI-PATTERNS (THIS PROJECT)
{此项目中明确禁止的}

## COMMANDS
{dev/test/build 命令}

## NOTES
{陷阱和注意事项}
```

质量关卡：50-150 行，无泛化建议，无显而易见的信息。

### 子目录 AGENTS.md（并行）

为每个位置启动写入任务，30-80 行，绝不重复父目录内容。

**将 "generate" 标记为 completed。**

---

## 阶段 4: 审查 & 去重

**将 "review" 标记为 in_progress。**

对每个生成的文件：
- 删除泛化建议
- 删除父目录重复内容
- 裁剪到尺寸限制
- 验证电报风格

**将 "review" 标记为 completed。**

---

## 最终报告

```
=== init-deep 完成 ===

模式: {update | create-new}

文件:
  [OK] ./AGENTS.md (root, {N} 行)
  [OK] ./src/hooks/AGENTS.md ({N} 行)

分析目录: {N}
创建 AGENTS.md: {N}
更新 AGENTS.md: {N}
```

---

## 反模式

- **固定 Agent 数量**: 必须根据项目规模/深度调整
- **串行执行**: 必须并行（explore + LSP 并发）
- **忽略现有**: 始终先读取现有，即使 --create-new
- **过度文档化**: 不是每个目录都需要 AGENTS.md
- **冗余**: 子目录绝不重复父目录
- **泛化内容**: 删除适用于所有项目的内容

## 用户的请求

$ARGUMENTS
