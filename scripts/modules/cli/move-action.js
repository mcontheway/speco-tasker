/**
 * 依赖注入重构后的moveAction函数
 *
 * 这个文件替代原来的tests/integration/cli/move-cross-tag.test.js中的moveAction函数，
 * 支持依赖注入以彻底解决Vitest ES模块mock问题。
 */

import path from 'path';
import {
  createCachedDefaultDependencies,
  validateDependencies,
  mergeDependencies,
  initializeDependenciesAsync,
  getCacheStats,
  clearDependencyCache
} from './move-action-dependencies.js';

/**
 * 重构后的moveAction函数 - 支持依赖注入
 * @param {object} options - 命令行选项
 * @param {object} dependencies - 依赖注入对象（可选）
 * @param {object} context - 执行上下文（可选，用于测试）
 * @returns {Promise<object>} 执行结果
 */
export async function moveAction(options, dependencies = {}, context = {}) {
  // 使用缓存版本的默认依赖 + 高级依赖合并逻辑
  const defaultDeps = createCachedDefaultDependencies();
  const deps = mergeDependencies(defaultDeps, dependencies);

  // 验证依赖完整性
  if (!validateDependencies(deps)) {
    throw new Error('Invalid dependencies provided');
  }

  // 使用优化的异步依赖初始化器
  const initResult = await initializeDependenciesAsync(deps, {
    timeout: 5000, // 5秒超时
    failFast: true, // 快速失败
    performance: true // 收集性能数据
  });

  if (!initResult.success) {
    const error = new Error(`Dependency initialization failed: ${initResult.errors.join(', ')}`);
    console.error('Dependency initialization errors:', initResult.errors);
    throw error;
  }

  // 解构已初始化的依赖
  const {
    moveTasksBetweenTags,
    generateTaskFiles,
    moveTask,
    getCurrentTag,
    log,
    chalk
  } = initResult.dependencies;

  // 解析选项
  const {
    from: sourceId,
    to: destinationId,
    fromTag,
    toTag,
    withDependencies: withDeps = false,
    ignoreDependencies = false,
    force
  } = options;

  // 获取项目根目录（用于构建任务文件路径）
  const projectRoot = context.tempDir || process.cwd();

  // 获取源标签 - 如果未提供则使用当前标签
  const sourceTag = fromTag || deps.getCurrentTag({ projectRoot });

  // 判断是否为跨标签移动
  const isCrossTagMove = sourceTag && toTag && sourceTag !== toTag;

  let result;

  if (isCrossTagMove) {
    // 跨标签移动逻辑
    result = await handleCrossTagMove({
      sourceId,
      sourceTag,
      toTag,
      withDeps,
      ignoreDependencies,
      projectRoot,
      moveTasksBetweenTags,
      generateTaskFiles,
      chalk,
      log
    });
  } else {
    // 标签内移动逻辑
    result = await handleWithinTagMove({
      sourceId,
      destinationId,
      sourceTag,
      toTag,
      moveTask,
      chalk,
      log
    });
  }

  return result;
}

/**
 * 处理跨标签移动逻辑
 */
async function handleCrossTagMove({
  sourceId,
  sourceTag,
  toTag,
  withDeps,
  ignoreDependencies,
  projectRoot,
  moveTasksBetweenTags,
  generateTaskFiles,
  chalk,
  log
}) {
  // 参数验证
  if (!sourceId) {
    const error = new Error("--from parameter is required for cross-tag moves");
    console.error(chalk.red(`Error: ${error.message}`));
    throw error;
  }

  // 解析任务ID
  const taskIds = sourceId.split(",").map(id => id.trim());

  // 验证任务ID格式
  for (let i = 0; i < taskIds.length; i++) {
    const numId = Number.parseInt(taskIds[i], 10);
    if (Number.isNaN(numId)) {
      const error = new Error(
        `Invalid task ID at position ${i + 1}: "${sourceId.split(",")[i].trim()}" is not a valid number`
      );
      console.error(chalk.red(`Error: ${error.message}`));
      throw error;
    }
  }

  // 构建任务文件路径
  const tasksPath = path.join(
    projectRoot,
    ".taskmaster",
    "tasks",
    "tasks.json"
  );

  try {
    // 执行跨标签移动
    const result = await moveTasksBetweenTags(
      tasksPath,
      taskIds,
      sourceTag,
      toTag,
      {
        withDependencies: withDeps,
        ignoreDependencies
      },
      { projectRoot }
    );

    console.log(chalk.green("Successfully moved task(s) between tags"));

    // 显示建议提示（如果有）
    if (result && Array.isArray(result.tips) && result.tips.length > 0) {
      console.log("Next Steps:");
      for (const tip of result.tips) {
        console.log(`  • ${tip}`);
      }
    }

    // 生成任务文件
    await generateTaskFiles(tasksPath, path.dirname(tasksPath), { tag: sourceTag });
    await generateTaskFiles(tasksPath, path.dirname(tasksPath), { tag: toTag });

    return result;
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));

    // 处理ID冲突错误，提供额外指导
    if (typeof error?.message === "string" &&
        error.message.includes("already exists in target tag")) {
      console.log("");
      console.log("Conflict: ID already exists in target tag");
      console.log("  • Choose a different target tag without conflicting IDs");
      console.log("  • Move a different set of IDs (avoid existing ones)");
      console.log("  • If needed, move within-tag to a new ID first, then cross-tag move");
    }

    throw error;
  }
}

/**
 * 处理标签内移动逻辑
 */
async function handleWithinTagMove({
  sourceId,
  destinationId,
  sourceTag,
  toTag,
  moveTask,
  chalk,
  log
}) {
  // 处理同名标签的情况
  if (sourceTag && toTag && sourceTag === toTag) {
    if (destinationId) {
      // 有目标ID，执行标签内移动
      if (!sourceId) {
        const error = new Error("Both --from and --to parameters are required for within-tag moves");
        console.error(chalk.red(`Error: ${error.message}`));
        throw error;
      }
    } else {
      // 没有目标ID，这是错误
      const error = new Error(`Source and target tags are the same ("${sourceTag}") but no destination specified`);
      console.error(chalk.red(`Error: ${error.message}`));
      console.log("");
      console.log(chalk.yellow("For within-tag moves, use: task-master move --from=<sourceId> --to=<destinationId>"));
      console.log(chalk.yellow("For cross-tag moves, use different tags: task-master move --from=<sourceId> --from-tag=<sourceTag> --to-tag=<targetTag>"));
      throw error;
    }
  } else {
    // 标准标签内移动
    if (!sourceId || !destinationId) {
      const error = new Error("Both --from and --to parameters are required for within-tag moves");
      console.error(chalk.red(`Error: ${error.message}`));
      throw error;
    }
  }

  try {
    // 执行标签内移动
    await moveTask(sourceId, destinationId);
    console.log(chalk.green("Successfully moved task"));

    return { message: "Within-tag move completed" };
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    throw error;
  }
}

// 导出用于测试和监控的辅助函数
export {
  createCachedDefaultDependencies,
  validateDependencies,
  validateDependenciesEnhanced,
  mergeDependencies,
  initializeDependenciesAsync,
  getDependencySchema,
  createValidationReport,
  getCacheStats,
  clearDependencyCache
} from './move-action-dependencies.js';
