/**
 * logger.js 单元测试
 *
 * 测试范围：
 * - colors 对象的颜色码定义
 * - log 函数的颜色输出
 * - success, error, info, warn 辅助函数
 */

const { colors, log, success, error, info, warn } = require('../scripts/logger');

describe('logger.js 共享日志模块', () => {
  let consoleLogSpy;

  beforeEach(() => {
    // 捕获 console.log 输出
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('colors 对象', () => {
    test('包含所有必需的颜色码', () => {
      expect(colors).toHaveProperty('reset');
      expect(colors).toHaveProperty('red');
      expect(colors).toHaveProperty('green');
      expect(colors).toHaveProperty('yellow');
      expect(colors).toHaveProperty('blue');
      expect(colors).toHaveProperty('cyan');
    });

    test('颜色码格式正确（ANSI 转义序列）', () => {
      expect(colors.reset).toBe('\x1b[0m');
      expect(colors.red).toBe('\x1b[31m');
      expect(colors.green).toBe('\x1b[32m');
      expect(colors.yellow).toBe('\x1b[33m');
      expect(colors.blue).toBe('\x1b[34m');
      expect(colors.cyan).toBe('\x1b[36m');
    });
  });

  describe('log 函数', () => {
    test('默认使用 reset 颜色', () => {
      log('测试消息');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.reset}测试消息${colors.reset}`
      );
    });

    test('支持指定颜色', () => {
      log('红色消息', 'red');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.red}红色消息${colors.reset}`
      );
    });

    test('支持所有预定义颜色', () => {
      const colorNames = ['reset', 'red', 'green', 'yellow', 'blue', 'cyan'];

      colorNames.forEach((colorName) => {
        consoleLogSpy.mockClear();
        log('测试', colorName);
        expect(consoleLogSpy).toHaveBeenCalledWith(
          `${colors[colorName]}测试${colors.reset}`
        );
      });
    });

    test('处理空消息', () => {
      log('');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.reset}${colors.reset}`
      );
    });

    test('处理特殊字符', () => {
      const specialMsg = '中文 English 123 !@#$%';
      log(specialMsg, 'cyan');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.cyan}${specialMsg}${colors.reset}`
      );
    });
  });

  describe('success 函数', () => {
    test('输出绿色成功消息带 ✅ 图标', () => {
      success('操作成功');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.green}✅ 操作成功${colors.reset}`
      );
    });

    test('处理空消息', () => {
      success('');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.green}✅ ${colors.reset}`
      );
    });
  });

  describe('error 函数', () => {
    test('输出红色错误消息带 ❌ 图标', () => {
      error('发生错误');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.red}❌ 发生错误${colors.reset}`
      );
    });

    test('处理错误对象消息', () => {
      error('Error: ENOENT');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.red}❌ Error: ENOENT${colors.reset}`
      );
    });
  });

  describe('info 函数', () => {
    test('输出蓝色信息消息带 ℹ️ 图标', () => {
      info('提示信息');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.blue}ℹ️  提示信息${colors.reset}`
      );
    });
  });

  describe('warn 函数', () => {
    test('输出黄色警告消息带 ⚠️ 图标', () => {
      warn('警告信息');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${colors.yellow}⚠️  警告信息${colors.reset}`
      );
    });
  });

  describe('模块导出', () => {
    test('导出所有必需的函数和对象', () => {
      const logger = require('../scripts/logger');

      expect(typeof logger.colors).toBe('object');
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.success).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });
  });
});
