#!/usr/bin/env node

/**
 * oh-my-claude CLI
 * 基于中国传统文化的 Claude Code 智能编排插件
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const VERSION = '0.8.1';
const PLUGIN_NAME = 'oh-my-claude';

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

// 安装插件
function install() {
  log('\n🏔️  oh-my-claude 安装程序', 'cyan');
  log('━'.repeat(40), 'cyan');

  // 检查 Claude Code
  if (!checkClaudeCode()) {
    error('未检测到 Claude Code CLI');
    info('请先安装 Claude Code: https://claude.ai/code');
    process.exit(1);
  }

  const packageDir = getPackageDir();
  const pluginDir = getPluginDir();

  // 创建插件目录
  const parentDir = path.dirname(pluginDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // 复制文件
  info('正在安装插件文件...');

  const dirs = ['agents', 'commands', 'hooks', 'skills', '.claude-plugin'];

  // 如果目标目录已存在，先删除
  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
  }

  fs.mkdirSync(pluginDir, { recursive: true });

  for (const dir of dirs) {
    const src = path.join(packageDir, dir);
    const dest = path.join(pluginDir, dir);
    if (fs.existsSync(src)) {
      copyDir(src, dest);
    }
  }

  // 复制其他文件
  const files = ['README.md', 'README_EN.md', 'LICENSE'];
  for (const file of files) {
    const src = path.join(packageDir, file);
    const dest = path.join(pluginDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // 设置 hook 脚本权限 (Unix)
  if (os.platform() !== 'win32') {
    const hooksDir = path.join(pluginDir, 'hooks');
    if (fs.existsSync(hooksDir)) {
      const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
      for (const hookFile of hookFiles) {
        const hookPath = path.join(hooksDir, hookFile);
        fs.chmodSync(hookPath, '755');
      }
    }
  }

  success('插件文件安装完成');
  info(`安装位置: ${pluginDir}`);

  // 使用 Claude CLI 注册插件
  try {
    info('正在注册插件...');
    execSync(`claude plugins install "${pluginDir}"`, { stdio: 'inherit' });
    success('插件注册成功');
  } catch (e) {
    warn('自动注册失败，请手动运行: claude plugins install ' + pluginDir);
  }

  log('\n🎉 安装完成!', 'green');
  log('━'.repeat(40), 'cyan');
  info('使用 /yishan 或 /愚公 开始愚公移山模式');
  info('使用 /zhuge 或 /诸葛 召唤诸葛顾问');
  info('查看所有命令: 阅读 README.md\n');
}

// 卸载插件
function uninstall() {
  log('\n🏔️  oh-my-claude 卸载程序', 'cyan');
  log('━'.repeat(40), 'cyan');

  const pluginDir = getPluginDir();

  if (!fs.existsSync(pluginDir)) {
    warn('插件未安装');
    process.exit(0);
  }

  // 使用 Claude CLI 卸载
  try {
    info('正在卸载插件...');
    execSync(`claude plugins uninstall ${PLUGIN_NAME}`, { stdio: 'inherit' });
  } catch {
    // 忽略错误，继续删除文件
  }

  // 删除文件
  fs.rmSync(pluginDir, { recursive: true, force: true });

  success('插件已卸载');
  log('');
}

// 显示版本
function showVersion() {
  log(`oh-my-claude v${VERSION}`);
}

// 显示帮助
function showHelp() {
  log('\n🏔️  oh-my-claude - 基于中国传统文化的 Claude Code 智能编排插件', 'cyan');
  log('━'.repeat(60), 'cyan');
  log('\n用法: oh-my-claude <command>\n');
  log('命令:', 'yellow');
  log('  install     安装插件到 Claude Code');
  log('  uninstall   卸载插件');
  log('  version     显示版本号');
  log('  help        显示帮助信息');
  log('\n示例:', 'yellow');
  log('  npx oh-my-claude install');
  log('  oh-my-claude install');
  log('\n更多信息: https://github.com/ZDragon17/oh-my-claude\n');
}

// 复制目录
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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
  case 'version':
  case '-v':
  case '--version':
    showVersion();
    break;
  case 'help':
  case '-h':
  case '--help':
  default:
    showHelp();
    break;
}
