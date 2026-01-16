#!/usr/bin/env node

/**
 * postinstall script for oh-my-claude
 * 在 npm install 后显示安装提示
 */

// 使用共享日志模块
const { colors } = require('./logger');

console.log(`
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.cyan}🏔️  oh-my-claude 已下载${colors.reset}
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.yellow}请运行以下命令完成安装:${colors.reset}

  ${colors.green}npx claude-pangu install${colors.reset}

或者如果你全局安装了:

  ${colors.green}claude-pangu install${colors.reset}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);
