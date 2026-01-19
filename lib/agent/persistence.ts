/**
 * 状态持久化模块
 * 处理 Agent 状态、会话、上下文缓存的存储和加载
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { AgentState, CollaborationSession, ContextCompression } from '../../types/index.js';
import { AgentStateSchema, CollaborationSessionSchema } from './types.js';
import { AgentStateStore } from './state-manager.js';
import { SessionManager } from './session-manager.js';
import { ContextCacheManager } from './context-compression.js';

// ==================== 路径配置 ====================

const STATE_DIR = path.join(os.homedir(), '.oh-my-claude', 'state');
const AGENT_STATE_FILE = path.join(STATE_DIR, 'agent-states.json');
const SESSION_STATE_FILE = path.join(STATE_DIR, 'sessions.json');
const CONTEXT_CACHE_FILE = path.join(STATE_DIR, 'context-cache.json');

// ==================== 持久化管理器 ====================

export class PersistenceManager {
  private agentStore: AgentStateStore;
  private sessionManager: SessionManager;
  private contextCache: ContextCacheManager;

  constructor(
    agentStore: AgentStateStore,
    sessionManager: SessionManager,
    contextCache: ContextCacheManager
  ) {
    this.agentStore = agentStore;
    this.sessionManager = sessionManager;
    this.contextCache = contextCache;
  }

  /**
   * 保存所有状态
   */
  async saveState(): Promise<void> {
    // 确保目录存在
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }

    // 保存 agent 状态
    const agentStates = Object.fromEntries(this.agentStore.getAllAgentStates());
    fs.writeFileSync(AGENT_STATE_FILE, JSON.stringify(agentStates, null, 2));

    // 保存会话状态
    const sessions = {
      active: Object.fromEntries(this.sessionManager.getActiveSessions()),
      history: this.sessionManager.getSessionHistory()
    };
    fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(sessions, null, 2));

    // 保存上下文缓存
    const contextCache = this.contextCache.exportCache();
    fs.writeFileSync(CONTEXT_CACHE_FILE, JSON.stringify(contextCache, null, 2));
  }

  /**
   * 加载所有状态
   */
  async loadState(): Promise<void> {
    try {
      // 加载 agent 状态
      if (fs.existsSync(AGENT_STATE_FILE)) {
        const agentData = JSON.parse(fs.readFileSync(AGENT_STATE_FILE, 'utf8')) as Record<string, unknown>;
        for (const [id, state] of Object.entries(agentData)) {
          this.agentStore.setAgentState(id, AgentStateSchema.parse(state) as AgentState);
        }
      }

      // 加载会话状态
      if (fs.existsSync(SESSION_STATE_FILE)) {
        const sessionData = JSON.parse(fs.readFileSync(SESSION_STATE_FILE, 'utf8')) as {
          active: Record<string, unknown>;
          history: unknown[];
        };
        
        const activeSessions = new Map<string, CollaborationSession>();
        for (const [id, session] of Object.entries(sessionData.active)) {
          activeSessions.set(id, CollaborationSessionSchema.parse(session) as CollaborationSession);
        }
        this.sessionManager.setActiveSessions(activeSessions);
        
        const history = sessionData.history.map((s) => CollaborationSessionSchema.parse(s) as CollaborationSession);
        this.sessionManager.setSessionHistory(history);
      }

      // 加载上下文缓存
      if (fs.existsSync(CONTEXT_CACHE_FILE)) {
        const cacheData = JSON.parse(fs.readFileSync(CONTEXT_CACHE_FILE, 'utf8')) as Record<string, ContextCompression>;
        this.contextCache.importCache(cacheData);
      }
    } catch (error) {
      console.warn('加载状态数据失败:', error);
      throw error;
    }
  }
}
