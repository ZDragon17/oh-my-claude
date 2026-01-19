/**
 * Agent 模块类型定义和 Zod 验证 Schema
 */

import { z } from 'zod';

// ==================== 常量配置 ====================

export const CONTEXT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7天
export const MAX_SESSIONS_HISTORY = 100;
export const MAX_CONTEXT_CACHE_SIZE = 50;

// ==================== Zod 验证模式 ====================

export const AgentStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['idle', 'working', 'waiting', 'completed', 'failed']),
  currentTask: z.string().optional(),
  lastActive: z.string(),
  performance: z.object({
    totalTasks: z.number().min(0),
    completedTasks: z.number().min(0),
    failedTasks: z.number().min(0),
    averageResponseTime: z.number().min(0),
    successRate: z.number().min(0).max(1)
  }),
  context: z.object({
    shortTerm: z.record(z.any()),
    longTerm: z.record(z.any()),
    preferences: z.record(z.any())
  })
});

export const CollaborationSessionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  taskId: z.string(),
  description: z.string(),
  status: z.enum(['active', 'completed', 'failed', 'paused']),
  agents: z.array(AgentStateSchema),
  messages: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    agentId: z.string(),
    type: z.enum(['request', 'response', 'notification', 'error']),
    content: z.string(),
    metadata: z.record(z.any()).optional()
  })),
  context: z.object({
    shared: z.record(z.any()),
    compressed: z.array(z.any()),
    checkpoints: z.array(z.object({
      id: z.string(),
      timestamp: z.string(),
      description: z.string(),
      state: z.record(z.any())
    }))
  }),
  metrics: z.object({
    startTime: z.string(),
    endTime: z.string().optional(),
    totalMessages: z.number().min(0),
    agentInteractions: z.record(z.number()),
    taskProgress: z.number().min(0).max(100),
    estimatedCompletion: z.string().optional()
  })
});

// ==================== 类型推断 ====================

export type AgentStateType = z.infer<typeof AgentStateSchema>;
export type CollaborationSessionType = z.infer<typeof CollaborationSessionSchema>;
