#!/usr/bin/env node

/**
 * Agent 状态管理器实现
 * 提供完整的 Agent 协作跟踪、上下文压缩、状态持久化功能
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
import {
  AgentState,
  CollaborationSession,
  ContextCompression,
  AgentStateManager,
  CompressedContext
} from '../types';

// ==================== 状态管理配置 ====================

const STATE_DIR = path.join(os.homedir(), '.oh-my-claude', 'state');
const AGENT_STATE_FILE = path.join(STATE_DIR, 'agent-states.json');
const SESSION_STATE_FILE = path.join(STATE_DIR, 'sessions.json');
const CONTEXT_CACHE_FILE = path.join(STATE_DIR, 'context-cache.json');

// 缓存配置
const CONTEXT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天
const MAX_SESSIONS_HISTORY = 100;
const MAX_CONTEXT_CACHE_SIZE = 50;

// ==================== Zod 验证模式 ====================

const AgentStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['idle', 'working', 'waiting', 'completed', 'failed']),
  currentTask: z.string().optional(),
  lastActive: z.string(),
  performance: z.object({
    totalTasks: z.number().min(0),
    completedTasks: z.number().min(0),
    failedTasks: z.number().min(0),
    averageResponseTime: z.number().min(0),
    successRate: z.number().min(0).max(1)
  }),
  context: z.object({
    shortTerm: z.record(z.any()),
    longTerm: z.record(z.any()),
    preferences: z.record(z.any())
  })
});

const CollaborationSessionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  taskId: z.string(),
  description: z.string(),
  status: z.enum(['active', 'completed', 'failed', 'paused']),
  agents: z.array(AgentStateSchema),
  messages: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    agentId: z.string(),
    type: z.enum(['request', 'response', 'notification', 'error']),
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })),
  context: z.object({
    shared: z.record(z.any()),
    compressed: z.array(z.any()), // CompressedContext schema
    checkpoints: z.array(z.object({
      id: z.string(),
      timestamp: z.string(),
      description: z.string(),
      state: z.record(z.any())
    }))
  }),
  metrics: z.object({
    startTime: z.string(),
    endTime: z.string().optional(),
    totalMessages: z.number().min(0),
    agentInteractions: z.record(z.number()),
    taskProgress: z.number().min(0).max(100),
    estimatedCompletion: z.string().optional()
  })
});

// ==================== AgentStateManager 实现 ====================

export class AgentStateManagerImpl implements AgentStateManager {
  private agentStates: Map<string, AgentState> = new Map();
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private contextCache: Map<string, ContextCompression> = new Map();
  private sessionHistory: CollaborationSession[] = [];
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadState();
      this.initialized = true;
      console.log('✅ Agent 状态管理器初始化完成');
    } catch (error) {
      console.warn('⚠️  Agent 状态管理器初始化失败，使用默认状态:', error);
      this.initialized = true;
    }
  }

  // ==================== Agent 状态管理 ====================

  getAgentState(agentId: string): AgentState | null {
    return this.agentStates.get(agentId) || null;
  }

  updateAgentState(agentId: string, updates: Partial<AgentState>): void {
    const currentState = this.agentStates.get(agentId);
    if (!currentState) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const updatedState = { ...currentState, ...updates, lastActive: new Date().toISOString() };
    this.agentStates.set(agentId, AgentStateSchema.parse(updatedState));
  }

  registerAgent(agentId: string, name: string): AgentState {
    if (this.agentStates.has(agentId)) {
      throw new Error(`Agent ${agentId} already registered`);
    }

    const agentState: AgentState = {
      id: agentId,
      name,
      status: 'idle',
      lastActive: new Date().toISOString(),
      performance: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        successRate: 0
      },
      context: {
        shortTerm: {},
        longTerm: {},
        preferences: {}
      }
    };

    this.agentStates.set(agentId, AgentStateSchema.parse(agentState));
    return agentState;
  }

  // ==================== 协作会话管理 ====================

  createSession(taskId: string, description: string, agentIds: string[]): CollaborationSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // 验证所有 agents 都已注册
    const agents: AgentState[] = [];
    for (const agentId of agentIds) {
      const agentState = this.agentStates.get(agentId);
      if (!agentState) {
        throw new Error(`Agent ${agentId} not registered`);
      }
      agents.push(agentState);
    }

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

    this.activeSessions.set(sessionId, CollaborationSessionSchema.parse(session));

    // 初始化 agent 交互计数
    for (const agentId of agentIds) {
      session.metrics.agentInteractions[agentId] = 0;
    }

    return session;
  }

  getActiveSession(sessionId: string): CollaborationSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  updateSession(sessionId: string, updates: Partial<CollaborationSession>): void {
    const currentSession = this.activeSessions.get(sessionId);
    if (!currentSession) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession = { ...currentSession, ...updates };
    this.activeSessions.set(sessionId, CollaborationSessionSchema.parse(updatedSession));
  }

  endSession(sessionId: string, status: 'completed' | 'failed'): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 更新会话状态
    session.status = status;
    session.metrics.endTime = new Date().toISOString();

    // 计算最终指标
    session.metrics.taskProgress = status === 'completed' ? 100 : 0;

    // 移动到历史记录
    this.sessionHistory.unshift(session);
    if (this.sessionHistory.length > MAX_SESSIONS_HISTORY) {
      this.sessionHistory = this.sessionHistory.slice(0, MAX_SESSIONS_HISTORY);
    }

    // 从活跃会话中移除
    this.activeSessions.delete(sessionId);
  }

  // ==================== 消息记录 ====================

  recordMessage(sessionId: string, agentId: string, type: string, content: string, metadata?: Record<string, any>): void {
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

    // 更新 agent 交互计数
    session.metrics.agentInteractions[agentId] = (session.metrics.agentInteractions[agentId] || 0) + 1;
  }

  getSessionMessages(sessionId: string, limit?: number): any[] {
    const session = this.activeSessions.get(sessionId) || this.sessionHistory.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const messages = session.messages;
    return limit ? messages.slice(-limit) : messages;
  }

  // ==================== 上下文管理 ====================

  compressContext(sessionId: string, context: Record<string, any>, algorithm: string = 'summary'): ContextCompression {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const contextStr = JSON.stringify(context);
    const originalSize = Buffer.byteLength(contextStr, 'utf8');

    const compressedData: Record<string, unknown> = {};
    let compressedSize = 0;

    // 根据算法进行压缩
    switch (algorithm) {
      case 'summary':
        compressedData.summary = this.generateSummary(context);
        break;
      case 'keypoints':
        compressedData.keypoints = this.extractKeypoints(context);
        break;
      case 'hierarchical':
        compressedData.hierarchy = this.buildHierarchy(context);
        break;
      default:
        compressedData.summary = this.generateSummary(context);
    }

    const compressedStr = JSON.stringify(compressedData);
    compressedSize = Buffer.byteLength(compressedStr, 'utf8');

    const compression: ContextCompression = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      algorithm: algorithm as 'summary' | 'keypoints' | 'embedding' | 'hierarchical',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CONTEXT_CACHE_TTL).toISOString(),
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
      data: compressedData
    };

    // 添加到会话上下文
    session.context.compressed.push({
      id: compression.id,
      timestamp: compression.timestamp,
      summary: (compressedData.summary as string) || '',
      keyPoints: (compressedData.keypoints as string[]) || [],
      references: {},
      size: compressedSize
    });

    // 添加到缓存
    this.contextCache.set(compression.id, compression);

    // 清理过期缓存
    this.cleanupExpiredContexts();

    return compression;
  }

  retrieveContext(compressionId: string): Record<string, any> | null {
    const compression = this.contextCache.get(compressionId);
    if (!compression) {
      return null;
    }

    // 更新访问统计
    compression.accessCount++;
    compression.lastAccessed = new Date().toISOString();

    // 根据算法解压上下文
    switch (compression.algorithm) {
      case 'summary':
        return this.expandFromSummary(compression.data.summary!);
      case 'keypoints':
        return this.expandFromKeypoints(compression.data.keypoints!);
      case 'hierarchical':
        return this.expandFromHierarchy(compression.data.hierarchy!);
      default:
        return this.expandFromSummary(compression.data.summary!);
    }
  }

  cleanupExpiredContexts(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [id, compression] of this.contextCache.entries()) {
      if (compression.expiresAt && new Date(compression.expiresAt).getTime() < now) {
        this.contextCache.delete(id);
        cleaned++;
      }
    }

    // 如果缓存过大，清理最少使用的
    if (this.contextCache.size > MAX_CONTEXT_CACHE_SIZE) {
      const entries = Array.from(this.contextCache.entries());
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount);

      const toRemove = entries.slice(0, this.contextCache.size - MAX_CONTEXT_CACHE_SIZE);
      for (const [id] of toRemove) {
        this.contextCache.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  // ==================== 检查点管理 ====================

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

  restoreFromCheckpoint(sessionId: string, checkpointId: string): Record<string, any> {
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

  // ==================== 性能监控 ====================

  recordPerformance(agentId: string, taskId: string, duration: number, success: boolean): void {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // 更新性能指标
    agentState.performance.totalTasks++;
    if (success) {
      agentState.performance.completedTasks++;
    } else {
      agentState.performance.failedTasks++;
    }

    // 更新平均响应时间
    const currentAvg = agentState.performance.averageResponseTime;
    const totalTasks = agentState.performance.totalTasks;
    agentState.performance.averageResponseTime = (currentAvg * (totalTasks - 1) + duration) / totalTasks;

    // 更新成功率
    agentState.performance.successRate = agentState.performance.completedTasks / agentState.performance.totalTasks;
  }

  getAgentMetrics(agentId: string): AgentState['performance'] {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return { ...agentState.performance };
  }

  getCollaborationMetrics(sessionId: string): CollaborationSession['metrics'] {
    const session = this.activeSessions.get(sessionId) || this.sessionHistory.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return { ...session.metrics };
  }

  // ==================== 数据持久化 ====================

  async saveState(): Promise<void> {
    // 确保目录存在
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }

    // 保存 agent 状态
    const agentStates = Object.fromEntries(this.agentStates);
    fs.writeFileSync(AGENT_STATE_FILE, JSON.stringify(agentStates, null, 2));

    // 保存会话状态
    const sessions = {
      active: Object.fromEntries(this.activeSessions),
      history: this.sessionHistory
    };
    fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(sessions, null, 2));

    // 保存上下文缓存
    const contextCache = Object.fromEntries(this.contextCache);
    fs.writeFileSync(CONTEXT_CACHE_FILE, JSON.stringify(contextCache, null, 2));
  }

  async loadState(): Promise<void> {
    try {
      // 加载 agent 状态
      if (fs.existsSync(AGENT_STATE_FILE)) {
        const agentData = JSON.parse(fs.readFileSync(AGENT_STATE_FILE, 'utf8'));
        for (const [id, state] of Object.entries(agentData)) {
          this.agentStates.set(id, AgentStateSchema.parse(state));
        }
      }

      // 加载会话状态
      if (fs.existsSync(SESSION_STATE_FILE)) {
        const sessionData = JSON.parse(fs.readFileSync(SESSION_STATE_FILE, 'utf8'));
        for (const [id, session] of Object.entries(sessionData.active)) {
          this.activeSessions.set(id, CollaborationSessionSchema.parse(session));
        }
        this.sessionHistory = sessionData.history.map((s: any) => CollaborationSessionSchema.parse(s));
      }

      // 加载上下文缓存
      if (fs.existsSync(CONTEXT_CACHE_FILE)) {
        const cacheData = JSON.parse(fs.readFileSync(CONTEXT_CACHE_FILE, 'utf8'));
        for (const [id, compression] of Object.entries(cacheData)) {
          this.contextCache.set(id, compression as ContextCompression);
        }
      }
    } catch (error) {
      console.warn('加载状态数据失败:', error);
      throw error;
    }
  }

  exportSession(sessionId: string): Record<string, any> {
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

  importSession(data: Record<string, any>): string {
    if (!data.session || !data.version) {
      throw new Error('Invalid session data format');
    }

    const session = CollaborationSessionSchema.parse(data.session);
    this.activeSessions.set(session.id, session);

    return session.id;
  }

  // ==================== 辅助方法 ====================

  private generateSummary(context: Record<string, any>): string {
    // 简单的摘要生成逻辑
    const keys = Object.keys(context);
    return `Context contains ${keys.length} items: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`;
  }

  private extractKeypoints(context: Record<string, any>): string[] {
    // 简单的关键点提取逻辑
    const keypoints: string[] = [];
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string' && value.length < 100) {
        keypoints.push(`${key}: ${value}`);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        keypoints.push(`${key}: ${value}`);
      }
    }
    return keypoints.slice(0, 10); // 限制数量
  }

  private buildHierarchy(context: Record<string, any>): Record<string, any> {
    // 简单的层次结构构建
    const hierarchy: Record<string, any> = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'object' && value !== null) {
        hierarchy[key] = { type: 'object', keys: Object.keys(value) };
      } else {
        hierarchy[key] = { type: typeof value, value };
      }
    }
    return hierarchy;
  }

  private expandFromSummary(summary: string): Record<string, any> {
    // 从摘要恢复上下文（简化实现）
    return { summary, reconstructed: true };
  }

  private expandFromKeypoints(keypoints: string[]): Record<string, any> {
    // 从关键点恢复上下文
    const context: Record<string, any> = {};
    for (const point of keypoints) {
      const [key, ...valueParts] = point.split(': ');
      if (key && valueParts.length > 0) {
        context[key] = valueParts.join(': ');
      }
    }
    return context;
  }

  private expandFromHierarchy(hierarchy: Record<string, any>): Record<string, any> {
    // 从层次结构恢复上下文
    const context: Record<string, any> = {};
    for (const [key, info] of Object.entries(hierarchy)) {
      if (info.type === 'object') {
        context[key] = { placeholder: true, originalKeys: info.keys };
      } else {
        context[key] = info.value;
      }
    }
    return context;
  }
}

// ==================== 导出 ====================

export default AgentStateManagerImpl;