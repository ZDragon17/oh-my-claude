/**
 * Generic / Standalone Provider
 * Fallback when no specific AI tool is detected.
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

export class GenericProvider extends BaseProvider implements AiToolProvider {
  readonly providerId: ProviderId = 'generic';
  readonly displayName = 'Generic / Standalone';

  private stateDir: string;
  private pluginDir: string;

  constructor(config?: ProviderConfig) {
    super(config);
    this.pluginDir = config?.pluginDir ?? path.join(os.homedir(), '.oh-my-claude');
    this.stateDir = config?.stateDir ?? path.join(os.homedir(), '.oh-my-claude');
  }

  detect(): boolean {
    if (process.env.OH_MY_CLAUDE_PROVIDER === 'generic') return true;
    return false; // never auto-detects
  }

  getSessionId(): string {
    return process.env.OMC_SESSION_ID || `session-${Date.now()}`;
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
        toolName: parsed.toolName ?? parsed.tool_name,
        toolInput: parsed.toolInput ?? parsed.tool_input,
        toolOutput: parsed.toolOutput ?? parsed.tool_output,
        model: parsed.model,
        agent: parsed.agent,
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
    return JSON.stringify({ decision: decision.action, reason: decision.reason });
  }

  formatFullOutput(output: HookOutput): string {
    return JSON.stringify(output);
  }

  getHookEventName(hookType: HookEventType): string {
    return hookType; // pass-through generic names
  }

  getToolName(toolType: ToolType): string {
    const map: Record<ToolType, string> = {
      backgroundOutput: 'bg_output',
      backgroundStatus: 'bg_status',
      backgroundCancel: 'bg_cancel',
      stopContinuation: '/stop-loop',
      task: 'task',
      read: 'read',
      edit: 'edit',
      write: 'write',
      bash: 'bash',
    };
    return this.config.toolMappings?.[toolType] ?? map[toolType];
  }

  getDefaultModel(): string {
    return 'default';
  }

  mapModelTier(tier: ModelTier): string {
    return this.config.modelMappings?.[tier] ?? 'default';
  }

  getDefaultFallbackChain(): string[] {
    return this.config.fallbackChain ?? [];
  }

  getRequiredEnvVars(): string[] {
    return ['OMC_SESSION_ID'];
  }
}
