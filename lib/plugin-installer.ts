/**
 * 插件组件安装器
 * 负责 Commands、Skills 的安装逻辑，以及插件注册
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { COMMANDS_DIR, SKILLS_DIR, CORE_AGENTS, PLUGIN_NAME, VERSION, PLUGIN_DIR } from './constants.js';
import { InstallResult, InstallResultSchema } from './file-operations.js';
import { success, info, warn, error } from '../scripts/logger.js';
import AgentStateManagerImpl from './agent-state-manager.js';

// ==================== 插件注册表路径 ====================

/** installed_plugins.json 路径 */
const INSTALLED_PLUGINS_PATH = path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json');

// ==================== 类型定义 ====================

interface PluginEntry {
  scope: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  isLocal: boolean;
}

interface InstalledPluginsFile {
  version: number;
  plugins: Record<string, PluginEntry[]>;
}

// ==================== 路径获取函数 ====================

/**
 * 获取 commands 安装路径
 */
export function getCommandsDir(): string {
  return COMMANDS_DIR;
}

/**
 * 获取 skills 安装路径
 */
export function getSkillsDir(): string {
  return SKILLS_DIR;
}

// ==================== 安装 Commands ====================

/**
 * 安装 slash commands 到 ~/.claude/commands/
 */
export function installCommands(packageDir: string): InstallResult {
  const commandsDir = getCommandsDir();
  const commandsSrc = path.join(packageDir, 'commands');
  const stats: InstallResult = { count: 0, errors: [], cleaned: false };

  info('正在安装 slash commands...');

  // 清理旧版本的 zcf 子目录（用户全局目录）
  const legacyZcfDir = path.join(commandsDir, 'zcf');
  if (fs.existsSync(legacyZcfDir)) {
    try {
      fs.rmSync(legacyZcfDir, { recursive: true, force: true });
      stats.cleaned = true;
      info('已清理用户目录旧版 zcf 子目录');
    } catch (err) {
      warn(`清理旧版本目录失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // 清理项目本地的旧版 zcf 子目录（v1.0.8 及之前版本在项目目录安装）
  const projectZcfDir = path.join(process.cwd(), '.claude', 'commands', 'zcf');
  if (fs.existsSync(projectZcfDir)) {
    try {
      fs.rmSync(projectZcfDir, { recursive: true, force: true });
      stats.cleaned = true;
      info('已清理项目本地旧版 zcf 子目录');
    } catch (err) {
      warn(`清理项目本地旧版目录失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // 创建 commands 目录
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
  }

  // 复制所有 .md 文件
  if (fs.existsSync(commandsSrc)) {
    const mdFiles = fs.readdirSync(commandsSrc).filter(f => f.endsWith('.md'));
    for (const file of mdFiles) {
      try {
        fs.copyFileSync(
          path.join(commandsSrc, file),
          path.join(commandsDir, file)
        );
        stats.count++;
      } catch (err) {
        stats.errors.push(`复制 ${file} 失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }

  if (stats.count > 0) {
    success(`Slash commands 安装完成 (${stats.count} 个命令)`);
    info(`Commands 位置: ${commandsDir}`);
    if (stats.cleaned) {
      warn('命令格式已更改：请使用 /yishan 而非 /zcf:yishan');
    }
  } else {
    warn('未找到任何命令文件');
  }

  return InstallResultSchema.parse(stats);
}

// ==================== 安装 Skills ====================

/**
 * 安装 skills 到 ~/.claude/skills/
 */
export function installSkills(packageDir: string): InstallResult {
  const skillsDir = getSkillsDir();
  const skillsSrc = path.join(packageDir, 'skills');
  const stats: InstallResult = { count: 0, errors: [] };

  info('正在安装 skills...');

  if (fs.existsSync(skillsSrc)) {
    const skillDirs = fs.readdirSync(skillsSrc, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const skillDir of skillDirs) {
      const skillName = skillDir.name;
      const skillSrcDir = path.join(skillsSrc, skillName);
      const skillDestDir = path.join(skillsDir, skillName);

      try {
        if (!fs.existsSync(skillDestDir)) {
          fs.mkdirSync(skillDestDir, { recursive: true });
        }

        // 复制 SKILL.md
        const skillMdSrc = path.join(skillSrcDir, 'SKILL.md');
        if (fs.existsSync(skillMdSrc)) {
          fs.copyFileSync(skillMdSrc, path.join(skillDestDir, 'SKILL.md'));
        }

        // 复制所有支持文件（包括 skill.json）
        const files = fs.readdirSync(skillSrcDir, { withFileTypes: true })
          .filter(f => f.isFile());

        for (const file of files) {
          try {
            fs.copyFileSync(
              path.join(skillSrcDir, file.name),
              path.join(skillDestDir, file.name)
            );
          } catch {
            // 忽略非关键文件错误
          }
        }

        stats.count++;
      } catch (err) {
        stats.errors.push(`安装 skill ${skillName} 失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }

  if (stats.count > 0) {
    success(`Skills 安装完成 (${stats.count} 个 skill)`);
    info(`Skills 位置: ${skillsDir}`);
  }

  return InstallResultSchema.parse(stats);
}

// ==================== 注册 Agents ====================

/**
 * 注册核心 Agent
 */
export function registerCoreAgents(): void {
  const agentStateManager = new AgentStateManagerImpl();

  for (const agent of CORE_AGENTS) {
    try {
      agentStateManager.registerAgent(agent.id, agent.name);
      info(`已注册 Agent: ${agent.name}`);
    } catch (err) {
      warn(`注册 Agent ${agent.name} 失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}

// ==================== 插件注册 ====================

/**
 * 读取 installed_plugins.json
 */
function readInstalledPlugins(): InstalledPluginsFile {
  if (fs.existsSync(INSTALLED_PLUGINS_PATH)) {
    try {
      const content = fs.readFileSync(INSTALLED_PLUGINS_PATH, 'utf-8');
      return JSON.parse(content) as InstalledPluginsFile;
    } catch {
      // 文件损坏，创建新的
    }
  }
  return { version: 2, plugins: {} };
}

/**
 * 写入 installed_plugins.json
 */
function writeInstalledPlugins(data: InstalledPluginsFile): void {
  const pluginsDir = path.dirname(INSTALLED_PLUGINS_PATH);
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }
  fs.writeFileSync(INSTALLED_PLUGINS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 注册插件到 Claude Code 的 installed_plugins.json
 * 这是关键步骤 - 只有注册的插件才会被 Claude Code 加载 hooks
 */
export function registerPluginToClaudeCode(): boolean {
  info('正在注册插件到 Claude Code...');

  try {
    const installedPlugins = readInstalledPlugins();
    const pluginKey = `${PLUGIN_NAME}@local`;
    const now = new Date().toISOString();

    // 创建插件条目
    const pluginEntry: PluginEntry = {
      scope: 'user',
      installPath: PLUGIN_DIR,
      version: VERSION,
      installedAt: now,
      lastUpdated: now,
      isLocal: true
    };

    // 检查是否已存在
    if (installedPlugins.plugins[pluginKey]) {
      // 更新现有条目
      installedPlugins.plugins[pluginKey] = [pluginEntry];
      info(`已更新插件注册: ${pluginKey} v${VERSION}`);
    } else {
      // 新增条目
      installedPlugins.plugins[pluginKey] = [pluginEntry];
      info(`已注册新插件: ${pluginKey} v${VERSION}`);
    }

    writeInstalledPlugins(installedPlugins);
    success('插件已注册到 Claude Code');
    info(`注册路径: ${INSTALLED_PLUGINS_PATH}`);

    // 同步 hooks 到 settings.json（关键步骤！）
    syncHooksToSettings();

    return true;
  } catch (err) {
    error(`插件注册失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    warn('hooks 功能可能无法正常工作');
    return false;
  }
}

// ==================== Hooks 同步 ====================

/** settings.json 路径 */
const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

interface HookCommand {
  type: string;
  command: string;
  timeout: number;
}

interface HookEntry {
  matcher: string | { tools?: string[] };
  hooks: HookCommand[];
}

interface SettingsFile {
  hooks?: Record<string, HookEntry[]>;
  [key: string]: unknown;
}

/**
 * 同步 hooks 配置到 settings.json
 * Claude Code 需要在 settings.json 中配置 hooks 才能生效
 */
export function syncHooksToSettings(): void {
  info('正在同步 hooks 到 settings.json...');

  try {
    // 读取现有 settings.json
    let settings: SettingsFile = {};
    if (fs.existsSync(SETTINGS_PATH)) {
      try {
        const content = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        settings = JSON.parse(content) as SettingsFile;
      } catch {
        warn('settings.json 解析失败，将创建新配置');
      }
    }

    // 备份 settings.json
    if (fs.existsSync(SETTINGS_PATH)) {
      const backupPath = `${SETTINGS_PATH}.backup-${Date.now()}`;
      fs.copyFileSync(SETTINGS_PATH, backupPath);
    }

    // 定义核心 hooks（使用新格式：matcher + hooks 数组）
    // 注意：使用 $HOME 环境变量，让 bash 在运行时解析路径
    // 这样可以兼容 Git Bash、WSL 等不同环境
    const hooksBasePath = '$HOME/.claude/plugins/oh-my-claude/hooks';
    const coreHooks: Record<string, HookEntry[]> = {
      PreToolUse: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/write-existing-file-guard.sh"'`,
              timeout: 2000
            }
          ]
        }
      ],
      PostToolUse: [
        {
          matcher: 'TodoWrite',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/progress-notifier.sh"'`,
              timeout: 3000
            }
          ]
        },
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/context-smart-alert.sh"'`,
              timeout: 2000
            }
          ]
        },
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/category-skill-reminder.sh"'`,
              timeout: 2000
            }
          ]
        },
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/comment-checker.sh"'`,
              timeout: 2000
            }
          ]
        },
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/json-error-recovery.sh"'`,
              timeout: 2000
            }
          ]
        }
      ],
      Stop: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/todo-continuation.sh"'`,
              timeout: 3000
            }
          ]
        },
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/ralph-loop.sh"'`,
              timeout: 3000
            }
          ]
        },
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/stop-continuation-guard.sh"'`,
              timeout: 3000
            }
          ]
        },
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: `bash -c '. "${hooksBasePath}/todo-continuation-enforcer.sh"'`,
              timeout: 3000
            }
          ]
        }
      ]
    };

    // 合并 hooks（避免重复，同时更新旧格式的 hooks）
    if (!settings.hooks) {
      settings.hooks = {};
    }

    let hooksAdded = 0;
    let hooksUpdated = 0;

    // 需要更新的脚本名列表
    const scriptsToManage = ['progress-notifier.sh', 'context-smart-alert.sh', 'todo-continuation.sh', 'ralph-loop.sh', 'write-existing-file-guard.sh', 'category-skill-reminder.sh', 'comment-checker.sh', 'json-error-recovery.sh', 'stop-continuation-guard.sh', 'todo-continuation-enforcer.sh'];

    for (const [hookType, hookEntries] of Object.entries(coreHooks)) {
      if (!settings.hooks[hookType]) {
        settings.hooks[hookType] = [];
      }

      // 检查并移除旧格式的 oh-my-claude hooks（使用绝对路径而非 $HOME）
      const oldLength = settings.hooks[hookType].length;
      settings.hooks[hookType] = settings.hooks[hookType].filter((entry: HookEntry) => {
        if (entry && typeof entry === 'object' && 'hooks' in entry && Array.isArray(entry.hooks)) {
          for (const h of entry.hooks) {
            if (h && typeof h === 'object' && 'command' in h) {
              const cmd = h.command as string;
              // 检查是否是旧格式的 oh-my-claude hook（使用绝对路径）
              if (cmd.includes('oh-my-claude/hooks/') && !cmd.includes('$HOME')) {
                // 检查是否是我们管理的脚本
                for (const script of scriptsToManage) {
                  if (cmd.includes(script)) {
                    return false; // 移除这个旧格式的 hook
                  }
                }
              }
            }
          }
        }
        return true; // 保留其他 hooks
      });

      if (settings.hooks[hookType].length < oldLength) {
        hooksUpdated += oldLength - settings.hooks[hookType].length;
      }

      // 获取现有脚本名列表（从新格式的 hooks 数组中提取）
      const existingScripts = new Set<string>();
      for (const entry of settings.hooks[hookType]) {
        if (entry && typeof entry === 'object' && 'hooks' in entry && Array.isArray(entry.hooks)) {
          for (const h of entry.hooks) {
            if (h && typeof h === 'object' && 'command' in h) {
              const scriptName = (h.command as string).split('/').pop() || '';
              existingScripts.add(scriptName);
            }
          }
        }
      }

      // 添加新的 hook entries（如果脚本不存在）
      for (const hookEntry of hookEntries) {
        // 提取这个 entry 中的脚本名
        const scriptNames = hookEntry.hooks.map(h => h.command.split('/').pop() || '');
        const allExist = scriptNames.every(name =>
          Array.from(existingScripts).some(existing => existing.includes(name))
        );

        if (!allExist) {
          settings.hooks[hookType].push(hookEntry);
          hooksAdded++;
        }
      }
    }

    // 写回 settings.json
    const settingsDir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');

    if (hooksAdded > 0 || hooksUpdated > 0) {
      if (hooksUpdated > 0) {
        success(`hooks 已更新到 settings.json (更新 ${hooksUpdated} 个，新增 ${hooksAdded} 个)`);
      } else {
        success(`hooks 已同步到 settings.json (新增 ${hooksAdded} 个)`);
      }
    } else {
      info('hooks 已是最新，无需更新');
    }
  } catch (err) {
    warn(`hooks 同步失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    warn('请手动配置 hooks，或运行 /diagnose 获取帮助');
  }
}

/**
 * 从 Claude Code 的 installed_plugins.json 移除插件注册
 */
export function unregisterPluginFromClaudeCode(): boolean {
  info('正在从 Claude Code 移除插件注册...');

  try {
    if (!fs.existsSync(INSTALLED_PLUGINS_PATH)) {
      info('installed_plugins.json 不存在，跳过移除');
      return true;
    }

    const installedPlugins = readInstalledPlugins();
    const pluginKey = `${PLUGIN_NAME}@local`;

    if (installedPlugins.plugins[pluginKey]) {
      delete installedPlugins.plugins[pluginKey];
      writeInstalledPlugins(installedPlugins);
      success('已从 Claude Code 移除插件注册');
    } else {
      info('插件未注册，跳过移除');
    }

    return true;
  } catch (err) {
    error(`移除插件注册失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return false;
  }
}
