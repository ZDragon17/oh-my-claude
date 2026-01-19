#!/usr/bin/env node

/**
 * oh-my-claude CLI - TypeScript 版本
 * 基于中国传统文化的 Claude Code 智能编排插件
 *
 * 模块化重构：此文件只负责命令路由和入口
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// 常量和配置
import { GITHUB_ISSUES_URL, ERROR_LOG_PATH } from '../lib/constants.js';

// 日志工具
import { colors, log, success, error, info, warn } from './logger.js';

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

// ESM __filename 和 __dirname 等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== Zod 验证 Schema ====================

const TaskDescriptionSchema = z.string().max(10000);
const ComplexityAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  level: z.enum(['低', '中', '高']),
  factors: z.array(z.string()),
  maxScore: z.number()
});

// ==================== 类型定义 ====================

interface ComplexityAnalysis {
  score: number;
  level: '低' | '中' | '高';
  factors: string[];
  maxScore: number;
}

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

// ==================== 任务复杂度分析 ====================

/**
 * 任务复杂度分析 (带 Zod 验证)
 * 导出以供测试使用
 */
export function analyzeTaskComplexity(taskDescription: string): ComplexityAnalysis {
  const validatedDescription = TaskDescriptionSchema.parse(taskDescription);

  if (!validatedDescription.trim()) {
    return { score: 0, level: '低', factors: ['空任务描述'], maxScore: 10 };
  }

  let complexity = 0;
  const factors: string[] = [];

  // 任务规模分析
  if (validatedDescription.match(/(完整|整个|全部|系统|平台)/i)) {
    complexity += 3;
    factors.push('大规模系统开发 (+3)');
  } else if (validatedDescription.match(/(模块|功能|页面)/i)) {
    complexity += 2;
    factors.push('中等规模功能开发 (+2)');
  } else {
    complexity += 1;
    factors.push('小型任务 (+1)');
  }

  // 技术复杂度分析
  if (validatedDescription.match(/(架构|设计|重构|优化|性能|安全|测试)/i)) {
    complexity += 2;
    factors.push('涉及架构/设计层面 (+2)');
  } else if (validatedDescription.match(/(数据库|API|集成|第三方)/i)) {
    complexity += 1.5;
    factors.push('涉及技术集成 (+1.5)');
  }

  // 依赖关系复杂度
  if (validatedDescription.match(/(电商|管理系统|多模块|微服务)/i)) {
    complexity += 2;
    factors.push('高度耦合的多模块系统 (+2)');
  } else if (validatedDescription.match(/(前后端|数据库|缓存)/i)) {
    complexity += 1;
    factors.push('涉及多层架构 (+1)');
  }

  // 风险评估
  if (validatedDescription.match(/(生产|线上|重要|紧急)/i)) {
    complexity += 1.5;
    factors.push('高风险/高优先级任务 (+1.5)');
  } else if (validatedDescription.match(/(新功能|实验|测试)/i)) {
    complexity += 0.5;
    factors.push('中等风险任务 (+0.5)');
  }

  // 时间压力
  if (validatedDescription.match(/(快速|紧急|deadline|尽快)/i)) {
    complexity += 1;
    factors.push('时间压力较大 (+1)');
  }

  complexity = Math.min(complexity, 10);

  let level: '低' | '中' | '高' = '低';
  if (complexity >= 7) level = '高';
  else if (complexity >= 4) level = '中';

  return ComplexityAnalysisSchema.parse({ score: complexity, level, factors, maxScore: 10 });
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
