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

/**
 * 查找包含 package.json 的目录（claude-pangu 包根目录）
 * 从给定路径向上遍历查找
 */
function findPackageRoot(startDir: string): string | null {
  let currentDir = startDir;
  for (let i = 0; i < 15; i++) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
        if (pkg.name === 'claude-pangu' || pkg.name === 'oh-my-claude') {
          // 还需要验证 agents 目录存在
          const agentsDir = path.join(currentDir, 'agents');
          if (fs.existsSync(agentsDir)) {
            return currentDir;
          }
        }
      } catch {
        // 继续查找
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // 到达根目录
    currentDir = parentDir;
  }
  return null;
}

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
 * 兼容 ESM、CommonJS 和 npx 环境
 */
export function getPackageDir(): string {
  // 验证路径是否为有效的 claude-pangu 包目录
  const isValidPackageDir = (dir: string): boolean => {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return false;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
      if (pkg.name !== 'claude-pangu' && pkg.name !== 'oh-my-claude') return false;
      // 还需要检查是否有 agents 目录（确保是完整的包）
      const agentsDir = path.join(dir, 'agents');
      return fs.existsSync(agentsDir);
    } catch {
      return false;
    }
  };

  // 方法 1: CommonJS __dirname (Jest 测试环境)
  if (typeof __dirname !== 'undefined' && __dirname) {
    const found = findPackageRoot(__dirname);
    if (found && isValidPackageDir(found)) return found;
  }
  
  // 方法 2: 从入口脚本路径查找 (npx/node 执行环境)
  // process.argv[1] 是执行的脚本路径，如 /path/to/node_modules/claude-pangu/dist/scripts/cli.js
  if (process.argv[1]) {
    const scriptDir = path.dirname(process.argv[1]);
    const found = findPackageRoot(scriptDir);
    if (found && isValidPackageDir(found)) return found;
  }
  
  // 方法 3: 从 process.cwd() 查找（开发环境）
  if (isValidPackageDir(process.cwd())) {
    return process.cwd();
  }
  
  // 方法 4: 检查全局 npm 安装路径
  const globalPaths = [
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'claude-pangu'),
    path.join(process.env.PREFIX || '/usr/local', 'lib', 'node_modules', 'claude-pangu'),
    '/usr/local/lib/node_modules/claude-pangu',
  ];
  
  for (const globalPath of globalPaths) {
    if (isValidPackageDir(globalPath)) {
      return globalPath;
    }
  }
  
  // 后备：返回当前工作目录（可能会失败，但至少会有清晰的错误信息）
  return process.cwd();
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

    // 输出非关键错误的详细信息（与 install 流程一致）
    if (stats.errors.length > 0) {
      warn('部分文件复制出现问题:');
      stats.errors.forEach(e => console.log(`  - ${e}`));
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
