#!/usr/bin/env node

/**
 * postinstall script for oh-my-claude
 * 在 npm install 后显示安装提示和引导
 */

// ANSI 颜色代码 (CJS 模块不能导入 ESM logger)
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// 检测语言环境
const isChineseLocale = (process.env.LANG || process.env.LC_ALL || '').toLowerCase().includes('zh');

// 双语消息
const messages = {
  title: isChineseLocale ? '🏔️  oh-my-claude 已下载' : '🏔️  oh-my-claude Downloaded',
  nextSteps: isChineseLocale ? '📋 下一步操作' : '📋 Next Steps',
  installPrompt: isChineseLocale ? '请运行以下命令完成安装:' : 'Run the following command to complete installation:',
  orGlobal: isChineseLocale ? '或者如果你全局安装了:' : 'Or if you installed globally:',
  quickStart: isChineseLocale ? '🚀 快速开始' : '🚀 Quick Start',
  afterInstall: isChineseLocale ? '安装完成后，在 Claude Code 中尝试:' : 'After installation, try in Claude Code:',
  moveMount: isChineseLocale ? '# 愚公移山模式 - 持续执行直到完成' : '# YuGong Mode - Persistent execution until completion',
  strategy: isChineseLocale ? '# 诸葛顾问 - 架构设计建议' : '# ZhuGe Advisor - Architecture design suggestions',
  debug: isChineseLocale ? '# 扁鹊诊断 - Bug 分析与修复' : '# BianQue Diagnosis - Bug analysis and fixes',
  docs: isChineseLocale ? '📖 文档' : '📖 Documentation',
  docsChinese: 'Chinese: https://github.com/ZDragon17/oh-my-claude#readme',
  docsEnglish: 'English: https://github.com/ZDragon17/oh-my-claude/blob/main/README_EN.md',
  features: isChineseLocale ? '✨ 特性' : '✨ Features',
  feature1: isChineseLocale ? '• 20+ 专业化 Agent（基于中国传统文化人物）' : '• 20+ Specialized Agents (based on Chinese cultural figures)',
  feature2: isChineseLocale ? '• 愚公移山模式 - 持续执行直到任务完成' : '• YuGong Mode - Persistent execution until task completion',
  feature3: isChineseLocale ? '• 智能 Hook 系统 - 33+ 内置功能增强' : '• Smart Hook System - 33+ built-in enhancements',
  feature4: isChineseLocale ? '• 内置 MCP 服务器 - Context7, Grep.app 等' : '• Built-in MCP Servers - Context7, Grep.app, etc.',
  needHelp: isChineseLocale ? '❓ 需要帮助?' : '❓ Need Help?',
  issuesLink: 'Issues: https://github.com/ZDragon17/oh-my-claude/issues'
};

console.log(`
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bold}${colors.cyan}${messages.title}${colors.reset}
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.yellow}${colors.bold}${messages.nextSteps}${colors.reset}
${colors.dim}${messages.installPrompt}${colors.reset}

  ${colors.green}npx claude-pangu install${colors.reset}

${colors.dim}${messages.orGlobal}${colors.reset}

  ${colors.green}claude-pangu install${colors.reset}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.magenta}${colors.bold}${messages.quickStart}${colors.reset}
${colors.dim}${messages.afterInstall}${colors.reset}

  ${colors.blue}/yishan ${colors.dim}${messages.moveMount}${colors.reset}
  ${colors.blue}/zhuge  ${colors.dim}${messages.strategy}${colors.reset}
  ${colors.blue}/bianque ${colors.dim}${messages.debug}${colors.reset}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.green}${colors.bold}${messages.features}${colors.reset}
  ${messages.feature1}
  ${messages.feature2}
  ${messages.feature3}
  ${messages.feature4}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.blue}${colors.bold}${messages.docs}${colors.reset}
  ${messages.docsChinese}
  ${messages.docsEnglish}

${colors.yellow}${colors.bold}${messages.needHelp}${colors.reset}
  ${messages.issuesLink}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);
