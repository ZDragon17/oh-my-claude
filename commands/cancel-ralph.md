---
name: cancel-ralph
description: |
  取消 Ralph Loop 循环 - 停止当前的自引用循环执行。
  别名：/stop-ralph, /stop-loop
---

# 🛑 取消 Ralph Loop

正在取消 Ralph Loop 循环...

## 执行步骤

1. 检查状态文件是否存在
2. 如果存在，删除状态文件
3. 报告取消结果

```bash
# 删除 Ralph Loop 状态文件
rm -f .claude/ralph-loop.local.md
```

## 状态

```
如果状态文件存在:
  ✅ Ralph Loop 已取消
  
如果状态文件不存在:
  ℹ️ 没有活跃的 Ralph Loop
```

**循环已结束。**
