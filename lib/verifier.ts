/**
 * 验证器模块
 * 负责插件安装的验证和健康检查
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import {
  COMMANDS_DIR,
  PLUGIN_DIR,
  REQUIRED_DIRS,
  OPTIONAL_DIRS,
  CORE_AGENT_FILES,
  CORE_HOOK_FILES
} from './constants.js';
import { checkClaudeCode } from './installer.js';
import { success, info, warn, error, log } from '../scripts/logger.js';
import { printCommandTitle, printDivider } from './ui/messages.js';

// ==================== Zod 验证 Schema ====================

export const VerificationResultSchema = z.object({
  success: z.boolean(),
  errors: z.array(z.string())
});

// ==================== 类型定义 ====================

export interface VerificationResult {
  success: boolean;
  errors: string[];
}

// ==================== 基础验证 ====================

/**
 * 验证安装结果（简单版）
 * 用于安装/更新后的快速检查
 */
export function verifyInstallation(): VerificationResult {
  info('验证安装...');
  const commandsDir = COMMANDS_DIR;
  const result: VerificationResult = { success: true, errors: [] };

  // 检查关键命令文件
  const yishanPath = path.join(commandsDir, 'yishan.md');
  if (fs.existsSync(yishanPath)) {
    success('yishan.md 已安装');
  } else {
    warn('yishan.md 未找到');
    result.errors.push('yishan.md 未找到');
    result.success = false;
  }

  // 检查命令数量
  if (fs.existsSync(commandsDir)) {
    const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
    if (cmdFiles.length > 0) {
      success(`已安装 ${cmdFiles.length} 个命令`);
    } else {
      warn('未检测到任何命令文件');
      result.errors.push('未检测到命令文件');
      result.success = false;
    }
  } else {
    warn('commands 目录不存在');
    result.errors.push('commands 目录不存在');
    result.success = false;
  }

  // 检查 hooks 目录和关键 hook 文件
  const hooksDir = path.join(PLUGIN_DIR, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
    if (hookFiles.length > 0) {
      success(`已安装 ${hookFiles.length} 个 hooks`);
    } else {
      warn('hooks 目录为空');
      result.errors.push('hooks 目录为空');
      result.success = false;
    }

    // 检查关键 hook 文件
    for (const hook of CORE_HOOK_FILES) {
      const hookPath = path.join(hooksDir, hook);
      if (!fs.existsSync(hookPath)) {
        warn(`缺少关键 hook: ${hook}`);
        result.errors.push(`缺少关键 hook: ${hook}`);
        result.success = false;
      }
    }
  } else {
    warn('hooks 目录不存在');
    result.errors.push('hooks 目录不存在');
    result.success = false;
  }

  if (!result.success) {
    warn('安装可能不完整，请检查上述警告');
  }

  return VerificationResultSchema.parse(result);
}

// ==================== 完整验证 ====================

/**
 * 完整验证安装（详细版）
 * 用于 verify 命令的完整健康检查
 */
export function verify(): void {
  printCommandTitle('oh-my-claude 安装验证');

  const pluginDir = PLUGIN_DIR;
  let hasErrors = false;

  // 检查插件目录
  info('检查插件目录...');
  if (!fs.existsSync(pluginDir)) {
    error(`插件目录不存在: ${pluginDir}`);
    log('\n请运行 oh-my-claude install 安装插件\n');
    process.exit(1);
  }
  success(`插件目录存在: ${pluginDir}`);

  // 检查必需目录
  info('\n检查目录结构...');
  for (const dir of REQUIRED_DIRS) {
    const dirPath = path.join(pluginDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      success(`${dir}/ (${files.length} 个文件)`);
    } else {
      error(`缺少必需目录: ${dir}/`);
      hasErrors = true;
    }
  }

  // 检查可选目录
  for (const dir of OPTIONAL_DIRS) {
    const dirPath = path.join(pluginDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      success(`${dir}/ (${files.length} 个文件)`);
    } else {
      warn(`可选目录不存在: ${dir}/`);
    }
  }

  // 检查 plugin.json
  info('\n检查插件清单...');
  const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pluginJsonPath)) {
    try {
      const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
      success(`插件名称: ${pluginJson.name || 'N/A'}`);
      success(`插件版本: ${pluginJson.version || 'N/A'}`);
    } catch (e) {
      error(`plugin.json 解析失败: ${e instanceof Error ? e.message : 'Unknown error'}`);
      hasErrors = true;
    }
  } else {
    error('plugin.json 不存在');
    hasErrors = true;
  }

  // 检查关键 Agent 文件
  info('\n检查核心 Agent...');
  for (const agent of CORE_AGENT_FILES) {
    const agentPath = path.join(pluginDir, 'agents', agent);
    if (fs.existsSync(agentPath)) {
      success(`agents/${agent}`);
    } else {
      error(`缺少核心 Agent: ${agent}`);
      hasErrors = true;
    }
  }

  // 检查 Claude Code
  info('\n检查 Claude Code CLI...');
  if (checkClaudeCode()) {
    success('Claude Code CLI 可用');
  } else {
    error('Claude Code CLI 不可用');
    hasErrors = true;
  }

  // 总结
  log('');
  printDivider('cyan');
  if (hasErrors) {
    error('验证发现问题，请检查上述错误');
    log('\n修复建议: oh-my-claude uninstall && oh-my-claude install\n');
    process.exit(1);
  } else {
    success('所有检查通过!');
    log('\n插件已正确安装，可以正常使用\n');
  }
}
