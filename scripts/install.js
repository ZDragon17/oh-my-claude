#!/usr/bin/env node

/**
 * 独立安装脚本
 * 可通过 npm run install-plugin 调用
 */

// 必须在 require 之前修改 argv
process.argv.push('install');
require('./cli.js');
