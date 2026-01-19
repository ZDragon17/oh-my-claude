/**
 * UI 消息输出模块测试
 */

import {
  printDivider,
  printTitle,
  printCommandTitle,
  printVersion,
  printIssuesLink,
  printSuccess,
  printInstallComplete,
  printUpdateComplete,
  printHelp
} from '../lib/ui/messages';

describe('UI 消息输出模块', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('printDivider', () => {
    test('应该打印默认分隔线', () => {
      printDivider();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('应该打印指定颜色的分隔线', () => {
      printDivider('green');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('应该打印长分隔线', () => {
      printDivider('cyan', true);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('应该打印短分隔线', () => {
      printDivider('cyan', false);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('printTitle', () => {
    test('应该打印标题', () => {
      printTitle('测试标题');
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('测试标题');
    });

    test('应该使用指定颜色', () => {
      printTitle('标题', 'green');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('printCommandTitle', () => {
    test('应该打印命令标题', () => {
      printCommandTitle('命令标题');
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('命令标题');
      expect(output).toContain('🏔️');
    });
  });

  describe('printVersion', () => {
    test('应该打印版本号', () => {
      printVersion();
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('oh-my-claude');
      expect(output).toContain('v');
    });
  });

  describe('printIssuesLink', () => {
    test('应该打印 GitHub Issues 链接', () => {
      printIssuesLink();
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('github.com');
      expect(output).toContain('issues');
    });
  });

  describe('printSuccess', () => {
    test('应该打印成功信息', () => {
      printSuccess();
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('🎉');
    });

    test('应该打印自定义成功信息', () => {
      printSuccess('自定义成功消息');
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('自定义成功消息');
    });
  });

  describe('printInstallComplete', () => {
    test('应该打印安装完成信息', () => {
      printInstallComplete('/path/to/plugin', '/path/to/commands', '/path/to/skills');
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('安装完成');
      expect(output).toContain('/path/to/commands');
      expect(output).toContain('/path/to/skills');
      expect(output).toContain('/path/to/plugin');
    });

    test('应该包含快速开始说明', () => {
      printInstallComplete('/a', '/b', '/c');
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('快速开始');
      expect(output).toContain('/yishan');
      expect(output).toContain('/zhuge');
    });

    test('应该包含故障排除说明', () => {
      printInstallComplete('/a', '/b', '/c');
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('故障排除');
    });
  });

  describe('printUpdateComplete', () => {
    test('应该打印更新完成信息', () => {
      printUpdateComplete();
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('更新完成');
    });

    test('应该包含重启提示', () => {
      printUpdateComplete();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('重启');
    });
  });

  describe('printHelp', () => {
    test('应该打印帮助信息', () => {
      printHelp();
      expect(consoleLogSpy).toHaveBeenCalled();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('oh-my-claude');
    });

    test('应该包含命令列表', () => {
      printHelp();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('install');
      expect(output).toContain('uninstall');
      expect(output).toContain('update');
      expect(output).toContain('verify');
      expect(output).toContain('config');
    });

    test('应该包含别名', () => {
      printHelp();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('别名');
    });

    test('应该包含示例', () => {
      printHelp();
      
      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('示例');
      expect(output).toContain('npx');
    });
  });
});
