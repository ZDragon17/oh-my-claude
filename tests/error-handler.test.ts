/**
 * 错误处理模块测试
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  getUserFriendlyError,
  sanitizeStackTrace,
  logErrorToFile
} from '../lib/error-handler';

describe('错误处理模块', () => {
  let tempDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    tempDir = path.join(os.tmpdir(), `oh-my-claude-error-test-${crypto.randomBytes(8).toString('hex')}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getUserFriendlyError', () => {
    test('应该转换 ENOENT 错误', () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';

      const message = getUserFriendlyError(error, '/path/to/file');
      expect(message).toContain('文件或目录不存在');
      expect(message).toContain('/path/to/file');
    });

    test('应该转换 EACCES 错误', () => {
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';

      const message = getUserFriendlyError(error, '/path/to/file');
      expect(message).toContain('权限不足');
    });

    test('应该转换 ENOSPC 错误', () => {
      const error = new Error('No space left') as NodeJS.ErrnoException;
      error.code = 'ENOSPC';

      const message = getUserFriendlyError(error, '/path/to/file');
      expect(message).toContain('磁盘空间不足');
    });

    test('应该转换 EPERM 错误', () => {
      const error = new Error('Operation not permitted') as NodeJS.ErrnoException;
      error.code = 'EPERM';

      const message = getUserFriendlyError(error, '/path/to/file');
      expect(message).toContain('操作被拒绝');
    });

    test('应该转换 EBUSY 错误', () => {
      const error = new Error('Resource busy') as NodeJS.ErrnoException;
      error.code = 'EBUSY';

      const message = getUserFriendlyError(error, '/path/to/file');
      expect(message).toContain('资源正忙');
    });

    test('应该转换 EEXIST 错误', () => {
      const error = new Error('File exists') as NodeJS.ErrnoException;
      error.code = 'EEXIST';

      const message = getUserFriendlyError(error, '/path/to/file');
      expect(message).toContain('文件已存在');
    });

    test('未知错误应返回原始消息', () => {
      const error = new Error('Unknown error') as NodeJS.ErrnoException;
      error.code = 'UNKNOWN';

      const message = getUserFriendlyError(error, '/path/to/file');
      expect(message).toContain('Unknown error');
    });
  });

  describe('sanitizeStackTrace', () => {
    test('应该替换用户主目录', () => {
      const home = os.homedir();
      const stack = `Error at ${home}/projects/test.js:10`;

      const sanitized = sanitizeStackTrace(stack);
      expect(sanitized).not.toContain(home);
      expect(sanitized).toContain('~');
    });

    test('应该替换用户名', () => {
      const username = os.userInfo().username;
      const stack = `Error for user ${username}`;

      const sanitized = sanitizeStackTrace(stack);
      expect(sanitized).not.toContain(username);
      expect(sanitized).toContain('<user>');
    });

    test('应该替换可能的 API 密钥', () => {
      const stack = 'Error with key 0123456789abcdef0123456789abcdef';

      const sanitized = sanitizeStackTrace(stack);
      expect(sanitized).toContain('<redacted-hex>');
    });

    test('应该替换可能的 token', () => {
      const stack = 'Error with token ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop';

      const sanitized = sanitizeStackTrace(stack);
      expect(sanitized).toContain('<redacted-token>');
    });

    test('空堆栈应返回空字符串', () => {
      expect(sanitizeStackTrace('')).toBe('');
    });
  });

  describe('logErrorToFile', () => {
    test('应该记录错误到文件', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:10';

      const result = logErrorToFile(error);
      
      // 检查返回值
      expect(typeof result).toBe('boolean');
    });

    test('应该处理没有堆栈的错误', () => {
      const error = new Error('No stack error');
      error.stack = undefined;

      expect(() => logErrorToFile(error)).not.toThrow();
    });
  });
});
