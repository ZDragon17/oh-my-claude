/**
 * 模型回退状态控制器
 * 对标 oh-my-opencode model-fallback state-controller
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getCurrentProvider } from './provider-init.js';

const provider = getCurrentProvider();
const FALLBACK_DIR = path.join(provider.getStateDir(), 'model-fallback');
const STATE_PATH = path.join(FALLBACK_DIR, 'state.json');
const FALLBACK_CONFIG_PATH = path.join(provider.getStateDir(), 'model-fallback.json');

export interface SessionFallbackState {
  sessionId: string;
  currentModel: string;
  fallbackChain: string[];
  attemptCount: number;
  pending: boolean;
  lastError?: string;
  switchedAt?: string;
  agentName?: string;
}

export interface FallbackConfig {
  defaultChain: string[];
  agentChains: Record<string, string[]>;
  enabled: boolean;
  autoApply: boolean;
}

function ensureDir(): void {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
}

function loadConfig(): FallbackConfig {
  try {
    if (fs.existsSync(FALLBACK_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(FALLBACK_CONFIG_PATH, 'utf-8')) as FallbackConfig;
    }
  } catch {
    // default below
  }
  return {
    defaultChain: provider.getDefaultFallbackChain(),
    agentChains: {},
    enabled: true,
    autoApply: false,
  };
}

function readAllStates(): Record<string, SessionFallbackState> {
  ensureDir();
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    }
  } catch {
    // fresh state
  }
  return {};
}

function writeAllStates(states: Record<string, SessionFallbackState>): void {
  ensureDir();
  fs.writeFileSync(STATE_PATH, JSON.stringify(states, null, 2));
}

/** 获取会话的回退状态 */
function getSessionState(sessionId: string): SessionFallbackState | null {
  const states = readAllStates();
  return states[sessionId] || null;
}

/** 设置待处理的模型回退 */
function setPendingFallback(
  sessionId: string,
  currentModel: string,
  error: string,
  agentName?: string
): SessionFallbackState {
  const config = loadConfig();
  const chain = config.agentChains[agentName || ''] || config.defaultChain;

  // 找到 currentModel 之后的回退模型
  const currentIdx = chain.indexOf(currentModel);
  const fallbackChain = currentIdx >= 0 ? chain.slice(currentIdx + 1) : chain;

  const sessionState: SessionFallbackState = {
    sessionId,
    currentModel,
    fallbackChain,
    attemptCount: 0,
    pending: true,
    lastError: error,
    agentName,
  };

  const states = readAllStates();
  states[sessionId] = sessionState;
  writeAllStates(states);

  return sessionState;
}

/** 获取下一个回退模型 */
function getNextFallback(sessionId: string): string | null {
  const sessionState = getSessionState(sessionId);
  if (!sessionState || !sessionState.pending) return null;
  if (sessionState.attemptCount >= sessionState.fallbackChain.length) return null;

  const next = sessionState.fallbackChain[sessionState.attemptCount];
  return next || null;
}

/** 应用回退（递增计数） */
function applyFallback(sessionId: string): SessionFallbackState | null {
  const states = readAllStates();
  const sessionState = states[sessionId];
  if (!sessionState) return null;

  const next = getNextFallback(sessionId);
  if (!next) {
    sessionState.pending = false;
    writeAllStates(states);
    return null;
  }

  sessionState.attemptCount += 1;
  sessionState.switchedAt = new Date().toISOString();

  if (sessionState.attemptCount >= sessionState.fallbackChain.length) {
    sessionState.pending = false;
  }

  writeAllStates(states);
  return sessionState;
}

/** 清除回退状态 */
function clearFallback(sessionId: string): void {
  const states = readAllStates();
  delete states[sessionId];
  writeAllStates(states);
}

/** 清除所有回退状态 */
function clearAllFallbacks(): void {
  writeAllStates({});
}

/** 分类模型错误 */
function classifyModelError(errorMsg: string): 'retryable' | 'stop' | 'non_retryable' {
  const lower = errorMsg.toLowerCase();

  if (
    lower.includes('overloaded') ||
    lower.includes('rate_limit') ||
    lower.includes('capacity') ||
    lower.includes('busy') ||
    lower.includes('internal_error') ||
    lower.includes('service_unavailable') ||
    lower.includes('timeout') ||
    lower.includes('server error')
  ) {
    return 'retryable';
  }

  if (
    lower.includes('quota') ||
    lower.includes('billing') ||
    lower.includes('insufficient_quota')
  ) {
    return 'stop';
  }

  if (
    lower.includes('invalid_api_key') ||
    lower.includes('authentication') ||
    lower.includes('permission') ||
    lower.includes('not_found')
  ) {
    return 'non_retryable';
  }

  return 'retryable'; // 默认可重试
}

export const ModelFallbackController = {
  loadConfig,
  getSessionState,
  setPendingFallback,
  getNextFallback,
  applyFallback,
  clearFallback,
  clearAllFallbacks,
  classifyModelError,
  FALLBACK_DIR,
};
