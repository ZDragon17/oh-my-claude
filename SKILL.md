---
name: work-with-pr
description: 完整 PR 生命周期自动化
---

# Work with PR

## 概述
从实现到合并的完整 PR 生命周期管理，使用 git worktree 进行隔离开发。

## 工作流

### 步骤 1: 创建工作区
```bash
git worktree add -b feature/<name> ../worktree-<name>
cd ../worktree-<name>
```

### 步骤 2: 实现（原子提交）
- 每次提交代表一个逻辑变更
- 遵循 conventional commits: `feat:`, `fix:`, `refactor:`, etc.
- Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

### 步骤 3: 推送和 PR
```bash
git push -u origin feature/<name>
gh pr create --title "feat: <title>" --body "$(cat <<'EOF'
## Summary
...

## Test Plan
- [ ] ...
🤖 Generated with Claude Code
EOF
)"
```

### 步骤 4: 验证循环
- 等待 CI 状态检查
- 运行 `gh pr checks <number>`
- 如有失败 → 修复 → push → 重新检查

### 步骤 5: 审查和合并
- `gh pr review <number> --approve`
- `gh pr merge <number> --squash`

### 步骤 6: 清理
```bash
cd <main-repo>
git worktree remove ../worktree-<name>
git branch -D feature/<name>
```

## 安全规则
- ✅ 使用 worktree 隔离变更
- ✅ 每次操作前验证 git 状态
- ❌ 不强制推送
- ❌ 不跳过 hooks
- ❌ 不修改 main/master 保护分支
