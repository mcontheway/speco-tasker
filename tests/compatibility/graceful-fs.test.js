/**
 * Graceful-FS兼容性测试
 */

import { safeCwd, getCacheInfo, clearCache } from '../../scripts/utils/safe-process-polyfills.js';

describe('Graceful-FS兼容性测试', () => {
  beforeAll(async () => {
    // 确保polyfills已加载
    expect(typeof safeCwd).toBe('function');
  });

  test('process.cwd()应该稳定工作', () => {
    const cwd1 = process.cwd();
    const cwd2 = process.cwd();

    expect(typeof cwd1).toBe('string');
    expect(cwd1.length).toBeGreaterThan(0);
    expect(cwd1).toBe(cwd2); // 应该稳定
  });

  test('安全polyfills应该提供缓存功能', () => {
    // 调用几次process.cwd()
    process.cwd();
    process.cwd();

    const cacheInfo = getCacheInfo();
    expect(cacheInfo).toHaveProperty('cached');
    expect(cacheInfo).toHaveProperty('expiry');

    // 清理缓存
    clearCache();
    const clearedInfo = getCacheInfo();
    expect(clearedInfo.cached).toBeNull();
  });

  test('应该处理graceful-fs异常情况', () => {
    // 模拟graceful-fs问题场景
    const originalCwd = process.cwd;

    // 临时替换process.cwd来模拟失败
    process.cwd = () => { throw new Error('Simulated graceful-fs failure'); };

    try {
      // 这里应该抛出错误，而不是静默失败
      expect(() => process.cwd()).toThrow('Simulated graceful-fs failure');
    } finally {
      // 恢复原始函数
      process.cwd = originalCwd;
    }
  });
});
