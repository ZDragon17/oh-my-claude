#!/usr/bin/env ts-node
/**
 * Hook 兼容性检测脚本
 *
 * 检测当前系统环境下 Hook 的兼容性，并给出建议
 *
 * 用法：
 *   npx ts-node scripts/check-hooks.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Hook 优先级类型（用于将来扩展）
export type HookPriority = 'critical' | 'high' | 'normal' | 'low';

// Hook 类型定义
interface HookConfig {
  type?: string;
  command: string;
  windows_compatible?: boolean;
  priority?: HookPriority;
  timeout?: number;
  continueOnError?: boolean;
  description?: string;
  [key: string]: unknown;
}

interface HooksJson {
  hooks: {
    [hookType: string]: HookConfig[];
  };
}

// 从 hooks.json 读取配置
function loadHooksConfig(): HooksJson {
  const hooksPath = path.join(__dirname, '..', 'hooks', 'hooks.json');
  if (!fs.existsSync(hooksPath)) {
    console.error('❌ hooks.json 不存在');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
}

// 检测命令是否可用
function isCommandAvailable(cmd: string): boolean {
  try {
    if (os.platform() === 'win32') {
      execSync(`where ${cmd}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

// 检测系统环境
function detectEnvironment(): {
  platform: string;
  hasBash: boolean;
  hasJq: boolean;
  hasTmux: boolean;
  hasNotifySend: boolean;
  hasPowerShell: boolean;
} {
  const platform = os.platform();

  return {
    platform,
    hasBash: isCommandAvailable('bash'),
    hasJq: isCommandAvailable('jq'),
    hasTmux: isCommandAvailable('tmux'),
    hasNotifySend: isCommandAvailable('notify-send'),
    hasPowerShell: platform === 'win32' || isCommandAvailable('pwsh'),
  };
}

// 提取 Hook 文件名
function extractHookName(command: string | undefined): string {
  if (!command) return 'unknown';
  const match = command.match(/hooks\/([^.]+)\.sh/);
  return match && match[1] ? match[1] : command;
}

// 检查单个 Hook 的兼容性
function checkHookCompatibility(
  hook: HookConfig,
  env: ReturnType<typeof detectEnvironment>
): {
  name: string;
  compatible: boolean;
  reason?: string;
  suggestion?: string;
} {
  const name = extractHookName(hook.command);
  const isWindowsIncompatible = hook.windows_compatible === false;
  // priority reserved for future use
  // const priority = hook.priority || 'normal';

  // Windows 平台检测
  if (env.platform === 'win32') {
    if (isWindowsIncompatible) {
      return {
        name,
        compatible: false,
        reason: '此 Hook 不支持 Windows',
        suggestion: '安装 WSL 或 Git Bash 以获得完整支持',
      };
    }

    if (!env.hasBash) {
      return {
        name,
        compatible: false,
        reason: 'Windows 上未检测到 Bash',
        suggestion: '安装 Git for Windows (包含 Git Bash)',
      };
    }
  }

  // 检测特定依赖
  if (name.includes('interactive-bash-session') && !env.hasTmux) {
    return {
      name,
      compatible: false,
      reason: '需要 tmux',
      suggestion: '安装 tmux: brew install tmux (macOS) 或 apt install tmux (Linux)',
    };
  }

  if (name.includes('lsp-tools') && env.platform === 'win32') {
    return {
      name,
      compatible: false,
      reason: 'LSP 工具在 Windows 上支持有限',
      suggestion: '使用 IDE 内置的 LSP 功能',
    };
  }

  return { name, compatible: true };
}

// 主函数
function main(): void {
  console.log('🔍 oh-my-claude Hook 兼容性检测\n');
  console.log('=' .repeat(60));

  // 检测环境
  const env = detectEnvironment();

  console.log('\n📋 系统环境:\n');
  console.log(`  平台: ${env.platform}`);
  console.log(`  Bash: ${env.hasBash ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`  jq: ${env.hasJq ? '✅ 可用' : '⚠️ 不可用（部分功能受限）'}`);
  console.log(`  tmux: ${env.hasTmux ? '✅ 可用' : '⚠️ 不可用'}`);
  if (env.platform === 'linux') {
    console.log(`  notify-send: ${env.hasNotifySend ? '✅ 可用' : '⚠️ 不可用'}`);
  }
  if (env.platform === 'win32') {
    console.log(`  PowerShell: ${env.hasPowerShell ? '✅ 可用' : '❌ 不可用'}`);
  }

  // 加载并检查 Hooks
  const config = loadHooksConfig();
  const allHooks: HookConfig[] = [
    ...(config.hooks.Stop || []),
    ...(config.hooks.UserPromptSubmit || []),
    ...(config.hooks.PostToolUse || []),
  ];

  console.log('\n📊 Hook 兼容性检查:\n');

  const results = {
    compatible: [] as string[],
    incompatible: [] as { name: string; reason: string; suggestion: string }[],
  };

  for (const hook of allHooks) {
    const result = checkHookCompatibility(hook, env);

    if (result.compatible) {
      results.compatible.push(result.name);
    } else {
      results.incompatible.push({
        name: result.name,
        reason: result.reason || '未知原因',
        suggestion: result.suggestion || '无建议',
      });
    }
  }

  // 输出兼容的 Hooks
  console.log(`✅ 兼容的 Hooks (${results.compatible.length}):`);
  if (results.compatible.length <= 10) {
    for (const name of results.compatible) {
      console.log(`   - ${name}`);
    }
  } else {
    console.log(`   ${results.compatible.slice(0, 5).join(', ')} 等 ${results.compatible.length} 个`);
  }

  // 输出不兼容的 Hooks
  if (results.incompatible.length > 0) {
    console.log(`\n❌ 不兼容的 Hooks (${results.incompatible.length}):`);
    for (const item of results.incompatible) {
      console.log(`   - ${item.name}`);
      console.log(`     原因: ${item.reason}`);
      console.log(`     建议: ${item.suggestion}`);
    }
  }

  // 总结
  console.log('\n' + '=' .repeat(60));
  const compatRate = Math.round((results.compatible.length / allHooks.length) * 100);
  console.log(`\n📈 兼容性: ${compatRate}% (${results.compatible.length}/${allHooks.length})`);

  if (compatRate === 100) {
    console.log('\n🎉 所有 Hook 在当前环境下完全兼容！');
  } else if (compatRate >= 80) {
    console.log('\n✅ 大部分 Hook 兼容，核心功能正常工作');
  } else if (compatRate >= 50) {
    console.log('\n⚠️ 部分 Hook 不兼容，建议安装缺失的依赖');
  } else {
    console.log('\n❌ 多数 Hook 不兼容，请检查系统环境');
  }

  // Windows 特定建议
  if (env.platform === 'win32' && !env.hasBash) {
    console.log('\n💡 Windows 用户建议:');
    console.log('   1. 安装 Git for Windows: https://git-scm.com/download/win');
    console.log('   2. 或安装 WSL: wsl --install');
    console.log('   3. 参考文档: docs/WINDOWS_SUPPORT.md');
  }

  console.log('');
}

main();
