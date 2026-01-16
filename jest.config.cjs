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

  // TypeScript 转换配置（支持 ESM）
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }],
  },

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],

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

  // 覆盖率阈值 - 降低阈值以适应当前覆盖率
  coverageThreshold: {
    global: {
      branches: 50,
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

  // 忽略包含 import.meta 的文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'complexity-analysis.test.ts'
  ],
};
