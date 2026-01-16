/**
 * 文件操作集成测试
 *
 * 测试范围：
 * - copyPluginFiles: 复制插件文件
 * - setHookPermissions: 设置 hook 权限
 * - 带回滚的操作执行
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createTempDir,
  cleanupTempDir,
  createMockPluginStructure,
} = require('./helpers/test-utils');

// 从 cli.js 导入函数
const {
  copyDir,
  copyPluginFiles,
  setHookPermissions,
  executeWithRollback,
  smartCopyFile,
} = require('../scripts/cli');

describe('文件操作集成测试', () => {
  let tempDir;
  let packageDir;
  let pluginDir;

  beforeEach(() => {
    tempDir = createTempDir();
    packageDir = path.join(tempDir, 'package');
    pluginDir = path.join(tempDir, 'plugin');

    // 创建模拟的包目录
    createMockPluginStructure(packageDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('copyPluginFiles - 复制插件文件', () => {
    test('成功复制所有目录和文件', () => {
      fs.mkdirSync(pluginDir, { recursive: true });
      const stats = copyPluginFiles(packageDir, pluginDir, false);

      // 检查目录复制
      expect(fs.existsSync(path.join(pluginDir, 'agents'))).toBe(true);
      expect(fs.existsSync(path.join(pluginDir, '.claude-plugin'))).toBe(true);

      // 检查文件复制
      expect(fs.existsSync(path.join(pluginDir, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(pluginDir, 'LICENSE'))).toBe(true);

      // 检查统计
      expect(stats.dirs).toBeGreaterThan(0);
      expect(stats.files).toBeGreaterThan(0);
    });

    test('跳过不存在的可选目录', () => {
      // 删除一些目录
      fs.rmSync(path.join(packageDir, 'commands'), { recursive: true });

      fs.mkdirSync(pluginDir, { recursive: true });
      const stats = copyPluginFiles(packageDir, pluginDir, false);

      // 应该有一些错误（commands 不存在）
      expect(stats.errors.some(e => e.includes('commands'))).toBe(true);

      // 但其他目录应该正常复制
      expect(fs.existsSync(path.join(pluginDir, 'agents'))).toBe(true);
    });

    test('正确复制嵌套目录结构', () => {
      // 创建嵌套结构
      const nestedDir = path.join(packageDir, 'agents', 'nested');
      fs.mkdirSync(nestedDir, { recursive: true });
      fs.writeFileSync(path.join(nestedDir, 'deep.md'), '# Deep');

      fs.mkdirSync(pluginDir, { recursive: true });
      copyPluginFiles(packageDir, pluginDir, false);

      expect(fs.existsSync(path.join(pluginDir, 'agents', 'nested', 'deep.md'))).toBe(true);
    });

    test('文件内容正确复制', () => {
      fs.mkdirSync(pluginDir, { recursive: true });
      copyPluginFiles(packageDir, pluginDir, false);

      // 验证内容
      const originalContent = fs.readFileSync(
        path.join(packageDir, 'agents', 'yugong.md'),
        'utf8'
      );
      const copiedContent = fs.readFileSync(
        path.join(pluginDir, 'agents', 'yugong.md'),
        'utf8'
      );

      expect(copiedContent).toBe(originalContent);
    });
  });

  describe('setHookPermissions - 设置 hook 权限', () => {
    test('Windows 上跳过权限设置', () => {
      // 在 Windows 上不应该有任何操作
      if (os.platform() === 'win32') {
        fs.mkdirSync(pluginDir, { recursive: true });
        copyPluginFiles(packageDir, pluginDir, false);

        // 不应该抛出错误
        expect(() => setHookPermissions(pluginDir)).not.toThrow();
      }
    });

    test('非 Windows 系统设置执行权限', () => {
      if (os.platform() !== 'win32') {
        fs.mkdirSync(pluginDir, { recursive: true });
        copyPluginFiles(packageDir, pluginDir, false);

        setHookPermissions(pluginDir);

        // 检查权限
        const hookFile = path.join(pluginDir, 'hooks', 'test-hook.sh');
        if (fs.existsSync(hookFile)) {
          const stats = fs.statSync(hookFile);
          // 检查是否有执行权限
          expect(stats.mode & 0o111).toBeGreaterThan(0);
        }
      }
    });

    test('hooks 目录不存在时不报错', () => {
      fs.mkdirSync(pluginDir, { recursive: true });

      // 不创建 hooks 目录
      expect(() => setHookPermissions(pluginDir)).not.toThrow();
    });
  });

  describe('executeWithRollback - 带回滚的操作', () => {
    test('成功操作后清理备份', () => {
      // 创建已存在的插件目录
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(path.join(pluginDir, 'old.txt'), 'old content');

      const result = executeWithRollback(pluginDir, (targetDir) => {
        fs.writeFileSync(path.join(targetDir, 'new.txt'), 'new content');
      });

      expect(result).toBe(true);
      expect(fs.existsSync(path.join(pluginDir, 'new.txt'))).toBe(true);
      // 旧文件应该不存在了（被新目录替换）
      expect(fs.existsSync(path.join(pluginDir, 'old.txt'))).toBe(false);
      // 备份应该被清理
      const parentDir = path.dirname(pluginDir);
      const backups = fs.readdirSync(parentDir).filter(f => f.startsWith('plugin.backup-'));
      expect(backups.length).toBe(0);
    });

    test('失败时回滚到之前的状态', () => {
      // 创建已存在的插件目录
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(path.join(pluginDir, 'existing.txt'), 'existing content');

      const result = executeWithRollback(pluginDir, () => {
        // 模拟失败
        throw new Error('操作失败');
      });

      expect(result).toBe(false);
      // 应该恢复到之前的状态
      expect(fs.existsSync(pluginDir)).toBe(true);
      expect(fs.existsSync(path.join(pluginDir, 'existing.txt'))).toBe(true);
      expect(fs.readFileSync(path.join(pluginDir, 'existing.txt'), 'utf8')).toBe('existing content');
    });

    test('目录不存在时直接创建', () => {
      const newPluginDir = path.join(tempDir, 'new-plugin');

      const result = executeWithRollback(newPluginDir, (targetDir) => {
        fs.writeFileSync(path.join(targetDir, 'test.txt'), 'test');
      });

      expect(result).toBe(true);
      expect(fs.existsSync(newPluginDir)).toBe(true);
      expect(fs.existsSync(path.join(newPluginDir, 'test.txt'))).toBe(true);
    });
  });

  describe('大文件处理', () => {
    test('复制大文件', () => {
      // 创建一个较大的测试文件（1MB）
      const largeFile = path.join(packageDir, 'agents', 'large.md');
      const content = 'x'.repeat(1024 * 1024); // 1MB
      fs.writeFileSync(largeFile, content);

      fs.mkdirSync(pluginDir, { recursive: true });
      copyPluginFiles(packageDir, pluginDir, false);

      const copiedFile = path.join(pluginDir, 'agents', 'large.md');
      expect(fs.existsSync(copiedFile)).toBe(true);

      const stats = fs.statSync(copiedFile);
      expect(stats.size).toBe(1024 * 1024);
    });
  });

  describe('边界情况', () => {
    test('空目录处理', () => {
      // 创建空目录
      const emptyDir = path.join(packageDir, 'agents', 'empty');
      fs.mkdirSync(emptyDir, { recursive: true });

      fs.mkdirSync(pluginDir, { recursive: true });
      copyPluginFiles(packageDir, pluginDir, false);

      // 空目录应该被复制
      expect(fs.existsSync(path.join(pluginDir, 'agents', 'empty'))).toBe(true);
    });

    test('特殊字符文件名', () => {
      const specialFile = path.join(packageDir, 'agents', 'test-file_name.md');
      fs.writeFileSync(specialFile, '# Special');

      fs.mkdirSync(pluginDir, { recursive: true });
      copyPluginFiles(packageDir, pluginDir, false);

      expect(fs.existsSync(path.join(pluginDir, 'agents', 'test-file_name.md'))).toBe(true);
    });

    test('Unicode 文件名', () => {
      const unicodeFile = path.join(packageDir, 'agents', '测试文件.md');
      fs.writeFileSync(unicodeFile, '# 测试');

      fs.mkdirSync(pluginDir, { recursive: true });
      copyPluginFiles(packageDir, pluginDir, false);

      expect(fs.existsSync(path.join(pluginDir, 'agents', '测试文件.md'))).toBe(true);
    });
  });
});
