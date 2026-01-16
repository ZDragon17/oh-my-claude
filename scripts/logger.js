/**
 * oh-my-claude 共享日志模块
 * 提供统一的颜色输出和日志函数
 */

// ANSI 颜色码定义
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * 带颜色的日志输出
 * @param {string} msg - 消息内容
 * @param {string} color - 颜色名称，默认 'reset'
 */
function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

/**
 * 成功消息（绿色 ✅）
 */
function success(msg) {
  log(`✅ ${msg}`, 'green');
}

/**
 * 错误消息（红色 ❌）
 */
function error(msg) {
  log(`❌ ${msg}`, 'red');
}

/**
 * 信息消息（蓝色 ℹ️）
 */
function info(msg) {
  log(`ℹ️  ${msg}`, 'blue');
}

/**
 * 警告消息（黄色 ⚠️）
 */
function warn(msg) {
  log(`⚠️  ${msg}`, 'yellow');
}

module.exports = {
  colors,
  log,
  success,
  error,
  info,
  warn,
};
