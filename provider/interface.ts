/**
 * AI Tool Provider Interface
 * Abstract all CLI-specific behavior behind a uniform interface.
 */

import * as path from 'path';
import * as os from 'os';

// ---- Shared Types -----------------------------------------------------------

export type ModelTier = 'flagship' | 'balanced' | 'fast' | 'cheap';

export type HookEventType =
  | 'preToolUse'
  | 'postToolUse'
  | 'userPromptSubmit'
  | 'sessionStart'
  | 'stop';

export type ProviderId = 'claude-code' | 'codex' | 'generic';

export type ToolType =
  | 'backgroundOutput'
  | 'backgroundStatus'
  | 'backgroundCancel'
  | 'stopContinuation'
  | 'task'
  | 'read'
  | 'edit'
  | 'write'
  | 'bash';

export interface HookInput {
  prompt?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: string;
  model?: string;
  agent?: string;
  command?: string;
}

export interface PermissionDecision {
  action: 'allow' | 'deny' | 'block';
  reason?: string;
}

export interface HookOutput {
  systemMessage?: string;
  additionalContext?: string;
  permissionDecision?: PermissionDecision;
  hookSpecificOutput?: Record<string, unknown>;
}

export interface ProviderConfig {
  provider?: ProviderId;
  pluginDir?: string;
  stateDir?: string;
  modelMappings?: Partial<Record<ModelTier, string>>;
  fallbackChain?: string[];
  toolMappings?: Partial<Record<ToolType, string>>;
}

// ---- Provider Interface -----------------------------------------------------

export interface AiToolProvider {
  readonly providerId: ProviderId;
  readonly displayName: string;

  // Detection
  detect(): boolean;

  // Session
  getSessionId(): string;

  // Paths
  getPluginDir(): string;
  getStateDir(): string;
  getConfigDir(): string;
  getCacheDir(): string;
  getCliEntryPoint(module: string): string;

  // Input/Output
  parseHookInput(stdin: string): HookInput;
  formatSystemMessage(text: string): string;
  formatPermissionDecision(decision: PermissionDecision): string | null;
  formatFullOutput(output: HookOutput): string;

  // Events
  getHookEventName(hookType: HookEventType): string;
  supportsHookType(hookType: HookEventType): boolean;

  // Tools
  getToolName(toolType: ToolType): string;

  // Models
  getDefaultModel(): string;
  mapModelTier(tier: ModelTier): string;
  getDefaultFallbackChain(): string[];

  // Environment
  getRequiredEnvVars(): string[];
}

// ---- Base Provider (shared utilities) ---------------------------------------

export abstract class BaseProvider implements AiToolProvider {
  abstract readonly providerId: ProviderId;
  abstract readonly displayName: string;

  protected config: ProviderConfig;

  constructor(config?: ProviderConfig) {
    this.config = config ?? {};
  }

  abstract detect(): boolean;
  abstract getSessionId(): string;
  abstract getPluginDir(): string;
  abstract getStateDir(): string;
  abstract parseHookInput(stdin: string): HookInput;
  abstract formatSystemMessage(text: string): string;
  abstract formatPermissionDecision(decision: PermissionDecision): string | null;
  abstract formatFullOutput(output: HookOutput): string;
  abstract getHookEventName(hookType: HookEventType): string;
  abstract getToolName(toolType: ToolType): string;
  abstract getDefaultModel(): string;
  abstract mapModelTier(tier: ModelTier): string;
  abstract getDefaultFallbackChain(): string[];

  getConfigDir(): string {
    return path.join(this.getStateDir(), 'config');
  }

  getCacheDir(): string {
    return path.join(this.getStateDir(), 'cache');
  }

  getCliEntryPoint(module: string): string {
    return path.join(this.getPluginDir(), 'dist', 'lib', module, 'cli.js');
  }

  supportsHookType(_hookType: HookEventType): boolean {
    return true;
  }

  getRequiredEnvVars(): string[] {
    return [];
  }
}
