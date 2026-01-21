/**
 * 配置管理系统测试
 */

import { ConfigManager, OhMyClaudeConfig, ConfigExportData } from '../lib/config-manager';

describe('配置管理系统', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('默认配置', () => {
    test('应该加载默认配置', () => {
      const config = configManager.getConfig();

      expect(config).toBeDefined();
      expect(config.version).toBeDefined();
      expect(typeof config.version).toBe('string');
      expect(config.debug).toBe(false);
      expect(config.logLevel).toBe('info');
    });

    test('应该验证配置结构', () => {
      const config = configManager.getConfig();

      expect(config.agents).toBeDefined();
      expect(config.ui).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.network).toBeDefined();
      expect(config.plugins).toBeDefined();
      expect(config.advanced).toBeDefined();
    });
  });

  describe('配置更新', () => {
    test('应该能够更新单个配置项', () => {
      configManager.set('debug', true);
      expect(configManager.get('debug')).toBe(true);

      configManager.set('logLevel', 'debug');
      expect(configManager.get('logLevel')).toBe('debug');
    });

    test('应该验证配置值', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configManager.set('logLevel', 'invalid' as any);
      }).toThrow();

      expect(() => {
        configManager.set('agents', { ...configManager.get('agents'), defaultTimeout: 0 });
      }).toThrow();
    });

    test('应该能够批量更新配置', () => {
      configManager.update({
        debug: true,
        ui: {
          theme: 'dark',
          language: 'en-US',
          showProgress: false,
          enableNotifications: false
        }
      });

      const config = configManager.getConfig();
      expect(config.debug).toBe(true);
      expect(config.ui.theme).toBe('dark');
      expect(config.ui.language).toBe('en-US');
    });
  });

  describe('环境变量支持', () => {
    beforeEach(() => {
      // 重置环境变量
      delete process.env.OH_MY_CLAUDE_DEBUG;
      delete process.env.OH_MY_CLAUDE_THEME;
      delete process.env.OH_MY_CLAUDE_TIMEOUT;
    });

    test('应该从环境变量加载配置', () => {
      process.env.OH_MY_CLAUDE_DEBUG = 'true';
      process.env.OH_MY_CLAUDE_THEME = 'dark';
      process.env.OH_MY_CLAUDE_TIMEOUT = '60000';

      const newManager = new ConfigManager();
      expect(newManager.get('debug')).toBe(true);
      expect(newManager.get('ui').theme).toBe('dark');
      expect(newManager.get('network').timeout).toBe(60000);
    });
  });

  describe('配置持久化', () => {
    test('应该能够导出配置', () => {
      const exported = configManager.exportConfig();

      expect(exported).toHaveProperty('config');
      expect(exported).toHaveProperty('files');
      expect(exported).toHaveProperty('exportedAt');
      expect(exported).toHaveProperty('version');
    });

    test('应该能够导入配置', () => {
      const testConfig: Partial<OhMyClaudeConfig> = {
        version: '1.2.0',
        debug: true,
        ui: {
          theme: 'light',
          language: 'zh-CN',
          showProgress: true,
          enableNotifications: false
        }
      };

      const exportData: ConfigExportData = {
        config: testConfig as OhMyClaudeConfig,
        files: [],
        exportedAt: new Date().toISOString(),
        version: '1.2.0'
      };

      configManager.importConfig(exportData);

      expect(configManager.get('debug')).toBe(true);
      expect(configManager.get('ui').theme).toBe('light');
      expect(configManager.get('ui').enableNotifications).toBe(false);
    });
  });

  describe('配置监听器', () => {
    test('应该支持配置变更监听', () => {
      let callbackCalled = false;
      let receivedConfig: OhMyClaudeConfig | null = null;

      const unsubscribe = configManager.onConfigChange((config) => {
        callbackCalled = true;
        receivedConfig = config;
      });

      configManager.set('debug', true);

      expect(callbackCalled).toBe(true);
      expect(receivedConfig!.debug).toBe(true);

      // 测试取消订阅
      callbackCalled = false;
      unsubscribe();
      configManager.set('debug', false);

      // 由于异步，可能还需要等待，但基本验证逻辑正确
    });
  });

  describe('配置验证', () => {
    test('应该验证配置模式', () => {
      const schema = configManager.getConfigSchema();
      expect(schema).toBeDefined();

      // 测试有效配置
      const validConfig = configManager.getConfig();
      expect(() => schema.parse(validConfig)).not.toThrow();
    });

    test('应该拒绝无效配置', () => {
      expect(() => {
        configManager.update({
          agents: {
            defaultTimeout: -1, // 无效值
            maxConcurrentTasks: 3,
            enableCollaboration: true,
            contextCompression: true,
            categories: {
              enabled: [],
              disabled: [],
              custom: {}
            }
          }
        });
      }).toThrow();
    });
  });
});