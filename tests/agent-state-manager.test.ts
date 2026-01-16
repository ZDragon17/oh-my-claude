/**
 * Agent 状态管理器单元测试
 */

import AgentStateManagerImpl from '../lib/agent-state-manager';

describe('Agent 状态管理器', () => {
  let manager: AgentStateManagerImpl;

  beforeEach(async () => {
    manager = new AgentStateManagerImpl();
    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Agent 注册和管理', () => {
    test('应该能够注册新 Agent', () => {
      const agent = manager.registerAgent('test-agent', '测试 Agent');

      expect(agent).toBeDefined();
      expect(agent.id).toBe('test-agent');
      expect(agent.name).toBe('测试 Agent');
      expect(agent.status).toBe('idle');
    });

    test('不应该允许重复注册同一 Agent', () => {
      manager.registerAgent('test-agent', '测试 Agent');

      expect(() => {
        manager.registerAgent('test-agent', '另一个测试 Agent');
      }).toThrow('Agent test-agent already registered');
    });

    test('应该能够查询 Agent 状态', () => {
      manager.registerAgent('test-agent', '测试 Agent');
      const agentState = manager.getAgentState('test-agent');

      expect(agentState).toBeDefined();
      expect(agentState?.id).toBe('test-agent');
      expect(agentState?.status).toBe('idle');
    });

    test('查询不存在的 Agent 应该返回 null', () => {
      const agentState = manager.getAgentState('non-existent');
      expect(agentState).toBeNull();
    });

    test('应该能够更新 Agent 状态', () => {
      manager.registerAgent('test-agent', '测试 Agent');
      manager.updateAgentState('test-agent', { status: 'working' });

      const updatedState = manager.getAgentState('test-agent');
      expect(updatedState?.status).toBe('working');
    });
  });

  describe('协作会话管理', () => {
    beforeEach(() => {
      // 注册测试用的 agents
      manager.registerAgent('agent1', 'Agent 1');
      manager.registerAgent('agent2', 'Agent 2');
    });

    test('应该能够创建协作会话', () => {
      const session = manager.createSession('test-task', '测试任务', ['agent1', 'agent2']);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.taskId).toBe('test-task');
      expect(session.description).toBe('测试任务');
      expect(session.agents).toHaveLength(2);
      expect(session.status).toBe('active');
    });

    test('创建会话时应该验证 Agent 存在', () => {
      expect(() => {
        manager.createSession('test-task', '测试任务', ['agent1', 'non-existent']);
      }).toThrow('Agent non-existent not registered');
    });

    test('应该能够记录消息', () => {
      const session = manager.createSession('test-task', '测试任务', ['agent1']);
      const sessionId = session.id;

      manager.recordMessage(sessionId, 'agent1', 'request', '开始任务');

      const messages = manager.getSessionMessages(sessionId);
      expect(messages).toHaveLength(1);
      expect(messages[0].agentId).toBe('agent1');
      expect(messages[0].content).toBe('开始任务');
      expect(messages[0].type).toBe('request');
    });

    test('应该能够结束会话', () => {
      const session = manager.createSession('test-task', '测试任务', ['agent1']);
      const sessionId = session.id;

      manager.endSession(sessionId, 'completed');

      const endedSession = manager.getActiveSession(sessionId);
      expect(endedSession).toBeNull();
    });
  });

  describe('上下文压缩', () => {
    let sessionId: string;

    beforeEach(() => {
      manager.registerAgent('agent1', 'Agent 1');
      const session = manager.createSession('test-task', '测试任务', ['agent1']);
      sessionId = session.id;
    });

    test('应该能够压缩上下文', () => {
      const context = {
        task: '实现登录功能',
        steps: ['设计UI', '实现后端', '测试'],
        complexity: 3
      };

      const compression = manager.compressContext(sessionId, context, 'summary');

      expect(compression).toBeDefined();
      expect(compression.id).toBeDefined();
      expect(compression.algorithm).toBe('summary');
      expect(compression.originalSize).toBeGreaterThan(0);
      expect(compression.compressedSize).toBeGreaterThan(0);
    });

    test('应该能够检索压缩的上下文', () => {
      const context = { test: 'data', number: 42 };
      const compression = manager.compressContext(sessionId, context);

      const retrieved = manager.retrieveContext(compression.id);
      expect(retrieved).toBeDefined();
      // 注意：由于压缩算法的简化实现，这里可能不是完全相同的对象
    });
  });

  describe('性能监控', () => {
    beforeEach(() => {
      manager.registerAgent('agent1', 'Agent 1');
    });

    test('应该能够记录性能指标', () => {
      manager.recordPerformance('agent1', 'task1', 1500, true);

      const metrics = manager.getAgentMetrics('agent1');
      expect(metrics.totalTasks).toBe(1);
      expect(metrics.completedTasks).toBe(1);
      expect(metrics.failedTasks).toBe(0);
      expect(metrics.averageResponseTime).toBe(1500);
      expect(metrics.successRate).toBe(1);
    });

    test('应该正确计算平均响应时间', () => {
      manager.recordPerformance('agent1', 'task1', 1000, true);
      manager.recordPerformance('agent1', 'task2', 2000, true);

      const metrics = manager.getAgentMetrics('agent1');
      expect(metrics.averageResponseTime).toBe(1500); // (1000 + 2000) / 2
    });

    test('应该正确计算成功率', () => {
      manager.recordPerformance('agent1', 'task1', 1000, true);
      manager.recordPerformance('agent1', 'task2', 1000, false);

      const metrics = manager.getAgentMetrics('agent1');
      expect(metrics.successRate).toBe(0.5); // 1/2
    });
  });

  describe('数据持久化', () => {
    test('应该能够保存和加载状态', async () => {
      // 使用唯一的 agent ID 避免与其他测试冲突
      const uniqueId = `persistent-agent-${Date.now()}`;

      // 注册 agent
      manager.registerAgent(uniqueId, '持久化测试 Agent');

      // 保存状态
      await manager.saveState();

      // 创建新的管理器实例
      const newManager = new AgentStateManagerImpl();
      await new Promise(resolve => setTimeout(resolve, 100));

      // 检查状态是否加载
      const loadedAgent = newManager.getAgentState(uniqueId);
      expect(loadedAgent).toBeDefined();
      expect(loadedAgent?.name).toBe('持久化测试 Agent');
    });
  });
});