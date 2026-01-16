#!/usr/bin/env node

/**
 * postinstall script for oh-my-claude
 * 在 npm install 后显示安装提示
 */

// ANSI 颜色代码 (CJS 模块不能导入 ESM logger)
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

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
