#!/bin/bash
# scripts/verify/graceful-fs-fix.sh

echo "🔍 验证Graceful-FS修复效果..."

# 1. 测试process.cwd()稳定性
node -e "
try {
  const cwd1 = process.cwd();
  setTimeout(() => {
    const cwd2 = process.cwd();
    console.log('CWD稳定性测试:', cwd1 === cwd2 ? '✅' : '❌');
  }, 100);
} catch (e) {
  console.log('CWD可用性测试: ❌', e.message);
}
"

# 2. 测试graceful-fs行为
node -e "
const fs = require('graceful-fs');
console.log('Graceful-FS版本:', require('graceful-fs/package.json').version);

// 测试文件操作
fs.writeFileSync('/tmp/graceful-test', 'test');
const content = fs.readFileSync('/tmp/graceful-test', 'utf8');
console.log('文件操作测试:', content === 'test' ? '✅' : '❌');
"

# 3. 运行测试套件子集
npm run test:compatibility

echo "✅ 验证完成"
