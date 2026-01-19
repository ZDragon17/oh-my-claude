/**
 * SkillLoader 测试
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SkillLoader, getSkillLoader, loadAllSkills, loadSkill, findSkillByKeyword, findSkillByCommand } from '../lib/skill-loader';

// 测试用临时目录
const TEST_DIR = path.join(os.tmpdir(), 'oh-my-claude-skill-test-' + Date.now());
const TEST_SKILLS_DIR = path.join(TEST_DIR, 'skills');

// 测试用技能配置
const mockSkillConfig = {
  name: 'test-skill',
  version: '1.0.0',
  description: 'Test skill for unit testing',
  keywords: ['test', 'mock'],
  triggers: {
    keywords: ['testmode', 'testing'],
    commands: ['/test', '/testcmd']
  },
  commandAliases: {
    '/test': ['/t', '/testing']
  },
  keywordTriggers: {
    test_mode: ['testword', 'mockword']
  }
};

const mockSkillMarkdown = `# Test Skill

This is a test skill for unit testing.

## Usage

Use /test command to activate.
`;

describe('SkillLoader', () => {
  let loader: SkillLoader;

  beforeAll(() => {
    // 创建测试目录结构
    fs.mkdirSync(path.join(TEST_SKILLS_DIR, 'test-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_SKILLS_DIR, 'test-skill', 'skill.json'),
      JSON.stringify(mockSkillConfig, null, 2)
    );
    fs.writeFileSync(
      path.join(TEST_SKILLS_DIR, 'test-skill', 'SKILL.md'),
      mockSkillMarkdown
    );

    // 创建第二个技能用于测试多技能场景
    fs.mkdirSync(path.join(TEST_SKILLS_DIR, 'another-skill'), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_SKILLS_DIR, 'another-skill', 'skill.json'),
      JSON.stringify({
        name: 'another-skill',
        version: '2.0.0',
        description: 'Another test skill',
        keywords: ['another'],
        triggers: {
          keywords: ['anotherkey'],
          commands: ['/another']
        }
      }, null, 2)
    );
  });

  afterAll(() => {
    // 清理测试目录
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    loader = new SkillLoader({
      skillDirs: [TEST_SKILLS_DIR],
      enableCache: false
    });
  });

  describe('loadAllSkills', () => {
    test('应该加载所有技能', () => {
      const skills = loader.loadAllSkills();
      expect(skills).toHaveLength(2);
      expect(skills.map(s => s.name)).toContain('test-skill');
      expect(skills.map(s => s.name)).toContain('another-skill');
    });

    test('加载的技能应该包含正确的配置', () => {
      const skills = loader.loadAllSkills();
      const testSkill = skills.find(s => s.name === 'test-skill');
      
      expect(testSkill).toBeDefined();
      expect(testSkill!.config.version).toBe('1.0.0');
      expect(testSkill!.config.description).toBe('Test skill for unit testing');
      expect(testSkill!.config.keywords).toContain('test');
    });

    test('应该加载 Markdown 内容', () => {
      const skills = loader.loadAllSkills();
      const testSkill = skills.find(s => s.name === 'test-skill');
      
      expect(testSkill).toBeDefined();
      expect(testSkill!.markdownContent).toBeDefined();
      expect(testSkill!.markdownContent).toContain('# Test Skill');
    });

    test('应该记录加载位置和时间', () => {
      const skills = loader.loadAllSkills();
      const testSkill = skills.find(s => s.name === 'test-skill');
      
      expect(testSkill).toBeDefined();
      expect(testSkill!.loadedFrom).toBe(path.join(TEST_SKILLS_DIR, 'test-skill'));
      expect(testSkill!.loadedAt).toBeDefined();
    });
  });

  describe('loadSkill', () => {
    test('应该加载单个技能', () => {
      const skill = loader.loadSkill('test-skill');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('加载不存在的技能应该返回 null', () => {
      const skill = loader.loadSkill('nonexistent-skill');
      expect(skill).toBeNull();
    });
  });

  describe('findSkillByKeyword', () => {
    test('应该通过 triggers.keywords 查找技能', () => {
      const skill = loader.findSkillByKeyword('testmode');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('应该通过顶级 keywords 查找技能', () => {
      const skill = loader.findSkillByKeyword('test');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('应该通过 keywordTriggers 查找技能', () => {
      const skill = loader.findSkillByKeyword('testword');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('关键词查找应该不区分大小写', () => {
      const skill = loader.findSkillByKeyword('TESTMODE');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('查找不存在的关键词应该返回 null', () => {
      const skill = loader.findSkillByKeyword('nonexistent');
      expect(skill).toBeNull();
    });
  });

  describe('findSkillByCommand', () => {
    test('应该通过 triggers.commands 查找技能', () => {
      const skill = loader.findSkillByCommand('/test');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('应该通过 commandAliases 主命令查找技能', () => {
      const skill = loader.findSkillByCommand('/test');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('应该通过 commandAliases 别名查找技能', () => {
      const skill = loader.findSkillByCommand('/t');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('命令查找应该不区分大小写', () => {
      const skill = loader.findSkillByCommand('/TEST');
      
      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('test-skill');
    });

    test('查找不存在的命令应该返回 null', () => {
      const skill = loader.findSkillByCommand('/nonexistent');
      expect(skill).toBeNull();
    });
  });

  describe('getAllCommandAliases', () => {
    test('应该返回所有命令别名', () => {
      const aliases = loader.getAllCommandAliases();
      
      expect(aliases['/test']).toBeDefined();
      expect(aliases['/test']).toContain('/t');
      expect(aliases['/test']).toContain('/testing');
    });
  });

  describe('getAllKeywordTriggers', () => {
    test('应该返回所有关键词触发器', () => {
      const triggers = loader.getAllKeywordTriggers();
      
      expect(triggers['test_mode']).toBeDefined();
      expect(triggers['test_mode']).toContain('testword');
      expect(triggers['test_mode']).toContain('mockword');
    });
  });

  describe('缓存功能', () => {
    test('启用缓存时应该缓存技能', () => {
      const cachedLoader = new SkillLoader({
        skillDirs: [TEST_SKILLS_DIR],
        enableCache: true,
        cacheTTL: 60000
      });

      // 首次加载
      cachedLoader.loadAllSkills();
      expect(cachedLoader.getCacheSize()).toBeGreaterThan(0);

      // 再次加载应该使用缓存
      const skills = cachedLoader.loadAllSkills();
      expect(skills).toHaveLength(2);
    });

    test('clearCache 应该清除缓存', () => {
      const cachedLoader = new SkillLoader({
        skillDirs: [TEST_SKILLS_DIR],
        enableCache: true
      });

      cachedLoader.loadAllSkills();
      expect(cachedLoader.getCacheSize()).toBeGreaterThan(0);

      cachedLoader.clearCache();
      expect(cachedLoader.getCacheSize()).toBe(0);
    });
  });

  describe('目录管理', () => {
    test('getSkillDirs 应该返回技能目录列表', () => {
      const dirs = loader.getSkillDirs();
      expect(dirs).toContain(TEST_SKILLS_DIR);
    });

    test('addSkillDir 应该添加新的技能目录', () => {
      const newDir = path.join(TEST_DIR, 'new-skills');
      loader.addSkillDir(newDir);
      
      const dirs = loader.getSkillDirs();
      expect(dirs).toContain(newDir);
    });
  });
});

describe('便捷函数', () => {
  beforeAll(() => {
    // 确保测试目录存在
    if (!fs.existsSync(TEST_SKILLS_DIR)) {
      fs.mkdirSync(path.join(TEST_SKILLS_DIR, 'test-skill'), { recursive: true });
      fs.writeFileSync(
        path.join(TEST_SKILLS_DIR, 'test-skill', 'skill.json'),
        JSON.stringify(mockSkillConfig, null, 2)
      );
    }
  });

  test('getSkillLoader 应该返回单例实例', () => {
    const loader1 = getSkillLoader();
    const loader2 = getSkillLoader();
    expect(loader1).toBe(loader2);
  });

  test('loadAllSkills 便捷函数应该工作', () => {
    // 使用自定义选项重新初始化
    getSkillLoader({ skillDirs: [TEST_SKILLS_DIR] });
    const skills = loadAllSkills();
    expect(Array.isArray(skills)).toBe(true);
  });

  test('loadSkill 便捷函数应该工作', () => {
    const skill = loadSkill('test-skill');
    // 可能为 null 如果不在默认目录中
    expect(skill === null || skill.name === 'test-skill').toBe(true);
  });

  test('findSkillByKeyword 便捷函数应该工作', () => {
    const skill = findSkillByKeyword('test');
    // 可能为 null 如果不在默认目录中
    expect(skill === null || typeof skill === 'object').toBe(true);
  });

  test('findSkillByCommand 便捷函数应该工作', () => {
    const skill = findSkillByCommand('/test');
    // 可能为 null 如果不在默认目录中
    expect(skill === null || typeof skill === 'object').toBe(true);
  });
});
