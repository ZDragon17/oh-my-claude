const fs = require('fs');
const path = require('path');
const { safeReadFile } = require('../scripts/cli.js');

describe('Commands Integration Tests', () => {
  const commandsDir = path.join(__dirname, '..', 'commands');

  test('All 21 commands should exist', () => {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.md'));
    expect(commandFiles).toHaveLength(21);
  });

  test('Each command file should have valid structure', () => {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.md'));

    commandFiles.forEach(commandFile => {
      const content = safeReadFile(path.join(commandsDir, commandFile));
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(50); // Should have meaningful content
    });
  });

  test('Command files should include expected commands', () => {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.md'));
    const expectedCommands = [
      'yugong.md', 'yishan.md', 'zhuge.md', 'luban.md', 'wukong.md',
      'bianque.md', 'mozi.md', 'sunzi.md', 'simaqian.md', 'zhenghe.md',
      'zhangheng.md', 'libing.md', 'laozi.md', 'baozheng.md', 'weizheng.md',
      'cangjie.md', 'libai.md', 'gukaizhi.md', 'change.md', 'team.md',
      'progress.md'
    ];

    const commandNames = commandFiles.sort();
    const expectedNames = expectedCommands.sort();

    expect(commandNames).toEqual(expectedNames);
  });

  test('Special commands should exist', () => {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.md'));
    expect(commandFiles).toContain('team.md');
    expect(commandFiles).toContain('progress.md');
  });
});