---
name: fabu
description: |
  自动化发布 - 标准化版本发布流程
  蔡伦造纸模式：自动化、标准化、可追溯
  别名：/release /rel /publish
trigger: always
---

# /fabu - 自动化发布命令

## 概述

`/fabu` 启动自动化版本发布流程，包含预检查、版本更新、变更日志生成、
Git 标签创建和发布操作，确保每次发布都是标准化和可追溯的。

## 使用方法

```bash
# 基本用法
/fabu <version-type>

# 版本类型
/fabu patch    # 1.0.0 → 1.0.1 (Bug 修复)
/fabu minor    # 1.0.0 → 1.1.0 (新功能)
/fabu major    # 1.0.0 → 2.0.0 (破坏性更改)

# 预览模式
/fabu --dry-run minor

# 预发布
/fabu prerelease --tag=beta
```

## 别名

- `/release` - 英文命令
- `/rel` - 简写
- `/publish` - 发布

## 示例

```bash
# 发布补丁版本（Bug 修复）
/fabu patch

# 发布次版本（新功能）
/release minor

# 预览发布流程
/fabu --dry-run major

# 预发布 beta 版本
/release prerelease --tag=beta

# 指定具体版本号
/fabu --version=2.3.0
```

## 发布流程

```
1. 预检查 → 工作区干净、测试通过、在正确分支
2. 版本更新 → 更新 package.json 等版本文件
3. 变更日志 → 从 commits 生成 CHANGELOG
4. Git 操作 → 提交、创建 tag、推送
5. 发布 → npm publish / GitHub Release
```

## 选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览模式，不实际执行 |
| `--tag=X` | 预发布标签 (alpha/beta/rc) |
| `--version=X` | 指定具体版本号 |
| `--no-push` | 不推送到远程 |
| `--no-changelog` | 跳过变更日志更新 |

## 版本类型

| 类型 | 场景 | 示例 |
|------|------|------|
| `patch` | Bug 修复 | 1.0.0 → 1.0.1 |
| `minor` | 新功能 | 1.0.0 → 1.1.0 |
| `major` | 破坏性更改 | 1.0.0 → 2.0.0 |
| `prerelease` | 预发布 | 1.0.0 → 1.1.0-beta.1 |

## 预检查项目

- [ ] 工作区干净（无未提交更改）
- [ ] 在正确分支（main/master）
- [ ] 测试全部通过
- [ ] 构建成功
- [ ] Lint 检查通过

## 提示

- 发布前确保所有 PR 已合并
- 重要更新建议先发 beta 版本
- 破坏性更改需要更新文档
- 使用 `--dry-run` 先预览流程
