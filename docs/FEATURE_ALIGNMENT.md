# oh-my-claude 功能对齐文档

本文档记录 oh-my-claude 与 oh-my-opencode 的功能对齐情况。

## 功能对齐概述

| 功能类别 | oh-my-opencode | oh-my-claude | 状态 |
|---------|---------------|--------------|------|
| 多模型支持 | ✅ Claude/GPT/Gemini | ❌ 仅 Claude | 🔵 设计差异 |
| 专业化 Agent 系统 | 7 个 Agent | 18 个 Agent | ✅ 已超越 |
| 持续执行机制 | Sisyphus | 愚公移山 | ✅ 已实现 |
| Hook 系统 | 20+ Hook | 17 Hook | ✅ 已对齐 |
| LSP 工具集成 | 11+ 工具 | ✅ lsp-tools.sh | ✅ 已实现 |
| AST-Grep 支持 | 25+ 语言 | ✅ ast-grep.sh | ✅ 已实现 |
| MCP 服务器集成 | Context7/Grep.app | ✅ .mcp.json | ✅ 已配置 |
| 上下文智能压缩 | preemptive-compaction | ✅ 增强版 | ✅ 已增强 |
| 代码质量检查 | comment-checker | ✅ 综合版 | ✅ 已实现 |
| 输出管理 | grep-output-truncator | ✅ output-truncator | ✅ 已实现 |
| 目录特定代理 | directory-agents | ✅ 已实现 | ✅ 已实现 |
| 规则注入 | rules-injector | ✅ 已实现 | ✅ 已实现 |
| 思维模式 | think-mode | ✅ 已实现 | ✅ 已实现 |
| 自动更新检查 | auto-update | ✅ 已实现 | ✅ 已实现 |
| 进度可视化 | ❌ 无 | ✅ progress skill | ✅ 已超越 |
| 双语支持 | ❌ 无 | ✅ bilingual skill | ✅ 已超越 |

## 新增 Hook 详解

### 1. LSP 工具集成 (lsp-tools.sh)

**功能**: 提供 IDE 级别的代码分析能力

**支持的操作**:
- 类型信息获取 (Hover)
- 跳转到定义 (Go to Definition)
- 查找引用 (Find References)
- 文档符号 (Document Symbols)
- 诊断信息 (Diagnostics)
- 代码操作 (Code Actions)
- 调用层次 (Call Hierarchy)

**支持的语言**:
- TypeScript/JavaScript
- Python
- Rust
- Go
- Java
- C#
- C/C++
- Ruby
- PHP

**使用示例**:
```
获取 src/index.ts:10:5 的类型
跳转到 utils.py:25:10 的定义
查找 config.go:30:15 的引用
```

### 2. AST-Grep 代码搜索 (ast-grep.sh)

**功能**: 基于抽象语法树的结构化代码搜索

**支持的语言**: 25+ 种，包括主流编程语言

**元变量语法**:
- `$VAR` - 匹配单个标识符
- `$EXPR` - 匹配任意表达式
- `$$$` - 匹配零个或多个元素

**预定义模式**:

| 类别 | 模式 | 描述 |
|------|------|------|
| JS | js_console_log | 查找 console.log 调用 |
| JS | js_async_func | 查找 async 函数 |
| JS | js_react_hook | 查找 React Hook |
| Python | py_function | 查找函数定义 |
| Python | py_class | 查找类定义 |
| Rust | rs_unwrap | 查找 unwrap 调用 |
| Go | go_goroutine | 查找 goroutine |

**使用示例**:
```
AST 搜索 console.log($$$)
查找所有 js_react_hook
分析 src/ 目录的代码模式
```

### 3. 抢占式上下文压缩 (preemptive-compaction.sh)

**功能**: 在达到令牌限制之前主动压缩上下文

**配置参数**:
- `OH_MY_CLAUDE_COMPACTION_THRESHOLD=0.85` - 压缩触发阈值
- `OH_MY_CLAUDE_MAX_CONTEXT=128000` - 最大上下文令牌数

**压缩级别**:
- `low` - 轻度压缩，保留大部分内容
- `medium` - 中度压缩，移除代码块
- `high` - 重度压缩，仅保留关键信息
- `critical` - 紧急压缩，最小化内容

**使用命令**:
```
/context status   - 查看上下文使用状态
/context compact  - 手动触发压缩
/context restore  - 从历史恢复
```

### 4. 代码质量检查 (code-quality-checker.sh)

**功能**: 综合代码质量检查，包含注释和风格验证

**检查项目**:
- 注释完整性检查
- Thinking Block 验证
- 代码风格检查

**使用示例**:
```
检查 src/index.ts 的注释
验证 thinking block 格式
检查 utils.py 的代码风格
```

### 5. 输出截断器 (output-truncator.sh)

**功能**: 智能截断大型输出，防止令牌溢出

**配置参数**:
- `OH_MY_CLAUDE_MAX_OUTPUT_LINES=200`
- `OH_MY_CLAUDE_MAX_OUTPUT_CHARS=10000`
- `OH_MY_CLAUDE_AGGRESSIVE_TRUNCATION=false`

**支持的输出类型**:
- Grep/Ripgrep 搜索结果
- 文件内容
- JSON 输出
- 日志输出

### 6. 目录特定代理 (directory-agents-injector.sh)

**功能**: 根据当前目录自动推荐相关 Agent

**检测项目类型**:
- Node.js (package.json)
- Python (requirements.txt, pyproject.toml)
- Go (go.mod)
- Rust (Cargo.toml)
- Java (pom.xml, build.gradle)

**检测框架**:
- React/Next.js
- Vue/Nuxt
- Express/NestJS
- Django/FastAPI/Flask
- Spring Boot

**目录上下文**:
- src/source - 源代码
- test/tests - 测试代码
- docs - 文档
- api/routes - 后端
- components/views - 前端

### 7. 规则注入 (rules-injector.sh)

**功能**: 自动加载项目和全局规则

**规则位置**:
- 全局: `~/.oh-my-claude/rules/`
- 项目: `.claude/rules/`

**命令**:
```
/rules list    - 列出所有规则
/rules create  - 创建新规则
/rules delete  - 删除规则
```

### 8. 思维模式 (think-mode.sh)

**功能**: 启用深度思考和推理模式

**思维深度**:
- `shallow` - 快速分析
- `medium` - 中度分析（默认）
- `deep` - 深度分析

**命令**:
```
/think on [depth]  - 启用思维模式
/think off         - 关闭思维模式
/think status      - 查看状态
```

### 9. 自动更新检查 (auto-update-checker.sh)

**功能**: 自动检查 oh-my-claude 更新

**配置**:
- `OH_MY_CLAUDE_UPDATE_CHECK_INTERVAL=24` - 检查间隔（小时）
- `OH_MY_CLAUDE_AUTO_UPDATE=false` - 自动更新开关

**命令**:
```
/update check    - 检查更新
/update install  - 执行更新
/update history  - 查看历史
```

## MCP 服务器配置

已配置的 MCP 服务器 (`.mcp.json`):

| 服务器 | 功能 | 状态 |
|--------|------|------|
| context7 | 实时文档获取 | ✅ 启用 |
| grep-app | 跨仓库代码搜索 | ✅ 启用 |
| deepwiki | 深度文档获取 | ✅ 启用 |
| websearch | 网络搜索 | ✅ 启用 |
| exa | 语义搜索 | ⚙️ 需配置 |
| postgres | 数据库连接 | ⚙️ 需配置 |
| playwright | 浏览器自动化 | ⚙️ 需配置 |

## 与 oh-my-opencode 的差异

### 设计差异

1. **多模型支持**: oh-my-opencode 支持多模型编排，oh-my-claude 专注于 Claude 生态
2. **运行时**: oh-my-opencode 使用 Bun，oh-my-claude 使用原生 Bash + TypeScript
3. **Agent 数量**: oh-my-claude 拥有 18 个专业化 Agent，超过 oh-my-opencode 的 7 个

### 独有功能

oh-my-claude 独有:
- 18 个中国传统文化 Agent
- 进度可视化面板 (progress skill)
- 中英双语支持 (bilingual skill)
- 更丰富的 Agent 协作机制

## 版本历史

- **v1.0.20** - 功能对齐更新
  - 新增 LSP 工具集成
  - 新增 AST-Grep 代码搜索
  - 新增抢占式上下文压缩
  - 新增代码质量检查
  - 新增输出截断器
  - 新增目录特定代理
  - 新增规则注入系统
  - 新增思维模式
  - 新增自动更新检查
  - 添加 MCP 服务器配置
  - 更新 hooks.json 配置

## 后续计划

- [ ] 增强 LSP 集成，支持更多语言服务器
- [ ] 完善 AST-Grep 模式库
- [ ] 添加更多 MCP 服务器支持
- [ ] 优化 Hook 性能
- [ ] 添加配置 UI
