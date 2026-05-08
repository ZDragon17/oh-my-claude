/**
 * OpenAI Codex CLI Provider
 */

import * as path from 'path';
import * as os from 'os';
import {
  AiToolProvider,
  BaseProvider,
  HookEventType,
  HookInput,
  HookOutput,
  ModelTier,
  PermissionDecision,
  ProviderConfig,
  ProviderId,
  ToolType,
} from './interface.js';

export class CodexProvider extends BaseProvider implements AiToolProvider {
  readonly providerId: ProviderId = 'codex';
  readonly displayName = 'OpenAI Codex CLI';

  private stateDir: string;
  private pluginDir: string;

  constructor(config?: ProviderConfig) {
    super(config);
    this.pluginDir = config?.pluginDir ?? path.join(os.homedir(), '.codex', 'plugins', 'oh-my-claude');
    this.stateDir = config?.stateDir ?? path.join(os.homedir(), '.oh-my-claude-codex');
  }

  detect(): boolean {
    if (process.env.OH_MY_CLAUDE_PROVIDER === 'codex') return true;
    return !!process.env.CODEX_SESSION_ID;
  }

  getSessionId(): string {
    return process.env.CODEX_SESSION_ID || `codex-${Date.now()}`;
  }

  getPluginDir(): string {
    return this.pluginDir;
  }

  getStateDir(): string {
    return this.stateDir;
  }

  parseHookInput(stdin: string): HookInput {
    if (!stdin || stdin === '{}') return {};
    try {
      const parsed = JSON.parse(stdin);
      return {
        prompt: parsed.prompt ?? parsed.message,
        toolName: parsed.tool ?? parsed.tool_name,
        toolInput: parsed.arguments ?? parsed.tool_input,
        toolOutput: parsed.result ?? parsed.tool_output,
        model: parsed.model,
        agent: parsed.agent,
      };
    } catch {
      return { prompt: stdin };
    }
  }

  formatSystemMessage(text: string): string {
    return JSON.stringify({ role: 'system', content: text });
  }

  formatPermissionDecision(decision: PermissionDecision): string | null {
    if (decision.action === 'allow') return null;
    return JSON.stringify({ error: decision.reason, blocked: true });
  }

  formatFullOutput(output: HookOutput): string {
    return JSON.stringify({
      messages: output.systemMessage
        ? [{ role: 'system', content: output.systemMessage }]
        : [],
      blocked: output.permissionDecision?.action !== 'allow',
      metadata: output.hookSpecificOutput ?? {},
    });
  }

  getHookEventName(hookType: HookEventType): string {
    const map: Record<HookEventType, string> = {
      preToolUse: 'before_tool',
      postToolUse: 'after_tool',
      userPromptSubmit: 'on_message',
      sessionStart: 'on_start',
      stop: 'on_stop',
    };
    return map[hookType];
  }

  supportsHookType(hookType: HookEventType): boolean {
    return hookType === 'preToolUse' || hookType === 'postToolUse' || hookType === 'userPromptSubmit';
  }

  getToolName(toolType: ToolType): string {
    const map: Record<ToolType, string> = {
      backgroundOutput: 'background_output',
      backgroundStatus: 'background_status',
      backgroundCancel: 'background_cancel',
      stopContinuation: '/stop',
      task: 'create_task',
      read: 'read',
      edit: 'edit',
      write: 'write_file',
      bash: 'execute_command',
    };
    return this.config.toolMappings?.[toolType] ?? map[toolType];
  }

  getDefaultModel(): string {
    return process.env.CODEX_MODEL || 'gpt-4o';
  }

  mapModelTier(tier: ModelTier): string {
    const userMap = this.config.modelMappings ?? {};
    if (userMap[tier]) return userMap[tier]!;
    const map: Record<ModelTier, string> = {
      flagship: 'o3',
      balanced: 'gpt-4o',
      fast: 'gpt-4o-mini',
      cheap: 'gpt-4o-mini',
    };
    return map[tier];
  }

  getDefaultFallbackChain(): string[] {
    return this.config.fallbackChain ?? ['o3', 'gpt-4o', 'gpt-4o-mini'];
  }

  getRequiredEnvVars(): string[] {
    return ['CODEX_SESSION_ID'];
  }
}
