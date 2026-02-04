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

const VERSION = '1.0.9';
const PLUGIN_NAME = 'oh-my-claude';

// 路径配置 - 使用用户主目录下的持久化日志目录
const LOG_DIR = path.join(os.homedir(), '.oh-my-claude', 'logs');
const ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');

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
    // 确保日志目录存在
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

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

// 颜色输出 - 使用共享模块
const { colors, log, success, error, info, warn } = require('./logger');

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

// 获取 commands 安装路径
// 注意：直接安装到 commands 根目录，不使用子目录
// 因为 Claude Code 的子目录命名空间功能存在 Bug (Issue #2422)
// macOS 原生客户端不支持 /prefix:namespace:command 格式
function getCommandsDir() {
  const home = os.homedir();
  return path.join(home, '.claude', 'commands');
}

// 获取 skills 安装路径
function getSkillsDir() {
  const home = os.homedir();
  return path.join(home, '.claude', 'skills');
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
 * 设置 hook 脚本权限（Unix）- 递归处理所有子目录
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

  // 递归设置权限
  function setPermissionsRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        setPermissionsRecursive(fullPath);
      } else if (entry.name.endsWith('.sh')) {
        try {
          fs.chmodSync(fullPath, '755');
        } catch (err) {
          warn(`设置权限失败: ${entry.name}`);
        }
      }
    }
  }

  setPermissionsRecursive(hooksDir);
}

/**
 * 安装 slash commands 到 ~/.claude/commands/
 * @param {string} packageDir - 源目录
 * @returns {Object} 安装结果
 */
function installCommands(packageDir) {
  const commandsDir = getCommandsDir();
  const commandsSrc = path.join(packageDir, 'commands');
  const stats = { count: 0, errors: [], cleaned: false };

  info('正在安装 slash commands...');

  // 清理旧版本的 zcf 子目录（1.0.8 及之前版本使用 /zcf:* 命令格式）
  const legacyZcfDir = path.join(commandsDir, 'zcf');
  if (fs.existsSync(legacyZcfDir)) {
    try {
      fs.rmSync(legacyZcfDir, { recursive: true, force: true });
      stats.cleaned = true;
      info('已清理全局 zcf 子目录');
    } catch (err) {
      warn(`清理旧版本目录失败: ${err.message}`);
    }
  }

  // 清理当前工作目录的项目本地 zcf 残留（如果存在）
  const cwd = process.cwd();
  const projectZcfDir = path.join(cwd, '.claude', 'commands', 'zcf');
  if (fs.existsSync(projectZcfDir)) {
    try {
      fs.rmSync(projectZcfDir, { recursive: true, force: true });
      stats.cleaned = true;
      info('已清理项目本地 zcf 子目录');
    } catch (err) {
      warn(`清理项目本地旧版本目录失败: ${err.message}`);
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
        stats.errors.push(`复制 ${file} 失败: ${err.message}`);
      }
    }
  }

  if (stats.count > 0) {
    success(`Slash commands 安装完成 (${stats.count} 个命令)`);
    info(`Commands 位置: ${commandsDir}`);
    if (stats.cleaned) {
      warn('⚠️  命令格式已更改：请使用 /yishan 而非 /zcf:yishan');
    }
  } else {
    warn('未找到任何命令文件');
  }

  return stats;
}

/**
 * 安装 skills 到 ~/.claude/skills/
 * @param {string} packageDir - 源目录
 * @returns {Object} 安装结果
 */
function installSkills(packageDir) {
  const skillsDir = getSkillsDir();
  const skillsSrc = path.join(packageDir, 'skills');
  const stats = { count: 0, errors: [] };

  info('正在安装 skills...');

  if (fs.existsSync(skillsSrc)) {
    const skillDirs = fs.readdirSync(skillsSrc, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const skillDir of skillDirs) {
      const skillName = skillDir.name;
      const skillSrcDir = path.join(skillsSrc, skillName);
      const skillDestDir = path.join(skillsDir, skillName);

      try {
        // 创建 skill 目录
        if (!fs.existsSync(skillDestDir)) {
          fs.mkdirSync(skillDestDir, { recursive: true });
        }

        // 复制 SKILL.md (如果存在)
        const skillMdSrc = path.join(skillSrcDir, 'SKILL.md');
        if (fs.existsSync(skillMdSrc)) {
          fs.copyFileSync(skillMdSrc, path.join(skillDestDir, 'SKILL.md'));
        }

        // 复制其他支持文件（排除 skill.json）
        const files = fs.readdirSync(skillSrcDir, { withFileTypes: true })
          .filter(f => f.isFile() && f.name !== 'skill.json');

        for (const file of files) {
          try {
            fs.copyFileSync(
              path.join(skillSrcDir, file.name),
              path.join(skillDestDir, file.name)
            );
          } catch {
            // 忽略非关键文件的复制错误
          }
        }

        stats.count++;
      } catch (err) {
        stats.errors.push(`安装 skill ${skillName} 失败: ${err.message}`);
      }
    }
  }

  if (stats.count > 0) {
    success(`Skills 安装完成 (${stats.count} 个 skill)`);
    info(`Skills 位置: ${skillsDir}`);
  }

  return stats;
}

/**
 * 验证安装结果
 * @returns {Object} 验证结果
 */
function verifyInstallation() {
  info('验证安装...');
  const commandsDir = getCommandsDir();
  const pluginDir = getPluginDir();
  const result = { success: true, errors: [] };

  // 检查关键命令文件
  const yishanPath = path.join(commandsDir, 'yishan.md');
  if (fs.existsSync(yishanPath)) {
    success('✓ yishan.md 已安装');
  } else {
    warn('✗ yishan.md 未找到');
    result.errors.push('yishan.md 未找到');
    result.success = false;
  }

  // 检查命令数量
  if (fs.existsSync(commandsDir)) {
    const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
    if (cmdFiles.length > 0) {
      success(`✓ 已安装 ${cmdFiles.length} 个命令`);
    } else {
      warn('✗ 未检测到任何命令文件');
      result.errors.push('未检测到命令文件');
      result.success = false;
    }
  } else {
    warn('✗ commands 目录不存在');
    result.errors.push('commands 目录不存在');
    result.success = false;
  }

  // 检查 hooks 目录和关键 hook 文件
  const hooksDir = path.join(pluginDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
    if (hookFiles.length > 0) {
      success(`✓ 已安装 ${hookFiles.length} 个 hooks`);
    } else {
      warn('✗ hooks 目录为空');
      result.errors.push('hooks 目录为空');
      result.success = false;
    }

    // 检查关键 hook 文件
    const criticalHooks = ['todo-continuation.sh', 'ralph-loop.sh', 'keyword-detector.sh', 'hooks.json'];
    for (const hook of criticalHooks) {
      const hookPath = path.join(hooksDir, hook);
      if (!fs.existsSync(hookPath)) {
        warn(`✗ 缺少关键 hook: ${hook}`);
        result.errors.push(`缺少关键 hook: ${hook}`);
        result.success = false;
      }
    }
  } else {
    warn('✗ hooks 目录不存在');
    result.errors.push('hooks 目录不存在');
    result.success = false;
  }

  if (!result.success) {
    warn('安装可能不完整，请检查上述警告');
    warn('建议重新安装: npx claude-pangu@latest install');
  }

  return result;
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
          const lockData = fs.readFileSync(lockFile, 'utf8');
          let existingLock;

          try {
            existingLock = JSON.parse(lockData);
          } catch (parseErr) {
            // JSON 解析失败，锁文件可能已损坏，清理后重试
            warn('锁文件格式损坏，正在清理...');
            fs.unlinkSync(lockFile);
            continue;
          }

          // 验证锁内容的有效性
          if (!existingLock || typeof existingLock.timestamp !== 'number') {
            warn('锁文件内容无效，正在清理...');
            fs.unlinkSync(lockFile);
            continue;
          }

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
        } catch (readErr) {
          // 读取锁文件失败，可能已被删除或权限问题
          if (readErr.code === 'ENOENT') {
            // 文件已被删除，直接重试
            continue;
          }
          // 其他读取错误，记录后继续
          continue;
        }

        // 使用 spawnSync 实现非阻塞等待，避免 CPU 空转
        const waitTime = Math.min(LOCK_RETRY_INTERVAL_MS, timeout - (Date.now() - startTime));
        if (waitTime > 0) {
          // 使用系统 sleep 命令等待，避免忙等待占用 CPU
          try {
            if (process.platform === 'win32') {
              // Windows: 使用 ping localhost 实现延时
              spawnSync('ping', ['-n', '2', '127.0.0.1'], { stdio: 'ignore', timeout: waitTime + 1000 });
            } else {
              // Unix: 使用 sleep 命令
              spawnSync('sleep', [(waitTime / 1000).toFixed(1)], { stdio: 'ignore', timeout: waitTime + 1000 });
            }
          } catch {
            // 如果 sleep 失败，使用短暂的忙等待作为后备
            const endWait = Date.now() + Math.min(waitTime, 100);
            while (Date.now() < endWait) { /* 短暂等待 */ }
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
      // 读取并验证是我们自己的锁
      const lockData = fs.readFileSync(lockFile, 'utf8');

      let lockContent;
      try {
        lockContent = JSON.parse(lockData);
      } catch {
        // JSON 解析失败，锁文件可能已损坏
        // 安全删除损坏的锁文件
        fs.unlinkSync(lockFile);
        return;
      }

      // 验证是我们自己的锁
      if (lockContent && lockContent.pid === process.pid) {
        fs.unlinkSync(lockFile);
      }
    }
  } catch {
    // 忽略释放锁时的错误（文件可能已被删除等）
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

  // 安装 commands 到 ~/.claude/commands/
  installCommands(packageDir);

  // 安装 skills 到 ~/.claude/skills/
  installSkills(packageDir);

  // 验证安装
  verifyInstallation();

  // 显示完成信息
  log('\n🎉 安装完成!', 'green');
  log('━'.repeat(DIVIDER_LENGTH), 'green');
  log('');
  warn('⚠️  重要：请完全退出并重新启动 Claude Code 以加载新命令');
  warn('   (仅关闭窗口可能不够，需要完全退出应用)');
  if (os.platform() === 'darwin') {
    warn('   macOS: 使用 Cmd+Q 完全退出应用');
    warn('   如果命令仍未加载，尝试: rm ~/.claude.json && 重启 Claude Code');
  }
  log('');
  log('快速开始:', 'cyan');
  info('  /yishan  - 愚公移山模式（大规模任务）');
  info('  /zhuge   - 诸葛顾问（架构设计）');
  info('  /bianque - 扁鹊诊断（调试问题）');
  info('  /luban   - 鲁班巧工（前端开发）');
  info('  /wukong  - 悟空探索（代码搜索）');
  log('');
  log('安装位置:', 'cyan');
  info(`  Commands: ${getCommandsDir()}`);
  info(`  Skills:   ${getSkillsDir()}`);
  info(`  Plugin:   ${pluginDir}`);
  log('');
  log('故障排除:', 'cyan');
  info('  如果命令未出现在 /help 中：');
  info('  1. 确保完全退出 Claude Code（不只是关闭窗口）');
  info('  2. 检查文件是否存在: ls ~/.claude/commands/');
  info('  3. 清除缓存: rm ~/.claude.json && 重启');
  info('  4. 如果看到 /zcf:yishan (project) 等旧命令：');
  info('     rm -rf .claude/commands/zcf  # 在项目目录中执行');
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

  // 更新 commands 到 ~/.claude/commands/
  const cmdStats = installCommands(packageDir);

  // 更新 skills 到 ~/.claude/skills/
  installSkills(packageDir);

  // 验证安装
  verifyInstallation();

  // 显示完成信息
  log('\n🎉 更新完成!', 'green');
  log('━'.repeat(DIVIDER_LENGTH), 'green');
  log('');
  warn('⚠️  重要：请完全退出并重新启动 Claude Code 以加载新命令');
  warn('   (仅关闭窗口可能不够，需要完全退出应用)');
  if (os.platform() === 'darwin') {
    warn('   macOS: 使用 Cmd+Q 完全退出应用');
    warn('   如果命令仍未加载，尝试: rm ~/.claude.json && 重启 Claude Code');
  }
  log('');

  // 如果清理了旧版本，显示命令格式变化提示
  if (cmdStats.cleaned) {
    log('📝 命令格式变更提示:', 'yellow');
    info('   旧格式: /zcf:yishan, /zcf:zhuge, /zcf:bianque ...');
    info('   新格式: /yishan, /zhuge, /bianque ...');
    log('');
  }

  log('故障排除:', 'cyan');
  info('  如果命令未出现在 /help 中：');
  info('  1. 确保完全退出 Claude Code（不只是关闭窗口）');
  info('  2. 检查文件是否存在: ls ~/.claude/commands/');
  info('  3. 清除缓存: rm ~/.claude.json && 重启');
  info('  4. 如果看到 /zcf:yishan (project) 等旧命令：');
  info('     rm -rf .claude/commands/zcf  # 在项目目录中执行');
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

  // 检查必需目录 - hooks 是核心功能，必须存在
  const requiredDirs = ['agents', 'commands', 'skills', '.claude-plugin', 'hooks'];
  const optionalDirs = [];

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

  // 检查关键 Hook 文件
  info('\n检查核心 Hooks...');
  const coreHooks = ['todo-continuation.sh', 'ralph-loop.sh', 'keyword-detector.sh', 'hooks.json'];
  const hooksDir = path.join(pluginDir, 'hooks');
  for (const hook of coreHooks) {
    const hookPath = path.join(hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      success(`hooks/${hook}`);
    } else {
      error(`缺少核心 Hook: ${hook}`);
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

/**
 * 任务复杂度分析
 * @param {string} taskDescription - 任务描述
 * @returns {object} 复杂度分析结果
 */
function analyzeTaskComplexity(taskDescription) {
  let complexity = 0;
  const factors = [];

  // 1. 任务规模分析 (0-3分)
  if (taskDescription.match(/(完整|整个|全部|系统|平台)/g)) {
    complexity += 3;
    factors.push('大规模系统开发 (+3)');
  } else if (taskDescription.match(/(模块|功能|页面)/g)) {
    complexity += 2;
    factors.push('中等规模功能开发 (+2)');
  } else {
    complexity += 1;
    factors.push('小型任务 (+1)');
  }

  // 2. 技术复杂度分析 (0-2分)
  if (taskDescription.match(/(架构|设计|重构|优化|性能|安全|测试)/g)) {
    complexity += 2;
    factors.push('涉及架构/设计层面 (+2)');
  } else if (taskDescription.match(/(数据库|API|集成|第三方)/g)) {
    complexity += 1.5;
    factors.push('涉及技术集成 (+1.5)');
  }

  // 3. 依赖关系复杂度 (0-2分)
  if (taskDescription.match(/(电商|管理系统|多模块|微服务)/g)) {
    complexity += 2;
    factors.push('高度耦合的多模块系统 (+2)');
  } else if (taskDescription.match(/(前后端|数据库|缓存)/g)) {
    complexity += 1;
    factors.push('涉及多层架构 (+1)');
  }

  // 4. 风险评估 (0-1.5分)
  if (taskDescription.match(/(生产|线上|重要|紧急)/g)) {
    complexity += 1.5;
    factors.push('高风险/高优先级任务 (+1.5)');
  } else if (taskDescription.match(/(新功能|实验|测试)/g)) {
    complexity += 0.5;
    factors.push('中等风险任务 (+0.5)');
  }

  // 5. 时间压力 (0-1分)
  if (taskDescription.match(/(快速|紧急|deadline|尽快)/g)) {
    complexity += 1;
    factors.push('时间压力较大 (+1)');
  }

  // 限制最大分数为10
  complexity = Math.min(complexity, 10);

  // 确定复杂度等级
  let level = '低';
  if (complexity >= 7) level = '高';
  else if (complexity >= 4) level = '中';

  return {
    score: complexity,
    level: level,
    factors: factors,
    maxScore: 10
  };
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

// ==================== 模块导出（供测试使用） ====================

/**
 * 导出内部函数供测试使用
 * 仅在测试环境下使用，生产环境下这些函数通过 CLI 入口调用
 */
module.exports = {
  // 常量
  VERSION,
  PLUGIN_NAME,
  LOCK_TIMEOUT_MS,
  LOCK_STALE_MS,
  LARGE_FILE_THRESHOLD_BYTES,
  LOG_DIR,
  ERROR_LOG_PATH,

  // 安全函数
  sanitizeStackTrace,
  getUserFriendlyError,

  // 文件操作
  safeReadFile,
  safeWriteFile,
  safeRemoveDir,
  safeCopyFile,
  copyDir,
  smartCopyFile,
  copyPluginFiles,

  // 路径函数
  getPluginDir,
  getCommandsDir,
  getSkillsDir,
  getPackageDir,
  getLockFilePath,

  // 锁机制
  acquireLock,
  releaseLock,

  // 进度类
  ProgressIndicator,

  // 执行器
  executeWithRollback,
  setHookPermissions,

  // 验证
  verifyInstallation,

  // 主要命令（供集成测试使用）
  install,
  uninstall,
  update,
  verify,
};

// ==================== CLI 入口 ====================

// 仅在直接运行时执行（非 require）
if (require.main === module) {
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
}
