/**
 * Claude Code Provider
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

export class ClaudeCodeProvider extends BaseProvider implements AiToolProvider {
  readonly providerId: ProviderId = 'claude-code';
  readonly displayName = 'Claude Code';

  private stateDir: string;
  private pluginDir: string;

  constructor(config?: ProviderConfig) {
    super(config);
    this.pluginDir = config?.pluginDir ?? path.join(os.homedir(), '.claude', 'plugins', 'oh-my-claude');
    this.stateDir = config?.stateDir ?? path.join(os.homedir(), '.oh-my-claude');
  }

  detect(): boolean {
    if (process.env.OH_MY_CLAUDE_PROVIDER === 'claude-code') return true;
    return !!process.env.CLAUDE_SESSION_ID;
  }

  getSessionId(): string {
    return process.env.CLAUDE_SESSION_ID || 'unknown';
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
        prompt: parsed.prompt,
        toolName: parsed.tool_name,
        toolInput: parsed.tool_input,
        toolOutput: parsed.tool_output,
        model: parsed.model,
        agent: parsed.agent,
        command: parsed.command,
      };
    } catch {
      return { prompt: stdin };
    }
  }

  formatSystemMessage(text: string): string {
    return JSON.stringify({ systemMessage: text });
  }

  formatPermissionDecision(decision: PermissionDecision): string | null {
    if (decision.action === 'allow') return null;
    const result: Record<string, unknown> = {};
    if (decision.action === 'block') {
      result.decision = 'block';
      result.reason = decision.reason || '';
      result.hookSpecificOutput = { additionalContext: '' };
    }
    if (decision.action === 'deny') {
      result.hookSpecificOutput = {
        hookEventName: '',
        permissionDecision: 'deny',
        permissionDecisionReason: decision.reason || '',
      };
    }
    return JSON.stringify(result);
  }

  formatFullOutput(output: HookOutput): string {
    const result: Record<string, unknown> = {};
    if (output.systemMessage) result.systemMessage = output.systemMessage;
    if (output.additionalContext) result.additionalContext = output.additionalContext;
    if (output.hookSpecificOutput) {
      result.hookSpecificOutput = {
        ...(result.hookSpecificOutput as Record<string, unknown> ?? {}),
        ...output.hookSpecificOutput,
      };
    }
    if (output.permissionDecision) {
      const pd = output.permissionDecision;
      if (pd.action === 'deny') {
        result.hookSpecificOutput = {
          ...(result.hookSpecificOutput as Record<string, unknown> ?? {}),
          permissionDecision: 'deny',
          permissionDecisionReason: pd.reason || '',
          hookEventName: '',
        };
      } else if (pd.action === 'block') {
        result.decision = 'block';
        result.reason = pd.reason || '';
        result.hookSpecificOutput = {
          ...(result.hookSpecificOutput as Record<string, unknown> ?? {}),
          additionalContext: '',
        };
      }
    }
    return JSON.stringify(result);
  }

  getHookEventName(hookType: HookEventType): string {
    const map: Record<HookEventType, string> = {
      preToolUse: 'PreToolUse',
      postToolUse: 'PostToolUse',
      userPromptSubmit: 'UserPromptSubmit',
      sessionStart: 'SessionStart',
      stop: 'Stop',
    };
    return map[hookType];
  }

  getToolName(toolType: ToolType): string {
    const map: Record<ToolType, string> = {
      backgroundOutput: 'background_output',
      backgroundStatus: 'background_status',
      backgroundCancel: 'background_cancel',
      stopContinuation: '/stop-continuation',
      task: 'Task',
      read: 'Read',
      edit: 'Edit',
      write: 'Write',
      bash: 'Bash',
    };
    return this.config.toolMappings?.[toolType] ?? map[toolType];
  }

  getDefaultModel(): string {
    return 'claude-sonnet-4-6';
  }

  mapModelTier(tier: ModelTier): string {
    const userMap = this.config.modelMappings ?? {};
    if (userMap[tier]) return userMap[tier]!;
    const map: Record<ModelTier, string> = {
      flagship: 'claude-opus-4-7',
      balanced: 'claude-sonnet-4-6',
      fast: 'claude-haiku-4-5',
      cheap: 'claude-haiku-4-5',
    };
    return map[tier];
  }

  getDefaultFallbackChain(): string[] {
    return this.config.fallbackChain ?? [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
    ];
  }

  getRequiredEnvVars(): string[] {
    return ['CLAUDE_SESSION_ID'];
  }
}
