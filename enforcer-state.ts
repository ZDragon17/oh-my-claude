/**
 * TODO 续航强制执行器状态机
 * 对标 oh-my-opencode todo-continuation-enforcer
 *
 * 增强功能:
 * - 指数退避: delay = min(baseDelay * 2^failures, maxDelay)
 * - 停滞检测: 连续 N 次无进展 → 停止
 * - 压缩保护: 压缩后 60s 冷却
 * - 中止/令牌限制检测
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getCurrentProvider } from './provider-init.js';

const STATE_DIR = path.join(getCurrentProvider().getStateDir(), 'state');
const ENFORCER_STATE_PATH = path.join(STATE_DIR, 'enforcer-state.json');
const BASE_DELAY_SECONDS = 2;
const MAX_DELAY_SECONDS = 120;
const MAX_STAGNATION = 3;
const COMPACTION_COOLDOWN_SECONDS = 60;
const MAX_CONSECUTIVE_FAILURES = 5;
const FAILURE_RESET_WINDOW_MS = 5 * 60 * 1000;

export interface EnforcerState {
  sessionId: string;
  consecutiveFailures: number;
  lastCompactionAt: string | null;
  cooldownUntil: string | null;
  lastProgressAt: string;
  stagnationCount: number;
  stagnationThreshold: number;
  lastTodoHash: string | null;
  wasCancelled: boolean;
  abortDetectedAt: string | null;
  tokenLimitDetected: boolean;
  lastInjectedAt: string | null;
  isInjecting: boolean;
}

function ensureStateDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function readState(sessionId: string): EnforcerState {
  ensureStateDir();
  try {
    if (fs.existsSync(ENFORCER_STATE_PATH)) {
      const all = JSON.parse(fs.readFileSync(ENFORCER_STATE_PATH, 'utf-8')) as Record<string, EnforcerState>;
      if (all[sessionId]) return all[sessionId];
    }
  } catch {
    // start fresh
  }
  return createDefaultState(sessionId);
}

function createDefaultState(sessionId: string): EnforcerState {
  return {
    sessionId,
    consecutiveFailures: 0,
    lastCompactionAt: null,
    cooldownUntil: null,
    lastProgressAt: new Date().toISOString(),
    stagnationCount: 0,
    stagnationThreshold: MAX_STAGNATION,
    lastTodoHash: null,
    wasCancelled: false,
    abortDetectedAt: null,
    tokenLimitDetected: false,
    lastInjectedAt: null,
    isInjecting: false,
  };
}

function writeState(state: EnforcerState): void {
  ensureStateDir();
  let all: Record<string, EnforcerState> = {};
  try {
    if (fs.existsSync(ENFORCER_STATE_PATH)) {
      all = JSON.parse(fs.readFileSync(ENFORCER_STATE_PATH, 'utf-8'));
    }
  } catch {
    // start fresh
  }
  all[state.sessionId] = state;
  fs.writeFileSync(ENFORCER_STATE_PATH, JSON.stringify(all, null, 2));
}

/** 计算指数退避延迟（秒） */
function computeBackoff(consecutiveFailures: number): number {
  return Math.min(BASE_DELAY_SECONDS * Math.pow(2, consecutiveFailures), MAX_DELAY_SECONDS);
}

/** 检查是否处于压缩冷却期 */
function isInCompactionCooldown(state: EnforcerState): boolean {
  if (!state.lastCompactionAt) return false;
  const elapsed = Date.now() - new Date(state.lastCompactionAt).getTime();
  return elapsed < COMPACTION_COOLDOWN_SECONDS * 1000;
}

/** 计算待办事项哈希用于停滞检测 */
function computeTodoHash(todos: unknown[]): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(JSON.stringify(todos)).digest('hex');
}

/** 检查是否有进展（与上次快照相比） */
function checkProgress(state: EnforcerState, currentTodoHash: string): boolean {
  if (!state.lastTodoHash) return true; // 首次检查，视作有进展
  return currentTodoHash !== state.lastTodoHash;
}

/** 处理停滞检测 */
function handleStagnation(state: EnforcerState, hasProgress: boolean): {
  shouldStop: boolean;
  state: EnforcerState;
} {
  if (hasProgress) {
    state.stagnationCount = 0;
    state.lastProgressAt = new Date().toISOString();
    return { shouldStop: false, state };
  }

  state.stagnationCount += 1;
  if (state.stagnationCount >= state.stagnationThreshold) {
    return { shouldStop: true, state };
  }
  return { shouldStop: false, state };
}

/** 清理失败的会话状态 */
function resetFailuresIfStale(state: EnforcerState): EnforcerState {
  if (
    state.lastInjectedAt &&
    Date.now() - new Date(state.lastInjectedAt).getTime() > FAILURE_RESET_WINDOW_MS
  ) {
    state.consecutiveFailures = 0;
  }
  return state;
}

/** 主决策逻辑 */
function shouldContinue(
  sessionId: string,
  currentTodoHash: string,
  events: { compaction?: boolean; abort?: boolean; tokenLimit?: boolean }
): {
  shouldContinue: boolean;
  backoffSeconds: number;
  reason: string;
  state: EnforcerState;
} {
  let state = readState(sessionId);
  state = resetFailuresIfStale(state);

  // 中止检测
  if (events.abort) {
    state.wasCancelled = true;
    state.abortDetectedAt = new Date().toISOString();
    writeState(state);
    return { shouldContinue: false, backoffSeconds: 0, reason: 'abort_detected', state };
  }

  // 令牌限制检测
  if (events.tokenLimit) {
    state.tokenLimitDetected = true;
    writeState(state);
    return { shouldContinue: false, backoffSeconds: 0, reason: 'token_limit_detected', state };
  }

  // 如果已取消
  if (state.wasCancelled) {
    return { shouldContinue: false, backoffSeconds: 0, reason: 'previously_cancelled', state };
  }

  // 压缩冷却
  if (isInCompactionCooldown(state)) {
    return { shouldContinue: false, backoffSeconds: 0, reason: 'compaction_cooldown', state };
  }

  // 超出最大故障次数
  if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    return { shouldContinue: false, backoffSeconds: 0, reason: 'max_failures_exceeded', state };
  }

  // 停滞检测
  const hasProgress = checkProgress(state, currentTodoHash);
  const stagnationResult = handleStagnation(state, hasProgress);
  state = stagnationResult.state;
  if (stagnationResult.shouldStop) {
    writeState(state);
    return { shouldContinue: false, backoffSeconds: 0, reason: 'stagnation_detected', state };
  }

  // 计算退避
  const backoffSeconds = computeBackoff(state.consecutiveFailures);
  state.lastTodoHash = currentTodoHash;
  state.lastInjectedAt = new Date().toISOString();
  state.isInjecting = true;

  writeState(state);
  return { shouldContinue: true, backoffSeconds, reason: 'todos_incomplete', state };
}

/** 标记注入完成（无论成功或失败） */
function markInjectionComplete(sessionId: string, success: boolean): EnforcerState {
  let state = readState(sessionId);
  state.isInjecting = false;

  if (success) {
    state.consecutiveFailures = 0;
  } else {
    state.consecutiveFailures += 1;
  }

  writeState(state);
  return state;
}

/** 标记压缩事件 */
function markCompaction(sessionId: string): void {
  let state = readState(sessionId);
  state.lastCompactionAt = new Date().toISOString();
  writeState(state);
}

/** 标记取消 */
function markCancelled(sessionId: string): void {
  let state = readState(sessionId);
  state.wasCancelled = true;
  state.abortDetectedAt = new Date().toISOString();
  writeState(state);
}

/** 清除会话状态 */
function clearState(sessionId: string): void {
  try {
    if (fs.existsSync(ENFORCER_STATE_PATH)) {
      const all = JSON.parse(fs.readFileSync(ENFORCER_STATE_PATH, 'utf-8'));
      delete all[sessionId];
      fs.writeFileSync(ENFORCER_STATE_PATH, JSON.stringify(all, null, 2));
    }
  } catch {
    // ignore
  }
}

export const EnforcerStateMachine = {
  readState,
  writeState,
  shouldContinue,
  markInjectionComplete,
  markCompaction,
  markCancelled,
  clearState,
  computeBackoff,
  computeTodoHash,
  isInCompactionCooldown,
  checkProgress,
  handleStagnation,
  MAX_STAGNATION,
  COMPACTION_COOLDOWN_SECONDS,
  MAX_CONSECUTIVE_FAILURES,
  BASE_DELAY_SECONDS,
  MAX_DELAY_SECONDS,
};
