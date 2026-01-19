/**
 * UI 消息输出模块
 * 提供统一的消息格式化和输出函数
 */

import * as os from 'os';
import { log, info, warn } from '../../scripts/logger.js';
import { DIVIDER_LENGTH, DIVIDER_LONG_LENGTH, GITHUB_ISSUES_URL, VERSION } from '../constants.js';

/**
 * 打印分隔线
 */
export function printDivider(color: string = 'cyan', long: boolean = false): void {
  const length = long ? DIVIDER_LONG_LENGTH : DIVIDER_LENGTH;
  log('━'.repeat(length), color);
}

/**
 * 打印标题
 */
export function printTitle(title: string, color: string = 'cyan'): void {
  log(`\n${title}`, color);
  printDivider(color);
}

/**
 * 打印命令帮助标题
 */
export function printCommandTitle(title: string): void {
  printTitle(`🏔️  ${title}`, 'cyan');
}

/**
 * 打印版本号
 */
export function printVersion(): void {
  console.log(`oh-my-claude v${VERSION}`);
}

/**
 * 打印 GitHub Issues 链接
 */
export function printIssuesLink(): void {
  console.log(`\n如需帮助，请访问: ${GITHUB_ISSUES_URL}\n`);
}

/**
 * 打印成功完成信息
 */
export function printSuccess(message: string = '完成!'): void {
  log(`\n🎉 ${message}`, 'green');
  printDivider('green');
}

/**
 * 打印安装完成提示
 */
export function printInstallComplete(pluginDir: string, commandsDir: string, skillsDir: string): void {
  printSuccess('安装完成!');
  log('');
  warn('重要：请完全退出并重新启动 Claude Code 以加载新命令');
  warn('   (仅关闭窗口可能不够，需要完全退出应用)');
  if (os.platform() === 'darwin') {
    warn('   macOS: 使用 Cmd+Q 完全退出应用');
    warn('   如果命令仍未加载，尝试: rm ~/.claude.json && 重启 Claude Code');
  }
  log('');
  log('快速开始:', 'cyan');
  info('  /yishan  - 愚公移山模式（大规模任务）');
  info('  /zhuge   - 诸葛顾问（架构设计）');
  info('  /bianque - 扁鹊诊断（调试问题）');
  info('  /luban   - 鲁班巧工（代码实现）');
  info('  /wukong  - 悟空侦察（代码搜索）');
  log('');
  log('安装位置:', 'cyan');
  info(`  Commands: ${commandsDir}`);
  info(`  Skills:   ${skillsDir}`);
  info(`  Plugin:   ${pluginDir}`);
  log('');
  log('故障排除:', 'cyan');
  info('  如果命令未出现在 /help 中：');
  info('  1. 确保完全退出 Claude Code（不只是关闭窗口）');
  info('  2. 检查文件是否存在: ls ~/.claude/commands/');
  info('  3. 清除缓存: rm ~/.claude.json && 重启');
  log('');
}

/**
 * 打印更新完成提示
 */
export function printUpdateComplete(): void {
  printSuccess('更新完成!');
  log('');
  warn('重要：请完全退出并重新启动 Claude Code 以加载新命令');
  warn('   (仅关闭窗口可能不够，需要完全退出应用)');
  if (os.platform() === 'darwin') {
    warn('   macOS: 使用 Cmd+Q 完全退出应用');
    warn('   如果命令仍未加载，尝试: rm ~/.claude.json && 重启 Claude Code');
  }
  log('');
  log('故障排除:', 'cyan');
  info('  如果命令未出现在 /help 中：');
  info('  1. 确保完全退出 Claude Code（不只是关闭窗口）');
  info('  2. 检查文件是否存在: ls ~/.claude/commands/');
  info('  3. 清除缓存: rm ~/.claude.json && 重启');
  log('');
}

/**
 * 打印帮助信息
 */
export function printHelp(): void {
  console.log('\n🏔️  oh-my-claude - 基于中国传统文化的 Claude Code 智能编排插件 (TypeScript 版本)');
  printDivider('cyan', true);
  console.log('\n用法: oh-my-claude <command>\n');
  console.log('命令:');
  console.log('  install     安装插件到 Claude Code');
  console.log('  uninstall   卸载插件');
  console.log('  update      更新插件');
  console.log('  verify      验证安装');
  console.log('  config      配置管理 (show/get/set/save)');
  console.log('  version     显示版本号');
  console.log('  benchmark   运行性能基准测试');
  console.log('  help        显示帮助信息');
  console.log('\n别名:');
  console.log('  i           install');
  console.log('  rm, remove  uninstall');
  console.log('  up, upgrade update');
  console.log('  check, doctor verify');
  console.log('\n示例:');
  console.log('  npx oh-my-claude install');
  console.log('  oh-my-claude config show');
  console.log('  oh-my-claude config set debug true');
  console.log('  oh-my-claude benchmark');
  console.log('  oh-my-claude version');
}
