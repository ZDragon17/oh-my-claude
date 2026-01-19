// 类型定义文件

/**
 * 通用上下文值类型 - 替代 any 提供更好的类型安全
 * 支持常见的 JSON 兼容数据类型
 */
export type ContextValue =
  | string
  | number
  | boolean
  | null
  | ContextValue[]
  | { [key: string]: ContextValue };

/**
 * 上下文记录类型 - 替代 Record<string, any>
 */
export type ContextRecord = Record<string, ContextValue>;

/**
 * 消息记录类型
 */
export interface MessageRecord {
  id: string;
  timestamp: string;
  agentId: string;
  type: 'request' | 'response' | 'notification' | 'error';
  content: string;
  metadata?: ContextRecord;
}

/**
 * 检查点数据类型
 */
export interface CheckpointData {
  id: string;
  timestamp: string;
  description: string;
  state: ContextRecord;
}

export interface PluginConfig {
  version: string;
  name?: string;
  description?: string;
}

export interface TaskSnapshot {
  id: string;
  taskId?: string;
  timestamp: string;
  type: string;
  status: string;
  progress: number;
  agents: string[];
  context: ContextRecord;
  checkpoint?: CheckpointData;
}

export interface AgentCollaboration {
  id: string;
  timestamp: string;
  agents: Array<{
    name: string;
    status: string;
  }>;
  task: {
    description: string;
    status: string;
  };
  status: string;
  messages: string[];
  context: ContextRecord;
}

export interface CompressedContext {
  id: string;
  timestamp: string;
  summary: string;
  keyPoints: string[];
  references: ContextRecord;
  size: number;
}

export interface ContextSnapshots {
  compressedContexts: Record<string, CompressedContext>;
  keyReferences: ContextRecord;
  contextSnapshots: CheckpointData[];
}

export interface PluginState {
  version: string;
  installed: boolean;
  installTime: string | null;
  lastUpdate: string;
  agents: Array<{
    name: string;
    file: string;
    checksum?: string;
  }>;
  commands: Array<{
    name: string;
    file: string;
    checksum?: string;
  }>;
  hooks: Array<{
    file: string;
    checksum?: string;
  }>;
  skills: Array<{
    name: string;
    checksum?: string;
  }>;
  checksums: Record<string, string>;
  tasks: {
    activeTasks: TaskSnapshot[];
    completedTasks: TaskSnapshot[];
    failedTasks: TaskSnapshot[];
    taskHistory: TaskSnapshot[];
  };
  agentCollaboration: {
    activeSessions: AgentCollaboration[];
    agentStates: Record<string, AgentState>;
    collaborationHistory: AgentCollaboration[];
  };
  context: ContextSnapshots;
  performance: {
    taskCompletionRate: number;
    averageTaskDuration: number;
    agentUtilization: Record<string, number>;
    errorRates: Record<string, number>;
  };
}

export interface TaskRecoveryPlan {
  canRecover: boolean;
  reason: string;
  recoveryPlan?: {
    checkpointId: string;
    lastProgress: number;
    currentStep: number;
    nextAction: string;
    contextSnapshot: ContextRecord;
    recoverySteps: string[];
  };
}

export interface ComplexityAnalysis {
  score: number;
  level: string;
  factors: string[];
  maxScore: number;
}

// ==================== Agent 状态管理 ====================

export interface AgentState {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'waiting' | 'completed' | 'failed';
  currentTask?: string;
  lastActive: string;
  performance: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    successRate: number;
  };
  context: {
    shortTerm: ContextRecord;
    longTerm: ContextRecord;
    preferences: ContextRecord;
  };
}

export interface CollaborationSession {
  id: string;
  timestamp: string;
  taskId: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'paused';
  agents: AgentState[];
  messages: MessageRecord[];
  context: {
    shared: ContextRecord;
    compressed: CompressedContext[];
    checkpoints: CheckpointData[];
  };
  metrics: {
    startTime: string;
    endTime?: string;
    totalMessages: number;
    agentInteractions: Record<string, number>;
    taskProgress: number;
    estimatedCompletion?: string;
  };
}

export interface ContextCompression {
  id: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: 'summary' | 'keypoints' | 'embedding' | 'hierarchical';
  timestamp: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed: string;
  data: {
    summary?: string;
    keypoints?: string[];
    embedding?: number[];
    hierarchy?: ContextRecord;
  };
}

export interface AgentStateManager {
  // Agent 状态管理
  getAgentState(agentId: string): AgentState | null;
  updateAgentState(agentId: string, updates: Partial<AgentState>): void;
  registerAgent(agentId: string, name: string): AgentState;

  // 协作会话管理
  createSession(taskId: string, description: string, agents: string[]): CollaborationSession;
  getActiveSession(sessionId: string): CollaborationSession | null;
  updateSession(sessionId: string, updates: Partial<CollaborationSession>): void;
  endSession(sessionId: string, status: 'completed' | 'failed'): void;

  // 消息记录
  recordMessage(sessionId: string, agentId: string, type: string, content: string, metadata?: ContextRecord): void;
  getSessionMessages(sessionId: string, limit?: number): MessageRecord[];

  // 上下文管理
  compressContext(sessionId: string, context: ContextRecord, algorithm?: string): ContextCompression;
  retrieveContext(compressionId: string): ContextRecord | null;
  cleanupExpiredContexts(): number;

  // 检查点管理
  createCheckpoint(sessionId: string, description: string): string;
  restoreFromCheckpoint(sessionId: string, checkpointId: string): ContextRecord;

  // 性能监控
  recordPerformance(agentId: string, taskId: string, duration: number, success: boolean): void;
  getAgentMetrics(agentId: string): AgentState['performance'];
  getCollaborationMetrics(sessionId: string): CollaborationSession['metrics'];

  // 数据持久化
  saveState(): Promise<void>;
  loadState(): Promise<void>;
  exportSession(sessionId: string): ContextRecord;
  importSession(data: ContextRecord): string;
}