#!/usr/bin/env bash
# 关键词检测器 - UserPromptSubmit Hook
# 检测用户输入中的关键词并注入相应的上下文
#
# v2.0.2 优化：
# - 调整检测顺序，专业关键词优先
# - 缩窄悟空触发范围，避免过度触发
# - 添加更精确的上下文判断

# 依赖检查 - jq 是可选的，没有也能工作
has_jq=0
if command -v jq > /dev/null 2>&1; then
    has_jq=1
fi

# 读取 stdin 中的 JSON 数据（带超时保护）
input=$(cat 2>/dev/null) || input=""

# 空输入检查
if [ -z "$input" ]; then
    exit 0
fi

# 提取用户提示
if [ "$has_jq" -eq 1 ]; then
    prompt=$(echo "$input" | jq -r '.prompt // empty' 2>/dev/null) || prompt=""
else
    # 简单的字符串提取作为回退
    prompt=$(echo "$input" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' 2>/dev/null) || prompt=""
fi

if [ -z "$prompt" ]; then
    exit 0
fi

# 转换为小写进行匹配（带错误保护）
prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]' 2>/dev/null) || prompt_lower="$prompt"

# ============================================================================
# 第零优先级：停止/取消请求（用户明确要停止时）
# ============================================================================

# 检测用户想要停止当前任务
# 注意：只在有活跃循环时才提供停止指引，否则不干扰
if echo "$prompt_lower" | grep -qE '^(停止|取消|stop|cancel|不要了|算了|别做了|停下来|暂停|中断)$' || \
   echo "$prompt_lower" | grep -qE '(停止.{0,5}(任务|执行|循环|工作)|取消.{0,5}(任务|执行|yishan|愚公)|stop.{0,5}(task|work|loop)|cancel.{0,5}(task|yishan))'; then
    # 检查是否有活跃的愚公循环
    if [ -f ".claude/yishan-loop.local.md" ] || [ -f ".claude/ralph-loop.local.md" ]; then
        cat << 'EOF'
{
  "systemMessage": "\n\n🛑 **检测到停止请求**\n\n当前有活跃的愚公移山任务。\n\n**停止方式**:\n1. 执行: `rm -f .claude/yishan-loop.local.md`\n2. 然后说"任务已取消"\n\n**或者**:\n- 如果任务快完成了，可以继续等待\n- 使用 `/pause` 暂停并保存进度\n\n⚠️ 停止后当前进度会保留，可以稍后用 `/yishan-resume` 恢复。\n"
}
EOF
        exit 0
    fi
fi

# ============================================================================
# 第一优先级：四大执行模式智能路由
# v2.2.0: 根据任务特征自动选择最佳执行模式
# ============================================================================

# ---- /auto 智能模式命令 (显式触发) ----
# 用户明确使用 /auto 或 /smart 命令时，输出智能模式引导
# 支持带参数 (/auto 任务) 和不带参数 (/auto) 两种情况
if echo "$prompt_lower" | grep -qE '^[[:space:]]*/?(auto|smart|zhineng|智能模式)([[:space:]]|$)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<auto-mode>\n🤖 **智能自动模式已激活！**\n\n正在分析任务特征，自动选择最佳执行模式...\n\n## 模式选择规则\n\n| 检测特征 | 选择模式 |\n|----------|----------|\n| 多组件/全栈/微服务 | ⚡ 超级模式 |\n| 批量/所有/每个 | 🐝 蜂群模式 |\n| 简单/省token/haiku | 💰 节俭模式 |\n| 其他 | ⛰️ 标准模式 |\n\n## 开始分析任务...\n\n请描述你的任务，我会自动选择最佳执行策略。\n</auto-mode>\n"
}
EOF
    exit 0
fi

# ---- 超级模式检测 (Ultrapilot) ----
# 特征：多组件、并行、全栈、多模块、微服务
ultrapilot_mode=false
if echo "$prompt_lower" | grep -qE '(ultrapilot|chaoji|超级模式|up模式)'; then
    ultrapilot_mode=true
elif echo "$prompt_lower" | grep -qE '(全栈|fullstack|full[-_]?stack).{0,15}(应用|项目|系统|app)' || \
     echo "$prompt_lower" | grep -qE '(前端|后端|数据库|测试|文档).{0,5}(和|与|,|、).{0,5}(前端|后端|数据库|测试|文档)' || \
     echo "$prompt_lower" | grep -qE '(多模块|多组件|多服务|多个模块|多个组件|多个服务|multiple.{0,5}(module|component|service))' || \
     echo "$prompt_lower" | grep -qE '(构建|创建|开发|实现).{0,10}(完整|整个|全部).{0,10}(应用|系统|项目)' || \
     echo "$prompt_lower" | grep -qE '(frontend|backend|database|test).{0,5}(and|&|,).{0,5}(frontend|backend|database|test)' || \
     echo "$prompt_lower" | grep -qE '(微服务|microservice|分布式|distributed).{0,10}(架构|系统|应用|architecture)' || \
     echo "$prompt_lower" | grep -qE '(monorepo|mono[-_]?repo|工作区|workspace).{0,10}(项目|应用)'; then
    ultrapilot_mode=true
fi

if [ "$ultrapilot_mode" = true ]; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<ultrapilot-mode>\n⚡ **超级模式 (Ultrapilot) 已激活！**\n\n[并行执行 - 最多 5 倍加速]\n\n## 为什么选择此模式\n检测到多组件/多模块任务，适合并行执行。\n\n## 执行策略\n\n### 阶段 1: 任务分解\n将任务拆分为独立子任务，每个子任务分配独占文件区域：\n```\nWorker 1 (鲁班):   src/api/**     (后端)\nWorker 2 (顾恺之): src/ui/**      (前端)\nWorker 3 (仓颉):   src/db/**      (数据库)\nWorker 4 (司马迁): docs/**        (文档)\nWorker 5 (包拯):   tests/**       (测试)\n```\n\n### 阶段 2: 并行执行\n使用 Task 工具生成最多 5 个 Worker，设置 `run_in_background: true`\n\n### 阶段 3: 整合验证\n顺序处理共享文件，验证系统完整性\n\n## 委派规则 (强制)\n**你是协调者，不是实现者。**\n- ✓ 分解任务、分区文件、生成 Worker、追踪进度\n- ✗ 绝不直接写代码（委派给专家 Worker）\n\n## 完成标志\n```\n<promise>ULTRAPILOT_COMPLETE</promise>\n```\n\n**开始并行执行...**\n</ultrapilot-mode>\n"
}
EOF
    exit 0
fi

# ---- 蜂群模式检测 (Swarm) ----
# 特征：批量、所有、N个同类任务
swarm_mode=false
swarm_count=""
swarm_agent=""
if echo "$prompt_lower" | grep -qE '(fengqun|swarm|蜂群模式)'; then
    swarm_mode=true
    # 尝试提取 N:agent 格式
    # 支持所有主要 Agent: 鲁班/顾恺之/包拯/扁鹊/墨子/司马迁/仓颉/诸葛/悟空/孙子/老子/魏征/祖冲之/狄仁杰/大禹
    swarm_params=$(echo "$prompt_lower" | grep -oE '[0-9]+:(luban|gukaizhi|baozheng|bianque|mozi|simaqian|cangjie|zhuge|wukong|sunzi|laozi|weizheng|scientist|qa-tester|build-fixer|鲁班|顾恺之|包拯|扁鹊|墨子|司马迁|仓颉|诸葛|悟空|孙子|老子|魏征|祖冲之|狄仁杰|大禹)' | head -1)
    if [ -n "$swarm_params" ]; then
        swarm_count=$(echo "$swarm_params" | cut -d: -f1)
        swarm_agent=$(echo "$swarm_params" | cut -d: -f2)
    fi
elif echo "$prompt_lower" | grep -qE '(修复|fix|添加|add|更新|update|检查|check|审计|audit).{0,5}(所有|全部|每个|all|every|each).{0,10}(文件|错误|组件|测试|类型|type|file|component|error)' || \
     echo "$prompt_lower" | grep -qE '(所有|全部|每个|all|every|each).{0,5}(文件|错误|组件|测试|类型).{0,5}(修复|fix|添加|add|更新|update)' || \
     echo "$prompt_lower" | grep -qE '(批量|batch).{0,10}(修复|处理|更新|添加|fix|process|update|add)' || \
     echo "$prompt_lower" | grep -qE '(为|给|对).{0,5}(所有|全部|每个).{0,10}(添加|实现|写|编写)'; then
    swarm_mode=true
fi

if [ "$swarm_mode" = true ]; then
    if [ -n "$swarm_count" ] && [ -n "$swarm_agent" ]; then
        cat << EOF
{
  "systemMessage": "\n\n<swarm-mode>\n🐝 **蜂群模式 (Swarm) 已激活！**\n\n[${swarm_count} 个 ${swarm_agent} Agent 协作执行]\n\n## 执行策略\n\n### 1. 任务分解\n将任务拆分为文件级子任务，创建共享任务池\n\n### 2. 生成 ${swarm_count} 个 ${swarm_agent} Agent\n每个 Agent 自动从任务池认领任务，完成后认领下一个\n\n### 3. 原子认领机制\n- 每个任务仅被一个 Agent 认领\n- 心跳监控检测死亡 Agent\n- 超时任务自动释放\n\n### 4. 进度追踪\n实时显示：pending/claimed/done/failed 计数\n\n## 启动蜂群...\n\n**众人拾柴火焰高！**\n</swarm-mode>\n"
}
EOF
    else
        cat << 'EOF'
{
  "systemMessage": "\n\n<swarm-mode>\n🐝 **蜂群模式 (Swarm) 已激活！**\n\n[多 Agent 协作执行批量任务]\n\n## 为什么选择此模式\n检测到批量/同类任务，适合多 Agent 并行处理。\n\n## 执行策略\n\n### 1. 分析任务\n确定子任务数量和类型，选择合适的 Agent 类型\n\n### 2. 推荐配置\n| 任务类型 | Agent | 数量 |\n|----------|-------|------|\n| 修复错误 | luban | 3-5 |\n| UI组件 | gukaizhi | 2-4 |\n| 测试编写 | baozheng | 2-3 |\n| 安全审计 | mozi | 2-4 |\n| 文档 | simaqian | 2-3 |\n\n### 3. 生成蜂群\n使用 Task 工具并行启动 N 个同类 Agent\n\n### 4. 监控与整合\n追踪进度，汇总结果\n\n## 使用示例\n```\n/fengqun 5:luban \"修复所有 TypeScript 错误\"\n/fengqun 3:baozheng \"为所有服务添加单元测试\"\n```\n\n**开始蜂群协作...**\n</swarm-mode>\n"
}
EOF
    fi
    exit 0
fi

# ---- 节俭模式检测 (Ecomode) ----
# 特征：简单任务、成本敏感、省token
ecomode=false
if echo "$prompt_lower" | grep -qE '(ecomode|jiejian|节俭模式|eco模式)'; then
    ecomode=true
elif echo "$prompt_lower" | grep -qE '(省[[:space:]]*token|省钱|便宜|budget|cheap|低成本|cost.{0,5}(save|efficient)|token.{0,5}(save|efficient))' || \
     echo "$prompt_lower" | grep -qE '(简单|快速|小改动|小修改|simple|quick|minor|small).{0,10}(任务|改动|修复|功能)' || \
     echo "$prompt_lower" | grep -qE '(不要|别|禁止|avoid).{0,5}(opus|高级|expensive)' || \
     echo "$prompt_lower" | grep -qE '(用[[:space:]]*haiku|优先[[:space:]]*haiku|haiku.{0,5}(first|优先))'; then
    ecomode=true
fi

if [ "$ecomode" = true ]; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<ecomode>\n💰 **节俭模式 (Ecomode) 已激活！**\n\n[Token 高效执行 - 节省 30-50%]\n\n## 为什么选择此模式\n检测到成本敏感需求或简单任务，适合使用低成本模型。\n\n## 智能模型路由\n\n| 任务类型 | 首选 (Haiku) | 备选 (Sonnet) |\n|---------|-------------|---------------|\n| 代码探索 | wukong | - |\n| 简单实现 | luban-low | luban |\n| 前端组件 | gukaizhi-low | gukaizhi |\n| 测试编写 | baozheng-low | baozheng |\n| 文档更新 | simaqian | - |\n| Bug诊断 | bianque-low | bianque |\n\n## 执行原则\n1. **默认 LOW** - Haiku Agent 优先\n2. **按需升级** - 复杂度需要才用 Sonnet\n3. **避免 HIGH** - Opus 仅在规划时使用\n\n## 委派规则 (强制)\n**你是编排者，不是实现者。**\n- ✓ 读取文件、追踪进度、生成 Agent\n- ✗ 绝不直接写代码（委派给 xxx-low Agent）\n\n## 完成标志\n```\n<promise>ECOMODE_COMPLETE</promise>\n```\n\n**一粥一饭，当思来之不易。**\n</ecomode>\n"
}
EOF
    exit 0
fi

# ---- 标准愚公模式 (默认) ----
# 显式触发词（命令式）
explicit_yishan=false
if echo "$prompt_lower" | grep -qE '(ultra[-_]?work|ulw|移山|yi[-_]?shan|persist|愚公|yu[-_]?gong)'; then
    explicit_yishan=true
fi

# 隐式触发词（自然语言表达大任务意图）
# v2.1.15: 大幅扩展自然语言触发范围
implicit_yishan=false

# 模式1: [动词] + [功能/模块/系统等]
if echo "$prompt_lower" | grep -qE '(实现|开发|创建|构建|搭建|完成|做|写|build|implement|create|develop|make).{0,10}(功能|模块|系统|页面|组件|服务|接口|feature|module|system|page|component|service|api)'; then
    implicit_yishan=true
fi

# 模式2: 重构/重写/升级/迁移（不再要求"整个/全部"修饰）
if echo "$prompt_lower" | grep -qE '(重构|重写|升级|迁移|改造|refactor|rewrite|upgrade|migrate|overhaul)'; then
    implicit_yishan=true
fi

# 模式3: 帮我/请/给我 + 动词
if echo "$prompt_lower" | grep -qE '(帮我|请|给我|help me|please).{0,5}(实现|开发|创建|写|做|重构|完成|build|implement|create|develop|make|refactor)'; then
    implicit_yishan=true
fi

# 模式4: 添加/新增 + 功能/模块
if echo "$prompt_lower" | grep -qE '(添加|新增|加入|增加|add|new).{0,5}(功能|模块|特性|feature|module)'; then
    implicit_yishan=true
fi

# 模式5: 批量/循环/全面操作 - 需要与动作词组合，避免误触发
# 修复：单独的"批量"、"全部"等太宽泛，改为需要上下文组合
if echo "$prompt_lower" | grep -qE '(批量|全面|全部|所有|整个|一次性|统一|batch|entire|whole|comprehensive).{0,5}(处理|修改|重构|更新|替换|删除|添加|检查|修复|迁移|升级)' || \
   echo "$prompt_lower" | grep -qE '(处理|修改|重构|更新|替换|删除|添加|检查|修复|迁移|升级).{0,5}(所有|全部|整个|所有的|全部的)' || \
   echo "$prompt_lower" | grep -qE '循环.{0,5}(执行|处理|遍历|迭代)' || \
   echo "$prompt_lower" | grep -qE '(loop|iterate).{0,10}(through|over|all)'; then
    implicit_yishan=true
fi

# 模式6: 完善/优化/改进 + 功能/代码/项目
if echo "$prompt_lower" | grep -qE '(完善|优化|改进|改善|提升|enhance|improve|optimize).{0,10}(功能|代码|项目|模块|系统|feature|code|project|module|system)'; then
    implicit_yishan=true
fi

# 模式7: 多步骤任务暗示词
if echo "$prompt_lower" | grep -qE '(从头|从零|完整|端到端|一步步|逐步|step by step|end.to.end|from scratch|完整地)'; then
    implicit_yishan=true
fi

# 模式8: 工程化/系统化任务
if echo "$prompt_lower" | grep -qE '(工程化|系统化|标准化|规范化|自动化|engineering|systematic|standardize|normalize|automate)'; then
    implicit_yishan=true
fi

# 模式9: 明确的大任务词汇
if echo "$prompt_lower" | grep -qE '(大任务|大工程|大改动|big task|major change|major update|大规模)'; then
    implicit_yishan=true
fi

if [ "$explicit_yishan" = true ] || [ "$implicit_yishan" = true ]; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<ultrawork-mode>\n🏔️ **愚公移山模式已激活！**\n\n[CODE RED] 最高精度要求。行动前深度思考。\n\n## 执行规则（非协商）\n\n### 1. TODO 强制执行\n- 必须使用 TodoWrite 分解任务\n- 完成一个就标记一个\n- TODO 未全部完成前不能停止\n\n### 2. 并行执行\n- 独立任务应并行发起 background_task\n- 不要顺序等待，浪费时间\n\n### 3. 验证保证\n- 没有证据 = 没有完成\n- 运行测试/构建，展示输出\n\n### 4. 零容忍\n- 禁止范围缩减（不做 demo/简化版）\n- 禁止部分完成（100% 或不做）\n- 禁止提前停止（TODO 全完成后才能停）\n\n### 5. 自检机制\n每次准备停止前：\n1. 读取 TODO 列表\n2. 检查有无 pending/in_progress\n3. 有 → 继续工作\n4. 全完成 → 可以停止\n\n**愚公精神：坚持必将成功！**\n</ultrawork-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第二优先级：团队协作（多Agent场景）
# ============================================================================

if echo "$prompt_lower" | grep -qE '(团队|协作|合作|teamwork|team[-_]?work|collaborate|协同|多人|多agent)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🤝 **团队协作提示**\n\n检测到协作相关需求，建议：\n- 使用 /team 命令启动团队协作模式\n- 愚公将作为主编排者，协调各专家共同完成任务\n- 支持调用：@wukong @zhuge @luban @bianque @mozi @sunzi\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第三优先级：调试/诊断类（紧急问题处理）
# v2.1.13: 直接激活扁鹊诊断模式，无需再输入命令
# ============================================================================

# 检测调试关键词 - 优先处理紧急问题
# v2.1.15: 大幅扩展自然语言触发
if echo "$prompt_lower" | grep -qE '(fix.{0,20}(bug|error)|debug|调试|报错|异常|exception|扁鹊|bianque|诊断|diagnose|crash|崩溃|挂了|不工作|not working|为什么.{0,10}(报错|失败|出错)|怎么.{0,5}(修|解决)|这个.{0,5}(错误|bug|问题))' || \
   echo "$prompt_lower" | grep -qE '(出问题|有问题|出bug|有bug|坏了|broken|failed|失败|error|错误|故障|issue|问题是)' || \
   echo "$prompt_lower" | grep -qE '(运行不了|跑不起来|启动不了|打不开|无法运行|无法启动|cannot run|won.t start)' || \
   echo "$prompt_lower" | grep -qE '(红色|报红|飘红|红线|红字)' || \
   echo "$prompt_lower" | grep -qE '(修一下|修复一下|看看怎么回事|看看什么问题|帮我看看)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<bianque-mode>\n🩺 **扁鹊诊断模式已激活！**\n\n## 望闻问切诊断流程\n\n### 1. 望 - 观察错误表象\n- 仔细阅读错误信息\n- 记录错误类型、位置、调用栈\n\n### 2. 闻 - 收集上下文\n- 检查相关代码文件\n- 了解最近的改动\n- 查看环境配置\n\n### 3. 问 - 确认症状\n- 什么时候开始出现？\n- 是否可以复现？\n- 有哪些条件触发？\n\n### 4. 切 - 定位根因\n- 追踪调用链\n- 检查变量状态\n- 验证假设\n\n### 输出格式\n```\n📋 诊断报告\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔴 症状: [错误描述]\n🔍 根因: [分析结果]\n💊 处方: [修复方案]\n🛡️ 预防: [如何避免]\n```\n\n**请提供错误信息或描述问题，我来诊断。**\n</bianque-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第四优先级：安全类（高风险需谨慎）
# ============================================================================

# v2.1.15: 扩展安全相关触发词
if echo "$prompt_lower" | grep -qE '(安全|漏洞|注入|security|vulnerab|injection|墨子|mozi|audit|审计|xss|csrf|防御|渗透|pentest)' || \
   echo "$prompt_lower" | grep -qE '(攻击|hack|exploit|恶意|危险|风险|泄露|leak|暴露|expose)' || \
   echo "$prompt_lower" | grep -qE '(加密|解密|密码|认证|授权|encrypt|decrypt|password|auth)' || \
   echo "$prompt_lower" | grep -qE '(sql注入|跨站|越权|提权|privilege|owasp)' || \
   echo "$prompt_lower" | grep -qE '(安不安全|有没有漏洞|会不会被|是否安全)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<mozi-mode>\n🛡️ **墨子安全审计模式已激活！**\n\n## 兼爱非攻 - 防御性安全审计\n\n### 1. 输入验证\n- [ ] 所有用户输入已验证\n- [ ] SQL 注入防护（参数化查询）\n- [ ] XSS 防护（输出编码）\n- [ ] 命令注入防护\n\n### 2. 认证授权\n- [ ] 密码安全存储（bcrypt/argon2）\n- [ ] JWT/Session 安全配置\n- [ ] 权限检查完整性\n- [ ] CSRF 防护\n\n### 3. 数据安全\n- [ ] 敏感数据加密\n- [ ] 日志脱敏\n- [ ] 安全传输（HTTPS）\n\n### 4. 依赖安全\n- [ ] 无已知漏洞依赖\n- [ ] 依赖版本更新\n\n**请提供要审计的代码或描述安全需求。**\n</mozi-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第五优先级：测试类（质量保障）
# ============================================================================

# 优化：移除单独的"测试"/"test"，避免误触发
# "测试一下这个功能"不应触发测试模式
# 只有明确的测试开发需求才触发
# v2.1.15: 扩展测试相关触发词
if echo "$prompt_lower" | grep -qE '(单元测试|集成测试|unit[-_]?test|integration[-_]?test|tdd|jest|vitest|pytest|包拯|baozheng|开封|coverage|覆盖率|e2e|端到端|测试用例|test[-_]?case|测试覆盖|写测试|添加测试|补测试)' || \
   echo "$prompt_lower" | grep -qE '(写|添加|补充|增加|创建|补上).{0,5}测试' || \
   echo "$prompt_lower" | grep -qE '测试.{0,5}(用例|覆盖|框架|策略|代码)' || \
   echo "$prompt_lower" | grep -qE '(mock|stub|spy|断言|assert|expect|describe|it\(|test\()' || \
   echo "$prompt_lower" | grep -qE '(测试怎么写|怎么测试|如何测试|测试方案)' || \
   echo "$prompt_lower" | grep -qE '(没有测试|缺少测试|测试不够|需要测试)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<baozheng-mode>\n⚖️ **包拯测试模式已激活！**\n\n## 测试设计原则\n\n### 1. 测试金字塔\n- 🔺 单元测试 (70%) - 快速、隔离\n- 🔸 集成测试 (20%) - 组件交互\n- 🔹 E2E测试 (10%) - 完整流程\n\n### 2. 测试覆盖要求\n- 正常路径 (Happy Path)\n- 边界条件 (Boundary)\n- 异常情况 (Error Cases)\n- 空值处理 (Null/Undefined)\n\n### 3. TDD 流程\n1. 🔴 Red - 先写失败的测试\n2. 🟢 Green - 最小实现让测试通过\n3. 🔵 Refactor - 重构优化\n\n### 4. 测试命名\n```\nshould_[期望行为]_when_[条件]\n```\n\n**请告诉我要测试什么功能或代码。**\n</baozheng-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第六优先级：数据库类（数据为王）
# ============================================================================

# v2.1.15: 扩展数据库相关触发词
if echo "$prompt_lower" | grep -qE '(数据库|database|sql|表设计|索引|index|migration|mysql|postgresql|mongo|redis|仓颉|cangjie|造字|数据建模|schema|orm)' || \
   echo "$prompt_lower" | grep -qE '(建表|创建表|表结构|字段|column|主键|外键|primary|foreign)' || \
   echo "$prompt_lower" | grep -qE '(查询|select|insert|update|delete|join|where|group by)' || \
   echo "$prompt_lower" | grep -qE '(数据表|数据模型|实体关系|er图|erd)' || \
   echo "$prompt_lower" | grep -qE '(慢查询|查询优化|explain|执行计划)' || \
   echo "$prompt_lower" | grep -qE '(sqlite|mariadb|oracle|db2|dynamodb|firestore)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<cangjie-mode>\n📊 **仓颉数据库模式已激活！**\n\n## 观察规律，创造结构\n\n### 1. 数据建模原则\n- 实体识别与关系梳理\n- 范式化 vs 反范式化权衡\n- 主键/外键设计\n\n### 2. 表结构设计\n- 字段类型选择（精确匹配）\n- 约束定义（NOT NULL, UNIQUE, CHECK）\n- 默认值和自动填充\n\n### 3. 索引策略\n- 主键索引（自动）\n- 查询字段索引\n- 复合索引顺序\n- 覆盖索引优化\n\n### 4. 性能考量\n- 避免 SELECT *\n- 分页优化\n- 批量操作\n- 读写分离\n\n### 输出格式\n```sql\n-- 表结构 DDL\n-- 索引 DDL  \n-- 示例查询\n```\n\n**请描述你的数据需求或提供现有表结构。**\n</cangjie-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第七优先级：性能类（慢就是问题）
# ============================================================================

# 优化：移除单独的"优化"/"optimize"，避免误触发
# "优化样式"、"优化布局"不应触发性能模式
# 只有明确的性能相关词才触发
# v2.1.15: 扩展性能相关触发词
if echo "$prompt_lower" | grep -qE '(性能|慢|slow|孙子|sunzi|perf|瓶颈|bottleneck|内存|memory|cpu|加速|响应时间|latency|qps|tps|并发|concurrent)' || \
   echo "$prompt_lower" | grep -qE '优化.{0,5}(性能|速度|响应|延迟|内存|cpu|加载|渲染)' || \
   echo "$prompt_lower" | grep -qE '(性能|速度|响应|延迟|加载|渲染).{0,5}优化' || \
   echo "$prompt_lower" | grep -qE 'optimi[sz]e.{0,10}(performance|speed|memory|cpu|loading)' || \
   echo "$prompt_lower" | grep -qE '(performance|speed|memory|cpu|loading).{0,10}optimi[sz]' || \
   echo "$prompt_lower" | grep -qE '(太慢了|很慢|卡顿|卡住|hang|freeze|lag|延迟高)' || \
   echo "$prompt_lower" | grep -qE '(为什么慢|怎么这么慢|加载慢|响应慢|运行慢)' || \
   echo "$prompt_lower" | grep -qE '(提速|加快|快一点|更快|faster)' || \
   echo "$prompt_lower" | grep -qE '(内存泄漏|内存溢出|oom|out of memory|leak)' || \
   echo "$prompt_lower" | grep -qE '(profile|profiler|benchmark|压测|负载)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<sunzi-mode>\n⚔️ **孙子性能优化模式已激活！**\n\n## 知己知彼，百战不殆\n\n### 1. 侦察 - 性能分析\n- 定位慢操作（Profiler/DevTools）\n- 识别瓶颈类型（CPU/IO/Network/Memory）\n- 测量基准数据\n\n### 2. 谋略 - 优化策略\n\n**前端优化**:\n- 懒加载 / 代码分割\n- 虚拟滚动 / 分页\n- 缓存策略 / CDN\n- 图片优化 / WebP\n\n**后端优化**:\n- 数据库索引 / 查询优化\n- 缓存层（Redis/Memcached）\n- 连接池 / 批量操作\n- 异步处理 / 队列\n\n**算法优化**:\n- 时间复杂度降级\n- 空间换时间\n- 减少循环嵌套\n\n### 3. 验证 - 效果测量\n- 优化前后对比\n- 压力测试\n- 监控告警\n\n**请描述性能问题或提供要优化的代码。**\n</sunzi-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第八优先级：API/集成类
# ============================================================================

# 优化：移除单独的"接口"，避免误触发
# "接口报错了"应该触发扁鹊，不是郑和
# 只有明确的 API 开发/集成需求才触发
# v2.1.15: 扩展 API 相关触发词
if echo "$prompt_lower" | grep -qE '(api|集成|对接|integrate|webhook|sdk|rest[-_]?api|graphql|grpc|郑和|zhenghe|西洋|第三方|openapi|swagger|调用.{0,5}接口|接口.{0,5}(设计|开发|封装|对接))' || \
   echo "$prompt_lower" | grep -qE '(设计|开发|封装|对接|调用).{0,5}(api|接口)' || \
   echo "$prompt_lower" | grep -qE '(http|https|request|response|endpoint|路由|route)' || \
   echo "$prompt_lower" | grep -qE '(post|get|put|delete|patch).{0,10}(请求|接口|api)' || \
   echo "$prompt_lower" | grep -qE '(请求|调用).{0,5}(外部|第三方|服务)' || \
   echo "$prompt_lower" | grep -qE '(axios|fetch|curl|postman|insomnia)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<zhenghe-mode>\n⛵ **郑和 API 远航模式已激活！**\n\n## 七下西洋 - API 集成专家\n\n### 1. 航线规划 - API 设计\n- RESTful 资源设计\n- 请求/响应格式\n- 错误码规范\n- 版本策略\n\n### 2. 远航出发 - 集成实现\n\n**HTTP 客户端**:\n```typescript\n// 统一封装示例\nconst api = {\n  baseURL: '',\n  timeout: 10000,\n  interceptors: { request, response }\n}\n```\n\n**认证方式**:\n- API Key\n- OAuth 2.0\n- JWT Bearer\n\n**错误处理**:\n- 重试策略\n- 超时处理\n- 降级方案\n\n### 3. 航海日志 - 文档\n- OpenAPI/Swagger 规范\n- 请求示例\n- 响应示例\n\n**请描述要集成的 API 或提供 API 文档。**\n</zhenghe-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第九优先级：DevOps/部署类
# ============================================================================

# v2.1.15: 扩展 DevOps 相关触发词
if echo "$prompt_lower" | grep -qE '(devops|ci/cd|cicd|部署|运维|docker|kubernetes|k8s|容器|terraform|基础设施|流水线|pipeline|李冰|libing|都江堰|helm|argocd)' || \
   echo "$prompt_lower" | grep -qE '(发布|上线|灰度|rollout|deploy|release|环境)' || \
   echo "$prompt_lower" | grep -qE '(dockerfile|docker-compose|镜像|image|容器化)' || \
   echo "$prompt_lower" | grep -qE '(github actions|gitlab ci|jenkins|travis|circle ci)' || \
   echo "$prompt_lower" | grep -qE '(怎么部署|如何部署|部署到|发布到|上线到)' || \
   echo "$prompt_lower" | grep -qE '(nginx|apache|caddy|负载均衡|反向代理)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<libing-mode>\n🌊 **李冰 DevOps 模式已激活！**\n\n## 都江堰水利智慧 - 分而治之\n\n### 1. CI/CD 流水线\n```yaml\n# 标准流程\nstages:\n  - build    # 构建\n  - test     # 测试\n  - deploy   # 部署\n```\n\n### 2. 容器化\n**Dockerfile 最佳实践**:\n- 多阶段构建\n- 最小基础镜像\n- 非 root 用户\n- 健康检查\n\n### 3. Kubernetes\n- Deployment/Service/Ingress\n- ConfigMap/Secret\n- HPA 自动扩缩\n- Helm Charts\n\n### 4. 基础设施即代码\n- Terraform 模块化\n- 环境一致性\n- 状态管理\n- 变更审计\n\n### 5. 监控告警\n- Prometheus + Grafana\n- 日志聚合\n- 链路追踪\n\n**请描述你的 DevOps 需求。**\n</libing-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十优先级：监控/可观测类
# ============================================================================

# v2.1.15: 扩展监控相关触发词
if echo "$prompt_lower" | grep -qE '(监控|日志|告警|追踪|monitor|logging|alert|trace|metrics|prometheus|grafana|张衡|zhangheng|可观测|observab|elk|sentry)' || \
   echo "$prompt_lower" | grep -qE '(埋点|打点|track|tracking|analytics|分析|统计)' || \
   echo "$prompt_lower" | grep -qE '(报警|通知|notification|alarm|warning)' || \
   echo "$prompt_lower" | grep -qE '(datadog|newrelic|splunk|kibana|jaeger)' || \
   echo "$prompt_lower" | grep -qE '(日志怎么|如何记录|如何监控|怎么追踪)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<zhangheng-mode>\n🔭 **张衡监控观测模式已激活！**\n\n## 候风地动仪 - 感知预警\n\n### 1. 指标监控 (Metrics)\n- 系统指标：CPU/Memory/Disk/Network\n- 应用指标：QPS/延迟/错误率\n- 业务指标：订单量/转化率\n\n### 2. 日志系统 (Logging)\n- 结构化日志\n- 日志级别规范\n- 聚合与检索\n- 敏感信息脱敏\n\n### 3. 链路追踪 (Tracing)\n- 分布式追踪 ID\n- 调用链可视化\n- 性能瓶颈定位\n\n### 4. 告警配置\n```yaml\n# 告警规则示例\nalert: HighErrorRate\nexpr: error_rate > 0.05\nfor: 5m\nlabels:\n  severity: critical\n```\n\n### 5. 仪表盘\n- 关键指标概览\n- 趋势分析\n- 异常检测\n\n**请描述你的监控需求。**\n</zhangheng-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十一优先级：云原生/Serverless
# ============================================================================

# v2.1.15: 扩展云原生相关触发词
if echo "$prompt_lower" | grep -qE '(云原生|cloud[-_]?native|serverless|无服务器|lambda|函数计算|嫦娥|change|moon|云端|faas|aws|azure|gcp)' || \
   echo "$prompt_lower" | grep -qE '(阿里云|腾讯云|华为云|alicloud|tencent cloud)' || \
   echo "$prompt_lower" | grep -qE '(云函数|云服务|云存储|云数据库|oss|s3|blob)' || \
   echo "$prompt_lower" | grep -qE '(vercel|netlify|cloudflare|railway|render|fly\.io)' || \
   echo "$prompt_lower" | grep -qE '(上云|部署到云|云上|云端部署)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<change-mode>\n🌙 **嫦娥云端仙子模式已激活！**\n\n## 广寒宫 - 云原生架构\n\n### 1. Serverless 函数\n- AWS Lambda / Azure Functions / Cloud Functions\n- 冷启动优化\n- 内存配置\n- 超时设置\n\n### 2. 云服务集成\n**存储**: S3/Blob/GCS\n**数据库**: DynamoDB/CosmosDB/Firestore\n**消息队列**: SQS/Service Bus/Pub/Sub\n**CDN**: CloudFront/Azure CDN\n\n### 3. 架构模式\n- 事件驱动\n- API Gateway + Lambda\n- 微服务通信\n- 无状态设计\n\n### 4. 成本优化\n- 按需付费 vs 预留实例\n- 自动扩缩容\n- 资源标签管理\n- 成本监控\n\n### 5. 安全合规\n- IAM 最小权限\n- VPC 网络隔离\n- 密钥管理\n- 审计日志\n\n**请描述你的云原生需求。**\n</change-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十二优先级：代码审查类
# ============================================================================

# 注意：pr 需要作为独立词或在 pull request 上下文中，避免匹配 progress 等词
# v2.1.15: 扩展代码审查相关触发词
if echo "$prompt_lower" | grep -qE '(审查|code[-_]?review|review|cr|pull[-_]?request|魏征|weizheng|谏|规范检查|代码评审|看看.{0,5}代码|检查.{0,5}(代码|这个)|帮我.{0,5}review)' || \
   echo "$prompt_lower" | grep -qE '\bpr\b' || \
   echo "$prompt_lower" | grep -qE '(提交|合并).{0,5}pr' || \
   echo "$prompt_lower" | grep -qE '(代码质量|代码规范|编码规范|code style|lint)' || \
   echo "$prompt_lower" | grep -qE '(这段代码|这个代码|这块代码).{0,5}(怎么样|有问题|好不好|ok吗)' || \
   echo "$prompt_lower" | grep -qE '(帮我看看|检查一下|审一下|review一下)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<weizheng-mode>\n🪞 **魏征审查模式已激活！**\n\n## 代码审查清单\n\n### 1. 代码规范\n- [ ] 命名是否清晰有意义\n- [ ] 函数是否单一职责\n- [ ] 是否遵循项目代码风格\n\n### 2. 逻辑正确性\n- [ ] 边界条件处理\n- [ ] 错误处理完整性\n- [ ] 空值检查\n\n### 3. 安全性\n- [ ] 输入验证\n- [ ] SQL注入防护\n- [ ] XSS防护\n\n### 4. 性能\n- [ ] 不必要的循环\n- [ ] N+1 查询\n- [ ] 内存泄漏风险\n\n### 5. 可维护性\n- [ ] 代码重复\n- [ ] 注释是否必要且准确\n- [ ] 测试覆盖\n\n**请提供要审查的代码或文件路径。**\n</weizheng-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十三优先级：重构/简化类
# ============================================================================

# v2.1.15: 注意重构已被愚公优先捕获，这里主要处理简化/清理场景
if echo "$prompt_lower" | grep -qE '(简洁|简化|kiss|yagni|dry|clean[-_]?code|代码异味|code[-_]?smell|老子|laozi|道德经|至简|simplify|技术债|technical[-_]?debt)' || \
   echo "$prompt_lower" | grep -qE '(太复杂|太乱|太长|冗余|重复代码|duplicate)' || \
   echo "$prompt_lower" | grep -qE '(精简|瘦身|清理|整理|tidy|cleanup)' || \
   echo "$prompt_lower" | grep -qE '(可读性|易读|难读|看不懂|readable)' || \
   echo "$prompt_lower" | grep -qE '(怎么简化|如何简化|能不能简化)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<laozi-mode>\n☯️ **老子简洁之道模式已激活！**\n\n## 大道至简 - Clean Code 原则\n\n### 1. KISS - Keep It Simple, Stupid\n- 简单的代码更容易理解和维护\n- 避免过度设计\n- 一个函数做一件事\n\n### 2. YAGNI - You Aren't Gonna Need It\n- 不要为未来需求编码\n- 删除未使用的代码\n- 需要时再添加功能\n\n### 3. DRY - Don't Repeat Yourself\n- 提取重复代码为函数\n- 使用配置替代硬编码\n- 单一数据源原则\n\n### 4. 代码异味检测\n- 过长函数（>20行）\n- 过深嵌套（>3层）\n- 重复代码\n- 过多参数（>3个）\n- 注释过多（代码不够清晰）\n\n### 5. 重构手法\n- 提取方法\n- 内联变量\n- 重命名\n- 简化条件表达式\n\n**请提供要简化的代码。**\n</laozi-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十四优先级：UI/UX设计类
# ============================================================================

# v2.1.15: 扩展 UI/UX 相关触发词
# 修复："好看"、"美观"需要界面上下文，避免在讨论代码风格时误触发
if echo "$prompt_lower" | grep -qE '(界面设计|美学|ux|用户体验|视觉设计|交互设计|顾恺之|gukaizhi|painter|配色|布局|figma|sketch)' || \
   echo "$prompt_lower" | grep -qE '(界面|页面|ui|组件|按钮|图标).{0,5}(好看|美观|漂亮|丑|难看)' || \
   echo "$prompt_lower" | grep -qE '(好看|美观|漂亮|丑|难看).{0,5}(界面|页面|ui|组件|按钮|图标)' || \
   echo "$prompt_lower" | grep -qE '\bui\b.{0,10}(设计|优化|调整|改进)' || \
   echo "$prompt_lower" | grep -qE '(颜色|色彩|字体|字号|间距|对齐|居中)' || \
   echo "$prompt_lower" | grep -qE '(响应式|自适应|mobile|移动端|手机端|桌面端).{0,5}(适配|布局|设计)' || \
   echo "$prompt_lower" | grep -qE '(用户友好|易用|体验好|体验差)' || \
   echo "$prompt_lower" | grep -qE '(css|样式|style).{0,5}(调整|优化|美化)' || \
   echo "$prompt_lower" | grep -qE '(动画|过渡|transition|animation).{0,5}效果'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<gukaizhi-mode>\n🎨 **顾恺之界面美学模式已激活！**\n\n## 以形写神 - UI/UX 设计\n\n### 1. 视觉层次\n- 信息优先级\n- 留白运用\n- 对比与平衡\n- 视觉引导\n\n### 2. 配色方案\n- 主色/辅色/强调色\n- 色彩心理学\n- 无障碍对比度\n- 暗色模式适配\n\n### 3. 布局原则\n- 网格系统\n- 响应式设计\n- 组件间距\n- 触控区域\n\n### 4. 交互设计\n- 反馈及时性\n- 加载状态\n- 错误提示\n- 微交互动画\n\n### 5. 组件设计\n- 一致性\n- 可复用性\n- 可访问性\n- 设计系统\n\n**请描述你的界面设计需求。**\n</gukaizhi-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十五优先级：前端实现类（具体编码）
# ============================================================================

# v2.1.15: 扩展前端相关触发词
if echo "$prompt_lower" | grep -qE '(前端|组件|react|vue|angular|frontend|component|craft|鲁班|luban|巧工|qiaogong|html|css|javascript|typescript|nextjs|nuxt)' || \
   echo "$prompt_lower" | grep -qE '(页面|网页|web|浏览器|browser|dom)' || \
   echo "$prompt_lower" | grep -qE '(按钮|表单|输入框|弹窗|模态框|列表|表格|button|form|input|modal|dialog|table)' || \
   echo "$prompt_lower" | grep -qE '(tailwind|scss|sass|less|styled|emotion|antd|element|mui)' || \
   echo "$prompt_lower" | grep -qE '(hooks|useState|useEffect|状态管理|redux|zustand|mobx)' || \
   echo "$prompt_lower" | grep -qE '(写个|做个|实现个).{0,5}(页面|组件|界面)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<luban-mode>\n🔧 **鲁班巧匠模式已激活！**\n\n## 精益求精 - 前端工匠\n\n### 1. 组件设计\n- 单一职责\n- Props 接口定义\n- 默认值处理\n- 类型安全\n\n### 2. 状态管理\n- 本地 vs 全局状态\n- 状态提升\n- 派生状态\n- 副作用处理\n\n### 3. 样式方案\n- CSS Modules / Tailwind / CSS-in-JS\n- 响应式设计\n- 主题系统\n- 动画过渡\n\n### 4. 性能优化\n- 组件懒加载\n- 虚拟列表\n- 防抖节流\n- 缓存策略\n\n### 5. 代码质量\n```typescript\n// 组件模板\ninterface Props {\n  // 明确的类型定义\n}\n\nexport function Component({ ...props }: Props) {\n  // 清晰的实现\n}\n```\n\n**请描述要实现的前端功能或组件。**\n</luban-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十六优先级：需求分析类
# ============================================================================

# v2.1.15: 扩展需求分析相关触发词
# 修复：移除"想要"、"希望"、"期望"等过于宽泛的词，改为需要产品/需求上下文
if echo "$prompt_lower" | grep -qE '(需求|用户故事|prd|功能规划|requirements|user[-_]?story|feature[-_]?spec|李白|libai|poet)' || \
   echo "$prompt_lower" | grep -qE '(功能点|用例|use case|场景|scenario).{0,5}(分析|设计|规划|梳理)' || \
   echo "$prompt_lower" | grep -qE '(产品|功能|业务).{0,5}(需求|目标|规划)' || \
   echo "$prompt_lower" | grep -qE '(梳理|分析|定义|设计).{0,5}(需求|功能|用例)' || \
   echo "$prompt_lower" | grep -qE '(业务|产品经理|pm|甲方|客户).{0,5}(说|要求|需要)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<libai-mode>\n✨ **李白需求炼金师模式已激活！**\n\n## 天生我材必有用 - 需求挖掘\n\n### 1. 需求挖掘\n- 谁是用户？\n- 用户痛点是什么？\n- 期望的解决方案？\n- 成功标准是什么？\n\n### 2. 用户故事 (User Story)\n```\n作为 [角色]\n我想要 [功能]\n以便于 [价值]\n\n验收标准:\n- Given [前提条件]\n- When [操作]\n- Then [期望结果]\n```\n\n### 3. 功能优先级\n| 优先级 | 标准 |\n|--------|------|\n| P0 | 必须有，否则无法使用 |\n| P1 | 应该有，核心体验 |\n| P2 | 可以有，锦上添花 |\n| P3 | 未来考虑 |\n\n### 4. PRD 大纲\n- 背景与目标\n- 用户画像\n- 功能需求\n- 非功能需求\n- 验收标准\n\n**请描述你的产品想法或需求。**\n</libai-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十七优先级：文档类
# ============================================================================

# 优化：移除单独的"记录"，避免误触发
# "记录一下状态"不应触发文档模式
# 只有明确的文档撰写需求才触发
# v2.1.15: 扩展文档相关触发词
if echo "$prompt_lower" | grep -qE '(文档|注释|readme|changelog|司马迁|simaqian|史记|shiji|wiki|写.{0,3}(文档|注释)|添加.{0,3}注释|(api|接口).{0,3}文档|技术文档|使用文档)' || \
   echo "$prompt_lower" | grep -qE '(撰写|编写|更新|完善).{0,5}文档' || \
   echo "$prompt_lower" | grep -qE '(jsdoc|tsdoc|docstring|javadoc|注解)' || \
   echo "$prompt_lower" | grep -qE '(说明文档|帮助文档|用户手册|开发文档)' || \
   echo "$prompt_lower" | grep -qE '(怎么用|如何使用|使用方法|使用说明)' || \
   echo "$prompt_lower" | grep -qE '(没有文档|缺少文档|文档不全|补充文档)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<simaqian-mode>\n📜 **司马迁文档史官模式已激活！**\n\n## 究天人之际，通古今之变\n\n### 1. README 结构\n```markdown\n# 项目名称\n> 一句话描述\n\n## 特性\n## 安装\n## 快速开始\n## API 文档\n## 贡献指南\n## 许可证\n```\n\n### 2. API 文档\n- 端点描述\n- 请求参数\n- 响应格式\n- 示例代码\n- 错误码\n\n### 3. 代码注释\n```typescript\n/**\n * 函数简述\n * @param name - 参数说明\n * @returns 返回值说明\n * @example\n * // 使用示例\n */\n```\n\n### 4. CHANGELOG\n```markdown\n## [版本号] - 日期\n### Added\n### Changed\n### Fixed\n### Removed\n```\n\n### 5. 技术文档\n- 架构图\n- 数据流\n- 部署指南\n- 故障排查\n\n**请描述需要撰写的文档类型和内容。**\n</simaqian-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十八优先级：架构/设计类（通用词，放较后）
# ============================================================================

# 注意：只在明确的架构设计场景触发，避免"设计"一词过度触发
# v2.1.15: 扩展架构相关触发词
if echo "$prompt_lower" | grep -qE '(架构设计|系统设计|技术方案|architecture|system[-_]?design|诸葛|zhuge|consult|技术选型|微服务|分布式)' || \
   echo "$prompt_lower" | grep -qE '(整体设计|顶层设计|系统规划|技术路线)' || \
   echo "$prompt_lower" | grep -qE '(怎么设计|如何设计|设计思路|设计方案)' || \
   echo "$prompt_lower" | grep -qE '(模块划分|服务拆分|边界|解耦|耦合)' || \
   echo "$prompt_lower" | grep -qE '(单体|微服务|monolith|soa|ddd|领域驱动)' || \
   echo "$prompt_lower" | grep -qE '(技术栈|选型|用什么|选什么|比较好)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<zhuge-mode>\n🎯 **诸葛战略顾问模式已激活！**\n\n## 运筹帷幄，决胜千里\n\n### 1. 需求分析\n- 业务目标是什么？\n- 用户规模预期？\n- 性能要求？\n- 预算约束？\n\n### 2. 架构评估维度\n| 维度 | 考量 |\n|------|------|\n| 可扩展性 | 水平/垂直扩展能力 |\n| 可用性 | 容错、降级、恢复 |\n| 可维护性 | 模块化、可测试性 |\n| 安全性 | 认证、授权、加密 |\n| 成本 | 开发、运维、云资源 |\n\n### 3. 技术选型\n- 编程语言\n- 框架选择\n- 数据库方案\n- 中间件\n- 云服务\n\n### 4. 架构模式\n- 单体 vs 微服务\n- 同步 vs 异步\n- 事件驱动\n- CQRS/Event Sourcing\n\n### 5. 决策输出\n```\n📋 架构决策记录 (ADR)\n- 背景\n- 决策\n- 理由\n- 后果\n```\n\n**请描述你的架构需求或问题。**\n</zhuge-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第十九优先级：代码探索类（悟空 - 缩窄范围）
# ============================================================================

# 优化：移除过于通用的词（搜索、查找、探索、find、search）
# 只保留明确的代码探索场景
# v2.1.15: 扩展代码探索相关触发词
if echo "$prompt_lower" | grep -qE '(悟空|wukong|火眼|huoyan|定位代码|追踪调用|依赖关系|代码地图|调用链|call[-_]?graph|代码结构|codebase|熟悉代码|了解代码)' || \
   echo "$prompt_lower" | grep -qE '(在哪|在哪里|哪个文件|哪里定义|哪里实现|位置)' || \
   echo "$prompt_lower" | grep -qE '(找到|找一下|找找|定位|locate).{0,5}(代码|文件|函数|类|方法)' || \
   echo "$prompt_lower" | grep -qE '(代码在|文件在|定义在|实现在)' || \
   echo "$prompt_lower" | grep -qE '(这个项目|这个代码库|这个仓库).{0,5}(怎么|如何|结构)' || \
   echo "$prompt_lower" | grep -qE '(入口|entry|main|启动|初始化).{0,5}在哪'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<wukong-mode>\n🔍 **悟空火眼金睛模式已激活！**\n\n## 火眼金睛，明察秋毫\n\n### 1. 快速侦察任务\n- 定位关键文件\n- 追踪函数调用\n- 识别入口点\n- 找到配置位置\n\n### 2. 探索策略\n```\n1. 从入口点开始（main/index/app）\n2. 顺藤摸瓜追踪调用链\n3. 标记关键节点\n4. 绘制依赖关系\n```\n\n### 3. 常用搜索\n- 类/函数定义\n- 接口实现\n- 配置引用\n- 环境变量\n\n### 4. 输出格式\n```\n📍 目标: [搜索目标]\n📁 位置: [文件路径:行号]\n🔗 调用链: A → B → C\n📝 说明: [简要描述]\n```\n\n### 5. 代码地图\n- 目录结构概览\n- 模块依赖图\n- 核心流程图\n\n**告诉我你要找什么？**\n</wukong-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第二十优先级：计划审查类（刘伯温）
# ============================================================================

# v2.1.15: 扩展计划审查相关触发词
if echo "$prompt_lower" | grep -qE '(计划审查|风险评估|可行性|feasibility|刘伯温|liubowen|momus|plan[-_]?review|todo[-_]?review|验证计划)' || \
   echo "$prompt_lower" | grep -qE '(这个计划|这个方案|这个todo).{0,5}(行不行|可以吗|靠谱吗|合理吗)' || \
   echo "$prompt_lower" | grep -qE '(检查|审核|评估).{0,5}(计划|方案|todo|任务)' || \
   echo "$prompt_lower" | grep -qE '(有什么风险|风险是什么|可能的问题)' || \
   echo "$prompt_lower" | grep -qE '(来得及吗|能完成吗|时间够吗|可行吗)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<liubowen-mode>\n🔮 **刘伯温计划审查模式已激活！**\n\n## 审时度势，运筹帷幄\n\n### 1. 计划完整性检查\n- [ ] 目标明确可衡量\n- [ ] 任务分解合理\n- [ ] 依赖关系清晰\n- [ ] 时间估算现实\n- [ ] 资源分配充足\n\n### 2. 风险评估矩阵\n| 风险 | 可能性 | 影响 | 缓解措施 |\n|------|--------|------|----------|\n| ? | 高/中/低 | 高/中/低 | ? |\n\n### 3. 可行性维度\n- **技术可行性**: 技术栈是否支持？\n- **资源可行性**: 人力/时间/预算够吗？\n- **业务可行性**: 需求是否合理？\n\n### 4. 审查输出\n```\n📋 计划审查报告\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ 优点: [计划亮点]\n⚠️ 风险: [潜在问题]\n💡 建议: [改进意见]\n📊 评分: X/10\n```\n\n### 5. 预警信号\n- 范围蔓延\n- 依赖阻塞\n- 时间压缩\n- 资源不足\n\n**请提供要审查的计划或 TODO 列表。**\n</liubowen-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 第二十一优先级：多模态/图像类（离娄）
# ============================================================================

# v2.1.15: 扩展多模态相关触发词
if echo "$prompt_lower" | grep -qE '(图片|图像|pdf|截图|扫描|image|picture|screenshot|视觉|离娄|lilou|looker|看看这个|分析这张)' || \
   echo "$prompt_lower" | grep -qE '(这张图|这个图|图中|图里|图上)' || \
   echo "$prompt_lower" | grep -qE '(设计稿|原型图|线框图|mockup|wireframe)' || \
   echo "$prompt_lower" | grep -qE '(文档|报告|报表).{0,5}(pdf|图片)' || \
   echo "$prompt_lower" | grep -qE '(ocr|识别|提取|读取).{0,5}(文字|内容|信息)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n<lilou-mode>\n🖼️ **离娄多模态洞察模式已激活！**\n\n## 明察秋毫 - 视觉内容分析\n\n### 1. 图像分析能力\n- UI 截图分析\n- 架构图理解\n- 流程图解读\n- 错误截图诊断\n- 设计稿还原\n\n### 2. PDF 解析\n- 文档内容提取\n- 表格数据识别\n- 图表解读\n- 关键信息摘要\n\n### 3. 分析输出格式\n```\n📷 图像分析报告\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎯 主题: [图像主要内容]\n📝 描述: [详细描述]\n💡 洞察: [关键发现]\n🔧 建议: [行动建议]\n```\n\n### 4. 支持场景\n- UI 问题定位\n- 设计稿实现\n- 文档信息提取\n- 图表数据分析\n\n**请提供图片或 PDF 文件，告诉我你想了解什么。**\n</lilou-mode>\n"
}
EOF
    exit 0
fi

# ============================================================================
# 进度查询类：用户想看进度时
# ============================================================================

# 检测用户想要查看进度
# 支持：进度、状态、显示进度、当前状态、show progress 等
if echo "$prompt_lower" | grep -qE '^[[:space:]]*(进度|状态|show progress|current status|当前进度|当前状态)[[:space:]]*$' || \
   echo "$prompt_lower" | grep -qE '(显示.{0,3}进度|查看.{0,3}(进度|状态)|show.{0,5}(progress|status)|what.*progress|现在.{0,3}(进度|状态)|任务.{0,3}(进度|状态))'; then
    # 提示系统显示进度
    cat << 'EOF'
{
  "systemMessage": "\n\n📊 **进度查询**\n\n请使用 `mcp_todoread` 工具查看当前 TODO 列表，并以如下格式展示：\n\n```\n📊 进度: ████████░░░░░░░░ X% (已完成/总数)\n\n✅ 已完成:\n   • [已完成的任务]\n\n🔄 进行中:\n   • [当前任务] ← 当前\n\n⏳ 待完成:\n   • [剩余任务]\n```\n"
}
EOF
    exit 0
fi

# ============================================================================
# 错误恢复类：用户遇到问题时
# ============================================================================

# 检测用户遇到问题/卡住的场景
# 这些情况下自动推荐 /stuck 或 /quickfix
if echo "$prompt_lower" | grep -qE '(卡住了|失败了|出错了|搞不定|做不下去|不知道怎么办|怎么回事|什么情况|stuck|failed|broken|cannot|can.{0,3}t|doesn.{0,3}t work|not working|问题|出问题|有问题|help|救命|sos)' || \
   echo "$prompt_lower" | grep -qE '(一直.{0,5}(失败|报错|出错)|总是.{0,5}(失败|报错)|反复.{0,5}(失败|出错)|continuously.{0,10}(fail|error))' || \
   echo "$prompt_lower" | grep -qE '(任务|操作|命令|执行).{0,5}(失败|出错|不行)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n🆘 **检测到问题**\n\n别担心！这里有快速恢复选项：\n\n**快速修复**：\n- `/quickfix` - 智能诊断当前问题\n- `/stuck` - 交互式恢复指南\n\n**具体操作**：\n| 情况 | 命令 |\n|------|------|\n| 想重试 | `/retry` |\n| 想跳过 | `/skip` |\n| 想回滚 | `/rollback` |\n| 想停止 | 输入 `停止` |\n\n**或者直接告诉我**：粘贴错误信息，我来帮你诊断。\n"
}
EOF
    exit 0
fi

# ============================================================================
# 帮助类：用户困惑时
# ============================================================================

if echo "$prompt_lower" | grep -qE '(帮帮我|不知道怎么|怎么用|从哪开始|help me|how to|where to start|什么命令|该用谁|新手|刚开始|first time|getting started)'; then
    cat << 'EOF'
{
  "systemMessage": "\n\n👋 **需要帮助？**\n\n🆕 **推荐新手使用**：\n- `/quickstart` - 场景化快速开始，告诉我你想做什么\n\n**其他快捷方式**：\n- `/do [任务]` - 万能入口，自动匹配专家\n- `/help` - 查看命令速查表\n"
}
EOF
    exit 0
fi

# ============================================================================
# 无特殊关键词，正常继续
# ============================================================================
exit 0
