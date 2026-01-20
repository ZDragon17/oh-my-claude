/**
 * MCP Loader - 内置 MCP 服务器加载和管理
 * 
 * 提供 oh-my-claude 的内置 MCP 服务器支持，包括：
 * - websearch: Exa AI 网络搜索
 * - context7: 官方文档查询
 * - grep_app: GitHub 代码搜索
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP 服务器配置接口
 */
export interface MCPServerConfig {
  name: string;
  description: string;
  version: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  tools?: MCPTool[];
  metadata?: Record<string, unknown>;
}

/**
 * MCP 工具定义接口
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * 内置 MCP 服务器列表
 */
export const BUILTIN_MCPS = ['websearch', 'context7', 'grep_app'] as const;
export type BuiltinMCP = typeof BUILTIN_MCPS[number];

/**
 * MCP 加载器类
 */
export class MCPLoader {
  private mcpsDir: string;
  private loadedMCPs: Map<string, MCPServerConfig> = new Map();
  private disabledMCPs: Set<string> = new Set();

  constructor(mcpsDir?: string) {
    // 默认使用包内的 mcps 目录
    this.mcpsDir = mcpsDir || path.join(__dirname, '../../mcps');
  }

  /**
   * 设置禁用的 MCP 列表
   */
  setDisabledMCPs(disabled: string[]): void {
    this.disabledMCPs = new Set(disabled);
  }

  /**
   * 加载所有内置 MCP 配置
   */
  loadBuiltinMCPs(): MCPServerConfig[] {
    const configs: MCPServerConfig[] = [];

    for (const mcpName of BUILTIN_MCPS) {
      if (this.disabledMCPs.has(mcpName)) {
        continue;
      }

      try {
        const config = this.loadMCPConfig(mcpName);
        if (config) {
          this.loadedMCPs.set(mcpName, config);
          configs.push(config);
        }
      } catch (error) {
        console.warn(`[MCP] Failed to load ${mcpName}:`, error);
      }
    }

    return configs;
  }

  /**
   * 加载单个 MCP 配置
   */
  loadMCPConfig(name: string): MCPServerConfig | null {
    const configPath = path.join(this.mcpsDir, `${name}.json`);
    
    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as MCPServerConfig;
      
      // 展开环境变量
      config.env = this.expandEnvVars(config.env);
      
      return config;
    } catch (error) {
      console.error(`[MCP] Error parsing ${name}.json:`, error);
      return null;
    }
  }

  /**
   * 展开环境变量
   * 将 ${VAR_NAME} 替换为实际环境变量值
   */
  private expandEnvVars(env: Record<string, string>): Record<string, string> {
    const expanded: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        expanded[key] = process.env[varName] || '';
      } else {
        expanded[key] = value;
      }
    }
    
    return expanded;
  }

  /**
   * 获取已加载的 MCP
   */
  getLoadedMCP(name: string): MCPServerConfig | undefined {
    return this.loadedMCPs.get(name);
  }

  /**
   * 获取所有已加载的 MCP
   */
  getAllLoadedMCPs(): MCPServerConfig[] {
    return Array.from(this.loadedMCPs.values());
  }

  /**
   * 检查 MCP 是否可用（环境变量已配置）
   */
  isMCPAvailable(name: string): boolean {
    const config = this.loadedMCPs.get(name);
    if (!config) return false;

    // 检查必需的环境变量是否已设置
    for (const [, value] of Object.entries(config.env)) {
      if (!value) return false;
    }

    return true;
  }

  /**
   * 获取 MCP 状态摘要
   */
  getStatusSummary(): MCPStatus[] {
    const statuses: MCPStatus[] = [];

    for (const mcpName of BUILTIN_MCPS) {
      const config = this.loadedMCPs.get(mcpName);
      const disabled = this.disabledMCPs.has(mcpName);
      const available = config ? this.isMCPAvailable(mcpName) : false;

      statuses.push({
        name: mcpName,
        loaded: !!config,
        disabled,
        available,
        description: config?.description || '',
        missingEnvVars: this.getMissingEnvVars(mcpName),
      });
    }

    return statuses;
  }

  /**
   * 获取缺失的环境变量
   */
  private getMissingEnvVars(name: string): string[] {
    const configPath = path.join(this.mcpsDir, `${name}.json`);
    if (!fs.existsSync(configPath)) return [];

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content) as MCPServerConfig;
      const missing: string[] = [];

      for (const [, value] of Object.entries(config.env)) {
        if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
          const varName = value.slice(2, -1);
          if (!process.env[varName]) {
            missing.push(varName);
          }
        }
      }

      return missing;
    } catch {
      return [];
    }
  }

  /**
   * 生成 .mcp.json 格式的配置（用于 Claude Code 兼容）
   */
  generateMCPJson(): { mcps: Record<string, MCPJsonConfig> } {
    const mcps: Record<string, MCPJsonConfig> = {};

    for (const config of this.loadedMCPs.values()) {
      mcps[config.name] = {
        command: config.command,
        args: config.args,
        env: config.env,
      };
    }

    return { mcps };
  }
}

/**
 * MCP 状态接口
 */
export interface MCPStatus {
  name: string;
  loaded: boolean;
  disabled: boolean;
  available: boolean;
  description: string;
  missingEnvVars: string[];
}

/**
 * Claude Code .mcp.json 格式
 */
export interface MCPJsonConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * 创建默认 MCP 加载器实例
 */
export function createMCPLoader(disabledMCPs?: string[]): MCPLoader {
  const loader = new MCPLoader();
  if (disabledMCPs) {
    loader.setDisabledMCPs(disabledMCPs);
  }
  loader.loadBuiltinMCPs();
  return loader;
}
