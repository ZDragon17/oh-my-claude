/**
 * 后台任务管理器
 * 对标 oh-my-opencode BackgroundManager
 *
 * 管理后台任务的生命周期：创建、追踪、重试、完成通知
 * 状态持久化到 ~/.oh-my-claude/background-tasks/
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConcurrencyManager } from './concurrency.js';
import {
  BackgroundTask,
  BackgroundTaskStatus,
  BackgroundTaskLaunchInput,
} from './types.js';
import { getCurrentProvider } from './provider-init.js';

const provider = getCurrentProvider();
const STATE_DIR = path.join(provider.getStateDir(), 'background-tasks');
const REGISTER_DIR = path.join(STATE_DIR, 'register');
const ACTIVE_DIR = path.join(STATE_DIR, 'active');

function ensureDirs(): void {
  for (const d of [STATE_DIR, REGISTER_DIR, ACTIVE_DIR]) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }
}

function generateTaskId(): string {
  return `bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function taskPath(taskId: string): string {
  return path.join(ACTIVE_DIR, `${taskId}.json`);
}

function registerPath(taskId: string): string {
  return path.join(REGISTER_DIR, `${taskId}.json`);
}

function readTask(taskId: string): BackgroundTask | null {
  try {
    const p = taskPath(taskId);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8')) as BackgroundTask;
    }
    const rp = registerPath(taskId);
    if (fs.existsSync(rp)) {
      return JSON.parse(fs.readFileSync(rp, 'utf-8')) as BackgroundTask;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeTask(task: BackgroundTask): void {
  ensureDirs();
  if (task.status === 'pending') {
    fs.writeFileSync(registerPath(task.id), JSON.stringify(task, null, 2));
  } else {
    const rp = registerPath(task.id);
    if (fs.existsSync(rp)) fs.unlinkSync(rp);
    fs.writeFileSync(taskPath(task.id), JSON.stringify(task, null, 2));
  }
}

/**
 * 启动一个后台任务
 */
function launch(input: BackgroundTaskLaunchInput): BackgroundTask {
  ensureDirs();

  const model = input.model || provider.getDefaultModel();
  const taskId = generateTaskId();

  // check concurrency
  const acquired = ConcurrencyManager.acquireLock(model, taskId);
  const effectiveStatus: BackgroundTaskStatus = acquired ? 'pending' : 'pending';

  const task: BackgroundTask = {
    id: taskId,
    parentSessionId: provider.getSessionId(),
    description: input.description || input.prompt.slice(0, 80),
    prompt: input.prompt,
    agent: input.agent,
    model,
    status: effectiveStatus,
    attemptCount: 0,
    maxRetries: input.maxRetries || 3,
    createdAt: new Date().toISOString(),
    category: input.category,
    priority: input.priority || 'normal',
  };

  if (!acquired) {
    task.status = 'pending';
  }

  writeTask(task);
  return task;
}

/**
 * 更新任务状态
 */
function updateStatus(
  taskId: string,
  status: BackgroundTaskStatus,
  extra?: { lastError?: string; resultSummary?: string }
): BackgroundTask | null {
  const task = readTask(taskId);
  if (!task) return null;

  const prevStatus = task.status;
  task.status = status;

  if (status === 'running' && prevStatus !== 'running') {
    task.attemptCount += 1;
  }

  if (status === 'completed' || status === 'error') {
    task.completedAt = new Date().toISOString();
    if (task.model) {
      ConcurrencyManager.releaseLock(task.model, task.id);
    }
  }

  if (extra?.lastError) task.lastError = extra.lastError;
  if (extra?.resultSummary) task.resultSummary = extra.resultSummary;

  writeTask(task);
  return task;
}

/**
 * 计算重试的指数退避时间（秒）
 */
function computeBackoff(task: BackgroundTask): number {
  return Math.min(Math.pow(2, task.attemptCount) * 10, 300);
}

/**
 * 为失败任务安排重试
 */
function scheduleRetry(taskId: string): BackgroundTask | null {
  const task = readTask(taskId);
  if (!task) return null;

  if (task.attemptCount >= task.maxRetries) {
    return updateStatus(taskId, 'error', {
      lastError: `已达最大重试次数 (${task.maxRetries})`,
    });
  }

  const backoffSeconds = computeBackoff(task);
  task.nextRetryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();
  task.status = 'pending';
  writeTask(task);
  return task;
}

/**
 * 获取可重试的任务
 */
function getRetryableTasks(): BackgroundTask[] {
  ensureDirs();
  const tasks: BackgroundTask[] = [];
  const now = new Date();

  for (const dir of [REGISTER_DIR, ACTIVE_DIR]) {
    try {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        try {
          const task = JSON.parse(
            fs.readFileSync(path.join(dir, file), 'utf-8')
          ) as BackgroundTask;
          if (
            task.status === 'pending' &&
            task.nextRetryAt &&
            new Date(task.nextRetryAt) <= now
          ) {
            tasks.push(task);
          }
        } catch {
          // skip corrupt files
        }
      }
    } catch {
      // ignore
    }
  }

  return tasks;
}

/**
 * 获取父会话的所有后台任务
 */
function getTasksByParentSession(parentSessionId: string): BackgroundTask[] {
  ensureDirs();
  const tasks: BackgroundTask[] = [];
  for (const dir of [REGISTER_DIR, ACTIVE_DIR]) {
    try {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        try {
          const task = JSON.parse(
            fs.readFileSync(path.join(dir, file), 'utf-8')
          ) as BackgroundTask;
          if (task.parentSessionId === parentSessionId) {
            tasks.push(task);
          }
        } catch {
          // skip
        }
      }
    } catch {
      // ignore
    }
  }
  return tasks;
}

/**
 * 获取任务统计
 */
function getStats(): {
  pending: number;
  running: number;
  completed: number;
  error: number;
  cancelled: number;
} {
  const stats = { pending: 0, running: 0, completed: 0, error: 0, cancelled: 0 };
  for (const dir of [REGISTER_DIR, ACTIVE_DIR]) {
    try {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        try {
          const task = JSON.parse(
            fs.readFileSync(path.join(dir, file), 'utf-8')
          ) as BackgroundTask;
          stats[task.status] += 1;
        } catch {
          // skip
        }
      }
    } catch {
      // ignore
    }
  }
  return stats;
}

/**
 * 清理已完成/已取消的任务（默认保留1小时）
 */
function cleanupStale(maxAgeMs = 60 * 60 * 1000): number {
  ensureDirs();
  let cleaned = 0;
  const now = Date.now();

  for (const dir of [REGISTER_DIR, ACTIVE_DIR]) {
    try {
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        try {
          const task = JSON.parse(
            fs.readFileSync(path.join(dir, file), 'utf-8')
          ) as BackgroundTask;
          if (
            (task.status === 'completed' || task.status === 'cancelled') &&
            task.completedAt &&
            now - new Date(task.completedAt).getTime() > maxAgeMs
          ) {
            fs.unlinkSync(path.join(dir, file));
            cleaned++;
          }
        } catch {
          // skip
        }
      }
    } catch {
      // ignore
    }
  }
  return cleaned;
}

/**
 * 取消任务
 */
function cancelTask(taskId: string): BackgroundTask | null {
  const task = readTask(taskId);
  if (!task) return null;
  return updateStatus(taskId, 'cancelled');
}

export const BackgroundManager = {
  launch,
  readTask,
  updateStatus,
  scheduleRetry,
  getRetryableTasks,
  getTasksByParentSession,
  getStats,
  cleanupStale,
  cancelTask,
  computeBackoff,
  STATE_DIR,
  REGISTER_DIR,
  ACTIVE_DIR,
};
