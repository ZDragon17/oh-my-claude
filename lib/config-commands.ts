/**
 * 配置命令模块
 * 负责处理 CLI 的配置管理命令
 */

import { configManager, OhMyClaudeConfig } from './config-manager.js';
import { log, info, error } from '../scripts/logger.js';
import { printCommandTitle } from './ui/messages.js';

// ==================== 配置显示 ====================

/**
 * 显示配置信息
 */
export function showConfig(): void {
  printCommandTitle('oh-my-claude 配置信息');

  const config = configManager.getConfig();

  console.log('\n当前配置:');
  console.log(`版本: ${config.version}`);
  console.log(`调试模式: ${config.debug ? '开启' : '关闭'}`);
  console.log(`日志级别: ${config.logLevel}`);

  console.log('\nAgent 配置:');
  console.log(`默认超时: ${config.agents.defaultTimeout}ms`);
  console.log(`最大并发任务: ${config.agents.maxConcurrentTasks}`);
  console.log(`启用协作: ${config.agents.enableCollaboration ? '是' : '否'}`);
  console.log(`上下文压缩: ${config.agents.contextCompression ? '是' : '否'}`);

  console.log('\nUI 配置:');
  console.log(`主题: ${config.ui.theme}`);
  console.log(`语言: ${config.ui.language}`);
  console.log(`显示进度: ${config.ui.showProgress ? '是' : '否'}`);
  console.log(`启用通知: ${config.ui.enableNotifications ? '是' : '否'}`);

  console.log('\n性能配置:');
  console.log(`启用缓存: ${config.performance.enableCache ? '是' : '否'}`);
  console.log(`缓存大小: ${config.performance.cacheSize}`);
  console.log(`最大内存: ${config.performance.maxMemoryUsage}MB`);
  console.log(`启用指标: ${config.performance.enableMetrics ? '是' : '否'}`);

  console.log('\n网络配置:');
  console.log(`超时时间: ${config.network.timeout}ms`);
  console.log(`重试次数: ${config.network.retries}`);
  if (config.network.proxy) {
    console.log(`代理服务器: ${config.network.proxy}`);
  }

  console.log('\n插件配置:');
  console.log(`自动更新: ${config.plugins.autoUpdate ? '是' : '否'}`);
  console.log(`允许第三方: ${config.plugins.enableThirdParty ? '是' : '否'}`);
  console.log(`可信域名: ${config.plugins.trustedDomains.join(', ')}`);

  console.log('\n高级配置:');
  console.log(`启用性能分析: ${config.advanced.enableProfiling ? '是' : '否'}`);
  console.log(`启用追踪: ${config.advanced.enableTracing ? '是' : '否'}`);
  console.log(`自定义钩子: ${Object.keys(config.advanced.customHooks).length} 个`);

  log('\n配置文件位置:', 'cyan');
  info('全局配置: ~/.oh-my-claude/config/global.json');
  info('用户配置: ~/.oh-my-claude/config.json');
  info('项目配置: ./.oh-my-claude.json 或 ./oh-my-claude.config.json');

  log('\n配置提示:', 'cyan');
  info('使用环境变量覆盖: OH_MY_CLAUDE_DEBUG=true');
  info('使用 oh-my-claude config 查看此信息');
  info('配置文件修改后自动热重载 (如果启用追踪)');
}

// ==================== 配置读写 ====================

/**
 * 获取配置值
 */
export function getConfigValue(key: string): void {
  try {
    const keys = key.split('.');
    let value: unknown = configManager.getConfig();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        throw new Error(`配置键不存在: ${key}`);
      }
    }

    console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`获取配置失败: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * 设置配置值
 */
export function setConfigValue(key: string, valueStr: string): void {
  try {
    let value: unknown;
    if (valueStr === 'true') value = true;
    else if (valueStr === 'false') value = false;
    else if (!isNaN(Number(valueStr))) value = Number(valueStr);
    else if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      value = JSON.parse(valueStr);
    } else {
      value = valueStr;
    }

    const keys = key.split('.');
    if (keys.length === 1) {
      configManager.set(key as keyof OhMyClaudeConfig, value as OhMyClaudeConfig[keyof OhMyClaudeConfig]);
    } else {
      const topKey = keys[0];
      const currentValue = configManager.get(topKey as keyof OhMyClaudeConfig);
      const updatedValue = setNestedValue(currentValue, keys.slice(1), value);
      configManager.set(topKey as keyof OhMyClaudeConfig, updatedValue as OhMyClaudeConfig[keyof OhMyClaudeConfig]);
    }

    console.log(`配置已更新: ${key} = ${JSON.stringify(value)}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`设置配置失败: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * 深度设置嵌套对象的值
 */
function setNestedValue(obj: unknown, keys: string[], value: unknown): unknown {
  if (keys.length === 0) {
    return value;
  }

  const [firstKey, ...remainingKeys] = keys;
  if (!firstKey) {
    return value;
  }

  if (keys.length === 1) {
    return { ...(obj as object), [firstKey]: value };
  }

  const currentObj = obj as Record<string, unknown>;
  return {
    ...currentObj,
    [firstKey]: setNestedValue(currentObj[firstKey] ?? {}, remainingKeys, value)
  };
}

/**
 * 保存配置到文件
 */
export async function saveConfigToFile(filePath?: string): Promise<void> {
  try {
    await configManager.saveConfig(filePath);
    console.log(`配置已保存${filePath ? `到 ${filePath}` : '到用户配置文件'}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error(`保存配置失败: ${errorMessage}`);
    process.exit(1);
  }
}

// ==================== 配置命令处理 ====================

/**
 * 打印配置命令帮助
 */
function printConfigHelp(): void {
  printCommandTitle('oh-my-claude 配置管理命令');
  console.log('\n用法: oh-my-claude config <subcommand> [参数...]');
  console.log('\n子命令:');
  console.log('  show                 显示当前配置');
  console.log('  get <key>           获取配置值');
  console.log('  set <key> <value>   设置配置值');
  console.log('  save [file]         保存配置到文件');
  console.log('  reset               重置为默认配置');
  console.log('  help                显示此帮助信息');
  console.log('\n示例:');
  console.log('  oh-my-claude config show');
  console.log('  oh-my-claude config get debug');
  console.log('  oh-my-claude config set debug true');
  console.log('  oh-my-claude config set agents.defaultTimeout 60000');
  console.log('  oh-my-claude config save');
  console.log('  oh-my-claude config save ~/.oh-my-claude/my-config.json');
  console.log('\n配置键支持点号分隔的嵌套访问:');
  console.log('  agents.defaultTimeout, ui.theme, performance.cacheSize 等');
}

/**
 * 处理配置命令
 */
export async function handleConfigCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    showConfig();
    return;
  }

  const subcommand = args[0];

  switch (subcommand) {
    case 'show':
      showConfig();
      break;

    case 'get': {
      const key = args[1];
      if (!key) {
        error('用法: oh-my-claude config get <key>');
        error('示例: oh-my-claude config get debug');
        error('       oh-my-claude config get agents.defaultTimeout');
        process.exit(1);
      }
      getConfigValue(key);
      break;
    }

    case 'set': {
      const setKey = args[1];
      const setValue = args[2];
      if (!setKey || !setValue) {
        error('用法: oh-my-claude config set <key> <value>');
        error('示例: oh-my-claude config set debug true');
        error('       oh-my-claude config set agents.defaultTimeout 60000');
        error('       oh-my-claude config set ui.theme dark');
        process.exit(1);
      }
      setConfigValue(setKey, setValue);
      break;
    }

    case 'save': {
      const configFilePath = args.length > 1 ? args[1] : undefined;
      await saveConfigToFile(configFilePath);
      break;
    }

    case 'reset':
      configManager.resetToDefaults();
      await configManager.saveConfig();
      console.log('配置已重置为默认值');
      break;

    case 'help':
    default:
      printConfigHelp();
      break;
  }
}
