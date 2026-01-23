---
name: learn
description: |
  项目学习技能 - 自动分析项目结构、代码模式，生成项目画像。
  让 Agent 深入理解项目背景，无需重复解释。
---

# 项目学习技能 (Project Learning)

自动分析项目，生成持久化的项目画像，让所有 Agent 了解项目背景。

## 核心理念

> 了解项目，才能更好地服务项目。
> 一次学习，持续受益。

## 分析维度

### 📁 项目结构

识别项目的目录组织方式:

| 模式 | 特征 | 示例 |
|------|------|------|
| 标准前端 | src/components, src/pages | React, Vue |
| MVC | controllers, models, views | Express, Django |
| Clean Architecture | domain, application, infrastructure | NestJS |
| 单体 | 所有代码在一个目录 | 小项目 |
| Monorepo | packages/, apps/ | Turborepo, Nx |

### 🔍 技术栈识别

从配置文件识别使用的技术:

```
package.json → 框架、工具库、开发依赖
requirements.txt → Python 包
go.mod → Go 模块
Cargo.toml → Rust crates
```

### 📖 文档阅读

阅读项目文档获取背景:

- README.md
- CONTRIBUTING.md
- docs/
- .env.example (了解配置项)

### 🧩 代码模式分析

识别代码风格和约定:

| 分析项 | 检测方式 |
|--------|----------|
| 命名规范 | 文件名、函数名分析 |
| 组件风格 | 类组件 vs 函数组件 |
| 状态管理 | Redux, Zustand, Pinia |
| API 风格 | REST, GraphQL, tRPC |
| 测试风格 | Jest, Vitest, Pytest |

## 项目画像格式

```markdown
# 项目画像

## 基本信息
- 名称: xxx
- 类型: xxx
- 语言: xxx
- 框架: xxx

## 技术栈
### 前端
- xxx

### 后端
- xxx

### 测试
- xxx

## 项目结构
```
src/
├── ...
```

## 代码规范
- xxx

## 关键模块
### 模块1
描述...

## 最近活动
- xxx

## Agent 建议
- 实现: xxx
- 架构: xxx
- 测试: xxx
```

## 自动加载机制

### 加载时机

1. **新会话启动** - 检测并加载 project-profile.md
2. **Agent 调用** - 自动注入项目背景
3. **/yishan 执行** - 愚公参考项目架构

### 加载效果

Agent 响应会包含项目背景:

```
🔧 鲁班 (已加载项目画像)

根据项目使用 React + TypeScript + Zustand 的技术栈，
我将使用以下方式实现：
- 函数式组件 + Hooks
- Zustand store 管理状态
- TypeScript 严格类型
```

## 更新策略

| 场景 | 行为 |
|------|------|
| 画像不存在 | 提示运行 /learn |
| 画像超过 7 天 | 建议 /learn refresh |
| 关键文件变更 | 提示画像可能过时 |
| 手动刷新 | /learn refresh |

## 与其他功能集成

### 与 /init 集成

```
/init react-typescript  → 创建基础配置
/learn                  → 分析并完善画像
```

`/learn` 会读取 `/init` 创建的配置，并补充分析结果。

### 与 /yishan 集成

愚公在规划任务时参考项目画像:

```
🏔️ 愚公

根据项目画像，这是一个 Next.js 项目，我将：
1. 组件放在 src/components/
2. API 路由放在 src/app/api/
3. 使用 Prisma 操作数据库
```

### 与所有 Agent 集成

每个 Agent 都能访问项目画像:

- 🔍 悟空: 知道在哪里找代码
- 🎯 诸葛: 了解现有架构
- 🔧 鲁班: 遵循项目规范
- 🛡️ 墨子: 了解安全上下文
- ⚔️ 孙子: 了解性能关键点

## 使用示例

### 首次学习

```bash
/learn
```

分析项目，生成画像。

### 查看画像

```bash
/learn show
```

显示当前项目画像内容。

### 更新画像

```bash
/learn refresh
```

重新分析项目，更新画像。

## 手动编辑

项目画像存储在 `.oh-my-claude/project-profile.md`，可以手动编辑：

1. 添加自定义说明
2. 补充业务背景
3. 调整 Agent 建议

手动编辑的内容在 `/learn refresh` 时会被保留（特定部分）。

## 最佳实践

1. **新项目先学习** - 加入项目后先运行 `/learn`
2. **定期刷新** - 大更新后运行 `/learn refresh`
3. **提交画像** - 将 project-profile.md 提交到版本控制
4. **团队共享** - 团队成员可共用项目画像

## 隐私说明

- 画像存储在本地项目目录
- 不会上传到任何服务器
- 可添加到 .gitignore（如不想提交）
