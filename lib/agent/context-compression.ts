/**
 * 上下文压缩模块
 * 提供多种上下文压缩算法
 */

import type { ContextCompression } from '../../types/index.js';
import { CONTEXT_CACHE_TTL, MAX_CONTEXT_CACHE_SIZE } from './types.js';

// ==================== 压缩算法实现 ====================

/**
 * 生成上下文摘要
 */
export function generateSummary(context: Record<string, unknown>): string {
  const keys = Object.keys(context);
  return `Context contains ${keys.length} items: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`;
}

/**
 * 提取关键点
 */
export function extractKeypoints(context: Record<string, unknown>): string[] {
  const keypoints: string[] = [];
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string' && value.length < 100) {
      keypoints.push(`${key}: ${value}`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      keypoints.push(`${key}: ${value}`);
    }
  }
  return keypoints.slice(0, 10);
}

/**
 * 构建层次结构
 */
export function buildHierarchy(context: Record<string, unknown>): Record<string, unknown> {
  const hierarchy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'object' && value !== null) {
      hierarchy[key] = { type: 'object', keys: Object.keys(value as object) };
    } else {
      hierarchy[key] = { type: typeof value, value };
    }
  }
  return hierarchy;
}

/**
 * 从摘要恢复上下文
 */
export function expandFromSummary(summary: string): Record<string, unknown> {
  return { summary, reconstructed: true };
}

/**
 * 从关键点恢复上下文
 */
export function expandFromKeypoints(keypoints: string[]): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const point of keypoints) {
    const [key, ...valueParts] = point.split(': ');
    if (key && valueParts.length > 0) {
      context[key] = valueParts.join(': ');
    }
  }
  return context;
}

/**
 * 从层次结构恢复上下文
 */
export function expandFromHierarchy(hierarchy: Record<string, unknown>): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const [key, info] of Object.entries(hierarchy)) {
    const typedInfo = info as { type: string; keys?: string[]; value?: unknown };
    if (typedInfo.type === 'object') {
      context[key] = { placeholder: true, originalKeys: typedInfo.keys };
    } else {
      context[key] = typedInfo.value;
    }
  }
  return context;
}

// ==================== 上下文缓存管理 ====================

export class ContextCacheManager {
  private cache: Map<string, ContextCompression> = new Map();

  /**
   * 压缩上下文
   */
  compress(
    context: Record<string, unknown>,
    algorithm: 'summary' | 'keypoints' | 'hierarchical' = 'summary'
  ): ContextCompression {
    const contextStr = JSON.stringify(context);
    const originalSize = Buffer.byteLength(contextStr, 'utf8');

    const compressedData: Record<string, unknown> = {};

    switch (algorithm) {
      case 'summary':
        compressedData.summary = generateSummary(context);
        break;
      case 'keypoints':
        compressedData.keypoints = extractKeypoints(context);
        break;
      case 'hierarchical':
        compressedData.hierarchy = buildHierarchy(context);
        break;
      default:
        compressedData.summary = generateSummary(context);
    }

    const compressedStr = JSON.stringify(compressedData);
    const compressedSize = Buffer.byteLength(compressedStr, 'utf8');

    const compression: ContextCompression = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
      algorithm: algorithm as 'summary' | 'keypoints' | 'embedding' | 'hierarchical',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CONTEXT_CACHE_TTL).toISOString(),
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
      data: compressedData
    };

    this.cache.set(compression.id, compression);
    this.cleanupExpired();

    return compression;
  }

  /**
   * 检索压缩上下文
   */
  retrieve(compressionId: string): Record<string, unknown> | null {
    const compression = this.cache.get(compressionId);
    if (!compression) {
      return null;
    }

    compression.accessCount++;
    compression.lastAccessed = new Date().toISOString();

    switch (compression.algorithm) {
      case 'summary':
        return expandFromSummary(compression.data.summary as string);
      case 'keypoints':
        return expandFromKeypoints(compression.data.keypoints as string[]);
      case 'hierarchical':
        return expandFromHierarchy(compression.data.hierarchy as Record<string, unknown>);
      default:
        return expandFromSummary(compression.data.summary as string);
    }
  }

  /**
   * 获取缓存的压缩对象
   */
  get(compressionId: string): ContextCompression | undefined {
    return this.cache.get(compressionId);
  }

  /**
   * 设置压缩对象
   */
  set(compressionId: string, compression: ContextCompression): void {
    this.cache.set(compressionId, compression);
  }

  /**
   * 清理过期缓存
   */
  cleanupExpired(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [id, compression] of this.cache.entries()) {
      if (compression.expiresAt && new Date(compression.expiresAt).getTime() < now) {
        this.cache.delete(id);
        cleaned++;
      }
    }

    if (this.cache.size > MAX_CONTEXT_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount);

      const toRemove = entries.slice(0, this.cache.size - MAX_CONTEXT_CACHE_SIZE);
      for (const [id] of toRemove) {
        this.cache.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 导出缓存数据
   */
  exportCache(): Record<string, ContextCompression> {
    return Object.fromEntries(this.cache);
  }

  /**
   * 导入缓存数据
   */
  importCache(data: Record<string, ContextCompression>): void {
    for (const [id, compression] of Object.entries(data)) {
      this.cache.set(id, compression);
    }
  }
}
