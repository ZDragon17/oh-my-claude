/**
 * 并发锁机制单元测试
 *
 * 测试范围：
 * - acquireLock: 获取文件锁
 * - releaseLock: 释放文件锁
 * - 锁超时处理
 * - 陈旧锁清理
 * - 可重入锁支持
 */

const fs = require('fs');
const path = require('path');
const {
  createTempDir,
  cleanupTempDir,
  delay,
} = require('./helpers/test-utils');

describe('并发锁机制测试', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  // 锁相关常量
  const LOCK_TIMEOUT_MS = 2000;      // 测试用较短超时
  const LOCK_STALE_MS = 1000;        // 测试用较短陈旧锁时间
  const LOCK_RETRY_INTERVAL_MS = 100; // 测试用较短重试间隔

  /**
   * 获取锁文件路径
   */
  const getLockFilePath = (pluginDir) => `${pluginDir}.lock`;

  /**
   * 尝试获取文件锁
   */
  const acquireLock = (lockFile, timeout = LOCK_TIMEOUT_MS) => {
    const startTime = Date.now();
    const pid = process.pid;
    const lockContent = JSON.stringify({ pid, timestamp: Date.now() });

    while (Date.now() - startTime < timeout) {
      try {
        // 尝试以排他模式创建锁文件
        fs.writeFileSync(lockFile, lockContent, { flag: 'wx' });
        return true;
      } catch (err) {
        if (err.code === 'EEXIST') {
          // 锁文件已存在，检查是否过期
          try {
            const existingLock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
            const lockAge = Date.now() - existingLock.timestamp;

            // 如果锁超过阈值，认为是陈旧锁
            if (lockAge > LOCK_STALE_MS) {
              fs.unlinkSync(lockFile);
              continue;
            }

            // 如果是同一进程的锁，允许通过（可重入）
            if (existingLock.pid === pid) {
              return true;
            }
          } catch {
            continue;
          }

          // 简单等待
          const waitEnd = Date.now() + LOCK_RETRY_INTERVAL_MS;
          while (Date.now() < waitEnd) {
            // 忙等待
          }
        } else {
          return false;
        }
      }
    }
    return false;
  };

  /**
   * 释放文件锁
   */
  const releaseLock = (lockFile) => {
    try {
      if (fs.existsSync(lockFile)) {
        const lockContent = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
        if (lockContent.pid === process.pid) {
          fs.unlinkSync(lockFile);
        }
      }
    } catch {
      // 忽略错误
    }
  };

  describe('acquireLock - 获取锁', () => {
    test('成功获取锁', () => {
      const lockFile = path.join(tempDir, 'test.lock');
      const result = acquireLock(lockFile);

      expect(result).toBe(true);
      expect(fs.existsSync(lockFile)).toBe(true);

      // 清理
      releaseLock(lockFile);
    });

    test('锁文件包含正确的 PID 和时间戳', () => {
      const lockFile = path.join(tempDir, 'pid.lock');
      const beforeTime = Date.now();
      acquireLock(lockFile);
      const afterTime = Date.now();

      const lockContent = JSON.parse(fs.readFileSync(lockFile, 'utf8'));

      expect(lockContent.pid).toBe(process.pid);
      expect(lockContent.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(lockContent.timestamp).toBeLessThanOrEqual(afterTime);

      releaseLock(lockFile);
    });

    test('可重入 - 同一进程可以多次获取锁', () => {
      const lockFile = path.join(tempDir, 'reentrant.lock');

      const result1 = acquireLock(lockFile);
      const result2 = acquireLock(lockFile);

      expect(result1).toBe(true);
      expect(result2).toBe(true);

      releaseLock(lockFile);
    });

    test('清理陈旧锁文件', () => {
      const lockFile = path.join(tempDir, 'stale.lock');

      // 创建一个陈旧的锁（时间戳在过去）
      const staleLock = {
        pid: 99999,
        timestamp: Date.now() - LOCK_STALE_MS - 1000, // 明确过期
      };
      fs.writeFileSync(lockFile, JSON.stringify(staleLock), 'utf8');

      // 应该能成功获取锁（因为旧锁是陈旧的）
      const result = acquireLock(lockFile, LOCK_TIMEOUT_MS);

      expect(result).toBe(true);

      // 锁文件应该被更新为当前进程的锁
      const newLock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      expect(newLock.pid).toBe(process.pid);

      releaseLock(lockFile);
    });
  });

  describe('releaseLock - 释放锁', () => {
    test('成功释放锁', () => {
      const lockFile = path.join(tempDir, 'release.lock');
      acquireLock(lockFile);
      expect(fs.existsSync(lockFile)).toBe(true);

      releaseLock(lockFile);
      expect(fs.existsSync(lockFile)).toBe(false);
    });

    test('只释放自己的锁', () => {
      const lockFile = path.join(tempDir, 'other-pid.lock');

      // 模拟其他进程的锁
      const otherLock = { pid: 99999, timestamp: Date.now() };
      fs.writeFileSync(lockFile, JSON.stringify(otherLock), 'utf8');

      // 尝试释放
      releaseLock(lockFile);

      // 锁应该还存在（因为不是我们的锁）
      expect(fs.existsSync(lockFile)).toBe(true);
    });

    test('释放不存在的锁不报错', () => {
      const lockFile = path.join(tempDir, 'nonexistent.lock');

      expect(() => {
        releaseLock(lockFile);
      }).not.toThrow();
    });
  });

  describe('getLockFilePath - 锁文件路径', () => {
    test('生成正确的锁文件路径', () => {
      const pluginDir = '/home/user/.claude/plugins/test';
      const lockFile = getLockFilePath(pluginDir);
      expect(lockFile).toBe('/home/user/.claude/plugins/test.lock');
    });

    test('Windows 路径', () => {
      const pluginDir = 'C:\\Users\\test\\.claude\\plugins\\test';
      const lockFile = getLockFilePath(pluginDir);
      expect(lockFile).toBe('C:\\Users\\test\\.claude\\plugins\\test.lock');
    });
  });

  describe('并发场景模拟', () => {
    test('获取锁后再次获取应该成功（同进程）', () => {
      const lockFile = path.join(tempDir, 'concurrent.lock');

      const acquired1 = acquireLock(lockFile);
      const acquired2 = acquireLock(lockFile);

      expect(acquired1).toBe(true);
      expect(acquired2).toBe(true);

      releaseLock(lockFile);
    });

    test('模拟其他进程持有锁时超时', () => {
      const lockFile = path.join(tempDir, 'blocked.lock');

      // 创建一个其他进程的锁（非陈旧）
      const otherLock = {
        pid: 99999, // 不同的 PID
        timestamp: Date.now(), // 当前时间（非陈旧）
      };
      fs.writeFileSync(lockFile, JSON.stringify(otherLock), 'utf8');

      // 尝试获取锁（应该超时）
      const startTime = Date.now();
      const result = acquireLock(lockFile, 500); // 500ms 超时
      const elapsed = Date.now() - startTime;

      expect(result).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(400); // 应该等待了接近超时时间
    });
  });

  describe('边界情况', () => {
    test('锁文件目录不存在时失败', () => {
      const lockFile = path.join(tempDir, 'nonexistent-dir', 'test.lock');

      const result = acquireLock(lockFile, 100);
      expect(result).toBe(false);
    });

    test('锁文件内容损坏时会等待超时', () => {
      const lockFile = path.join(tempDir, 'corrupted.lock');

      // 创建损坏的锁文件
      fs.writeFileSync(lockFile, 'not valid json', 'utf8');

      // 由于损坏的 JSON 无法解析，无法判断是否陈旧，会持续重试直到超时
      // 这是预期行为：无法解析的锁文件会导致持续等待
      const startTime = Date.now();
      const result = acquireLock(lockFile, 500); // 短超时测试
      const elapsed = Date.now() - startTime;

      // 由于无法解析锁内容，会超时失败
      // 实际行为：JSON 解析失败后 continue，但文件仍存在，所以会一直重试
      expect(elapsed).toBeGreaterThanOrEqual(400);

      // 清理
      fs.unlinkSync(lockFile);
    });

    test('零超时立即返回', () => {
      const lockFile = path.join(tempDir, 'zero-timeout.lock');

      // 创建其他进程的锁
      const otherLock = { pid: 99999, timestamp: Date.now() };
      fs.writeFileSync(lockFile, JSON.stringify(otherLock), 'utf8');

      const startTime = Date.now();
      const result = acquireLock(lockFile, 0);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(false);
      expect(elapsed).toBeLessThan(100); // 应该立即返回
    });
  });
});
