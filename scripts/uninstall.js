#!/usr/bin/env node

/**
 * 独立卸载脚本
 * 可通过 npm run uninstall-plugin 调用
 */

// 必须在 require 之前修改 argv
process.argv.push('uninstall');
require('./cli.js');
