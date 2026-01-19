/**
 * 安装器模块
 * 负责插件的安装、卸载、更新主流程
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { VERSION, PLUGIN_NAME, PLUGIN_DIR } from './constants.js';
import { copyPluginFiles, setHookPermissions } from './file-operations.js';
import { executeWithRollback } from './lock-manager.js';
import { installCommands, installSkills, registerCoreAgents, getCommandsDir, getSkillsDir } from './plugin-installer.js';
import { success, info, warn, error, log } from '../scripts/logger.js';
import { printCommandTitle, printInstallComplete, printUpdateComplete } from './ui/messages.js';

// 重新导出供 cli.ts 使用
export { getCommandsDir, getSkillsDir };

// ==================== 路径获取函数 ====================

/**
 * 获取插件安装路径
 */
export function getPluginDir(): string {
  return PLUGIN_DIR;
}

/**
 * 获取当前包的路径
 */
export function getPackageDir(): string {
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  const normalizedDir = process.platform === 'win32'
    ? currentDir.replace(/^\/([A-Za-z]:)/, '$1')
    : currentDir;
  return path.resolve(normalizedDir, '..', '..');
}

/**
 * 检查 Claude Code 是否安装
 */
export function checkClaudeCode(): boolean {
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ==================== 安装流程 ====================

/**
 * 安装插件（带回滚机制）
 */
export async function install(): Promise<void> {
  printCommandTitle('oh-my-claude 安装程序');

  if (!checkClaudeCode()) {
    error('未检测到 Claude Code CLI');
    info('请先安装 Claude Code: https://claude.ai/code');
    process.exit(1);
  }

  const packageDir = getPackageDir();
  const pluginDir = getPluginDir();

  const installSuccess = executeWithRollback(pluginDir, (targetDir) => {
    info('正在安装插件文件...');
    const stats = copyPluginFiles(packageDir, targetDir);

    const criticalErrors = stats.errors.filter(e => e.includes('.claude-plugin') || e.includes('agents'));
    if (criticalErrors.length > 0) {
      throw new Error(`关键目录复制失败: ${criticalErrors.join(', ')}`);
    }

    if (stats.errors.length > 0) {
      warn('部分文件复制出现问题:');
      stats.errors.forEach(e => console.log(`  - ${e}`));
    }

    setHookPermissions(targetDir);
    success(`插件文件安装完成 (${stats.dirs} 目录, ${stats.files} 文件)`);
    info(`安装位置: ${targetDir}`);
  }, '安装');

  if (!installSuccess) {
    process.exit(1);
  }

  installCommands(packageDir);
  installSkills(packageDir);
  registerCoreAgents();

  const { verifyInstallation } = await import('./verifier.js');
  verifyInstallation();

  printInstallComplete(pluginDir, getCommandsDir(), getSkillsDir());
}

// ==================== 卸载流程 ====================

/**
 * 执行卸载操作
 */
export function performUninstall(pluginDir: string): void {
  try {
    info('正在卸载插件...');
    execSync(`claude plugins uninstall ${PLUGIN_NAME}`, { stdio: 'inherit' });
  } catch {
    // 忽略错误
  }

  fs.rmSync(pluginDir, { recursive: true, force: true });
  success('插件已卸载');
  log('');
}

/**
 * 卸载插件（带确认提示）
 */
export async function uninstall(): Promise<void> {
  printCommandTitle('oh-my-claude 卸载程序');

  const pluginDir = getPluginDir();

  if (!fs.existsSync(pluginDir)) {
    warn('插件未安装');
    process.exit(0);
  }

  const skipConfirm = process.argv.includes('-y') || process.argv.includes('--yes');
  if (skipConfirm) {
    performUninstall(pluginDir);
    return;
  }

  warn('即将卸载插件，所有配置将被删除');
  info(`插件位置: ${pluginDir}`);
  log('');

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('确认卸载？(y/N): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        performUninstall(pluginDir);
      } else {
        info('已取消卸载');
      }
      resolve();
    });
  });
}

// ==================== 更新流程 ====================

/**
 * 更新插件（使用公共函数，带回滚）
 */
export async function update(): Promise<void> {
  printCommandTitle('oh-my-claude 更新程序');

  const pluginDir = getPluginDir();

  if (!fs.existsSync(pluginDir)) {
    warn('插件未安装，将执行全新安装');
    await install();
    return;
  }

  info('正在检查更新...');

  const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  let installedVersion = 'unknown';
  if (fs.existsSync(pluginJsonPath)) {
    try {
      const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
      installedVersion = pluginJson.version || 'unknown';
    } catch {
      // 忽略解析错误
    }
  }

  info(`当前安装版本: ${installedVersion}`);
  info(`包版本: ${VERSION}`);

  if (installedVersion === VERSION) {
    success('已是最新版本');
    return;
  }

  const packageDir = getPackageDir();

  const updateSuccess = executeWithRollback(pluginDir, (targetDir) => {
    info('正在更新插件文件...');
    const stats = copyPluginFiles(packageDir, targetDir);

    const criticalErrors = stats.errors.filter(e => e.includes('.claude-plugin') || e.includes('agents'));
    if (criticalErrors.length > 0) {
      throw new Error(`关键目录复制失败: ${criticalErrors.join(', ')}`);
    }

    setHookPermissions(targetDir);
    success(`已更新到版本 ${VERSION}`);
  }, '更新');

  if (!updateSuccess) {
    process.exit(1);
  }

  installCommands(packageDir);
  installSkills(packageDir);

  const { verifyInstallation } = await import('./verifier.js');
  verifyInstallation();

  printUpdateComplete();
}
