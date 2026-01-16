/**
 * oh-my-claude 共享日志模块
 * 提供统一的颜色输出和日志函数
 */

// ANSI 颜色码定义
export const colors: Record<string, string> = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * 带颜色的日志输出
 * @param msg - 消息内容
 * @param color - 颜色名称，默认 'reset'
 */
export function log(msg: string, color: string = 'reset'): void {
  console.log(`${colors[color] || colors.reset}${msg}${colors.reset}`);
}

/**
 * 成功消息（绿色 ✅）
 */
export function success(msg: string): void {
  log(`✅ ${msg}`, 'green');
}

/**
 * 错误消息（红色 ❌）
 */
export function error(msg: string): void {
  log(`❌ ${msg}`, 'red');
}

/**
 * 信息消息（蓝色 ℹ️）
 */
export function info(msg: string): void {
  log(`ℹ️  ${msg}`, 'blue');
}

/**
 * 警告消息（黄色 ⚠️）
 */
export function warn(msg: string): void {
  log(`⚠️  ${msg}`, 'yellow');
}
