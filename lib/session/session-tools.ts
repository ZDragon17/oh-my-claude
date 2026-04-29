/**
 * Session Tools - 会话管理工具集
 * 
 * 提供完整的会话管理能力，对标 oh-my-opencode 的 session_* 工具：
 * - session_list: 列出所有会话
 * - session_read: 读取会话历史
 * - session_search: 搜索会话内容
 * - session_info: 获取会话元数据
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ==================== 类型定义 ====================

/**
 * 会话摘要信息
 */
export interface SessionSummary {
  sessionId: string;
  messageCount: number;
  firstMessageAt: string;
  lastMessageAt: string;
  agentsUsed: string[];
  duration: string;
  projectPath?: string;
}

/**
 * 会话消息
 */
export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agent?: string;
  toolCalls?: ToolCall[];
}

/**
 * 工具调用记录
 */
export interface ToolCall {
  name: string;
  input: unknown;
  output?: unknown;
  duration?: number;
}

/**
 * 会话历史
 */
export interface SessionHistory {
  sessionId: string;
  messages: SessionMessage[];
  todos?: TodoItem[];
  transcript?: TranscriptEntry[];
}

/**
 * TODO 项
 */
export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  createdAt?: string;
  completedAt?: string;
}

/**
 * 转录条目
 */
export interface TranscriptEntry {
  timestamp: string;
  type: 'message' | 'tool_call' | 'tool_result' | 'error';
  content: unknown;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  sessionId: string;
  messageId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  matchedText: string;
  timestamp: string;
}

/**
 * 会话元数据
 */
export interface SessionMetadata {
  sessionId: string;
  messageCount: number;
  firstMessageAt: string;
  lastMessageAt: string;
  duration: string;
  agentsUsed: string[];
  hasTodos: boolean;
  todoStats?: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  hasTranscript: boolean;
  transcriptEntryCount?: number;
  projectPath?: string;
  tokenEstimate?: number;
}

/**
 * 列表选项
 */
export interface SessionListOptions {
  limit?: number;
  fromDate?: string;
  toDate?: string;
  projectPath?: string;
}

/**
 * 读取选项
 */
export interface SessionReadOptions {
  includeTodos?: boolean;
  includeTranscript?: boolean;
  limit?: number;
}

/**
 * 搜索选项
 */
export interface SessionSearchOptions {
  sessionId?: string;
  caseSensitive?: boolean;
  limit?: number;
}

// ==================== Session Tools 类 ====================

/**
 * Session 工具类
 */
export class SessionTools {
  private claudeDir: string;
  private todosDir: string;
  private transcriptsDir: string;
  private sessionsDir: string;

  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.todosDir = path.join(this.claudeDir, 'todos');
    this.transcriptsDir = path.join(this.claudeDir, 'transcripts');
    this.sessionsDir = path.join(this.claudeDir, 'sessions');
  }

  /**
   * 列出所有会话
   */
  sessionList(options: SessionListOptions = {}): SessionSummary[] {
    const { limit, fromDate, toDate, projectPath } = options;
    const sessions: SessionSummary[] = [];

    // 尝试从 transcripts 目录获取会话
    if (fs.existsSync(this.transcriptsDir)) {
      const files = fs.readdirSync(this.transcriptsDir)
        .filter(f => f.endsWith('.jsonl'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(this.transcriptsDir, a));
          const statB = fs.statSync(path.join(this.transcriptsDir, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      for (const file of files) {
        const sessionId = file.replace('.jsonl', '');
        const summary = this.getSessionSummary(sessionId);
        
        if (summary) {
          // 应用过滤条件
          if (fromDate && summary.firstMessageAt < fromDate) continue;
          if (toDate && summary.lastMessageAt > toDate) continue;
          if (projectPath && summary.projectPath !== projectPath) continue;
          
          sessions.push(summary);
          
          if (limit && sessions.length >= limit) break;
        }
      }
    }

    // 也尝试从 sessions 目录（如果存在）
    if (fs.existsSync(this.sessionsDir)) {
      const sessionDirs = fs.readdirSync(this.sessionsDir)
        .filter(d => fs.statSync(path.join(this.sessionsDir, d)).isDirectory());

      for (const dir of sessionDirs) {
        if (!sessions.some(s => s.sessionId === dir)) {
          const summary = this.getSessionSummaryFromDir(dir);
          if (summary) {
            if (fromDate && summary.firstMessageAt < fromDate) continue;
            if (toDate && summary.lastMessageAt > toDate) continue;
            if (projectPath && summary.projectPath !== projectPath) continue;
            
            sessions.push(summary);
            
            if (limit && sessions.length >= limit) break;
          }
        }
      }
    }

    return sessions;
  }

  /**
   * 读取会话历史
   */
  sessionRead(sessionId: string, options: SessionReadOptions = {}): SessionHistory | null {
    const { includeTodos = false, includeTranscript = false, limit } = options;
    
    const history: SessionHistory = {
      sessionId,
      messages: []
    };

    // 从 transcript 读取消息
    const transcriptPath = path.join(this.transcriptsDir, `${sessionId}.jsonl`);
    if (fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'message' || entry.role) {
            const message: SessionMessage = {
              id: entry.id || `msg_${history.messages.length}`,
              role: entry.role || 'assistant',
              content: typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content),
              timestamp: entry.timestamp || entry.created_at || new Date().toISOString(),
              agent: entry.agent,
              toolCalls: entry.tool_calls
            };
            history.messages.push(message);
            
            if (limit && history.messages.length >= limit) break;
          }
        } catch {
          // 跳过无效的 JSON 行
        }
      }
    }

    // 包含 todos
    if (includeTodos) {
      history.todos = this.getSessionTodos(sessionId);
    }

    // 包含 transcript
    if (includeTranscript) {
      history.transcript = this.getSessionTranscript(sessionId);
    }

    return history.messages.length > 0 ? history : null;
  }

  /**
   * 搜索会话内容
   */
  sessionSearch(query: string, options: SessionSearchOptions = {}): SearchResult[] {
    const { sessionId, caseSensitive = false, limit = 20 } = options;
    const results: SearchResult[] = [];
    
    const searchPattern = caseSensitive
      ? new RegExp(this.escapeRegExp(query))
      : new RegExp(this.escapeRegExp(query), 'i');

    const sessionsToSearch = sessionId 
      ? [sessionId]
      : this.sessionList().map(s => s.sessionId);

    for (const sid of sessionsToSearch) {
      const history = this.sessionRead(sid);
      if (!history) continue;

      for (const message of history.messages) {
        if (searchPattern.test(message.content)) {
          // 提取匹配上下文
          const match = message.content.match(searchPattern);
          if (match) {
            results.push({
              sessionId: sid,
              messageId: message.id,
              role: message.role,
              content: message.content,
              matchedText: this.getMatchContext(message.content, query, caseSensitive),
              timestamp: message.timestamp
            });
            
            if (results.length >= limit) return results;
          }
        }
      }
    }

    return results;
  }

  /**
   * 获取会话元数据
   */
  sessionInfo(sessionId: string): SessionMetadata | null {
    const summary = this.getSessionSummary(sessionId);
    if (!summary) return null;

    const todos = this.getSessionTodos(sessionId);
    const transcript = this.getSessionTranscript(sessionId);

    const metadata: SessionMetadata = {
      sessionId,
      messageCount: summary.messageCount,
      firstMessageAt: summary.firstMessageAt,
      lastMessageAt: summary.lastMessageAt,
      duration: summary.duration,
      agentsUsed: summary.agentsUsed,
      hasTodos: todos.length > 0,
      hasTranscript: transcript.length > 0,
      projectPath: summary.projectPath
    };

    if (todos.length > 0) {
      metadata.todoStats = {
        total: todos.length,
        completed: todos.filter(t => t.status === 'completed').length,
        pending: todos.filter(t => t.status === 'pending').length,
        inProgress: todos.filter(t => t.status === 'in_progress').length
      };
    }

    if (transcript.length > 0) {
      metadata.transcriptEntryCount = transcript.length;
    }

    // 估算 token 数（粗略估算：1 token ≈ 4 字符）
    const history = this.sessionRead(sessionId);
    if (history) {
      const totalChars = history.messages.reduce((sum, m) => sum + m.content.length, 0);
      metadata.tokenEstimate = Math.ceil(totalChars / 4);
    }

    return metadata;
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 获取会话摘要（从 transcript）
   */
  private getSessionSummary(sessionId: string): SessionSummary | null {
    const transcriptPath = path.join(this.transcriptsDir, `${sessionId}.jsonl`);
    if (!fs.existsSync(transcriptPath)) return null;

    try {
      const content = fs.readFileSync(transcriptPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return null;

      const agents = new Set<string>();
      let firstTimestamp: string | undefined;
      let lastTimestamp: string | undefined;
      let messageCount = 0;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const timestamp = entry.timestamp || entry.created_at;
          
          if (timestamp) {
            if (!firstTimestamp) firstTimestamp = timestamp;
            lastTimestamp = timestamp;
          }
          
          if (entry.agent) agents.add(entry.agent);
          if (entry.role || entry.type === 'message') messageCount++;
        } catch {
          // 跳过无效行
        }
      }

      const stat = fs.statSync(transcriptPath);
      
      return {
        sessionId,
        messageCount,
        firstMessageAt: firstTimestamp || stat.birthtime.toISOString(),
        lastMessageAt: lastTimestamp || stat.mtime.toISOString(),
        agentsUsed: Array.from(agents),
        duration: this.calculateDuration(firstTimestamp, lastTimestamp)
      };
    } catch {
      return null;
    }
  }

  /**
   * 获取会话摘要（从 session 目录）
   */
  private getSessionSummaryFromDir(sessionId: string): SessionSummary | null {
    const sessionDir = path.join(this.sessionsDir, sessionId);
    if (!fs.existsSync(sessionDir)) return null;

    try {
      const metaPath = path.join(sessionDir, 'meta.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return {
          sessionId,
          messageCount: meta.messageCount || 0,
          firstMessageAt: meta.createdAt || new Date().toISOString(),
          lastMessageAt: meta.updatedAt || new Date().toISOString(),
          agentsUsed: meta.agents || [],
          duration: this.calculateDuration(meta.createdAt, meta.updatedAt),
          projectPath: meta.projectPath
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 获取会话 TODOs
   */
  private getSessionTodos(sessionId: string): TodoItem[] {
    const todoPath = path.join(this.todosDir, `${sessionId}.json`);
    if (!fs.existsSync(todoPath)) return [];

    try {
      const content = fs.readFileSync(todoPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * 获取会话 Transcript
   */
  private getSessionTranscript(sessionId: string): TranscriptEntry[] {
    const transcriptPath = path.join(this.transcriptsDir, `${sessionId}.jsonl`);
    if (!fs.existsSync(transcriptPath)) return [];

    try {
      const content = fs.readFileSync(transcriptPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          const entry = JSON.parse(line);
          return {
            timestamp: entry.timestamp || entry.created_at || new Date().toISOString(),
            type: entry.type || 'message',
            content: entry
          };
        } catch {
          return {
            timestamp: new Date().toISOString(),
            type: 'error' as const,
            content: { error: 'Failed to parse line', raw: line }
          };
        }
      });
    } catch {
      return [];
    }
  }

  /**
   * 计算持续时间
   */
  private calculateDuration(start?: string, end?: string): string {
    if (!start || !end) return 'unknown';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    
    if (diffMs < 0) return 'unknown';
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 获取匹配上下文
   */
  private getMatchContext(content: string, query: string, caseSensitive: boolean): string {
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    const searchContent = caseSensitive ? content : content.toLowerCase();
    const index = searchContent.indexOf(searchTerm);
    
    if (index === -1) return content.substring(0, 100);
    
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + query.length + 30);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < content.length ? '...' : '';
    
    return `${prefix}${content.substring(start, end)}${suffix}`;
  }
}

// ==================== 导出单例实例 ====================

export const sessionTools = new SessionTools();

// ==================== 便捷函数导出 ====================

/**
 * 列出会话（便捷方法）
 */
export function sessionList(options?: SessionListOptions): SessionSummary[] {
  return sessionTools.sessionList(options);
}

/**
 * 读取会话（便捷方法）
 */
export function sessionRead(sessionId: string, options?: SessionReadOptions): SessionHistory | null {
  return sessionTools.sessionRead(sessionId, options);
}

/**
 * 搜索会话（便捷方法）
 */
export function sessionSearch(query: string, options?: SessionSearchOptions): SearchResult[] {
  return sessionTools.sessionSearch(query, options);
}

/**
 * 获取会话信息（便捷方法）
 */
export function sessionInfo(sessionId: string): SessionMetadata | null {
  return sessionTools.sessionInfo(sessionId);
}

/**
 * 格式化会话列表为表格
 */
export function formatSessionList(sessions: SessionSummary[]): string {
  if (sessions.length === 0) return 'No sessions found.';
  
  const header = '| Session ID | Messages | First | Last | Agents |';
  const divider = '|------------|----------|-------|------|--------|';
  
  const rows = sessions.map(s => {
    const id = s.sessionId.substring(0, 12);
    const first = s.firstMessageAt.substring(0, 10);
    const last = s.lastMessageAt.substring(0, 10);
    const agents = s.agentsUsed.join(', ') || '-';
    return `| ${id} | ${s.messageCount} | ${first} | ${last} | ${agents} |`;
  });
  
  return [header, divider, ...rows].join('\n');
}

/**
 * 格式化会话历史
 */
export function formatSessionHistory(history: SessionHistory): string {
  const lines = [
    `Session: ${history.sessionId}`,
    `Messages: ${history.messages.length}`,
    ''
  ];
  
  for (let i = 0; i < history.messages.length; i++) {
    const msg = history.messages[i];
    if (!msg) continue;
    const timestamp = msg.timestamp.substring(0, 19).replace('T', ' ');
    lines.push(`[Message ${i + 1}] ${msg.role} (${timestamp})`);
    lines.push(msg.content.substring(0, 500) + (msg.content.length > 500 ? '...' : ''));
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * 格式化搜索结果
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No matches found.';
  
  const lines = [`Found ${results.length} match(es):\n`];
  
  for (const result of results) {
    lines.push(`[${result.sessionId.substring(0, 12)}] ${result.role}`);
    lines.push(`...${result.matchedText}...`);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * 格式化会话信息
 */
export function formatSessionInfo(info: SessionMetadata): string {
  const lines = [
    `Session ID: ${info.sessionId}`,
    `Messages: ${info.messageCount}`,
    `Date Range: ${info.firstMessageAt.substring(0, 10)} to ${info.lastMessageAt.substring(0, 10)}`,
    `Duration: ${info.duration}`,
    `Agents Used: ${info.agentsUsed.join(', ') || 'None'}`,
    `Has Todos: ${info.hasTodos ? 'Yes' : 'No'}`
  ];
  
  if (info.todoStats) {
    lines.push(`  - Total: ${info.todoStats.total}`);
    lines.push(`  - Completed: ${info.todoStats.completed}`);
    lines.push(`  - Pending: ${info.todoStats.pending}`);
    lines.push(`  - In Progress: ${info.todoStats.inProgress}`);
  }
  
  lines.push(`Has Transcript: ${info.hasTranscript ? 'Yes' : 'No'}`);
  
  if (info.transcriptEntryCount) {
    lines.push(`  - Entries: ${info.transcriptEntryCount}`);
  }
  
  if (info.tokenEstimate) {
    lines.push(`Estimated Tokens: ~${info.tokenEstimate.toLocaleString()}`);
  }
  
  return lines.join('\n');
}
