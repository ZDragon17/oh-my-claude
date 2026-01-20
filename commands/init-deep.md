---
name: init-deep
description: |
  深度项目初始化命令 - 全面分析项目结构，生成详细的工作计划。
  扫描技术栈、依赖关系、架构模式，创建上下文文档。
  别名：/deep-init, /analyze-project
---

# 🔍 深度项目初始化

你正在执行 **深度项目初始化**。这是一个全面的项目分析流程，用于建立完整的项目上下文。

## 分析流程

### 阶段 1: 项目结构扫描

**并行执行以下探索任务**:

```
# 探索 1: 目录结构
background_task(agent="explore", prompt="分析项目的顶层目录结构，识别：
- 源代码目录
- 测试目录
- 配置目录
- 文档目录
- 构建产物目录")

# 探索 2: 技术栈识别
background_task(agent="explore", prompt="识别项目的技术栈：
- 编程语言
- 框架（前端/后端）
- 数据库
- 构建工具
- 包管理器")

# 探索 3: 依赖分析
background_task(agent="explore", prompt="分析项目依赖：
- 核心依赖
- 开发依赖
- 可选依赖
- 依赖版本状况")
```

### 阶段 2: 架构分析

**检查关键文件**:

```
并行读取以下文件（如存在）:
- package.json / requirements.txt / Cargo.toml / go.mod
- tsconfig.json / .eslintrc / .prettierrc
- docker-compose.yml / Dockerfile
- .github/workflows/*.yml
- README.md / CONTRIBUTING.md
```

### 阶段 3: 代码模式识别

**分析代码模式**:

```
# 识别设计模式
background_task(agent="explore", prompt="识别项目中使用的设计模式：
- 架构模式（MVC, MVVM, Clean Architecture 等）
- 代码组织模式
- 状态管理模式
- API 设计模式")
```

### 阶段 4: 生成报告

**输出格式**:

```markdown
# 项目分析报告

## 基本信息
- 项目名称: xxx
- 主要语言: xxx
- 框架: xxx
- 包管理器: xxx

## 目录结构
```
project/
├── src/          # 源代码
├── tests/        # 测试
├── docs/         # 文档
└── ...
```

## 技术栈
| 类别 | 技术 | 版本 |
|------|------|------|
| 语言 | TypeScript | 5.x |
| 框架 | React | 18.x |
| ... | ... | ... |

## 依赖分析
### 核心依赖
- xxx: 用途
- yyy: 用途

### 开发依赖
- ...

## 架构模式
- 使用 xxx 架构
- 状态管理: xxx
- API 设计: xxx

## 代码质量指标
- Linter: xxx
- Formatter: xxx
- 测试覆盖: xxx%

## 建议事项
1. ...
2. ...
3. ...
```

## 选项

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `--create-new` | 创建新项目结构 | false |
| `--max-depth=N` | 最大扫描深度 | 3 |
| `--output=FILE` | 输出到文件 | stdout |

## 使用示例

```bash
/init-deep                      # 分析当前项目
/init-deep --max-depth=5        # 深度扫描
/init-deep --output=ANALYSIS.md # 输出到文件
```

## 用户的请求

$ARGUMENTS

---

## 开始分析

现在我将：

1. **扫描项目结构** - 识别目录和文件组织
2. **识别技术栈** - 确定语言、框架、工具
3. **分析依赖** - 理解项目依赖关系
4. **识别模式** - 发现架构和代码模式
5. **生成报告** - 输出结构化分析结果

**深度分析开始...**
