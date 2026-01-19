/**
 * 上下文压缩模块测试
 */

import {
  generateSummary,
  extractKeypoints,
  buildHierarchy,
  expandFromSummary,
  expandFromKeypoints,
  expandFromHierarchy,
  ContextCacheManager
} from '../lib/agent/context-compression';

describe('上下文压缩模块', () => {
  describe('generateSummary', () => {
    test('应该生成包含键数量的摘要', () => {
      const context = { a: 1, b: 2, c: 3 };
      const summary = generateSummary(context);

      expect(summary).toContain('3 items');
      expect(summary).toContain('a');
      expect(summary).toContain('b');
      expect(summary).toContain('c');
    });

    test('应该截断超过5个键的摘要', () => {
      const context = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 };
      const summary = generateSummary(context);

      expect(summary).toContain('7 items');
      expect(summary).toContain('...');
    });

    test('应该处理空对象', () => {
      const summary = generateSummary({});
      expect(summary).toContain('0 items');
    });
  });

  describe('extractKeypoints', () => {
    test('应该提取字符串和数字类型的键值对', () => {
      const context = {
        name: 'test',
        count: 42,
        active: true,
        longString: 'a'.repeat(200) // 超过100字符，应该被跳过
      };
      const keypoints = extractKeypoints(context);

      expect(keypoints).toContain('name: test');
      expect(keypoints).toContain('count: 42');
      expect(keypoints).toContain('active: true');
      expect(keypoints.some(k => k.includes('longString'))).toBe(false);
    });

    test('应该限制最多10个关键点', () => {
      const context: Record<string, number> = {};
      for (let i = 0; i < 20; i++) {
        context[`key${i}`] = i;
      }
      const keypoints = extractKeypoints(context);

      expect(keypoints.length).toBeLessThanOrEqual(10);
    });

    test('应该处理空对象', () => {
      const keypoints = extractKeypoints({});
      expect(keypoints).toEqual([]);
    });
  });

  describe('buildHierarchy', () => {
    test('应该构建对象类型的层次结构', () => {
      const context = {
        nested: { a: 1, b: 2 },
        simple: 'value'
      };
      const hierarchy = buildHierarchy(context);

      expect(hierarchy.nested).toEqual({
        type: 'object',
        keys: ['a', 'b']
      });
      expect(hierarchy.simple).toEqual({
        type: 'string',
        value: 'value'
      });
    });

    test('应该处理各种类型', () => {
      const context = {
        str: 'hello',
        num: 42,
        bool: true,
        nul: null
      };
      const hierarchy = buildHierarchy(context);

      expect((hierarchy.str as { type: string }).type).toBe('string');
      expect((hierarchy.num as { type: string }).type).toBe('number');
      expect((hierarchy.bool as { type: string }).type).toBe('boolean');
      expect((hierarchy.nul as { type: string }).type).toBe('object'); // null 的 typeof 是 'object'
    });
  });

  describe('expandFromSummary', () => {
    test('应该从摘要恢复上下文', () => {
      const summary = 'Context contains 3 items: a, b, c';
      const context = expandFromSummary(summary);

      expect(context.summary).toBe(summary);
      expect(context.reconstructed).toBe(true);
    });
  });

  describe('expandFromKeypoints', () => {
    test('应该从关键点恢复上下文', () => {
      const keypoints = ['name: test', 'count: 42'];
      const context = expandFromKeypoints(keypoints);

      expect(context.name).toBe('test');
      expect(context.count).toBe('42');
    });

    test('应该处理包含冒号的值', () => {
      const keypoints = ['time: 12:30:45'];
      const context = expandFromKeypoints(keypoints);

      expect(context.time).toBe('12:30:45');
    });

    test('应该跳过无效格式', () => {
      const keypoints = ['invalid', 'valid: value'];
      const context = expandFromKeypoints(keypoints);

      expect(context.valid).toBe('value');
      expect(Object.keys(context).length).toBe(1);
    });
  });

  describe('expandFromHierarchy', () => {
    test('应该从层次结构恢复上下文', () => {
      const hierarchy = {
        nested: { type: 'object', keys: ['a', 'b'] },
        simple: { type: 'string', value: 'test' }
      };
      const context = expandFromHierarchy(hierarchy);

      expect(context.nested).toEqual({
        placeholder: true,
        originalKeys: ['a', 'b']
      });
      expect(context.simple).toBe('test');
    });
  });

  describe('ContextCacheManager', () => {
    let cacheManager: ContextCacheManager;

    beforeEach(() => {
      cacheManager = new ContextCacheManager();
    });

    describe('compress', () => {
      test('应该使用 summary 算法压缩', () => {
        const context = { name: 'test', value: 42 };
        const compression = cacheManager.compress(context, 'summary');

        expect(compression.id).toMatch(/^ctx_/);
        expect(compression.algorithm).toBe('summary');
        expect(compression.originalSize).toBeGreaterThan(0);
        expect(compression.compressedSize).toBeGreaterThan(0);
        expect(compression.data.summary).toBeDefined();
      });

      test('应该使用 keypoints 算法压缩', () => {
        const context = { name: 'test', value: 42 };
        const compression = cacheManager.compress(context, 'keypoints');

        expect(compression.algorithm).toBe('keypoints');
        expect(compression.data.keypoints).toBeDefined();
      });

      test('应该使用 hierarchical 算法压缩', () => {
        const context = { name: 'test', nested: { a: 1 } };
        const compression = cacheManager.compress(context, 'hierarchical');

        expect(compression.algorithm).toBe('hierarchical');
        expect(compression.data.hierarchy).toBeDefined();
      });

      test('默认应该使用 summary 算法', () => {
        const context = { name: 'test' };
        const compression = cacheManager.compress(context);

        expect(compression.algorithm).toBe('summary');
      });
    });

    describe('retrieve', () => {
      test('应该检索压缩的上下文', () => {
        const context = { name: 'test', value: 42 };
        const compression = cacheManager.compress(context, 'keypoints');
        const retrieved = cacheManager.retrieve(compression.id);

        expect(retrieved).toBeDefined();
        expect(retrieved!.name).toBe('test');
        expect(retrieved!.value).toBe('42');
      });

      test('应该增加访问计数', () => {
        const compression = cacheManager.compress({ a: 1 });
        expect(compression.accessCount).toBe(0);

        cacheManager.retrieve(compression.id);
        const updated = cacheManager.get(compression.id);
        expect(updated!.accessCount).toBe(1);
      });

      test('不存在的 ID 应该返回 null', () => {
        const result = cacheManager.retrieve('non-existent-id');
        expect(result).toBeNull();
      });
    });

    describe('get/set', () => {
      test('应该存储和获取压缩对象', () => {
        const compression = cacheManager.compress({ test: 1 });
        const retrieved = cacheManager.get(compression.id);

        expect(retrieved).toBeDefined();
        expect(retrieved!.id).toBe(compression.id);
      });

      test('应该允许手动设置压缩对象', () => {
        const customCompression = {
          id: 'custom-id',
          originalSize: 100,
          compressedSize: 50,
          compressionRatio: 2,
          algorithm: 'summary' as const,
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          accessCount: 0,
          lastAccessed: new Date().toISOString(),
          data: { summary: 'test' }
        };

        cacheManager.set('custom-id', customCompression);
        const retrieved = cacheManager.get('custom-id');

        expect(retrieved).toEqual(customCompression);
      });
    });

    describe('cleanupExpired', () => {
      test('应该清理过期的缓存条目', () => {
        // 创建一个已过期的压缩对象
        const expiredCompression = {
          id: 'expired-id',
          originalSize: 100,
          compressedSize: 50,
          compressionRatio: 2,
          algorithm: 'summary' as const,
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString(), // 已过期
          accessCount: 0,
          lastAccessed: new Date().toISOString(),
          data: { summary: 'test' }
        };

        cacheManager.set('expired-id', expiredCompression);
        expect(cacheManager.get('expired-id')).toBeDefined();

        const cleaned = cacheManager.cleanupExpired();
        expect(cleaned).toBeGreaterThan(0);
        expect(cacheManager.get('expired-id')).toBeUndefined();
      });
    });

    describe('exportCache/importCache', () => {
      test('应该导出缓存数据', () => {
        cacheManager.compress({ a: 1 });
        cacheManager.compress({ b: 2 });

        const exported = cacheManager.exportCache();
        expect(Object.keys(exported).length).toBe(2);
      });

      test('应该导入缓存数据', () => {
        const data = {
          'imported-1': {
            id: 'imported-1',
            originalSize: 100,
            compressedSize: 50,
            compressionRatio: 2,
            algorithm: 'summary' as const,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60000).toISOString(),
            accessCount: 0,
            lastAccessed: new Date().toISOString(),
            data: { summary: 'imported' }
          }
        };

        cacheManager.importCache(data);
        const retrieved = cacheManager.get('imported-1');

        expect(retrieved).toBeDefined();
        expect(retrieved!.data.summary).toBe('imported');
      });
    });
  });
});
