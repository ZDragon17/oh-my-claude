/**
 * 技能加载器模块
 * 实现运行时技能配置加载机制
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';

// ==================== 类型定义 ====================

/**
 * 技能配置 Schema
 */
const SkillConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  repository: z.string().optional(),
  
  // 触发器配置
  triggers: z.object({
    keywords: z.array(z.string()).optional(),
    commands: z.array(z.string()).optional()
  }).optional(),
  
  // 激活配置
  activation: z.object({
    announcement: z.string().optional(),
    mustSay: z.boolean().optional()
  }).optional(),
  
  // 规则配置
  rules: z.record(z.any()).optional(),
  
  // 禁止行为
  prohibitions: z.array(z.string()).optional(),
  
  // 完成标记
  completionMarker: z.object({
    format: z.string().optional(),
    conditions: z.array(z.string()).optional()
  }).optional(),
  
  // 命令别名
  commandAliases: z.record(z.array(z.string())).optional(),
  
  // 关键词触发器
  keywordTriggers: z.record(z.array(z.string())).optional(),
  
  // 进度样式配置
  progressStyles: z.object({
    full: z.string().optional(),
    empty: z.string().optional(),
    width: z.number().optional()
  }).optional(),
  
  // 状态图标
  statusIcons: z.record(z.string()).optional(),
  
  // Agent 图标
  agentIcons: z.record(z.string()).optional(),
  
  // 里程碑表情
  milestoneEmojis: z.record(z.string()).optional(),
  
  // 废弃配置
  deprecated: z.object({
    stateFile: z.string().optional(),
    reason: z.string().optional()
  }).optional()
});

export type SkillConfig = z.infer<typeof SkillConfigSchema>;

export interface LoadedSkill {
  name: string;
  config: SkillConfig;
  markdownContent?: string;
  loadedFrom: string;
  loadedAt: string;
}

export interface SkillLoaderOptions {
  skillDirs?: string[];
  enableCache?: boolean;
  cacheTTL?: number;
}

// ==================== 默认配置 ====================

const DEFAULT_SKILL_DIRS = [
  path.join(os.homedir(), '.claude', 'skills'),
  path.join(process.cwd(), 'skills')
];

const SKILL_CONFIG_FILE = 'skill.json';
const SKILL_MARKDOWN_FILE = 'SKILL.md';

// ==================== 技能加载器实现 ====================

export class SkillLoader {
  private skillDirs: string[];
  private cache: Map<string, LoadedSkill> = new Map();
  private enableCache: boolean;
  private cacheTTL: number;
  private lastCacheUpdate: number = 0;

  constructor(options: SkillLoaderOptions = {}) {
    this.skillDirs = options.skillDirs ?? DEFAULT_SKILL_DIRS;
    this.enableCache = options.enableCache ?? true;
    this.cacheTTL = options.cacheTTL ?? 60000; // 默认 1 分钟
  }

  /**
   * 加载所有可用技能
   */
  loadAllSkills(): LoadedSkill[] {
    // 检查缓存是否有效
    if (this.enableCache && this.isCacheValid()) {
      return Array.from(this.cache.values());
    }

    const skills: LoadedSkill[] = [];

    for (const skillDir of this.skillDirs) {
      if (!fs.existsSync(skillDir)) {
        continue;
      }

      try {
        const entries = fs.readdirSync(skillDir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          
          const skillPath = path.join(skillDir, entry.name);
          const skill = this.loadSkillFromDir(skillPath);
          
          if (skill) {
            skills.push(skill);
            if (this.enableCache) {
              this.cache.set(skill.name, skill);
            }
          }
        }
      } catch (error) {
        console.warn(`读取技能目录失败 ${skillDir}:`, error);
      }
    }

    this.lastCacheUpdate = Date.now();
    return skills;
  }

  /**
   * 加载单个技能
   */
  loadSkill(skillName: string): LoadedSkill | null {
    // 检查缓存
    if (this.enableCache && this.cache.has(skillName)) {
      return this.cache.get(skillName) ?? null;
    }

    // 在所有技能目录中搜索
    for (const skillDir of this.skillDirs) {
      const skillPath = path.join(skillDir, skillName);
      
      if (fs.existsSync(skillPath)) {
        const skill = this.loadSkillFromDir(skillPath);
        if (skill && this.enableCache) {
          this.cache.set(skill.name, skill);
        }
        return skill;
      }
    }

    return null;
  }

  /**
   * 从目录加载技能
   */
  private loadSkillFromDir(skillDir: string): LoadedSkill | null {
    const configPath = path.join(skillDir, SKILL_CONFIG_FILE);
    
    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const rawConfig = JSON.parse(configContent);
      const config = SkillConfigSchema.parse(rawConfig);

      // 尝试加载 Markdown 内容
      let markdownContent: string | undefined;
      const markdownPath = path.join(skillDir, SKILL_MARKDOWN_FILE);
      
      if (fs.existsSync(markdownPath)) {
        markdownContent = fs.readFileSync(markdownPath, 'utf8');
      }

      return {
        name: config.name,
        config,
        markdownContent,
        loadedFrom: skillDir,
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`加载技能失败 ${skillDir}:`, error);
      return null;
    }
  }

  /**
   * 根据关键词查找技能
   */
  findSkillByKeyword(keyword: string): LoadedSkill | null {
    const skills = this.loadAllSkills();
    const normalizedKeyword = keyword.toLowerCase();

    for (const skill of skills) {
      // 检查 triggers.keywords
      const triggerKeywords = skill.config.triggers?.keywords ?? [];
      if (triggerKeywords.some(k => k.toLowerCase() === normalizedKeyword)) {
        return skill;
      }

      // 检查顶级 keywords
      const keywords = skill.config.keywords ?? [];
      if (keywords.some(k => k.toLowerCase() === normalizedKeyword)) {
        return skill;
      }

      // 检查 keywordTriggers
      const keywordTriggers = skill.config.keywordTriggers ?? {};
      for (const triggers of Object.values(keywordTriggers)) {
        if (triggers.some(k => k.toLowerCase() === normalizedKeyword)) {
          return skill;
        }
      }
    }

    return null;
  }

  /**
   * 根据命令查找技能
   */
  findSkillByCommand(command: string): LoadedSkill | null {
    const skills = this.loadAllSkills();
    const normalizedCommand = command.toLowerCase();

    for (const skill of skills) {
      // 检查 triggers.commands
      const triggerCommands = skill.config.triggers?.commands ?? [];
      if (triggerCommands.some(c => c.toLowerCase() === normalizedCommand)) {
        return skill;
      }

      // 检查 commandAliases
      const aliases = skill.config.commandAliases ?? {};
      for (const [cmd, aliasList] of Object.entries(aliases)) {
        if (cmd.toLowerCase() === normalizedCommand) {
          return skill;
        }
        if (aliasList.some(a => a.toLowerCase() === normalizedCommand)) {
          return skill;
        }
      }
    }

    return null;
  }

  /**
   * 获取所有命令别名映射
   */
  getAllCommandAliases(): Record<string, string[]> {
    const skills = this.loadAllSkills();
    const allAliases: Record<string, string[]> = {};

    for (const skill of skills) {
      const aliases = skill.config.commandAliases ?? {};
      for (const [cmd, aliasList] of Object.entries(aliases)) {
        if (!allAliases[cmd]) {
          allAliases[cmd] = [];
        }
        allAliases[cmd].push(...aliasList.filter(a => !allAliases[cmd]?.includes(a)));
      }
    }

    return allAliases;
  }

  /**
   * 获取所有关键词触发器
   */
  getAllKeywordTriggers(): Record<string, string[]> {
    const skills = this.loadAllSkills();
    const allTriggers: Record<string, string[]> = {};

    for (const skill of skills) {
      const triggers = skill.config.keywordTriggers ?? {};
      for (const [mode, keywords] of Object.entries(triggers)) {
        if (!allTriggers[mode]) {
          allTriggers[mode] = [];
        }
        allTriggers[mode].push(...keywords.filter(k => !allTriggers[mode]?.includes(k)));
      }
    }

    return allTriggers;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    if (!this.enableCache || this.cache.size === 0) {
      return false;
    }
    return Date.now() - this.lastCacheUpdate < this.cacheTTL;
  }

  /**
   * 获取技能目录列表
   */
  getSkillDirs(): string[] {
    return [...this.skillDirs];
  }

  /**
   * 添加技能目录
   */
  addSkillDir(dir: string): void {
    if (!this.skillDirs.includes(dir)) {
      this.skillDirs.push(dir);
      this.clearCache();
    }
  }

  /**
   * 获取缓存的技能数量
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// ==================== 单例实例 ====================

let defaultLoader: SkillLoader | null = null;

/**
 * 获取默认技能加载器实例
 */
export function getSkillLoader(options?: SkillLoaderOptions): SkillLoader {
  if (!defaultLoader || options) {
    defaultLoader = new SkillLoader(options);
  }
  return defaultLoader;
}

// ==================== 便捷函数 ====================

/**
 * 加载所有技能
 */
export function loadAllSkills(): LoadedSkill[] {
  return getSkillLoader().loadAllSkills();
}

/**
 * 加载单个技能
 */
export function loadSkill(skillName: string): LoadedSkill | null {
  return getSkillLoader().loadSkill(skillName);
}

/**
 * 根据关键词查找技能
 */
export function findSkillByKeyword(keyword: string): LoadedSkill | null {
  return getSkillLoader().findSkillByKeyword(keyword);
}

/**
 * 根据命令查找技能
 */
export function findSkillByCommand(command: string): LoadedSkill | null {
  return getSkillLoader().findSkillByCommand(command);
}

export default SkillLoader;
