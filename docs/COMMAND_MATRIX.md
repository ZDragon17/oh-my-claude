# 命令与 Agent 对照表

> 快速了解 oh-my-claude 的所有命令及其对应关系

## 命令分类

oh-my-claude 的命令分为三类：

1. **Agent 命令** - 直接调用对应的专业 Agent
2. **别名命令** - 指向其他命令的快捷方式
3. **工具命令** - 特殊功能命令

---

## Agent 命令一览

| 命令 | Agent | 专长 | 适用场景 |
|------|-------|------|----------|
| `/yugong` | 愚公 | 主编排 | 大型复杂任务、需要多步骤完成的工作 |
| `/zhuge` | 诸葛 | 战略顾问 | 架构设计、技术选型、方案评估 |
| `/luban` | 鲁班 | 精工巧匠 | 代码实现、组件开发、精细编码 |
| `/wukong` | 悟空 | 代码侦察 | 快速探索代码库、定位文件、追踪依赖 |
| `/bianque` | 扁鹊 | Bug 诊断 | 错误诊断、问题定位、修复建议 |
| `/mozi` | 墨子 | 安全审计 | 安全漏洞检测、防御编程、合规检查 |
| `/sunzi` | 孙子 | 性能优化 | 性能分析、瓶颈定位、优化建议 |
| `/simaqian` | 司马迁 | 文档撰写 | 文档编写、变更记录、API 文档 |
| `/zhenghe` | 郑和 | API 集成 | 外部 API 对接、SDK 集成、接口设计 |
| `/zhangheng` | 张衡 | 系统监控 | 监控设计、日志分析、可观测性 |
| `/libing` | 李冰 | DevOps | CI/CD 配置、部署脚本、基础设施 |
| `/laozi` | 老子 | Clean Code | 代码简化、重构、消除冗余 |
| `/baozheng` | 包拯 | 测试专家 | 测试设计、TDD、测试覆盖 |
| `/weizheng` | 魏征 | 代码审查 | Code Review、规范检查、最佳实践 |
| `/cangjie` | 仓颉 | 数据库设计 | 数据库建模、SQL 优化、迁移脚本 |
| `/libai` | 李白 | 需求分析 | 需求提炼、用户故事、PRD 撰写 |
| `/gukaizhi` | 顾恺之 | UI/UX 设计 | 界面设计、交互优化、视觉美化 |
| `/change` | 嫦娥 | 云服务 | 云原生部署、Serverless、容器化 |
| `/lilou` | 离娄 | 多模态分析 | 图像识别、PDF 解析、视觉内容理解 |
| `/liubowen` | 刘伯温 | 计划审查 | TODO 审核、可行性评估、风险预警 |

---

## 别名命令对照

### 愚公移山模式别名

| 命令 | 指向 | 说明 |
|------|------|------|
| `/yishan` | `/yugong` | 愚公移山（中文） |
| `/ultrawork` | `/yugong` | 英文版（来自 oh-my-opencode） |
| `/ulw` | `/yugong` | ultrawork 简写 |
| `/persist` | `/yugong` | 持续执行模式 |

### 取消命令

| 命令 | 功能 |
|------|------|
| `/cancel-yishan` | 停止愚公移山循环 |
| `/cancel-ralph` | 停止 Ralph Loop 循环 |

---

## 工具命令

| 命令 | 功能 | 说明 |
|------|------|------|
| `/progress` | 进度面板 | 可视化展示当前任务进度 |
| `/team` | 团队协作 | 启动多 Agent 协作模式 |
| `/git` | Git 操作 | 智能 Git 提交、分支管理 |
| `/ralph-loop` | Ralph 循环 | 自引用开发循环（来自 Anthropic） |
| `/init-deep` | 深度初始化 | 全面分析项目，生成工作计划 |
| `/start-work` | 开始工作流 | 从 Issue/需求开始完整工作流程 |
| `/refactor` | 重构 | 安全的代码重构模板 |

---

## 如何选择正确的命令？

### 按任务类型选择

```
我要做什么？
│
├── 大型任务（多步骤、复杂）
│   └── /yishan 或 /yugong
│
├── 需要设计/规划
│   └── /zhuge
│
├── 写代码
│   ├── 前端/UI → /gukaizhi 或 /luban
│   ├── 后端/API → /luban 或 /zhenghe
│   └── 数据库 → /cangjie
│
├── 修 Bug
│   └── /bianque
│
├── 代码质量
│   ├── 审查 → /weizheng
│   ├── 简化 → /laozi
│   ├── 安全 → /mozi
│   └── 性能 → /sunzi
│
├── 测试
│   └── /baozheng
│
├── 文档
│   └── /simaqian
│
├── 运维/部署
│   ├── DevOps → /libing
│   └── 云服务 → /change
│
├── 探索代码
│   └── /wukong
│
└── 分析图片/PDF
    └── /lilou
```

### 按工作阶段选择

| 阶段 | 推荐命令 |
|------|----------|
| 需求分析 | `/libai` |
| 架构设计 | `/zhuge` |
| 代码探索 | `/wukong` |
| 编码实现 | `/luban`, `/gukaizhi` |
| 测试验证 | `/baozheng` |
| 代码审查 | `/weizheng` |
| 性能优化 | `/sunzi` |
| 文档编写 | `/simaqian` |
| 部署上线 | `/libing`, `/change` |

---

## 命令组合示例

### 示例 1：新功能开发

```bash
# 1. 分析需求
/libai 我需要实现用户登录功能

# 2. 设计架构
/zhuge 用户认证系统如何设计？

# 3. 启动完整开发流程
/yishan 实现用户登录功能，包括前后端
```

### 示例 2：修复复杂 Bug

```bash
# 1. 诊断问题
/bianque TypeError: Cannot read property 'name' of undefined

# 2. 探索相关代码
/wukong 找到所有使用 user.name 的地方

# 3. 修复并验证
/yishan 修复 user.name 空指针问题并添加测试
```

### 示例 3：代码重构

```bash
# 1. 评估现状
/wukong 分析 UserService 的代码结构

# 2. 规划重构
/zhuge 这个服务应该如何拆分？

# 3. 简化代码
/laozi 简化 UserService 中的重复逻辑

# 4. 审查结果
/weizheng 审查重构后的代码
```

---

## 快速参考卡

```
┌─────────────────────────────────────────────────────────┐
│  oh-my-claude 命令速查                                   │
├─────────────────────────────────────────────────────────┤
│  大任务    /yishan    │  探索     /wukong               │
│  架构      /zhuge     │  诊断     /bianque              │
│  实现      /luban     │  测试     /baozheng             │
│  UI/UX    /gukaizhi   │  审查     /weizheng             │
│  API      /zhenghe    │  安全     /mozi                 │
│  数据库   /cangjie    │  性能     /sunzi                │
│  文档     /simaqian   │  简化     /laozi                │
│  DevOps   /libing     │  云服务   /change               │
│  需求     /libai      │  图像     /lilou                │
│  进度     /progress   │  计划审查 /liubowen             │
└─────────────────────────────────────────────────────────┘
```
