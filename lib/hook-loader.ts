/**
 * Hook 加载器模块
 * 实现 Hook 配置的懒加载和缓存机制
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseJsonc, isJsoncFile } from './jsonc-parser.js';

// ==================== 类型定义 ====================

export interface HookDefinition {
  type: 'command';
  command: string;
  timeout: number;
  continueOnError: boolean;
  description: string;
}

export interface HooksConfig {
  hooks: {
    Stop?: HookDefinition[];
    UserPromptSubmit?: HookDefinition[];
    PostToolUse?: HookDefinition[];
  };
  disabled_hooks: string[];
  hook_config: {
    parallel_execution: boolean;
    log_enabled: boolean;
    log_path: string;
  };
}

export interface LoadedHook extends HookDefinition {
  name: string;
  event: string;
  enabled: boolean;
}

// ==================== Hook 加载器实现 ====================

class HookLoader {
  private cache: HooksConfig | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 30000; // 30秒缓存
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'hooks', 'hooks.json');
  }

  /**
   * 加载 Hooks 配置（带缓存）
   */
  loadHooks(): HooksConfig | null {
    // 检查缓存是否有效
    if (this.isCacheValid()) {
      return this.cache;
    }

    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`Hook 配置文件不存在: ${this.configPath}`);
        return null;
      }

      const content = fs.readFileSync(this.configPath, 'utf8');
      const config = isJsoncFile(this.configPath)
        ? parseJsonc<HooksConfig>(content)
        : JSON.parse(content);

      this.cache = config;
      this.cacheTimestamp = Date.now();

      return config;
    } catch (error) {
      console.error('加载 Hook 配置失败:', error);
      return null;
    }
  }

  /**
   * 获取特定事件的 Hooks
   */
  getHooksForEvent(event: 'Stop' | 'UserPromptSubmit' | 'PostToolUse'): LoadedHook[] {
    const config = this.loadHooks();
    if (!config) return [];

    const hooks = config.hooks[event] ?? [];
    const disabledHooks = config.disabled_hooks ?? [];

    return hooks.map((hook, index) => {
      // 从命令中提取 hook 名称
      const match = hook.command.match(/hooks\/([^.]+)\.sh/);
      const name = match?.[1] ?? `hook-${index}`;

      return {
        ...hook,
        name,
        event,
        enabled: !disabledHooks.includes(name)
      } as LoadedHook;
    }).filter(hook => hook.enabled);
  }

  /**
   * 获取所有启用的 Hooks
   */
  getAllEnabledHooks(): LoadedHook[] {
    const events: Array<'Stop' | 'UserPromptSubmit' | 'PostToolUse'> = [
      'Stop',
      'UserPromptSubmit',
      'PostToolUse'
    ];

    return events.flatMap(event => this.getHooksForEvent(event));
  }

  /**
   * 获取 Hook 统计信息
   */
  getHookStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byEvent: Record<string, number>;
  } {
    const config = this.loadHooks();
    if (!config) {
      return { total: 0, enabled: 0, disabled: 0, byEvent: {} };
    }

    const allHooks = this.getAllEnabledHooks();
    const disabledCount = config.disabled_hooks?.length ?? 0;
    const totalCount = allHooks.length + disabledCount;

    const byEvent: Record<string, number> = {
      Stop: this.getHooksForEvent('Stop').length,
      UserPromptSubmit: this.getHooksForEvent('UserPromptSubmit').length,
      PostToolUse: this.getHooksForEvent('PostToolUse').length
    };

    return {
      total: totalCount,
      enabled: allHooks.length,
      disabled: disabledCount,
      byEvent
    };
  }

  /**
   * 检查特定 Hook 是否启用
   */
  isHookEnabled(hookName: string): boolean {
    const config = this.loadHooks();
    if (!config) return false;

    return !config.disabled_hooks?.includes(hookName);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * 设置缓存 TTL
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cacheTimestamp < this.cacheTTL;
  }

  /**
   * 获取配置路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 设置配置路径
   */
  setConfigPath(configPath: string): void {
    this.configPath = configPath;
    this.clearCache();
  }
}

// ==================== 单例实例 ====================

let defaultLoader: HookLoader | null = null;

/**
 * 获取默认 Hook 加载器实例
 */
export function getHookLoader(): HookLoader {
  if (!defaultLoader) {
    defaultLoader = new HookLoader();
  }
  return defaultLoader;
}

// ==================== 便捷函数 ====================

/**
 * 加载 Hooks 配置
 */
export function loadHooks(): HooksConfig | null {
  return getHookLoader().loadHooks();
}

/**
 * 获取特定事件的 Hooks
 */
export function getHooksForEvent(event: 'Stop' | 'UserPromptSubmit' | 'PostToolUse'): LoadedHook[] {
  return getHookLoader().getHooksForEvent(event);
}

/**
 * 获取所有启用的 Hooks
 */
export function getAllEnabledHooks(): LoadedHook[] {
  return getHookLoader().getAllEnabledHooks();
}

/**
 * 检查 Hook 是否启用
 */
export function isHookEnabled(hookName: string): boolean {
  return getHookLoader().isHookEnabled(hookName);
}

/**
 * 获取 Hook 统计信息
 */
export function getHookStats() {
  return getHookLoader().getHookStats();
}

export default HookLoader;
