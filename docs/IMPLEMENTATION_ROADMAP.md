# oh-my-claude 功能完善实施路线图

> 基于 GAP_ANALYSIS_REPORT.md 制定的详细实施计划  
> 目标：对齐 oh-my-opencode 核心功能（多模型支持除外）

---

## 实施原则

1. **优先级驱动**: P0 > P1 > P2，按优先级逐步实施
2. **增量迭代**: 每个 Phase 完成后发布新版本
3. **向后兼容**: 不破坏现有用户的配置和使用习惯
4. **测试覆盖**: 每个新功能都要有对应的测试

---

## Phase 1: P0 关键功能 (v1.3.0)

**预计工期**: 1-2 周  
**版本目标**: v1.3.0

### 1.1 增强愚公系统提示词

**任务描述**: 参考 Sisyphus 的提示词结构，增强愚公的编排能力

**实施步骤**:

1. **创建愚公增强提示词文件**
   - 位置: `agents/yugong.md`
   - 内容参考: oh-my-opencode 的 `src/agents/sisyphus.ts`

2. **添加 Phase 0-3 工作流**
   ```markdown
   ## Phase 0 - Intent Gate
   - 检查 Skills 匹配
   - 分类请求类型
   - 验证歧义
   
   ## Phase 1 - Codebase Assessment
   - 检查配置文件
   - 采样文件一致性
   - 状态分类
   
   ## Phase 2A - Exploration & Research
   - 工具选择
   - 并行执行
   - 搜索停止条件
   
   ## Phase 2B - Implementation
   - Frontend Gate
   - 委派表
   - 验证要求
   
   ## Phase 2C - Failure Recovery
   - 失败处理
   - 回滚策略
   
   ## Phase 3 - Completion
   - 完成检查清单
   - 背景任务清理
   ```

3. **添加 Frontend Gate 决策逻辑**
   ```markdown
   ### Frontend Files: Decision Gate
   
   | Change Type | Examples | Action |
   |-------------|----------|--------|
   | Visual/UI/UX | Color, spacing, layout | DELEGATE to 顾恺之 |
   | Pure Logic | API calls, state | Handle directly |
   | Mixed | Both visual AND logic | Split: logic yourself, visual delegate |
   ```

4. **添加 GitHub Workflow 指引**
   ```markdown
   ### GitHub Workflow (CRITICAL)
   
   When mentioned in issues or asked to "look into" something:
   1. Investigate - Read issue/PR context
   2. Implement - Make changes
   3. Verify - Run build/tests
   4. Create PR - Complete the cycle
   ```

5. **添加 Delegation Prompt Structure**
   ```markdown
   ### Delegation Prompt Structure (MANDATORY)
   
   1. TASK: Atomic, specific goal
   2. EXPECTED OUTCOME: Concrete deliverables
   3. REQUIRED SKILLS: Which skill to invoke
   4. REQUIRED TOOLS: Explicit tool whitelist
   5. MUST DO: Exhaustive requirements
   6. MUST NOT DO: Forbidden actions
   7. CONTEXT: File paths, patterns, constraints
   ```

**交付物**:
- [ ] 更新 `agents/yugong.md`
- [ ] 更新 `commands/yishan.md`
- [ ] 更新 `skills/yishan/SKILL.md`

---

### 1.2 实现 Git Master 技能

**任务描述**: 创建专门的 Git 操作技能

**目录结构**:
```
skills/git-master/
├── skill.json
├── SKILL.md
└── prompts/
    ├── commit.md
    ├── pr.md
    └── branch.md
```

**skill.json**:
```json
{
  "name": "git-master",
  "version": "1.0.0",
  "description": "智能 Git 操作技能 - 提交、分支、PR 管理",
  "triggers": {
    "keywords": ["commit", "提交", "git", "branch", "分支", "pr", "pull request"],
    "commands": ["/git", "/commit", "/pr"]
  },
  "config": {
    "commit_footer": true,
    "include_co_authored_by": true,
    "conventional_commits": true
  }
}
```

**SKILL.md 核心内容**:
```markdown
# Git Master 技能

## 安全协议

- NEVER update git config
- NEVER run destructive commands (push --force, hard reset)
- NEVER skip hooks (--no-verify)
- NEVER commit unless explicitly requested

## 提交流程

1. git status - 查看变更
2. git diff - 查看详情
3. git log - 查看提交风格
4. 分析变更，生成提交消息
5. git add + git commit
6. git status 验证

## 提交消息格式

- 聚焦 "why" 而非 "what"
- 简洁（1-2 句）
- 准确反映变更目的

## Co-authored-by 支持

在提交时自动添加:
```
Co-authored-by: AI Assistant <ai@oh-my-claude.dev>
```
```

**交付物**:
- [ ] 创建 `skills/git-master/skill.json`
- [ ] 创建 `skills/git-master/SKILL.md`
- [ ] 创建 `commands/git.md`
- [ ] 更新 `lib/skill-loader.ts` 支持新技能

---

### 1.3 完善循环机制 (Ralph Loop)

**任务描述**: 实现独立的循环控制机制

**实施步骤**:

1. **创建 ralph-loop Hook**
   - 位置: `hooks/ralph-loop.sh`
   - 功能: 检测完成承诺，自动继续

2. **更新 hooks.json**
   ```json
   {
     "Stop": [
       {
         "type": "command",
         "command": "bash hooks/ralph-loop.sh",
         "timeout": 3000,
         "description": "Ralph Loop - 自引用循环控制"
       },
       {
         "type": "command", 
         "command": "bash hooks/todo-continuation.sh",
         "description": "TODO 续航检查"
       }
     ]
   }
   ```

3. **ralph-loop.sh 实现**:
   ```bash
   #!/usr/bin/env sh
   # Ralph Loop Hook - 自引用循环控制
   
   LOOP_STATE_FILE=".claude/ralph-loop.local.md"
   
   if [ ! -f "$LOOP_STATE_FILE" ]; then
       exit 0
   fi
   
   # 读取迭代次数
   ITERATION=$(grep '^iteration:' "$LOOP_STATE_FILE" | sed 's/iteration:[[:space:]]*//')
   MAX_ITERATIONS=$(grep '^max_iterations:' "$LOOP_STATE_FILE" | sed 's/max_iterations:[[:space:]]*//')
   COMPLETION_PROMISE=$(grep '^completion_promise:' "$LOOP_STATE_FILE" | sed 's/completion_promise:[[:space:]]*//')
   
   # 默认值
   ITERATION=${ITERATION:-1}
   MAX_ITERATIONS=${MAX_ITERATIONS:-100}
   COMPLETION_PROMISE=${COMPLETION_PROMISE:-DONE}
   
   # 检查最大迭代
   if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
       echo "🛑 Ralph Loop: 达到最大迭代次数 ($MAX_ITERATIONS)" >&2
       rm -f "$LOOP_STATE_FILE"
       exit 0
   fi
   
   # 更新迭代次数
   NEXT_ITERATION=$((ITERATION + 1))
   sed "s/^iteration:.*/iteration: $NEXT_ITERATION/" "$LOOP_STATE_FILE" > "${LOOP_STATE_FILE}.tmp"
   mv "${LOOP_STATE_FILE}.tmp" "$LOOP_STATE_FILE"
   
   # 返回继续信号
   printf '{"decision":"block","systemMessage":"\\n\\n🔄 **Ralph Loop 第 %d 次迭代**\\n\\n[自检] 任务是否完成？\\n\\n如果完成，请输出: <promise>%s</promise>\\n然后使用 /cancel-ralph 结束循环。\\n"}\n' "$NEXT_ITERATION" "$COMPLETION_PROMISE"
   ```

4. **添加配置支持**
   ```typescript
   // lib/config-manager.ts
   interface RalphLoopConfig {
     enabled: boolean;
     default_max_iterations: number;
     completion_promise: string;
   }
   ```

**交付物**:
- [ ] 创建 `hooks/ralph-loop.sh`
- [ ] 更新 `hooks/hooks.json`
- [ ] 创建 `/ralph-loop` 命令
- [ ] 创建 `/cancel-ralph` 命令
- [ ] 更新配置管理器

---

### 1.4 对齐 Background Task 工具命名

**任务描述**: 确保工具命名与 oh-my-opencode 兼容

**现状分析**:
- OMC 使用 `Task` 工具实现后台任务
- OMO 使用 `background_task`、`background_output`、`background_cancel`

**方案**: 由于这些工具是 Claude Code 内置的，实际上已经存在。只需要在文档和提示词中明确引用即可。

**实施步骤**:

1. **更新愚公提示词** - 明确使用 `background_task` 工具名
2. **更新 SKILL.md** - 使用标准工具名
3. **添加工具别名说明** - 文档中说明工具对应关系

**交付物**:
- [ ] 更新文档中的工具命名
- [ ] 验证工具兼容性

---

## Phase 2: P1 重要功能 (v1.4.0)

**预计工期**: 2-3 周  
**版本目标**: v1.4.0

### 2.1 新增内置命令

| 命令 | 描述 | 优先级 |
|------|------|--------|
| `/init-deep` | 深度项目初始化 | P1 |
| `/start-work` | 开始工作流 | P1 |
| `/refactor` | 重构模板 | P1 |

**实施模板**:

```markdown
# /init-deep 命令

深度分析项目结构，生成详细的工作计划。

## 功能
- 扫描项目结构
- 识别技术栈
- 分析依赖关系
- 生成架构文档
- 创建 TODO 列表

## 使用
/init-deep [--create-new] [--max-depth=N]
```

### 2.2 新增 Hook

| Hook | 描述 | 实现方式 |
|------|------|----------|
| `delegate-task-retry` | 任务委派自动重试 | Bash 脚本 |
| `background-notification` | 任务完成通知 | Bash 脚本 |
| `interactive-bash-session` | tmux 会话管理 | Bash 脚本 |

### 2.3 增强会话恢复

- 增强 `error-recovery.sh` 支持更多错误类型
- 添加 Anthropic 上下文窗口限制恢复
- 添加 thinking block 错误恢复

### 2.4 新增 Agent 能力

考虑增强现有 Agent 或添加新能力：

| 需求 | 方案 |
|------|------|
| Metis 规划能力 | 增强李白 Agent |
| Atlas 编排能力 | 增强愚公 Agent |
| Prometheus 规划器 | 增强诸葛 Agent |

---

## Phase 3: P2 优化功能 (v1.5.0)

**预计工期**: 1-2 周  
**版本目标**: v1.5.0

### 3.1 配置系统升级

- 支持 JSONC 格式
- 添加 `categories` 配置
- 添加 `notification` 配置
- 添加 `background_task` 并发配置

### 3.2 辅助 Hook

- `empty-task-response-detector`
- `agent-usage-reminder`
- `thinking-block-validator` 完善
- `compaction-context-injector` 分离

### 3.3 文档更新

- 更新 README
- 更新 API_DOCUMENTATION
- 更新 TROUBLESHOOTING

---

## 验收标准

### Phase 1 验收

- [ ] 愚公提示词包含完整的 Phase 0-3 工作流
- [ ] Git Master 技能可正常使用
- [ ] Ralph Loop 机制可正确控制循环
- [ ] 工具命名与 oh-my-opencode 兼容

### Phase 2 验收

- [ ] `/init-deep` `/start-work` `/refactor` 命令可用
- [ ] 新增 Hook 正常工作
- [ ] 会话恢复机制增强

### Phase 3 验收

- [ ] JSONC 配置支持
- [ ] 辅助 Hook 完善
- [ ] 文档完整更新

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 提示词改动影响现有用户 | 中 | 版本升级说明，保持向后兼容 |
| Hook 冲突 | 低 | 详细测试，Hook 顺序调整 |
| 配置迁移问题 | 中 | 提供迁移脚本和文档 |

---

## 时间线

| Phase | 开始 | 结束 | 版本 |
|-------|------|------|------|
| Phase 1 | Week 1 | Week 2 | v1.3.0 |
| Phase 2 | Week 3 | Week 5 | v1.4.0 |
| Phase 3 | Week 6 | Week 7 | v1.5.0 |

**总计**: 约 7 周完成全部对齐工作

---

*路线图完成。详细任务分解和进度跟踪请使用 TODO 系统。*
