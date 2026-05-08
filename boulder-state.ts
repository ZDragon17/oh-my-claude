/**
 * Boulder 状态管理
 * 对标 oh-my-opencode boulder-state
 *
 * 管理持久化的 boulder 计划状态：
 * - 活跃计划跟踪
 * - 会话 ID 收集
 * - 任务会话状态
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getCurrentProvider } from './provider-init.js';

const BOULDER_DIR = path.join(getCurrentProvider().getStateDir(), 'boulder');
const BOULDER_STATE_PATH = path.join(BOULDER_DIR, 'state.json');
const LINEAGE_PATH = path.join(BOULDER_DIR, 'lineage.jsonl');

export interface TaskSessionState {
  taskId: string;
  sessionId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  description: string;
  agent: string;
  createdAt: string;
  completedAt?: string;
}

export interface BoulderState {
  activePlan: string | null;
  planName: string;
  startedAt: string;
  sessionIds: string[];
  sessionOrigins: Record<string, 'direct' | 'appended'>;
  taskSessions: Record<string, TaskSessionState>;
  totalTasks: number;
  completedTasks: number;
  finalWaveApproved: boolean;
}

function ensureDir(): void {
  if (!fs.existsSync(BOULDER_DIR)) {
    fs.mkdirSync(BOULDER_DIR, { recursive: true });
  }
}

function createDefaultState(planName?: string): BoulderState {
  return {
    activePlan: planName || null,
    planName: planName || 'unnamed',
    startedAt: new Date().toISOString(),
    sessionIds: [],
    sessionOrigins: {},
    taskSessions: {},
    totalTasks: 0,
    completedTasks: 0,
    finalWaveApproved: false,
  };
}

/** 读取 boulder 状态 */
function readBoulderState(): BoulderState {
  ensureDir();
  try {
    if (fs.existsSync(BOULDER_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(BOULDER_STATE_PATH, 'utf-8')) as BoulderState;
    }
  } catch {
    // return default
  }
  return createDefaultState();
}

/** 写入 boulder 状态 */
function writeBoulderState(state: BoulderState): void {
  ensureDir();
  fs.writeFileSync(BOULDER_STATE_PATH, JSON.stringify(state, null, 2));
}

/** 开始新的 boulder 计划 */
function startPlan(planName: string): BoulderState {
  const state = createDefaultState(planName);
  writeBoulderState(state);
  return state;
}

/** 添加会话到 boulder */
function appendSession(sessionId: string, origin: 'direct' | 'appended' = 'direct'): BoulderState {
  const state = readBoulderState();
  if (!state.sessionIds.includes(sessionId)) {
    state.sessionIds.push(sessionId);
    state.sessionOrigins[sessionId] = origin;
    writeBoulderState(state);
  }
  return state;
}

/** 添加/更新任务会话 */
function upsertTaskSession(taskState: TaskSessionState): BoulderState {
  const state = readBoulderState();
  const prevStatus = state.taskSessions[taskState.taskId]?.status;

  state.taskSessions[taskState.taskId] = taskState;

  // 更新计数
  if (prevStatus !== 'completed' && taskState.status === 'completed') {
    state.completedTasks += 1;
  }
  if (!prevStatus) {
    state.totalTasks += 1;
  }

  writeBoulderState(state);
  return state;
}

/** 检查是否所有任务已完成 */
function isPlanComplete(): boolean {
  const state = readBoulderState();
  return state.totalTasks > 0 && state.completedTasks >= state.totalTasks;
}

/** 获取计划进度 */
function getPlanProgress(): { completed: number; total: number; percent: number } {
  const state = readBoulderState();
  const percent = state.totalTasks > 0
    ? Math.round((state.completedTasks / state.totalTasks) * 100)
    : 0;
  return { completed: state.completedTasks, total: state.totalTasks, percent };
}

/** 设置最终波次审批 */
function approveFinalWave(): BoulderState {
  const state = readBoulderState();
  state.finalWaveApproved = true;
  writeBoulderState(state);
  return state;
}

/** 追加会话谱系条目 */
function appendLineage(entry: {
  sessionId: string;
  parentSessionId?: string;
  planName: string;
  event: 'created' | 'completed' | 'error' | 'appended';
  timestamp?: string;
}): void {
  ensureDir();
  const line = JSON.stringify({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  fs.appendFileSync(LINEAGE_PATH, line + '\n');
}

/** 读取会话谱系 */
function readLineage(): Array<Record<string, unknown>> {
  ensureDir();
  try {
    if (fs.existsSync(LINEAGE_PATH)) {
      return fs.readFileSync(LINEAGE_PATH, 'utf-8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));
    }
  } catch {
    // ignore
  }
  return [];
}

/** 清除 boulder 状态 */
function clearBoulderState(): void {
  try {
    if (fs.existsSync(BOULDER_STATE_PATH)) fs.unlinkSync(BOULDER_STATE_PATH);
    if (fs.existsSync(LINEAGE_PATH)) fs.unlinkSync(LINEAGE_PATH);
  } catch {
    // ignore
  }
}

export const BoulderStateManager = {
  readBoulderState,
  writeBoulderState,
  startPlan,
  appendSession,
  upsertTaskSession,
  isPlanComplete,
  getPlanProgress,
  approveFinalWave,
  appendLineage,
  readLineage,
  clearBoulderState,
  BOULDER_DIR,
};
