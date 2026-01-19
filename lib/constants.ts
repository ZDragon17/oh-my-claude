/**
 * oh-my-claude CLI 常量配置
 * 集中管理所有常量，避免魔法数字和字符串
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * 获取当前模块所在目录
 * 兼容 ESM 和 CommonJS 环境
 */
function getCurrentDir(): string {
  // CommonJS 环境 (Jest, Node CJS)
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  
  // ESM 环境 - 动态导入 url 模块
  try {
    // 使用 eval 避免 TypeScript 在 CommonJS 模式下报错
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const getMetaUrl = new Function('return import.meta.url');
    const metaUrl = getMetaUrl() as string;
    const { fileURLToPath } = require('url') as { fileURLToPath: (url: string) => string };
    return path.dirname(fileURLToPath(metaUrl));
  } catch {
    // 后备：返回 process.cwd()
    return process.cwd();
  }
}

// ==================== 版本和名称 ====================

/**
 * 获取 package.json 版本号
 * 兼容 ESM、CommonJS 和 npx 环境
 */
function getPackageVersion(): string {
  // 查找并验证 package.json
  const findPackageJson = (dir: string): string | null => {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string; version?: string };
      if (pkg.name === 'claude-pangu' || pkg.name === 'oh-my-claude') {
        return pkg.version || '0.0.0';
      }
    } catch {
      // 忽略解析错误
    }
    return null;
  };

  try {
    const currentDir = getCurrentDir();
    
    // 方法 1: 从当前模块目录向上查找
    const candidatePaths = [
      path.resolve(currentDir, '..'),           // lib/ -> 根目录
      path.resolve(currentDir, '..', '..'),     // dist/lib/ -> 根目录
      path.resolve(currentDir, '..', '..', '..'), // 深层嵌套
    ];
    
    for (const candidate of candidatePaths) {
      const version = findPackageJson(candidate);
      if (version) return version;
    }
    
    // 向上遍历查找
    let searchDir = currentDir;
    for (let i = 0; i < 10; i++) {
      const version = findPackageJson(searchDir);
      if (version) return version;
      const parentDir = path.dirname(searchDir);
      if (parentDir === searchDir) break;
      searchDir = parentDir;
    }
    
    // 方法 2: 从 process.cwd() 查找（开发环境）
    const cwdVersion = findPackageJson(process.cwd());
    if (cwdVersion) return cwdVersion;
    
    return '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** 插件版本号（从 package.json 动态读取） */
export const VERSION: string = getPackageVersion();

/** 插件名称 */
export const PLUGIN_NAME = 'oh-my-claude';

// ==================== 路径配置 ====================

/** 用户主目录 */
export const HOME_DIR = os.homedir();

/** 日志目录 */
export const LOG_DIR = path.join(HOME_DIR, '.oh-my-claude', 'logs');

/** 错误日志文件路径 */
export const ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');

/** 插件状态目录 */
export const PLUGIN_STATE_DIR = path.join(HOME_DIR, '.oh-my-claude', 'state');

/** 插件状态文件路径 */
export const PLUGIN_STATE_PATH = path.join(PLUGIN_STATE_DIR, 'plugin-state.json');

/** 插件安装目录 */
export const PLUGIN_DIR = path.join(HOME_DIR, '.claude', 'plugins', PLUGIN_NAME);

/** Commands 安装目录 */
export const COMMANDS_DIR = path.join(HOME_DIR, '.claude', 'commands');

/** Skills 安装目录 */
export const SKILLS_DIR = path.join(HOME_DIR, '.claude', 'skills');

// ==================== 时间配置（毫秒） ====================

/** 锁超时时间 */
export const LOCK_TIMEOUT_MS = 30000;

/** 锁过期时间（5分钟） */
export const LOCK_STALE_MS = 5 * 60 * 1000;

/** 锁重试间隔 */
export const LOCK_RETRY_INTERVAL_MS = 1000;

// ==================== 文件处理配置 ====================

/** 大文件阈值（字节） */
export const LARGE_FILE_THRESHOLD_BYTES = 1024 * 1024;

/** 复制缓冲区大小 */
export const COPY_BUFFER_SIZE = 64 * 1024;

// ==================== UI 配置 ====================

/** 短分隔线长度 */
export const DIVIDER_LENGTH = 40;

/** 长分隔线长度 */
export const DIVIDER_LONG_LENGTH = 60;

// ==================== GitHub 配置 ====================

/** GitHub 仓库地址 */
export const GITHUB_REPO = 'ZDragon17/oh-my-claude';

/** GitHub Issues 地址 */
export const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues`;

// ==================== 插件目录和文件配置 ====================

/** 插件核心目录列表 */
export const PLUGIN_DIRS = ['agents', 'commands', 'hooks', 'skills', '.claude-plugin'] as const;

/** 插件附加文件列表 */
export const PLUGIN_FILES = ['README.md', 'README_EN.md', 'LICENSE'] as const;

// ==================== Agent 配置 ====================

/** 核心 Agent 列表 */
export const CORE_AGENTS = [
  { id: 'yugong', name: '愚公 (YuGong)' },
  { id: 'zhuge', name: '诸葛 (ZhuGe)' },
  { id: 'luban', name: '鲁班 (LuBan)' },
  { id: 'wukong', name: '悟空 (WuKong)' },
  { id: 'bianque', name: '扁鹊 (BianQue)' },
  { id: 'mozi', name: '墨子 (MoZi)' },
  { id: 'sunzi', name: '孙子 (SunZi)' },
  { id: 'simaqian', name: '司马迁 (SimaQian)' },
  { id: 'zhenghe', name: '郑和 (ZhengHe)' },
  { id: 'zhangheng', name: '张衡 (ZhangHeng)' },
  { id: 'libing', name: '李冰 (LiBing)' },
  { id: 'laozi', name: '老子 (LaoZi)' },
  { id: 'baozheng', name: '包拯 (BaoZheng)' },
  { id: 'weizheng', name: '魏征 (WeiZheng)' },
  { id: 'cangjie', name: '仓颉 (CangJie)' },
  { id: 'libai', name: '李白 (LiBai)' },
  { id: 'gukaizhi', name: '顾恺之 (GuKaiZhi)' },
  { id: 'change', name: '嫦娥 (ChangE)' }
] as const;

/** 验证时检查的核心 Agent 文件列表 */
export const CORE_AGENT_FILES = ['yugong.md', 'zhuge.md', 'baozheng.md'] as const;

/** 必需目录列表 */
export const REQUIRED_DIRS = ['agents', 'commands', 'skills', '.claude-plugin'] as const;

/** 可选目录列表 */
export const OPTIONAL_DIRS = ['hooks'] as const;
