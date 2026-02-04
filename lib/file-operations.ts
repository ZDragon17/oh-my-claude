/**
 * 文件操作工具模块
 * 提供安全的文件读写、复制、目录操作等功能
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
import {
  LARGE_FILE_THRESHOLD_BYTES,
  COPY_BUFFER_SIZE,
  PLUGIN_DIRS,
  PLUGIN_FILES
} from './constants.js';
import { getUserFriendlyError, logErrorToFile, sanitizeStackTrace } from './error-handler.js';
import { ProgressIndicator } from './ui/progress.js';

// 重新导出错误处理函数供其他模块使用
export { getUserFriendlyError, logErrorToFile, sanitizeStackTrace };

// ==================== Zod 验证 Schema ====================

export const CopyResultSchema = z.object({
  dirs: z.number().min(0),
  files: z.number().min(0),
  errors: z.array(z.string())
});

export const InstallResultSchema = z.object({
  count: z.number().min(0),
  errors: z.array(z.string()),
  cleaned: z.boolean().optional()
});

export const FilePathSchema = z.string().min(1);

// ==================== 类型定义 ====================

export interface CopyStats {
  files: number;
  dirs: number;
  emptyDirs: number;
}

export interface CopyResult {
  dirs: number;
  files: number;
  errors: string[];
}

export interface InstallResult {
  count: number;
  errors: string[];
  cleaned?: boolean;
}

// ==================== 安全的文件操作 ====================

/**
 * 安全的文件读取
 */
export function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return null;
    }
    throw new Error(getUserFriendlyError(nodeErr, filePath));
  }
}

/**
 * 安全的文件写入
 */
export function safeWriteFile(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err as NodeJS.ErrnoException, filePath));
  }
}

/**
 * 安全的目录删除
 */
export function safeRemoveDir(dirPath: string): boolean {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err as NodeJS.ErrnoException, dirPath));
  }
}

/**
 * 安全的文件复制
 */
export function safeCopyFile(src: string, dest: string): boolean {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    return true;
  } catch (err) {
    throw new Error(getUserFriendlyError(err as NodeJS.ErrnoException, `${src} -> ${dest}`));
  }
}

// ==================== 智能文件复制 ====================

/**
 * 智能复制文件（小文件同步，大文件流式）
 */
export function smartCopyFile(src: string, dest: string): void {
  const stats = fs.statSync(src);

  if (stats.size > LARGE_FILE_THRESHOLD_BYTES) {
    // 大文件使用流式复制
    const buffer = Buffer.alloc(COPY_BUFFER_SIZE);
    const fdSrc = fs.openSync(src, 'r');
    const fdDest = fs.openSync(dest, 'w');

    try {
      let bytesRead;
      while ((bytesRead = fs.readSync(fdSrc, buffer)) > 0) {
        fs.writeSync(fdDest, buffer, 0, bytesRead);
      }
    } finally {
      fs.closeSync(fdSrc);
      fs.closeSync(fdDest);
    }

    // 保留文件时间戳
    fs.utimesSync(dest, stats.atime, stats.mtime);
  } else {
    // 小文件直接同步复制
    fs.copyFileSync(src, dest);
  }
}

/**
 * 复制目录（支持大文件流式处理和空目录处理）
 */
export function copyDir(
  src: string,
  dest: string,
  options: { preserveEmpty?: boolean } = {}
): CopyStats {
  const { preserveEmpty = true } = options;
  const stats: CopyStats = { files: 0, dirs: 0, emptyDirs: 0 };

  fs.mkdirSync(dest, { recursive: true });
  stats.dirs++;

  const entries = fs.readdirSync(src, { withFileTypes: true });

  if (entries.length === 0) {
    stats.emptyDirs++;
    if (!preserveEmpty) {
      fs.rmdirSync(dest);
      stats.dirs--;
    }
    return stats;
  }

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      const subStats = copyDir(srcPath, destPath, options);
      stats.files += subStats.files;
      stats.dirs += subStats.dirs;
      stats.emptyDirs += subStats.emptyDirs;
    } else {
      smartCopyFile(srcPath, destPath);
      stats.files++;
    }
  }

  return stats;
}

// ==================== 插件文件操作 ====================

/**
 * 复制插件文件到目标目录
 */
export function copyPluginFiles(packageDir: string, pluginDir: string, showProgress: boolean = true): CopyResult {
  const validatedPackageDir = FilePathSchema.parse(packageDir);
  const validatedPluginDir = FilePathSchema.parse(pluginDir);

  // 调试信息：显示源目录和目标目录
  console.log(`\x1b[36m源目录:\x1b[0m ${validatedPackageDir}`);
  console.log(`\x1b[36m目标目录:\x1b[0m ${validatedPluginDir}`);

  const stats: CopyResult = { dirs: 0, files: 0, errors: [] };
  const totalSteps = PLUGIN_DIRS.length + PLUGIN_FILES.length;
  const progress = showProgress ? new ProgressIndicator(totalSteps, '复制文件') : null;

  // 复制目录
  for (const dir of PLUGIN_DIRS) {
    const src = path.join(validatedPackageDir, dir);
    const dest = path.join(validatedPluginDir, dir);

    if (!fs.existsSync(src)) {
      // 源目录不存在时记录警告，帮助调试
      console.warn(`\x1b[33m警告: 源目录不存在，跳过 ${dir}/\x1b[0m`);
      console.warn(`\x1b[33m  完整路径: ${src}\x1b[0m`);
      if (progress) progress.update(`跳过 ${dir}/`);
      continue;
    }

    try {
      copyDir(src, dest);
      stats.dirs++;
      if (progress) progress.update(`${dir}/`);
    } catch (err) {
      stats.errors.push(`复制目录失败 ${dir}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      if (progress) progress.update(`失败 ${dir}/`);
    }
  }

  // 复制文件
  for (const file of PLUGIN_FILES) {
    const src = path.join(validatedPackageDir, file);
    const dest = path.join(validatedPluginDir, file);

    if (!fs.existsSync(src)) {
      if (progress) progress.update(`跳过 ${file}`);
      continue;
    }

    try {
      fs.copyFileSync(src, dest);
      stats.files++;
      if (progress) progress.update(file);
    } catch (err) {
      stats.errors.push(`复制文件失败 ${file}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      if (progress) progress.update(`失败 ${file}`);
    }
  }

  if (progress) {
    if (stats.errors.length > 0) {
      progress.fail('复制完成（有警告）');
    } else {
      progress.complete('文件复制完成');
    }
  }

  return CopyResultSchema.parse(stats);
}

/**
 * 设置 hook 脚本权限（Unix）
 * 递归处理所有子目录中的 .sh 文件（如 hooks/lib/）
 */
export function setHookPermissions(pluginDir: string): void {
  if (os.platform() === 'win32') return;

  const hooksDir = path.join(pluginDir, 'hooks');
  if (!fs.existsSync(hooksDir)) return;

  // 递归设置权限
  const setPermissionsRecursive = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        setPermissionsRecursive(fullPath);
      } else if (entry.name.endsWith('.sh')) {
        try {
          fs.chmodSync(fullPath, '755');
        } catch {
          // 忽略权限设置失败
        }
      }
    }
  };

  setPermissionsRecursive(hooksDir);
}

// ==================== WSL 跨环境兼容 ====================

/**
 * 检测 WSL 是否可用
 */
export function isWslAvailable(): boolean {
  if (os.platform() !== 'win32') return false;
  
  try {
    const { execSync } = require('child_process');
    // 检查 wsl 命令是否存在
    execSync('wsl --status', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取 WSL 中的 HOME 目录
 */
export function getWslHome(): string | null {
  try {
    const { execSync } = require('child_process');
    const result = execSync('wsl bash -c "echo $HOME"', { 
      encoding: 'utf-8', 
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000 
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * 将 Windows 路径转换为 WSL 路径
 * 例如: C:\Users\张不为 -> /mnt/c/Users/张不为
 */
export function windowsPathToWsl(windowsPath: string): string {
  // 处理各种 Windows 路径格式
  let normalizedPath = windowsPath;
  
  // Git Bash 格式: /c/Users/xxx -> C:/Users/xxx
  if (/^\/[a-zA-Z]\//.test(normalizedPath)) {
    const driveLetter = normalizedPath.charAt(1).toLowerCase();
    normalizedPath = `${driveLetter.toUpperCase()}:${normalizedPath.substring(2)}`;
  }
  
  // 标准 Windows 格式: C:\Users\xxx 或 C:/Users/xxx
  const match = normalizedPath.match(/^([a-zA-Z]):[/\\](.*)$/);
  if (match && match[1] && match[2] !== undefined) {
    const driveLetter = match[1].toLowerCase();
    const restPath = match[2].replace(/\\/g, '/');
    return `/mnt/${driveLetter}/${restPath}`;
  }
  
  return normalizedPath;
}

/**
 * 在 WSL 中创建符号链接，使 oh-my-claude 在 WSL 环境下也能正常工作
 * 
 * 问题背景：
 * - Claude Code 在 Windows 上可能使用 WSL 的 bash 执行 hooks
 * - WSL 的 $HOME 与 Windows 的 $HOME 不同
 * - 导致 hooks 路径找不到文件
 * 
 * 解决方案：
 * - 在 WSL 的 ~/.claude/plugins/ 中创建符号链接
 * - 链接指向 Windows 安装的 oh-my-claude 目录
 */
export function setupWslSymlink(windowsPluginDir: string): { success: boolean; message: string } {
  // 仅在 Windows 上执行
  if (os.platform() !== 'win32') {
    return { success: true, message: '非 Windows 环境，跳过 WSL 配置' };
  }

  // 检查 WSL 是否可用
  if (!isWslAvailable()) {
    return { success: true, message: '未检测到 WSL，跳过配置' };
  }

  const wslHome = getWslHome();
  if (!wslHome) {
    return { success: false, message: '无法获取 WSL HOME 目录' };
  }

  // 转换 Windows 路径为 WSL 路径
  const wslTargetPath = windowsPathToWsl(windowsPluginDir);
  const wslPluginsDir = `${wslHome}/.claude/plugins`;
  const wslLinkPath = `${wslPluginsDir}/oh-my-claude`;

  try {
    const { execSync } = require('child_process');
    
    // 在 WSL 中执行符号链接创建
    const script = `
      # 确保 plugins 目录存在
      mkdir -p "${wslPluginsDir}"
      
      # 检查目标是否已经是正确的符号链接
      if [ -L "${wslLinkPath}" ]; then
        current_target=$(readlink "${wslLinkPath}")
        if [ "$current_target" = "${wslTargetPath}" ]; then
          echo "ALREADY_LINKED"
          exit 0
        fi
        # 删除旧的符号链接
        rm -f "${wslLinkPath}"
      elif [ -d "${wslLinkPath}" ]; then
        # 如果是目录，先备份再删除
        mv "${wslLinkPath}" "${wslLinkPath}.backup.$(date +%s)"
      fi
      
      # 创建新的符号链接
      ln -s "${wslTargetPath}" "${wslLinkPath}"
      
      # 验证链接是否有效
      if [ -d "${wslLinkPath}/hooks" ]; then
        echo "SUCCESS"
      else
        echo "LINK_INVALID"
        exit 1
      fi
    `;

    const result = execSync(`wsl bash -c '${script.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000
    }).trim();

    if (result === 'ALREADY_LINKED') {
      return { success: true, message: 'WSL 符号链接已存在且正确' };
    } else if (result === 'SUCCESS') {
      return { success: true, message: 'WSL 符号链接创建成功' };
    } else {
      return { success: false, message: `WSL 符号链接创建失败: ${result}` };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    // 如果是超时或 WSL 未运行，不算失败
    if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('not running')) {
      return { success: true, message: 'WSL 未运行，跳过符号链接配置' };
    }
    return { success: false, message: `WSL 配置失败: ${errorMessage}` };
  }
}
