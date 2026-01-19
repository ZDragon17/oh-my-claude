/**
 * Agent 模块聚合导出
 * 提供完整的 Agent 协作跟踪、上下文压缩、状态持久化功能
 */

import type {
  AgentState,
  CollaborationSession,
  ContextCompression,
  CheckpointState,
  AgentStateManager,
  ContextRecord
} from '../../types/index.js';
import { AgentStateStore } from './state-manager.js';
import { SessionManager } from './session-manager.js';
import { ContextCacheManager } from './context-compression.js';
import { PersistenceManager } from './persistence.js';

// ==================== 重新导出子模块 ====================

export * from './types.js';
export { AgentStateStore } from './state-manager.js';
export { SessionManager } from './session-manager.js';
export { ContextCacheManager, generateSummary, extractKeypoints, buildHierarchy } from './context-compression.js';
export { PersistenceManager } from './persistence.js';

// ==================== AgentStateManager 实现 ====================

/**
 * Agent 状态管理器实现
 * 组合各子模块提供完整功能
 */
export class AgentStateManagerImpl implements AgentStateManager {
  private agentStore: AgentStateStore;
  private contextCache: ContextCacheManager;
  private sessionManager: SessionManager;
  private persistence: PersistenceManager;
  private initialized: boolean = false;

  constructor() {
    this.agentStore = new AgentStateStore();
    this.contextCache = new ContextCacheManager();
    this.sessionManager = new SessionManager(this.contextCache);
    this.persistence = new PersistenceManager(this.agentStore, this.sessionManager, this.contextCache);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.persistence.loadState();
      this.initialized = true;
      console.log('✅ Agent 状态管理器初始化完成');
    } catch (error) {
      console.warn('⚠️  Agent 状态管理器初始化失败，使用默认状态:', error);
      this.initialized = true;
    }
  }

  // ==================== Agent 状态管理 ====================

  getAgentState(agentId: string): AgentState | null {
    return this.agentStore.getAgentState(agentId);
  }

  updateAgentState(agentId: string, updates: Partial<AgentState>): void {
    this.agentStore.updateAgentState(agentId, updates);
  }

  registerAgent(agentId: string, name: string): AgentState {
    return this.agentStore.registerAgent(agentId, name);
  }

  // ==================== 协作会话管理 ====================

  createSession(taskId: string, description: string, agentIds: string[]): CollaborationSession {
    // 验证所有 agents 都已注册
    const agents: AgentState[] = [];
    for (const agentId of agentIds) {
      const agentState = this.agentStore.getAgentState(agentId);
      if (!agentState) {
        throw new Error(`Agent ${agentId} not registered`);
      }
      agents.push(agentState);
    }

    return this.sessionManager.createSession(taskId, description, agents);
  }

  getActiveSession(sessionId: string): CollaborationSession | null {
    return this.sessionManager.getActiveSession(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<CollaborationSession>): void {
    this.sessionManager.updateSession(sessionId, updates);
  }

  endSession(sessionId: string, status: 'completed' | 'failed'): void {
    this.sessionManager.endSession(sessionId, status);
  }

  // ==================== 消息记录 ====================

  recordMessage(sessionId: string, agentId: string, type: string, content: string, metadata?: Record<string, unknown>): void {
    this.sessionManager.recordMessage(sessionId, agentId, type, content, metadata as Parameters<SessionManager['recordMessage']>[4]);
  }

  getSessionMessages(sessionId: string, limit?: number): CollaborationSession['messages'] {
    return this.sessionManager.getSessionMessages(sessionId, limit);
  }

  // ==================== 上下文管理 ====================

  compressContext(sessionId: string, context: ContextRecord, algorithm?: string): ContextCompression {
    return this.sessionManager.compressContext(
      sessionId,
      context,
      algorithm as 'summary' | 'keypoints' | 'hierarchical'
    );
  }

  retrieveContext(compressionId: string): ContextRecord | null {
    return this.sessionManager.retrieveContext(compressionId) as ContextRecord | null;
  }

  cleanupExpiredContexts(): number {
    return this.contextCache.cleanupExpired();
  }

  // ==================== 检查点管理 ====================

  createCheckpoint(sessionId: string, description: string): string {
    return this.sessionManager.createCheckpoint(sessionId, description);
  }

  restoreFromCheckpoint(sessionId: string, checkpointId: string): CheckpointState {
    return this.sessionManager.restoreFromCheckpoint(sessionId, checkpointId);
  }

  // ==================== 性能监控 ====================

  recordPerformance(agentId: string, taskId: string, duration: number, success: boolean): void {
    this.agentStore.recordPerformance(agentId, taskId, duration, success);
  }

  getAgentMetrics(agentId: string): AgentState['performance'] {
    return this.agentStore.getAgentMetrics(agentId);
  }

  getCollaborationMetrics(sessionId: string): CollaborationSession['metrics'] {
    return this.sessionManager.getCollaborationMetrics(sessionId);
  }

  // ==================== 数据持久化 ====================

  async saveState(): Promise<void> {
    await this.persistence.saveState();
  }

  async loadState(): Promise<void> {
    await this.persistence.loadState();
  }

  exportSession(sessionId: string): ContextRecord {
    return this.sessionManager.exportSession(sessionId) as ContextRecord;
  }

  importSession(data: ContextRecord): string {
    return this.sessionManager.importSession(data as Record<string, unknown>);
  }
}

// ==================== 默认导出 ====================

export default AgentStateManagerImpl;
