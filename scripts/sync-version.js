#!/usr/bin/env node

/**
 * 版本同步脚本
 * 同步更新所有配置文件中的版本号
 *
 * 用法:
 *   node scripts/sync-version.js <new-version>
 *   node scripts/sync-version.js 0.9.0
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// 需要同步版本的文件配置
const FILES = [
  {
    path: 'package.json',
    type: 'json',
    key: 'version',
  },
  {
    path: '.claude-plugin/plugin.json',
    type: 'json',
    key: 'version',
  },
  {
    path: 'scripts/cli.js',
    type: 'regex',
    pattern: /const VERSION = '[^']+'/,
    replacement: (version) => `const VERSION = '${version}'`,
  },
  {
    path: 'homebrew/oh-my-claude.rb',
    type: 'regex',
    pattern: /url "https:\/\/github\.com\/ZDragon17\/oh-my-claude\/archive\/refs\/tags\/v[^"]+\.tar\.gz"/,
    replacement: (version) =>
      `url "https://github.com/ZDragon17/oh-my-claude/archive/refs/tags/v${version}.tar.gz"`,
  },
  {
    path: 'scoop/oh-my-claude.json',
    type: 'json-multi',
    keys: [
      { key: 'version', value: (v) => v },
      {
        key: 'url',
        value: (v) => `https://github.com/ZDragon17/oh-my-claude/archive/refs/tags/v${v}.zip`,
      },
      { key: 'extract_dir', value: (v) => `oh-my-claude-${v}` },
    ],
  },
];

// 颜色输出 - 使用共享模块
const { colors, log, success, error, info, warn } = require('./logger');

// 验证版本号格式
function isValidVersion(version) {
  return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version);
}

// 获取当前版本
function getCurrentVersion() {
  const packagePath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return pkg.version;
}

// 更新 JSON 文件
function updateJsonFile(filePath, key, version) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    warn(`文件不存在: ${filePath}`);
    return false;
  }

  const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  content[key] = version;
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  return true;
}

// 更新多个 JSON 键
function updateJsonMulti(filePath, keys, version) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    warn(`文件不存在: ${filePath}`);
    return false;
  }

  const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  for (const { key, value } of keys) {
    content[key] = value(version);
  }
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 4) + '\n', 'utf8');
  return true;
}

// 更新正则匹配的内容
function updateRegexFile(filePath, pattern, replacement, version) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    warn(`文件不存在: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  if (!pattern.test(content)) {
    warn(`未找到匹配项: ${filePath}`);
    return false;
  }

  content = content.replace(pattern, replacement(version));
  fs.writeFileSync(fullPath, content, 'utf8');
  return true;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const newVersion = args[0];

  log('\n📦 oh-my-claude 版本同步工具', 'cyan');
  log('━'.repeat(50), 'cyan');

  const currentVersion = getCurrentVersion();
  info(`当前版本: ${currentVersion}`);

  if (!newVersion) {
    log('\n用法: node scripts/sync-version.js <new-version>');
    log('示例: node scripts/sync-version.js 0.9.0\n');
    process.exit(1);
  }

  if (!isValidVersion(newVersion)) {
    error(`无效的版本号格式: ${newVersion}`);
    info('版本号格式: major.minor.patch (例如: 0.9.0, 1.0.0-beta.1)');
    process.exit(1);
  }

  if (newVersion === currentVersion) {
    warn(`版本号未改变: ${newVersion}`);
    process.exit(0);
  }

  info(`新版本: ${newVersion}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of FILES) {
    let result = false;

    switch (file.type) {
      case 'json':
        result = updateJsonFile(file.path, file.key, newVersion);
        break;
      case 'json-multi':
        result = updateJsonMulti(file.path, file.keys, newVersion);
        break;
      case 'regex':
        result = updateRegexFile(file.path, file.pattern, file.replacement, newVersion);
        break;
    }

    if (result) {
      success(`更新: ${file.path}`);
      successCount++;
    } else {
      failCount++;
    }
  }

  log('\n' + '━'.repeat(50), 'cyan');

  if (failCount === 0) {
    success(`所有文件更新完成 (${successCount} 个文件)`);
    log('\n下一步:', 'yellow');
    log('  1. 更新 CHANGELOG.md');
    log('  2. git add -A && git commit -m "chore: bump version to ' + newVersion + '"');
    log('  3. git tag v' + newVersion);
    log('  4. git push && git push --tags');
    log('  5. 在 GitHub 上创建 Release\n');
  } else {
    warn(`部分文件更新失败 (成功: ${successCount}, 失败: ${failCount})`);
  }
}

main();
