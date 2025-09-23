/**
 * 安全process polyfills - 替换graceful-fs的有缺陷实现
 * 提供更健壮的process.cwd()缓存机制
 */

// 先保存原始的process.cwd实现，避免递归调用
const originalCwd = process.cwd;

let cwdCache = null;
let cacheExpiry = 0;
const CACHE_DURATION = 1000; // 1秒缓存，避免过度调用

export const safeCwd = () => {
  const now = Date.now();

  // 检查缓存是否过期
  if (!cwdCache || now - cacheExpiry > CACHE_DURATION) {
    try {
      // 使用原始的process.cwd实现，避免递归
      cwdCache = originalCwd.call(process);
      cacheExpiry = now;
    } catch (error) {
      // 提供详细的错误信息，帮助诊断问题
      const errorMsg = [
        'process.cwd() failed in test environment:',
        `Error: ${error.message}`,
        `Platform: ${process.platform}`,
        `Node version: ${process.version}`,
        `Working directory: ${originalCwd ? 'available' : 'unavailable'}`,
        'This may indicate graceful-fs compatibility issues.',
        'Consider using Vitest or implementing safe polyfills.'
      ].join('\n');

      throw new Error(errorMsg);
    }
  }

  return cwdCache;
};

// 应用安全polyfill
process.cwd = safeCwd;

// 导出用于测试和调试
export const getCacheInfo = () => ({
  cached: cwdCache,
  expiry: cacheExpiry,
  age: Date.now() - cacheExpiry
});

export const clearCache = () => {
  cwdCache = null;
  cacheExpiry = 0;
};

// 默认导出
export default {
  safeCwd,
  getCacheInfo,
  clearCache
};
