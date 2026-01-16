/**
 * 复杂度分析函数单元测试
 */

import { analyzeTaskComplexity } from '../scripts/cli';

describe('复杂度分析功能', () => {
  test('应该正确分析简单任务的复杂度', () => {
    const result = analyzeTaskComplexity('实现用户登录功能');

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('factors');
    expect(result).toHaveProperty('maxScore');

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(['低', '中', '高']).toContain(result.level);
    expect(result.maxScore).toBe(10);
  });

  test('应该识别大规模系统开发任务', () => {
    const result = analyzeTaskComplexity('重构整个用户管理系统');

    expect(result.score).toBeGreaterThanOrEqual(5); // 应该有较高的复杂度
    expect(result.factors).toContain('大规模系统开发 (+3)');
  });

  test('应该识别技术复杂度任务', () => {
    const result = analyzeTaskComplexity('设计微服务架构');

    expect(result.factors).toContain('涉及架构/设计层面 (+2)');
    expect(result.level).toBe('中');
  });

  test('应该正确处理边界情况', () => {
    const result = analyzeTaskComplexity('');

    expect(result.score).toBe(0); // 空字符串应该返回最低复杂度
    expect(result.level).toBe('低');
  });

  test('应该限制最大复杂度分数', () => {
    // 创建一个包含所有高复杂度关键词的任务描述
    const complexTask = '完整的大型系统平台架构设计重构优化性能安全测试数据库API集成第三方电商微服务生产线上重要紧急';
    const result = analyzeTaskComplexity(complexTask);

    expect(result.score).toBeLessThanOrEqual(10); // 应该不超过最大值
    expect(result.maxScore).toBe(10);
  });
});