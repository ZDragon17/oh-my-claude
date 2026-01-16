# 任务恢复和错误重试机制

## 概述

任务恢复和错误重试机制是确保长任务稳定执行的核心系统，通过智能错误检测、自动重试策略和手动恢复选项，实现任务执行的高可靠性和连续性。

## 错误检测和分类

### 错误类型识别

系统能自动识别多种错误类型：

#### 1. 网络错误 (Network Errors)
```
检测模式: 网络、连接、timeout、connection
严重程度: 低
可重试: 是
恢复策略: 自动重试 + 指数退避
```

#### 2. API 错误 (API Errors)
```
检测模式: API、接口、rate limit、quota
严重程度: 中
可重试: 是
恢复策略: 等待重试 + 分批处理
```

#### 3. 权限错误 (Permission Errors)
```
检测模式: 权限、授权、access denied、permission
严重程度: 高
可重试: 否
恢复策略: 人工检查 + 权限修复
```

#### 4. 资源错误 (Resource Errors)
```
检测模式: 内存、磁盘、空间、out of memory
严重程度: 高
可重试: 否
恢复策略: 资源优化 + 系统调整
```

#### 5. 逻辑错误 (Logic Errors)
```
检测模式: 逻辑、语法、编译、syntax
严重程度: 高
可重试: 否
恢复策略: 代码修复 + 重新验证
```

#### 6. 依赖错误 (Dependency Errors)
```
检测模式: 依赖、模块、包、dependency
严重程度: 中
可重试: 是
恢复策略: 依赖更新 + 重新安装
```

## 重试策略

### 自动重试机制

#### 指数退避 (Exponential Backoff)
```javascript
function calculateRetryDelay(attemptNumber, baseDelay = 1000) {
  const maxDelay = 30000; // 最大延迟 30 秒
  const delay = baseDelay * Math.pow(2, attemptNumber - 1);
  return Math.min(delay + Math.random() * 1000, maxDelay);
}

// 使用示例
// 第1次重试: 1-2秒后
// 第2次重试: 2-3秒后
// 第3次重试: 4-5秒后
// 第4次重试: 8-9秒后
```

#### 智能重试条件
- **网络错误**: 最多重试 5 次，指数退避
- **API 限流**: 检测 rate limit，智能等待
- **临时错误**: 基于错误码判断是否可重试
- **依赖错误**: 重试前检查依赖状态

### 手动重试控制

```bash
# 手动触发重试
/yishan retry last_task

# 指定重试次数
/yishan retry --attempts 3

# 取消重试
/yishan retry cancel

# 查看重试状态
/yishan retry status
```

## 任务恢复机制

### 断点续传恢复

#### 1. 自动检测恢复点
```javascript
function findRecoveryPoints(taskId) {
  const checkpoints = getAllCheckpoints(taskId);
  return checkpoints
    .filter(cp => cp.integrity > 80) // 完整性 > 80%
    .sort((a, b) => b.progress - a.progress) // 按进度排序
    .slice(0, 5); // 返回前5个最佳恢复点
}
```

#### 2. 智能恢复选择
```javascript
function selectBestRecoveryPoint(recoveryPoints) {
  // 优先级排序
  // 1. 最新的完整断点
  // 2. 进度最高的断点
  // 3. 手动创建的断点
  // 4. 系统自动保存的断点

  return recoveryPoints.sort((a, b) => {
    if (a.manual && !b.manual) return -1;
    if (!a.manual && b.manual) return 1;
    return b.timestamp - a.timestamp;
  })[0];
}
```

#### 3. 渐进式恢复
```bash
# 分阶段恢复
/yishan resume summary     # 先恢复任务摘要
/yishan resume context     # 再恢复关键上下文
/yishan resume full        # 最后恢复完整状态

# 验证恢复完整性
/yishan resume verify      # 验证恢复结果
/yishan resume status      # 查看恢复状态
```

### 状态一致性保证

#### 上下文同步
```javascript
async function ensureContextConsistency(checkpoint, currentState) {
  // 检查上下文差异
  const differences = compareContexts(checkpoint.context, currentState.context);

  if (differences.hasConflicts) {
    // 处理冲突
    await resolveContextConflicts(differences);
  }

  // 同步 Agent 状态
  await syncAgentStates(checkpoint.agentStates);

  // 验证依赖关系
  await validateTaskDependencies(checkpoint.dependencies);
}
```

#### Agent 状态恢复
```javascript
async function restoreAgentStates(agentStates) {
  for (const [agentName, state] of Object.entries(agentStates)) {
    // 恢复 Agent 工作状态
    await setAgentStatus(agentName, state.status);

    // 同步工作进度
    await updateAgentProgress(agentName, state.progress);

    // 恢复上下文
    await restoreAgentContext(agentName, state.context);
  }
}
```

## 错误预防机制

### 主动监控

#### 1. 健康检查
```bash
# 定期健康检查
*/5 * * * * oh-my-claude health-check

# 检查项目
- 系统资源使用情况
- 网络连接稳定性
- API 服务可用性
- 依赖包状态
- 配置文件完整性
```

#### 2. 预警系统
```javascript
const ALERT_THRESHOLDS = {
  memory: 85,      // 内存使用率 > 85%
  disk: 90,        // 磁盘使用率 > 90%
  network: 3,      // 网络错误 > 3 次/分钟
  api: 5,          // API 错误 > 5 次/分钟
};

function checkThresholds() {
  const metrics = collectSystemMetrics();

  for (const [metric, threshold] of Object.entries(ALERT_THRESHOLDS)) {
    if (metrics[metric] > threshold) {
      triggerAlert(metric, metrics[metric], threshold);
    }
  }
}
```

#### 3. 容量规划
```javascript
function predictResourceNeeds(taskComplexity, agentCount) {
  // 基于历史数据预测资源需求
  const prediction = {
    memory: taskComplexity * agentCount * 50,  // MB
    time: taskComplexity * agentCount * 10,    // 分钟
    network: agentCount * 100,                 // KB/分钟
  };

  // 检查是否超过安全阈值
  if (prediction.memory > getAvailableMemory() * 0.8) {
    return { feasible: false, reason: '内存不足' };
  }

  return { feasible: true, prediction };
}
```

### 被动防御

#### 1. 优雅降级
```javascript
async function gracefulDegradation(error) {
  // 根据错误类型选择降级策略
  switch (error.type) {
    case 'memory':
      // 减少并发数
      reduceConcurrency();
      // 启用内存优化
      enableMemoryOptimization();
      break;

    case 'network':
      // 使用缓存数据
      enableOfflineMode();
      // 减少网络请求
      reduceNetworkRequests();
      break;

    case 'api':
      // 使用备用服务
      switchToBackupAPI();
      // 实现请求队列
      enableRequestQueue();
      break;
  }
}
```

#### 2. 自动修复
```javascript
async function autoFix(error) {
  // 尝试自动修复常见问题
  switch (error.type) {
    case 'dependency':
      await reinstallDependencies();
      break;

    case 'config':
      await repairConfiguration();
      break;

    case 'cache':
      await clearAndRebuildCache();
      break;
  }
}
```

## 恢复流程

### 1. 错误检测
```
用户输入 / 系统检测 → 错误分类 → 严重程度评估 → 可重试判断
```

### 2. 策略选择
```
错误类型分析 → 自动恢复评估 → 手动干预判断 → 恢复策略生成
```

### 3. 执行恢复
```
策略执行 → 进度监控 → 结果验证 → 状态更新
```

### 4. 学习改进
```
恢复结果分析 → 策略优化 → 预防措施更新
```

## 监控和分析

### 恢复成功率统计
```bash
/error-recovery stats
```
```
📊 错误恢复统计 (最近 30 天)
├── 总错误数: 156 个
├── 自动恢复: 142 个 (91.0%)
├── 手动恢复: 14 个 (9.0%)
├── 恢复失败: 2 个 (1.3%)
└── 平均恢复时间: 4.2 分钟

🔍 错误类型分布
├── 网络错误: 89 个 (57.1%) - 自动恢复率 98%
├── API 错误: 45 个 (28.8%) - 自动恢复率 87%
├── 权限错误: 12 个 (7.7%) - 手动恢复
├── 资源错误: 8 个 (5.1%) - 手动恢复
└── 逻辑错误: 2 个 (1.3%) - 手动恢复
```

### 性能影响分析
```bash
/error-recovery performance
```
```
⚡ 错误恢复性能分析
├── 重试成功率: 89.2%
├── 平均重试次数: 1.4 次
├── 恢复时间分布: 80% 在 2 分钟内完成
├── 资源消耗: 重试期间 CPU +15%, 内存 +8%
└── 用户体验: 自动恢复对用户透明
```

## 使用指南

### 自动恢复
系统会自动检测错误并执行恢复，无需手动干预。

### 手动恢复
```bash
# 查看错误状态
/error-recovery status

# 手动触发恢复
/error-recovery retry last_error

# 查看恢复历史
/error-recovery history

# 配置恢复策略
/error-recovery config
```

### 监控告警
```bash
# 查看告警设置
/error-recovery alerts

# 自定义告警规则
/error-recovery alerts set memory 90

# 查看告警历史
/error-recovery alerts history
```

## 最佳实践

### 错误处理原则
1. **快速失败**: 不可恢复错误快速失败，避免资源浪费
2. **优雅降级**: 部分功能失败时保持核心功能正常
3. **透明反馈**: 向用户清晰说明错误状态和恢复进度
4. **学习改进**: 从错误中学习，改进预防措施

### 重试策略优化
1. **智能判断**: 区分可重试和不可重试的错误
2. **渐进式重试**: 从快速重试开始，逐渐增加等待时间
3. **资源保护**: 重试时考虑系统资源使用情况
4. **用户控制**: 允许用户取消或修改重试策略

### 监控告警配置
1. **分层告警**: 不同严重程度的错误使用不同告警级别
2. **智能聚合**: 避免相同错误的重复告警
3. **及时响应**: 高优先级错误立即告警
4. **趋势分析**: 监控错误率变化趋势

---

**任务恢复和错误重试机制让 oh-my-claude 具备了企业级的稳定性，即使遇到复杂错误也能智能恢复，确保长任务的可靠执行。**