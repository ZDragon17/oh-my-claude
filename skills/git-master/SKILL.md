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
实现 6 阶段提交工作流、3 模式检测、强制性输出校验。

---

## 模式检测（第一步 - 必须执行）

> **⚠️ CRITICAL**: 收到任何 Git 相关请求时，必须**首先**判定操作模式。
> 不可跳过此步骤直接执行任何 Git 命令。

| 用户请求模式 | 检测关键词 | 激活模式 |
|-------------|-----------|---------|
| "提交" "commit" "暂存" "stage" | commit, add, stage, push, 提交, 暂存 | **COMMIT** → 进入 Phase 0-6 |
| "变基" "rebase" "squash" "整理历史" | rebase, squash, fixup, amend, 变基, 合并提交 | **REBASE** → 进入 R1-R4 |
| "谁改的" "blame" "查找" "什么时候引入" | blame, bisect, log -S, 谁, 何时, 查找, 历史 | **HISTORY_SEARCH** → 进入 H1-H3 |

```
┌─────────────────────────────────────────────┐
│  MODE DETECTION (MANDATORY FIRST STEP)      │
├─────────────────────────────────────────────┤
│                                             │
│  用户请求 ──→ 关键词匹配                      │
│              ├─ commit/push/stage            │
│              │  → COMMIT MODE (Phase 0-6)    │
│              ├─ rebase/squash/fixup          │
│              │  → REBASE MODE (R1-R4)        │
│              └─ blame/bisect/log -S          │
│                 → HISTORY SEARCH (H1-H3)     │
│                                             │
│  ⚠️ 无法判定 → 询问用户明确意图               │
└─────────────────────────────────────────────┘
```

---

## 核心原则：默认多提交

> **🔴 HARD RULE — 不可违反**

| 变更文件数 | 最少提交数 | 强制性 |
|-----------|-----------|--------|
| 1-2 文件 | 1 个提交 | 可选 |
| 3-4 文件 | 2+ 个提交 | **MANDATORY** |
| 5-9 文件 | 3+ 个提交 | **MANDATORY** |
| 10+ 文件 | 5+ 个提交 | **MANDATORY** |

**最小提交数公式**: `min_commits = ceil(file_count / 3)`

### 拆分判定标准

| 拆分条件 | 说明 | 优先级 |
|---------|------|--------|
| 不同目录 | `src/` vs `tests/` vs `docs/` | **最高** |
| 不同组件类型 | 配置 vs 类型 vs 实现 vs 测试 | 高 |
| 不同关注点 | 基础设施 vs 业务逻辑 | 高 |
| 不同依赖层 | 被依赖方先提交 | 中 |
| 实现+测试配对 | 同一功能的实现和测试可合并 | 低 |

### 提交前强制自检

> **⚠️ HARD STOP**: 执行 `git commit` 前，必须完成以下检查。
> 任何一项不通过，**禁止**继续提交。

```
┌─────────────────────────────────────────────┐
│  PRE-COMMIT SELF-CHECK (MANDATORY)          │
├─────────────────────────────────────────────┤
│  □ 文件数 ≤ 2？ 或已按规则拆分？              │
│  □ 每个提交只做一件事？                       │
│  □ 提交消息匹配检测到的仓库风格？              │
│  □ 无敏感文件（.env, credentials 等）？       │
│  □ 提交间有清晰的依赖关系？                   │
│  □ 3+ 文件的提交有书面理由？                  │
│                                             │
│  ✗ 任一未通过 → 回到 Phase 3 重新规划         │
└─────────────────────────────────────────────┘
```

---

## COMMIT MODE: Phase 0-6 工作流

### Phase 0: 并行上下文收集

> **所有命令必须并行执行**，减少等待时间。

```bash
# 并行执行以下 4 组命令：

# [1] 工作区状态
git status

# [2] 变更详情（暂存 + 未暂存）
git diff
git diff --staged

# [3] 仓库提交风格（最近 30 条）
git log --oneline -30

# [4] 分支上下文
git branch -vv
git log --oneline main..HEAD 2>/dev/null || git log --oneline master..HEAD 2>/dev/null
```

收集结果后立即进入 Phase 1。

---

### Phase 1: 风格检测（BLOCKING OUTPUT）

> **⚠️ CRITICAL**: 此阶段产生的输出**必须打印**后才能进入下一阶段。
> 不可在内部静默处理。

#### 1.1 语言检测

分析 `git log --oneline -30` 的输出，判定主要语言：

| 检测模式 | 判定语言 |
|---------|---------|
| 多数消息含中文字符 | **中文 (Chinese)** |
| 多数消息含韩文字符 | **韩文 (Korean)** |
| 多数消息为 ASCII | **英文 (English)** |
| 混合出现 | **混合 (Mixed)** → 优先匹配占比最高的语言 |

#### 1.2 风格分类

| 风格类型 | 特征 | 示例 |
|---------|------|------|
| **SEMANTIC** | `type(scope):` 格式，Conventional Commits | `feat(auth): add OAuth2 login` |
| **PLAIN** | 动词开头，首字母大写，无前缀 | `Add user authentication` |
| **SENTENCE** | 完整句子描述 | `Added the authentication module` |
| **SHORT** | 极简描述，< 20 字符 | `fix typo` |

#### 1.3 MANDATORY 输出块

> **🔴 BLOCKING**: 必须输出以下格式后才能继续。跳过此输出 = 违反协议。

```markdown
## 📊 风格检测报告

| 维度 | 检测结果 | 置信度 |
|------|----------|--------|
| 语言 | {English/Chinese/Korean/Mixed} | {N}% |
| 格式 | {SEMANTIC/PLAIN/SENTENCE/SHORT} | {N}% |
| 大小写 | {lowercase/Capitalize} | {N}% |
| 平均长度 | {N} 字符 | - |

**采用风格**: `{检测到的风格模板}`
**示例**: `{基于检测风格的示例消息}`
```

---

### Phase 2: 分支上下文分析

#### 2.1 分支状态判定

```bash
# 检查当前分支
git branch --show-current

# 检查与远程的关系
git status -sb

# 检查是否有未推送的提交
git log @{u}..HEAD --oneline 2>/dev/null
```

#### 2.2 历史重写安全评估

| 条件 | 判定 | 操作 |
|------|------|------|
| 当前在 main/master | **禁止重写** | 仅允许新提交 |
| 分支已推送到远程且有协作者 | **风险高** | 警告用户，需明确确认 |
| 本地分支，未推送 | **安全** | 可自由 rebase/amend |
| 分支已推送但仅自己使用 | **需确认** | 可 force push，但需用户确认 |

#### 2.3 策略决定

```
分支状态 ──→ 本地未推送？
             ├─ 是 → 可使用 fixup + autosquash
             └─ 否 → 已推送？
                      ├─ 是 → 仅新提交（除非用户要求 force push）
                      └─ 检查远程 → 决定策略
```

---

### Phase 3: 原子单元规划（BLOCKING OUTPUT）

> **⚠️ CRITICAL**: 此阶段产生的提交计划**必须打印**并等待确认后才能执行。

#### 3.1 计算最小提交数

```
file_count = len(changed_files)
min_commits = max(1, ceil(file_count / 3))

# 硬性下限校验
if file_count >= 3 and planned_commits < 2: REJECT
if file_count >= 5 and planned_commits < 3: REJECT
if file_count >= 10 and planned_commits < 5: REJECT
```

#### 3.2 拆分策略

按以下优先级拆分：

1. **目录/模块优先**: 不同目录的文件分到不同提交
2. **关注点分离**: 配置 → 类型/接口 → 实现 → 测试 → 文档
3. **依赖排序**: 被依赖的代码先提交
4. **实现+测试配对**: 同一功能的实现文件和测试文件**可以**放同一提交

#### 3.3 3+ 文件提交的强制理由

> **🔴 MANDATORY**: 任何包含 3 个及以上文件的单次提交，**必须**附带书面理由。

合理理由示例：
- "这三个文件属于同一组件的不同层（model/service/controller），拆分会破坏编译"
- "重命名操作跨越多个文件，必须原子性完成"
- "配置文件和配套的类型声明必须同步更新"

不可接受的理由：
- "方便" "文件太少不值得拆" "一起提交更快"

#### 3.4 MANDATORY 输出块

> **🔴 BLOCKING**: 必须输出以下提交计划后才能进入 Phase 4。

```markdown
## 📋 提交计划

**变更文件数**: {N} 个
**计划提交数**: {M} 个 (最小要求: {min_commits})

### Commit 1: `{type}({scope}): {description}`
- `path/to/file1.ts` — {变更说明}
- `path/to/file2.ts` — {变更说明}

### Commit 2: `{type}({scope}): {description}`
- `path/to/file3.ts` — {变更说明}

{3+ 文件理由（如适用）: ...}

### 依赖关系
Commit 1 → Commit 2 → Commit 3
(每个提交可独立编译通过)
```

---

### Phase 4: 提交策略决定

#### 4.1 Fixup vs 新提交

| 条件 | 策略 | 命令 |
|------|------|------|
| 修复前序提交的 bug | fixup | `git commit --fixup=<hash>` |
| 补充前序提交遗漏的文件 | fixup | `git commit --fixup=<hash>` |
| 独立的新变更 | 新提交 | `git commit -m "..."` |
| 用户明确要求 amend | amend | `git commit --amend` (需满足 amend 规则) |

#### 4.2 历史重建决定

```
使用了 fixup？
├─ 是 → Phase 6 中执行 autosquash rebase
└─ 否 → 直接进入 Phase 5

分支已推送？
├─ 是 → 需要 force push（需用户确认）
└─ 否 → 安全执行
```

---

### Phase 5: 提交执行

#### 5.1 TodoWrite 注册

> 使用 TodoWrite 注册每个提交为独立任务，确保进度可追踪。

```
TODO 1: [pending] Commit 1 - {description}
TODO 2: [pending] Commit 2 - {description}
TODO 3: [pending] Commit 3 - {description}
```

#### 5.2 执行每个提交

对计划中的每个提交，按顺序执行：

```bash
# 1. 暂存文件
git add <file1> <file2>

# 2. 执行提交（消息匹配 Phase 1 检测到的风格）
git commit -m "<message>"

# 3. 验证
git status
git log --oneline -1
```

#### 5.3 提交消息生成规则

- **必须**匹配 Phase 1 检测到的风格
- **SEMANTIC 风格**: `<type>(<scope>): <lowercase description>`
- **PLAIN 风格**: `<Verb> <description>`
- **SENTENCE 风格**: `<Past tense sentence>`
- **SHORT 风格**: `<brief phrase>`
- **中文仓库**: 描述部分使用中文

#### 5.4 Hook 失败处理

```
提交被 pre-commit hook 拒绝？
├─ 查看 hook 输出，了解失败原因
├─ 修复问题（lint、格式、测试等）
├─ 重新暂存修改后的文件
├─ 创建新提交（⚠️ 绝对不要 amend 失败的提交）
└─ 更新 TODO 状态
```

---

### Phase 6: 验证与清理

#### 6.1 提交后验证

```bash
# 检查所有提交是否成功
git log --oneline -N  # N = 计划提交数

# 确认工作区干净
git status

# 确认无遗漏文件
git diff
```

#### 6.2 Force Push 决定

```
使用了 fixup/autosquash？
├─ 是 → git rebase -i --autosquash <base>
│       ├─ 分支未推送？ → 安全执行
│       └─ 分支已推送？ → 需用户明确确认 force push
└─ 否 → 无需额外操作
```

#### 6.3 最终报告

```markdown
## ✅ 提交完成报告

| 提交 | 类型 | 消息 | 文件数 |
|------|------|------|--------|
| {hash1} | feat | {msg1} | {N} |
| {hash2} | test | {msg2} | {N} |

**总计**: {M} 个提交，{N} 个文件
**分支**: {branch_name}
**状态**: {已推送/待推送/待 force push}
```

---

## REBASE MODE: R1-R4

### R1: 上下文分析与安全评估

```bash
# 并行执行
git log --oneline -20
git branch -vv
git status
git log @{u}..HEAD --oneline 2>/dev/null
```

**安全检查清单**:

| 检查项 | 安全 | 危险 |
|--------|------|------|
| 当前分支 | feature/* | main/master |
| 远程状态 | 未推送 | 已推送（需 force push） |
| 协作者 | 仅自己 | 多人协作 |
| 工作区 | 干净 | 有未提交更改 |

> **🔴 HARD STOP**: 如果在 main/master 分支上，**禁止**执行 rebase。
> 必须先切换到 feature 分支。

### R2: 执行 Rebase

#### 交互式 Rebase

```bash
# 编辑最近 N 个提交
git rebase -i HEAD~N

# 从某个提交开始
git rebase -i <commit>^
```

#### Rebase 操作符

| 操作 | 缩写 | 说明 |
|------|------|------|
| pick | p | 保留提交 |
| reword | r | 修改提交消息 |
| edit | e | 停下来修改内容 |
| squash | s | 合并到前一个提交（保留消息） |
| fixup | f | 合并到前一个提交（丢弃消息） |
| drop | d | 删除提交 |

#### Autosquash 工作流

```bash
# 先创建 fixup 提交
git commit --fixup=<target_hash>

# 然后自动整理
git rebase -i --autosquash <base_commit>
```

#### Onto Rebase（变更基底）

```bash
# 将分支移到新基底
git rebase --onto <new_base> <old_base> <branch>
```

### R3: 冲突解决与验证

```
冲突发生时：
1. git status                    — 查看冲突文件
2. 打开文件，找到 <<<< ==== >>>> 标记
3. 选择保留内容，删除冲突标记
4. git add <resolved_files>       — 标记已解决
5. git rebase --continue          — 继续 rebase
6. 重复直到所有冲突解决

放弃 rebase：
git rebase --abort
```

**验证**:

```bash
# Rebase 完成后
git log --oneline -10
git diff <base_branch>..HEAD --stat
```

### R4: 报告

```markdown
## 📋 Rebase 报告

**操作**: {interactive/autosquash/onto}
**分支**: {branch_name}
**结果**:
- 提交数: {before} → {after}
- 冲突: {N} 个（已全部解决）
- 状态: {需要 force push / 已完成}

**变更提交**:
| 序号 | Hash | 消息 |
|------|------|------|
| 1 | {hash} | {message} |
```

---

## HISTORY SEARCH MODE: H1-H3

### H1: 确定搜索类型

| 用户意图 | 搜索类型 | 使用命令 |
|---------|---------|---------|
| "谁修改了这行代码" | **blame** | `git blame` |
| "这个函数什么时候添加的" | **pickaxe** | `git log -S` |
| "匹配某个模式的提交" | **regex** | `git log -G` |
| "这个 bug 哪个提交引入的" | **bisect** | `git bisect` |
| "这个文件的修改历史" | **file_log** | `git log --follow` |

### H2: 执行搜索

#### Blame（追溯）

```bash
# 查看文件每行的最后修改者
git blame <file>

# 指定行范围
git blame -L 10,20 <file>

# 忽略空白变更
git blame -w <file>

# 显示邮箱
git blame -e <file>

# 追溯到更早版本（忽略最近一次变更）
git blame <commit>^ -- <file>
```

#### Pickaxe（代码搜索）

```bash
# 搜索添加/删除特定字符串的提交
git log -S "functionName" --oneline

# 显示差异
git log -S "functionName" -p

# 限定文件范围
git log -S "functionName" -- "src/**/*.ts"
```

#### Regex（正则搜索）

```bash
# 搜索匹配正则表达式的提交
git log -G "pattern.*regex" --oneline

# 显示差异
git log -G "pattern.*regex" -p
```

#### Bisect（二分查找）

```bash
# 开始二分
git bisect start

# 标记当前为坏版本
git bisect bad

# 标记已知好的版本
git bisect good <commit>

# Git 自动切换到中间版本，测试后标记：
git bisect good  # 或 git bisect bad

# 找到后重置
git bisect reset
```

#### File Log（文件历史）

```bash
# 查看文件完整修改历史
git log --follow --oneline -- <file>

# 显示差异
git log --follow -p -- <file>

# 仅显示统计
git log --follow --stat -- <file>
```

### H3: 结果呈现

> 搜索结果必须以结构化格式呈现，附带可操作的上下文。

```markdown
## 🔍 历史搜索报告

### 搜索目标
{要查找的代码/功能/问题}

### 搜索方法
{blame/pickaxe/regex/bisect/file_log}

### 发现

| 提交 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| {hash1} | {date1} | {author1} | {description1} |
| {hash2} | {date2} | {author2} | {description2} |

### 关键变更点
{重要的变更说明和上下文}

### 可操作建议
- {基于发现的建议 1}
- {基于发现的建议 2}
```

---

## 快速参考

### 风格检测速查

```
SEMANTIC:  feat(scope): description     ← 有 type( 前缀
PLAIN:     Add user authentication      ← 首字母大写动词开头
SENTENCE:  Added the auth module        ← 过去式完整句子
SHORT:     fix typo                     ← < 20 字符
```

### 决策树

```
收到 Git 请求
├─ 提交类？ → COMMIT MODE
│  ├─ Phase 0: 并行收集上下文
│  ├─ Phase 1: 风格检测 [BLOCKING OUTPUT]
│  ├─ Phase 2: 分支上下文
│  ├─ Phase 3: 原子规划 [BLOCKING OUTPUT]
│  ├─ Phase 4: 策略决定
│  ├─ Phase 5: 逐个执行
│  └─ Phase 6: 验证报告
├─ Rebase 类？ → REBASE MODE
│  ├─ R1: 安全评估
│  ├─ R2: 执行操作
│  ├─ R3: 冲突解决
│  └─ R4: 报告
└─ 历史查询类？ → HISTORY SEARCH
   ├─ H1: 确定搜索类型
   ├─ H2: 执行搜索
   └─ H3: 结果呈现
```

### 反模式清单

> **🚫 以下行为绝对禁止**:

| 反模式 | 正确做法 |
|--------|---------|
| 跳过风格检测直接提交 | 必须先完成 Phase 1 |
| 10 个文件一次提交 | 按规则拆分为 5+ 个提交 |
| 不打印 BLOCKING OUTPUT | Phase 1 和 Phase 3 的输出不可省略 |
| 对失败的提交执行 amend | 修复后创建新提交 |
| 在 main 上执行 rebase | 切换到 feature 分支 |
| 不检查分支安全就 force push | 先完成 R1 安全评估 |
| 3+ 文件提交无理由 | 必须附带书面理由 |
| 内部消化风格检测结果 | 必须输出格式化报告 |

---

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

### 语义化版本关联

- **`fix:`** → PATCH 版本 (1.0.0 → 1.0.1)
- **`feat:`** → MINOR 版本 (1.0.0 → 1.1.0)
- **BREAKING CHANGE** → MAJOR 版本 (1.0.0 → 2.0.0)

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
git status -sb

# 理解从 base 分支分叉以来的完整提交历史
git log main..HEAD --oneline
git diff main...HEAD --stat
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

### 分支命名约定

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feature/` | 新功能 | `feature/user-auth` |
| `fix/` | Bug 修复 | `fix/login-error` |
| `hotfix/` | 紧急修复 | `hotfix/security-patch` |
| `refactor/` | 重构 | `refactor/api-layer` |
| `docs/` | 文档 | `docs/api-reference` |
| `test/` | 测试 | `test/e2e-coverage` |

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

*Git Master 技能 v2.0 — 6 阶段提交工作流 · 3 模式检测 · 强制性输出校验*
