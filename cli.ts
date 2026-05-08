#!/usr/bin/env node
/**
 * Atlas 编排引擎 CLI
 * 供 bash 钩子调用：node dist/lib/atlas/cli.js --action=<action> [args]
 */

import './provider-init.js'; // bootstrap provider detection
import { BoulderStateManager } from './boulder-state.js';
import { ContinuationInjector } from './continuation-injector.js';

const action = process.argv.find(a => a.startsWith('--action='))?.split('=')[1];

function main(): void {
  switch (action) {
    case 'start-plan': {
      const name = process.argv.find(a => a.startsWith('--name='))?.split('=')[1] || 'unnamed';
      const state = BoulderStateManager.startPlan(name);
      console.log(JSON.stringify({ ok: true, planName: state.planName }));
      break;
    }
    case 'add-session': {
      const sessionId = process.argv.find(a => a.startsWith('--session='))?.split('=')[1] || '';
      const origin = process.argv.find(a => a.startsWith('--origin='))?.split('=')[1] || 'direct';
      const state = BoulderStateManager.appendSession(sessionId, origin as 'direct' | 'appended');
      console.log(JSON.stringify({ ok: true, totalSessions: state.sessionIds.length }));
      break;
    }
    case 'upsert-task': {
      const taskJson = process.argv.find(a => a.startsWith('--task='))?.split('=')[1];
      if (!taskJson) {
        console.log(JSON.stringify({ error: 'missing --task parameter' }));
        process.exit(1);
      }
      const taskState = JSON.parse(Buffer.from(taskJson, 'base64').toString('utf-8'));
      const state = BoulderStateManager.upsertTaskSession(taskState);
      console.log(JSON.stringify({ ok: true, completed: state.completedTasks, total: state.totalTasks }));
      break;
    }
    case 'progress': {
      const progress = BoulderStateManager.getPlanProgress();
      console.log(JSON.stringify(progress));
      break;
    }
    case 'is-complete': {
      const complete = BoulderStateManager.isPlanComplete();
      console.log(JSON.stringify({ complete }));
      break;
    }
    case 'build-continuation': {
      const planName = process.argv.find(a => a.startsWith('--plan='))?.split('=')[1] || '';
      const remaining = parseInt(process.argv.find(a => a.startsWith('--remaining='))?.split('=')[1] || '0', 10);
      const total = parseInt(process.argv.find(a => a.startsWith('--total='))?.split('=')[1] || '0', 10);
      const sessionId = process.argv.find(a => a.startsWith('--session='))?.split('=')[1] || '';
      const prompt = ContinuationInjector.buildContinuationPrompt({
        planName,
        remaining,
        total,
        percent: total > 0 ? Math.round(((total - remaining) / total) * 100) : 0,
        recentSessionId: sessionId,
      });
      console.log(JSON.stringify({ prompt }));
      break;
    }
    case 'check-approval': {
      const result = ContinuationInjector.checkForFinalWaveApproval();
      console.log(JSON.stringify(result));
      break;
    }
    case 'approve': {
      const state = BoulderStateManager.approveFinalWave();
      console.log(JSON.stringify({ ok: true, approved: state.finalWaveApproved }));
      break;
    }
    case 'append-lineage': {
      const sessionId = process.argv.find(a => a.startsWith('--session='))?.split('=')[1] || '';
      const parent = process.argv.find(a => a.startsWith('--parent='))?.split('=')[1] || '';
      const plan = process.argv.find(a => a.startsWith('--plan='))?.split('=')[1] || '';
      const event = process.argv.find(a => a.startsWith('--event='))?.split('=')[1] || 'created';
      BoulderStateManager.appendLineage({ sessionId, parentSessionId: parent || undefined, planName: plan, event: event as any });
      console.log(JSON.stringify({ ok: true }));
      break;
    }
    case 'read-lineage': {
      const lineage = BoulderStateManager.readLineage();
      console.log(JSON.stringify(lineage));
      break;
    }
    case 'clear': {
      BoulderStateManager.clearBoulderState();
      console.log(JSON.stringify({ ok: true }));
      break;
    }
    case 'state': {
      const state = BoulderStateManager.readBoulderState();
      console.log(JSON.stringify(state));
      break;
    }
    default:
      console.log(JSON.stringify({
        error: 'unknown action',
        validActions: [
          'start-plan', 'add-session', 'upsert-task', 'progress', 'is-complete',
          'build-continuation', 'check-approval', 'approve', 'append-lineage',
          'read-lineage', 'clear', 'state',
        ],
      }));
      process.exit(1);
  }
}

main();
