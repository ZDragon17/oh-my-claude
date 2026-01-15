#!/usr/bin/env node

/**
 * postinstall script for oh-my-claude
 * 在 npm install 后显示安装提示
 */

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

console.log(`
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.cyan}🏔️  oh-my-claude 已下载${colors.reset}
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.yellow}请运行以下命令完成安装:${colors.reset}

  ${colors.green}npx oh-my-claude install${colors.reset}

或者如果你全局安装了:

  ${colors.green}oh-my-claude install${colors.reset}

${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`);
