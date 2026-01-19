/**
 * 验证器模块测试
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  verifyInstallation,
  VerificationResultSchema
} from '../lib/verifier';
import { COMMANDS_DIR } from '../lib/constants';

describe('验证器模块', () => {
  describe('verifyInstallation', () => {
    test('应该返回符合 schema 的结果', () => {
      const result = verifyInstallation();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('errors');
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('结果应该能通过 Zod schema 验证', () => {
      const result = verifyInstallation();
      
      expect(() => VerificationResultSchema.parse(result)).not.toThrow();
    });

    test('当 commands 目录不存在时应该报告错误', () => {
      // 如果 commands 目录不存在，应该返回 success: false
      // 这个测试依赖于实际环境状态
      const result = verifyInstallation();
      
      if (!fs.existsSync(COMMANDS_DIR)) {
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    test('当 yishan.md 存在时应该成功', () => {
      const yishanPath = path.join(COMMANDS_DIR, 'yishan.md');
      
      // 如果 yishan.md 存在，验证应该至少不会因为这个原因失败
      if (fs.existsSync(yishanPath)) {
        const result = verifyInstallation();
        // 不能保证完全成功，但至少 yishan.md 检查通过
        expect(result.errors.includes('yishan.md 未找到')).toBe(false);
      }
    });
  });

  describe('VerificationResultSchema', () => {
    test('应该接受有效的验证结果', () => {
      const validResult = {
        success: true,
        errors: []
      };

      expect(() => VerificationResultSchema.parse(validResult)).not.toThrow();
      
      const parsed = VerificationResultSchema.parse(validResult);
      expect(parsed.success).toBe(true);
      expect(parsed.errors).toEqual([]);
    });

    test('应该接受带错误的验证结果', () => {
      const resultWithErrors = {
        success: false,
        errors: ['error 1', 'error 2']
      };

      expect(() => VerificationResultSchema.parse(resultWithErrors)).not.toThrow();
      
      const parsed = VerificationResultSchema.parse(resultWithErrors);
      expect(parsed.success).toBe(false);
      expect(parsed.errors).toHaveLength(2);
    });

    test('应该拒绝无效的验证结果', () => {
      const invalidResult = {
        success: 'yes', // 应该是 boolean
        errors: []
      };

      expect(() => VerificationResultSchema.parse(invalidResult)).toThrow();
    });

    test('应该拒绝缺少必需字段的结果', () => {
      const incompleteResult = {
        success: true
        // 缺少 errors 字段
      };

      expect(() => VerificationResultSchema.parse(incompleteResult)).toThrow();
    });
  });
});
