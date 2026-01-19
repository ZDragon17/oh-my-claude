/**
 * 配置命令模块测试
 */

import {
  showConfig,
  getConfigValue,
  setConfigValue,
  handleConfigCommand
} from '../lib/config-commands';

describe('配置命令模块', () => {
  // Mock console.log 来捕获输出
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Mock process.exit 以防止测试退出
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('showConfig', () => {
    test('应该显示配置信息而不抛出错误', () => {
      expect(() => showConfig()).not.toThrow();
    });

    test('应该输出配置内容到 console', () => {
      showConfig();

      expect(consoleLogSpy).toHaveBeenCalled();
      
      // 检查是否输出了关键配置项
      const allOutput = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allOutput).toContain('当前配置');
      expect(allOutput).toContain('版本');
      expect(allOutput).toContain('调试模式');
    });
  });

  describe('getConfigValue', () => {
    test('应该获取顶级配置值', () => {
      expect(() => getConfigValue('debug')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('debug');
    });

    test('应该获取嵌套配置值', () => {
      expect(() => getConfigValue('agents.defaultTimeout')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('agents.defaultTimeout');
    });

    test('应该获取 UI 主题配置', () => {
      expect(() => getConfigValue('ui.theme')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('ui.theme');
    });

    test('获取不存在的配置键应该调用 process.exit', () => {
      expect(() => getConfigValue('nonexistent.key')).toThrow('process.exit(1)');
    });

    test('获取部分不存在的嵌套键应该调用 process.exit', () => {
      expect(() => getConfigValue('agents.nonexistent')).toThrow('process.exit(1)');
    });
  });

  describe('setConfigValue', () => {
    test('应该设置布尔值 true', () => {
      expect(() => setConfigValue('debug', 'true')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('配置已更新');
      expect(output).toContain('debug');
    });

    test('应该设置布尔值 false', () => {
      expect(() => setConfigValue('debug', 'false')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('配置已更新');
    });

    test('应该设置数字值', () => {
      expect(() => setConfigValue('agents.defaultTimeout', '60000')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('配置已更新');
      expect(output).toContain('60000');
    });

    test('应该设置字符串值', () => {
      expect(() => setConfigValue('ui.theme', 'dark')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('配置已更新');
    });

    test('应该设置数组值', () => {
      expect(() => setConfigValue('plugins.trustedDomains', '["github.com","example.com"]')).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('配置已更新');
    });

    test('设置无效值应该调用 process.exit', () => {
      // logLevel 只接受特定值
      expect(() => setConfigValue('logLevel', 'invalid_level')).toThrow('process.exit(1)');
    });
  });

  describe('handleConfigCommand', () => {
    test('无参数应该调用 showConfig', () => {
      expect(() => handleConfigCommand([])).not.toThrow();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('当前配置');
    });

    test('show 子命令应该显示配置', async () => {
      await handleConfigCommand(['show']);
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('当前配置');
    });

    test('get 子命令应该获取配置值', async () => {
      await handleConfigCommand(['get', 'debug']);
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('debug');
    });

    test('get 子命令缺少 key 应该调用 process.exit', async () => {
      await expect(handleConfigCommand(['get'])).rejects.toThrow('process.exit(1)');
    });

    test('set 子命令应该设置配置值', async () => {
      await handleConfigCommand(['set', 'debug', 'true']);
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('配置已更新');
    });

    test('set 子命令缺少参数应该调用 process.exit', async () => {
      await expect(handleConfigCommand(['set', 'debug'])).rejects.toThrow('process.exit(1)');
    });

    test('set 子命令缺少 key 和 value 应该调用 process.exit', async () => {
      await expect(handleConfigCommand(['set'])).rejects.toThrow('process.exit(1)');
    });

    test('help 子命令应该显示帮助', async () => {
      await handleConfigCommand(['help']);
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('用法');
      expect(output).toContain('子命令');
    });

    test('未知子命令应该显示帮助', async () => {
      await handleConfigCommand(['unknown']);
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('用法');
    });

    test('reset 子命令应该重置配置', async () => {
      await handleConfigCommand(['reset']);
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('配置已重置');
    });
  });
});
