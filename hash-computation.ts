/**
 * Hash 计算模块
 * 对标 oh-my-opencode hash-computation
 *
 * 使用 MD5 计算 LINE#ID 内容哈希，与现有 bash 实现一致
 */

import * as crypto from 'crypto';

/** 256个简短符号组成的哈希字典 */
const HASHLINE_DICT = (() => {
  const symbols: string[] = [];
  for (let i = 0; i < 26; i++) symbols.push(String.fromCharCode(97 + i)); // a-z
  for (let i = 0; i < 26; i++) symbols.push(String.fromCharCode(65 + i)); // A-Z
  for (let i = 0; i < 10; i++) symbols.push(String.fromCharCode(48 + i)); // 0-9
  // 剩余用拼音符号填充
  const extra = 'αβγδεζηθικλμνξοπρστυφχψωабвгдежзийклмнопрстуфхцчшщъыьэюя';
  for (const ch of extra) symbols.push(ch);
  while (symbols.length < 256) symbols.push('·');
  return symbols.slice(0, 256);
})();

/**
 * 计算单行的 LINE#HASH
 * 对标 oh-my-opencode computeLineHash(lineNumber, content)
 */
export function computeLineHash(lineNumber: number, content: string): string {
  const clean = content.replace(/\r/g, '').trimEnd();
  const seed = clean.length > 0 && /[a-zA-Z0-9]/.test(clean) ? 0 : lineNumber;
  const input = `${seed}:${lineNumber}:${clean}`;
  const hash = crypto.createHash('md5').update(input).digest();
  const index = hash[0]! % 256;
  return HASHLINE_DICT[index]!;
}

/**
 * 格式化单行为 LINE#HASH|content 格式
 */
export function formatHashLine(lineNumber: number, content: string): string {
  const hash = computeLineHash(lineNumber, content);
  return `${lineNumber}#${hash}|${content}`;
}

/**
 * 从 hashline 格式中提取哈希
 * 格式: N#XX|content
 */
export function extractHashFromLine(line: string): { hash: string; content: string } | null {
  const match = line.match(/^\d+#(.)\|(.*)/);
  if (!match) return null;
  return { hash: match[1]!, content: match[2]! };
}

/**
 * 验证 hashline 引用的内容与当前文件内容匹配
 * 用于 Edit old_string 验证
 */
export function validateHashline(oldString: string, currentContent: string): {
  valid: boolean;
  mismatches: Array<{ expected: string; actual: string; line: string }>;
} {
  const mismatches: Array<{ expected: string; actual: string; line: string }> = [];
  const currentLines = currentContent.split('\n');

  // 解析 old_string 中的 hashline 引用
  const oldLines = oldString.split('\n');
  for (const oldLine of oldLines) {
    const extracted = extractHashFromLine(oldLine);
    if (!extracted) continue;

    // 尝试在 currentLines 中找到匹配行
    let found = false;
    for (let i = 0; i < currentLines.length; i++) {
      if (currentLines[i]!.trim() === extracted.content.trim()) {
        const expectedHash = computeLineHash(i + 1, currentLines[i]!);
        if (expectedHash !== extracted.hash) {
          mismatches.push({
            expected: extracted.hash,
            actual: expectedHash,
            line: currentLines[i]!,
          });
        } else {
          found = true;
        }
        break;
      }
    }
    if (!found) {
      mismatches.push({
        expected: extracted.hash,
        actual: 'line_not_found',
        line: extracted.content,
      });
    }
  }

  return { valid: mismatches.length === 0, mismatches };
}

/**
 * 生成 filediff 元数据结构
 */
export function generateFilediff(
  filePath: string,
  oldContent: string,
  newContent: string
): {
  path: string;
  additions: number;
  deletions: number;
  oldLines: number;
  newLines: number;
  diff: string;
} {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // 简单的行差异统计
  let additions = 0;
  let deletions = 0;
  const diffLines: string[] = [];
  diffLines.push(`--- a/${filePath}`);
  diffLines.push(`+++ b/${filePath}`);

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined && newLine !== undefined) {
      diffLines.push(`+${newLine}`);
      additions++;
    } else if (newLine === undefined && oldLine !== undefined) {
      diffLines.push(`-${oldLine}`);
      deletions++;
    } else if (oldLine !== newLine) {
      diffLines.push(`-${oldLine}`);
      diffLines.push(`+${newLine}`);
      additions++;
      deletions++;
    }
  }

  return {
    path: filePath,
    additions,
    deletions,
    oldLines: oldLines.length,
    newLines: newLines.length,
    diff: diffLines.join('\n'),
  };
}
