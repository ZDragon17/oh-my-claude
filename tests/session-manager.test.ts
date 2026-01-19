/**
 * SessionManager 测试
 */

import { SessionManager } from '../lib/agent/session-manager';
import { ContextCacheManager } from '../lib/agent/context-compression';
import type { AgentState, CollaborationSession } from '../types/index';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let contextCache: ContextCacheManager;

  // 创建测试用的 AgentState
  const createTestAgent = (id: string, name: string): AgentState => ({
    id,
    name,
    status: 'idle',
    lastActive: new Date().toISOString(),
    performance: {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0,
      successRate: 1
    },
    context: {
      shortTerm: {},
      longTerm: {},
      preferences: {}
    }
  });

  beforeEach(() => {
    contextCache = new ContextCacheManager();
    sessionManager = new SessionManager(contextCache);
  });

  // ==================== 会话生命周期 ====================

  describe('createSession', () => {
    test('应该创建新会话并返回正确结构', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      expect(session.id).toMatch(/^session_/);
      expect(session.taskId).toBe('task-1');
      expect(session.description).toBe('测试任务');
      expect(session.status).toBe('active');
      expect(session.agents).toEqual(agents);
      expect(session.messages).toEqual([]);
      expect(session.context.shared).toEqual({});
      expect(session.context.compressed).toEqual([]);
      expect(session.context.checkpoints).toEqual([]);
      expect(session.metrics.totalMessages).toBe(0);
      expect(session.metrics.taskProgress).toBe(0);
    });

    test('应该初始化所有 agent 的交互计数为 0', () => {
      const agents = [
        createTestAgent('agent-1', 'Agent1'),
        createTestAgent('agent-2', 'Agent2')
      ];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      expect(session.metrics.agentInteractions['agent-1']).toBe(0);
      expect(session.metrics.agentInteractions['agent-2']).toBe(0);
    });

    test('应该将会话添加到活跃会话列表', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const retrieved = sessionManager.getActiveSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(session.id);
    });
  });

  describe('getActiveSession', () => {
    test('应该返回存在的活跃会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const retrieved = sessionManager.getActiveSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.taskId).toBe('task-1');
    });

    test('应该返回 null 对于不存在的会话', () => {
      const result = sessionManager.getActiveSession('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateSession', () => {
    test('应该更新会话属性', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.updateSession(session.id, { description: '更新后的描述' });

      const updated = sessionManager.getActiveSession(session.id);
      expect(updated!.description).toBe('更新后的描述');
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.updateSession('non-existent-id', { description: 'test' });
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('endSession', () => {
    test('应该以 completed 状态结束会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.endSession(session.id, 'completed');

      // 会话应该从活跃列表移除
      expect(sessionManager.getActiveSession(session.id)).toBeNull();

      // 会话应该在历史记录中
      const history = sessionManager.getSessionHistory();
      expect(history.length).toBe(1);
      expect(history[0]!.status).toBe('completed');
      expect(history[0]!.metrics.taskProgress).toBe(100);
      expect(history[0]!.metrics.endTime).toBeDefined();
    });

    test('应该以 failed 状态结束会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.endSession(session.id, 'failed');

      const history = sessionManager.getSessionHistory();
      expect(history[0]!.status).toBe('failed');
      expect(history[0]!.metrics.taskProgress).toBe(0);
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.endSession('non-existent-id', 'completed');
      }).toThrow('Session non-existent-id not found');
    });

    test('应该限制历史记录数量', () => {
      // 创建并结束多个会话以测试历史记录限制
      const agents = [createTestAgent('agent-1', 'TestAgent')];

      // 创建 110 个会话（超过 MAX_SESSIONS_HISTORY = 100）
      for (let i = 0; i < 110; i++) {
        const session = sessionManager.createSession(`task-${i}`, `任务 ${i}`, agents);
        sessionManager.endSession(session.id, 'completed');
      }

      const history = sessionManager.getSessionHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  // ==================== 消息管理 ====================

  describe('recordMessage', () => {
    test('应该记录消息到会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.recordMessage(session.id, 'agent-1', 'request', '请求内容');

      const updated = sessionManager.getActiveSession(session.id);
      expect(updated!.messages.length).toBe(1);
      expect(updated!.messages[0]!.agentId).toBe('agent-1');
      expect(updated!.messages[0]!.type).toBe('request');
      expect(updated!.messages[0]!.content).toBe('请求内容');
      expect(updated!.messages[0]!.id).toMatch(/^msg_/);
    });

    test('应该更新消息计数和 agent 交互计数', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.recordMessage(session.id, 'agent-1', 'request', '消息1');
      sessionManager.recordMessage(session.id, 'agent-1', 'response', '消息2');

      const updated = sessionManager.getActiveSession(session.id);
      expect(updated!.metrics.totalMessages).toBe(2);
      expect(updated!.metrics.agentInteractions['agent-1']).toBe(2);
    });

    test('应该支持带 metadata 的消息', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const metadata = { extra: 'data' };
      sessionManager.recordMessage(session.id, 'agent-1', 'notification', '通知', metadata);

      const updated = sessionManager.getActiveSession(session.id);
      expect(updated!.messages[0]!.metadata).toEqual(metadata);
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.recordMessage('non-existent-id', 'agent-1', 'request', '内容');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('getSessionMessages', () => {
    test('应该获取活跃会话的所有消息', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.recordMessage(session.id, 'agent-1', 'request', '消息1');
      sessionManager.recordMessage(session.id, 'agent-1', 'response', '消息2');
      sessionManager.recordMessage(session.id, 'agent-1', 'notification', '消息3');

      const messages = sessionManager.getSessionMessages(session.id);
      expect(messages.length).toBe(3);
    });

    test('应该支持 limit 参数获取最后 N 条消息', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      for (let i = 0; i < 5; i++) {
        sessionManager.recordMessage(session.id, 'agent-1', 'request', `消息${i}`);
      }

      const messages = sessionManager.getSessionMessages(session.id, 2);
      expect(messages.length).toBe(2);
      expect(messages[0]!.content).toBe('消息3');
      expect(messages[1]!.content).toBe('消息4');
    });

    test('应该获取历史会话的消息', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);
      sessionManager.recordMessage(session.id, 'agent-1', 'request', '历史消息');
      sessionManager.endSession(session.id, 'completed');

      const messages = sessionManager.getSessionMessages(session.id);
      expect(messages.length).toBe(1);
      expect(messages[0]!.content).toBe('历史消息');
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.getSessionMessages('non-existent-id');
      }).toThrow('Session non-existent-id not found');
    });
  });

  // ==================== 上下文管理 ====================

  describe('compressContext', () => {
    test('应该压缩会话上下文', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const context = { key1: 'value1', key2: 42 };
      const compression = sessionManager.compressContext(session.id, context);

      expect(compression.id).toMatch(/^ctx_/);
      expect(compression.algorithm).toBe('summary');
    });

    test('应该支持不同的压缩算法', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const context = { key: 'value' };

      const summaryResult = sessionManager.compressContext(session.id, context, 'summary');
      expect(summaryResult.algorithm).toBe('summary');

      const keypointsResult = sessionManager.compressContext(session.id, context, 'keypoints');
      expect(keypointsResult.algorithm).toBe('keypoints');

      const hierarchicalResult = sessionManager.compressContext(session.id, context, 'hierarchical');
      expect(hierarchicalResult.algorithm).toBe('hierarchical');
    });

    test('应该将压缩结果添加到会话上下文', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.compressContext(session.id, { data: 'test' });

      const updated = sessionManager.getActiveSession(session.id);
      expect(updated!.context.compressed.length).toBe(1);
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.compressContext('non-existent-id', {});
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('retrieveContext', () => {
    test('应该检索压缩的上下文', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const context = { name: 'test', value: 42 };
      const compression = sessionManager.compressContext(session.id, context, 'keypoints');

      const retrieved = sessionManager.retrieveContext(compression.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('test');
    });

    test('应该返回 null 对于不存在的压缩 ID', () => {
      const result = sessionManager.retrieveContext('non-existent-id');
      expect(result).toBeNull();
    });
  });

  // ==================== 检查点管理 ====================

  describe('createCheckpoint', () => {
    test('应该创建检查点并返回 ID', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);
      sessionManager.recordMessage(session.id, 'agent-1', 'request', '消息内容');

      const checkpointId = sessionManager.createCheckpoint(session.id, '首个检查点');

      expect(checkpointId).toMatch(/^checkpoint_/);
    });

    test('应该将检查点添加到会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      sessionManager.createCheckpoint(session.id, '检查点1');
      sessionManager.createCheckpoint(session.id, '检查点2');

      const updated = sessionManager.getActiveSession(session.id);
      expect(updated!.context.checkpoints.length).toBe(2);
    });

    test('应该保存当前会话状态的快照', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);
      sessionManager.recordMessage(session.id, 'agent-1', 'request', '消息内容');

      sessionManager.createCheckpoint(session.id, '状态快照');

      const updated = sessionManager.getActiveSession(session.id);
      const checkpoint = updated!.context.checkpoints[0]!;
      expect(checkpoint.state.messages).toBeDefined();
      expect(checkpoint.state.messages!.length).toBe(1);
      expect(checkpoint.state.agentStates).toBeDefined();
      expect(checkpoint.state.agentStates!.length).toBe(1);
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.createCheckpoint('non-existent-id', '检查点');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('restoreFromCheckpoint', () => {
    test('应该返回检查点状态', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);
      sessionManager.recordMessage(session.id, 'agent-1', 'request', '原始消息');

      const checkpointId = sessionManager.createCheckpoint(session.id, '检查点');

      // 添加更多消息
      sessionManager.recordMessage(session.id, 'agent-1', 'response', '新消息');

      const restoredState = sessionManager.restoreFromCheckpoint(session.id, checkpointId);

      expect(restoredState.messages).toBeDefined();
      expect(restoredState.messages!.length).toBe(1);
      expect(restoredState.messages![0]!.content).toBe('原始消息');
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.restoreFromCheckpoint('non-existent-id', 'checkpoint-id');
      }).toThrow('Session non-existent-id not found');
    });

    test('应该抛出错误对于不存在的检查点', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      expect(() => {
        sessionManager.restoreFromCheckpoint(session.id, 'non-existent-checkpoint');
      }).toThrow('Checkpoint non-existent-checkpoint not found');
    });
  });

  // ==================== 指标查询 ====================

  describe('getCollaborationMetrics', () => {
    test('应该返回活跃会话的指标', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);
      sessionManager.recordMessage(session.id, 'agent-1', 'request', '消息');

      const metrics = sessionManager.getCollaborationMetrics(session.id);

      expect(metrics.totalMessages).toBe(1);
      expect(metrics.agentInteractions['agent-1']).toBe(1);
      expect(metrics.startTime).toBeDefined();
    });

    test('应该返回历史会话的指标', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);
      sessionManager.recordMessage(session.id, 'agent-1', 'request', '消息');
      sessionManager.endSession(session.id, 'completed');

      const metrics = sessionManager.getCollaborationMetrics(session.id);

      expect(metrics.totalMessages).toBe(1);
      expect(metrics.taskProgress).toBe(100);
      expect(metrics.endTime).toBeDefined();
    });

    test('应该返回指标的副本而非引用', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const metrics = sessionManager.getCollaborationMetrics(session.id);
      metrics.totalMessages = 999;

      const originalMetrics = sessionManager.getCollaborationMetrics(session.id);
      expect(originalMetrics.totalMessages).toBe(0);
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.getCollaborationMetrics('non-existent-id');
      }).toThrow('Session non-existent-id not found');
    });
  });

  // ==================== 数据导出/导入 ====================

  describe('exportSession', () => {
    test('应该导出活跃会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);

      const exported = sessionManager.exportSession(session.id);

      expect(exported.session).toBeDefined();
      expect(exported.exportedAt).toBeDefined();
      expect(exported.version).toBe('1.0');
      expect((exported.session as CollaborationSession).taskId).toBe('task-1');
    });

    test('应该导出历史会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '测试任务', agents);
      sessionManager.endSession(session.id, 'completed');

      const exported = sessionManager.exportSession(session.id);

      expect((exported.session as CollaborationSession).status).toBe('completed');
    });

    test('应该抛出错误对于不存在的会话', () => {
      expect(() => {
        sessionManager.exportSession('non-existent-id');
      }).toThrow('Session non-existent-id not found');
    });
  });

  describe('importSession', () => {
    test('应该导入会话数据', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const originalSession = sessionManager.createSession('task-1', '原始任务', agents);
      const exported = sessionManager.exportSession(originalSession.id);

      // 清空当前状态
      sessionManager.setActiveSessions(new Map());

      // 导入
      const importedId = sessionManager.importSession(exported);

      expect(importedId).toBe(originalSession.id);
      const imported = sessionManager.getActiveSession(importedId);
      expect(imported).not.toBeNull();
      expect(imported!.description).toBe('原始任务');
    });

    test('应该抛出错误对于无效数据格式', () => {
      expect(() => {
        sessionManager.importSession({});
      }).toThrow('Invalid session data format');

      expect(() => {
        sessionManager.importSession({ session: {} });
      }).toThrow('Invalid session data format');
    });
  });

  // ==================== 状态访问器 ====================

  describe('getActiveSessions', () => {
    test('应该返回所有活跃会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      sessionManager.createSession('task-1', '任务1', agents);
      sessionManager.createSession('task-2', '任务2', agents);

      const sessions = sessionManager.getActiveSessions();

      expect(sessions.size).toBe(2);
    });
  });

  describe('getSessionHistory', () => {
    test('应该返回会话历史', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session1 = sessionManager.createSession('task-1', '任务1', agents);
      const session2 = sessionManager.createSession('task-2', '任务2', agents);

      sessionManager.endSession(session1.id, 'completed');
      sessionManager.endSession(session2.id, 'failed');

      const history = sessionManager.getSessionHistory();

      expect(history.length).toBe(2);
      // 最新的在前面
      expect(history[0]!.taskId).toBe('task-2');
      expect(history[1]!.taskId).toBe('task-1');
    });
  });

  describe('setActiveSessions', () => {
    test('应该设置活跃会话', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '任务', agents);

      const newSessions = new Map<string, CollaborationSession>();
      sessionManager.setActiveSessions(newSessions);

      expect(sessionManager.getActiveSessions().size).toBe(0);
      expect(sessionManager.getActiveSession(session.id)).toBeNull();
    });
  });

  describe('setSessionHistory', () => {
    test('应该设置会话历史', () => {
      const agents = [createTestAgent('agent-1', 'TestAgent')];
      const session = sessionManager.createSession('task-1', '任务', agents);
      sessionManager.endSession(session.id, 'completed');

      sessionManager.setSessionHistory([]);

      expect(sessionManager.getSessionHistory().length).toBe(0);
    });
  });
});
