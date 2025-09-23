/**
 * 测试依赖解析缓存功能
 */

import {
  resolveDependencyWithCache,
  getCacheStats,
  clearDependencyCache,
  createCachedDefaultDependencies
} from './move-action-dependencies.js';

async function testDependencyCache() {
  console.log('🧪 测试依赖解析缓存功能...\n');

  // 清理缓存开始
  clearDependencyCache();

  // 测试1: 基本缓存功能
  console.log('📋 测试1: 基本缓存功能');
  let callCount = 0;

  const testResolver = async () => {
    callCount++;
    return `result-${callCount}`;
  };

  // 第一次调用
  const result1 = await resolveDependencyWithCache(testResolver, 'test-key');
  console.log('第一次调用结果:', result1);
  console.log('调用次数:', callCount);

  // 第二次调用（应该从缓存获取）
  const result2 = await resolveDependencyWithCache(testResolver, 'test-key');
  console.log('第二次调用结果:', result2);
  console.log('调用次数:', callCount);

  if (callCount === 1 && result1 === result2) {
    console.log('✅ 缓存功能正常工作');
  } else {
    console.log('❌ 缓存功能异常');
  }

  console.log('');

  // 测试2: 缓存统计
  console.log('📋 测试2: 缓存统计');
  const stats = getCacheStats();
  console.log('缓存统计:', stats);

  if (stats.size > 0 && stats.entries.includes('test-key')) {
    console.log('✅ 缓存统计正常');
  } else {
    console.log('❌ 缓存统计异常');
  }

  console.log('');

  // 测试3: 缓存版本的默认依赖
  console.log('📋 测试3: 缓存版本的默认依赖');
  clearDependencyCache();

  const cachedDeps = createCachedDefaultDependencies();

  // 第一次解析依赖
  console.log('第一次解析依赖...');
  const startTime1 = Date.now();
  const resolvedDeps1 = await Promise.all([
    cachedDeps.moveTasksBetweenTags(),
    cachedDeps.generateTaskFiles(),
  ]);
  const endTime1 = Date.now();

  console.log('解析耗时:', endTime1 - startTime1, 'ms');
  console.log('缓存统计:', getCacheStats());

  // 第二次解析依赖（应该从缓存获取）
  console.log('第二次解析依赖（缓存命中）...');
  const startTime2 = Date.now();
  const resolvedDeps2 = await Promise.all([
    cachedDeps.moveTasksBetweenTags(),
    cachedDeps.generateTaskFiles(),
  ]);
  const endTime2 = Date.now();

  console.log('解析耗时:', endTime2 - startTime2, 'ms');
  console.log('缓存统计:', getCacheStats());

  // 验证结果一致性
  const cacheStats = getCacheStats();
  if (cacheStats.size >= 2 && endTime2 - startTime2 < endTime1 - startTime1) {
    console.log('✅ 缓存版本依赖正常工作');
  } else {
    console.log('❌ 缓存版本依赖异常');
  }

  console.log('\n🎉 依赖缓存测试完成！');

  // 清理缓存
  clearDependencyCache();
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testDependencyCache().catch(console.error);
}
