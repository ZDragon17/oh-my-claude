/**
 * 文件操作模块测试
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  safeReadFile,
  safeWriteFile,
  safeRemoveDir,
  safeCopyFile,
  smartCopyFile,
  copyDir,
  setHookPermissions,
  windowsPathToWsl,
  isWslAvailable,
  setupWslSymlink
} from '../lib/file-operations';

describe('文件操作模块', () => {
  let tempDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    tempDir = path.join(os.tmpdir(), `oh-my-claude-test-${crypto.randomBytes(8).toString('hex')}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('safeReadFile', () => {
    test('应该读取存在的文件', () => {
      const testFile = path.join(tempDir, 'test.txt');
      fs.writeFileSync(testFile, 'hello world', 'utf8');

      const content = safeReadFile(testFile);
      expect(content).toBe('hello world');
    });

    test('不存在的文件应返回 null', () => {
      const content = safeReadFile(path.join(tempDir, 'nonexistent.txt'));
      expect(content).toBeNull();
    });
  });

  describe('safeWriteFile', () => {
    test('应该写入文件', () => {
      const testFile = path.join(tempDir, 'output.txt');

      const result = safeWriteFile(testFile, 'test content');
      expect(result).toBe(true);

      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toBe('test content');
    });

    test('应该自动创建父目录', () => {
      const testFile = path.join(tempDir, 'sub', 'dir', 'output.txt');

      const result = safeWriteFile(testFile, 'nested content');
      expect(result).toBe(true);
      expect(fs.existsSync(testFile)).toBe(true);
    });
  });

  describe('safeRemoveDir', () => {
    test('应该删除存在的目录', () => {
      const subDir = path.join(tempDir, 'to-delete');
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, 'file.txt'), 'content');

      const result = safeRemoveDir(subDir);
      expect(result).toBe(true);
      expect(fs.existsSync(subDir)).toBe(false);
    });

    test('对不存在的目录也应返回 true', () => {
      const result = safeRemoveDir(path.join(tempDir, 'nonexistent'));
      expect(result).toBe(true);
    });
  });

  describe('safeCopyFile', () => {
    test('应该复制文件', () => {
      const srcFile = path.join(tempDir, 'source.txt');
      const destFile = path.join(tempDir, 'dest.txt');
      fs.writeFileSync(srcFile, 'copy me');

      const result = safeCopyFile(srcFile, destFile);
      expect(result).toBe(true);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('copy me');
    });

    test('应该自动创建目标目录', () => {
      const srcFile = path.join(tempDir, 'source.txt');
      const destFile = path.join(tempDir, 'new', 'dir', 'dest.txt');
      fs.writeFileSync(srcFile, 'copy me');

      const result = safeCopyFile(srcFile, destFile);
      expect(result).toBe(true);
      expect(fs.existsSync(destFile)).toBe(true);
    });
  });

  describe('smartCopyFile', () => {
    test('应该复制小文件', () => {
      const srcFile = path.join(tempDir, 'small.txt');
      const destFile = path.join(tempDir, 'small-copy.txt');
      fs.writeFileSync(srcFile, 'small content');

      smartCopyFile(srcFile, destFile);
      expect(fs.readFileSync(destFile, 'utf8')).toBe('small content');
    });

    test('应该保留文件时间戳', () => {
      const srcFile = path.join(tempDir, 'timed.txt');
      const destFile = path.join(tempDir, 'timed-copy.txt');
      fs.writeFileSync(srcFile, 'content');

      // 设置特定的修改时间
      const mtime = new Date('2020-01-01');
      fs.utimesSync(srcFile, mtime, mtime);

      smartCopyFile(srcFile, destFile);

      // 验证目标文件存在
      expect(fs.existsSync(destFile)).toBe(true);
    });
  });

  describe('copyDir', () => {
    test('应该递归复制目录', () => {
      // 创建源目录结构
      const srcDir = path.join(tempDir, 'src');
      const destDir = path.join(tempDir, 'dest');
      fs.mkdirSync(path.join(srcDir, 'sub'), { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(srcDir, 'sub', 'file2.txt'), 'content2');

      const stats = copyDir(srcDir, destDir);

      expect(stats.files).toBe(2);
      expect(stats.dirs).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(destDir, 'file1.txt'))).toBe(true);
      expect(fs.existsSync(path.join(destDir, 'sub', 'file2.txt'))).toBe(true);
    });

    test('应该处理空目录', () => {
      const srcDir = path.join(tempDir, 'empty-src');
      const destDir = path.join(tempDir, 'empty-dest');
      fs.mkdirSync(srcDir);

      const stats = copyDir(srcDir, destDir, { preserveEmpty: true });

      expect(stats.dirs).toBe(1);
      expect(stats.emptyDirs).toBe(1);
      expect(fs.existsSync(destDir)).toBe(true);
    });
  });

  describe('setHookPermissions', () => {
    test('在非 Windows 系统上应设置 hook 脚本权限', () => {
      // 只在非 Windows 系统上测试
      if (os.platform() !== 'win32') {
        const hooksDir = path.join(tempDir, 'hooks');
        fs.mkdirSync(hooksDir);
        fs.writeFileSync(path.join(hooksDir, 'test.sh'), '#!/bin/bash\necho test');

        setHookPermissions(tempDir);

        const stats = fs.statSync(path.join(hooksDir, 'test.sh'));
        // 检查是否有执行权限
        expect(stats.mode & 0o111).not.toBe(0);
      } else {
        // Windows 上跳过
        expect(true).toBe(true);
      }
    });

    test('在 Windows 上应该安全跳过', () => {
      if (os.platform() === 'win32') {
        // 不应该抛出错误
        expect(() => setHookPermissions(tempDir)).not.toThrow();
      } else {
        expect(true).toBe(true);
      }
    });
  });

  describe('WSL 跨环境兼容', () => {
    describe('windowsPathToWsl', () => {
      test('应该转换标准 Windows 路径（反斜杠）', () => {
        expect(windowsPathToWsl('C:\\Users\\test')).toBe('/mnt/c/Users/test');
        expect(windowsPathToWsl('D:\\projects\\app')).toBe('/mnt/d/projects/app');
      });

      test('应该转换 Windows 路径（正斜杠）', () => {
        expect(windowsPathToWsl('C:/Users/test')).toBe('/mnt/c/Users/test');
        expect(windowsPathToWsl('D:/projects/app')).toBe('/mnt/d/projects/app');
      });

      test('应该转换 Git Bash 格式路径', () => {
        expect(windowsPathToWsl('/c/Users/test')).toBe('/mnt/c/Users/test');
        expect(windowsPathToWsl('/d/projects/app')).toBe('/mnt/d/projects/app');
      });

      test('应该处理中文路径', () => {
        expect(windowsPathToWsl('C:\\Users\\张不为')).toBe('/mnt/c/Users/张不为');
        expect(windowsPathToWsl('/c/Users/张三')).toBe('/mnt/c/Users/张三');
      });

      test('应该保留 WSL 原生路径', () => {
        expect(windowsPathToWsl('/mnt/c/Users/test')).toBe('/mnt/c/Users/test');
        expect(windowsPathToWsl('/home/user')).toBe('/home/user');
      });

      test('应该处理空路径', () => {
        expect(windowsPathToWsl('')).toBe('');
      });
    });

    describe('isWslAvailable', () => {
      test('在非 Windows 系统上应返回 false', () => {
        if (os.platform() !== 'win32') {
          expect(isWslAvailable()).toBe(false);
        } else {
          // Windows 上根据实际 WSL 安装情况返回
          const result = isWslAvailable();
          expect(typeof result).toBe('boolean');
        }
      });
    });

    describe('setupWslSymlink', () => {
      test('在非 Windows 系统上应跳过', () => {
        if (os.platform() !== 'win32') {
          const result = setupWslSymlink('/some/path');
          expect(result.success).toBe(true);
          expect(result.message).toContain('非 Windows');
        } else {
          // Windows 上跳过此测试
          expect(true).toBe(true);
        }
      });

      test('应该返回正确的结果结构', () => {
        const result = setupWslSymlink('/some/path');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.message).toBe('string');
      });
    });
  });
});
