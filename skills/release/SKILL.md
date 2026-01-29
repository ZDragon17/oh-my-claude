# Release 自动化发布技能 v1.0

> 灵感来源：蔡伦造纸 - 标准化生产，批量分发
> 核心理念：自动化、标准化、可追溯

## 概述

Release（自动化发布）是一种**版本发布自动化**技能，
帮助你标准化版本发布流程，确保每次发布都是可重复、可追溯的。

与手动发布的区别：
- **手动发布**：容易遗漏步骤，不一致
- **Release**：标准化流程 + 自动检查 + 变更记录

## 发布流程

```
┌─────────────────────────────────────────────────────────────┐
│                  Release 自动化发布流程                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 1: 预检查                                        ║ │
│  ║  - 工作区干净？                                         ║ │
│  ║  - 在正确分支？                                         ║ │
│  ║  - 测试通过？                                          ║ │
│  ║  - 依赖更新？                                          ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│      ↓                                                      │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 2: 版本更新                                      ║ │
│  ║  - 确定版本号 (major/minor/patch)                      ║ │
│  ║  - 更新 package.json / version 文件                    ║ │
│  ║  - 同步所有版本引用                                     ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│      ↓                                                      │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 3: 变更日志                                      ║ │
│  ║  - 从 commit 历史生成                                   ║ │
│  ║  - 分类：Added, Changed, Fixed, Removed                ║ │
│  ║  - 更新 CHANGELOG.md                                   ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│      ↓                                                      │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 4: 提交与标签                                    ║ │
│  ║  - 创建 release commit                                 ║ │
│  ║  - 创建 git tag                                        ║ │
│  ║  - 推送到远程                                          ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│      ↓                                                      │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  Step 5: 发布                                          ║ │
│  ║  - npm publish (Node.js)                               ║ │
│  ║  - GitHub Release 创建                                 ║ │
│  ║  - 通知相关人员                                         ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 使用方式

### 命令格式

```bash
# 中文命令
/fabu patch    # 补丁版本
/fabu minor    # 次版本
/fabu major    # 主版本

# 英文命令
/release patch
/release minor
/release major

# 预览模式（不实际执行）
/release --dry-run minor
```

### 版本类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `patch` | Bug 修复 | 1.0.0 → 1.0.1 |
| `minor` | 新功能（向后兼容） | 1.0.0 → 1.1.0 |
| `major` | 破坏性更改 | 1.0.0 → 2.0.0 |
| `prerelease` | 预发布版本 | 1.0.0 → 1.1.0-beta.1 |

## 发布检查清单

### 自动检查

```yaml
pre_release_checks:
  - name: 工作区检查
    command: git status --porcelain
    expect: empty
    
  - name: 分支检查
    command: git branch --show-current
    expect: main|master
    
  - name: 测试检查
    command: npm test
    expect: exit_code_0
    
  - name: 构建检查
    command: npm run build
    expect: exit_code_0
    
  - name: Lint 检查
    command: npm run lint
    expect: exit_code_0
```

### 手动确认

```markdown
## 发布前确认

- [ ] 所有 PR 已合并
- [ ] 版本号确认正确
- [ ] CHANGELOG 内容准确
- [ ] 文档已更新
- [ ] 破坏性更改已记录
```

## CHANGELOG 格式

### Keep a Changelog 格式

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.2.2] - 2025-01-29

### Added
- 新增 Research 研究编排技能
- 新增 TDD 测试驱动开发技能
- 新增 Release 自动化发布技能

### Changed
- 优化 Agent 分层体系

### Fixed
- 修复关键词检测误触发问题

### Removed
- 移除过时的命令别名

## [2.2.1] - 2025-01-28
...
```

### Conventional Commits 映射

| Commit 类型 | CHANGELOG 分类 |
|-------------|----------------|
| `feat:` | Added |
| `fix:` | Fixed |
| `refactor:` | Changed |
| `docs:` | Changed |
| `perf:` | Changed |
| `BREAKING CHANGE:` | Breaking Changes |

## 发布模板

### npm 发布

```bash
# 1. 版本更新
npm version patch  # 或 minor/major

# 2. 推送
git push && git push --tags

# 3. 发布
npm publish
```

### GitHub Release

```markdown
# v2.2.2

## Highlights

- 🔬 新增 Research 研究编排技能
- 🧪 新增 TDD 测试驱动开发技能
- 📦 新增 Release 自动化发布技能

## What's Changed

### New Features
- Research: 多科学家并行研究编排
- TDD: 红绿重构开发方法论
- Release: 标准化版本发布流程

### Bug Fixes
- 修复关键词检测误触发
- 修复 Agent 分层选择问题

## Full Changelog
https://github.com/xxx/compare/v2.2.1...v2.2.2
```

## 配置选项

```yaml
# .release.yml
release:
  # 版本文件
  version_files:
    - package.json
    - .claude-plugin/plugin.json
    
  # 分支
  branch: main
  
  # 标签前缀
  tag_prefix: v
  
  # 变更日志
  changelog:
    file: CHANGELOG.md
    format: keepachangelog
    
  # 发布目标
  targets:
    - npm
    - github
    
  # 预检查
  pre_checks:
    - npm test
    - npm run build
    - npm run lint
    
  # 发布后
  post_release:
    - npm run notify
```

## 触发关键词

| 关键词 | 说明 |
|--------|------|
| `发布` `fabu` | 中文触发 |
| `release` `rel` | 英文触发 |
| `版本` | 自然语言 |
| `publish` | 发布触发 |
| `上线` | 自然语言 |

## 命令别名

| 命令 | 说明 |
|------|------|
| `/fabu` | 发布（中文） |
| `/release` | Release（英文） |
| `/rel` | 简写 |
| `/publish` | 发布 |

## 使用示例

```bash
# 发布补丁版本
/fabu patch

# 发布次版本
/release minor

# 预览模式
/release --dry-run major

# 预发布版本
/release prerelease --tag=beta

# 指定版本号
/release --version=2.3.0
```

## 与 CI/CD 集成

### GitHub Actions

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 手动触发

```bash
# 本地发布（需要 npm 权限）
/release minor --publish

# 只创建标签，让 CI 发布
/release minor --tag-only
```
