#!/usr/bin/env node

/**
 * oh-my-claude CLI
 * 基于中国传统文化的 Claude Code 智能编排插件
 */

const { execSync, spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ==================== 常量配置 ====================

const VERSION = '1.0.2';
const PLUGIN_NAME = 'oh-my-claude';

// 路径配置
const ERROR_LOG_PATH = path.join(os.tmpdir(), 'oh-my-claude-error.log');

// 时间配置（毫秒）
const LOCK_TIMEOUT_MS = 30000;           // 锁等待超时：30秒
const LOCK_STALE_MS = 5 * 60 * 1000;     // 陈旧锁判定：5分钟
const LOCK_RETRY_INTERVAL_MS = 1000;     // 锁重试间隔：1秒

// 文件处理配置
const LARGE_FILE_THRESHOLD_BYTES = 1024 * 1024;  // 大文件阈值：1MB
const COPY_BUFFER_SIZE = 64 * 1024;              // 复制缓冲区：64KB

// UI 配置
const DIVIDER_LENGTH = 40;                       // 分隔线长度
const DIVIDER_LONG_LENGTH = 60;                  // 长分隔线长度

// GitHub 配置
const GITHUB_REPO = 'ZDragon17/oh-my-claude';
const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues`;

/**
 * 脱敏处理堆栈跟踪中的敏感路径信息
 * @param {string} stack - 原始堆栈跟踪
 * @returns {string} 脱敏后的堆栈跟踪
 */
function sanitizeStackTrace(stack) {
  if (!stack) return '';

  const home = os.homedir();
  const username = os.userInfo().username;

  // 替换用户主目录路径
  let sanitized = stack
    .replace(new RegExp(home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '~')
    .replace(new RegExp(username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '<user>');

  // 替换 Windows 风格的用户路径
  sanitized = sanitized.replace(/[A-Za-z]:\\Users\\[^\\]+\\/gi, '<user-home>\\');

  // 替换可能的环境变量值（如 API keys、tokens 等）
  // 匹配常见的敏感模式：长字符串（>20字符）的 hex/base64
  sanitized = sanitized.replace(/[a-f0-9]{32,}/gi, '<redacted-hex>');
  sanitized = sanitized.replace(/[A-Za-z0-9+/=]{40,}/g, '<redacted-token>');

  return sanitized;
}

// 记录错误到日志文件（带脱敏处理）
function logErrorToFile(err) {
  try {
    const timestamp = new Date().toISOString();
    const sanitizedStack = sanitizeStackTrace(err.stack);
    const sanitizedMessage = sanitizeStackTrace(err.message);

    const logEntry = `
[${timestamp}]
Version: ${VERSION}
Platform: ${os.platform()} ${os.release()}
Node: ${process.version}
Error: ${err.name}: ${sanitizedMessage}
Stack: ${sanitizedStack}
---
`;
    fs.appendFileSync(ERROR_LOG_PATH, logEntry, 'utf8');
    return true;
  } catch {
    return false;
  }
}

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.error('\x1b[31m❌ 发生未捕获的错误\x1b[0m');
  console.error('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.error(`\x1b[33m错误类型:\x1b[0m ${err.name}`);
  console.error(`\x1b[33m错误信息:\x1b[0m ${err.message}`);
  console.error(`\x1b[33m错误堆栈:\x1b[0m`);
  console.error(err.stack);

  // 记录到日志文件
  if (logErrorToFile(err)) {
    console.error(`\n\x1b[36m错误已记录到:\x1b[0m ${ERROR_LOG_PATH}`);
  }

  console.error('\n\x1b[33m这是一个程序缺陷，请报告到:\x1b[0m');
  console.error(`${GITHUB_ISSUES_URL}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\x1b[31m❌ 发生未处理的 Promise 拒绝:\x1b[0m');
  console.error(reason);
  if (reason instanceof Error) {
    logErrorToFile(reason);
  }
  process.exit(1);
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function success(msg) { log(`✅ ${msg}`, 'green'); }
function error(msg) { log(`❌ ${msg}`, 'red'); }
function info(msg) { log(`ℹ️  ${msg}`, 'blue'); }
function warn(msg) { log(`⚠️  ${msg}`, 'yellow'); }

// ==================== 进度反馈机制 ====================

/**
 * 进度显示器类
 * 用于在 CLI 中显示操作进度
 */
class ProgressIndicator {
  constructor(totalSteps, description = '处理中') {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.description = description;
    this.startTime = Date.now();
    this.isInteractive = process.stdout.isTTY;
  }

  /**
   * 更新进度
   * @param {string} stepDescription - 当前步骤描述
   */
  update(stepDescription = '') {
    this.currentStep++;
    const percent = Math.round((this.currentStep / this.totalSteps) * 100);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    if (this.isInteractive) {
      // 交互式终端：使用回车覆盖当前行
      const progressBar = this._createProgressBar(percent);
      process.stdout.write(`\r${colors.cyan}${progressBar} ${percent}%${colors.reset} ${stepDescription}`.padEnd(80));
    } else {
      // 非交互式终端：每次输出新行
      info(`[${this.currentStep}/${this.totalSteps}] ${stepDescription}`);
    }
  }

  /**
   * 创建进度条
   * @param {number} percent - 百分比
   * @returns {string} 进度条字符串
   */
  _createProgressBar(percent) {
    const total = 20;
    const filled = Math.round((percent / 100) * total);
    const empty = total - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * 完成进度
   * @param {string} message - 完成消息
   */
  complete(message = '完成') {
    if (this.isInteractive) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r'); // 清除进度行
    }
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    success(`${message} (耗时 ${elapsed}s)`);
  }

  /**
   * 失败时清理
   * @param {string} message - 失败消息
   */
  fail(message = '失败') {
    if (this.isInteractive) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r'); // 清除进度行
    }
    error(`${message}`);
  }
}

// ==================== 用户友好的错误信息 ====================

/**
 * 将系统错误码转换为用户友好的错误信息
 * @param {Error} err - 原始错误对象
 * @param {string} filePath - 相关文件路径
 * @returns {string} 用户友好的错误信息
 */
function getUserFriendlyError(err, filePath) {
  const errorMessages = {
    'ENOENT': `文件或目录不存在: ${filePath}\n  请检查路径是否正确`,
    'EACCES': `权限不足: ${filePath}\n  请尝试以管理员身份运行，或检查文件权限`,
    'EPERM': `操作被拒绝: ${filePath}\n  可能被其他程序占用，请关闭相关程序后重试`,
    'ENOSPC': `磁盘空间不足\n  请清理磁盘空间后重试`,
    'EBUSY': `资源正忙: ${filePath}\n  文件可能正在被其他程序使用`,
    'EMFILE': `打开文件过多\n  请关闭一些应用程序后重试`,
    'EEXIST': `文件已存在: ${filePath}\n  请先删除或重命名现有文件`,
    'EISDIR': `目标是目录而非文件: ${filePath}`,
    'ENOTDIR': `目标不是目录: ${filePath}`,
    'ENOTEMPTY': `目录不为空: ${filePath}\n  请先清空目录内容`,
  };

  const friendlyMessage = errorMessages[err.code];
  if (friendlyMessage) {
    return friendlyMessage;
  }

  // 默认错误信息
  return `${err.message}\n  如需帮助，请访问: ${GITHUB_ISSUES_URL}`;
}

// 安全的文件操作包装
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw new Error(getUserFriendlyError(err, filePath));
  }
}

function safeWriteFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err, filePath));
  }
}

function safeRemoveDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err, dirPath));
  }
}

function safeCopyFile(src, dest) {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err, `${src} -> ${dest}`));
  }
}

// 获取插件安装路径
function getPluginDir() {
  const home = os.homedir();
  return path.join(home, '.claude', 'plugins', PLUGIN_NAME);
}

// 获取当前包的路径
function getPackageDir() {
  return path.resolve(__dirname, '..');
}

// 检查 Claude Code 是否安装
function checkClaudeCode() {
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ==================== 公共函数 ====================

// 插件目录和文件配置
const PLUGIN_DIRS = ['agents', 'commands', 'hooks', 'skills', '.claude-plugin'];
const PLUGIN_FILES = ['README.md', 'README_EN.md', 'LICENSE'];

/**
 * 复制插件文件到目标目录（带进度显示）
 * @param {string} packageDir - 源目录
 * @param {string} pluginDir - 目标目录
 * @param {boolean} showProgress - 是否显示进度（默认 true）
 * @returns {Object} 复制结果统计
 */
function copyPluginFiles(packageDir, pluginDir, showProgress = true) {
  const stats = { dirs: 0, files: 0, errors: [] };

  // 计算总步骤数
  const totalSteps = PLUGIN_DIRS.length + PLUGIN_FILES.length;
  const progress = showProgress ? new ProgressIndicator(totalSteps, '复制文件') : null;

  // 复制目录
  for (const dir of PLUGIN_DIRS) {
    const src = path.join(packageDir, dir);
    const dest = path.join(pluginDir, dir);

    if (!fs.existsSync(src)) {
      stats.errors.push(`目录不存在: ${dir}`);
      if (progress) progress.update(`跳过 ${dir}/`);
      continue;
    }

    try {
      copyDir(src, dest);
      stats.dirs++;
      if (progress) progress.update(`${dir}/`);
    } catch (err) {
      stats.errors.push(`复制目录失败 ${dir}: ${err.message}`);
      if (progress) progress.update(`失败 ${dir}/`);
    }
  }

  // 复制文件
  for (const file of PLUGIN_FILES) {
    const src = path.join(packageDir, file);
    const dest = path.join(pluginDir, file);

    if (!fs.existsSync(src)) {
      if (progress) progress.update(`跳过 ${file}`);
      continue; // 文件可选，不记录错误
    }

    try {
      fs.copyFileSync(src, dest);
      stats.files++;
      if (progress) progress.update(file);
    } catch (err) {
      stats.errors.push(`复制文件失败 ${file}: ${err.message}`);
      if (progress) progress.update(`失败 ${file}`);
    }
  }

  if (progress) {
    const hasErrors = stats.errors.length > 0;
    if (hasErrors) {
      progress.fail('复制完成（有警告）');
    } else {
      progress.complete('文件复制完成');
    }
  }

  return stats;
}

/**
 * 设置 hook 脚本权限（Unix）
 * @param {string} pluginDir - 插件目录
 */
function setHookPermissions(pluginDir) {
  if (os.platform() === 'win32') {
    return; // Windows 不需要设置权限
  }

  const hooksDir = path.join(pluginDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    return;
  }

  const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
  for (const hookFile of hookFiles) {
    try {
      fs.chmodSync(path.join(hooksDir, hookFile), '755');
    } catch (err) {
      warn(`设置权限失败: ${hookFile}`);
    }
  }
}

/**
 * 注册插件到 Claude Code
 * @param {string} pluginDir - 插件目录
 * @returns {boolean} 是否成功
 */
function registerPlugin(pluginDir) {
  try {
    info('正在注册插件...');
    // 使用 spawnSync 避免命令注入风险
    const result = spawnSync('claude', ['plugins', 'install', pluginDir], {
      stdio: 'inherit',
      shell: false // 明确禁用 shell，防止命令注入
    });

    if (result.status === 0) {
      success('插件注册成功');
      return true;
    } else {
      throw new Error(`退出码: ${result.status}`);
    }
  } catch (e) {
    warn('自动注册失败，请手动运行:');
    warn(`  claude plugins install "${pluginDir}"`);
    return false;
  }
}

// ==================== 并发锁机制 ====================

/**
 * 获取锁文件路径
 * @param {string} pluginDir - 插件目录
 * @returns {string} 锁文件路径
 */
function getLockFilePath(pluginDir) {
  return `${pluginDir}.lock`;
}

/**
 * 尝试获取文件锁（防止并发操作）
 * @param {string} lockFile - 锁文件路径
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {boolean} 是否成功获取锁
 */
function acquireLock(lockFile, timeout = LOCK_TIMEOUT_MS) {
  const startTime = Date.now();
  const pid = process.pid;
  const lockContent = JSON.stringify({ pid, timestamp: Date.now() });

  while (Date.now() - startTime < timeout) {
    try {
      // 尝试以排他模式创建锁文件
      fs.writeFileSync(lockFile, lockContent, { flag: 'wx' });
      return true;
    } catch (err) {
      if (err.code === 'EEXIST') {
        // 锁文件已存在，检查是否过期
        try {
          const existingLock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
          const lockAge = Date.now() - existingLock.timestamp;

          // 如果锁超过阈值，认为是陈旧锁，强制删除
          if (lockAge > LOCK_STALE_MS) {
            warn('检测到陈旧锁文件，正在清理...');
            fs.unlinkSync(lockFile);
            continue;
          }

          // 如果是同一进程的锁，允许通过（可重入）
          if (existingLock.pid === pid) {
            return true;
          }

          // 其他进程持有锁，等待
          info(`另一个 oh-my-claude 进程 (PID: ${existingLock.pid}) 正在运行，等待中...`);
        } catch {
          // 读取锁文件失败，可能已被删除
          continue;
        }

        // 等待一小段时间后重试（同步阻塞）
        const waitTime = Math.min(LOCK_RETRY_INTERVAL_MS, timeout - (Date.now() - startTime));
        if (waitTime > 0) {
          // 使用简单的忙等待（由于是 CLI 工具，短暂阻塞可接受）
          const endWait = Date.now() + waitTime;
          while (Date.now() < endWait) {
            // 空循环等待
          }
        }
      } else {
        // 其他错误，直接失败
        return false;
      }
    }
  }

  error('获取锁超时，可能有其他 oh-my-claude 进程正在运行');
  return false;
}

/**
 * 释放文件锁
 * @param {string} lockFile - 锁文件路径
 */
function releaseLock(lockFile) {
  try {
    if (fs.existsSync(lockFile)) {
      // 验证是我们自己的锁
      const lockContent = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      if (lockContent.pid === process.pid) {
        fs.unlinkSync(lockFile);
      }
    }
  } catch {
    // 忽略释放锁时的错误
  }
}

// ==================== 带回滚保护的执行器 ====================

/**
 * 执行带备份/回滚保护的操作（带并发锁）
 * @param {string} pluginDir - 插件目录
 * @param {Function} operation - 要执行的操作函数，接收 (pluginDir, backupDir) 参数
 * @param {string} operationName - 操作名称（用于错误信息）
 * @returns {boolean} 操作是否成功
 */
function executeWithRollback(pluginDir, operation, operationName = '操作') {
  const backupDir = `${pluginDir}.backup-${Date.now()}`;
  const lockFile = getLockFilePath(pluginDir);

  // 步骤0: 获取锁
  if (!acquireLock(lockFile)) {
    return false;
  }

  try {
    // 步骤1: 备份现有安装
    if (fs.existsSync(pluginDir)) {
      info('备份现有安装...');
      fs.renameSync(pluginDir, backupDir);
    }

    // 步骤2: 创建目录结构
    const parentDir = path.dirname(pluginDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.mkdirSync(pluginDir, { recursive: true });

    // 步骤3: 执行操作
    operation(pluginDir, backupDir);

    // 步骤4: 成功后删除备份
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }

    return true;

  } catch (err) {
    // 回滚机制
    error(`${operationName}失败: ${err.message}`);

    // 清理失败的操作
    if (fs.existsSync(pluginDir)) {
      warn(`正在清理失败的${operationName}...`);
      fs.rmSync(pluginDir, { recursive: true, force: true });
    }

    // 恢复备份
    if (fs.existsSync(backupDir)) {
      info('正在恢复之前的安装...');
      fs.renameSync(backupDir, pluginDir);
      success('已恢复之前的安装');
    }

    return false;

  } finally {
    // 步骤5: 释放锁
    releaseLock(lockFile);
  }
}

// ==================== 安装函数 ====================

// 安装插件（带回滚机制）
function install() {
  log('\n🏔️  oh-my-claude 安装程序', 'cyan');
  log('━'.repeat(DIVIDER_LENGTH), 'cyan');

  // 检查 Claude Code
  if (!checkClaudeCode()) {
    error('未检测到 Claude Code CLI');
    info('请先安装 Claude Code: https://claude.ai/code');
    process.exit(1);
  }

  const packageDir = getPackageDir();
  const pluginDir = getPluginDir();

  // 使用公共的回滚保护执行器
  const installSuccess = executeWithRollback(pluginDir, (targetDir) => {
    // 复制插件文件
    info('正在安装插件文件...');
    const stats = copyPluginFiles(packageDir, targetDir);

    // 检查是否有关键错误
    const criticalErrors = stats.errors.filter(e => e.includes('.claude-plugin') || e.includes('agents'));
    if (criticalErrors.length > 0) {
      throw new Error(`关键目录复制失败: ${criticalErrors.join(', ')}`);
    }

    if (stats.errors.length > 0) {
      warn('部分文件复制出现问题:');
      stats.errors.forEach(e => console.log(`  - ${e}`));
    }

    // 设置权限
    setHookPermissions(targetDir);

    success(`插件文件安装完成 (${stats.dirs} 目录, ${stats.files} 文件)`);
    info(`安装位置: ${targetDir}`);
  }, '安装');

  if (!installSuccess) {
    process.exit(1);
  }

  // 注册插件
  registerPlugin(pluginDir);

  log('\n🎉 安装完成!', 'green');
  log('━'.repeat(DIVIDER_LENGTH), 'cyan');
  info('使用 /yishan 或 /愚公 开始愚公移山模式');
  info('使用 /zhuge 或 /诸葛 召唤诸葛顾问');
  info('查看所有命令: 阅读 README.md\n');
}

// 执行卸载操作
function performUninstall(pluginDir) {
  // 使用 Claude CLI 卸载（使用 spawnSync 避免命令注入）
  try {
    info('正在卸载插件...');
    spawnSync('claude', ['plugins', 'uninstall', PLUGIN_NAME], {
      stdio: 'inherit',
      shell: false
    });
  } catch {
    // 忽略错误，继续删除文件
  }

  // 删除文件
  fs.rmSync(pluginDir, { recursive: true, force: true });

  success('插件已卸载');
  log('');
}

// 卸载插件（带确认提示）
function uninstall() {
  log('\n🏔️  oh-my-claude 卸载程序', 'cyan');
  log('━'.repeat(DIVIDER_LENGTH), 'cyan');

  const pluginDir = getPluginDir();

  if (!fs.existsSync(pluginDir)) {
    warn('插件未安装');
    process.exit(0);
  }

  // 检查是否有 -y/--yes 参数跳过确认
  const skipConfirm = process.argv.includes('-y') || process.argv.includes('--yes');

  if (skipConfirm) {
    // 跳过确认，直接卸载
    performUninstall(pluginDir);
    return;
  }

  // 显示确认提示
  warn('即将卸载插件，所有配置将被删除');
  info(`插件位置: ${pluginDir}`);
  log('');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('确认卸载？(y/N): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      performUninstall(pluginDir);
    } else {
      info('已取消卸载');
      process.exit(0);
    }
  });
}

// 更新插件（使用公共函数，带回滚）
function update() {
  log('\n🏔️  oh-my-claude 更新程序', 'cyan');
  log('━'.repeat(DIVIDER_LENGTH), 'cyan');

  const pluginDir = getPluginDir();

  if (!fs.existsSync(pluginDir)) {
    warn('插件未安装，将执行全新安装');
    install();
    return;
  }

  info('正在检查更新...');

  // 获取当前安装的版本
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

  // 使用公共的回滚保护执行器
  const updateSuccess = executeWithRollback(pluginDir, (targetDir) => {
    // 复制新文件
    info('正在更新插件文件...');
    const stats = copyPluginFiles(packageDir, targetDir);

    // 检查关键错误
    const criticalErrors = stats.errors.filter(e => e.includes('.claude-plugin') || e.includes('agents'));
    if (criticalErrors.length > 0) {
      throw new Error(`关键目录复制失败: ${criticalErrors.join(', ')}`);
    }

    // 设置权限
    setHookPermissions(targetDir);

    success(`已更新到版本 ${VERSION}`);
  }, '更新');

  if (!updateSuccess) {
    process.exit(1);
  }

  log('');
}

// 验证安装
function verify() {
  log('\n🏔️  oh-my-claude 安装验证', 'cyan');
  log('━'.repeat(DIVIDER_LENGTH), 'cyan');

  const pluginDir = getPluginDir();
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
  const requiredDirs = ['agents', 'commands', 'skills', '.claude-plugin'];
  const optionalDirs = ['hooks'];

  info('\n检查目录结构...');
  for (const dir of requiredDirs) {
    const dirPath = path.join(pluginDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      success(`${dir}/ (${files.length} 个文件)`);
    } else {
      error(`缺少必需目录: ${dir}/`);
      hasErrors = true;
    }
  }

  for (const dir of optionalDirs) {
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
      error(`plugin.json 解析失败: ${e.message}`);
      hasErrors = true;
    }
  } else {
    error('plugin.json 不存在');
    hasErrors = true;
  }

  // 检查关键 Agent 文件
  info('\n检查核心 Agent...');
  const coreAgents = ['yugong.md', 'zhuge.md', 'baozheng.md'];
  for (const agent of coreAgents) {
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
  log('\n' + '━'.repeat(DIVIDER_LENGTH), 'cyan');
  if (hasErrors) {
    error('验证发现问题，请检查上述错误');
    log('\n修复建议: oh-my-claude uninstall && oh-my-claude install\n');
    process.exit(1);
  } else {
    success('所有检查通过!');
    log('\n插件已正确安装，可以正常使用\n');
  }
}

// 显示版本
function showVersion() {
  log(`oh-my-claude v${VERSION}`);
}

// 显示帮助
function showHelp() {
  log('\n🏔️  oh-my-claude - 基于中国传统文化的 Claude Code 智能编排插件', 'cyan');
  log('━'.repeat(DIVIDER_LONG_LENGTH), 'cyan');
  log('\n用法: oh-my-claude <command>\n');
  log('命令:', 'yellow');
  log('  install     安装插件到 Claude Code');
  log('  uninstall   卸载插件');
  log('  update      更新插件到最新版本');
  log('  verify      验证安装是否正确');
  log('  version     显示版本号');
  log('  help        显示帮助信息');
  log('\n示例:', 'yellow');
  log('  npx oh-my-claude install');
  log('  oh-my-claude update');
  log('  oh-my-claude verify');
  log(`\n更多信息: https://github.com/${GITHUB_REPO}\n`);
}


/**
 * 使用流式方式复制大文件
 * @param {string} src - 源文件路径
 * @param {string} dest - 目标文件路径
 * @returns {Promise<void>}
 */
function copyFileStream(src, dest) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    readStream.pipe(writeStream);
  });
}

/**
 * 智能复制文件（小文件同步，大文件流式）
 * @param {string} src - 源文件路径
 * @param {string} dest - 目标文件路径
 */
function smartCopyFile(src, dest) {
  const stats = fs.statSync(src);

  if (stats.size > LARGE_FILE_THRESHOLD_BYTES) {
    // 大文件使用流式复制（但为了保持同步接口，使用同步方式等待）
    // 在 CLI 工具中，大文件较少，这种处理方式可接受
    const buffer = Buffer.alloc(COPY_BUFFER_SIZE);
    const fdSrc = fs.openSync(src, 'r');
    const fdDest = fs.openSync(dest, 'w');

    try {
      let bytesRead;
      while ((bytesRead = fs.readSync(fdSrc, buffer)) > 0) {
        fs.writeSync(fdDest, buffer, 0, bytesRead);
      }
    } finally {
      fs.closeSync(fdSrc);
      fs.closeSync(fdDest);
    }

    // 保留文件时间戳
    fs.utimesSync(dest, stats.atime, stats.mtime);
  } else {
    // 小文件直接同步复制
    fs.copyFileSync(src, dest);
  }
}

/**
 * 复制目录（支持大文件流式处理和空目录处理）
 * @param {string} src - 源目录
 * @param {string} dest - 目标目录
 * @param {Object} options - 选项
 * @param {boolean} options.preserveEmpty - 是否保留空目录（默认 true）
 * @returns {Object} 复制统计信息
 */
function copyDir(src, dest, options = {}) {
  const { preserveEmpty = true } = options;
  const stats = { files: 0, dirs: 0, emptyDirs: 0 };

  fs.mkdirSync(dest, { recursive: true });
  stats.dirs++;

  const entries = fs.readdirSync(src, { withFileTypes: true });

  // 检查是否为空目录
  if (entries.length === 0) {
    stats.emptyDirs++;
    if (!preserveEmpty) {
      // 如果不保留空目录，删除刚创建的目录
      fs.rmdirSync(dest);
      stats.dirs--;
    }
    return stats;
  }

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      const subStats = copyDir(srcPath, destPath, options);
      stats.files += subStats.files;
      stats.dirs += subStats.dirs;
      stats.emptyDirs += subStats.emptyDirs;
    } else {
      smartCopyFile(srcPath, destPath);
      stats.files++;
    }
  }

  return stats;
}

// 主程序
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'install':
  case 'i':
    install();
    break;
  case 'uninstall':
  case 'remove':
  case 'rm':
    uninstall();
    break;
  case 'update':
  case 'upgrade':
  case 'up':
    update();
    break;
  case 'verify':
  case 'check':
  case 'doctor':
    verify();
    break;
  case 'version':
  case '-v':
  case '--version':
    showVersion();
    break;
  case 'help':
  case '-h':
  case '--help':
    showHelp();
    break;
  default:
    error(`未知命令: ${command}`);
    showHelp();
    process.exit(1);
}
