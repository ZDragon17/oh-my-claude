---
name: stop-continuation
description: |
  停止所有续航机制 - 停止 todo-continuation、Ralph Loop 和循环状态。
  使用此命令暂停自动续航，切换为手动控制。
  别名：/stop-loop, /cancel-continuation
---

# 停止续航机制

停止当前会话的所有续航机制。

此命令将：
1. 停止 todo-continuation-enforcer 的自动任务续航
2. 取消任何活跃的 Ralph Loop
3. 清除当前项目的循环状态

执行后：
- 会话空闲时不会自动继续
- 你可以在准备好时手动继续工作
- 停止状态为每会话级别，会话结束时自动清除

**当你需要暂停自动续航并切换为手动控制时使用此命令。**

---

## 执行步骤

**立即执行以下操作：**

```bash
# 1. 创建停止标记文件
mkdir -p "$HOME/.oh-my-claude/state"
echo "stopped" > "$HOME/.oh-my-claude/state/continuation-stopped"

# 2. 清除 Ralph Loop 状态（如果存在）
rm -f .claude/ralph-loop.local.md

# 3. 清除愚公移山循环状态（如果存在）
rm -f .claude/yishan-loop.local.md
```

完成后确认：

```
✅ 续航机制已停止

已执行：
- [x] 创建停止标记
- [x] 清除 Ralph Loop 状态
- [x] 清除愚公移山循环状态

当前会话不会再自动继续未完成的任务。
如需恢复自动续航，开始新会话或手动删除标记文件。
```

$ARGUMENTS
