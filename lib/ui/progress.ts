/**
 * 进度显示器模块
 * 用于在 CLI 中显示操作进度
 */

import { colors, success, error, info } from '../../scripts/logger.js';

/**
 * 进度显示器类
 * 支持交互式和非交互式终端
 */
export class ProgressIndicator {
  private totalSteps: number;
  private currentStep: number;
  private description: string;
  private startTime: number;
  private isInteractive: boolean;

  constructor(totalSteps: number, description: string = '处理中') {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.description = description;
    this.startTime = Date.now();
    this.isInteractive = process.stdout.isTTY ?? false;
  }

  /**
   * 更新进度
   */
  update(stepDescription: string = ''): void {
    this.currentStep++;
    const percent = Math.round((this.currentStep / this.totalSteps) * 100);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    if (this.isInteractive) {
      // 交互式终端：使用回车覆盖当前行
      const progressBar = this.createProgressBar(percent);
      process.stdout.write(`\r${colors.cyan}${progressBar} ${percent}%${colors.reset} ${stepDescription}`.padEnd(80));
    } else {
      // 非交互式终端：每次输出新行
      info(`[${this.currentStep}/${this.totalSteps}] ${stepDescription}`);
    }
  }

  /**
   * 创建进度条
   */
  private createProgressBar(percent: number): string {
    const total = 20;
    const filled = Math.round((percent / 100) * total);
    const empty = total - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * 完成进度
   */
  complete(message: string = '完成'): void {
    if (this.isInteractive) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r'); // 清除进度行
    }
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    success(`${message} (耗时 ${elapsed}s)`);
  }

  /**
   * 失败时清理
   */
  fail(message: string = '失败'): void {
    if (this.isInteractive) {
      process.stdout.write('\r' + ' '.repeat(80) + '\r'); // 清除进度行
    }
    error(`${message}`);
  }

  /**
   * 获取当前进度百分比
   */
  getPercent(): number {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  /**
   * 获取已用时间（秒）
   */
  getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}
