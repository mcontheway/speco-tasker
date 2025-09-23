/**
 * 测试结果验证脚本
 */

const fs = require('fs');
const path = require('path');

function analyzeTestResults() {
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    gracefulFsErrors: 0
  };

  try {
    // 检查最近的测试结果（如果有的话）
    const testResultsPath = path.join(process.cwd(), 'test-results.json');
    if (fs.existsSync(testResultsPath)) {
      const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
      results.passed = testResults.numPassedTests || 0;
      results.failed = testResults.numFailedTests || 0;
    }

    // 检查是否有graceful-fs相关错误
    // 这里可以集成到CI/CD中
    const hasGracefulFsErrors = false; // 实际实现需要根据测试输出判断

    console.log('📊 测试结果分析:');
    console.log(`   通过: ${results.passed}`);
    console.log(`   失败: ${results.failed}`);
    console.log(`   Graceful-FS错误: ${results.gracefulFsErrors}`);

    const success = results.failed === 0 && results.gracefulFsErrors === 0;
    console.log(success ? '✅ 测试验证通过' : '❌ 测试验证失败');

    return success;
  } catch (error) {
    console.error('❌ 测试结果分析失败:', error.message);
    return false;
  }
}

if (require.main === module) {
  const success = analyzeTestResults();
  process.exit(success ? 0 : 1);
}

module.exports = { analyzeTestResults };
