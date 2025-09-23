/**
 * 测试重构后的moveAction函数
 */

import { moveAction } from './move-action.js';
import { createMockDependencies } from './move-action-dependencies.js';

async function testRefactoredMoveAction() {
  console.log('🧪 测试重构后的moveAction函数...\n');

  // 测试1: 使用默认依赖（应该会尝试真正的文件操作，可能会失败但不影响测试）
  console.log('📋 测试1: 默认依赖调用');
  try {
    const result1 = await moveAction({
      from: '1',
      fromTag: 'backlog',
      toTag: 'in-progress'
    });
    console.log('✅ 默认依赖测试完成:', result1);
  } catch (error) {
    console.log('ℹ️ 默认依赖测试预期失败（无文件系统）:', error.message);
  }
  console.log('');

  // 测试2: 使用mock依赖
  console.log('📋 测试2: Mock依赖调用');
  try {
    const mockDeps = createMockDependencies();

    const result2 = await moveAction({
      from: '2',
      fromTag: 'backlog',
      toTag: 'in-progress'
    }, mockDeps, { tempDir: '/tmp/test' });

    console.log('✅ Mock依赖测试通过:', result2);
  } catch (error) {
    console.log('❌ Mock依赖测试失败:', error.message);
  }
  console.log('');

  // 测试3: 标签内移动
  console.log('📋 测试3: 标签内移动');
  try {
    const mockDeps = createMockDependencies();

    const result3 = await moveAction({
      from: '1',
      to: '2'
    }, mockDeps);

    console.log('✅ 标签内移动测试通过:', result3);
  } catch (error) {
    console.log('❌ 标签内移动测试失败:', error.message);
  }
  console.log('');

  // 测试4: 错误处理
  console.log('📋 测试4: 错误处理');
  try {
    await moveAction({}, createMockDependencies());
    console.log('❌ 错误处理测试失败 - 应该抛出错误');
  } catch (error) {
    console.log('✅ 错误处理测试通过 - 正确抛出错误');
  }

  console.log('\n🎉 重构函数测试完成！');
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testRefactoredMoveAction().catch(console.error);
}
