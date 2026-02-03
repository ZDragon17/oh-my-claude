# 命令别名说明

oh-my-claude 提供了丰富的命令别名系统，让用户可以用自己熟悉的方式调用命令。

## 为什么有别名？

1. **双语支持** - 中文用户和英文用户都能自然使用
2. **习惯适配** - 不同背景的用户有不同的习惯用语
3. **快捷输入** - 短别名减少输入量

---

## 别名分类

### 1. 五大执行模式

oh-my-claude 提供五种执行模式，适用于不同场景：

| 主命令 | 别名 | 模式 | 特点 |
|--------|------|------|------|
| `/yishan` | `/yugong`, `/persist`, `/ultrawork`, `/ulw` | 愚公移山 | 标准自主执行，智能分派 |
| `/chaoji` | `/ultrapilot`, `/up`, `/parallel-build` | 超级模式 | 文件分区并行，5x 加速 |
| `/jiejian` | `/ecomode`, `/eco`, `/budget` | 节俭模式 | Token 高效，优先 Haiku |
| `/fengqun` | `/swarm`, `/sw` | 蜂群模式 | 多 Agent 共享任务池 |
| `/huoshen` | `/deepwork`, `/dw`, `/hephaestus`, `/火神` | 深度工作 | 目标导向，探索优先 |

**使用建议**：
- 一般任务 → `/yishan`
- 多模块并行 → `/chaoji`
- 省 Token → `/jiejian`
- 批量同类任务 → `/fengqun`
- 复杂深度任务 → `/huoshen`

---

### 2. Agent 命令别名

每个 Agent 都有中英文别名：

| Agent | 主命令 | 中文别名 | 英文别名 |
|-------|--------|----------|----------|
| 诸葛 | `/zhuge` | `/longzhong` | `/strategy`, `/consult` |
| 扁鹊 | `/bianque` | `/wangwen` | `/debug`, `/diagnose` |
| 悟空 | `/wukong` | `/huoyan` | `/explore`, `/scout` |
| 鲁班 | `/luban` | `/qiaogong` | `/craft`, `/frontend` |
| 墨子 | `/mozi` | - | `/security`, `/audit` |
| 孙子 | `/sunzi` | - | `/perf`, `/performance` |
| 司马迁 | `/simaqian` | `/shiji` | `/doc`, `/document` |
| 包拯 | `/baozheng` | - | `/test` |
| 魏征 | `/weizheng` | - | `/review` |
| 老子 | `/laozi` | `/zhijian` | `/simplify` |
| 仓颉 | `/cangjie` | - | `/db`, `/database` |
| 李白 | `/libai` | `/poet` | `/requirements` |
| 顾恺之 | `/gukaizhi` | `/painter` | `/ui`, `/ux` |
| 嫦娥 | `/change` | `/moon` | `/cloud`, `/serverless` |
| 郑和 | `/zhenghe` | - | `/api` |
| 张衡 | `/zhangheng` | - | `/monitor` |
| 李冰 | `/libing` | - | `/devops` |
| 离娄 | `/lilou` | - | `/looker`, `/multimodal` |
| 刘伯温 | `/liubowen` | - | `/momus`, `/review-plan` |

---

### 3. 工具命令别名

| 主命令 | 别名 | 说明 |
|--------|------|------|
| `/help` | `/帮助` | 命令帮助 |
| `/agents` | `/专家`, `/team-list` | Agent 列表 |
| `/suggest` | `/推荐`, `/recommend` | 智能推荐 |
| `/cheatsheet` | `/速查`, `/quickref` | 速查表 |
| `/what` | `/想`, `/intent` | 意图识别 |
| `/quickfix` | `/急救`, `/fix` | 快速修复 |
| `/recipes` | `/场景`, `/cookbook` | 场景指南 |
| `/map` | `/命令图`, `/关系图` | 命令关系图 |
| `/verify` | `/check`, `/验证`, `/检查` | 安装验证 |
| `/expert` | `/pro`, `/专家`, `/简洁` | 专家模式 |
| `/progress` | `/进度`, `/dashboard` | 进度面板 |
| `/git` | `/commit`, `/pr`, `/branch` | Git 操作 |
| `/refactor` | `/rf`, `/restructure` | 重构助手 |

---

### 4. 错误恢复命令别名

| 主命令 | 别名 | 说明 |
|--------|------|------|
| `/retry` | `/重试` | 重试失败操作 |
| `/skip` | `/跳过` | 跳过当前步骤 |
| `/rollback` | `/回滚` | 回滚到上个状态 |
| `/stuck` | `/卡住` | 卡住恢复中心 |

---

### 5. 工作流控制别名

| 主命令 | 别名 | 说明 |
|--------|------|------|
| `/pause` | `/暂停` | 暂停任务 |
| `/yishan-resume` | `/恢复` | 恢复任务 |
| `/cancel-yishan` | `/stop-yishan`, `/stop-loop` | 取消任务 |
| `/ralph-loop` | `/ralph`, `/loop` | Ralph 循环 |
| `/cancel-ralph` | `/stop-ralph` | 取消 Ralph |
| `/interrupt` | `/紧急` | 紧急任务插入 |

---

## 如何选择命令？

### 新用户推荐

1. **万能入口**: `/do [任务]` - 不知道用什么就用这个
2. **获取帮助**: `/help [关键词]`
3. **查看专家**: `/agents`

### 进阶用户推荐

按场景记住核心命令即可：

- **做事**: `/yishan` (大任务) 或 `/luban` (单功能)
- **找问题**: `/wukong` (探索) 或 `/bianque` (诊断)
- **检查质量**: `/weizheng` (审查) 或 `/baozheng` (测试)
- **写文档**: `/simaqian`
- **设计架构**: `/zhuge`

### 专家用户推荐

启用专家模式减少提示：
```
/expert on
```

---

## 别名冲突说明

某些别名在不同上下文可能有歧义：

| 别名 | 可能含义 | 实际绑定 |
|------|----------|----------|
| `/debug` | 调试 | → `/bianque` (Bug诊断) |
| `/test` | 测试 | → `/baozheng` (测试专家) |
| `/frontend` | 前端 | → `/luban` (代码实现) |
| `/ui` | 界面 | → `/gukaizhi` (UI设计) |

如有歧义，使用主命令名更清晰。

---

## 自定义别名

目前不支持用户自定义别名。如有需求，请提交 Issue：
https://github.com/ZDragon17/oh-my-claude/issues

---

## 相关文档

- [命令关系图](/map) - 可视化命令关系
- [速查表](/cheatsheet) - 常用命令速查
- [帮助中心](/help) - 搜索命令
