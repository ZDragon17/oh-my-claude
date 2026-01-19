/**
 * Agent 状态管理模块
 * 处理 Agent 注册、状态查询和更新
 */

import type { AgentState } from '../../types/index.js';
import { AgentStateSchema } from './types.js';

export class AgentStateStore {
  private agentStates: Map<string, AgentState> = new Map();

  // ==================== Agent 状态管理 ====================

  /**
   * 获取 Agent 状态
   */
  getAgentState(agentId: string): AgentState | null {
    return this.agentStates.get(agentId) || null;
  }

  /**
   * 更新 Agent 状态
   */
  updateAgentState(agentId: string, updates: Partial<AgentState>): void {
    const currentState = this.agentStates.get(agentId);
    if (!currentState) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const updatedState = { ...currentState, ...updates, lastActive: new Date().toISOString() };
    this.agentStates.set(agentId, AgentStateSchema.parse(updatedState));
  }

  /**
   * 注册新 Agent
   */
  registerAgent(agentId: string, name: string): AgentState {
    if (this.agentStates.has(agentId)) {
      throw new Error(`Agent ${agentId} already registered`);
    }

    const agentState: AgentState = {
      id: agentId,
      name,
      status: 'idle',
      lastActive: new Date().toISOString(),
      performance: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        successRate: 0
      },
      context: {
        shortTerm: {},
        longTerm: {},
        preferences: {}
      }
    };

    this.agentStates.set(agentId, AgentStateSchema.parse(agentState));
    return agentState;
  }

  // ==================== 性能监控 ====================

  /**
   * 记录性能指标
   */
  recordPerformance(agentId: string, _taskId: string, duration: number, success: boolean): void {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agentState.performance.totalTasks++;
    if (success) {
      agentState.performance.completedTasks++;
    } else {
      agentState.performance.failedTasks++;
    }

    // 更新平均响应时间
    const currentAvg = agentState.performance.averageResponseTime;
    const totalTasks = agentState.performance.totalTasks;
    agentState.performance.averageResponseTime = (currentAvg * (totalTasks - 1) + duration) / totalTasks;

    // 更新成功率
    agentState.performance.successRate = agentState.performance.completedTasks / agentState.performance.totalTasks;
  }

  /**
   * 获取 Agent 性能指标
   */
  getAgentMetrics(agentId: string): AgentState['performance'] {
    const agentState = this.agentStates.get(agentId);
    if (!agentState) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return { ...agentState.performance };
  }

  // ==================== 数据访问 ====================

  /**
   * 获取所有 Agent 状态（用于持久化）
   */
  getAllAgentStates(): Map<string, AgentState> {
    return this.agentStates;
  }

  /**
   * 设置 Agent 状态（用于加载状态）
   */
  setAgentState(agentId: string, state: AgentState): void {
    this.agentStates.set(agentId, AgentStateSchema.parse(state));
  }

  /**
   * 检查 Agent 是否存在
   */
  hasAgent(agentId: string): boolean {
    return this.agentStates.has(agentId);
  }

  /**
   * 获取所有 Agent 列表
   */
  getAgentIds(): string[] {
    return Array.from(this.agentStates.keys());
  }
}
