/**
 * 测试mergeDependencies函数
 */

import { mergeDependencies, createMockDependencies } from './move-action-dependencies.js';

function testMergeDependencies() {
  console.log('🧪 测试mergeDependencies函数...\n');

  // 测试1: 基本合并
  console.log('📋 测试1: 基本依赖合并');
  const defaults = {
    func1: () => 'default1',
    func2: () => 'default2',
    obj1: { a: 1, b: 2 }
  };

  const overrides = {
    func1: () => 'override1', // 覆盖函数
    func3: () => 'new3',      // 新增函数
    obj1: { b: 3, c: 4 }     // 合并对象
  };

  const merged = mergeDependencies(defaults, overrides);

  console.log('原始默认依赖:', Object.keys(defaults));
  console.log('覆盖依赖:', Object.keys(overrides));
  console.log('合并结果:', Object.keys(merged));

  // 验证结果
  if (typeof merged.func1 === 'function' && merged.func1() === 'override1') {
    console.log('✅ 函数覆盖正确');
  } else {
    console.log('❌ 函数覆盖失败');
  }

  if (merged.func2() === 'default2') {
    console.log('✅ 默认函数保留正确');
  } else {
    console.log('❌ 默认函数丢失');
  }

  if (merged.func3() === 'new3') {
    console.log('✅ 新增函数正确');
  } else {
    console.log('❌ 新增函数失败');
  }

  if (merged.obj1.a === 1 && merged.obj1.b === 3 && merged.obj1.c === 4) {
    console.log('✅ 对象深度合并正确');
  } else {
    console.log('❌ 对象合并失败:', merged.obj1);
  }

  console.log('');

  // 测试2: Mock依赖合并
  console.log('📋 测试2: Mock依赖合并');
  const mockDeps = createMockDependencies();
  const mergedWithMock = mergeDependencies(defaults, mockDeps);

  console.log('Mock依赖键数量:', Object.keys(mockDeps).length);
  console.log('合并后键数量:', Object.keys(mergedWithMock).length);

  if (Object.keys(mergedWithMock).length >= Object.keys(defaults).length) {
    console.log('✅ Mock依赖合并成功');
  } else {
    console.log('❌ Mock依赖合并失败');
  }

  console.log('\n🎉 mergeDependencies测试完成！');
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testMergeDependencies();
}
