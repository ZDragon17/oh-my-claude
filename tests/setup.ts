/**
 * Jest 测试设置文件
 * 在每个测试文件运行前执行
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 全局测试超时
// 注意：这里不设置全局超时，让每个测试文件自己控制

// 清理控制台输出（可选）
// beforeAll(() => {
//   console.log('🚀 开始运行测试套件');
// });

// afterAll(() => {
//   console.log('✅ 测试套件运行完成');
// });

// 如果需要全局 mock，可以在这里添加
// 例如：mock 文件系统操作等

// 导出通用的测试工具函数
global.testUtils = {
  // 创建临时目录
  createTempDir: () => {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const crypto = require('crypto');

    const tempDir = path.join(os.tmpdir(), 'oh-my-claude-test-' + crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  },

  // 清理临时目录
  cleanupTempDir: (dirPath: string) => {
    const fs = require('fs');
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  },

  // 等待异步操作
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};