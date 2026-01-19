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
 * 获取当前模块所在目录
 * 兼容 ESM 和 CommonJS 环境
 */
function getCurrentDir(): string {
  // CommonJS 环境 (Jest, Node CJS)
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  
  // ESM 环境 - 动态导入 url 模块
  try {
    // 使用 eval 避免 TypeScript 在 CommonJS 模式下报错
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const getMetaUrl = new Function('return import.meta.url');
    const metaUrl = getMetaUrl() as string;
    const { fileURLToPath } = require('url') as { fileURLToPath: (url: string) => string };
    return path.dirname(fileURLToPath(metaUrl));
  } catch {
    // 后备：返回 process.cwd()
    return process.cwd();
  }
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

  const currentDir = getCurrentDir();
  
  // 方法 1: 从当前模块目录向上查找
  // 可能的目录结构:
  // - lib/installer.ts -> 根目录 (开发环境, ts-node)
  // - dist/lib/installer.js -> 根目录 (编译后)
  // - node_modules/.pnpm/claude-pangu@x.x.x/node_modules/claude-pangu/dist/lib/installer.js
  // - AppData/Local/npm-cache/_npx/.../node_modules/claude-pangu/dist/lib/installer.js
  const candidatePaths = [
    path.resolve(currentDir, '..'),           // lib/ -> 根目录
    path.resolve(currentDir, '..', '..'),     // dist/lib/ -> 根目录
    path.resolve(currentDir, '..', '..', '..'), // 深层嵌套情况
  ];
  
  for (const candidate of candidatePaths) {
    if (isValidPackageDir(candidate)) {
      return candidate;
    }
  }
  
  // 向上遍历查找
  let searchDir = currentDir;
  for (let i = 0; i < 10; i++) {
    if (isValidPackageDir(searchDir)) {
      return searchDir;
    }
    const parentDir = path.dirname(searchDir);
    if (parentDir === searchDir) break; // 到达根目录
    searchDir = parentDir;
  }
  
  // 方法 2: 从 process.cwd() 查找（开发环境）
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
