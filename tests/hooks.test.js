/**
 * Shell Hooks 单元测试
 *
 * 测试范围：
 * - keyword-detector.sh: 关键词检测
 * - todo-enforcer.sh: TODO 强制执行
 * - progress-notifier.sh: 进度通知
 * - 路径安全验证
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');
const {
  createTempDir,
  cleanupTempDir,
} = require('./helpers/test-utils');

describe('Shell Hooks 测试', () => {
  let tempDir;
  const hooksDir = path.resolve(__dirname, '..', 'hooks');

  // 跳过在 Windows 上的 Shell 测试（除非有 bash）
  const hasBash = (() => {
    try {
      execSync('bash --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  })();

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  /**
   * 执行 Shell 脚本
   */
  const runHookScript = (scriptName, input = '', env = {}) => {
    if (!hasBash) {
      return { skip: true };
    }

    const scriptPath = path.join(hooksDir, scriptName);
    if (!fs.existsSync(scriptPath)) {
      return { skip: true, reason: 'Script not found' };
    }

    try {
      const result = spawnSync('bash', [scriptPath], {
        input,
        encoding: 'utf8',
        env: { ...process.env, ...env },
        timeout: 5000,
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        status: result.status,
        skip: false,
      };
    } catch (err) {
      return { error: err.message, skip: false };
    }
  };

  describe('keyword-detector.sh - 关键词检测', () => {
    const testKeywordDetection = (prompt, expectedKeyword) => {
      const input = JSON.stringify({ prompt });
      const result = runHookScript('keyword-detector.sh', input);

      if (result.skip) {
        return;
      }

      expect(result.status).toBe(0);
      if (expectedKeyword) {
        expect(result.stdout).toContain(expectedKeyword);
      }
    };

    test('检测愚公关键词', () => {
      if (!hasBash) {
        console.log('Skipping bash test on Windows without bash');
        return;
      }

      const input = JSON.stringify({ prompt: '愚公移山模式启动' });
      const result = runHookScript('keyword-detector.sh', input);

      if (!result.skip) {
        expect(result.stdout).toContain('愚公移山模式已激活');
      }
    });

    test('检测诸葛关键词', () => {
      if (!hasBash) return;

      const input = JSON.stringify({ prompt: '我需要架构设计帮助' });
      const result = runHookScript('keyword-detector.sh', input);

      if (!result.skip) {
        expect(result.stdout).toContain('诸葛顾问');
      }
    });

    test('检测鲁班关键词', () => {
      if (!hasBash) return;

      const input = JSON.stringify({ prompt: '前端组件开发' });
      const result = runHookScript('keyword-detector.sh', input);

      if (!result.skip) {
        expect(result.stdout).toContain('鲁班');
      }
    });

    test('检测调试关键词', () => {
      if (!hasBash) return;

      const input = JSON.stringify({ prompt: 'fix this bug please' });
      const result = runHookScript('keyword-detector.sh', input);

      if (!result.skip) {
        expect(result.stdout).toContain('扁鹊');
      }
    });

    test('检测安全关键词', () => {
      if (!hasBash) return;

      const input = JSON.stringify({ prompt: '安全漏洞检查' });
      const result = runHookScript('keyword-detector.sh', input);

      if (!result.skip) {
        expect(result.stdout).toContain('墨子');
      }
    });

    test('检测性能关键词', () => {
      if (!hasBash) return;

      const input = JSON.stringify({ prompt: '性能优化' });
      const result = runHookScript('keyword-detector.sh', input);

      if (!result.skip) {
        expect(result.stdout).toContain('孙子');
      }
    });

    test('无关键词时正常退出', () => {
      if (!hasBash) return;

      const input = JSON.stringify({ prompt: 'hello world' });
      const result = runHookScript('keyword-detector.sh', input);

      if (!result.skip) {
        expect(result.status).toBe(0);
        expect(result.stdout).toBe('');
      }
    });

    test('空输入处理', () => {
      if (!hasBash) return;

      const result = runHookScript('keyword-detector.sh', '');

      if (!result.skip) {
        expect(result.status).toBe(0);
      }
    });

    test('无效 JSON 处理', () => {
      if (!hasBash) return;

      const result = runHookScript('keyword-detector.sh', 'not json');

      if (!result.skip) {
        expect(result.status).toBe(0);
      }
    });
  });

  describe('路径安全验证逻辑', () => {
    // 模拟 validate_path 的 JavaScript 版本
    const validatePath = (filepath) => {
      // 1. 空路径检查
      if (!filepath) {
        return false;
      }

      // 2. 危险字符检查
      const dangerousChars = /[;&|`$(){}[\]<>!*?]/;
      if (dangerousChars.test(filepath)) {
        return false;
      }

      // 3. 路径遍历检查
      if (filepath.includes('..')) {
        return false;
      }

      // 4. 允许的路径前缀检查
      const home = os.homedir();
      const allowedPrefixes = [
        home,
        '/tmp/',
        '/var/folders/',
        '/mnt/c/Users/',
        '/c/Users/',
        '/home/',
      ];

      // Windows 原生路径
      const isWindowsPath = /^[a-zA-Z]:\\(Users|Temp)\\/i.test(filepath);
      if (isWindowsPath) {
        return true;
      }

      const isAllowed = allowedPrefixes.some((prefix) =>
        filepath.startsWith(prefix)
      );

      return isAllowed;
    };

    test('允许用户主目录路径', () => {
      const home = os.homedir();
      expect(validatePath(`${home}/test/file.json`)).toBe(true);
    });

    test('允许 /tmp 路径', () => {
      expect(validatePath('/tmp/test/file.json')).toBe(true);
    });

    test('允许 WSL 路径', () => {
      expect(validatePath('/mnt/c/Users/test/file.json')).toBe(true);
    });

    test('允许 Windows 原生路径', () => {
      expect(validatePath('C:\\Users\\test\\file.json')).toBe(true);
      expect(validatePath('D:\\Temp\\test.json')).toBe(true);
    });

    test('拒绝空路径', () => {
      expect(validatePath('')).toBe(false);
      expect(validatePath(null)).toBe(false);
      expect(validatePath(undefined)).toBe(false);
    });

    test('拒绝包含危险字符的路径', () => {
      expect(validatePath('/home/user/$(rm -rf /)')).toBe(false);
      expect(validatePath('/home/user/`whoami`')).toBe(false);
      expect(validatePath('/home/user/test;id')).toBe(false);
      expect(validatePath('/home/user/test&whoami')).toBe(false);
      expect(validatePath('/home/user/test|cat')).toBe(false);
    });

    test('拒绝路径遍历', () => {
      expect(validatePath('/home/user/../etc/passwd')).toBe(false);
      expect(validatePath('/tmp/../../../etc/shadow')).toBe(false);
    });

    test('拒绝不允许的路径前缀', () => {
      expect(validatePath('/etc/passwd')).toBe(false);
      expect(validatePath('/usr/local/bin/test')).toBe(false);
      expect(validatePath('/root/secret')).toBe(false);
    });
  });

  describe('todo-enforcer.sh - TODO 强制执行', () => {
    test('无 transcript_path 时允许退出', () => {
      if (!hasBash) return;

      const input = JSON.stringify({});
      const result = runHookScript('todo-enforcer.sh', input);

      if (!result.skip) {
        expect(result.status).toBe(0);
      }
    });

    test('空输入时允许退出', () => {
      if (!hasBash) return;

      const result = runHookScript('todo-enforcer.sh', '');

      if (!result.skip) {
        expect(result.status).toBe(0);
      }
    });
  });

  describe('progress-notifier.sh - 进度通知', () => {
    test('非 todo_update 类型时静默退出', () => {
      if (!hasBash) return;

      const input = JSON.stringify({ type: 'other' });
      const result = runHookScript('progress-notifier.sh', input);

      if (!result.skip) {
        expect(result.status).toBe(0);
        expect(result.stdout).toBe('');
      }
    });

    test('空输入时静默退出', () => {
      if (!hasBash) return;

      const result = runHookScript('progress-notifier.sh', '');

      if (!result.skip) {
        expect(result.status).toBe(0);
      }
    });
  });

  describe('hooks.json 配置验证', () => {
    test('hooks.json 格式正确', () => {
      const hooksJsonPath = path.join(hooksDir, 'hooks.json');

      if (!fs.existsSync(hooksJsonPath)) {
        console.log('hooks.json not found, skipping');
        return;
      }

      const content = fs.readFileSync(hooksJsonPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();

      const hooksConfig = JSON.parse(content);
      expect(hooksConfig).toHaveProperty('hooks');
    });

    test('配置的 hook 脚本存在', () => {
      const hooksJsonPath = path.join(hooksDir, 'hooks.json');

      if (!fs.existsSync(hooksJsonPath)) {
        return;
      }

      const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
      const hooks = hooksConfig.hooks;

      for (const [hookType, hookList] of Object.entries(hooks)) {
        for (const hook of hookList) {
          if (hook.command) {
            // 提取脚本路径
            const match = hook.command.match(/hooks\/([^ ]+)/);
            if (match) {
              const scriptPath = path.join(hooksDir, match[1]);
              expect(fs.existsSync(scriptPath)).toBe(true);
            }
          }
        }
      }
    });

    test('hook 配置包含必需字段', () => {
      const hooksJsonPath = path.join(hooksDir, 'hooks.json');

      if (!fs.existsSync(hooksJsonPath)) {
        return;
      }

      const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
      const hooks = hooksConfig.hooks;

      for (const [hookType, hookList] of Object.entries(hooks)) {
        for (const hook of hookList) {
          expect(hook).toHaveProperty('type');
          expect(hook).toHaveProperty('command');
        }
      }
    });
  });
});

describe('关键词匹配正则表达式测试', () => {
  // 测试关键词匹配逻辑的 JavaScript 版本
  const keywordPatterns = {
    yugong: /(ultra[-_]?work|ulw|移山|yi[-_]?shan|persist|愚公|yu[-_]?gong)/i,
    zhuge: /(架构|设计|策略|architecture|design|strategy|诸葛|zhuge|consult|规划|planning)/i,
    luban: /(前端|组件|ui|frontend|component|craft|鲁班|luban|巧工|qiaogong)/i,
    wukong: /(搜索|查找|探索|search|find|explore|悟空|wukong|火眼|huoyan|定位|locate)/i,
    bianque: /(fix.{0,20}(bug|error)|debug|调试|报错|异常|exception|扁鹊|bianque|诊断|diagnose)/i,
    mozi: /(安全|漏洞|注入|security|vulnerab|injection|墨子|mozi|audit|审计|xss|csrf|防御)/i,
    sunzi: /(性能|优化|慢|performance|optimize|slow|孙子|sunzi|perf|瓶颈|bottleneck|缓存|cache)/i,
    simaqian: /(文档|注释|记录|document|comment|readme|changelog|history|司马迁|simaqian|史记|shiji)/i,
    baozheng: /(测试|单元测试|集成测试|test|unit[-_]?test|integration[-_]?test|tdd|jest|vitest|pytest|包拯|baozheng|开封|coverage|覆盖率)/i,
  };

  describe('愚公关键词', () => {
    const pattern = keywordPatterns.yugong;

    test('匹配中文关键词', () => {
      expect(pattern.test('愚公移山')).toBe(true);
      expect(pattern.test('移山模式')).toBe(true);
    });

    test('匹配英文关键词', () => {
      expect(pattern.test('ultra-work')).toBe(true);
      expect(pattern.test('ultrawork')).toBe(true);
      expect(pattern.test('ulw')).toBe(true);
      expect(pattern.test('persist')).toBe(true);
    });

    test('匹配拼音关键词', () => {
      expect(pattern.test('yugong')).toBe(true);
      expect(pattern.test('yi-shan')).toBe(true);
    });
  });

  describe('诸葛关键词', () => {
    const pattern = keywordPatterns.zhuge;

    test('匹配架构相关', () => {
      expect(pattern.test('架构设计')).toBe(true);
      expect(pattern.test('architecture')).toBe(true);
      expect(pattern.test('design pattern')).toBe(true);
    });

    test('匹配策略相关', () => {
      expect(pattern.test('strategy')).toBe(true);
      expect(pattern.test('规划方案')).toBe(true);
    });
  });

  describe('调试关键词', () => {
    const pattern = keywordPatterns.bianque;

    test('匹配 fix bug 模式', () => {
      expect(pattern.test('fix this bug')).toBe(true);
      expect(pattern.test('fix the error')).toBe(true);
    });

    test('限制 fix 和 bug 的距离', () => {
      // 距离太远不应该匹配
      expect(pattern.test('fix something that is totally unrelated to any bug')).toBe(false);
    });

    test('匹配直接关键词', () => {
      expect(pattern.test('debug mode')).toBe(true);
      expect(pattern.test('调试问题')).toBe(true);
      expect(pattern.test('exception handling')).toBe(true);
    });
  });

  describe('测试关键词', () => {
    const pattern = keywordPatterns.baozheng;

    test('匹配测试框架', () => {
      expect(pattern.test('jest test')).toBe(true);
      expect(pattern.test('vitest')).toBe(true);
      expect(pattern.test('pytest')).toBe(true);
    });

    test('匹配测试类型', () => {
      expect(pattern.test('unit test')).toBe(true);
      expect(pattern.test('integration test')).toBe(true);
      expect(pattern.test('单元测试')).toBe(true);
    });

    test('匹配 TDD', () => {
      expect(pattern.test('tdd practice')).toBe(true);
    });

    test('匹配覆盖率', () => {
      expect(pattern.test('coverage report')).toBe(true);
      expect(pattern.test('测试覆盖率')).toBe(true);
    });
  });
});
