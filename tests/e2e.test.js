const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('End-to-End Integration Tests', () => {
  const projectRoot = path.join(__dirname, '..');

  test('Project structure should be complete', () => {
    const requiredDirs = [
      'agents',
      'commands',
      'scripts',
      'skills',
      'hooks',
      '.claude-plugin'
    ];

    const requiredFiles = [
      'package.json',
      'README.md',
      'README_EN.md',
      'LICENSE'
    ];

    requiredDirs.forEach(dir => {
      expect(fs.existsSync(path.join(projectRoot, dir))).toBe(true);
    });

    requiredFiles.forEach(file => {
      expect(fs.existsSync(path.join(projectRoot, file))).toBe(true);
    });
  });

  test('Plugin configuration should be valid', () => {
    const pluginConfigPath = path.join(projectRoot, '.claude-plugin', 'plugin.json');
    expect(fs.existsSync(pluginConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(pluginConfigPath, 'utf8'));
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('description');
    expect(config).toHaveProperty('version');
  });

  test('CLI tool should be executable', () => {
    const cliPath = path.join(projectRoot, 'scripts', 'cli.js');
    expect(fs.existsSync(cliPath)).toBe(true);

    // Check if it's a valid Node.js file
    const content = fs.readFileSync(cliPath, 'utf8');
    expect(content).toMatch(/#!/);
    expect(content).toMatch(/node/);
  });

  test('Hooks configuration should be valid', () => {
    const hooksConfigPath = path.join(projectRoot, 'hooks', 'hooks.json');
    expect(fs.existsSync(hooksConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf8'));
    expect(config).toHaveProperty('hooks');
    expect(typeof config.hooks).toBe('object');

    // Check Stop hooks
    expect(Array.isArray(config.hooks.Stop)).toBe(true);
    expect(config.hooks.Stop.length).toBeGreaterThan(0);

    config.hooks.Stop.forEach(hook => {
      expect(hook).toHaveProperty('type');
      expect(hook).toHaveProperty('command');
      expect(hook).toHaveProperty('timeout');
      expect(hook).toHaveProperty('continueOnError');
    });

    // Check UserPromptSubmit hooks
    expect(Array.isArray(config.hooks.UserPromptSubmit)).toBe(true);
    expect(config.hooks.UserPromptSubmit.length).toBeGreaterThan(0);

    config.hooks.UserPromptSubmit.forEach(hook => {
      expect(hook).toHaveProperty('type');
      expect(hook).toHaveProperty('command');
      expect(hook).toHaveProperty('timeout');
      expect(hook).toHaveProperty('continueOnError');
    });
  });

  test('Skills should be properly structured', () => {
    const skillsDir = path.join(projectRoot, 'skills');
    const skillDirs = fs.readdirSync(skillsDir).filter(item =>
      fs.statSync(path.join(skillsDir, item)).isDirectory()
    );

    expect(skillDirs.length).toBeGreaterThan(0);

    skillDirs.forEach(skill => {
      const skillPath = path.join(skillsDir, skill);
      // Should contain at least one file
      const files = fs.readdirSync(skillPath);
      expect(files.length).toBeGreaterThan(0);
    });
  });

  test('Package.json should have all required fields', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

    const requiredFields = [
      'name', 'version', 'description', 'author', 'license',
      'repository', 'bugs', 'homepage', 'bin', 'files', 'scripts'
    ];

    requiredFields.forEach(field => {
      expect(packageJson).toHaveProperty(field);
    });

    // Check scripts
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts).toHaveProperty('install-plugin');
    expect(packageJson.scripts).toHaveProperty('uninstall-plugin');
  });
});