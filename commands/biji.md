# 笔记本命令 - 压缩抗性记忆系统

> 📝 究天人之际，通古今之变

保存重要信息到笔记本，确保在上下文压缩时不会丢失。

## 命令格式

```bash
# 添加笔记
/biji 这个项目使用 JWT 进行认证

# 英文命令
/note auth uses JWT with secret in JWT_SECRET

# 简写
/n 数据库连接字符串在 .env 文件中
```

## 笔记操作

```bash
# 添加笔记（默认）
/biji 重要发现：API 限流设置为 100/分钟

# 查看所有笔记
/biji list

# 搜索笔记
/biji search 认证

# 删除笔记
/biji delete 3

# 清空笔记
/biji clear

# 导出笔记
/biji export
```

## 笔记分类

```bash
# 添加带分类的笔记
/biji --category=architecture 系统采用微服务架构

# 预设分类
# - discovery: 发现
# - decision: 决策
# - architecture: 架构
# - warning: 警告
# - todo: 待办
# - reference: 参考
```

## 高级选项

```bash
# 设置优先级
/biji --priority=high 关键：不要修改 legacy 模块

# 添加标签
/biji --tags=auth,security JWT 配置

# 保存到全局笔记（跨项目）
/biji --global 通用技巧
```

## 三层存储

| 层级 | 位置 | 作用域 |
|------|------|--------|
| 会话内存 | 当前对话 | 本次会话 |
| 项目笔记 | `.claude/notepad.md` | 当前项目 |
| 全局笔记 | `~/.claude/global-notes.md` | 所有项目 |

## 自动捕获

对话中使用 `<remember>` 标签会自动保存：

```
<remember>
测试覆盖率要求 80%
</remember>
```

## 命令别名

- `/biji` - 笔记（中文）
- `/note` - Note（英文）
- `/n` - 简写
- `/remember` - 记住
- `/notepad` - 笔记本

---

加载 note 技能以获取详细指南。
