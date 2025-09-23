/**
 * Polyfills性能基准测试
 */

const { performance } = require('perf_hooks');

async function benchmarkPolyfills() {
  const iterations = 1000;
  const results = {
    original: [],
    polyfilled: []
  };

  console.log(`运行${iterations}次process.cwd()调用基准测试...`);

  // 测试原始process.cwd()
  const originalStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    process.cwd();
    const end = performance.now();
    results.original.push(end - start);
  }
  const originalEnd = performance.now();

  // 计算统计信息
  const originalAvg = results.original.reduce((a, b) => a + b, 0) / results.original.length;
  const originalTotal = originalEnd - originalStart;

  console.log('📊 性能基准结果:');
  console.log(`   原始process.cwd()平均耗时: ${originalAvg.toFixed(4)}ms`);
  console.log(`   总耗时: ${originalTotal.toFixed(2)}ms`);
  console.log(`   每次调用平均耗时: ${(originalTotal / iterations).toFixed(4)}ms`);

  // 检查性能影响是否在可接受范围内
  const maxAcceptableOverhead = 0.1; // 0.1ms
  if (originalAvg > maxAcceptableOverhead) {
    console.warn(`⚠️ 性能开销较大: ${originalAvg.toFixed(4)}ms > ${maxAcceptableOverhead}ms`);
  } else {
    console.log('✅ 性能开销在可接受范围内');
  }

  return {
    iterations,
    originalAvg,
    originalTotal,
    acceptable: originalAvg <= maxAcceptableOverhead
  };
}

// 运行基准测试
if (require.main === module) {
  benchmarkPolyfills().then(results => {
    process.exit(results.acceptable ? 0 : 1);
  });
}

module.exports = { benchmarkPolyfills };
