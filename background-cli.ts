#!/usr/bin/env node
/**
 * Background Task CLI
 * node dist/lib/background/cli.js --action=<action> [args]
 */

import './provider-init.js';
import { BackgroundManager } from './manager.js';

const action = process.argv.find(a => a.startsWith('--action='))?.split('=')[1];

function arg(name: string): string {
  return process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || '';
}

function main(): void {
  switch (action) {
    case 'launch': {
      const task = BackgroundManager.launch({
        agent: arg('agent') || 'default',
        prompt: arg('prompt') || '',
        model: arg('model') || undefined,
        description: arg('description') || undefined,
        priority: (arg('priority') as 'high' | 'normal' | 'low') || 'normal',
        maxRetries: parseInt(arg('max-retries')) || 3,
        category: arg('category') || undefined,
      });
      console.log(JSON.stringify(task));
      break;
    }
    case 'stats': {
      console.log(JSON.stringify(BackgroundManager.getStats()));
      break;
    }
    case 'parent-tasks': {
      const parentId = arg('parent') || '';
      const tasks = BackgroundManager.getTasksByParentSession(parentId);
      console.log(JSON.stringify(tasks));
      break;
    }
    case 'schedule-retry': {
      const taskId = arg('task-id');
      if (!taskId) { console.log(JSON.stringify({ error: 'missing --task-id' })); process.exit(1); }
      console.log(JSON.stringify(BackgroundManager.scheduleRetry(taskId) || { error: 'not found' }));
      break;
    }
    case 'update-status': {
      const taskId = arg('task-id');
      const status = arg('status') as any;
      if (!taskId) { console.log(JSON.stringify({ error: 'missing --task-id' })); process.exit(1); }
      console.log(JSON.stringify(BackgroundManager.updateStatus(taskId, status, {
        lastError: arg('error') || undefined,
        resultSummary: arg('summary') || undefined,
      }) || { error: 'not found' }));
      break;
    }
    case 'cancel': {
      const taskId = arg('task-id');
      if (!taskId) { console.log(JSON.stringify({ error: 'missing --task-id' })); process.exit(1); }
      console.log(JSON.stringify(BackgroundManager.cancelTask(taskId) || { error: 'not found' }));
      break;
    }
    case 'cleanup': {
      const maxAge = parseInt(arg('max-age')) || 3600000;
      const cleaned = BackgroundManager.cleanupStale(maxAge);
      console.log(JSON.stringify({ cleaned }));
      break;
    }
    case 'read': {
      const taskId = arg('task-id');
      if (!taskId) { console.log(JSON.stringify({ error: 'missing --task-id' })); process.exit(1); }
      console.log(JSON.stringify(BackgroundManager.readTask(taskId) || { error: 'not found' }));
      break;
    }
    default:
      console.log(JSON.stringify({
        error: 'unknown action',
        validActions: ['launch', 'stats', 'parent-tasks', 'schedule-retry', 'update-status', 'cancel', 'cleanup', 'read'],
      }));
      process.exit(1);
  }
}

main();
