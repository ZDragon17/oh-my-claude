# 学徒命令 - 从经验中学习

> 📚 学而时习之，温故而知新

从会话中提取可复用的模式和经验，建立个人/团队知识库。

## 命令格式

```bash
# 基本用法：从当前会话提取学习
/xuetu

# 指定提取内容
/xuetu "如何处理认证错误"

# 英文命令
/learner extract "auth error handling"
```

## 管理知识库

```bash
# 列出所有已学习的模式
/xuetu list

# 搜索特定模式
/xuetu search "认证"

# 应用已学习的模式
/xuetu apply "处理JWT过期"

# 导出知识库
/xuetu export --format=json

# 导入知识库
/xuetu import knowledge.json
```

## 选项

```bash
# 指定分类
/xuetu --category=patterns 提取认证相关经验

# 添加标签
/xuetu --tags=auth,jwt,error

# 从历史会话提取
/xuetu --session=ses_abc123
```

## 命令别名

- `/xuetu` - 学徒（中文）
- `/learner` - Learner（英文）
- `/learn` - 简写
- `/remember` - 记住

---

加载 learner 技能以获取详细指南。
