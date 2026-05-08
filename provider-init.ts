/**
 * Provider Initialization
 * Bootstrap the provider system for TypeScript modules.
 * Import from this file to get the current provider instance.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AiToolProvider, ProviderConfig } from './provider/interface.js';
import { getProvider } from './provider/registry.js';

const CONFIG_PATH = path.join(os.homedir(), '.oh-my-claude', 'config', 'provider.json');

function loadConfig(): ProviderConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as ProviderConfig;
    }
  } catch {
    // use defaults
  }
  return {};
}

let _provider: AiToolProvider | null = null;

export function initProvider(config?: ProviderConfig): AiToolProvider {
  if (!_provider) {
    const merged = { ...loadConfig(), ...config };
    _provider = getProvider(merged);
  }
  return _provider;
}

export function getCurrentProvider(): AiToolProvider {
  return initProvider();
}

export function resetCurrentProvider(): void {
  _provider = null;
}
