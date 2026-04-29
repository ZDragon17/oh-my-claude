/**
 * 错误处理模块
 * 提供错误信息转换、日志记录、恢复建议等功能
 */

import * as fs from 'fs';
import * as os from 'os';
import { LOG_DIR, ERROR_LOG_PATH, VERSION, GITHUB_ISSUES_URL } from './constants.js';

// ==================== 类型定义 ====================

export interface ErrorContext {
  operation: string;
  filePath?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface RecoverySuggestion {
  action: string;
  command?: string;
  description: string;
}

export interface EnhancedError {
  message: string;
  code?: string;
  suggestions: RecoverySuggestion[];
  helpUrl?: string;
}

// ==================== 检测语言环境 ====================

const isChineseLocale = (): boolean => {
  return (process.env.LANG || process.env.LC_ALL || '').toLowerCase().includes('zh');
};

// ==================== 错误信息转换 ====================

/**
 * 将系统错误码转换为用户友好的错误信息
 */
export function getUserFriendlyError(err: NodeJS.ErrnoException, filePath: string): string {
  const isChinese = isChineseLocale();

  const errorMessages: Record<string, { zh: string; en: string }> = {
    'ENOENT': {
      zh: `文件或目录不存在: ${filePath}\n  请检查路径是否正确`,
      en: `File or directory not found: ${filePath}\n  Please check if the path is correct`
    },
    'EACCES': {
      zh: `权限不足: ${filePath}\n  请尝试以管理员身份运行，或检查文件权限`,
      en: `Permission denied: ${filePath}\n  Try running as administrator, or check file permissions`
    },
    'EPERM': {
      zh: `操作被拒绝: ${filePath}\n  可能被其他程序占用，请关闭相关程序后重试`,
      en: `Operation not permitted: ${filePath}\n  May be in use by another program, close it and retry`
    },
    'ENOSPC': {
      zh: `磁盘空间不足\n  请清理磁盘空间后重试`,
      en: `No space left on device\n  Please free up disk space and retry`
    },
    'EBUSY': {
      zh: `资源正忙: ${filePath}\n  文件可能正在被其他程序使用`,
      en: `Resource busy: ${filePath}\n  File may be in use by another program`
    },
    'EMFILE': {
      zh: `打开文件过多\n  请关闭一些应用程序后重试`,
      en: `Too many open files\n  Please close some applications and retry`
    },
    'EEXIST': {
      zh: `文件已存在: ${filePath}\n  请先删除或重命名现有文件`,
      en: `File already exists: ${filePath}\n  Please delete or rename the existing file`
    },
    'EISDIR': {
      zh: `目标是目录而非文件: ${filePath}`,
      en: `Target is a directory, not a file: ${filePath}`
    },
    'ENOTDIR': {
      zh: `目标不是目录: ${filePath}`,
      en: `Target is not a directory: ${filePath}`
    },
    'ENOTEMPTY': {
      zh: `目录不为空: ${filePath}\n  请先清空目录内容`,
      en: `Directory not empty: ${filePath}\n  Please empty the directory first`
    },
    'ECONNREFUSED': {
      zh: `连接被拒绝\n  请检查网络连接或服务是否运行`,
      en: `Connection refused\n  Please check network connection or if the service is running`
    },
    'ETIMEDOUT': {
      zh: `连接超时\n  请检查网络连接后重试`,
      en: `Connection timed out\n  Please check network connection and retry`
    },
    'ENOTFOUND': {
      zh: `无法解析主机名\n  请检查 DNS 设置或网络连接`,
      en: `Host not found\n  Please check DNS settings or network connection`
    }
  };

  const errorInfo = errorMessages[err.code || ''];
  if (errorInfo) {
    return isChinese ? errorInfo.zh : errorInfo.en;
  }

  const helpMessage = isChinese
    ? `如需帮助，请访问: ${GITHUB_ISSUES_URL}`
    : `For help, please visit: ${GITHUB_ISSUES_URL}`;

  return `${err.message}\n  ${helpMessage}`;
}

/**
 * 获取带恢复建议的增强错误信息
 */
export function getEnhancedError(err: NodeJS.ErrnoException, context: ErrorContext): EnhancedError {
  const isChinese = isChineseLocale();
  const suggestions: RecoverySuggestion[] = [];

  // 根据错误类型添加恢复建议
  switch (err.code) {
    case 'ENOENT':
      suggestions.push({
        action: isChinese ? '检查路径' : 'Check path',
        command: context.filePath ? `ls -la "${context.filePath}"` : undefined,
        description: isChinese ? '确认文件或目录路径是否正确' : 'Verify the file or directory path is correct'
      });
      if (context.operation === 'install') {
        suggestions.push({
          action: isChinese ? '重新安装' : 'Reinstall',
          command: 'npx claude-pangu install',
          description: isChinese ? '尝试重新运行安装命令' : 'Try running the install command again'
        });
      }
      break;

    case 'EACCES':
    case 'EPERM':
      suggestions.push({
        action: isChinese ? '检查权限' : 'Check permissions',
        command: context.filePath ? `ls -la "${context.filePath}"` : undefined,
        description: isChinese ? '查看文件权限设置' : 'View file permission settings'
      });
      if (os.platform() !== 'win32') {
        suggestions.push({
          action: isChinese ? '使用 sudo' : 'Use sudo',
          command: 'sudo npx claude-pangu install',
          description: isChinese ? '以管理员权限运行（谨慎使用）' : 'Run with administrator privileges (use with caution)'
        });
      }
      break;

    case 'ENOSPC':
      suggestions.push({
        action: isChinese ? '清理空间' : 'Free space',
        command: os.platform() === 'win32' ? 'cleanmgr' : 'df -h',
        description: isChinese ? '清理磁盘空间后重试' : 'Free up disk space and retry'
      });
      break;

    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case 'ENOTFOUND':
      suggestions.push({
        action: isChinese ? '检查网络' : 'Check network',
        command: 'ping github.com',
        description: isChinese ? '确认网络连接正常' : 'Verify network connection is working'
      });
      suggestions.push({
        action: isChinese ? '检查代理' : 'Check proxy',
        description: isChinese ? '如果使用代理，请确认代理设置正确' : 'If using proxy, verify proxy settings are correct'
      });
      break;
  }

  // 添加通用建议
  suggestions.push({
    action: isChinese ? '查看日志' : 'View logs',
    command: `cat ${ERROR_LOG_PATH}`,
    description: isChinese ? '查看详细错误日志' : 'View detailed error logs'
  });

  suggestions.push({
    action: isChinese ? '寻求帮助' : 'Get help',
    description: isChinese ? '在 GitHub Issues 搜索或提交问题' : 'Search or submit issues on GitHub Issues'
  });

  return {
    message: getUserFriendlyError(err, context.filePath || ''),
    code: err.code,
    suggestions,
    helpUrl: GITHUB_ISSUES_URL
  };
}

/**
 * 格式化增强错误信息为可打印字符串
 */
export function formatEnhancedError(error: EnhancedError): string {
  const isChinese = isChineseLocale();
  const lines: string[] = [];

  lines.push(`\n❌ ${error.message}\n`);

  if (error.suggestions.length > 0) {
    lines.push(isChinese ? '💡 建议的解决方案:' : '💡 Suggested Solutions:');
    lines.push('');

    error.suggestions.forEach((suggestion, index) => {
      lines.push(`  ${index + 1}. ${suggestion.action}`);
      lines.push(`     ${suggestion.description}`);
      if (suggestion.command) {
        lines.push(`     $ ${suggestion.command}`);
      }
      lines.push('');
    });
  }

  if (error.helpUrl) {
    lines.push(isChinese ? `📖 更多帮助: ${error.helpUrl}` : `📖 More help: ${error.helpUrl}`);
  }

  return lines.join('\n');
}

// ==================== 脱敏处理 ====================

// 预编译正则表达式以避免每次调用时重建
const buildSanitizePattern = (str: string): RegExp => {
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'g');
};

let _homeRegex: RegExp | null = null;
let _usernameRegex: RegExp | null = null;

/**
 * 脱敏处理堆栈跟踪中的敏感路径信息
 */
export function sanitizeStackTrace(stack: string): string {
  if (!stack) return '';

  if (!_homeRegex) {
    _homeRegex = buildSanitizePattern(os.homedir());
    _usernameRegex = buildSanitizePattern(os.userInfo().username);
  }

  // 替换用户主目录路径
  let sanitized = stack
    .replace(_homeRegex!, '~')
    .replace(_usernameRegex!, '<user>');

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
