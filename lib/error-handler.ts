/**
 * 错误处理模块
 * 提供错误信息转换、日志记录等功能
 */

import * as fs from 'fs';
import * as os from 'os';
import { LOG_DIR, ERROR_LOG_PATH, VERSION, GITHUB_ISSUES_URL } from './constants.js';

// ==================== 错误信息转换 ====================

/**
 * 将系统错误码转换为用户友好的错误信息
 */
export function getUserFriendlyError(err: NodeJS.ErrnoException, filePath: string): string {
  const errorMessages: Record<string, string> = {
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

  const friendlyMessage = errorMessages[err.code || ''];
  if (friendlyMessage) {
    return friendlyMessage;
  }

  return `${err.message}\n  如需帮助，请访问: ${GITHUB_ISSUES_URL}`;
}

// ==================== 脱敏处理 ====================

/**
 * 脱敏处理堆栈跟踪中的敏感路径信息
 */
export function sanitizeStackTrace(stack: string): string {
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
  sanitized = sanitized.replace(/[a-f0-9]{32,}/gi, '<redacted-hex>');
  sanitized = sanitized.replace(/[A-Za-z0-9+/=]{40,}/g, '<redacted-token>');

  return sanitized;
}

// ==================== 错误日志记录 ====================

/**
 * 记录错误到日志文件（带脱敏处理）
 */
export function logErrorToFile(err: Error): boolean {
  try {
    // 确保日志目录存在
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const sanitizedStack = sanitizeStackTrace(err.stack || '');
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
