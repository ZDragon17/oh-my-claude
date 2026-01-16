# oh-my-claude API 文档

## 概述

oh-my-claude 是一个基于中国传统文化构建的 Claude Code 智能编排插件系统，提供 18 个专业化 AI Agent 和完整的插件生态。

## 架构概览

```
oh-my-claude/
├── agents/          # 18个专业化AI代理
├── commands/        # 21个斜杠命令
├── skills/          # 技能扩展
├── hooks/           # 自动化钩子
└── scripts/         # CLI工具和安装脚本
```

## Agent 系统

### 核心 Agent

| Agent | 角色 | 职责 | 命令 |
|-------|------|------|------|
| 愚公 (YuGong) | 主编排者 | 大规模任务分解执行 | `/yugong` `/yishan` |
| 诸葛 (ZhuGe) | 战略顾问 | 架构设计和规划 | `/zhuge` |
| 鲁班 (LuBan) | 精工巧匠 | 代码实现和优化 | `/luban` |
| 悟空 (WuKong) | 代码侦察 | 文件和代码探索 | `/wukong` |
| 扁鹊 (BianQue) | Bug 诊断 | 错误分析和修复 | `/bianque` |
| 墨子 (MoZi) | 安全审计 | 代码安全检查 | `/mozi` |
| 孙子 (SunZi) | 性能优化 | 系统调优 | `/sunzi` |
| 司马迁 (SimaQian) | 文档撰写 | 技术文档编写 | `/simaqian` |
| 郑和 (ZhengHe) | API 集成 | 外部服务对接 | `/zhenghe` |
| 张衡 (ZhangHeng) | 系统监控 | 可观测性 | `/zhangheng` |
| 李冰 (LiBing) | DevOps | 基础设施管理 | `/libing` |
| 老子 (LaoZi) | 代码简化 | Clean Code | `/laozi` |
| 包拯 (BaoZheng) | 测试专家 | 质量保证 | `/baozheng` |
| 魏征 (WeiZheng) | 代码审查 | 规范检查 | `/weizheng` |
| 仓颉 (CangJie) | 数据库设计 | 数据建模 | `/cangjie` |
| 李白 (LiBai) | 需求分析 | 用户故事提炼 | `/libai` |
| 顾恺之 (GuKaiZhi) | UI/UX 设计 | 界面美学 | `/gukaizhi` |
| 嫦娥 (ChangE) | 云服务 | DevOps 部署 | `/change` |

### Agent 调用协议

#### 内部协作

Agent 之间通过以下格式进行协作：

```markdown
@agent_name [任务描述]
```

示例：
```markdown
@zhuge 请评审这个架构设计
@sunzi 请评估安全风险
@bianque 诊断这个错误
```

#### 任务移交

当 Agent 完成任务时，使用以下格式移交控制权：

```markdown
---
【Agent名称】任务完成 ✅
交还控制权给 @caller_agent
---
```

### Agent 配置

每个 Agent 的配置存储在 `agents/[agent].md` 文件中，包含：

- Frontmatter 配置（name, description, allowed-tools, model）
- 详细的功能描述
- 使用场景和示例
- 协作协议

## 命令系统

### 斜杠命令

所有命令都支持中英文：

| 命令 | 功能 | 示例 |
|------|------|------|
| `/yugong` | 愚公移山模式 | `/yugong 重构整个用户模块` |
| `/zhuge` | 架构设计 | `/zhuge 设计微服务架构` |
| `/bianque` | Bug 诊断 | `/bianque 这个错误怎么修复` |
| `/team` | 多 Agent 协作 | `/team 开始团队任务` |
| `/progress` | 进度面板 | `/progress 显示当前进度` |

### 关键词触发

在对话中包含特定关键词会自动激活相应 Agent：

| 关键词 | 触发 Agent |
|--------|------------|
| `ultrawork` `yishan` `愚公` | 愚公 (YuGong) |
| `架构` `设计` `strategy` | 诸葛 (ZhuGe) |
| `debug` `bug` `错误` | 扁鹊 (BianQue) |
| `安全` `security` `audit` | 墨子 (MoZi) |
| `性能` `optimize` `slow` | 孙子 (SunZi) |
| `文档` `readme` `changelog` | 司马迁 (SimaQian) |

## Skill 系统

### 内置 Skills

| Skill | 功能 | 配置位置 |
|-------|------|----------|
| bilingual | 中英双语支持 | `skills/bilingual/` |
| progress | 可视化进度面板 | `skills/progress/` |

### Skill 开发

创建新的 Skill：

1. 在 `skills/` 下创建目录
2. 添加 Skill 配置文件
3. 实现 Skill 逻辑
4. 更新文档

## Hook 系统

### Hook 类型

| Hook | 触发时机 | 用途 |
|------|----------|------|
| `Stop` | Claude 停止时 | TODO 强制执行检查 |
| `UserPromptSubmit` | 用户提交提示时 | 关键词检测和模式激活 |

### Hook 配置

Hooks 在 `hooks/hooks.json` 中配置：

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "bash hooks/todo-enforcer.sh",
        "timeout": 5000,
        "continueOnError": true
      }
    ],
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "bash hooks/keyword-detector.sh",
        "timeout": 3000,
        "continueOnError": true
      }
    ]
  }
}
```

### 自定义 Hook

1. 在 `hooks/` 目录创建脚本
2. 在 `hooks.json` 中注册
3. 设置执行权限

## CLI API

### 安装和卸载

```bash
# 安装插件
npx claude-pangu install

# 卸载插件
npx claude-pangu uninstall

# 更新插件
npx claude-pangu update

# 热重载插件
npx claude-pangu reload

# 查看状态
npx claude-pangu status
```

### 编程接口

CLI 工具提供以下主要函数：

#### 插件管理

```javascript
const cli = require('./scripts/cli.js');

// 安装插件
cli.installPlugin();

// 卸载插件
cli.uninstallPlugin();

// 热重载
cli.hotReloadPlugin();

// 获取状态
cli.getPluginState();
```

#### 文件操作

```javascript
// 安全文件读取
const content = cli.safeReadFile('/path/to/file');

// 安全文件写入
cli.safeWriteFile('/path/to/file', 'content');

// 目录复制
cli.copyDir('/src', '/dest');
```

#### 并发控制

```javascript
// 获取锁
const lockAcquired = cli.acquireLock('/path/to/lock');

// 释放锁
cli.releaseLock('/path/to/lock');
```

## 状态管理

### 插件状态

插件状态保存在 `~/.oh-my-claude/state/plugin-state.json`：

```json
{
  "version": "1.0.9",
  "installed": true,
  "installTime": "2025-01-16T06:00:00.000Z",
  "lastUpdate": "2025-01-16T06:00:00.000Z",
  "agents": [
    {
      "name": "yugong",
      "file": "yugong.md",
      "checksum": "abc123..."
    }
  ],
  "commands": [...],
  "hooks": [...],
  "skills": [...]
}
```

### 状态检查

```javascript
const state = cli.getPluginState();

if (cli.checkPluginUpdateNeeded()) {
  console.log('插件需要更新');
  cli.hotReloadPlugin();
}
```

## 开发指南

### 添加新 Agent

1. 在 `agents/` 创建 `[agent].md` 文件
2. 遵循 Agent 配置格式
3. 添加相应的斜杠命令
4. 更新文档

### 添加新命令

1. 在 `commands/` 创建 `[command].md` 文件
2. 定义命令行为
3. 测试命令功能
4. 更新帮助文档

### 测试

运行测试套件：

```bash
npm test              # 运行所有测试
npm run test:coverage # 生成覆盖率报告
```

### 发布

更新版本并发布：

```bash
# 更新版本
npm version patch

# 发布到 npm
npm publish
```

## 故障排除

### 常见问题

1. **命令无法识别**
   - 确保插件已正确安装
   - 重启 Claude Code
   - 检查命令文件是否存在

2. **Hook 不工作**
   - 验证脚本权限
   - 检查 hooks.json 配置
   - 查看错误日志

3. **状态文件损坏**
   - 删除 `~/.oh-my-claude/state/`
   - 重新安装插件

### 日志位置

- 错误日志：`~/.oh-my-claude/logs/error.log`
- 插件状态：`~/.oh-my-claude/state/plugin-state.json`

## 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

### 代码规范

- 使用 ESLint 和 Prettier
- 编写测试用例
- 更新文档
- 遵循现有的代码风格

## 许可证

MIT License © 2025 oh-my-claude