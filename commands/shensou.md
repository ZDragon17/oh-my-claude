# 深度搜索命令 - 多策略彻底搜索

> 🔍 福尔摩斯式搜索：抽丝剥茧，洞察秋毫

多策略并行搜索，确保找到所有相关代码和信息。

## 命令格式

```bash
# 基本用法：全面搜索
/shensou 找到所有处理用户认证的代码

# 英文命令
/deepsearch find all authentication handling code

# 简写
/ds 认证相关代码
```

## 搜索模式

```bash
# 全面搜索（默认）
/shensou 认证模块

# 快速搜索
/shensou --quick 登录函数

# 深度搜索（最彻底）
/shensou --thorough 安全漏洞

# 指定策略
/shensou --strategy=ast,lsp 函数定义
```

## 高级选项

```bash
# 限制搜索范围
/shensou --path=src/auth 认证

# 排除目录
/shensou --exclude=node_modules,dist 配置

# 限制文件类型
/shensou --include=*.ts,*.tsx 组件

# 输出格式
/shensou --format=json 认证  # JSON 格式
/shensou --format=tree 认证  # 树形结构

# 保存结果
/shensou --save=search-result.md 认证
```

## 搜索策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| 🔤 关键词搜索 | 精确匹配关键词 | 知道具体名称 |
| 📁 文件名搜索 | 搜索文件名模式 | 找特定类型文件 |
| 🌲 AST 搜索 | 结构化代码搜索 | 找函数/类定义 |
| 🔗 引用追踪 | 追踪符号引用 | 找调用链 |
| 📖 语义搜索 | 理解代码意图 | 自然语言描述 |
| 🕸️ 依赖分析 | 追踪导入关系 | 理解模块依赖 |

## 与悟空探索的区别

| 特性 | 悟空 (`/wukong`) | 深搜 (`/shensou`) |
|------|------------------|-------------------|
| 速度 | 快速 | 较慢但更彻底 |
| 深度 | 表面扫描 | 深度挖掘 |
| 策略 | 单一策略 | 多策略并行 |
| 适用 | 快速定位 | 全面了解 |

**选择建议**：
- 知道大概位置 → `/wukong`
- 需要全面了解 → `/shensou`

## 命令别名

- `/shensou` - 深搜（中文）
- `/deepsearch` - DeepSearch（英文）
- `/ds` - 简写
- `/thorough` - 彻底搜索

---

加载 deepsearch 技能以获取详细指南。
