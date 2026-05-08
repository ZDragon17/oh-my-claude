/**
 * 继续注入器
 * 对标 oh-my-opencode boulder-continuation-injector
 *
 * 构建包含进度的继续提示
 */

import { BoulderStateManager } from './boulder-state.js';

interface ContinuationContext {
  planName: string;
  remaining: number;
  total: number;
  percent: number;
  recentSessionId?: string;
}

/**
 * 构建 boulder 继续提示
 */
function buildContinuationPrompt(ctx: ContinuationContext): string {
  const progress = BoulderStateManager.getPlanProgress();

  const lines = [
    '',
    '🪨 **Boulder 计划继续**',
    '',
    `📋 计划: **${ctx.planName}**`,
    `📊 进度: ${progress.completed}/${progress.total} (${progress.percent}%)`,
    `⏳ 剩余: ${progress.total - progress.completed} 个任务`,
    '',
  ];

  if (progress.total - progress.completed === 0) {
    lines.push('✅ **所有任务已完成!** 请进行最终验证。');
    lines.push('');
    lines.push('验证清单:');
    lines.push('- [ ] 所有文件已正确创建/修改');
    lines.push('- [ ] 测试通过');
    lines.push('- [ ] 无遗留的 TODO 或 FIXME');
    lines.push('- [ ] 提交信息准确反映了变更');
  } else {
    lines.push('**请继续执行剩余任务。**');
    lines.push('');
    lines.push('提示:');
    lines.push('- 使用 `task()` 委派子任务给专业 Agent');
    lines.push('- 完成每个子任务后进行验证');
    lines.push('- 遇到阻塞时上报');
  }

  if (ctx.recentSessionId) {
    lines.push('');
    lines.push(`💡 最近的会话: \`${ctx.recentSessionId}\``);
  }

  return lines.join('\n');
}

/**
 * 构建验证提醒
 */
function buildVerificationReminder(taskDescription: string): string {
  return [
    '',
    '🔍 **验证提醒**',
    '',
    `刚完成的任务: "${taskDescription}"`,
    '',
    '请在继续之前验证:',
    '1. 输出是否符合预期',
    '2. 没有引入新的错误',
    '3. 相关测试通过',
    '',
  ].join('\n');
}

/**
 * 检查是否需要最终波次审批
 */
function checkForFinalWaveApproval(): { needsApproval: boolean; reason: string } {
  const state = BoulderStateManager.readBoulderState();
  const progress = BoulderStateManager.getPlanProgress();

  if (state.finalWaveApproved) {
    return { needsApproval: false, reason: 'already_approved' };
  }

  if (!state.activePlan) {
    return { needsApproval: false, reason: 'no_active_plan' };
  }

  const remaining = progress.total - progress.completed;

  if (remaining === 0) {
    return { needsApproval: true, reason: 'all_tasks_complete - 最终波次审批需要用户确认' };
  }

  if (remaining <= 2 && progress.total > 3) {
    return { needsApproval: true, reason: `仅剩 ${remaining} 个任务 - 建议审批后再继续` };
  }

  return { needsApproval: false, reason: 'in_progress' };
}

export const ContinuationInjector = {
  buildContinuationPrompt,
  buildVerificationReminder,
  checkForFinalWaveApproval,
};
