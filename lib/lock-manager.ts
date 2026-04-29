/**
 * 锁机制管理模块
 * 提供文件锁定功能，防止并发操作冲突
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { LOCK_TIMEOUT_MS, LOCK_STALE_MS, LOCK_RETRY_INTERVAL_MS } from './constants.js';
import { warn, info, error, success } from '../scripts/logger.js';

// ==================== Zod 验证 Schema ====================

export const FilePathSchema = z.string().min(1);
export const LockTimeoutSchema = z.number().min(1000).max(300000);

// ==================== 类型定义 ====================

export interface LockContent {
  pid: number;
  timestamp: number;
}

// ==================== 锁文件操作 ====================

/**
 * 获取锁文件路径
 */
export function getLockFilePath(pluginDir: string): string {
  return `${pluginDir}.lock`;
}

/**
 * 尝试获取文件锁（防止并发操作）
 */
export function acquireLock(lockFile: string, timeout: number = LOCK_TIMEOUT_MS): boolean {
  // 验证输入参数
  const validatedLockFile = FilePathSchema.parse(lockFile);
  const validatedTimeout = LockTimeoutSchema.parse(timeout);

  const startTime = Date.now();
  const pid = process.pid;
  const lockContent: LockContent = { pid, timestamp: Date.now() };

  while (Date.now() - startTime < validatedTimeout) {
    try {
      // 尝试以排他模式创建锁文件
      fs.writeFileSync(validatedLockFile, JSON.stringify(lockContent), { flag: 'wx' });
      return true;
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'EEXIST') {
        // 锁文件已存在，检查是否过期
        try {
          const lockData = fs.readFileSync(validatedLockFile, 'utf8');
          let existingLock: LockContent;

          try {
            existingLock = JSON.parse(lockData);
          } catch {
            // JSON 解析失败，锁文件可能已损坏，清理后重试
            warn('锁文件格式损坏，正在清理...');
            fs.unlinkSync(validatedLockFile);
            continue;
          }

          // 验证锁内容的有效性
          if (!existingLock || typeof existingLock.timestamp !== 'number') {
            warn('锁文件内容无效，正在清理...');
            fs.unlinkSync(validatedLockFile);
            continue;
          }

          const lockAge = Date.now() - existingLock.timestamp;

          // 如果锁超过阈值，认为是陈旧锁，强制删除
          if (lockAge > LOCK_STALE_MS) {
            warn('检测到陈旧锁文件，正在清理...');
            fs.unlinkSync(validatedLockFile);
            continue;
          }

          // 如果是同一进程的锁，允许通过（可重入）
          if (existingLock.pid === pid) {
            return true;
          }

          // 其他进程持有锁，等待
          info(`另一个 oh-my-claude 进程 (PID: ${existingLock.pid}) 正在运行，等待中...`);
        } catch {
          // 读取锁文件失败，可能已被删除或权限问题
          continue;
        }

        // 使用系统 sleep 命令等待，避免忙等待占用 CPU
        const waitTime = Math.min(LOCK_RETRY_INTERVAL_MS, validatedTimeout - (Date.now() - startTime));
        if (waitTime > 0) {
          sleepSync(waitTime);
        }
      } else {
        // 其他错误，直接失败
        return false;
      }
    }
  }

  error('获取锁超时，可能有其他 oh-my-claude 进程正在运行');
  return false;
}

/**
 * 释放文件锁
 */
export function releaseLock(lockFile: string): void {
  try {
    if (fs.existsSync(lockFile)) {
      // 读取并验证是我们自己的锁
      const lockData = fs.readFileSync(lockFile, 'utf8');

      let lockContent: LockContent;
      try {
        lockContent = JSON.parse(lockData);
      } catch {
        // JSON 解析失败，锁文件可能已损坏
        // 安全删除损坏的锁文件
        fs.unlinkSync(lockFile);
        return;
      }

      // 验证是我们自己的锁
      if (lockContent && lockContent.pid === process.pid) {
        fs.unlinkSync(lockFile);
      }
    }
  } catch {
    // 忽略释放锁时的错误（文件可能已被删除等）
  }
}

/**
 * 同步等待指定毫秒数
 * 使用 Atomics.wait 实现高效阻塞等待，无需产生子进程
 */
function sleepSync(ms: number): void {
  if (ms <= 0) return;
  try {
    // Atomics.wait 是最高效的同步等待方式
    // 在 x64 架构和 Node.js >= 16 上可用
    const sab = new SharedArrayBuffer(4);
    const view = new Int32Array(sab);
    Atomics.wait(view, 0, 0, Math.min(ms, 60000));
  } catch {
    // 降级：使用简单的自旋等待（限制最大 100ms 避免长时间 CPU 占用）
    const end = Date.now() + Math.min(ms, 100);
    while (Date.now() < end) { /* wait */ }
  }
}

// ==================== 带回滚保护的执行器 ====================

/**
 * 执行带备份/回滚保护的操作（带并发锁）
 */
export function executeWithRollback(
  pluginDir: string,
  operation: (targetDir: string, backupDir: string) => void,
  operationName: string = '操作'
): boolean {
  const backupDir = `${pluginDir}.backup-${Date.now()}`;
  const lockFile = getLockFilePath(pluginDir);

  // 步骤0: 获取锁
  if (!acquireLock(lockFile)) {
    return false;
  }

  try {
    // 步骤1: 备份现有安装
    if (fs.existsSync(pluginDir)) {
      info('备份现有安装...');
      fs.renameSync(pluginDir, backupDir);
    }

    // 步骤2: 创建目录结构
    const parentDir = path.dirname(pluginDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.mkdirSync(pluginDir, { recursive: true });

    // 步骤3: 执行操作
    operation(pluginDir, backupDir);

    // 步骤4: 成功后删除备份
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }

    return true;

  } catch (err) {
    // 回滚机制
    error(`${operationName}失败: ${err instanceof Error ? err.message : 'Unknown error'}`);

    // 清理失败的操作
    if (fs.existsSync(pluginDir)) {
      warn(`正在清理失败的${operationName}...`);
      fs.rmSync(pluginDir, { recursive: true, force: true });
    }

    // 恢复备份
    if (fs.existsSync(backupDir)) {
      info('正在恢复之前的安装...');
      fs.renameSync(backupDir, pluginDir);
      success('已恢复之前的安装');
    }

    return false;

  } finally {
    // 步骤5: 释放锁
    releaseLock(lockFile);
  }
}
