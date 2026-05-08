#!/usr/bin/env node
/**
 * Model Fallback CLI
 * node dist/lib/model-fallback/cli.js --action=<action> [args]
 */

import './provider-init.js';
import { ModelFallbackController } from './state-controller.js';

const action = process.argv.find(a => a.startsWith('--action='))?.split('=')[1];

function arg(name: string): string {
  return process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || '';
}

function main(): void {
  switch (action) {
    case 'classify': {
      const errorMsg = arg('error') || arg('error-msg') || '';
      console.log(JSON.stringify({ classification: ModelFallbackController.classifyModelError(errorMsg) }));
      break;
    }
    case 'set-pending': {
      const sessionId = arg('session') || '';
      const model = arg('model') || '';
      const error = arg('error') || '';
      const agent = arg('agent') || undefined;
      const state = ModelFallbackController.setPendingFallback(sessionId, model, error, agent);
      console.log(JSON.stringify(state));
      break;
    }
    case 'next': {
      const sessionId = arg('session') || '';
      const next = ModelFallbackController.getNextFallback(sessionId);
      console.log(JSON.stringify({ next }));
      break;
    }
    case 'apply': {
      const sessionId = arg('session') || '';
      const state = ModelFallbackController.applyFallback(sessionId);
      console.log(JSON.stringify(state || { applied: false }));
      break;
    }
    case 'clear': {
      const sessionId = arg('session') || '';
      ModelFallbackController.clearFallback(sessionId);
      console.log(JSON.stringify({ ok: true }));
      break;
    }
    case 'clear-all': {
      ModelFallbackController.clearAllFallbacks();
      console.log(JSON.stringify({ ok: true }));
      break;
    }
    case 'state': {
      const sessionId = arg('session') || '';
      console.log(JSON.stringify(ModelFallbackController.getSessionState(sessionId)));
      break;
    }
    default:
      console.log(JSON.stringify({
        error: 'unknown action',
        validActions: ['classify', 'set-pending', 'next', 'apply', 'clear', 'clear-all', 'state'],
      }));
      process.exit(1);
  }
}

main();
