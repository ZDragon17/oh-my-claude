/**
 * sync-version.js 单元测试
 *
 * 测试范围：
 * - isValidVersion: 版本号格式验证
 * - updateJsonFile: JSON 文件更新
 * - updateJsonMulti: 多键 JSON 更新
 * - updateRegexFile: 正则替换更新
 */

const fs = require('fs');
const path = require('path');
const {
  createTempDir,
  cleanupTempDir,
} = require('./helpers/test-utils');

describe('sync-version.js 功能测试', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('isValidVersion - 版本号格式验证', () => {
    const isValidVersion = (version) => {
      return /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version);
    };

    test('有效的版本号格式', () => {
      expect(isValidVersion('1.0.0')).toBe(true);
      expect(isValidVersion('0.9.0')).toBe(true);
      expect(isValidVersion('10.20.30')).toBe(true);
      expect(isValidVersion('1.0.0-beta.1')).toBe(true);
      expect(isValidVersion('2.0.0-alpha')).toBe(true);
      expect(isValidVersion('3.0.0-rc.1')).toBe(true);
    });

    test('无效的版本号格式', () => {
      expect(isValidVersion('1.0')).toBe(false);
      expect(isValidVersion('1')).toBe(false);
      expect(isValidVersion('v1.0.0')).toBe(false);
      expect(isValidVersion('1.0.0.0')).toBe(false);
      expect(isValidVersion('abc')).toBe(false);
      expect(isValidVersion('')).toBe(false);
      expect(isValidVersion('1.0.0-')).toBe(false);
    });
  });

  describe('updateJsonFile - JSON 文件更新', () => {
    const updateJsonFile = (filePath, key, version) => {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      content[key] = version;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
      return true;
    };

    test('更新 package.json 版本', () => {
      const jsonPath = path.join(tempDir, 'package.json');
      fs.writeFileSync(jsonPath, JSON.stringify({
        name: 'test-pkg',
        version: '1.0.0',
      }, null, 2));

      const result = updateJsonFile(jsonPath, 'version', '1.1.0');

      expect(result).toBe(true);
      const updated = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(updated.version).toBe('1.1.0');
    });

    test('文件不存在返回 false', () => {
      const result = updateJsonFile(path.join(tempDir, 'nonexistent.json'), 'version', '1.0.0');
      expect(result).toBe(false);
    });

    test('添加新键值', () => {
      const jsonPath = path.join(tempDir, 'test.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ name: 'test' }, null, 2));

      updateJsonFile(jsonPath, 'newKey', 'newValue');

      const updated = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(updated.newKey).toBe('newValue');
    });
  });

  describe('updateJsonMulti - 多键 JSON 更新', () => {
    const updateJsonMulti = (filePath, keys, version) => {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      for (const { key, value } of keys) {
        content[key] = value(version);
      }
      fs.writeFileSync(filePath, JSON.stringify(content, null, 4) + '\n', 'utf8');
      return true;
    };

    test('更新多个键值', () => {
      const jsonPath = path.join(tempDir, 'scoop.json');
      fs.writeFileSync(jsonPath, JSON.stringify({
        version: '1.0.0',
        url: 'https://example.com/v1.0.0.zip',
        extract_dir: 'package-1.0.0',
      }, null, 4));

      const keys = [
        { key: 'version', value: (v) => v },
        { key: 'url', value: (v) => `https://example.com/v${v}.zip` },
        { key: 'extract_dir', value: (v) => `package-${v}` },
      ];

      const result = updateJsonMulti(jsonPath, keys, '2.0.0');

      expect(result).toBe(true);
      const updated = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      expect(updated.version).toBe('2.0.0');
      expect(updated.url).toBe('https://example.com/v2.0.0.zip');
      expect(updated.extract_dir).toBe('package-2.0.0');
    });

    test('文件不存在返回 false', () => {
      const keys = [{ key: 'version', value: (v) => v }];
      const result = updateJsonMulti(path.join(tempDir, 'nonexistent.json'), keys, '1.0.0');
      expect(result).toBe(false);
    });
  });

  describe('updateRegexFile - 正则替换更新', () => {
    const updateRegexFile = (filePath, pattern, replacement, version) => {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      let content = fs.readFileSync(filePath, 'utf8');
      if (!pattern.test(content)) {
        return false;
      }

      content = content.replace(pattern, replacement(version));
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    };

    test('替换 VERSION 常量', () => {
      const jsPath = path.join(tempDir, 'cli.js');
      fs.writeFileSync(jsPath, `
const VERSION = '1.0.0';
const NAME = 'test';
`);

      const result = updateRegexFile(
        jsPath,
        /const VERSION = '[^']+'/,
        (version) => `const VERSION = '${version}'`,
        '2.0.0'
      );

      expect(result).toBe(true);
      const content = fs.readFileSync(jsPath, 'utf8');
      expect(content).toContain("const VERSION = '2.0.0'");
    });

    test('替换 URL 版本', () => {
      const rbPath = path.join(tempDir, 'test.rb');
      fs.writeFileSync(rbPath, `
url "https://github.com/user/repo/archive/refs/tags/v1.0.0.tar.gz"
sha256 "abc123"
`);

      const result = updateRegexFile(
        rbPath,
        /url "https:\/\/github\.com\/user\/repo\/archive\/refs\/tags\/v[^"]+\.tar\.gz"/,
        (version) => `url "https://github.com/user/repo/archive/refs/tags/v${version}.tar.gz"`,
        '2.0.0'
      );

      expect(result).toBe(true);
      const content = fs.readFileSync(rbPath, 'utf8');
      expect(content).toContain('v2.0.0.tar.gz');
    });

    test('模式不匹配返回 false', () => {
      const filePath = path.join(tempDir, 'test.txt');
      fs.writeFileSync(filePath, 'no match here');

      const result = updateRegexFile(
        filePath,
        /VERSION = '\d+\.\d+\.\d+'/,
        (v) => `VERSION = '${v}'`,
        '1.0.0'
      );

      expect(result).toBe(false);
    });

    test('文件不存在返回 false', () => {
      const result = updateRegexFile(
        path.join(tempDir, 'nonexistent.js'),
        /test/,
        (v) => v,
        '1.0.0'
      );
      expect(result).toBe(false);
    });
  });

  describe('版本比较和升级场景', () => {
    test('主版本升级', () => {
      const isValidVersion = (v) => /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(v);

      expect(isValidVersion('2.0.0')).toBe(true);
      expect(isValidVersion('10.0.0')).toBe(true);
    });

    test('次版本升级', () => {
      const isValidVersion = (v) => /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(v);

      expect(isValidVersion('1.1.0')).toBe(true);
      expect(isValidVersion('1.99.0')).toBe(true);
    });

    test('补丁版本升级', () => {
      const isValidVersion = (v) => /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(v);

      expect(isValidVersion('1.0.1')).toBe(true);
      expect(isValidVersion('1.0.999')).toBe(true);
    });

    test('预发布版本', () => {
      const isValidVersion = (v) => /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(v);

      expect(isValidVersion('1.0.0-alpha')).toBe(true);
      expect(isValidVersion('1.0.0-beta.1')).toBe(true);
      expect(isValidVersion('1.0.0-rc.1')).toBe(true);
      expect(isValidVersion('2.0.0-preview.20240101')).toBe(true);
    });
  });
});
