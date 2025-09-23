/**
 * 测试异步依赖初始化优化功能
 */

import {
  initializeDependenciesAsync,
  warmupDependencies,
  createCachedDefaultDependencies,
  createMockDependencies,
  clearDependencyCache,
  getCacheStats
} from './move-action-dependencies.js';

async function testAsyncInitialization() {
  console.log('🧪 测试异步依赖初始化优化功能...\n');

  // 清理缓存开始
  clearDependencyCache();

  // 测试1: 基本异步初始化
  console.log('📋 测试1: 基本异步初始化');
  const mockDeps = createMockDependencies();
  const result1 = await initializeDependenciesAsync(mockDeps, {
    performance: true,
    timeout: 2000
  });

  console.log('初始化成功:', result1.success);
  console.log('依赖数量:', Object.keys(result1.dependencies).length);
  console.log('总耗时:', result1.performance.totalTime, 'ms');
  console.log('缓存命中:', result1.performance.cacheHits);
  console.log('缓存未命中:', result1.performance.cacheMisses);

  if (result1.success && Object.keys(result1.dependencies).length === 6) {
    console.log('✅ 基本异步初始化通过');
  } else {
    console.log('❌ 基本异步初始化失败');
  }

  console.log('');

  // 测试2: 错误处理和超时
  console.log('📋 测试2: 错误处理和超时');
  const faultyDeps = {
    workingDep: () => Promise.resolve('ok'),
    timeoutDep: () => new Promise(resolve => setTimeout(resolve, 100)), // 不会超时
    errorDep: () => Promise.reject(new Error('Simulated error'))
  };

  const result2 = await initializeDependenciesAsync(faultyDeps, {
    timeout: 50, // 很短的超时时间
    failFast: false // 不快速失败，收集所有错误
  });

  console.log('初始化成功:', result2.success);
  console.log('错误数量:', result2.errors.length);
  console.log('错误详情:', result2.errors);

  if (!result2.success && result2.errors.length > 0) {
    console.log('✅ 错误处理正常');
  } else {
    console.log('❌ 错误处理异常');
  }

  console.log('');

  // 测试3: 性能监控
  console.log('📋 测试3: 性能监控');
  clearDependencyCache();

  const cachedDeps = createCachedDefaultDependencies();
  const startTime = Date.now();
  const result3 = await initializeDependenciesAsync(cachedDeps, {
    performance: true
  });
  const endTime = Date.now();

  console.log('实际总耗时:', endTime - startTime, 'ms');
  console.log('记录的总耗时:', result3.performance.totalTime, 'ms');
  console.log('单个依赖耗时:');
  Object.entries(result3.performance.individualTimes).forEach(([key, time]) => {
    console.log(`  ${key}: ${time}ms`);
  });

  if (result3.performance.totalTime > 0 && Object.keys(result3.performance.individualTimes).length > 0) {
    console.log('✅ 性能监控正常');
  } else {
    console.log('❌ 性能监控异常');
  }

  console.log('');

  // 测试4: 依赖预热
  console.log('📋 测试4: 依赖预热');
  clearDependencyCache();

  const warmupResult = await warmupDependencies(['moveTasksBetweenTags', 'generateTaskFiles']);
  console.log('预热统计:', warmupResult);
  console.log('缓存状态:', getCacheStats());

  if (warmupResult.successful >= 2 && getCacheStats().size >= 2) {
    console.log('✅ 依赖预热正常');
  } else {
    console.log('❌ 依赖预热异常');
  }

  console.log('');

  // 测试5: 缓存效果验证
  console.log('📋 测试5: 缓存效果验证');
  const cachedDeps2 = createCachedDefaultDependencies();

  // 第一次初始化
  const start1 = Date.now();
  await initializeDependenciesAsync(cachedDeps2);
  const time1 = Date.now() - start1;

  // 第二次初始化（应该从缓存加载）
  const start2 = Date.now();
  await initializeDependenciesAsync(cachedDeps2);
  const time2 = Date.now() - start2;

  console.log('第一次初始化耗时:', time1, 'ms');
  console.log('第二次初始化耗时:', time2, 'ms');
  console.log('缓存加速倍数:', (time1 / Math.max(time2, 1)).toFixed(1) + 'x');

  if (time2 < time1) {
    console.log('✅ 缓存效果显著');
  } else {
    console.log('❌ 缓存效果不明显');
  }

  console.log('\n🎉 异步初始化优化测试完成！');

  // 清理缓存
  clearDependencyCache();
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testAsyncInitialization().catch(console.error);
}
