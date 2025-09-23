/**
 * process.cwd()降级策略
 */

import path from 'path';
import os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export function getFallbackCwd() {
  // 策略1: 使用import.meta.url
  if (import.meta.url) {
    return path.dirname(new URL(import.meta.url).pathname);
  }

  // 策略2: 使用require.main
  if (require.main && require.main.filename) {
    return path.dirname(require.main.filename);
  }

  // 策略3: 使用临时目录
  return os.tmpdir();
}

export function robustCwd() {
  try {
    return process.cwd();
  } catch (error) {
    console.warn('process.cwd()失败，使用降级策略:', error.message);
    return getFallbackCwd();
  }
}
