/**
 * Polyfills健康监控
 */

const fs = require('fs');
const EnvironmentDetector = require('../utils/env-detector');
const { benchmarkPolyfills } = require('../benchmark/polyfills-performance');

async function checkPolyfillsHealth() {
  console.log('🔍 检查Polyfills健康状态...\n');

  const detector = new EnvironmentDetector();
  const env = await detector.detect();

  console.log('📊 环境状态:');
  console.log(`   CWD可用: ${env.cwdAvailable.available ? '✅' : '❌'}`);
  console.log(`   FS权限: ${env.fsPermissions.write ? '✅' : '❌'}`);
  console.log(`   Graceful-FS版本: ${env.gracefulFsVersion || '未安装'}`);

  // 运行性能基准
  console.log('\n⚡ 性能基准测试...');
  const perfResults = await benchmarkPolyfills();

  // 生成健康报告
  const healthReport = {
    timestamp: new Date().toISOString(),
    environment: env,
    performance: perfResults,
    status: 'healthy'
  };

  // 检查是否有问题
  const issues = [];
  if (!env.cwdAvailable.available) issues.push('process.cwd()不可用');
  if (!env.fsPermissions.write) issues.push('文件系统权限不足');
  if (!perfResults.acceptable) issues.push('性能开销过大');

  if (issues.length > 0) {
    healthReport.status = 'unhealthy';
    healthReport.issues = issues;
    console.log('\n❌ 发现问题:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✅ 所有检查通过，Polyfills运行正常');
  }

  // 保存健康报告
  fs.writeFileSync(
    'polyfills-health-report.json',
    JSON.stringify(healthReport, null, 2)
  );

  return healthReport;
}

if (require.main === module) {
  checkPolyfillsHealth().then(report => {
    process.exit(report.status === 'healthy' ? 0 : 1);
  });
}

module.exports = { checkPolyfillsHealth };
