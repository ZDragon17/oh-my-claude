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
} = require('./helpers/test-utils');

// 从 cli.js 导入函数
const {
  getLockFilePath,
  acquireLock,
  releaseLock,
  LOCK_TIMEOUT_MS,
  LOCK_STALE_MS,
} = require('../scripts/cli');

describe('并发锁机制测试', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('acquireLock - 获取锁', () => {
    test('成功获取锁', () => {
      const lockFile = path.join(tempDir, 'test.lock');
      const result = acquireLock(lockFile, 2000);

      expect(result).toBe(true);
      expect(fs.existsSync(lockFile)).toBe(true);

      // 清理
      releaseLock(lockFile);
    });

    test('锁文件包含正确的 PID 和时间戳', () => {
      const lockFile = path.join(tempDir, 'pid.lock');
      const beforeTime = Date.now();
      acquireLock(lockFile, 2000);
      const afterTime = Date.now();

      const lockContent = JSON.parse(fs.readFileSync(lockFile, 'utf8'));

      expect(lockContent.pid).toBe(process.pid);
      expect(lockContent.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(lockContent.timestamp).toBeLessThanOrEqual(afterTime);

      releaseLock(lockFile);
    });

    test('可重入 - 同一进程可以多次获取锁', () => {
      const lockFile = path.join(tempDir, 'reentrant.lock');

      const result1 = acquireLock(lockFile, 2000);
      const result2 = acquireLock(lockFile, 2000);

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
      const result = acquireLock(lockFile, 2000);

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
      acquireLock(lockFile, 2000);
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

      const acquired1 = acquireLock(lockFile, 2000);
      const acquired2 = acquireLock(lockFile, 2000);

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

    test('锁文件内容损坏时自动清理并获取锁', () => {
      const lockFile = path.join(tempDir, 'corrupted.lock');

      // 创建损坏的锁文件
      fs.writeFileSync(lockFile, 'not valid json', 'utf8');

      // 损坏的锁文件会被自动清理，然后成功获取锁
      const startTime = Date.now();
      const result = acquireLock(lockFile, 500);
      const elapsed = Date.now() - startTime;

      // 应该快速成功（清理损坏锁后立即获取）
      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(100);

      // 清理
      releaseLock(lockFile);
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
