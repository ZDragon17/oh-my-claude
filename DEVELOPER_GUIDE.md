# oh-my-claude 开发者指南

## 欢迎

欢迎来到 oh-my-claude 开发者社区！本指南将帮助你了解如何为这个基于中国传统文化的 Claude Code 插件系统贡献代码。

## 项目概述

oh-my-claude 是一个独特的 Claude Code 插件，将中国传统文化与现代 AI 技术融合，提供 18 个专业化 AI Agent，支持智能任务编排和自动化工作流。

## 开发环境设置

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn
- Git
- Claude Code (用于测试)

### 克隆和设置

```bash
# 克隆项目
git clone https://github.com/ZDragon17/oh-my-claude.git
cd oh-my-claude

# 安装依赖
npm install

# 运行测试
npm test

# 生成覆盖率报告
npm run test:coverage
```

### 项目结构

```
oh-my-claude/
├── agents/              # AI Agent 定义 (18个)
│   ├── yugong.md       # 愚公 - 主编排
│   ├── zhuge.md        # 诸葛 - 架构设计
│   └── ...             # 其他Agent
├── commands/            # 斜杠命令 (21个)
│   ├── yugong.md       # /yugong 命令
│   ├── yishan.md       # /yishan 别名
│   └── ...             # 其他命令
├── scripts/             # CLI 工具
│   ├── cli.js          # 主CLI脚本
│   ├── install.js      # 安装脚本
│   └── ...             # 其他工具
├── skills/              # 技能扩展
│   ├── bilingual/      # 中英双语支持
│   └── progress/       # 进度面板
├── hooks/               # 自动化钩子
│   ├── hooks.json      # 钩子配置
│   ├── keyword-detector.sh # 关键词检测
│   └── todo-enforcer.sh # TODO强制执行
├── tests/               # 测试套件
│   ├── agents.test.js  # Agent测试
│   ├── commands.test.js # 命令测试
│   └── ...             # 其他测试
├── docs/                # 文档
├── .claude-plugin/      # Claude插件配置
├── package.json         # 项目配置
└── README.md           # 项目文档
```

## Agent 开发

### Agent 文件结构

每个 Agent 都是一个 Markdown 文件，包含：

1. **Frontmatter 配置**
2. **功能描述**
3. **使用场景**
4. **协作协议**
5. **示例**

#### Frontmatter 格式

```yaml
---
name: agent_name
description: |
  Agent 的简要描述（可多行）
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebSearch
model: sonnet  # 或 opus
---
```

#### 完整 Agent 示例

```markdown
---
name: custom_agent
description: |
  这是一个自定义 Agent 示例
  支持多行描述
allowed-tools:
  - Read
  - Write
  - Edit
model: sonnet
---

# 自定义 Agent

## 核心精神

[Agent 的文化背景和理念]

## 职责范围

### 1. 主要功能

[功能描述]

### 2. 使用场景

[适用场景]

## 服务流程

[工作流程图]

## 输出格式

[标准输出格式]

## 🤝 与其他 Agent 的协作

### 被调用时

```markdown
---
【自定义Agent】接受任务
---

[处理内容]

---
【自定义Agent】任务完成 ✅
交还控制权给 @caller_agent
---
```

### 调用其他 Agent

```markdown
@zhuge 请评审这个设计
@bianque 诊断这个问题
```
```

### 创建新 Agent 的步骤

1. **确定 Agent 角色**
   - 选择中国历史人物
   - 定义专业领域
   - 明确职责范围

2. **编写 Agent 文件**
   ```bash
   # 在 agents/ 目录创建文件
   touch agents/new_agent.md
   ```

3. **添加斜杠命令**
   ```bash
   # 在 commands/ 目录创建命令文件
   cp commands/template.md commands/new_agent.md
   # 编辑命令内容
   ```

4. **编写测试**
   ```javascript
   // 在 tests/ 中添加测试
   // 验证 Agent 文件存在
   // 验证命令文件存在
   // 验证功能正常
   ```

5. **更新文档**
   - 更新 README.md
   - 更新 API_DOCUMENTATION.md
   - 添加使用示例

## 命令开发

### 命令文件格式

斜杠命令是简单的 Markdown 文件：

```markdown
---
description: 命令的简要描述
---

# 命令标题

命令的详细说明和使用方法。

## 使用方法

```bash
/command_name [参数]
```

## 示例

```bash
/command_name 示例参数
```

## 相关 Agent

- @agent_name: 相关 Agent 说明
```

### 命令命名规范

- 使用 Agent 名称作为命令名
- 支持中英文别名
- 保持命令简短易记

## Skill 开发

### Skill 结构

Skills 是可扩展的功能模块：

```
skills/
└── custom_skill/
    ├── config.json      # Skill 配置
    ├── index.js         # 主逻辑
    ├── README.md        # 文档
    └── test/           # 测试
```

### Skill 配置

```json
{
  "name": "custom_skill",
  "version": "1.0.0",
  "description": "Skill 描述",
  "author": "开发者",
  "hooks": {
    "UserPromptSubmit": "skill-entry.js"
  }
}
```

## Hook 开发

### Hook 类型

- **Stop**: Claude 停止时触发
- **UserPromptSubmit**: 用户提交提示时触发

### 创建 Hook 脚本

```bash
#!/bin/bash

# Hook 脚本示例
# 读取输入参数
input=$(cat)

# 处理逻辑
if [[ $input == *"keyword"* ]]; then
    echo "检测到关键词"
    exit 0
fi

exit 1
```

### Hook 配置

在 `hooks/hooks.json` 中注册：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "bash hooks/custom-hook.sh",
        "timeout": 5000,
        "continueOnError": true
      }
    ]
  }
}
```

## 测试开发

### 测试结构

我们使用 Jest 进行测试：

```javascript
describe('组件名', () => {
  test('测试场景', () => {
    // Arrange
    const input = 'test input';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### 测试类型

1. **单元测试**: 测试单个函数
2. **集成测试**: 测试组件间交互
3. **端到端测试**: 测试完整工作流

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- tests/agent.test.js

# 生成覆盖率
npm run test:coverage

# 监听模式
npm run test:watch
```

### 测试覆盖率目标

- **语句覆盖率**: > 70%
- **分支覆盖率**: > 65%
- **函数覆盖率**: > 75%
- **行覆盖率**: > 70%

## 代码规范

### JavaScript 规范

```javascript
// 好的示例
function processData(data) {
  if (!data) {
    return null;
  }

  const processed = data.map(item => ({
    id: item.id,
    name: item.name.toUpperCase()
  }));

  return processed.filter(item => item.name.length > 0);
}

// 不好的示例
function process(data){if(!data)return null;var processed=data.map(function(item){return{id:item.id,name:item.name.toUpperCase()}});return processed.filter(function(item){return item.name.length>0});}
```

### Markdown 规范

- 使用标题层级递增
- 代码块指定语言
- 链接使用相对路径
- 图片添加 alt 文本

### Git 提交规范

```bash
# 提交格式
type(scope): description

# 类型
feat: 新功能
fix: 修复
docs: 文档
style: 格式
refactor: 重构
test: 测试
chore: 杂项

# 示例
feat(agent): 添加新的诸葛 Agent
fix(cli): 修复安装脚本权限问题
docs(api): 更新 API 文档
```

## 发布流程

### 版本管理

我们使用语义化版本：

- **MAJOR**: 不兼容的 API 更改
- **MINOR**: 向后兼容的新功能
- **PATCH**: 向后兼容的修复

### 发布步骤

1. **准备发布**
   ```bash
   # 更新版本
   npm version patch  # 或 minor/major

   # 运行测试
   npm run test:coverage

   # 更新文档
   # 更新 CHANGELOG.md
   ```

2. **创建发布**
   ```bash
   # 推送标签
   git push --tags

   # 发布到 npm
   npm publish
   ```

3. **验证发布**
   ```bash
   # 检查 npm
   npm view claude-pangu

   # 测试安装
   npx claude-pangu@latest install
   ```

## 故障排除

### 开发环境问题

1. **测试失败**
   ```bash
   # 清除 node_modules
   rm -rf node_modules
   npm install

   # 运行特定测试
   npm test -- --testNamePattern="specific test"
   ```

2. **权限问题**
   ```bash
   # 修复脚本权限
   chmod +x scripts/*.js
   chmod +x hooks/*.sh
   ```

3. **路径问题**
   ```bash
   # 检查当前工作目录
   pwd

   # 验证文件路径
   ls -la agents/
   ```

### 常见错误

1. **Module not found**
   - 检查 package.json dependencies
   - 运行 `npm install`

2. **Command not found**
   - 确保脚本有执行权限
   - 检查 PATH 环境变量

3. **Test timeout**
   - 增加测试超时时间
   - 检查异步操作

## 社区贡献

### 贡献流程

1. **选择任务**
   - 查看 Issues
   - 选择适合的开发任务

2. **创建分支**
   ```bash
   git checkout -b feature/new-agent
   ```

3. **开发和测试**
   ```bash
   # 编写代码
   # 添加测试
   npm test
   ```

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新 Agent"
   git push origin feature/new-agent
   ```

5. **创建 PR**
   - 填写 PR 模板
   - 等待审查

### 行为准则

- 尊重所有贡献者
- 保持专业和建设性
- 遵循项目规范
- 测试你的更改

## 资源

### 学习资源

- [Claude Code 文档](https://docs.anthropic.com/claude/docs/claude-code)
- [Node.js 最佳实践](https://nodejs.org/en/docs/guides/)
- [Jest 测试框架](https://jestjs.io/docs/getting-started)

### 相关项目

- [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) - 灵感来源
- [Claude CLI](https://github.com/anthropics/claude-code) - 官方 CLI

## 联系我们

- **Issues**: [GitHub Issues](https://github.com/ZDragon17/oh-my-claude/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ZDragon17/oh-my-claude/discussions)
- **Discord**: [加入社区](https://discord.gg/oh-my-claude)

---

**感谢你的贡献！让我们一起构建更好的 AI 开发体验。** 🚀