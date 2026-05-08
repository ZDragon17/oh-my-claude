#!/usr/bin/env node
/**
 * Todo Enforcer CLI
 * node dist/lib/todo/cli.js --action=<action> [args]
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCurrentProvider } from './provider-init.js';

const provider = getCurrentProvider();
const STATE_DIR = path.join(provider.getStateDir(), 'state');

function arg(name: string): string {
  return process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || '';
}

const action = process.argv.find(a => a.startsWith('--action='))?.split('=')[1];

function main(): void {
  switch (action) {
    case 'check': {
      const sessionId = arg('session') || provider.getSessionId();
      const expectedHash = arg('hash') || '';

      // Read current enforcer state
      const statePath = path.join(STATE_DIR, 'enforcer-state.json');
      let shouldContinue = true;
      let reason = 'todos_incomplete';

      try {
        if (fs.existsSync(statePath)) {
          const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
          const failures = state.consecutiveFailures || 0;
          const stagnation = state.stagnationCount || 0;
          const maxStagnation = state.stagnationThreshold || 3;

          if (failures >= 5) {
            shouldContinue = false;
            reason = 'max_failures_exceeded';
          } else if (stagnation >= maxStagnation) {
            shouldContinue = false;
            reason = 'stagnation_detected';
          } else if (state.cooldownUntil) {
            const cooldownUntil = new Date(state.cooldownUntil);
            if (cooldownUntil > new Date()) {
              shouldContinue = false;
              reason = 'compaction_cooldown';
            }
          }
        }
      } catch { /* defaults */ }

      const backoffSeconds = Math.min(Math.pow(2, (JSON.parse(fs.existsSync(path.join(STATE_DIR, 'enforcer-state.json')) ? fs.readFileSync(path.join(STATE_DIR, 'enforcer-state.json'), 'utf-8') : '{"consecutiveFailures":0}').consecutiveFailures || 0)) * 2, 120);

      console.log(JSON.stringify({ shouldContinue, reason, backoffSeconds }));
      break;
    }
    case 'reset': {
      const sessionId = arg('session') || provider.getSessionId();
      const statePath = path.join(STATE_DIR, 'enforcer-state.json');
      try {
        if (fs.existsSync(statePath)) {
          const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
          state.consecutiveFailures = 0;
          state.stagnationCount = 0;
          state.cooldownUntil = null;
          fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
        }
      } catch { /* ignore */ }
      console.log(JSON.stringify({ ok: true }));
      break;
    }
    default:
      console.log(JSON.stringify({
        error: 'unknown action',
        validActions: ['check', 'reset'],
      }));
      process.exit(1);
  }
}

main();
