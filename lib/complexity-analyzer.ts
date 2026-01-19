/**
 * 任务复杂度分析模块
 * 用于评估任务复杂度，帮助选择合适的执行策略
 */

import { z } from 'zod';

// ==================== Zod 验证 Schema ====================

const TaskDescriptionSchema = z.string().max(10000);
const ComplexityAnalysisSchema = z.object({
  score: z.number().min(0).max(10),
  level: z.enum(['低', '中', '高']),
  factors: z.array(z.string()),
  maxScore: z.number()
});

// ==================== 类型定义 ====================

export interface ComplexityAnalysis {
  score: number;
  level: '低' | '中' | '高';
  factors: string[];
  maxScore: number;
}

// ==================== 任务复杂度分析 ====================

/**
 * 任务复杂度分析 (带 Zod 验证)
 * 分析任务描述，返回复杂度评估结果
 *
 * @param taskDescription - 任务描述文本
 * @returns 复杂度分析结果，包含分数、等级、因素和最大分数
 */
export function analyzeTaskComplexity(taskDescription: string): ComplexityAnalysis {
  const validatedDescription = TaskDescriptionSchema.parse(taskDescription);

  if (!validatedDescription.trim()) {
    return { score: 0, level: '低', factors: ['空任务描述'], maxScore: 10 };
  }

  let complexity = 0;
  const factors: string[] = [];

  // 任务规模分析
  if (validatedDescription.match(/(完整|整个|全部|系统|平台)/i)) {
    complexity += 3;
    factors.push('大规模系统开发 (+3)');
  } else if (validatedDescription.match(/(模块|功能|页面)/i)) {
    complexity += 2;
    factors.push('中等规模功能开发 (+2)');
  } else {
    complexity += 1;
    factors.push('小型任务 (+1)');
  }

  // 技术复杂度分析
  if (validatedDescription.match(/(架构|设计|重构|优化|性能|安全|测试)/i)) {
    complexity += 2;
    factors.push('涉及架构/设计层面 (+2)');
  } else if (validatedDescription.match(/(数据库|API|集成|第三方)/i)) {
    complexity += 1.5;
    factors.push('涉及技术集成 (+1.5)');
  }

  // 依赖关系复杂度
  if (validatedDescription.match(/(电商|管理系统|多模块|微服务)/i)) {
    complexity += 2;
    factors.push('高度耦合的多模块系统 (+2)');
  } else if (validatedDescription.match(/(前后端|数据库|缓存)/i)) {
    complexity += 1;
    factors.push('涉及多层架构 (+1)');
  }

  // 风险评估
  if (validatedDescription.match(/(生产|线上|重要|紧急)/i)) {
    complexity += 1.5;
    factors.push('高风险/高优先级任务 (+1.5)');
  } else if (validatedDescription.match(/(新功能|实验|测试)/i)) {
    complexity += 0.5;
    factors.push('中等风险任务 (+0.5)');
  }

  // 时间压力
  if (validatedDescription.match(/(快速|紧急|deadline|尽快)/i)) {
    complexity += 1;
    factors.push('时间压力较大 (+1)');
  }

  complexity = Math.min(complexity, 10);

  let level: '低' | '中' | '高' = '低';
  if (complexity >= 7) level = '高';
  else if (complexity >= 4) level = '中';

  return ComplexityAnalysisSchema.parse({ score: complexity, level, factors, maxScore: 10 });
}
