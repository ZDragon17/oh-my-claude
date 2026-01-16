/**
 * Jest 配置文件 - TypeScript 版本
 * oh-my-claude 测试配置
 */

module.exports = {
  // 使用 ts-jest preset
  preset: 'ts-jest',

  // 测试环境
  testEnvironment: 'node',

  // 测试文件根目录
  roots: ['<rootDir>/tests', '<rootDir>/lib', '<rootDir>/scripts'],

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // TypeScript 转换
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],

  // 覆盖率配置
  collectCoverageFrom: [
    'lib/**/*.ts',
    'scripts/**/*.ts',
    '!lib/**/*.d.ts',
    '!scripts/**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],

  // 覆盖率报告输出目录
  coverageDirectory: 'coverage',

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // 覆盖率阈值
  // TypeScript 版本的目标覆盖率更高，因为核心逻辑已模块化
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 测试超时时间（毫秒）
  testTimeout: 10000,

  // 测试前清理 mock
  clearMocks: true,
  restoreMocks: true,

  // 详细输出
  verbose: true,

  // 强制退出（避免异步操作 hang）
  forceExit: true,

  // 设置根目录
  rootDir: '.',
};
