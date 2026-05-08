/**
 * 后台任务系统类型定义
 * 对标 oh-my-opencode BackgroundTask
 */

export type BackgroundTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface BackgroundTask {
  id: string;
  parentSessionId: string;
  description: string;
  prompt: string;
  agent: string;
  model?: string;
  status: BackgroundTaskStatus;
  attemptCount: number;
  maxRetries: number;
  lastError?: string;
  nextRetryAt?: string;
  createdAt: string;
  completedAt?: string;
  resultSummary?: string;
  category?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface TaskSnapshot {
  completedCount: number;
  totalCount: number;
  todoHash: string;
  capturedAt: string;
}

export interface EnforcerState {
  sessionId: string;
  consecutiveFailures: number;
  lastCompactionAt: string | null;
  cooldownUntil: string | null;
  lastProgressAt: string;
  stagnationCount: number;
  stagnationThreshold: number;
  lastTodoSnapshot: TaskSnapshot | null;
  wasCancelled: boolean;
  tokenLimitDetected: boolean;
  abortDetectedAt: string | null;
}

export interface ConcurrencySlot {
  model: string;
  provider: string;
  activeCount: number;
  maxSlots: number;
}

export interface BackgroundTaskLaunchInput {
  agent: string;
  prompt: string;
  model?: string;
  description?: string;
  category?: string;
  priority?: 'high' | 'normal' | 'low';
  maxRetries?: number;
}
