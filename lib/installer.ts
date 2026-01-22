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
 * 从插件包中获取实际的命令文件列表
 * 动态扫描，避免硬编码
 */
function getCommandFilesFromPackage(packageDir: string): string[] {
  const commandsSrc = path.join(packageDir, 'commands');
  if (!fs.existsSync(commandsSrc)) {
    return [];
  }
  return fs.readdirSync(commandsSrc).filter(f => f.endsWith('.md'));
}

/**
 * 从插件包中获取实际的 skill 目录列表
 * 动态扫描，避免硬编码
 */
function getSkillDirsFromPackage(packageDir: string): string[] {
  const skillsSrc = path.join(packageDir, 'skills');
  if (!fs.existsSync(skillsSrc)) {
    return [];
  }
  return fs.readdirSync(skillsSrc, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

/**
 * 备用：硬编码的命令文件列表（当无法访问包目录时使用）
 * 包含当前版本和历史版本的所有命令文件
 */
function getFallbackCommandFiles(): string[] {
  return [
    // 当前版本命令
    'baozheng.md', 'bianque.md', 'cangjie.md', 'change.md', 'gukaizhi.md',
    'laozi.md', 'libai.md', 'libing.md', 'luban.md', 'mozi.md',
    'progress.md', 'simaqian.md', 'sunzi.md', 'weizheng.md', 'wukong.md',
    'zhangheng.md', 'zhenghe.md', 'zhuge.md', 'team.md', 'yishan.md',
    'yugong.md', 'ulw.md', 'ultrawork.md', 'persist.md', 'git.md',
    'ralph-loop.md', 'cancel-ralph.md', 'init-deep.md', 'start-work.md',
    'refactor.md', 'lilou.md', 'liubowen.md', 'start.md', 'status.md',
    'skip.md', 'rollback.md', 'cancel-yishan.md', 'interrupt.md',
    'retry.md', 'pause.md', 'yishan-resume.md', 'help.md',
    // 历史版本命令（已重命名/移除）
    'huitu.md',   // 已重命名为 lilou.md
    'xuanwu.md',  // 已重命名为 liubowen.md
  ];
}

/**
 * 备用：硬编码的 skill 目录列表（当无法访问包目录时使用）
 */
function getFallbackSkillDirs(): string[] {
  return [
    'agent-handoff', 'bilingual', 'error-guide', 'git-master',
    'help', 'onboarding', 'playwright', 'progress', 'yishan'
  ];
}

/**
 * 全局扫描并清理所有项目中的旧版 .claude/commands/zcf 目录
 * 扫描常见的项目目录位置
 */
function scanAndCleanLegacyZcfDirs(): number {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  if (!homeDir) {
    return 0;
  }

  // 常见的项目目录位置
  const projectRoots: string[] = [
    homeDir,
    path.join(homeDir, 'projects'),
    path.join(homeDir, 'Projects'),
    path.join(homeDir, 'dev'),
    path.join(homeDir, 'Dev'),
    path.join(homeDir, 'workspace'),
    path.join(homeDir, 'Workspace'),
    path.join(homeDir, 'code'),
    path.join(homeDir, 'Code'),
    path.join(homeDir, 'src'),
    path.join(homeDir, 'repos'),
    path.join(homeDir, 'git'),
    path.join(homeDir, 'GitHub'),
    path.join(homeDir, 'Documents', 'projects'),
    path.join(homeDir, 'Documents', 'Projects'),
    path.join(homeDir, 'Documents', 'dev'),
    path.join(homeDir, 'Documents', 'GitHub'),
    // Windows 特有路径
    path.join(homeDir, 'source', 'repos'),
    // Linux/macOS 常见路径
    '/var/www',
    '/opt/projects',
  ];

  // Windows 盘符根目录下的常见项目目录
  if (process.platform === 'win32') {
    const drives = ['C:', 'D:', 'E:', 'F:'];
    for (const drive of drives) {
      projectRoots.push(
        path.join(drive, 'projects'),
        path.join(drive, 'Projects'),
        path.join(drive, 'dev'),
        path.join(drive, 'workspace'),
        path.join(drive, 'code')
      );
    }
  }

  const foundZcfDirs: string[] = [];
  const visited = new Set<string>();

  // 递归扫描目录，查找 .claude/commands/zcf
  const scanDir = (dir: string, depth: number): void => {
    // 限制扫描深度，避免性能问题
    if (depth > 4) return;

    // 避免重复扫描
    const normalizedDir = path.normalize(dir).toLowerCase();
    if (visited.has(normalizedDir)) return;
    visited.add(normalizedDir);

    try {
      // 检查当前目录是否有 .claude/commands/zcf
      const zcfPath = path.join(dir, '.claude', 'commands', 'zcf');
      if (fs.existsSync(zcfPath) && fs.statSync(zcfPath).isDirectory()) {
        foundZcfDirs.push(zcfPath);
      }

      // 继续扫描子目录
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // 跳过隐藏目录和 node_modules 等
        const name = entry.name;
        if (name.startsWith('.') && name !== '.claude') continue;
        if (name === 'node_modules') continue;
        if (name === '__pycache__') continue;
        if (name === 'vendor') continue;
        if (name === 'dist') continue;
        if (name === 'build') continue;
        if (name === 'target') continue;
        if (name === '.git') continue;

        const subDir = path.join(dir, name);
        scanDir(subDir, depth + 1);
      }
    } catch {
      // 忽略权限错误等
    }
  };

  // 扫描所有项目根目录
  for (const root of projectRoots) {
    if (fs.existsSync(root)) {
      scanDir(root, 0);
    }
  }

  // 清理找到的所有 zcf 目录
  let cleaned = 0;
  for (const zcfDir of foundZcfDirs) {
    try {
      fs.rmSync(zcfDir, { recursive: true, force: true });
      cleaned++;
      info(`已清理: ${zcfDir}`);
    } catch {
      warn(`清理失败: ${zcfDir}`);
    }
  }

  return cleaned;
}

/**
 * 执行卸载操作 - 完整清理所有安装的文件
 */
export function performUninstall(pluginDir: string): void {
  info('正在卸载插件...');

  // 获取包目录（尝试动态扫描，失败则用备用列表）
  let packageDir: string | null = null;
  try {
    packageDir = getPackageDir();
  } catch {
    // 忽略
  }

  // 1. 尝试使用 claude CLI 卸载（可能失败，忽略）
  try {
    execSync(`claude plugins uninstall ${PLUGIN_NAME}`, { stdio: 'pipe' });
  } catch {
    // 忽略错误 - CLI 可能不存在或插件未通过 CLI 安装
  }

  // 2. 删除插件主目录
  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    info('已删除插件目录');
  }

  // 3. 清理 commands 目录中本插件安装的文件
  const commandsDir = getCommandsDir();
  const commandFiles = packageDir
    ? getCommandFilesFromPackage(packageDir)
    : getFallbackCommandFiles();
  let commandsRemoved = 0;

  for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        commandsRemoved++;
      } catch {
        // 忽略单个文件删除错误
      }
    }
  }

  // 清理旧版本的 zcf 子目录（v1.0.8 及之前）
  const legacyZcfDir = path.join(commandsDir, 'zcf');
  if (fs.existsSync(legacyZcfDir)) {
    fs.rmSync(legacyZcfDir, { recursive: true, force: true });
    info('已清理旧版本 zcf 子目录');
  }

  if (commandsRemoved > 0) {
    info(`已删除 ${commandsRemoved} 个命令文件`);
  }

  // 4. 清理 skills 目录中本插件安装的目录
  const skillsDir = getSkillsDir();
  const skillDirs = packageDir
    ? getSkillDirsFromPackage(packageDir)
    : getFallbackSkillDirs();
  let skillsRemoved = 0;

  for (const dir of skillDirs) {
    const dirPath = path.join(skillsDir, dir);
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        skillsRemoved++;
      } catch {
        // 忽略单个目录删除错误
      }
    }
  }

  if (skillsRemoved > 0) {
    info(`已删除 ${skillsRemoved} 个 skill 目录`);
  }

  // 5. 全局扫描并清理所有项目中的旧版 zcf 目录
  info('正在全局扫描旧版 zcf 目录...');
  const globalZcfCleaned = scanAndCleanLegacyZcfDirs();
  if (globalZcfCleaned > 0) {
    info(`已全局清理 ${globalZcfCleaned} 个旧版 zcf 目录`);
  }

  // 6. 清理本地状态文件
  const stateFilesInCwd = [
    '.claude/ralph-loop.local.md',
    '.claude/yishan-state.json',
    '.claude/checkpoint.json'
  ];

  for (const file of stateFilesInCwd) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // 忽略
      }
    }
  }

  // 7. 清理全局状态目录
  const globalStateDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.oh-my-claude');
  if (fs.existsSync(globalStateDir)) {
    // 只清理日志，保留用户可能的自定义配置
    const logsDir = path.join(globalStateDir, 'logs');
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true });
    }
  }

  success('插件已完全卸载');
  log('');
  info('清理内容:');
  info(`  • 插件目录: ${pluginDir}`);
  info(`  • 命令文件: ${commandsRemoved} 个`);
  info(`  • Skill 目录: ${skillsRemoved} 个`);
  info(`  • 全局旧版 zcf: ${globalZcfCleaned} 个目录`);
  info(`  • 状态文件: 已清理`);
  log('');
  info('如需重新安装，请运行: npx claude-pangu install');
  log('');
}

/**
 * 卸载插件（带确认提示）
 */
export async function uninstall(): Promise<void> {
  printCommandTitle('oh-my-claude 卸载程序');

  const pluginDir = getPluginDir();
  const commandsDir = getCommandsDir();
  const skillsDir = getSkillsDir();

  // 检查是否有任何残留（插件目录、commands 或 skills）
  const hasPluginDir = fs.existsSync(pluginDir);
  const hasCommands = fs.existsSync(commandsDir) &&
    getFallbackCommandFiles().some(f => fs.existsSync(path.join(commandsDir, f)));
  const hasSkills = fs.existsSync(skillsDir) &&
    getFallbackSkillDirs().some(d => fs.existsSync(path.join(skillsDir, d)));

  if (!hasPluginDir && !hasCommands && !hasSkills) {
    warn('插件未安装（无残留文件）');
    process.exit(0);
  }

  // 即使插件目录不存在，也可能有残留的 commands/skills 需要清理
  if (!hasPluginDir) {
    info('检测到残留的命令/技能文件，将进行清理');
  }

  const skipConfirm = process.argv.includes('-y') || process.argv.includes('--yes');
  if (skipConfirm) {
    performUninstall(pluginDir);
    return;
  }

  warn('即将卸载插件，所有配置将被删除');
  if (hasPluginDir) {
    info(`插件位置: ${pluginDir}`);
  }
  if (hasCommands) {
    info(`Commands 位置: ${commandsDir}`);
  }
  if (hasSkills) {
    info(`Skills 位置: ${skillsDir}`);
  }
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
