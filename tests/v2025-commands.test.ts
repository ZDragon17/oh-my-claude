/**
 * v2.0.25 新增命令测试
 * 测试 P1/P2/P3 功能的命令文件结构和内容
 */

import * as fs from 'fs';
import * as path from 'path';

const commandsDir = path.join(__dirname, '..', 'commands');
const skillsDir = path.join(__dirname, '..', 'skills');

// v2.0.25 新增的命令
const V2025_COMMANDS = {
  // P1 功能 - 效率增强
  p1: ['stats.md', 'init.md', 'review.md', 'learn.md'],
  // P2 功能 - 知识增强
  p2: ['debug.md', 'snippet.md', 'share.md', 'refactor.md', 'error.md'],
  // P3 功能 - 实验性
  p3: ['voice.md', 'pair.md', 'timeline.md', 'agent.md']
};

// 传统文化别名映射（移除通用英文别名，避免与其他工具冲突）
const CULTURAL_ALIASES: Record<string, string[]> = {
  'stats.md': ['/张衡stats'],
  'init.md': ['/盘古'],
  'learn.md': ['/孔子'],
  'snippet.md': ['/蔡伦'],
  'share.md': ['/孔融'],
  'error.md': ['/华佗kb'],
  'voice.md': ['/伯牙'],
  'pair.md': ['/管鲍'],
  'timeline.md': ['/太史'],
  'agent.md': ['/女娲']
};

interface Frontmatter {
  name?: string;
  aliases?: string[];
  allowedTools?: string[];
  model?: string;
}

// 解析 YAML frontmatter
function parseFrontmatter(content: string): Frontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match || !match[1]) return null;

  const yaml = match[1];
  const result: Frontmatter = {};

  // 解析 name
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch && nameMatch[1]) result.name = nameMatch[1].trim();

  // 解析 aliases
  const aliasesMatch = yaml.match(/aliases:\n((?:\s+-\s+.+\n?)+)/);
  if (aliasesMatch && aliasesMatch[1]) {
    result.aliases = aliasesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^\s*-\s*/, '').trim());
  }

  // 解析 allowed-tools
  const toolsMatch = yaml.match(/allowed-tools:\n((?:\s+-\s+.+\n?)+)/);
  if (toolsMatch && toolsMatch[1]) {
    result.allowedTools = toolsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^\s*-\s*/, '').trim());
  }

  // 解析 model
  const modelMatch = yaml.match(/^model:\s*(.+)$/m);
  if (modelMatch && modelMatch[1]) result.model = modelMatch[1].trim();

  return result;
}

describe('v2.0.25 Commands - Structure Tests', () => {
  const allNewCommands = [...V2025_COMMANDS.p1, ...V2025_COMMANDS.p2, ...V2025_COMMANDS.p3];

  test('All v2.0.25 command files should exist', () => {
    const existingFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));

    allNewCommands.forEach(cmd => {
      expect(existingFiles).toContain(cmd);
    });
  });

  test('P1 commands (效率增强) should all exist', () => {
    V2025_COMMANDS.p1.forEach(cmd => {
      const filePath = path.join(commandsDir, cmd);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('P2 commands (知识增强) should all exist', () => {
    V2025_COMMANDS.p2.forEach(cmd => {
      const filePath = path.join(commandsDir, cmd);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('P3 commands (实验性) should all exist', () => {
    V2025_COMMANDS.p3.forEach(cmd => {
      const filePath = path.join(commandsDir, cmd);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe('v2.0.25 Commands - Frontmatter Tests', () => {
  const allNewCommands = [...V2025_COMMANDS.p1, ...V2025_COMMANDS.p2, ...V2025_COMMANDS.p3];

  test.each(allNewCommands)('%s should have valid YAML frontmatter', (cmdFile) => {
    const filePath = path.join(commandsDir, cmdFile);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检查 frontmatter 格式
    expect(content).toMatch(/^---\n[\s\S]*?\n---/);

    const frontmatter = parseFrontmatter(content);
    expect(frontmatter).not.toBeNull();
    expect(frontmatter?.name).toBeTruthy();
  });

  test.each(allNewCommands)('%s should have allowed-tools defined', (cmdFile) => {
    const filePath = path.join(commandsDir, cmdFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    expect(frontmatter?.allowedTools).toBeDefined();
    expect(Array.isArray(frontmatter?.allowedTools)).toBe(true);
    expect(frontmatter?.allowedTools?.length).toBeGreaterThan(0);
  });

  test.each(allNewCommands)('%s should have model specified', (cmdFile) => {
    const filePath = path.join(commandsDir, cmdFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    expect(frontmatter?.model).toBeDefined();
    expect(['sonnet', 'haiku', 'opus']).toContain(frontmatter?.model);
  });
});

describe('v2.0.25 Commands - Cultural Alignment Tests', () => {
  const commandsWithAliases = Object.keys(CULTURAL_ALIASES);

  test.each(commandsWithAliases)('%s should have traditional culture aliases', (cmdFile) => {
    const filePath = path.join(commandsDir, cmdFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    expect(frontmatter?.aliases).toBeDefined();
    expect(Array.isArray(frontmatter?.aliases)).toBe(true);

    // 检查是否包含预期的文化别名
    const expectedAliases = CULTURAL_ALIASES[cmdFile];
    if (expectedAliases) {
      expectedAliases.forEach(alias => {
        expect(frontmatter?.aliases).toContain(alias);
      });
    }
  });
});

describe('v2.0.25 Commands - Content Quality Tests', () => {
  const allNewCommands = [...V2025_COMMANDS.p1, ...V2025_COMMANDS.p2, ...V2025_COMMANDS.p3];

  test.each(allNewCommands)('%s should have meaningful content (>500 chars)', (cmdFile) => {
    const filePath = path.join(commandsDir, cmdFile);
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.length).toBeGreaterThan(500);
  });

  test.each(allNewCommands)('%s should have command-name tag', (cmdFile) => {
    const filePath = path.join(commandsDir, cmdFile);
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toMatch(/<command-name>.*<\/command-name>/);
  });

  test.each(allNewCommands)('%s should have usage section', (cmdFile) => {
    const filePath = path.join(commandsDir, cmdFile);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检查是否有使用说明相关内容
    expect(content.toLowerCase()).toMatch(/使用|usage|用法|命令/);
  });
});

describe('v2.0.25 Skills - Directory Tests', () => {
  // 核心 skill 目录
  const coreSkills = ['session', 'context', 'parallel', 'yishan'];

  test('Skills directory should exist', () => {
    expect(fs.existsSync(skillsDir)).toBe(true);
  });

  test.each(coreSkills)('Core skill directory %s should exist', (skillName) => {
    const skillPath = path.join(skillsDir, skillName);
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  test.each(coreSkills)('Core skill %s should have skill.json', (skillName) => {
    const skillJsonPath = path.join(skillsDir, skillName, 'skill.json');
    expect(fs.existsSync(skillJsonPath)).toBe(true);
  });

  test.each(coreSkills)('Core skill %s should have SKILL.md', (skillName) => {
    const skillMdPath = path.join(skillsDir, skillName, 'SKILL.md');
    expect(fs.existsSync(skillMdPath)).toBe(true);
  });
});
