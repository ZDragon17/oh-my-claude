/**
 * 配置管理系统
 * 支持分层配置、环境变量、热重载
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';

// ==================== 配置类型定义 ====================

export interface OhMyClaudeConfig {
  // 基础配置
  version: string;
  debug: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';

  // Agent 配置
  agents: {
    defaultTimeout: number;
    maxConcurrentTasks: number;
    enableCollaboration: boolean;
    contextCompression: boolean;
  };

  // UI 配置
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    showProgress: boolean;
    enableNotifications: boolean;
  };

  // 性能配置
  performance: {
    enableCache: boolean;
    cacheSize: number;
    maxMemoryUsage: number;
    enableMetrics: boolean;
  };

  // 网络配置
  network: {
    timeout: number;
    retries: number;
    proxy?: string;
  };

  // 插件配置
  plugins: {
    autoUpdate: boolean;
    enableThirdParty: boolean;
    trustedDomains: string[];
  };

  // 高级配置
  advanced: {
    enableProfiling: boolean;
    enableTracing: boolean;
    customHooks: Record<string, string>;
  };
}

// ==================== Zod 验证模式 ====================

const OhMyClaudeConfigSchema = z.object({
  version: z.string().default('1.0.18'),
  debug: z.boolean().default(false),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  agents: z.object({
    defaultTimeout: z.number().min(1000).max(300000).default(30000),
    maxConcurrentTasks: z.number().min(1).max(10).default(3),
    enableCollaboration: z.boolean().default(true),
    contextCompression: z.boolean().default(true)
  }).default({}),

  ui: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    language: z.string().default('zh-CN'),
    showProgress: z.boolean().default(true),
    enableNotifications: z.boolean().default(true)
  }).default({}),

  performance: z.object({
    enableCache: z.boolean().default(true),
    cacheSize: z.number().min(10).max(1000).default(100),
    maxMemoryUsage: z.number().min(50).max(1000).default(200),
    enableMetrics: z.boolean().default(true)
  }).default({}),

  network: z.object({
    timeout: z.number().min(5000).max(120000).default(30000),
    retries: z.number().min(0).max(5).default(3),
    proxy: z.string().optional()
  }).default({}),

  plugins: z.object({
    autoUpdate: z.boolean().default(true),
    enableThirdParty: z.boolean().default(false),
    trustedDomains: z.array(z.string()).default(['github.com', 'npmjs.com'])
  }).default({}),

  advanced: z.object({
    enableProfiling: z.boolean().default(false),
    enableTracing: z.boolean().default(false),
    customHooks: z.record(z.string()).default({})
  }).default({})
});

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: OhMyClaudeConfig = {
  version: '1.0.18',
  debug: false,
  logLevel: 'info',

  agents: {
    defaultTimeout: 30000,
    maxConcurrentTasks: 3,
    enableCollaboration: true,
    contextCompression: true
  },

  ui: {
    theme: 'auto',
    language: 'zh-CN',
    showProgress: true,
    enableNotifications: true
  },

  performance: {
    enableCache: true,
    cacheSize: 100,
    maxMemoryUsage: 200,
    enableMetrics: true
  },

  network: {
    timeout: 30000,
    retries: 3
  },

  plugins: {
    autoUpdate: true,
    enableThirdParty: false,
    trustedDomains: ['github.com', 'npmjs.com']
  },

  advanced: {
    enableProfiling: false,
    enableTracing: false,
    customHooks: {}
  }
};

// ==================== 配置管理器 ====================

export class ConfigManager {
  private config: OhMyClaudeConfig = { ...DEFAULT_CONFIG };
  private configFiles: string[] = [];
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private listeners: Set<(config: OhMyClaudeConfig) => void> = new Set();

  constructor() {
    this.initializeConfigFiles();
    this.loadConfig();
  }

  /**
   * 初始化配置文件路径
   */
  private initializeConfigFiles(): void {
    const home = os.homedir();
    const cwd = process.cwd();

    // 按优先级排序：环境变量 > 项目配置 > 用户配置 > 全局配置
    this.configFiles = [
      path.join(home, '.oh-my-claude', 'config', 'global.json'),     // 全局配置
      path.join(home, '.oh-my-claude', 'config.json'),               // 用户配置
      path.join(cwd, '.oh-my-claude.json'),                          // 项目配置
      path.join(cwd, 'oh-my-claude.config.json')                     // 项目备用配置
    ];
  }

  /**
   * 加载配置（支持分层覆盖）
   */
  async loadConfig(): Promise<void> {
    let mergedConfig = { ...DEFAULT_CONFIG };

    // 1. 加载环境变量
    mergedConfig = this.loadFromEnv(mergedConfig);

    // 2. 加载配置文件
    for (const configFile of this.configFiles) {
      if (fs.existsSync(configFile)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
          mergedConfig = this.deepMerge(mergedConfig, fileConfig);
        } catch (error) {
          console.warn(`配置文件加载失败 ${configFile}:`, error);
        }
      }
    }

    // 3. 验证配置
    try {
      this.config = OhMyClaudeConfigSchema.parse(mergedConfig);
      console.log('✅ 配置加载完成');
    } catch (error) {
      console.warn('⚠️ 配置验证失败，使用默认配置:', error);
      this.config = DEFAULT_CONFIG;
    }

    // 通知监听器
    this.notifyListeners();
  }

  /**
   * 从环境变量加载配置
   */
  private loadFromEnv(baseConfig: OhMyClaudeConfig): OhMyClaudeConfig {
    const config = { ...baseConfig };

    // 基础配置
    if (process.env.OH_MY_CLAUDE_DEBUG) {
      config.debug = process.env.OH_MY_CLAUDE_DEBUG === 'true';
    }
    if (process.env.OH_MY_CLAUDE_LOG_LEVEL) {
      config.logLevel = process.env.OH_MY_CLAUDE_LOG_LEVEL as any;
    }

    // Agent 配置
    if (process.env.OH_MY_CLAUDE_AGENT_TIMEOUT) {
      config.agents.defaultTimeout = parseInt(process.env.OH_MY_CLAUDE_AGENT_TIMEOUT);
    }
    if (process.env.OH_MY_CLAUDE_MAX_CONCURRENT) {
      config.agents.maxConcurrentTasks = parseInt(process.env.OH_MY_CLAUDE_MAX_CONCURRENT);
    }

    // UI 配置
    if (process.env.OH_MY_CLAUDE_THEME) {
      config.ui.theme = process.env.OH_MY_CLAUDE_THEME as any;
    }
    if (process.env.OH_MY_CLAUDE_LANGUAGE) {
      config.ui.language = process.env.OH_MY_CLAUDE_LANGUAGE;
    }

    // 网络配置
    if (process.env.OH_MY_CLAUDE_TIMEOUT) {
      config.network.timeout = parseInt(process.env.OH_MY_CLAUDE_TIMEOUT);
    }
    if (process.env.OH_MY_CLAUDE_PROXY) {
      config.network.proxy = process.env.OH_MY_CLAUDE_PROXY;
    }

    return config;
  }

  /**
   * 深度合并对象
   */
  private deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue as any);
        } else if (sourceValue !== undefined) {
          (result as any)[key] = sourceValue;
        }
      }
    }

    return result;
  }

  /**
   * 检查是否为对象
   */
  private isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * 获取当前配置
   */
  getConfig(): OhMyClaudeConfig {
    return { ...this.config };
  }

  /**
   * 获取配置值
   */
  get<T extends keyof OhMyClaudeConfig>(key: T): OhMyClaudeConfig[T] {
    return this.config[key];
  }

  /**
   * 设置配置值
   */
  set<T extends keyof OhMyClaudeConfig>(key: T, value: OhMyClaudeConfig[T]): void {
    // 验证新值
    const testConfig = { ...this.config, [key]: value };
    const validated = OhMyClaudeConfigSchema.safeParse(testConfig);

    if (validated.success) {
      this.config = validated.data;
      this.notifyListeners();
    } else {
      throw new Error(`配置验证失败: ${validated.error.message}`);
    }
  }

  /**
   * 更新配置（部分更新）
   */
  update(updates: Partial<OhMyClaudeConfig>): void {
    const newConfig = this.deepMerge(this.config, updates);
    const validated = OhMyClaudeConfigSchema.safeParse(newConfig);

    if (validated.success) {
      this.config = validated.data;
      this.notifyListeners();
    } else {
      throw new Error(`配置验证失败: ${validated.error.message}`);
    }
  }

  /**
   * 保存配置到文件
   */
  async saveConfig(filePath?: string, config?: Partial<OhMyClaudeConfig>): Promise<void> {
    const targetFile = filePath || this.configFiles[1]; // 默认保存到用户配置
    const configToSave = config ? this.deepMerge(this.config, config) : this.config;

    // 确保目录存在
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 只保存非默认值以保持文件简洁
    const configToWrite = this.removeDefaults(configToSave);

    fs.writeFileSync(targetFile, JSON.stringify(configToWrite, null, 2), 'utf8');
    console.log(`✅ 配置已保存到 ${targetFile}`);
  }

  /**
   * 移除默认值，只保存自定义配置
   */
  private removeDefaults(config: OhMyClaudeConfig): Partial<OhMyClaudeConfig> {
    const result: any = {};

    const compareObjects = (current: any, default_: any, path: string[] = []): void => {
      for (const key in current) {
        const currentPath = [...path, key];
        const currentValue = current[key];
        const defaultValue = default_[key];

        if (JSON.stringify(currentValue) !== JSON.stringify(defaultValue)) {
          // 值不同，保留
          if (this.isObject(currentValue)) {
            result[key] = {};
            compareObjects(currentValue, defaultValue, currentPath);
          } else {
            result[key] = currentValue;
          }
        }
      }
    };

    compareObjects(config, DEFAULT_CONFIG);
    return result;
  }

  /**
   * 启用热重载
   */
  enableHotReload(): void {
    for (const configFile of this.configFiles) {
      if (fs.existsSync(configFile)) {
        try {
          const watcher = fs.watch(configFile, { persistent: false }, (eventType) => {
            if (eventType === 'change') {
              console.log(`🔄 配置文件变更检测到: ${configFile}`);
              this.loadConfig();
            }
          });
          this.watchers.set(configFile, watcher);
        } catch (error) {
          console.warn(`无法监视配置文件 ${configFile}:`, error);
        }
      }
    }
    console.log('✅ 配置热重载已启用');
  }

  /**
   * 禁用热重载
   */
  disableHotReload(): void {
    for (const [filePath, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
    console.log('✅ 配置热重载已禁用');
  }

  /**
   * 添加配置变更监听器
   */
  onConfigChange(listener: (config: OhMyClaudeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getConfig());
      } catch (error) {
        console.error('配置监听器执行失败:', error);
      }
    }
  }

  /**
   * 获取配置验证模式（用于文档生成）
   */
  getConfigSchema(): z.ZodSchema {
    return OhMyClaudeConfigSchema;
  }

  /**
   * 重置为默认配置
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.notifyListeners();
  }

  /**
   * 导出配置
   */
  exportConfig(): Record<string, any> {
    return {
      config: this.config,
      files: this.configFiles,
      exportedAt: new Date().toISOString(),
      version: this.config.version
    };
  }

  /**
   * 导入配置
   */
  importConfig(data: Record<string, any>): void {
    if (data.config && data.version) {
      const importedConfig = OhMyClaudeConfigSchema.safeParse(data.config);
      if (importedConfig.success) {
        this.config = importedConfig.data;
        this.notifyListeners();
        console.log('✅ 配置导入成功');
      } else {
        throw new Error(`配置导入验证失败: ${importedConfig.error.message}`);
      }
    } else {
      throw new Error('无效的配置数据格式');
    }
  }
}

// ==================== 全局配置实例 ====================

export const configManager = new ConfigManager();

// ==================== 配置工具函数 ====================

/**
 * 获取配置值（便捷方法）
 */
export function getConfig<T extends keyof OhMyClaudeConfig>(key: T): OhMyClaudeConfig[T] {
  return configManager.get(key);
}

/**
 * 设置配置值（便捷方法）
 */
export function setConfig<T extends keyof OhMyClaudeConfig>(key: T, value: OhMyClaudeConfig[T]): void {
  configManager.set(key, value);
}

/**
 * 更新配置（便捷方法）
 */
export function updateConfig(updates: Partial<OhMyClaudeConfig>): void {
  configManager.update(updates);
}

/**
 * 保存配置（便捷方法）
 */
export async function saveConfig(filePath?: string, config?: Partial<OhMyClaudeConfig>): Promise<void> {
  await configManager.saveConfig(filePath, config);
}