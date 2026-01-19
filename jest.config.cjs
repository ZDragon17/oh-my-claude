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
  roots: ['<rootDir>/tests', '<rootDir>/lib'],

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // TypeScript 转换配置
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2020',
      }
    }],
  },

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],

  // 模块名称映射（解决 ESM .js 扩展名问题）
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // 覆盖率配置 - 只测试 lib 目录
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],

  // 覆盖率报告输出目录
  coverageDirectory: 'coverage',

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // 覆盖率阈值 - 提升到 60% 水平
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 60,
      lines: 60,
      statements: 60,
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

  // 忽略 node_modules 和 dist 目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};
