/**
 * 插件组件安装器测试
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import {
  getCommandsDir,
  getSkillsDir,
  installCommands,
  installSkills,
  registerCoreAgents,
  syncHooksToSettings
} from '../lib/plugin-installer';

describe('插件组件安装器', () => {
  let tempDir: string;
  let mockPackageDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    tempDir = path.join(os.tmpdir(), `oh-my-claude-plugin-test-${crypto.randomBytes(8).toString('hex')}`);
    mockPackageDir = path.join(tempDir, 'package');
    fs.mkdirSync(mockPackageDir, { recursive: true });
  });

  afterEach(() => {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getCommandsDir', () => {
    test('应该返回 commands 目录路径', () => {
      const commandsDir = getCommandsDir();
      expect(commandsDir).toBeDefined();
      expect(typeof commandsDir).toBe('string');
      expect(commandsDir).toContain('.claude');
      expect(commandsDir).toContain('commands');
    });
  });

  describe('getSkillsDir', () => {
    test('应该返回 skills 目录路径', () => {
      const skillsDir = getSkillsDir();
      expect(skillsDir).toBeDefined();
      expect(typeof skillsDir).toBe('string');
      expect(skillsDir).toContain('.claude');
      expect(skillsDir).toContain('skills');
    });
  });

  describe('installCommands', () => {
    test('应该安装命令文件', () => {
      // 创建模拟的 commands 源目录
      const commandsSrc = path.join(mockPackageDir, 'commands');
      fs.mkdirSync(commandsSrc, { recursive: true });
      
      // 创建测试命令文件
      fs.writeFileSync(path.join(commandsSrc, 'test1.md'), '# Test Command 1');
      fs.writeFileSync(path.join(commandsSrc, 'test2.md'), '# Test Command 2');
      fs.writeFileSync(path.join(commandsSrc, 'readme.txt'), 'Not a command'); // 非 .md 文件

      const result = installCommands(mockPackageDir);

      expect(result).toBeDefined();
      expect(result.count).toBe(2); // 只计算 .md 文件
      expect(result.errors).toHaveLength(0);
    });

    test('源目录不存在时应该返回 0 个命令', () => {
      const result = installCommands(mockPackageDir);

      expect(result).toBeDefined();
      expect(result.count).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('应该返回符合 schema 的结果', () => {
      const result = installCommands(mockPackageDir);

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('errors');
      expect(typeof result.count).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('installSkills', () => {
    test('应该安装 skill 目录', () => {
      // 创建模拟的 skills 源目录
      const skillsSrc = path.join(mockPackageDir, 'skills');
      
      // 创建测试 skill 目录结构
      const skill1Dir = path.join(skillsSrc, 'skill1');
      const skill2Dir = path.join(skillsSrc, 'skill2');
      fs.mkdirSync(skill1Dir, { recursive: true });
      fs.mkdirSync(skill2Dir, { recursive: true });
      
      // 创建 SKILL.md 文件
      fs.writeFileSync(path.join(skill1Dir, 'SKILL.md'), '# Skill 1');
      fs.writeFileSync(path.join(skill2Dir, 'SKILL.md'), '# Skill 2');
      
      // 创建 skill.json 文件
      fs.writeFileSync(path.join(skill1Dir, 'skill.json'), '{"name": "skill1"}');

      const result = installSkills(mockPackageDir);

      expect(result).toBeDefined();
      expect(result.count).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    test('源目录不存在时应该返回 0 个 skill', () => {
      const result = installSkills(mockPackageDir);

      expect(result).toBeDefined();
      expect(result.count).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('应该返回符合 schema 的结果', () => {
      const result = installSkills(mockPackageDir);

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('errors');
      expect(typeof result.count).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('应该跳过非目录条目', () => {
      const skillsSrc = path.join(mockPackageDir, 'skills');
      fs.mkdirSync(skillsSrc, { recursive: true });
      
      // 创建一个文件（非目录）
      fs.writeFileSync(path.join(skillsSrc, 'README.md'), '# Skills');
      
      // 创建一个 skill 目录
      const skillDir = path.join(skillsSrc, 'valid-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Valid Skill');

      const result = installSkills(mockPackageDir);

      expect(result.count).toBe(1); // 只计算目录
    });
  });

  describe('registerCoreAgents', () => {
    test('应该注册核心 Agent 而不抛出错误', () => {
      // registerCoreAgents 内部会创建 AgentStateManagerImpl 实例
      // 并注册所有核心 Agent
      expect(() => registerCoreAgents()).not.toThrow();
    });

    test('多次调用不应该抛出错误', () => {
      // 第一次注册
      expect(() => registerCoreAgents()).not.toThrow();
      // 第二次注册（会尝试重复注册，但不应该崩溃）
      expect(() => registerCoreAgents()).not.toThrow();
    });
  });
});

describe('syncHooksToSettings', () => {
  const SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
  let originalContent: string | null = null;
  let settingsExisted: boolean;

  beforeEach(() => {
    settingsExisted = fs.existsSync(SETTINGS_PATH);
    if (settingsExisted) {
      originalContent = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    }
  });

  afterEach(() => {
    if (settingsExisted && originalContent !== null) {
      fs.writeFileSync(SETTINGS_PATH, originalContent, 'utf-8');
    }
  });

  const EXPECTED_HOOK_SCRIPTS = [
    'progress-notifier.sh',
    'context-smart-alert.sh',
    'todo-continuation.sh',
    'ralph-loop.sh',
    'write-existing-file-guard.sh',
    'category-skill-reminder.sh',
    'comment-checker.sh',
    'json-error-recovery.sh',
    'stop-continuation-guard.sh',
    'todo-continuation-enforcer.sh'
  ];

  test('应该将所有 10 个核心 hook 注册到 settings.json', () => {
    const emptySettings = originalContent ? JSON.parse(originalContent) : {};
    delete emptySettings.hooks;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(emptySettings), 'utf-8');

    syncHooksToSettings();

    const updated = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    expect(updated.hooks).toBeDefined();

    const registeredScripts: string[] = [];
    for (const entries of Object.values(updated.hooks) as Array<Array<{ hooks: Array<{ command: string }> }>>) {
      for (const entry of entries) {
        if (entry.hooks) {
          for (const h of entry.hooks) {
            const scriptName = h.command.split('/').pop()?.replace(/["']/g, '') || '';
            registeredScripts.push(scriptName);
          }
        }
      }
    }

    for (const script of EXPECTED_HOOK_SCRIPTS) {
      expect(registeredScripts).toEqual(
        expect.arrayContaining([expect.stringContaining(script)])
      );
    }
    expect(registeredScripts.length).toBeGreaterThanOrEqual(EXPECTED_HOOK_SCRIPTS.length);
  });

  test('应该包含 PreToolUse、PostToolUse 和 Stop 三个事件类型', () => {
    const emptySettings = originalContent ? JSON.parse(originalContent) : {};
    delete emptySettings.hooks;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(emptySettings), 'utf-8');

    syncHooksToSettings();

    const updated = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    expect(updated.hooks.PreToolUse).toBeDefined();
    expect(updated.hooks.PostToolUse).toBeDefined();
    expect(updated.hooks.Stop).toBeDefined();
    expect(updated.hooks.PreToolUse.length).toBeGreaterThanOrEqual(1);
    expect(updated.hooks.PostToolUse.length).toBeGreaterThanOrEqual(4);
    expect(updated.hooks.Stop.length).toBeGreaterThanOrEqual(4);
  });

  test('重复调用不应产生重复 hook 条目', () => {
    const emptySettings = originalContent ? JSON.parse(originalContent) : {};
    delete emptySettings.hooks;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(emptySettings), 'utf-8');

    syncHooksToSettings();
    syncHooksToSettings();

    const updated = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));

    const allScripts: string[] = [];
    for (const entries of Object.values(updated.hooks) as Array<Array<{ hooks: Array<{ command: string }> }>>) {
      for (const entry of entries) {
        if (entry.hooks) {
          for (const h of entry.hooks) {
            allScripts.push(h.command);
          }
        }
      }
    }

    const uniqueScripts = [...new Set(allScripts)];
    expect(allScripts.length).toBe(uniqueScripts.length);
  });

  test('应该使用 $HOME 路径格式以兼容跨平台', () => {
    const emptySettings = originalContent ? JSON.parse(originalContent) : {};
    delete emptySettings.hooks;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(emptySettings), 'utf-8');

    syncHooksToSettings();

    const updated = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));

    for (const entries of Object.values(updated.hooks) as Array<Array<{ hooks: Array<{ command: string }> }>>) {
      for (const entry of entries) {
        if (entry.hooks) {
          for (const h of entry.hooks) {
            expect(h.command).toContain('$HOME');
            expect(h.command).not.toMatch(/\/home\/|C:\\Users\\/);
          }
        }
      }
    }
  });
});
