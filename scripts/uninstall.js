#!/usr/bin/env node

/**
 * 独立卸载脚本
 * 可通过 npm run uninstall-plugin 调用
 */

require('./cli.js');
process.argv.push('uninstall');
