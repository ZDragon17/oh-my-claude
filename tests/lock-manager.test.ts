/**
 * 锁管理器模块测试
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  getLockFilePath,
  acquireLock,
  releaseLock,
  executeWithRollback
} from '../lib/lock-manager';

describe('锁管理器模块', () => {
  let tempDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    tempDir = path.join(os.tmpdir(), `oh-my-claude-lock-test-${crypto.randomBytes(8).toString('hex')}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // 清理临时目录和锁文件
    const lockFile = `${tempDir}.lock`;
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getLockFilePath', () => {
    test('应该返回正确的锁文件路径', () => {
      const lockPath = getLockFilePath('/some/path/to/dir');
      expect(lockPath).toBe('/some/path/to/dir.lock');
    });
  });

  describe('acquireLock', () => {
    test('应该成功获取锁', () => {
      const lockFile = path.join(tempDir, 'test.lock');

      const result = acquireLock(lockFile, 5000);
      expect(result).toBe(true);
      expect(fs.existsSync(lockFile)).toBe(true);

      // 清理
      releaseLock(lockFile);
    });

    test('同一进程应该可以重入获取锁', () => {
      const lockFile = path.join(tempDir, 'reentrant.lock');

      const result1 = acquireLock(lockFile, 5000);
      expect(result1).toBe(true);

      // 同一进程再次获取应该成功（可重入）
      const result2 = acquireLock(lockFile, 5000);
      expect(result2).toBe(true);

      // 清理
      releaseLock(lockFile);
    });

    test('应该处理损坏的锁文件', () => {
      const lockFile = path.join(tempDir, 'corrupted.lock');

      // 创建一个损坏的锁文件（无效 JSON）
      fs.writeFileSync(lockFile, 'not valid json');

      // 应该能够处理并获取锁
      const result = acquireLock(lockFile, 5000);
      expect(result).toBe(true);

      // 清理
      releaseLock(lockFile);
    });
  });

  describe('releaseLock', () => {
    test('应该释放锁', () => {
      const lockFile = path.join(tempDir, 'release-test.lock');

      acquireLock(lockFile, 5000);
      expect(fs.existsSync(lockFile)).toBe(true);

      releaseLock(lockFile);
      expect(fs.existsSync(lockFile)).toBe(false);
    });

    test('释放不存在的锁不应报错', () => {
      const lockFile = path.join(tempDir, 'nonexistent.lock');

      expect(() => releaseLock(lockFile)).not.toThrow();
    });
  });

  describe('executeWithRollback', () => {
    test('成功操作应该正常完成', () => {
      const targetDir = path.join(tempDir, 'target');
      let operationExecuted = false;

      const result = executeWithRollback(
        targetDir,
        (dir) => {
          fs.writeFileSync(path.join(dir, 'test.txt'), 'content');
          operationExecuted = true;
        },
        '测试操作'
      );

      expect(result).toBe(true);
      expect(operationExecuted).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'test.txt'))).toBe(true);
    });

    test('失败操作应该回滚', () => {
      const targetDir = path.join(tempDir, 'rollback-target');

      // 先创建一个现有安装
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'existing content');

      const result = executeWithRollback(
        targetDir,
        () => {
          throw new Error('模拟失败');
        },
        '测试操作'
      );

      expect(result).toBe(false);
      // 回滚后应该恢复原有文件
      expect(fs.existsSync(path.join(targetDir, 'existing.txt'))).toBe(true);
      expect(fs.readFileSync(path.join(targetDir, 'existing.txt'), 'utf8')).toBe('existing content');
    });

    test('应该在完成后释放锁', () => {
      const targetDir = path.join(tempDir, 'lock-release-target');
      const lockFile = `${targetDir}.lock`;

      executeWithRollback(
        targetDir,
        (dir) => {
          fs.writeFileSync(path.join(dir, 'test.txt'), 'content');
        },
        '测试操作'
      );

      // 锁应该被释放
      expect(fs.existsSync(lockFile)).toBe(false);
    });
  });
});
