#!/usr/bin/env node

/**
 * Agent 状态管理器
 * 
 * 此文件作为向后兼容的入口点，实际实现已拆分到 lib/agent/ 目录：
 * - lib/agent/types.ts - Zod schemas 和类型定义
 * - lib/agent/state-manager.ts - Agent 状态管理
 * - lib/agent/session-manager.ts - 协作会话管理
 * - lib/agent/context-compression.ts - 上下文压缩算法
 * - lib/agent/persistence.ts - 数据持久化
 * - lib/agent/index.ts - 聚合导出和主实现
 */

// 重新导出所有内容以保持向后兼容
export * from './agent/index.js';
export { AgentStateManagerImpl as default } from './agent/index.js';
