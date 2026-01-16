const fs = require('fs');
const path = require('path');
const { safeReadFile } = require('../scripts/cli.js');

describe('Agent Integration Tests', () => {
  const agentsDir = path.join(__dirname, '..', 'agents');

  test('All 18 agents should exist', () => {
    const agentFiles = fs.readdirSync(agentsDir).filter(file => file.endsWith('.md'));
    expect(agentFiles).toHaveLength(18);
  });

  test('Each agent file should have valid frontmatter', () => {
    const agentFiles = fs.readdirSync(agentsDir).filter(file => file.endsWith('.md'));

    agentFiles.forEach(agentFile => {
      const content = safeReadFile(path.join(agentsDir, agentFile));
      expect(content).toBeTruthy();
      expect(content.startsWith('---')).toBe(true);

      // Should contain frontmatter fields
      expect(content).toMatch(/name:/);
      expect(content).toMatch(/description:/);
    });
  });

  test('Agent names should match expected list', () => {
    const agentFiles = fs.readdirSync(agentsDir).filter(file => file.endsWith('.md'));
    const expectedAgents = [
      'yugong.md', 'zhuge.md', 'luban.md', 'wukong.md', 'bianque.md',
      'mozi.md', 'sunzi.md', 'simaqian.md', 'zhenghe.md', 'zhangheng.md',
      'libing.md', 'laozi.md', 'baozheng.md', 'weizheng.md', 'cangjie.md',
      'libai.md', 'gukaizhi.md', 'change.md'
    ];

    const agentNames = agentFiles.sort();
    const expectedNames = expectedAgents.sort();

    expect(agentNames).toEqual(expectedNames);
  });

  test('Each agent should have meaningful description', () => {
    const agentFiles = fs.readdirSync(agentsDir).filter(file => file.endsWith('.md'));

    agentFiles.forEach(agentFile => {
      const content = safeReadFile(path.join(agentsDir, agentFile));
      // Look for description field in frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();

      const frontmatter = frontmatterMatch[1];
      expect(frontmatter).toMatch(/description:/);

      // Extract description content (may be multiline)
      const descMatch = frontmatter.match(/description:[\s\S]*?(?=\w+:|$)/);
      expect(descMatch).toBeTruthy();

      const description = descMatch[0].replace(/description:\s*/, '').trim();
      expect(description.length).toBeGreaterThan(10);
    });
  });
});