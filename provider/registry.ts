/**
 * Provider Registry
 * Auto-detects the active AI tool and provides uniform access to the provider.
 */

import { AiToolProvider, ProviderConfig, ProviderId } from './interface.js';
import { ClaudeCodeProvider } from './claude-code.js';
import { CodexProvider } from './codex.js';
import { GenericProvider } from './generic.js';

export class ProviderRegistry {
  private providers: AiToolProvider[] = [];
  private current: AiToolProvider | null = null;
  private config: ProviderConfig;

  constructor(config?: ProviderConfig) {
    this.config = config ?? {};
    this.register(new ClaudeCodeProvider(config));
    this.register(new CodexProvider(config));
    this.register(new GenericProvider(config));
  }

  register(provider: AiToolProvider): void {
    this.providers.push(provider);
  }

  detect(): AiToolProvider {
    if (this.current) return this.current;

    // 1. Explicit override
    if (this.config.provider) {
      const found = this.providers.find(p => p.providerId === this.config.provider);
      if (found) {
        this.current = found;
        return found;
      }
    }

    // 2. Auto-detection (first match wins; Generic never auto-detects)
    for (const provider of this.providers) {
      if (provider.detect()) {
        this.current = provider;
        return provider;
      }
    }

    // 3. Fallback to generic
    this.current = this.providers.find(p => p.providerId === 'generic')!;
    return this.current;
  }

  getProvider(): AiToolProvider {
    return this.detect();
  }

  setProvider(providerId: ProviderId): void {
    const found = this.providers.find(p => p.providerId === providerId);
    if (found) this.current = found;
  }

  reset(): void {
    this.current = null;
  }
}

let _registry: ProviderRegistry | null = null;

export function getProviderRegistry(config?: ProviderConfig): ProviderRegistry {
  if (!_registry) {
    _registry = new ProviderRegistry(config);
  }
  return _registry;
}

export function getProvider(config?: ProviderConfig): AiToolProvider {
  return getProviderRegistry(config).getProvider();
}

export function resetProvider(): void {
  if (_registry) _registry.reset();
  _registry = null;
}
