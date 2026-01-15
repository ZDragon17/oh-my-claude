#!/usr/bin/env node

/**
 * 独立安装脚本
 * 可通过 npm run install-plugin 调用
 */

require('./cli.js');
process.argv.push('install');
