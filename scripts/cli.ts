#!/usr/bin/env node

/**
 * oh-my-claude CLI - TypeScript 版本
 * 基于中国传统文化的 Claude Code 智能编排插件
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import AgentStateManagerImpl from '../lib/agent-state-manager.js';
import { configManager, OhMyClaudeConfig } from '../lib/config-manager.js';
import { colors, log, success, error, info, warn } from './logger.js';
import type {
  PluginConfig,
  TaskSnapshot,
  AgentCollaboration,
  CompressedContext,
  ContextSnapshots,
  PluginState,
  TaskRecoveryPlan,
  ComplexityAnalysis
} from '../types/index.js';

// ESM __filename 和 __dirname 等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== Zod 模式验证 ====================

const TaskSnapshotSchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  timestamp: z.string(),
  type: z.string(),
  status: z.string(),
  progress: z.number().min(0).max(100),
  agents: z.array(z.string()),
  context: z.record(z.any()),
  checkpoint: z.any().optional()
});

const AgentCollaborationSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  agents: z.array(z.object({
    name: z.string(),
    status: z.string()
  })),
  task: z.object({
    description: z.string(),
    status: z.string()
  }),
  status: z.string(),
  messages: z.array(z.string()),
  context: z.record(z.any())
});

const PluginStateSchema = z.object({
  version: z.string(),
  installed: z.boolean(),
  installTime: z.string().nullable(),
  lastUpdate: z.string(),
  agents: z.array(z.object({
    name: z.string(),
    file: z.string(),
    checksum: z.string().optional()
  })),
  commands: z.array(z.object({
    name: z.string(),
    file: z.string(),
    checksum: z.string().optional()
  })),
  hooks: z.array(z.object({
    file: z.string(),
    checksum: z.string().optional()
  })),
  skills: z.array(z.object({
    name: z.string(),
    checksum: z.string().optional()
  })),
  checksums: z.record(z.string()),
  tasks: z.object({
    activeTasks: z.array(TaskSnapshotSchema),
    completedTasks: z.array(TaskSnapshotSchema),
    failedTasks: z.array(TaskSnapshotSchema),
    taskHistory: z.array(TaskSnapshotSchema)
  }),
  agentCollaboration: z.object({
    activeSessions: z.array(AgentCollaborationSchema),
    agentStates: z.record(z.any()),
    collaborationHistory: z.array(AgentCollaborationSchema)
  }),
  context: z.object({
    compressedContexts: z.record(z.any()),
    keyReferences: z.record(z.any()),
    contextSnapshots: z.array(z.any())
  }),
  performance: z.object({
    taskCompletionRate: z.number().min(0).max(100),
    averageTaskDuration: z.number().min(0),
    agentUtilization: z.record(z.number()),
    errorRates: z.record(z.number())
  })
});

// 其他验证模式
const TaskDescriptionSchema = z.string().max(10000); // 允许空字符串，但限制最大长度
const FilePathSchema = z.string().min(1);
const PluginDirSchema = z.string().min(1);
const LockTimeoutSchema = z.number().min(1000).max(300000);
const ComplexityAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  level: z.enum(['低', '中', '高']),
  factors: z.array(z.string()),
  maxScore: z.number()
});

const CopyResultSchema = z.object({
  dirs: z.number().min(0),
  files: z.number().min(0),
  errors: z.array(z.string())
});

const InstallResultSchema = z.object({
  count: z.number().min(0),
  errors: z.array(z.string()),
  cleaned: z.boolean().optional()
});

const VerificationResultSchema = z.object({
  success: z.boolean(),
  errors: z.array(z.string())
});

interface VerificationResult {
  success: boolean;
  errors: string[];
}

// ==================== 常量配置 ====================

const VERSION = '1.0.19';
const PLUGIN_NAME = 'oh-my-claude';

// 路径配置
const LOG_DIR = path.join(os.homedir(), '.oh-my-claude', 'logs');
const ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');
const PLUGIN_STATE_DIR = path.join(os.homedir(), '.oh-my-claude', 'state');
const PLUGIN_STATE_PATH = path.join(PLUGIN_STATE_DIR, 'plugin-state.json');

// 时间配置（毫秒）
const LOCK_TIMEOUT_MS = 30000;
const LOCK_STALE_MS = 5 * 60 * 1000;
const LOCK_RETRY_INTERVAL_MS = 1000;

// 文件处理配置
const LARGE_FILE_THRESHOLD_BYTES = 1024 * 1024;
const COPY_BUFFER_SIZE = 64 * 1024;

// UI 配置
const DIVIDER_LENGTH = 40;
const DIVIDER_LONG_LENGTH = 60;

// GitHub 配置
const GITHUB_REPO = 'ZDragon17/oh-my-claude';
const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues`;

// ==================== 核心功能 ====================

/**
 * 脱敏处理堆栈跟踪中的敏感路径信息
 */
function sanitizeStackTrace(stack: string): string {
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

/**
 * 记录错误到日志文件（带脱敏处理）
 */
function logErrorToFile(err: Error): boolean {
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

// ==================== 全局错误处理 ====================

// 全局错误处理
process.on('uncaughtException', (err: Error) => {
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

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('\x1b[31m❌ 发生未处理的 Promise 拒绝:\x1b[0m');
  console.error(reason);
  if (reason instanceof Error) {
    logErrorToFile(reason);
  }
  process.exit(1);
});

// 颜色输出 - 使用共享模块（已在文件顶部导入）

// 初始化 Agent 状态管理器
const agentStateManager = new AgentStateManagerImpl();

// 初始化配置管理器并启用热重载
if (configManager.get('advanced').enableTracing) {
  configManager.enableHotReload();
}

// ==================== 用户友好的错误信息 ====================

/**
 * 将系统错误码转换为用户友好的错误信息
 */
function getUserFriendlyError(err: NodeJS.ErrnoException, filePath: string): string {
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

  // 默认错误信息
  return `${err.message}\n  如需帮助，请访问: ${GITHUB_ISSUES_URL}`;
}

// ==================== 安全的文件操作 ====================

/**
 * 安全的文件读取
 */
function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return null;
    }
    throw new Error(getUserFriendlyError(err as NodeJS.ErrnoException, filePath));
  }
}

/**
 * 安全的文件写入
 */
function safeWriteFile(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err as NodeJS.ErrnoException, filePath));
  }
}

/**
 * 安全的目录删除
 */
function safeRemoveDir(dirPath: string): boolean {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err as NodeJS.ErrnoException, dirPath));
  }
}

/**
 * 安全的文件复制
 */
function safeCopyFile(src: string, dest: string): boolean {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err as NodeJS.ErrnoException, `${src} -> ${dest}`));
  }
}

// ==================== 路径函数 ====================

/**
 * 获取插件安装路径
 */
function getPluginDir(): string {
  const home = os.homedir();
  return path.join(home, '.claude', 'plugins', PLUGIN_NAME);
}

/**
 * 获取 commands 安装路径
 */
function getCommandsDir(): string {
  const home = os.homedir();
  return path.join(home, '.claude', 'commands');
}

/**
 * 获取 skills 安装路径
 */
function getSkillsDir(): string {
  const home = os.homedir();
  return path.join(home, '.claude', 'skills');
}

/**
 * 获取当前包的路径
 * 从 dist/scripts/ 向上两级到项目根目录
 */
function getPackageDir(): string {
  return path.resolve(__dirname, '..', '..');
}

/**
 * 检查 Claude Code 是否安装
 */
function checkClaudeCode(): boolean {
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ==================== 任务复杂度分析 ====================

/**
 * 任务复杂度分析 (带 Zod 验证)
 * 导出以供测试使用
 */
export function analyzeTaskComplexity(taskDescription: string): ComplexityAnalysis {
  // 验证输入
  const validatedDescription = TaskDescriptionSchema.parse(taskDescription);

  // 空字符串特殊处理
  if (!validatedDescription.trim()) {
    return {
      score: 0,
      level: '低' as const,
      factors: ['空任务描述'],
      maxScore: 10
    };
  }

  let complexity = 0;
  const factors: string[] = [];

  // 1. 任务规模分析 (0-3分)
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

  // 2. 技术复杂度分析 (0-2分)
  if (validatedDescription.match(/(架构|设计|重构|优化|性能|安全|测试)/i)) {
    complexity += 2;
    factors.push('涉及架构/设计层面 (+2)');
  } else if (validatedDescription.match(/(数据库|API|集成|第三方)/i)) {
    complexity += 1.5;
    factors.push('涉及技术集成 (+1.5)');
  }

  // 3. 依赖关系复杂度 (0-2分)
  if (validatedDescription.match(/(电商|管理系统|多模块|微服务)/i)) {
    complexity += 2;
    factors.push('高度耦合的多模块系统 (+2)');
  } else if (validatedDescription.match(/(前后端|数据库|缓存)/i)) {
    complexity += 1;
    factors.push('涉及多层架构 (+1)');
  }

  // 4. 风险评估 (0-1.5分)
  if (validatedDescription.match(/(生产|线上|重要|紧急)/i)) {
    complexity += 1.5;
    factors.push('高风险/高优先级任务 (+1.5)');
  } else if (validatedDescription.match(/(新功能|实验|测试)/i)) {
    complexity += 0.5;
    factors.push('中等风险任务 (+0.5)');
  }

  // 5. 时间压力 (0-1分)
  if (validatedDescription.match(/(快速|紧急|deadline|尽快)/i)) {
    complexity += 1;
    factors.push('时间压力较大 (+1)');
  }

  // 限制最大分数为10
  complexity = Math.min(complexity, 10);

  // 确定复杂度等级
  let level: '低' | '中' | '高' = '低';
  if (complexity >= 7) level = '高';
  else if (complexity >= 4) level = '中';

  const result = {
    score: complexity,
    level,
    factors,
    maxScore: 10
  };

  // 验证输出
  return ComplexityAnalysisSchema.parse(result);
}

// ==================== 插件状态管理 ====================

/**
 * 获取插件状态 (带 Zod 验证)
 */
function getPluginState(): PluginState {
  try {
    if (fs.existsSync(PLUGIN_STATE_PATH)) {
      const stateData = fs.readFileSync(PLUGIN_STATE_PATH, 'utf8');
      const parsed = JSON.parse(stateData);
      // 使用 Zod 验证和类型安全
      return PluginStateSchema.parse(parsed);
    }
  } catch (error) {
    console.warn(`读取插件状态失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 返回默认状态 - 增强版
  return {
    version: VERSION,
    installed: false,
    installTime: null,
    lastUpdate: new Date().toISOString(),
    agents: [],
    commands: [],
    hooks: [],
    skills: [],
    checksums: {},
    tasks: {
      activeTasks: [],
      completedTasks: [],
      failedTasks: [],
      taskHistory: []
    },
    agentCollaboration: {
      activeSessions: [],
      agentStates: {},
      collaborationHistory: []
    },
    context: {
      compressedContexts: {},
      keyReferences: {},
      contextSnapshots: []
    },
    performance: {
      taskCompletionRate: 0,
      averageTaskDuration: 0,
      agentUtilization: {},
      errorRates: {}
    }
  };
}

/**
 * 保存插件状态 (带 Zod 验证)
 */
function savePluginState(state: PluginState): void {
  try {
    // 验证状态数据
    const validatedState = PluginStateSchema.parse(state);

    // 确保状态目录存在
    fs.mkdirSync(PLUGIN_STATE_DIR, { recursive: true });

    // 添加时间戳
    validatedState.lastUpdate = new Date().toISOString();

    // 限制历史记录数量，避免文件过大
    if (validatedState.tasks && validatedState.tasks.taskHistory) {
      validatedState.tasks.taskHistory = validatedState.tasks.taskHistory.slice(-100);
    }
    if (validatedState.agentCollaboration && validatedState.agentCollaboration.collaborationHistory) {
      validatedState.agentCollaboration.collaborationHistory = validatedState.agentCollaboration.collaborationHistory.slice(-50);
    }
    if (validatedState.context && validatedState.context.contextSnapshots) {
      validatedState.context.contextSnapshots = validatedState.context.contextSnapshots.slice(-20);
    }

    fs.writeFileSync(PLUGIN_STATE_PATH, JSON.stringify(validatedState, null, 2), 'utf8');
    console.log('插件状态已保存 (TypeScript + Zod 验证)');
  } catch (error) {
    console.error(`保存插件状态失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ==================== 并发锁机制 ====================

interface LockContent {
  pid: number;
  timestamp: number;
}

/**
 * 获取锁文件路径
 */
function getLockFilePath(pluginDir: string): string {
  return `${pluginDir}.lock`;
}

/**
 * 尝试获取文件锁（防止并发操作）
 */
function acquireLock(lockFile: string, timeout: number = LOCK_TIMEOUT_MS): boolean {
  // 验证输入参数
  const validatedLockFile = FilePathSchema.parse(lockFile);
  const validatedTimeout = LockTimeoutSchema.parse(timeout);

  const startTime = Date.now();
  const pid = process.pid;
  const lockContent: LockContent = { pid, timestamp: Date.now() };

  while (Date.now() - startTime < timeout) {
    try {
      // 尝试以排他模式创建锁文件
      fs.writeFileSync(validatedLockFile, JSON.stringify(lockContent), { flag: 'wx' });
      return true;
    } catch (err) {
      if (err instanceof Error && 'code' in err && err.code === 'EEXIST') {
        // 锁文件已存在，检查是否过期
        try {
          const lockData = fs.readFileSync(validatedLockFile, 'utf8');
          let existingLock: LockContent;

          try {
            existingLock = JSON.parse(lockData);
          } catch (parseErr) {
            // JSON 解析失败，锁文件可能已损坏，清理后重试
            warn('锁文件格式损坏，正在清理...');
            fs.unlinkSync(validatedLockFile);
            continue;
          }

          // 验证锁内容的有效性
          if (!existingLock || typeof existingLock.timestamp !== 'number') {
            warn('锁文件内容无效，正在清理...');
            fs.unlinkSync(validatedLockFile);
            continue;
          }

          const lockAge = Date.now() - existingLock.timestamp;

          // 如果锁超过阈值，认为是陈旧锁，强制删除
          if (lockAge > LOCK_STALE_MS) {
            warn('检测到陈旧锁文件，正在清理...');
            fs.unlinkSync(validatedLockFile);
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
          continue;
        }

        // 使用系统 sleep 命令等待，避免忙等待占用 CPU
        const waitTime = Math.min(LOCK_RETRY_INTERVAL_MS, timeout - (Date.now() - startTime));
        if (waitTime > 0) {
          try {
            if (process.platform === 'win32') {
              // Windows: 使用 ping localhost 实现延时
              execSync(`ping -n 2 127.0.0.1`, { stdio: 'ignore', timeout: waitTime + 1000 });
            } else {
              // Unix: 使用 sleep 命令
              execSync(`sleep ${(waitTime / 1000).toFixed(1)}`, { stdio: 'ignore', timeout: waitTime + 1000 });
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
 */
function releaseLock(lockFile: string): void {
  try {
    if (fs.existsSync(lockFile)) {
      // 读取并验证是我们自己的锁
      const lockData = fs.readFileSync(lockFile, 'utf8');

      let lockContent: LockContent;
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
 */
function executeWithRollback(
  pluginDir: string,
  operation: (targetDir: string, backupDir: string) => void,
  operationName: string = '操作'
): boolean {
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
    error(`${operationName}失败: ${err instanceof Error ? err.message : 'Unknown error'}`);

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

// ==================== 文件操作工具函数 ====================

interface CopyStats {
  files: number;
  dirs: number;
  emptyDirs: number;
}

/**
 * 使用流式方式复制大文件
 */
function copyFileStream(src: string, dest: string): Promise<void> {
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
 */
function smartCopyFile(src: string, dest: string): void {
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
 */
function copyDir(
  src: string,
  dest: string,
  options: { preserveEmpty?: boolean } = {}
): CopyStats {
  const { preserveEmpty = true } = options;
  const stats: CopyStats = { files: 0, dirs: 0, emptyDirs: 0 };

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

// ==================== 插件文件操作 ====================

// 插件目录和文件配置
const PLUGIN_DIRS = ['agents', 'commands', 'hooks', 'skills', '.claude-plugin'];
const PLUGIN_FILES = ['README.md', 'README_EN.md', 'LICENSE'];

interface CopyResult {
  dirs: number;
  files: number;
  errors: string[];
}

interface InstallResult {
  count: number;
  errors: string[];
  cleaned?: boolean;
}

/**
 * 复制插件文件到目标目录（带进度显示和 Zod 验证）
 */
function copyPluginFiles(packageDir: string, pluginDir: string, showProgress: boolean = true): CopyResult {
  // 验证输入参数
  const validatedPackageDir = FilePathSchema.parse(packageDir);
  const validatedPluginDir = FilePathSchema.parse(pluginDir);

  const stats: CopyResult = { dirs: 0, files: 0, errors: [] };

  // 计算总步骤数
  const totalSteps = PLUGIN_DIRS.length + PLUGIN_FILES.length;
  const progress = showProgress ? new ProgressIndicator(totalSteps, '复制文件') : null;

  // 复制目录
  for (const dir of PLUGIN_DIRS) {
    const src = path.join(validatedPackageDir, dir);
    const dest = path.join(validatedPluginDir, dir);

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
      stats.errors.push(`复制目录失败 ${dir}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      if (progress) progress.update(`失败 ${dir}/`);
    }
  }

  // 复制文件
  for (const file of PLUGIN_FILES) {
    const src = path.join(validatedPackageDir, file);
    const dest = path.join(validatedPluginDir, file);

    if (!fs.existsSync(src)) {
      if (progress) progress.update(`跳过 ${file}`);
      continue; // 文件可选，不记录错误
    }

    try {
      fs.copyFileSync(src, dest);
      stats.files++;
      if (progress) progress.update(file);
    } catch (err) {
      stats.errors.push(`复制文件失败 ${file}: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  // 验证输出
  return CopyResultSchema.parse(stats);
}

/**
 * 设置 hook 脚本权限（Unix）
 */
function setHookPermissions(pluginDir: string): void {
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
 * 安装 slash commands 到 ~/.claude/commands/
 */
function installCommands(packageDir: string): InstallResult {
  const commandsDir = getCommandsDir();
  const commandsSrc = path.join(packageDir, 'commands');
  const stats: InstallResult = { count: 0, errors: [], cleaned: false };

  info('正在安装 slash commands...');

  // 清理旧版本的 zcf 子目录（1.0.8 及之前版本使用 /zcf:* 命令格式）
  const legacyZcfDir = path.join(commandsDir, 'zcf');
  if (fs.existsSync(legacyZcfDir)) {
    try {
      fs.rmSync(legacyZcfDir, { recursive: true, force: true });
      stats.cleaned = true;
      info('已清理旧版本 zcf 子目录');
    } catch (err) {
      warn(`清理旧版本目录失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        stats.errors.push(`复制 ${file} 失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  return InstallResultSchema.parse(stats);
}

/**
 * 安装 skills 到 ~/.claude/skills/
 */
function installSkills(packageDir: string): InstallResult {
  const skillsDir = getSkillsDir();
  const skillsSrc = path.join(packageDir, 'skills');
  const stats: InstallResult = { count: 0, errors: [] };

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
        stats.errors.push(`安装 skill ${skillName} 失败: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }

  if (stats.count > 0) {
    success(`Skills 安装完成 (${stats.count} 个 skill)`);
    info(`Skills 位置: ${skillsDir}`);
  }

  return InstallResultSchema.parse(stats);
}

/**
 * 验证安装结果
 */
function verifyInstallation(): VerificationResult {
  info('验证安装...');
  const commandsDir = getCommandsDir();
  const result: VerificationResult = { success: true, errors: [] };

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

  if (!result.success) {
    warn('安装可能不完整，请检查上述警告');
  }

  return VerificationResultSchema.parse(result);
}

/**
 * 注册插件到 Claude Code
 */
function registerPlugin(pluginDir: string): boolean {
  try {
    info('正在注册插件...');
    // 使用 execSync 执行命令
    execSync(`claude plugins install "${pluginDir}"`, {
      stdio: 'inherit'
    });

    success('插件注册成功');
    return true;
  } catch (e) {
    warn('自动注册失败，请手动运行:');
    warn(`  claude plugins install "${pluginDir}"`);
    return false;
  }
}

// ==================== ProgressIndicator 类 ====================

/**
 * 进度显示器类
 * 用于在 CLI 中显示操作进度
 */
class ProgressIndicator {
  private totalSteps: number;
  private currentStep: number;
  private description: string;
  private startTime: number;
  private isInteractive: boolean;

  constructor(totalSteps: number, description: string = '处理中') {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.description = description;
    this.startTime = Date.now();
    this.isInteractive = process.stdout.isTTY;
  }

  /**
   * 更新进度
   */
  update(stepDescription: string = ''): void {
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
   */
  private _createProgressBar(percent: number): string {
    const total = 20;
    const filled = Math.round((percent / 100) * total);
    const empty = total - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * 完成进度
   */
  complete(message: string = '完成'): void {
    if (this.isInteractive) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r'); // 清除进度行
    }
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    success(`${message} (耗时 ${elapsed}s)`);
  }

  /**
   * 失败时清理
   */
  fail(message: string = '失败'): void {
    if (this.isInteractive) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r'); // 清除进度行
    }
    error(`${message}`);
  }
}

// ==================== 主要命令函数 ====================

/**
 * 执行卸载操作
 */
function performUninstall(pluginDir: string): void {
  // 使用 Claude CLI 卸载
  try {
    info('正在卸载插件...');
    execSync(`claude plugins uninstall ${PLUGIN_NAME}`, {
      stdio: 'inherit'
    });
  } catch {
    // 忽略错误，继续删除文件
  }

  // 删除文件
  fs.rmSync(pluginDir, { recursive: true, force: true });

  success('插件已卸载');
  log('');
}

/**
 * 注册核心 Agent
 */
function registerCoreAgents(): void {
  const coreAgents = [
    { id: 'yugong', name: '愚公 (YuGong)' },
    { id: 'zhuge', name: '诸葛 (ZhuGe)' },
    { id: 'luban', name: '鲁班 (LuBan)' },
    { id: 'wukong', name: '悟空 (WuKong)' },
    { id: 'bianque', name: '扁鹊 (BianQue)' },
    { id: 'mozi', name: '墨子 (MoZi)' },
    { id: 'sunzi', name: '孙子 (SunZi)' },
    { id: 'simaqian', name: '司马迁 (SimaQian)' },
    { id: 'zhenghe', name: '郑和 (ZhengHe)' },
    { id: 'zhangheng', name: '张衡 (ZhangHeng)' },
    { id: 'libing', name: '李冰 (LiBing)' },
    { id: 'laozi', name: '老子 (LaoZi)' },
    { id: 'baozheng', name: '包拯 (BaoZheng)' },
    { id: 'weizheng', name: '魏征 (WeiZheng)' },
    { id: 'cangjie', name: '仓颉 (CangJie)' },
    { id: 'libai', name: '李白 (LiBai)' },
    { id: 'gukaizhi', name: '顾恺之 (GuKaiZhi)' },
    { id: 'change', name: '嫦娥 (ChangE)' }
  ];

  for (const agent of coreAgents) {
    try {
      agentStateManager.registerAgent(agent.id, agent.name);
      info(`已注册 Agent: ${agent.name}`);
    } catch (error) {
      warn(`注册 Agent ${agent.name} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * 安装插件（带回滚机制）
 */
async function install(): Promise<void> {
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

  // 注册核心 Agent
  await registerCoreAgents();

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
  info('  /luban   - 鲁班巧工（代码实现）');
  info('  /wukong  - 悟空侦察（代码搜索）');
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
  log('');
}

/**
 * 卸载插件（带确认提示）
 */
function uninstall(): void {
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

/**
 * 更新插件（使用公共函数，带回滚）
 */
async function update(): Promise<void> {
  log('\n🏔️  oh-my-claude 更新程序', 'cyan');
  log('━'.repeat(DIVIDER_LENGTH), 'cyan');

  const pluginDir = getPluginDir();

  if (!fs.existsSync(pluginDir)) {
    warn('插件未安装，将执行全新安装');
    await install();
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
  installCommands(packageDir);

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
  // 这里需要获取 installCommands 的返回值来检查是否清理了旧版本
  // 暂时注释掉这个逻辑
  // if (cmdStats.cleaned) {
  //   log('📝 命令格式变更提示:', 'yellow');
  //   info('   旧格式: /zcf:yishan, /zcf:zhuge, /zcf:bianque ...');
  //   info('   新格式: /yishan, /zhuge, /bianque ...');
  //   log('');
  // }

  log('故障排除:', 'cyan');
  info('  如果命令未出现在 /help 中：');
  info('  1. 确保完全退出 Claude Code（不只是关闭窗口）');
  info('  2. 检查文件是否存在: ls ~/.claude/commands/');
  info('  3. 清除缓存: rm ~/.claude.json && 重启');
  log('');
}

/**
 * 显示配置信息
 */
function showConfig(): void {
  log('\n🏔️  oh-my-claude 配置信息', 'cyan');
  log('━'.repeat(DIVIDER_LENGTH), 'cyan');

  const config = configManager.getConfig();

  console.log('\n📋 当前配置:');
  console.log(`版本: ${config.version}`);
  console.log(`调试模式: ${config.debug ? '开启' : '关闭'}`);
  console.log(`日志级别: ${config.logLevel}`);

  console.log('\n🤖 Agent 配置:');
  console.log(`默认超时: ${config.agents.defaultTimeout}ms`);
  console.log(`最大并发任务: ${config.agents.maxConcurrentTasks}`);
  console.log(`启用协作: ${config.agents.enableCollaboration ? '是' : '否'}`);
  console.log(`上下文压缩: ${config.agents.contextCompression ? '是' : '否'}`);

  console.log('\n🎨 UI 配置:');
  console.log(`主题: ${config.ui.theme}`);
  console.log(`语言: ${config.ui.language}`);
  console.log(`显示进度: ${config.ui.showProgress ? '是' : '否'}`);
  console.log(`启用通知: ${config.ui.enableNotifications ? '是' : '否'}`);

  console.log('\n⚡ 性能配置:');
  console.log(`启用缓存: ${config.performance.enableCache ? '是' : '否'}`);
  console.log(`缓存大小: ${config.performance.cacheSize}`);
  console.log(`最大内存: ${config.performance.maxMemoryUsage}MB`);
  console.log(`启用指标: ${config.performance.enableMetrics ? '是' : '否'}`);

  console.log('\n🌐 网络配置:');
  console.log(`超时时间: ${config.network.timeout}ms`);
  console.log(`重试次数: ${config.network.retries}`);
  if (config.network.proxy) {
    console.log(`代理服务器: ${config.network.proxy}`);
  }

  console.log('\n🔌 插件配置:');
  console.log(`自动更新: ${config.plugins.autoUpdate ? '是' : '否'}`);
  console.log(`允许第三方: ${config.plugins.enableThirdParty ? '是' : '否'}`);
  console.log(`可信域名: ${config.plugins.trustedDomains.join(', ')}`);

  console.log('\n⚙️  高级配置:');
  console.log(`启用性能分析: ${config.advanced.enableProfiling ? '是' : '否'}`);
  console.log(`启用追踪: ${config.advanced.enableTracing ? '是' : '否'}`);
  console.log(`自定义钩子: ${Object.keys(config.advanced.customHooks).length} 个`);

  log('\n📁 配置文件位置:', 'cyan');
  info(`全局配置: ~/.oh-my-claude/config/global.json`);
  info(`用户配置: ~/.oh-my-claude/config.json`);
  info(`项目配置: ./.oh-my-claude.json 或 ./oh-my-claude.config.json`);

  log('\n💡 配置提示:', 'cyan');
  info('使用环境变量覆盖: OH_MY_CLAUDE_DEBUG=true');
  info('使用 oh-my-claude config 查看此信息');
  info('配置文件修改后自动热重载 (如果启用追踪)');
}

/**
 * 获取配置值
 */
function getConfigValue(key: string): void {
  try {
    // 支持点号分隔的嵌套键，如 "agents.defaultTimeout"
    const keys = key.split('.');
    let value: any = configManager.getConfig();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        throw new Error(`配置键不存在: ${key}`);
      }
    }

    console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`获取配置失败: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * 设置配置值
 */
function setConfigValue(key: string, valueStr: string): void {
  try {
    // 解析值
    let value: any;
    if (valueStr === 'true') value = true;
    else if (valueStr === 'false') value = false;
    else if (!isNaN(Number(valueStr))) value = Number(valueStr);
    else if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      value = JSON.parse(valueStr);
    } else {
      value = valueStr;
    }

    // 支持点号分隔的嵌套设置
    const keys = key.split('.');
    if (keys.length === 1) {
      // 顶级配置键
      configManager.set(key as keyof OhMyClaudeConfig, value);
    } else {
      // 嵌套配置键
      const topKey = keys[0];
      const subKey = keys.slice(1).join('.');
      const currentValue = configManager.get(topKey as keyof OhMyClaudeConfig);

      // 深度设置嵌套值
      const updatedValue = setNestedValue(currentValue, keys.slice(1), value);
      configManager.set(topKey as keyof OhMyClaudeConfig, updatedValue);
    }

    console.log(`✅ 配置已更新: ${key} = ${JSON.stringify(value)}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`设置配置失败: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * 深度设置嵌套对象的值
 */
function setNestedValue(obj: any, keys: string[], value: any): any {
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }

  const [currentKey, ...remainingKeys] = keys;
  return {
    ...obj,
    [currentKey]: setNestedValue(obj[currentKey] || {}, remainingKeys, value)
  };
}

/**
 * 保存配置到文件
 */
async function saveConfigToFile(filePath?: string): Promise<void> {
  try {
    await configManager.saveConfig(filePath);
    console.log(`✅ 配置已保存${filePath ? `到 ${filePath}` : '到用户配置文件'}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`保存配置失败: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * 处理配置命令
 */
async function handleConfigCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    // 默认显示配置
    showConfig();
    return;
  }

  const subcommand = args[0];

  switch (subcommand) {
    case 'show':
      showConfig();
      break;

    case 'get':
      if (args.length < 2) {
        error('用法: oh-my-claude config get <key>');
        error('示例: oh-my-claude config get debug');
        error('       oh-my-claude config get agents.defaultTimeout');
        process.exit(1);
      }
      getConfigValue(args[1]);
      break;

    case 'set':
      if (args.length < 3) {
        error('用法: oh-my-claude config set <key> <value>');
        error('示例: oh-my-claude config set debug true');
        error('       oh-my-claude config set agents.defaultTimeout 60000');
        error('       oh-my-claude config set ui.theme dark');
        process.exit(1);
      }
      setConfigValue(args[1], args[2]);
      break;

    case 'save': {
      const configFilePath = args.length > 1 ? args[1] : undefined;
      await saveConfigToFile(configFilePath);
      break;
    }

    case 'reset':
      configManager.resetToDefaults();
      await configManager.saveConfig();
      console.log('✅ 配置已重置为默认值');
      break;

    case 'help':
    default:
      console.log('\n🏔️  oh-my-claude 配置管理命令', 'cyan');
      console.log('━'.repeat(DIVIDER_LENGTH), 'cyan');
      console.log('\n用法: oh-my-claude config <subcommand> [参数...]');
      console.log('\n子命令:');
      console.log('  show                 显示当前配置');
      console.log('  get <key>           获取配置值');
      console.log('  set <key> <value>   设置配置值');
      console.log('  save [file]         保存配置到文件');
      console.log('  reset               重置为默认配置');
      console.log('  help                显示此帮助信息');
      console.log('\n示例:');
      console.log('  oh-my-claude config show');
      console.log('  oh-my-claude config get debug');
      console.log('  oh-my-claude config set debug true');
      console.log('  oh-my-claude config set agents.defaultTimeout 60000');
      console.log('  oh-my-claude config save');
      console.log('  oh-my-claude config save ~/.oh-my-claude/my-config.json');
      console.log('\n配置键支持点号分隔的嵌套访问:');
      console.log('  agents.defaultTimeout, ui.theme, performance.cacheSize 等');
      break;
  }
}

/**
 * 验证安装
 */
function verify(): void {
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
      error(`plugin.json 解析失败: ${e instanceof Error ? e.message : 'Unknown error'}`);
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

// ==================== 主入口 ====================

// 仅在直接运行时执行 (ESM 兼容方式)
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
        uninstall();
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
      console.log(`oh-my-claude v${VERSION}`);
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
      console.log('\n🏔️  oh-my-claude - 基于中国传统文化的 Claude Code 智能编排插件 (TypeScript 版本)');
      console.log('━'.repeat(DIVIDER_LONG_LENGTH));
      console.log('\n用法: oh-my-claude <command>\n');
      console.log('命令:');
       console.log('  install     安装插件到 Claude Code');
       console.log('  config      配置管理 (show/get/set/save)');
       console.log('  version     显示版本号');
       console.log('  benchmark   运行性能基准测试');
       console.log('  help        显示帮助信息');
       console.log('\n示例:');
       console.log('  npx oh-my-claude install');
       console.log('  oh-my-claude config show');
       console.log('  oh-my-claude config set debug true');
       console.log('  oh-my-claude benchmark');
       console.log('  oh-my-claude version');
      break;
    }
  })();
}