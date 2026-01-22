---
name: bilingual
description: |
  中英双语支持技能 - 使 Agent 能够理解和响应中英文命令。
  精简别名设计，降低认知负荷。
---

# 中英双语命令支持

本技能提供 oh-my-claude 的中英双语命令映射支持。

## 别名设计原则

为降低用户认知负荷，采用 **精简别名** 策略：

1. **主命令**: 拼音名（如 `/yishan`）
2. **中文别名**: 1个核心中文名（如 `/愚公`）
3. **英文别名**: 1个最常用功能词（如 `/persist`）

> 💡 记住规则：**拼音 + 中文 + 功能词** = 最多3个别名

## 命令映射表（精简版）

### Agent 命令

| 主命令 | 中文 | 英文 | Agent | 功能 |
| ------ | ---- | ---- | ----- | ---- |
| `/yishan` | `/愚公` | `/persist` | 愚公 | 大任务持续执行 |
| `/zhuge` | `/诸葛` | `/strategy` | 诸葛 | 架构设计 |
| `/luban` | `/鲁班` | `/craft` | 鲁班 | 代码实现 |
| `/wukong` | `/悟空` | `/explore` | 悟空 | 代码探索 |
| `/bianque` | `/扁鹊` | `/debug` | 扁鹊 | Bug 诊断 |
| `/mozi` | `/墨子` | `/security` | 墨子 | 安全审计 |
| `/sunzi` | `/孙子` | `/perf` | 孙子 | 性能优化 |
| `/simaqian` | `/司马迁` | `/doc` | 司马迁 | 文档撰写 |
| `/zhenghe` | `/郑和` | `/api` | 郑和 | API 集成 |
| `/zhangheng` | `/张衡` | `/monitor` | 张衡 | 系统监控 |
| `/libing` | `/李冰` | `/devops` | 李冰 | DevOps |
| `/laozi` | `/老子` | `/simplify` | 老子 | Clean Code |
| `/baozheng` | `/包拯` | `/test` | 包拯 | 测试设计 |
| `/weizheng` | `/魏征` | `/review` | 魏征 | 代码审查 |
| `/cangjie` | `/仓颉` | `/db` | 仓颉 | 数据库设计 |
| `/libai` | `/李白` | `/requirements` | 李白 | 需求分析 |
| `/gukaizhi` | `/顾恺之` | `/ui` | 顾恺之 | UI/UX 设计 |
| `/change` | `/嫦娥` | `/cloud` | 嫦娥 | 云原生 |
| `/lilou` | `/离娄` | `/vision` | 离娄 | 多模态分析 |
| `/liubowen` | `/刘伯温` | `/audit-plan` | 刘伯温 | 计划审查 |

### 工具命令

| 主命令 | 中文 | 英文 | 功能 |
| ------ | ---- | ---- | ---- |
| `/do` | `/做` | `/just` | 极简万能入口 |
| `/what` | `/想` | `/intent` | 意图识别推荐 |
| `/suggest` | `/推荐` | `/recommend` | 智能命令推荐 |
| `/quickfix` | `/急救` | `/fix` | 快速修复入口 |
| `/recipes` | `/场景` | `/cookbook` | 场景使用指南 |
| `/cheatsheet` | `/速查` | `/quickref` | 快速参考卡 |
| `/progress` | `/进度` | `/dashboard` | 进度面板 |
| `/team` | `/协作` | `/teamwork` | 团队协作 |
| `/help` | `/帮助` | `/commands` | 命令帮助 |

### 兼容别名（向后兼容）

以下别名保留向后兼容，但不再推荐使用：

```text
/yugong → 请使用 /yishan
/ultrawork, /ulw → 请使用 /persist
/longzhong → 请使用 /strategy
/qiaogong → 请使用 /craft
/huoyan → 请使用 /explore
/wangwen → 请使用 /debug
```

## 关键词触发

以下关键词会自动建议使用相应 Agent：

### 任务执行

- `大任务`, `持续`, `完成所有`, `ultrawork` → 建议 `/yishan`

### 设计规划

- `架构`, `设计`, `strategy`, `planning` → 建议 `/zhuge`

### 代码实现

- `实现`, `组件`, `前端`, `craft` → 建议 `/luban`

### 问题诊断

- `bug`, `报错`, `error`, `debug` → 建议 `/bianque`

### 代码探索

- `找`, `搜索`, `explore`, `locate` → 建议 `/wukong`

### 质量保障

- `安全`, `security`, `漏洞` → 建议 `/mozi`
- `性能`, `perf`, `慢`, `优化` → 建议 `/sunzi`
- `测试`, `test`, `TDD` → 建议 `/baozheng`
- `审查`, `review`, `CR` → 建议 `/weizheng`

### 专项领域

- `文档`, `doc`, `README` → 建议 `/simaqian`
- `API`, `接口`, `集成` → 建议 `/zhenghe`
- `数据库`, `SQL`, `db` → 建议 `/cangjie`
- `监控`, `日志`, `monitor` → 建议 `/zhangheng`
- `DevOps`, `CI/CD`, `部署` → 建议 `/libing`
- `云`, `serverless`, `Lambda` → 建议 `/change`
- `需求`, `用户故事` → 建议 `/libai`
- `UI`, `UX`, `界面` → 建议 `/gukaizhi`
- `简洁`, `重构`, `clean code` → 建议 `/laozi`

## 使用示例

```bash
# 推荐用法（简洁明了）
/yishan 重构整个认证模块
/bianque TypeError: Cannot read property 'name'
/zhuge 设计微服务架构

# 中文用户
/愚公 实现用户登录功能
/扁鹊 这个报错怎么解决

# 英文用户
/persist implement user authentication
/debug fix this error
```

## 响应语言

Agent 会根据用户的输入语言自动选择响应语言：

- 用户使用中文 → Agent 用中文响应
- 用户使用英文 → Agent 用英文响应
- 混合输入 → Agent 根据主要语言响应
