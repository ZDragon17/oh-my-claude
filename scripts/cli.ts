#!/usr/bin/env node

/**
 * oh-my-claude CLI - TypeScript 版本
 * 基于中国传统文化的 Claude Code 智能编排插件
 *
 * 模块化重构：此文件只负责命令路由和入口
 */

import { fileURLToPath } from 'url';

// 常量和配置
import { GITHUB_ISSUES_URL, ERROR_LOG_PATH } from '../lib/constants.js';

// UI 消息
import { printHelp, printVersion } from '../lib/ui/messages.js';

// 文件操作
import { logErrorToFile } from '../lib/file-operations.js';

// 安装器
import { install, uninstall, update } from '../lib/installer.js';

// 验证器
import { verify } from '../lib/verifier.js';

// 配置命令
import { handleConfigCommand } from '../lib/config-commands.js';

// 配置管理（用于初始化）
import { configManager } from '../lib/config-manager.js';

// 复杂度分析（从独立模块导入）
import { analyzeTaskComplexity } from '../lib/complexity-analyzer.js';
export { analyzeTaskComplexity };

// ESM __filename 等价物
const __filename = fileURLToPath(import.meta.url);

// ==================== 全局错误处理 ====================

process.on('uncaughtException', (err: Error) => {
  console.error('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.error('\x1b[31m发生未捕获的错误\x1b[0m');
  console.error('\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.error(`\x1b[33m错误类型:\x1b[0m ${err.name}`);
  console.error(`\x1b[33m错误信息:\x1b[0m ${err.message}`);
  console.error(`\x1b[33m错误堆栈:\x1b[0m`);
  console.error(err.stack);

  if (logErrorToFile(err)) {
    console.error(`\n\x1b[36m错误已记录到:\x1b[0m ${ERROR_LOG_PATH}`);
  }

  console.error('\n\x1b[33m这是一个程序缺陷，请报告到:\x1b[0m');
  console.error(`${GITHUB_ISSUES_URL}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('\x1b[31m发生未处理的 Promise 拒绝:\x1b[0m');
  console.error(reason);
  if (reason instanceof Error) {
    logErrorToFile(reason);
  }
  process.exit(1);
});

// 初始化配置管理器并启用热重载
if (configManager.get('advanced').enableTracing) {
  configManager.enableHotReload();
}

// ==================== 主入口 ====================

const isMainModule = process.argv[1] === __filename || process.argv[1]?.endsWith('cli.js');

if (isMainModule) {
  (async () => {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    switch (command) {
      case 'install':
      case 'i':
        await install();
        break;

      case 'uninstall':
      case 'remove':
      case 'rm':
        await uninstall();
        break;

      case 'update':
      case 'upgrade':
      case 'up':
        await update();
        break;

      case 'verify':
      case 'check':
      case 'doctor':
        verify();
        break;

      case 'version':
      case '-v':
      case '--version':
        printVersion();
        break;

      case 'config':
        await handleConfigCommand(process.argv.slice(3));
        break;

      case 'benchmark':
        console.log('性能基准测试 (TypeScript 版本)');
        break;

      case 'help':
      case '-h':
      case '--help':
      default:
        printHelp();
        break;
    }
  })();
}
