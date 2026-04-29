/**
 * JSONC (JSON with Comments) 解析器
 * 支持单行注释 (//) 和多行注释
 */

import * as fs from 'fs';

/**
 * JSONC 解析选项
 */
export interface JsoncParseOptions {
  /** 是否允许尾随逗号 */
  allowTrailingCommas?: boolean;
  /** 是否允许单行注释 */
  allowLineComments?: boolean;
  /** 是否允许多行注释 */
  allowBlockComments?: boolean;
}

/**
 * JSONC 解析错误
 */
export class JsoncParseError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number,
    public readonly offset: number
  ) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'JsoncParseError';
  }
}

/**
 * 移除 JSONC 中的注释，返回标准 JSON 字符串
 * @param jsonc - JSONC 格式的字符串
 * @param options - 解析选项
 * @returns 标准 JSON 字符串
 */
export function stripJsonComments(
  jsonc: string,
  options: JsoncParseOptions = {}
): string {
  const {
    allowTrailingCommas = true,
    allowLineComments = true,
    allowBlockComments = true
  } = options;

  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';

  while (i < jsonc.length) {
    const char = jsonc[i];
    const nextChar = jsonc[i + 1];

    // 处理字符串内的内容（不移除注释）
    if (inString) {
      result += char;
      // 检查转义字符
      if (char === '\\' && i + 1 < jsonc.length) {
        result += nextChar;
        i += 2;
        continue;
      }
      // 检查字符串结束
      if (char === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }

    // 检查字符串开始
    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    // 检查单行注释 //
    if (allowLineComments && char === '/' && nextChar === '/') {
      // 跳过直到行尾
      while (i < jsonc.length && jsonc[i] !== '\n') {
        i++;
      }
      // 保留换行符以维持行号
      if (i < jsonc.length) {
        result += '\n';
        i++;
      }
      continue;
    }

    // 检查多行注释 /* */
    if (allowBlockComments && char === '/' && nextChar === '*') {
      i += 2; // 跳过 /*
      let newlines = '';
      // 查找 */
      while (i < jsonc.length) {
        if (jsonc[i] === '*' && jsonc[i + 1] === '/') {
          i += 2; // 跳过 */
          break;
        }
        // 保留换行符以维持行号
        if (jsonc[i] === '\n') {
          newlines += '\n';
        }
        i++;
      }
      result += newlines;
      continue;
    }

    result += char;
    i++;
  }

  // 处理尾随逗号
  if (allowTrailingCommas) {
    result = removeTrailingCommas(result);
  }

  return result;
}

/**
 * 移除尾随逗号
 * @param json - JSON 字符串
 * @returns 移除尾随逗号后的 JSON 字符串
 */
function removeTrailingCommas(json: string): string {
  // 匹配 ]} 或 }] 前的逗号（允许空白字符）
  return json.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * 解析 JSONC 字符串
 * @param jsonc - JSONC 格式的字符串
 * @param options - 解析选项
 * @returns 解析后的对象
 */
export function parseJsonc<T = unknown>(
  jsonc: string,
  options: JsoncParseOptions = {}
): T {
  const json = stripJsonComments(jsonc, options);
  
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // 尝试提取行号和列号
      const match = error.message.match(/position (\d+)/);
      if (match && match[1]) {
        const position = parseInt(match[1], 10);
        const { line, column } = getLineAndColumn(json, position);
        throw new JsoncParseError(
          error.message,
          line,
          column,
          position
        );
      }
    }
    throw error;
  }
}

/**
 * 根据位置计算行号和列号
 * @param text - 文本内容
 * @param position - 字符位置
 * @returns 行号和列号
 */
function getLineAndColumn(text: string, position: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  
  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  
  return { line, column };
}

/**
 * 读取 JSONC 文件
 * @param filePath - 文件路径
 * @param options - 解析选项
 * @returns 解析后的对象
 */
export async function readJsoncFile<T = unknown>(
  filePath: string,
  options: JsoncParseOptions = {}
): Promise<T> {
  const { readFile } = await import('fs/promises');
  const content = await readFile(filePath, 'utf8');
  return parseJsonc<T>(content, options);
}

/**
 * 同步读取 JSONC 文件
 * @param filePath - 文件路径
 * @param options - 解析选项
 * @returns 解析后的对象
 */
export function readJsoncFileSync<T = unknown>(
  filePath: string,
  options: JsoncParseOptions = {}
): T {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseJsonc<T>(content, options);
}

/**
 * 检查文件扩展名是否为 JSONC
 * @param filePath - 文件路径
 * @returns 是否为 JSONC 文件
 */
export function isJsoncFile(filePath: string): boolean {
  const ext = filePath.toLowerCase();
  return ext.endsWith('.jsonc') || 
         ext.endsWith('.json5') ||
         ext.endsWith('.json'); // 也支持标准 JSON 文件
}

/**
 * 格式化 JSON 为带注释的 JSONC 字符串
 * @param obj - 要格式化的对象
 * @param comments - 字段注释映射
 * @param indent - 缩进空格数
 * @returns JSONC 格式字符串
 */
export function formatWithComments(
  obj: unknown,
  comments: Record<string, string> = {},
  indent: number = 2
): string {
  const json = JSON.stringify(obj, null, indent);
  
  if (Object.keys(comments).length === 0) {
    return json;
  }
  
  // 为每个字段添加注释
  let result = json;
  for (const [key, comment] of Object.entries(comments)) {
    // 匹配 "key": 模式，在其前面添加注释
    const pattern = new RegExp(`(\\s*)"${key}":`);
    result = result.replace(pattern, `$1// ${comment}\n$1"${key}":`);
  }
  
  return result;
}
