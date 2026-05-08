/**
 * 并发管理器 - 基于文件的信号量实现
 * 对标 oh-my-opencode ConcurrencyManager
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getCurrentProvider } from './provider-init.js';

const provider = getCurrentProvider();
const STATE_DIR = path.join(provider.getStateDir(), 'background-tasks', 'locks');
const DEFAULT_MAX_CONCURRENCY = 5;

function ensureStateDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function getLockPath(model: string): string {
  const safe = model.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STATE_DIR, `${safe}.lock`);
}

function getMaxSlots(model: string): number {
  const configPath = path.join(provider.getConfigDir(), 'background.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.modelConcurrency?.[model]) return config.modelConcurrency[model];
      if (config.defaultConcurrency) return config.defaultConcurrency;
    }
  } catch {
    // ignore config errors
  }
  return DEFAULT_MAX_CONCURRENCY;
}

function readLockCount(lockPath: string): number {
  try {
    if (fs.existsSync(lockPath)) {
      const data = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
      const entries: string[] = data.entries || [];
      const now = Date.now();
      // clean stale entries (> 10 minutes)
      const valid = entries.filter(e => {
        const ts = parseInt(e.split(':')[1] || '0', 10);
        return now - ts < 10 * 60 * 1000;
      });
      return valid.length;
    }
  } catch {
    // ignore
  }
  return 0;
}

function acquireLock(model: string, taskId: string): boolean {
  ensureStateDir();
  const lockPath = getLockPath(model);
  const maxSlots = getMaxSlots(model);

  let entries: string[] = [];
  try {
    if (fs.existsSync(lockPath)) {
      const data = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
      entries = data.entries || [];
    }
  } catch {
    // start fresh
  }

  // clean stale
  const now = Date.now();
  entries = entries.filter(e => {
    const ts = parseInt(e.split(':')[1] || '0', 10);
    return now - ts < 10 * 60 * 1000;
  });

  if (entries.length >= maxSlots) {
    return false;
  }

  entries.push(`${taskId}:${now}`);
  fs.writeFileSync(lockPath, JSON.stringify({ entries, maxSlots, updatedAt: new Date().toISOString() }));
  return true;
}

function releaseLock(model: string, taskId: string): void {
  const lockPath = getLockPath(model);
  try {
    if (fs.existsSync(lockPath)) {
      const data = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
      const entries: string[] = (data.entries || []).filter(
        (e: string) => !e.startsWith(taskId + ':')
      );
      fs.writeFileSync(lockPath, JSON.stringify({ entries, maxSlots: data.maxSlots, updatedAt: new Date().toISOString() }));
    }
  } catch {
    // ignore
  }
}

function getActiveCount(model: string): number {
  return readLockCount(getLockPath(model));
}

function getAvailableSlots(model: string): number {
  return getMaxSlots(model) - getActiveCount(model);
}

function clearAllLocks(): void {
  try {
    if (fs.existsSync(STATE_DIR)) {
      const files = fs.readdirSync(STATE_DIR);
      for (const f of files) {
        fs.unlinkSync(path.join(STATE_DIR, f));
      }
    }
  } catch {
    // ignore
  }
}

export const ConcurrencyManager = {
  acquireLock,
  releaseLock,
  getActiveCount,
  getAvailableSlots,
  getMaxSlots,
  clearAllLocks,
  STATE_DIR,
  DEFAULT_MAX_CONCURRENCY,
};
