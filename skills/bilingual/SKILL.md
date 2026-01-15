---
name: bilingual
description: |
  中英双语支持技能 - 使 Agent 能够理解和响应中英文命令。
  支持的命令别名映射。
---

# 中英双语命令支持

本技能提供 oh-my-claude 的中英双语命令映射支持。

## 命令映射表

### Agent 命令

| 主命令 | 中文别名 | 英文别名 | Agent | 功能 |
|--------|----------|----------|-------|------|
| `/yugong` | `/愚公` | `/yishan` `/persist` `/ultrawork` `/ulw` `/移山` | 愚公 | 主编排，持续执行 |
| `/zhuge` | `/诸葛` `/隆中` | `/longzhong` `/strategy` `/consult` | 诸葛 | 战略顾问，架构设计 |
| `/luban` | `/鲁班` `/巧工` | `/qiaogong` `/craft` `/frontend` | 鲁班 | 精工巧匠，代码实现 |
| `/wukong` | `/悟空` `/火眼` | `/huoyan` `/explore` `/scout` | 悟空 | 代码侦察，快速探索 |
| `/bianque` | `/扁鹊` `/望闻` | `/wangwen` `/debug` `/diagnose` | 扁鹊 | Bug 诊断，问题修复 |
| `/mozi` | `/墨子` `/安全` | `/security` `/audit` | 墨子 | 安全审计，防御编程 |
| `/sunzi` | `/孙子` `/性能` `/优化` | `/performance` `/perf` | 孙子 | 性能优化，系统调优 |
| `/simaqian` | `/司马迁` `/史记` | `/shiji` `/document` `/doc` | 司马迁 | 文档撰写，变更记录 |
| `/team` | `/协作` `/合作` `/团队` | `/teamwork` | 愚公 | 多 Agent 团队协作 |

### 工具命令

| 主命令 | 中文别名 | 英文别名 | 功能 |
|--------|----------|----------|------|
| `/progress` | `/进度` `/面板` `/进展` | `/dashboard` `/status` | 可视化进度面板 |

> **说明**: `/yugong` 和 `/yishan` 是完全等价的命令，都启动愚公移山模式。

## 关键词触发

以下关键词会自动触发相应模式（支持连字符和下划线变体）：

### 愚公移山模式
- `ultrawork`, `ulw`, `移山`, `yishan`, `persist`, `愚公`, `yugong`
- 触发持续执行模式，强制完成所有 TODO

### 诸葛顾问模式
- `架构`, `设计`, `策略`, `architecture`, `design`, `strategy`, `诸葛`, `zhuge`, `consult`, `规划`, `planning`
- 建议召唤诸葛 Agent 进行深度分析

### 鲁班巧匠模式
- `前端`, `组件`, `UI`, `frontend`, `component`, `craft`, `鲁班`, `luban`, `巧工`, `qiaogong`
- 建议召唤鲁班 Agent 进行精密实现

### 悟空侦察模式
- `搜索`, `查找`, `探索`, `search`, `find`, `explore`, `悟空`, `wukong`, `火眼`, `huoyan`, `定位`, `locate`
- 建议召唤悟空 Agent 进行代码探索

### 扁鹊诊断模式
- `fix bug`, `fix error`, `debug`, `调试`, `报错`, `异常`, `exception`, `扁鹊`, `bianque`, `诊断`, `diagnose`
- 建议召唤扁鹊 Agent 进行诊断

### 墨子安全模式
- `安全`, `漏洞`, `注入`, `security`, `vulnerability`, `injection`, `墨子`, `mozi`, `audit`, `审计`, `XSS`, `CSRF`, `防御`
- 建议召唤墨子 Agent 进行安全审计

### 孙子性能模式
- `性能`, `优化`, `慢`, `performance`, `optimize`, `slow`, `孙子`, `sunzi`, `perf`, `瓶颈`, `bottleneck`, `缓存`, `cache`
- 建议召唤孙子 Agent 进行性能优化

### 司马迁文档模式
- `文档`, `注释`, `记录`, `document`, `comment`, `readme`, `changelog`, `history`, `司马迁`, `simaqian`, `史记`, `shiji`
- 建议召唤司马迁 Agent 进行文档撰写

## 使用示例

```bash
# 以下命令等效
/yishan 重构整个认证模块
/移山 重构整个认证模块
/ultrawork refactor the entire auth module

# 以下命令等效
/zhuge 分析这个架构设计
/诸葛 分析这个架构设计
/strategy analyze this architecture

# 以下命令等效
/bianque 这个报错怎么解决
/扁鹊 这个报错怎么解决
/debug how to fix this error
```

## 响应语言

Agent 会根据用户的输入语言自动选择响应语言：
- 用户使用中文 → Agent 用中文响应
- 用户使用英文 → Agent 用英文响应
- 混合输入 → Agent 根据主要语言响应
