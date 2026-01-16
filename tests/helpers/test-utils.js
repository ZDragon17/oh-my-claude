/**
 * 测试辅助工具函数
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 创建临时测试目录
 * @param {string} prefix - 目录前缀
 * @returns {string} 临时目录路径
 */
function createTempDir(prefix = 'oh-my-claude-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * 清理临时目录
 * @param {string} dirPath - 目录路径
 */
function cleanupTempDir(dirPath) {
  if (dirPath && fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * 创建测试文件结构
 * @param {string} baseDir - 基础目录
 * @param {Object} structure - 文件结构对象
 */
function createFileStructure(baseDir, structure) {
  for (const [name, content] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, name);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (typeof content === 'object' && content !== null) {
      // 目录或嵌套结构
      fs.mkdirSync(fullPath, { recursive: true });
      createFileStructure(fullPath, content);
    } else {
      // 文件
      fs.writeFileSync(fullPath, content || '', 'utf8');
    }
  }
}

/**
 * 读取目录结构
 * @param {string} dirPath - 目录路径
 * @returns {Object} 文件结构对象
 */
function readFileStructure(dirPath) {
  const structure = {};
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      structure[entry.name] = readFileStructure(path.join(dirPath, entry.name));
    } else {
      structure[entry.name] = fs.readFileSync(path.join(dirPath, entry.name), 'utf8');
    }
  }

  return structure;
}

/**
 * 捕获控制台输出
 * @returns {Object} 包含 start, stop, getOutput 方法的对象
 */
function captureConsole() {
  const logs = [];
  const errors = [];
  const warnings = [];
  const originals = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  return {
    start() {
      console.log = (...args) => logs.push(args.join(' '));
      console.error = (...args) => errors.push(args.join(' '));
      console.warn = (...args) => warnings.push(args.join(' '));
    },
    stop() {
      console.log = originals.log;
      console.error = originals.error;
      console.warn = originals.warn;
    },
    getOutput() {
      return { logs, errors, warnings };
    },
    clear() {
      logs.length = 0;
      errors.length = 0;
      warnings.length = 0;
    },
  };
}

/**
 * 延迟执行
 * @param {number} ms - 毫秒数
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建模拟的 plugin 目录结构
 * @param {string} baseDir - 基础目录
 */
function createMockPluginStructure(baseDir) {
  const structure = {
    'agents/yugong.md': '# 愚公移山',
    'agents/zhuge.md': '# 诸葛亮',
    'agents/baozheng.md': '# 包拯',
    'commands/yishan.md': '# 移山命令',
    'skills/progress.md': '# 进度技能',
    '.claude-plugin/plugin.json': JSON.stringify({
      name: 'oh-my-claude',
      version: '1.0.0',
    }, null, 2),
    'hooks/test-hook.sh': '#!/bin/bash\necho "test"',
    'README.md': '# Test',
    'LICENSE': 'MIT',
  };

  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
  }
}

module.exports = {
  createTempDir,
  cleanupTempDir,
  createFileStructure,
  readFileStructure,
  captureConsole,
  delay,
  createMockPluginStructure,
};
