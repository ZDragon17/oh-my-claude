---
name: git-master
description: |
  Git Master 智能 Git 操作技能 - 提供安全、规范的 Git 操作指引。
  支持 Conventional Commits、Co-authored-by、智能提交消息生成。
  对标 oh-my-opencode 的 git-master skill，包含三大专业化角色。
triggers:
  keywords: [commit, rebase, squash, blame, git, 提交, 合并, 历史]
  commands: [/git, /git-master, /commit, /pr, /branch]
---

# Git Master 技能

智能 Git 操作技能，提供安全、规范的版本控制操作指引。

## 三大专业化角色

Git Master 包含三个专业化角色，根据任务自动切换：

### 1. Commit Architect (提交架构师)

负责创建原子化、高质量的提交。

**核心原则 - 默认多提交**:

```
┌─────────────────────────────────────────┐
│  文件数量规则 (MANDATORY)                │
├─────────────────────────────────────────┤
│  3+ 文件 → 必须 2+ 个提交               │
│  5+ 文件 → 必须 3+ 个提交               │
│  10+ 文件 → 必须 5+ 个提交              │
└─────────────────────────────────────────┘
```

**原子提交原则**:
- 每个提交只做一件事
- 提交之间有清晰的依赖关系
- 后续提交依赖前序提交

### 2. Rebase Surgeon (变基外科医生)

负责历史重写、冲突解决、分支清理。

**专长**:
- 交互式 rebase 操作
- 冲突解决策略
- 分支合并整理
- Squash 和 fixup 操作

### 3. History Archaeologist (历史考古学家)

负责查找特定变更的时间和作者。

**专长**:
- `git blame` 追溯
- `git bisect` 二分查找
- `git log -S` 代码搜索
- 历史变更分析

---

## 自动风格检测

Git Master 会自动分析仓库的提交风格并匹配：

### 检测方法

```bash
# 分析最近 30 个提交
git log --oneline -30
```

### 检测维度

| 维度 | 选项 | 示例 |
|------|------|------|
| **语言** | 英文 / 中文 / 混合 | `feat: add login` vs `feat: 添加登录` |
| **风格** | Conventional / Plain / Short | `feat(auth): add OAuth` vs `Add OAuth login` |
| **大小写** | lowercase / Capitalize / UPPERCASE | `add feature` vs `Add feature` |
| **长度** | 详细 / 简洁 | 50+ chars vs <30 chars |

### 风格报告

```markdown
## 仓库提交风格分析

**检测样本**: 最近 30 个提交

| 维度 | 检测结果 | 置信度 |
|------|----------|--------|
| 语言 | 英文 | 95% |
| 格式 | Conventional Commits | 87% |
| 大小写 | lowercase | 92% |
| 平均长度 | 45 字符 | - |

**将采用风格**: `<type>(<scope>): <lowercase description>`
```

## 安全协议（不可违反）

### 永远不要:

| 禁止操作 | 原因 |
|----------|------|
| 更新 git config | 可能影响全局设置 |
| 运行破坏性/不可逆命令 | 除非用户明确请求 |
| 跳过 hooks | `--no-verify`, `--no-gpg-sign` 等 |
| 强制推送到 main/master | 如果用户请求，发出警告 |
| 未经请求就提交 | 用户必须明确要求 |

### 危险命令白名单（需用户明确请求）:

```bash
git push --force        # 强制推送
git push -f             # 强制推送
git reset --hard        # 硬重置
git clean -fd           # 删除未跟踪文件
git checkout -- .       # 丢弃所有更改
```

### Git Commit --amend 规则

**仅在以下所有条件都满足时才能使用 --amend**:

1. 用户明确请求 amend，**或者** commit 成功但 pre-commit hook 自动修改了需要包含的文件
2. HEAD commit 是由你在本次对话中创建的（验证：`git log -1 --format='%an %ae'`）
3. Commit 还没有推送到远程（验证：`git status` 显示 "Your branch is ahead"）

**关键**: 
- 如果 commit **失败**或被 hook **拒绝**，**永远不要** amend - 修复问题并创建**新** commit
- 如果你已经推送到远程，**永远不要** amend（除非用户明确请求，因为需要 force push）

---

## 提交工作流

### 步骤 1: 了解状态

并行运行以下命令：

```bash
# 查看所有未跟踪文件
git status

# 查看将要提交的暂存和非暂存更改
git diff

# 查看最近的提交消息（学习仓库风格）
git log --oneline -10
```

### 步骤 2: 分析更改

分析所有暂存的更改（之前暂存的和新添加的），起草提交消息：

1. **总结更改性质**：新功能、增强、bug 修复、重构、测试、文档等
2. **确保消息准确反映更改和目的**：
   - `add` = 全新功能
   - `update` = 现有功能增强
   - `fix` = bug 修复
   - `refactor` = 代码重组
3. **不要提交可能包含敏感信息的文件**（`.env`, `credentials.json` 等）
4. **起草简洁的提交消息**（1-2 句），聚焦"为什么"而非"做什么"

### 步骤 3: 执行提交

```bash
# 添加相关的未跟踪文件到暂存区
git add <files>

# 创建提交
git commit -m "<type>: <description>"

# 验证成功
git status
```

### 步骤 4: 处理失败

如果提交因 pre-commit hook 失败：
1. 修复问题
2. 创建**新**提交（不要 amend）

---

## Conventional Commits 格式

### 基本格式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 类型

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): add OAuth2 login` |
| `fix` | Bug 修复 | `fix(api): handle null response` |
| `docs` | 文档更新 | `docs(readme): update installation` |
| `style` | 代码格式 | `style: format with prettier` |
| `refactor` | 重构 | `refactor(utils): simplify parser` |
| `perf` | 性能优化 | `perf(query): add database index` |
| `test` | 测试相关 | `test(auth): add login tests` |
| `build` | 构建系统 | `build: upgrade webpack to v5` |
| `ci` | CI 配置 | `ci: add GitHub Actions` |
| `chore` | 杂项 | `chore: update dependencies` |
| `revert` | 回退 | `revert: revert commit abc123` |

### 示例

**简单提交**:
```
feat(user): add email verification

Implement email verification flow with token generation
and expiration handling.
```

**带 Breaking Change**:
```
feat(api)!: change response format

BREAKING CHANGE: Response now wraps data in { data, meta } structure.
Migration guide available in docs/migration.md
```

---

## 原子提交工作流 (Commit Architect)

### 多文件提交分解

当有多个文件需要提交时，**必须**按以下规则分解：

```
┌─────────────────────────────────────────────────────────────┐
│  原子提交分解流程                                             │
├─────────────────────────────────────────────────────────────┤
│  1. 识别更改的逻辑分组                                        │
│     - 同一功能的相关文件                                      │
│     - 基础设施变更 vs 业务逻辑变更                            │
│     - 依赖变更 vs 代码变更                                    │
│                                                             │
│  2. 确定依赖顺序                                              │
│     - 被依赖的代码先提交                                      │
│     - 配置/类型先于实现                                       │
│     - 工具/辅助函数先于业务代码                                │
│                                                             │
│  3. 每组独立提交                                              │
│     - 每个提交可独立编译通过                                   │
│     - 每个提交有清晰的目的                                    │
└─────────────────────────────────────────────────────────────┘
```

### 示例：10 个文件的原子提交

假设修改了以下 10 个文件：

```
修改的文件:
├── package.json              # 新增依赖
├── tsconfig.json             # 配置更新
├── src/types/user.ts         # 类型定义
├── src/utils/validation.ts   # 工具函数
├── src/services/auth.ts      # 认证服务
├── src/services/user.ts      # 用户服务
├── src/controllers/auth.ts   # 认证控制器
├── src/routes/auth.ts        # 认证路由
├── tests/auth.test.ts        # 测试
└── README.md                 # 文档
```

**正确的提交分解** (5 个提交):

```bash
# Commit 1: 基础设施
git add package.json tsconfig.json
git commit -m "chore: add zod validation library"

# Commit 2: 类型和工具
git add src/types/user.ts src/utils/validation.ts
git commit -m "feat(types): add user types and validation utils"

# Commit 3: 服务层
git add src/services/auth.ts src/services/user.ts
git commit -m "feat(services): implement auth and user services"

# Commit 4: API 层
git add src/controllers/auth.ts src/routes/auth.ts
git commit -m "feat(api): add auth controller and routes"

# Commit 5: 测试和文档
git add tests/auth.test.ts README.md
git commit -m "test(auth): add auth service tests and docs"
```

### 提交依赖图

```
Commit 1 (chore: add zod)
    ↓
Commit 2 (types & utils) ─────────────┐
    ↓                                 │
Commit 3 (services) ←─ 依赖 types     │
    ↓                                 │
Commit 4 (api) ←─ 依赖 services       │
    ↓                                 │
Commit 5 (tests) ←─ 依赖所有上述 ─────┘
```

---

## 历史考古工具 (History Archaeologist)

### 查找代码作者

```bash
# 查看文件每一行的最后修改者
git blame <file>

# 查看特定行范围
git blame -L 10,20 <file>

# 忽略空白字符变更
git blame -w <file>

# 显示邮箱
git blame -e <file>
```

### 查找特定代码的引入时间

```bash
# 搜索添加/删除特定字符串的提交
git log -S "functionName" --oneline

# 搜索正则表达式
git log -G "pattern.*regex" --oneline

# 显示差异
git log -S "functionName" -p
```

### 二分查找 Bug 引入点

```bash
# 开始二分
git bisect start

# 标记当前为坏
git bisect bad

# 标记已知好的版本
git bisect good <commit>

# Git 会自动切换到中间版本，测试后标记：
git bisect good  # 或
git bisect bad

# 找到后重置
git bisect reset
```

### 历史分析报告

```markdown
## 历史考古报告

### 查找目标
[要查找的代码/功能]

### 发现

| 提交 | 日期 | 作者 | 变更 |
|------|------|------|------|
| abc123 | 2024-01-15 | Alice | 首次引入 |
| def456 | 2024-02-20 | Bob | 重构 |
| ghi789 | 2024-03-10 | Alice | Bug 修复 |

### 关键变更点
[重要的变更说明]

### 建议
[基于历史的建议]
```

---

## Rebase 外科手术 (Rebase Surgeon)

### 交互式 Rebase

```bash
# 编辑最近 N 个提交
git rebase -i HEAD~N

# 编辑从某个提交开始
git rebase -i <commit>^
```

### Rebase 操作符

| 操作 | 缩写 | 说明 |
|------|------|------|
| pick | p | 使用提交 |
| reword | r | 使用提交，但编辑提交消息 |
| edit | e | 使用提交，但停下来修改 |
| squash | s | 使用提交，但合并到前一个 |
| fixup | f | 类似 squash，但丢弃提交消息 |
| drop | d | 删除提交 |

### Squash 工作流

```bash
# 将最近 3 个提交合并为 1 个
git rebase -i HEAD~3

# 在编辑器中：
# pick abc123 First commit
# squash def456 Second commit  
# squash ghi789 Third commit

# 然后编辑合并后的提交消息
```

### 冲突解决策略

```
冲突解决流程：
1. 查看冲突文件: git status
2. 打开文件，找到冲突标记
3. 选择保留的内容
4. 删除冲突标记
5. git add <resolved-files>
6. git rebase --continue
```

---

## Co-authored-by 支持

当启用 `include_co_authored_by` 配置时，自动在提交消息底部添加：

```
feat(auth): implement SSO integration

Implement single sign-on with SAML support.

Co-authored-by: AI Assistant <ai@oh-my-claude.dev>
```

### 配置

```json
{
  "git_master": {
    "commit_footer": true,
    "include_co_authored_by": true
  }
}
```

---

## 创建 Pull Request

### 步骤 1: 理解当前状态

并行运行：

```bash
# 查看所有未跟踪文件
git status

# 查看暂存和非暂存更改
git diff

# 检查当前分支是否跟踪远程分支且是最新的
git status

# 理解从 base 分支分叉以来的完整提交历史
git log main..HEAD
git diff main...HEAD
```

### 步骤 2: 分析所有更改

分析 PR 中包含的所有更改：
- 查看**所有**将包含的 commits（不仅仅是最新的！）
- 起草 PR 总结

### 步骤 3: 创建 PR

```bash
# 如需要创建新分支
git checkout -b feature/xxx

# 如需要推送到远程（带 -u 标志）
git push -u origin feature/xxx

# 使用 HEREDOC 创建 PR 确保正确格式
gh pr create --title "the pr title" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points>

## Changes
- ...

## Testing
- ...
EOF
)"
```

### PR 模板

```markdown
## Summary
<1-3 个要点描述这个 PR 做了什么>

## Changes
- 变更 1
- 变更 2
- ...

## Testing
- 如何测试这些变更
- 需要注意的测试场景

## Related Issues
Fixes #123
```

---

## 分支管理

### 创建分支

```bash
# 从当前位置创建
git checkout -b feature/xxx

# 从特定分支创建
git checkout -b feature/xxx origin/main
```

### 分支命名约定

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feature/` | 新功能 | `feature/user-auth` |
| `fix/` | Bug 修复 | `fix/login-error` |
| `hotfix/` | 紧急修复 | `hotfix/security-patch` |
| `refactor/` | 重构 | `refactor/api-layer` |
| `docs/` | 文档 | `docs/api-reference` |
| `test/` | 测试 | `test/e2e-coverage` |

### 保护分支

以下分支受保护，操作前需额外确认：
- `main`
- `master`
- `develop`
- `production`

---

## 常见操作速查

### 查看状态

```bash
git status                    # 工作区状态
git diff                      # 未暂存的更改
git diff --staged             # 已暂存的更改
git log --oneline -10         # 最近 10 个提交
git log --graph --oneline     # 图形化历史
```

### 暂存更改

```bash
git add <file>                # 暂存特定文件
git add .                     # 暂存所有更改
git add -p                    # 交互式暂存
git reset HEAD <file>         # 取消暂存
```

### 撤销更改

```bash
git checkout -- <file>        # 丢弃工作区更改（需用户确认）
git reset HEAD~1              # 撤销最近一次提交（保留更改）
git reset --soft HEAD~1       # 软重置
```

### 远程操作

```bash
git fetch                     # 获取远程更新
git pull                      # 拉取并合并
git push                      # 推送到远程（需用户确认）
git push -u origin <branch>   # 推送并设置上游
```

---

## 与其他 Agent 协作

### 代码审查后提交

当魏征（代码审查）完成审查后：

```markdown
# 魏征审查通过后
@git-master 请提交这些更改，消息为：
"fix(auth): address code review feedback"
```

### 功能完成后创建 PR

当鲁班（实现）完成功能后：

```markdown
# 鲁班实现完成后
@git-master 请创建 PR 将这个功能合并到 main
```

---

## 配置选项

在项目配置中设置 `git_master`:

```json
{
  "git_master": {
    "commit_footer": true,
    "include_co_authored_by": true,
    "conventional_commits": true,
    "auto_stage": false,
    "sign_commits": false,
    "commit_message_max_length": 72,
    "body_wrap_length": 80
  }
}
```

| 选项 | 默认值 | 描述 |
|------|--------|------|
| `commit_footer` | true | 是否添加提交页脚 |
| `include_co_authored_by` | true | 是否添加 Co-authored-by |
| `conventional_commits` | true | 是否使用 Conventional Commits 格式 |
| `auto_stage` | false | 是否自动暂存所有更改 |
| `sign_commits` | false | 是否签名提交 |
| `commit_message_max_length` | 72 | 提交消息标题最大长度 |
| `body_wrap_length` | 80 | 提交消息正文换行长度 |

---

## 故障排除

### 提交被 hook 拒绝

1. 查看 hook 输出，了解失败原因
2. 修复问题（lint、格式、测试等）
3. 重新添加修改后的文件
4. 创建新提交（不要 amend）

### 合并冲突

1. 使用 `git status` 查看冲突文件
2. 手动解决冲突
3. `git add <resolved-files>`
4. 继续合并或 rebase

### 推送被拒绝

1. 先 `git pull` 获取最新更改
2. 解决任何冲突
3. 重新推送

---

*Git Master 技能 - 安全、规范、智能的 Git 操作指引*
