/**
 * 安装器模块测试
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  getPluginDir,
  getPackageDir,
  checkClaudeCode,
  performUninstall
} from '../lib/installer';

describe('安装器模块', () => {
  let tempDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    tempDir = path.join(os.tmpdir(), `oh-my-claude-installer-test-${crypto.randomBytes(8).toString('hex')}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getPluginDir', () => {
    test('应该返回插件目录路径', () => {
      const pluginDir = getPluginDir();
      
      expect(pluginDir).toBeDefined();
      expect(typeof pluginDir).toBe('string');
      expect(pluginDir).toContain('.claude');
      expect(pluginDir).toContain('plugins');
      expect(pluginDir).toContain('oh-my-claude');
    });

    test('返回的路径应该是绝对路径', () => {
      const pluginDir = getPluginDir();
      
      expect(path.isAbsolute(pluginDir)).toBe(true);
    });
  });

  describe('getPackageDir', () => {
    test('应该返回包目录路径', () => {
      const packageDir = getPackageDir();
      
      expect(packageDir).toBeDefined();
      expect(typeof packageDir).toBe('string');
    });

    test('返回的路径应该包含 package.json', () => {
      const packageDir = getPackageDir();
      const pkgPath = path.join(packageDir, 'package.json');
      
      // 在测试环境中，应该能找到项目的 package.json
      expect(fs.existsSync(pkgPath)).toBe(true);
    });

    test('package.json 应该包含正确的包名', () => {
      const packageDir = getPackageDir();
      const pkgPath = path.join(packageDir, 'package.json');
      
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        expect(['claude-pangu', 'oh-my-claude']).toContain(pkg.name);
      }
    });
  });

  describe('checkClaudeCode', () => {
    test('应该返回布尔值', () => {
      const result = checkClaudeCode();
      
      expect(typeof result).toBe('boolean');
    });

    test('应该不抛出错误', () => {
      expect(() => checkClaudeCode()).not.toThrow();
    });
  });

  // 注意: performUninstall 包含 execSync 调用，会尝试执行 claude 命令
  // 这些测试仅验证函数签名和基本行为，不测试实际卸载逻辑
  describe('performUninstall', () => {
    // performUninstall 会调用 execSync('claude plugins uninstall ...')
    // 由于这会导致测试超时或失败（取决于环境），我们只测试函数是否存在
    test('应该是一个函数', () => {
      expect(typeof performUninstall).toBe('function');
    });
  });
});
