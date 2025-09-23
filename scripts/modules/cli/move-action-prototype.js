/**
 * 依赖注入重构原型验证
 *
 * 这个文件实现了一个简化版的moveAction函数原型，
 * 用于验证依赖注入方案的可行性和正确性。
 */

import {
  defaultDependencies,
  createMockDependencies,
  validateDependencies
} from './move-action-dependencies.js';

/**
 * 简化版moveAction函数原型 - 支持依赖注入
 * @param {object} options - 命令行选项
 * @param {object} dependencies - 依赖注入对象（可选）
 */
export async function moveActionPrototype(options, dependencies = {}) {
  // 合并默认依赖和注入依赖
  const deps = { ...defaultDependencies, ...dependencies };

  // 验证依赖完整性
  if (!validateDependencies(deps)) {
    throw new Error('Invalid dependencies provided');
  }

  // 异步解析依赖
  const [
    moveTasksBetweenTags,
    generateTaskFiles,
    moveTask,
    getCurrentTag,
    log,
    chalk
  ] = await Promise.all([
    Promise.resolve(typeof deps.moveTasksBetweenTags === 'function' ? deps.moveTasksBetweenTags() : deps.moveTasksBetweenTags),
    Promise.resolve(typeof deps.generateTaskFiles === 'function' ? deps.generateTaskFiles() : deps.generateTaskFiles),
    Promise.resolve(typeof deps.moveTask === 'function' ? deps.moveTask() : deps.moveTask),
    Promise.resolve(typeof deps.getCurrentTag === 'function' ? deps.getCurrentTag() : deps.getCurrentTag),
    Promise.resolve(typeof deps.log === 'function' ? deps.log() : deps.log),
    Promise.resolve(typeof deps.chalk === 'function' ? deps.chalk() : deps.chalk)
  ]);

  // 调试：检查解析结果
  console.log('🔍 依赖解析结果:', {
    moveTasksBetweenTags: typeof moveTasksBetweenTags,
    generateTaskFiles: typeof generateTaskFiles,
    moveTask: typeof moveTask,
    getCurrentTag: typeof getCurrentTag,
    log: typeof log,
    chalk: typeof chalk
  });

  // 解析选项
  const {
    from: sourceId,
    to: destinationId,
    fromTag,
    toTag,
    withDependencies = false,
    ignoreDependencies = false
  } = options;

  // 确定源标签
  const sourceTag = fromTag || getCurrentTag();

  // 模拟任务ID解析（简化版）
  const taskIds = sourceId ? sourceId.split(',').map(id => id.trim()) : [];

  // 记录开始执行
  log('info', `Starting move action with options: ${JSON.stringify(options)}`);

  try {
    if (sourceTag && toTag && sourceTag !== toTag) {
      // 跨标签移动
      log('info', `Performing cross-tag move: ${sourceTag} -> ${toTag}`);

      const result = await moveTasksBetweenTags(
        '/mock/tasks.json', // 模拟路径
        taskIds,
        sourceTag,
        toTag,
        { withDependencies, ignoreDependencies },
        { projectRoot: '/mock' }
      );

      console.log(chalk.green(`Successfully moved ${taskIds.length} tasks between tags`));

      // 生成任务文件（模拟）
      await generateTaskFiles('/mock/tasks.json', '/mock/tasks', { tag: sourceTag });
      await generateTaskFiles('/mock/tasks.json', '/mock/tasks', { tag: toTag });

      return result;
    } else if (sourceId && destinationId) {
      // 标签内移动
      log('info', `Performing within-tag move: ${sourceId} -> ${destinationId}`);

      await moveTask(sourceId, destinationId);
      console.log(chalk.green('Successfully moved task within tag'));

      return { message: 'Within-tag move completed' };
    } else {
      throw new Error('Invalid move options: missing required parameters');
    }
  } catch (error) {
    console.error(chalk.red(`Move failed: ${error.message}`));
    throw error;
  }
}

/**
 * 测试函数 - 验证原型功能
 */
export async function testPrototype() {
  console.log('🧪 开始原型验证测试...\n');

  // 测试1: 使用默认依赖（异步导入验证）
  console.log('📋 测试1: 默认依赖验证');
  try {
    // 只验证依赖可以正确解析，不执行实际操作
    const deps = defaultDependencies;
    const resolvedDeps = await Promise.all([
      deps.moveTasksBetweenTags(),
      deps.generateTaskFiles(),
      deps.moveTask(),
      deps.getCurrentTag(),
      deps.log(),
      typeof deps.chalk === 'function' ? deps.chalk() : deps.chalk
    ]);

    // 验证所有依赖都是函数或对象
    const allValid = resolvedDeps.every(dep =>
      typeof dep === 'function' ||
      (typeof dep === 'object' && dep !== null)
    );

    if (allValid) {
      console.log('✅ 默认依赖测试通过 - 所有依赖正确解析\n');
    } else {
      console.log('❌ 默认依赖测试失败 - 依赖解析不正确\n');
    }
  } catch (error) {
    console.log(`❌ 默认依赖测试失败: ${error.message}\n`);
  }

  // 测试2: 使用mock依赖
  console.log('📋 测试2: Mock依赖验证');
  try {
    // 创建一个可以跟踪调用的mock
    let moveCallCount = 0;
    let generateCallCount = 0;

    const mockDeps = {
      moveTasksBetweenTags: () => async (...args) => {
        moveCallCount++;
        return { message: 'Mock moved successfully' };
      },
      generateTaskFiles: () => async (...args) => {
        generateCallCount++;
      },
      moveTask: () => async (...args) => {},
      getCurrentTag: () => 'main',
      log: () => (...args) => {},
      chalk: {
        red: (text) => `[RED]${text}[/RED]`,
        green: (text) => `[GREEN]${text}[/GREEN]`,
        yellow: (text) => `[YELLOW]${text}[/YELLOW]`,
        gray: (text) => text,
        cyan: (text) => text,
        white: (text) => text,
        blue: (text) => text,
        magenta: (text) => text,
        bold: {
          cyan: (text) => text,
          white: (text) => text,
          red: (text) => text,
        }
      }
    };

    const result2 = await moveActionPrototype({
      from: '2',
      fromTag: 'backlog',
      toTag: 'in-progress'
    }, mockDeps);

    if (moveCallCount > 0) {
      console.log('✅ Mock依赖测试通过 - moveTasksBetweenTags函数被正确调用\n');
    } else {
      console.log('❌ Mock依赖测试失败 - moveTasksBetweenTags函数未被调用\n');
    }
  } catch (error) {
    console.log(`❌ Mock依赖测试失败: ${error.message}\n`);
  }

  // 测试3: 错误处理验证
  console.log('📋 测试3: 错误处理验证');
  try {
    await moveActionPrototype({}); // 缺少必需参数
    console.log('❌ 错误处理测试失败 - 应该抛出错误\n');
  } catch (error) {
    console.log('✅ 错误处理测试通过 - 正确抛出错误\n');
  }

  console.log('🎉 原型验证测试完成！');
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testPrototype().catch(console.error);
}
