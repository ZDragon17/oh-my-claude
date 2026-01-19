/**
 * 插件组件安装器
 * 负责 Commands 和 Skills 的安装逻辑
 */

import * as fs from 'fs';
import * as path from 'path';
import { COMMANDS_DIR, SKILLS_DIR, CORE_AGENTS } from './constants.js';
import { InstallResult, InstallResultSchema } from './file-operations.js';
import { success, info, warn } from '../scripts/logger.js';
import AgentStateManagerImpl from './agent-state-manager.js';

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

  // 清理旧版本的 zcf 子目录
  const legacyZcfDir = path.join(commandsDir, 'zcf');
  if (fs.existsSync(legacyZcfDir)) {
    try {
      fs.rmSync(legacyZcfDir, { recursive: true, force: true });
      stats.cleaned = true;
      info('已清理旧版本 zcf 子目录');
    } catch (err) {
      warn(`清理旧版本目录失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

        // 复制其他支持文件
        const files = fs.readdirSync(skillSrcDir, { withFileTypes: true })
          .filter(f => f.isFile() && f.name !== 'skill.json');

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
