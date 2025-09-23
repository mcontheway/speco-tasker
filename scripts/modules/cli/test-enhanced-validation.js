/**
 * 测试增强的依赖验证功能
 */

import {
  validateDependenciesEnhanced,
  createValidationReport,
  getDependencySchema,
  createMockDependencies,
  createCachedDefaultDependencies
} from './move-action-dependencies.js';

async function testEnhancedValidation() {
  console.log('🧪 测试增强的依赖验证功能...\n');

  // 测试1: 有效依赖验证
  console.log('📋 测试1: 有效依赖验证');
  const mockDeps = createMockDependencies();
  const result1 = validateDependenciesEnhanced(mockDeps, { verbose: true });

  console.log('验证结果:', result1.isValid ? '✅ 通过' : '❌ 失败');
  console.log('错误数量:', result1.errors.length);
  console.log('警告数量:', result1.warnings.length);
  console.log('验证元数据:', result1.metadata);

  if (result1.isValid && result1.warnings.length > 0) {
    console.log('详细警告:');
    result1.warnings.forEach(w => console.log('  ⚠️', w));
  }

  console.log('');

  // 测试2: 缺失依赖验证
  console.log('📋 测试2: 缺失依赖验证');
  const incompleteDeps = {
    moveTasksBetweenTags: () => {},
    // 缺少其他必需依赖
  };
  const result2 = validateDependenciesEnhanced(incompleteDeps);

  console.log('验证结果:', result2.isValid ? '✅ 通过' : '❌ 失败');
  console.log('缺失依赖数量:', result2.metadata.missingDependencies);
  console.log('错误详情:');
  result2.errors.slice(0, 3).forEach(error => console.log('  ❌', error));

  console.log('');

  // 测试3: 无效依赖验证
  console.log('📋 测试3: 无效依赖验证');
  const invalidDeps = {
    moveTasksBetweenTags: "not a function", // 错误的类型
    generateTaskFiles: () => {},
    moveTask: () => {},
    getCurrentTag: () => {},
    log: () => {},
    chalk: { red: () => {}, green: () => {} }
  };
  const result3 = validateDependenciesEnhanced(invalidDeps);

  console.log('验证结果:', result3.isValid ? '✅ 通过' : '❌ 失败');
  console.log('无效依赖数量:', result3.metadata.invalidDependencies);
  console.log('第一个错误:', result3.errors[0]);

  console.log('');

  // 测试4: 严格模式验证
  console.log('📋 测试4: 严格模式验证');
  const extraDeps = {
    ...mockDeps,
    extraDep1: () => {}, // 额外的依赖
    extraDep2: "extra value"
  };
  const result4 = validateDependenciesEnhanced(extraDeps, { strict: true });

  console.log('验证结果:', result4.isValid ? '✅ 通过' : '❌ 失败');
  if (!result4.isValid) {
    console.log('严格模式错误:', result4.errors.find(e => e.includes('Unknown dependencies')));
  }

  console.log('');

  // 测试5: 验证报告生成
  console.log('📋 测试5: 验证报告生成');
  const report = createValidationReport(mockDeps);
  console.log('验证报告预览:');
  console.log(report.split('\n').slice(0, 8).join('\n'));

  console.log('');

  // 测试6: 依赖规范查询
  console.log('📋 测试6: 依赖规范查询');
  const schema = getDependencySchema();
  console.log('依赖规范键数量:', Object.keys(schema).length);
  console.log('moveTasksBetweenTags规范:');
  console.log('  - 名称:', schema.moveTasksBetweenTags.name);
  console.log('  - 类型:', schema.moveTasksBetweenTags.type);
  console.log('  - 必需:', schema.moveTasksBetweenTags.required);
  console.log('  - 描述:', schema.moveTasksBetweenTags.description);

  console.log('');

  // 测试7: 缓存默认依赖验证
  console.log('📋 测试7: 缓存默认依赖验证');
  const cachedDeps = createCachedDefaultDependencies();
  const result7 = validateDependenciesEnhanced(cachedDeps, { verbose: true });

  console.log('缓存依赖验证结果:', result7.isValid ? '✅ 通过' : '❌ 失败');
  if (result7.warnings.length > 0) {
    console.log('缓存依赖验证详情:');
    result7.warnings.forEach(w => console.log('  ✓', w));
  }

  console.log('\n🎉 增强验证测试完成！');
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedValidation().catch(console.error);
}
