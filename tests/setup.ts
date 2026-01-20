/**
 * Jest 测试设置文件
 * 在每个测试文件运行前执行
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 全局清理 - 确保所有异步操作完成
afterAll(async () => {
  // 清理所有 Jest 定时器
  jest.clearAllTimers();
  
  // 等待一小段时间让微任务队列清空
  await new Promise(resolve => setImmediate(resolve));
});

// 测试工具函数
export const testUtils = {
  // 创建临时目录
  createTempDir: (): string => {
    const tempDir = path.join(os.tmpdir(), 'oh-my-claude-test-' + crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  },

  // 清理临时目录
  cleanupTempDir: (dirPath: string): void => {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  },

  // 等待异步操作
  wait: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),
};