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
  // 注意：由于 cli.js 包含大量 CLI 命令行操作代码（install/uninstall/update/verify），
  // 这些代码涉及系统交互（文件系统、进程调用、用户输入），难以进行纯单元测试。
  // 实际可测试的核心函数（sanitize、copyDir、lock 等）覆盖率较高。
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 30,
      lines: 25,
      statements: 25,
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
