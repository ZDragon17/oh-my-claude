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

  const stats: CopyResult = { dirs: 0, files: 0, errors: [] };
  const totalSteps = PLUGIN_DIRS.length + PLUGIN_FILES.length;
  const progress = showProgress ? new ProgressIndicator(totalSteps, '复制文件') : null;

  // 复制目录
  for (const dir of PLUGIN_DIRS) {
    const src = path.join(validatedPackageDir, dir);
    const dest = path.join(validatedPluginDir, dir);

    if (!fs.existsSync(src)) {
      stats.errors.push(`目录不存在: ${dir}`);
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
 */
export function setHookPermissions(pluginDir: string): void {
  if (os.platform() === 'win32') return;

  const hooksDir = path.join(pluginDir, 'hooks');
  if (!fs.existsSync(hooksDir)) return;

  const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
  for (const hookFile of hookFiles) {
    try {
      fs.chmodSync(path.join(hooksDir, hookFile), '755');
    } catch {
      // 忽略权限设置失败
    }
  }
}
