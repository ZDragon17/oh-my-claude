/**
 * cli.js 核心函数单元测试
 *
 * 测试范围：
 * - sanitizeStackTrace: 堆栈跟踪脱敏
 * - getUserFriendlyError: 错误消息转换
 * - ProgressIndicator: 进度显示器
 * - 文件操作函数
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createTempDir,
  cleanupTempDir,
} = require('./helpers/test-utils');

// 从 cli.js 导入函数
const {
  sanitizeStackTrace,
  getUserFriendlyError,
  ProgressIndicator,
  safeReadFile,
  safeWriteFile,
  safeRemoveDir,
  copyDir,
  VERSION,
} = require('../scripts/cli');

describe('cli.js 核心功能测试', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('sanitizeStackTrace - 堆栈跟踪脱敏', () => {
    test('空字符串返回空字符串', () => {
      expect(sanitizeStackTrace('')).toBe('');
    });

    test('null 或 undefined 返回空字符串', () => {
      expect(sanitizeStackTrace(null)).toBe('');
      expect(sanitizeStackTrace(undefined)).toBe('');
    });

    test('替换用户主目录路径', () => {
      const home = os.homedir();
      const stack = `Error at ${home}/project/file.js:10`;
      const result = sanitizeStackTrace(stack);
      expect(result).toContain('~');
      expect(result).not.toContain(home);
    });

    test('替换用户名', () => {
      const username = os.userInfo().username;
      const stack = `User: ${username} caused error`;
      const result = sanitizeStackTrace(stack);
      expect(result).toContain('<user>');
      expect(result).not.toContain(username);
    });

    test('替换 Windows 用户路径', () => {
      const stack = 'Error at C:\\Users\\john\\project\\file.js:10';
      const result = sanitizeStackTrace(stack);
      expect(result).toContain('<user-home>');
    });

    test('替换长 hex 字符串（可能是 API key）', () => {
      const stack = 'Token: abcdef0123456789abcdef0123456789abcd';
      const result = sanitizeStackTrace(stack);
      expect(result).toContain('<redacted-hex>');
    });

    test('替换 base64 token', () => {
      const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop';
      const stack = `Bearer: ${token}`;
      const result = sanitizeStackTrace(stack);
      expect(result).toContain('<redacted-token>');
    });
  });

  describe('getUserFriendlyError - 错误消息转换', () => {
    test('ENOENT 返回文件不存在提示', () => {
      const err = { code: 'ENOENT', message: 'File not found' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('文件或目录不存在');
      expect(result).toContain('/path/to/file');
    });

    test('EACCES 返回权限不足提示', () => {
      const err = { code: 'EACCES', message: 'Permission denied' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('权限不足');
    });

    test('EPERM 返回操作被拒绝提示', () => {
      const err = { code: 'EPERM', message: 'Operation not permitted' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('操作被拒绝');
    });

    test('ENOSPC 返回磁盘空间不足提示', () => {
      const err = { code: 'ENOSPC', message: 'No space left' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('磁盘空间不足');
    });

    test('EBUSY 返回资源正忙提示', () => {
      const err = { code: 'EBUSY', message: 'Resource busy' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('资源正忙');
    });

    test('EMFILE 返回打开文件过多提示', () => {
      const err = { code: 'EMFILE', message: 'Too many open files' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('打开文件过多');
    });

    test('EEXIST 返回文件已存在提示', () => {
      const err = { code: 'EEXIST', message: 'File exists' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('文件已存在');
    });

    test('EISDIR 返回目标是目录提示', () => {
      const err = { code: 'EISDIR', message: 'Is a directory' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('目标是目录');
    });

    test('ENOTDIR 返回目标不是目录提示', () => {
      const err = { code: 'ENOTDIR', message: 'Not a directory' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('目标不是目录');
    });

    test('ENOTEMPTY 返回目录不为空提示', () => {
      const err = { code: 'ENOTEMPTY', message: 'Directory not empty' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('目录不为空');
    });

    test('未知错误返回默认消息', () => {
      const err = { code: 'UNKNOWN', message: 'Some unknown error' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('Some unknown error');
      expect(result).toContain('github.com');
    });
  });

  describe('ProgressIndicator - 进度显示器', () => {
    test('初始化正确设置总步骤数', () => {
      const progress = new ProgressIndicator(5);
      expect(progress.totalSteps).toBe(5);
      expect(progress.currentStep).toBe(0);
    });

    test('update 正确递增步骤', () => {
      const progress = new ProgressIndicator(4);
      // 设置为非交互模式以避免控制台输出
      progress.isInteractive = false;

      progress.update('步骤1');
      expect(progress.currentStep).toBe(1);

      progress.update('步骤2');
      expect(progress.currentStep).toBe(2);
    });

    test('_createProgressBar 正确生成进度条', () => {
      const progress = new ProgressIndicator(10);

      expect(progress._createProgressBar(0)).toBe('[░░░░░░░░░░░░░░░░░░░░]');
      expect(progress._createProgressBar(50)).toBe('[██████████░░░░░░░░░░]');
      expect(progress._createProgressBar(100)).toBe('[████████████████████]');
    });

    test('complete 方法可正常调用', () => {
      const progress = new ProgressIndicator(2);
      progress.isInteractive = false;
      progress.update();
      progress.update();
      // 验证不抛出异常
      expect(() => progress.complete('操作完成')).not.toThrow();
    });

    test('fail 方法可正常调用', () => {
      const progress = new ProgressIndicator(2);
      progress.isInteractive = false;
      // 验证不抛出异常
      expect(() => progress.fail('操作失败')).not.toThrow();
    });
  });

  describe('文件操作函数', () => {
    describe('safeReadFile', () => {
      test('读取存在的文件', () => {
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'hello world', 'utf8');

        const content = safeReadFile(testFile);
        expect(content).toBe('hello world');
      });

      test('读取不存在的文件返回 null', () => {
        const content = safeReadFile(path.join(tempDir, 'nonexistent.txt'));
        expect(content).toBeNull();
      });
    });

    describe('safeWriteFile', () => {
      test('写入文件成功', () => {
        const testFile = path.join(tempDir, 'output.txt');
        const result = safeWriteFile(testFile, 'test content');

        expect(result).toBe(true);
        expect(fs.readFileSync(testFile, 'utf8')).toBe('test content');
      });

      test('自动创建父目录', () => {
        const testFile = path.join(tempDir, 'nested', 'deep', 'file.txt');
        safeWriteFile(testFile, 'deep content');

        expect(fs.existsSync(testFile)).toBe(true);
        expect(fs.readFileSync(testFile, 'utf8')).toBe('deep content');
      });
    });

    describe('safeRemoveDir', () => {
      test('删除存在的目录', () => {
        const testDir = path.join(tempDir, 'to-delete');
        fs.mkdirSync(testDir);
        fs.writeFileSync(path.join(testDir, 'file.txt'), 'content');

        const result = safeRemoveDir(testDir);
        expect(result).toBe(true);
        expect(fs.existsSync(testDir)).toBe(false);
      });

      test('删除不存在的目录不报错', () => {
        const result = safeRemoveDir(path.join(tempDir, 'nonexistent'));
        expect(result).toBe(true);
      });
    });

    describe('copyDir', () => {
      test('复制目录及其内容', () => {
        const srcDir = path.join(tempDir, 'src');
        const destDir = path.join(tempDir, 'dest');

        // 创建源目录结构
        fs.mkdirSync(srcDir);
        fs.writeFileSync(path.join(srcDir, 'file1.txt'), 'content1');
        fs.mkdirSync(path.join(srcDir, 'subdir'));
        fs.writeFileSync(path.join(srcDir, 'subdir', 'file2.txt'), 'content2');

        const stats = copyDir(srcDir, destDir);

        expect(stats.files).toBe(2);
        expect(stats.dirs).toBe(2);
        expect(fs.existsSync(path.join(destDir, 'file1.txt'))).toBe(true);
        expect(fs.existsSync(path.join(destDir, 'subdir', 'file2.txt'))).toBe(true);
      });

      test('处理空目录', () => {
        const srcDir = path.join(tempDir, 'empty-src');
        const destDir = path.join(tempDir, 'empty-dest');

        fs.mkdirSync(srcDir);

        const stats = copyDir(srcDir, destDir, { preserveEmpty: true });

        expect(stats.emptyDirs).toBe(1);
        expect(fs.existsSync(destDir)).toBe(true);
      });

      test('不保留空目录时删除', () => {
        const srcDir = path.join(tempDir, 'empty-src2');
        const destDir = path.join(tempDir, 'empty-dest2');

        fs.mkdirSync(srcDir);

        const stats = copyDir(srcDir, destDir, { preserveEmpty: false });

        expect(stats.emptyDirs).toBe(1);
        expect(stats.dirs).toBe(0);
        expect(fs.existsSync(destDir)).toBe(false);
      });
    });
  });

  describe('VERSION 常量', () => {
    test('VERSION 应该是有效的语义化版本', () => {
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
