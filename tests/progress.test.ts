/**
 * 进度显示器模块测试
 */

import { ProgressIndicator } from '../lib/ui/progress';

describe('ProgressIndicator', () => {
  // Mock process.stdout.write 和 process.stdout.isTTY
  let stdoutWriteSpy: jest.SpyInstance;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    originalIsTTY = process.stdout.isTTY;
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
    // 恢复 isTTY
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalIsTTY,
      writable: true,
      configurable: true
    });
  });

  describe('构造函数', () => {
    test('应该正确初始化进度指示器', () => {
      const progress = new ProgressIndicator(10, '测试进度');

      expect(progress.getPercent()).toBe(0);
      expect(progress.getElapsedTime()).toBeGreaterThanOrEqual(0);
    });

    test('应该接受默认描述', () => {
      const progress = new ProgressIndicator(5);

      expect(progress.getPercent()).toBe(0);
    });
  });

  describe('update', () => {
    test('应该增加当前步骤', () => {
      const progress = new ProgressIndicator(4);

      expect(progress.getPercent()).toBe(0);

      progress.update('步骤 1');
      expect(progress.getPercent()).toBe(25);

      progress.update('步骤 2');
      expect(progress.getPercent()).toBe(50);

      progress.update('步骤 3');
      expect(progress.getPercent()).toBe(75);

      progress.update('步骤 4');
      expect(progress.getPercent()).toBe(100);
    });

    test('在交互式终端应该写入进度条', () => {
      // 模拟交互式终端
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      const progress = new ProgressIndicator(2);
      progress.update('测试');

      expect(stdoutWriteSpy).toHaveBeenCalled();
      const output = stdoutWriteSpy.mock.calls[0][0];
      expect(output).toContain('\r'); // 回车覆盖
      expect(output).toContain('%'); // 百分比
    });

    test('在非交互式终端应该输出日志行', () => {
      // 模拟非交互式终端
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true
      });

      const progress = new ProgressIndicator(2);
      progress.update('测试步骤');

      // 非交互式模式会调用 info()，最终也会写入 stdout
      // 我们主要验证 update 不会抛出错误
      expect(progress.getPercent()).toBe(50);
    });

    test('应该接受空描述', () => {
      const progress = new ProgressIndicator(2);

      expect(() => progress.update()).not.toThrow();
      expect(progress.getPercent()).toBe(50);
    });
  });

  describe('complete', () => {
    test('应该完成进度显示', () => {
      const progress = new ProgressIndicator(2);
      progress.update();
      progress.update();

      expect(() => progress.complete('完成！')).not.toThrow();
    });

    test('应该使用默认完成消息', () => {
      const progress = new ProgressIndicator(1);
      progress.update();

      expect(() => progress.complete()).not.toThrow();
    });

    test('在交互式终端应该清除进度行', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      const progress = new ProgressIndicator(1);
      progress.update();
      progress.complete();

      // 应该调用 write 来清除行
      expect(stdoutWriteSpy).toHaveBeenCalled();
    });
  });

  describe('fail', () => {
    test('应该显示失败消息', () => {
      const progress = new ProgressIndicator(2);
      progress.update();

      expect(() => progress.fail('操作失败')).not.toThrow();
    });

    test('应该使用默认失败消息', () => {
      const progress = new ProgressIndicator(1);

      expect(() => progress.fail()).not.toThrow();
    });

    test('在交互式终端应该清除进度行', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });

      const progress = new ProgressIndicator(1);
      progress.fail('失败');

      expect(stdoutWriteSpy).toHaveBeenCalled();
    });
  });

  describe('getPercent', () => {
    test('应该返回正确的百分比', () => {
      const progress = new ProgressIndicator(10);

      expect(progress.getPercent()).toBe(0);

      for (let i = 1; i <= 10; i++) {
        progress.update();
        expect(progress.getPercent()).toBe(i * 10);
      }
    });

    test('应该正确处理非整数百分比', () => {
      const progress = new ProgressIndicator(3);

      progress.update();
      expect(progress.getPercent()).toBe(33); // 1/3 ≈ 33%

      progress.update();
      expect(progress.getPercent()).toBe(67); // 2/3 ≈ 67%

      progress.update();
      expect(progress.getPercent()).toBe(100);
    });
  });

  describe('getElapsedTime', () => {
    test('应该返回非负的经过时间', () => {
      const progress = new ProgressIndicator(2);

      const elapsed = progress.getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    test('应该随时间增加', async () => {
      const progress = new ProgressIndicator(2);
      const initialTime = progress.getElapsedTime();

      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 50));

      const laterTime = progress.getElapsedTime();
      expect(laterTime).toBeGreaterThan(initialTime);
    });
  });

  describe('边界情况', () => {
    test('应该处理 1 步进度', () => {
      const progress = new ProgressIndicator(1);
      
      expect(progress.getPercent()).toBe(0);
      progress.update();
      expect(progress.getPercent()).toBe(100);
    });

    test('应该处理大量步骤', () => {
      const progress = new ProgressIndicator(1000);

      for (let i = 0; i < 500; i++) {
        progress.update();
      }

      expect(progress.getPercent()).toBe(50);
    });
  });
});
