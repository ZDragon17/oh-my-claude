/**
 * Jest 配置文件
 * oh-my-claude 测试配置
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js',
  ],

  // 覆盖率配置
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/install.js',
    '!scripts/uninstall.js',
    '!scripts/postinstall.js',
    '!**/node_modules/**',
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // 覆盖率报告输出目录
  coverageDirectory: 'coverage',

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html'],

  // 测试超时时间（毫秒）
  testTimeout: 10000,

  // 测试前清理 mock
  clearMocks: true,

  // 详细输出
  verbose: true,

  // 设置根目录
  rootDir: '.',

  // 模块路径映射
  moduleDirectories: ['node_modules', 'scripts'],
};
