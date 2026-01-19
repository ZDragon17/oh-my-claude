/**
 * 协作会话管理模块
 * 处理会话创建、消息记录、检查点管理
 */

import type { AgentState, CollaborationSession, CheckpointState, ContextCompression, ContextRecord } from '../../types/index.js';
import { CollaborationSessionSchema, MAX_SESSIONS_HISTORY } from './types.js';
import { ContextCacheManager } from './context-compression.js';

export class SessionManager {
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private sessionHistory: CollaborationSession[] = [];
  private contextCache: ContextCacheManager;

  constructor(contextCache: ContextCacheManager) {
    this.contextCache = contextCache;
  }

  // ==================== 会话生命周期 ====================

  /**
   * 创建协作会话
   */
  createSession(
    taskId: string,
    description: string,
    agents: AgentState[]
  ): CollaborationSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const session: CollaborationSession = {
      id: sessionId,
      timestamp: new Date().toISOString(),
      taskId,
      description,
      status: 'active',
      agents,
      messages: [],
      context: {
        shared: {},
        compressed: [],
        checkpoints: []
      },
      metrics: {
        startTime: new Date().toISOString(),
        totalMessages: 0,
        agentInteractions: {},
        taskProgress: 0
      }
    };

    // 初始化 agent 交互计数
    for (const agent of agents) {
      session.metrics.agentInteractions[agent.id] = 0;
    }

    this.activeSessions.set(sessionId, CollaborationSessionSchema.parse(session));
    return session;
  }

  /**
   * 获取活跃会话
   */
  getActiveSession(sessionId: string): CollaborationSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * 更新会话
   */
  updateSession(sessionId: string, updates: Partial<CollaborationSession>): void {
    const currentSession = this.activeSessions.get(sessionId);
    if (!currentSession) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession = { ...currentSession, ...updates };
    this.activeSessions.set(sessionId, CollaborationSessionSchema.parse(updatedSession));
  }

  /**
   * 结束会话
   */
  endSession(sessionId: string, status: 'completed' | 'failed'): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = status;
    session.metrics.endTime = new Date().toISOString();
    session.metrics.taskProgress = status === 'completed' ? 100 : 0;

    // 移动到历史记录
    this.sessionHistory.unshift(session);
    if (this.sessionHistory.length > MAX_SESSIONS_HISTORY) {
      this.sessionHistory = this.sessionHistory.slice(0, MAX_SESSIONS_HISTORY);
    }

    this.activeSessions.delete(sessionId);
  }

  // ==================== 消息管理 ====================

  /**
   * 记录消息
   */
  recordMessage(
    sessionId: string,
    agentId: string,
    type: string,
    content: string,
    metadata?: ContextRecord
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      agentId,
      type: type as 'request' | 'response' | 'notification' | 'error',
      content,
      metadata
    };

    session.messages.push(message);
    session.metrics.totalMessages++;
    session.metrics.agentInteractions[agentId] = (session.metrics.agentInteractions[agentId] || 0) + 1;
  }

  /**
   * 获取会话消息
   */
  getSessionMessages(sessionId: string, limit?: number): CollaborationSession['messages'] {
    const session = this.activeSessions.get(sessionId) || this.sessionHistory.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const messages = session.messages;
    return limit ? messages.slice(-limit) : messages;
  }

  // ==================== 上下文管理 ====================

  /**
   * 压缩会话上下文
   */
  compressContext(
    sessionId: string,
    context: Record<string, unknown>,
    algorithm: 'summary' | 'keypoints' | 'hierarchical' = 'summary'
  ): ContextCompression {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const compression = this.contextCache.compress(context, algorithm);

    // 添加到会话上下文
    session.context.compressed.push({
      id: compression.id,
      timestamp: compression.timestamp,
      summary: (compression.data.summary as string) || '',
      keyPoints: (compression.data.keypoints as string[]) || [],
      references: {},
      size: compression.compressedSize
    });

    return compression;
  }

  /**
   * 检索压缩上下文
   */
  retrieveContext(compressionId: string): Record<string, unknown> | null {
    return this.contextCache.retrieve(compressionId);
  }

  // ==================== 检查点管理 ====================

  /**
   * 创建检查点
   */
  createCheckpoint(sessionId: string, description: string): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const checkpointId = `checkpoint_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const checkpoint = {
      id: checkpointId,
      timestamp: new Date().toISOString(),
      description,
      state: {
        messages: [...session.messages],
        context: { ...session.context.shared },
        metrics: { ...session.metrics },
        agentStates: session.agents.map(agent => ({ ...agent }))
      }
    };

    session.context.checkpoints.push(checkpoint);
    return checkpointId;
  }

  /**
   * 从检查点恢复
   */
  restoreFromCheckpoint(sessionId: string, checkpointId: string): CheckpointState {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const checkpoint = session.context.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    return checkpoint.state;
  }

  // ==================== 指标查询 ====================

  /**
   * 获取协作指标
   */
  getCollaborationMetrics(sessionId: string): CollaborationSession['metrics'] {
    const session = this.activeSessions.get(sessionId) || this.sessionHistory.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return { ...session.metrics };
  }

  // ==================== 数据导出/导入 ====================

  /**
   * 导出会话
   */
  exportSession(sessionId: string): Record<string, unknown> {
    const session = this.activeSessions.get(sessionId) || this.sessionHistory.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      session,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * 导入会话
   */
  importSession(data: Record<string, unknown>): string {
    if (!data.session || !data.version) {
      throw new Error('Invalid session data format');
    }

    const session = CollaborationSessionSchema.parse(data.session);
    this.activeSessions.set(session.id, session);

    return session.id;
  }

  /**
   * 获取所有活跃会话（用于持久化）
   */
  getActiveSessions(): Map<string, CollaborationSession> {
    return this.activeSessions;
  }

  /**
   * 获取会话历史（用于持久化）
   */
  getSessionHistory(): CollaborationSession[] {
    return this.sessionHistory;
  }

  /**
   * 设置活跃会话（用于加载状态）
   */
  setActiveSessions(sessions: Map<string, CollaborationSession>): void {
    this.activeSessions = sessions;
  }

  /**
   * 设置会话历史（用于加载状态）
   */
  setSessionHistory(history: CollaborationSession[]): void {
    this.sessionHistory = history;
  }
}
