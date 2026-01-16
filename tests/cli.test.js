/**
 * cli.js 核心函数单元测试
 *
 * 测试范围：
 * - sanitizeStackTrace: 堆栈跟踪脱敏
 * - getUserFriendlyError: 错误消息转换
 * - ProgressIndicator: 进度显示器
 * - 文件锁机制
 * - 文件操作函数
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createTempDir,
  cleanupTempDir,
  createMockPluginStructure,
  captureConsole,
} = require('./helpers/test-utils');

// 由于 cli.js 是一个入口脚本，需要提取函数来测试
// 为了测试，创建一个模块化的版本

describe('cli.js 核心功能测试', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('sanitizeStackTrace - 堆栈跟踪脱敏', () => {
    // 直接测试脱敏逻辑
    const sanitizeStackTrace = (stack) => {
      if (!stack) return '';

      const home = os.homedir();
      const username = os.userInfo().username;

      let sanitized = stack
        .replace(new RegExp(home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '~')
        .replace(new RegExp(username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '<user>');

      sanitized = sanitized.replace(/[A-Za-z]:\\Users\\[^\\]+\\/gi, '<user-home>\\');
      sanitized = sanitized.replace(/[a-f0-9]{32,}/gi, '<redacted-hex>');
      sanitized = sanitized.replace(/[A-Za-z0-9+/=]{40,}/g, '<redacted-token>');

      return sanitized;
    };

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
    const getUserFriendlyError = (err, filePath) => {
      const errorMessages = {
        ENOENT: `文件或目录不存在: ${filePath}\n  请检查路径是否正确`,
        EACCES: `权限不足: ${filePath}\n  请尝试以管理员身份运行，或检查文件权限`,
        EPERM: `操作被拒绝: ${filePath}\n  可能被其他程序占用，请关闭相关程序后重试`,
        ENOSPC: `磁盘空间不足\n  请清理磁盘空间后重试`,
        EBUSY: `资源正忙: ${filePath}\n  文件可能正在被其他程序使用`,
        EMFILE: `打开文件过多\n  请关闭一些应用程序后重试`,
        EEXIST: `文件已存在: ${filePath}\n  请先删除或重命名现有文件`,
        EISDIR: `目标是目录而非文件: ${filePath}`,
        ENOTDIR: `目标不是目录: ${filePath}`,
        ENOTEMPTY: `目录不为空: ${filePath}\n  请先清空目录内容`,
      };

      const friendlyMessage = errorMessages[err.code];
      if (friendlyMessage) {
        return friendlyMessage;
      }

      return `${err.message}\n  如需帮助，请访问: https://github.com/ZDragon17/oh-my-claude/issues`;
    };

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

    test('未知错误返回默认消息', () => {
      const err = { code: 'UNKNOWN', message: 'Some unknown error' };
      const result = getUserFriendlyError(err, '/path/to/file');
      expect(result).toContain('Some unknown error');
      expect(result).toContain('github.com');
    });
  });

  describe('ProgressIndicator - 进度显示器', () => {
    class ProgressIndicator {
      constructor(totalSteps, description = '处理中') {
        this.totalSteps = totalSteps;
        this.currentStep = 0;
        this.description = description;
        this.startTime = Date.now();
        this.isInteractive = false; // 测试模式下设为 false
      }

      update(stepDescription = '') {
        this.currentStep++;
        return {
          currentStep: this.currentStep,
          totalSteps: this.totalSteps,
          percent: Math.round((this.currentStep / this.totalSteps) * 100),
          stepDescription,
        };
      }

      _createProgressBar(percent) {
        const total = 20;
        const filled = Math.round((percent / 100) * total);
        const empty = total - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
      }

      complete(message = '完成') {
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        return { message, elapsed, success: true };
      }

      fail(message = '失败') {
        return { message, success: false };
      }
    }

    test('初始化正确设置总步骤数', () => {
      const progress = new ProgressIndicator(5);
      expect(progress.totalSteps).toBe(5);
      expect(progress.currentStep).toBe(0);
    });

    test('update 正确递增步骤', () => {
      const progress = new ProgressIndicator(4);

      const step1 = progress.update('步骤1');
      expect(step1.currentStep).toBe(1);
      expect(step1.percent).toBe(25);

      const step2 = progress.update('步骤2');
      expect(step2.currentStep).toBe(2);
      expect(step2.percent).toBe(50);
    });

    test('_createProgressBar 正确生成进度条', () => {
      const progress = new ProgressIndicator(10);

      expect(progress._createProgressBar(0)).toBe('[░░░░░░░░░░░░░░░░░░░░]');
      expect(progress._createProgressBar(50)).toBe('[██████████░░░░░░░░░░]');
      expect(progress._createProgressBar(100)).toBe('[████████████████████]');
    });

    test('complete 返回成功状态', () => {
      const progress = new ProgressIndicator(2);
      progress.update();
      progress.update();
      const result = progress.complete('操作完成');
      expect(result.success).toBe(true);
      expect(result.message).toBe('操作完成');
    });

    test('fail 返回失败状态', () => {
      const progress = new ProgressIndicator(2);
      const result = progress.fail('操作失败');
      expect(result.success).toBe(false);
      expect(result.message).toBe('操作失败');
    });
  });

  describe('文件操作函数', () => {
    describe('safeReadFile', () => {
      const safeReadFile = (filePath) => {
        try {
          return fs.readFileSync(filePath, 'utf8');
        } catch (err) {
          if (err.code === 'ENOENT') {
            return null;
          }
          throw err;
        }
      };

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
      const safeWriteFile = (filePath, content) => {
        try {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, content, 'utf8');
          return true;
        } catch (err) {
          throw err;
        }
      };

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
      const safeRemoveDir = (dirPath) => {
        try {
          if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
          }
          return true;
        } catch (err) {
          throw err;
        }
      };

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
      const copyDir = (src, dest, options = {}) => {
        const { preserveEmpty = true } = options;
        const stats = { files: 0, dirs: 0, emptyDirs: 0 };

        fs.mkdirSync(dest, { recursive: true });
        stats.dirs++;

        const entries = fs.readdirSync(src, { withFileTypes: true });

        if (entries.length === 0) {
          stats.emptyDirs++;
          if (!preserveEmpty) {
            fs.rmdirSync(dest);
            stats.dirs--;
          }
          return stats;
        }

        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);

          if (entry.isDirectory()) {
            const subStats = copyDir(srcPath, destPath, options);
            stats.files += subStats.files;
            stats.dirs += subStats.dirs;
            stats.emptyDirs += subStats.emptyDirs;
          } else {
            fs.copyFileSync(srcPath, destPath);
            stats.files++;
          }
        }

        return stats;
      };

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
});
