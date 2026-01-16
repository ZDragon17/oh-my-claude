---
name: cancel-yishan
description: |
  取消愚公移山循环 - 停止当前的自主循环执行。
  别名：/stop-yishan, /cancel-yugong, /stop-loop
---

# 取消愚公移山循环

你需要取消当前正在进行的愚公移山循环。

## 取消操作

请执行以下步骤：

### 1. 删除状态文件

使用 Bash 工具删除状态文件：

```bash
rm -f .claude/yishan-loop.local.md
```

### 2. 确认取消

删除成功后，向用户确认：

```
🛑 愚公移山循环已取消

状态文件已删除：.claude/yishan-loop.local.md
循环将在当前响应结束后停止。

如需重新启动循环，请使用 /yishan 或 /yugong 命令。
```

## 注意事项

- 取消操作会立即停止循环，当前响应完成后不会再继续
- 已完成的工作不会被撤销
- TODO 列表会保留，可以稍后继续处理

## 执行

现在请删除状态文件以取消循环。
