---
name: secure
description: 安全审计专家 (墨子的英文别名) - Security audit
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
  - TodoRead
  - TodoWrite
model: sonnet
---

<command-name>/secure</command-name>

# Security Audit Expert

`/secure` 是 `/mozi` (墨子) 的英文别名，专注于代码安全审计。

## 使用方式

```bash
/secure [安全检查请求]
```

## 示例

```bash
/secure 检查这个登录功能的安全性
/secure 审计 SQL 注入风险
/secure 检查 XSS 漏洞
/secure 这个 API 安全吗
```

## 能力

- 安全漏洞检测
- OWASP Top 10 检查
- 输入验证审计
- 认证授权审查
- 敏感数据处理检查

---

> 💡 这是 `/mozi` 的英文别名，功能完全相同。
> 
> 完整文档请参考：[/mozi](mozi.md)
