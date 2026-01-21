#!/usr/bin/env ts-node
/**
 * Hook 性能统计分析工具
 *
 * 用法：
 *   npx ts-node scripts/hook-stats.ts [选项]
 *
 * 选项：
 *   --summary    显示汇总统计
 *   --slow       显示最慢的 Hook
 *   --failed     显示失败的 Hook
 *   --last=N     只分析最近 N 条记录
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface HookPerfEntry {
  timestamp: string;
  hook: string;
  duration_ms: number;
  status: 'success' | 'failed';
  exit_code: number;
}

interface HookStats {
  name: string;
  count: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  failCount: number;
  failRate: number;
}

const DEFAULT_LOG_PATH = path.join(os.homedir(), '.oh-my-claude', 'logs', 'hooks-perf.log');

function readPerfLog(logPath: string, limit?: number): HookPerfEntry[] {
  if (!fs.existsSync(logPath)) {
    console.log(`性能日志文件不存在: ${logPath}`);
    console.log('请确保已启用性能监控: export OH_MY_CLAUDE_PROFILE=true');
    return [];
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  let entries: HookPerfEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // 跳过无效行
    }
  }

  if (limit && limit > 0) {
    entries = entries.slice(-limit);
  }

  return entries;
}

function calculateStats(entries: HookPerfEntry[]): Map<string, HookStats> {
  const statsMap = new Map<string, HookStats>();

  for (const entry of entries) {
    let stats = statsMap.get(entry.hook);

    if (!stats) {
      stats = {
        name: entry.hook,
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity,
        failCount: 0,
        failRate: 0,
      };
      statsMap.set(entry.hook, stats);
    }

    stats.count++;
    stats.totalTime += entry.duration_ms;
    stats.maxTime = Math.max(stats.maxTime, entry.duration_ms);
    stats.minTime = Math.min(stats.minTime, entry.duration_ms);

    if (entry.status === 'failed') {
      stats.failCount++;
    }
  }

  // 计算平均值和失败率
  for (const stats of statsMap.values()) {
    stats.avgTime = Math.round(stats.totalTime / stats.count);
    stats.failRate = Math.round((stats.failCount / stats.count) * 100);
    if (stats.minTime === Infinity) stats.minTime = 0;
  }

  return statsMap;
}

function printSummary(statsMap: Map<string, HookStats>): void {
  console.log('\n📊 Hook 性能统计汇总\n');
  console.log('=' .repeat(80));
  console.log(
    'Hook'.padEnd(35) +
    '调用次数'.padStart(10) +
    '平均(ms)'.padStart(12) +
    '最大(ms)'.padStart(12) +
    '失败率'.padStart(10)
  );
  console.log('-'.repeat(80));

  const sorted = Array.from(statsMap.values()).sort((a, b) => b.avgTime - a.avgTime);

  for (const stats of sorted) {
    const failRateStr = stats.failRate > 0 ? `${stats.failRate}%` : '-';
    console.log(
      stats.name.padEnd(35) +
      stats.count.toString().padStart(10) +
      stats.avgTime.toString().padStart(12) +
      stats.maxTime.toString().padStart(12) +
      failRateStr.padStart(10)
    );
  }

  console.log('=' .repeat(80));

  // 总计
  const totalCalls = Array.from(statsMap.values()).reduce((sum, s) => sum + s.count, 0);
  const totalTime = Array.from(statsMap.values()).reduce((sum, s) => sum + s.totalTime, 0);
  const totalFails = Array.from(statsMap.values()).reduce((sum, s) => sum + s.failCount, 0);

  console.log(`\n总计: ${totalCalls} 次调用, ${totalTime}ms 总耗时, ${totalFails} 次失败`);
}

function printSlowest(statsMap: Map<string, HookStats>, top: number = 5): void {
  console.log(`\n🐢 最慢的 ${top} 个 Hook\n`);

  const sorted = Array.from(statsMap.values())
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, top);

  for (let i = 0; i < sorted.length; i++) {
    const stats = sorted[i];
    const bar = '█'.repeat(Math.min(20, Math.round(stats.avgTime / 100)));
    console.log(`${i + 1}. ${stats.name}`);
    console.log(`   ${bar} ${stats.avgTime}ms (最大: ${stats.maxTime}ms)`);
  }
}

function printFailed(entries: HookPerfEntry[]): void {
  const failed = entries.filter(e => e.status === 'failed');

  if (failed.length === 0) {
    console.log('\n✅ 没有失败的 Hook 记录\n');
    return;
  }

  console.log(`\n❌ 失败的 Hook (共 ${failed.length} 次)\n`);

  // 按 Hook 名称分组
  const grouped = new Map<string, number>();
  for (const entry of failed) {
    grouped.set(entry.hook, (grouped.get(entry.hook) || 0) + 1);
  }

  const sorted = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]);

  for (const [hook, count] of sorted) {
    console.log(`  ${hook}: ${count} 次失败`);
  }
}

function printUsage(): void {
  console.log(`
Hook 性能统计分析工具

用法：
  npx ts-node scripts/hook-stats.ts [选项]

选项：
  --summary    显示汇总统计（默认）
  --slow       显示最慢的 Hook
  --failed     显示失败的 Hook
  --last=N     只分析最近 N 条记录
  --log=PATH   指定日志文件路径

示例：
  npx ts-node scripts/hook-stats.ts --summary
  npx ts-node scripts/hook-stats.ts --slow --last=100
  npx ts-node scripts/hook-stats.ts --failed
`);
}

// 主函数
function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  // 解析参数
  let logPath = DEFAULT_LOG_PATH;
  let limit: number | undefined;
  let showSummary = true;
  let showSlow = false;
  let showFailed = false;

  for (const arg of args) {
    if (arg.startsWith('--log=')) {
      logPath = arg.slice(6);
    } else if (arg.startsWith('--last=')) {
      limit = parseInt(arg.slice(7), 10);
    } else if (arg === '--slow') {
      showSlow = true;
      showSummary = false;
    } else if (arg === '--failed') {
      showFailed = true;
      showSummary = false;
    } else if (arg === '--summary') {
      showSummary = true;
    }
  }

  // 读取日志
  const entries = readPerfLog(logPath, limit);

  if (entries.length === 0) {
    return;
  }

  console.log(`📂 日志文件: ${logPath}`);
  console.log(`📝 分析记录数: ${entries.length}`);

  // 计算统计
  const statsMap = calculateStats(entries);

  // 输出结果
  if (showSummary) {
    printSummary(statsMap);
  }

  if (showSlow) {
    printSlowest(statsMap);
  }

  if (showFailed) {
    printFailed(entries);
  }
}

main();
