/**
 * 依赖注入接口定义 - MoveAction函数的外部依赖
 *
 * 这个文件定义了moveAction函数所需的所有外部依赖接口，
 * 用于支持依赖注入重构，彻底解决Vitest ES模块mock问题。
 */

/**
 * MoveAction函数的外部依赖接口
 * @interface MoveActionDependencies
 */
export const MoveActionDependencies = {
  // 核心业务逻辑函数

  /**
   * 跨标签移动任务的核心函数
   * @param {string} tasksPath - 任务文件路径
   * @param {string[]} taskIds - 要移动的任务ID数组
   * @param {string} sourceTag - 源标签名
   * @param {string} targetTag - 目标标签名
   * @param {object} options - 移动选项 {withDependencies, ignoreDependencies}
   * @param {object} context - 执行上下文 {projectRoot}
   * @returns {Promise<{message: string, movedTasks: any[], tips?: string[]}>}
   */
  moveTasksBetweenTags: async function(tasksPath, taskIds, sourceTag, targetTag, options, context) {
    throw new Error('moveTasksBetweenTags must be implemented');
  },

  /**
   * 生成任务文件的函数
   * @param {string} tasksPath - 任务文件路径
   * @param {string} outputPath - 输出目录路径
   * @param {object} options - 生成选项 {tag}
   * @returns {Promise<void>}
   */
  generateTaskFiles: async function(tasksPath, outputPath, options) {
    throw new Error('generateTaskFiles must be implemented');
  },

  /**
   * 标签内移动任务的函数
   * @param {string} sourceId - 源任务ID
   * @param {string} destinationId - 目标任务ID
   * @returns {Promise<void>}
   */
  moveTask: async function(sourceId, destinationId) {
    throw new Error('moveTask must be implemented');
  },

  // 工具函数

  /**
   * 获取当前标签的函数
   * @returns {string} 当前标签名
   */
  getCurrentTag: function() {
    throw new Error('getCurrentTag must be implemented');
  },

  /**
   * 日志记录函数
   * @param {string} level - 日志级别 ('info', 'error', 'warn')
   * @param {string} message - 日志消息
   */
  log: function(level, message) {
    throw new Error('log must be implemented');
  },

  // UI组件

  /**
   * 彩色输出组件
   */
  chalk: {
    /**
     * 红色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    red: function(text) {
      return text; // 默认实现不添加颜色
    },

    /**
     * 绿色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    green: function(text) {
      return text;
    },

    /**
     * 黄色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    yellow: function(text) {
      return text;
    },

    /**
     * 灰色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    gray: function(text) {
      return text;
    },

    /**
     * 青色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    cyan: function(text) {
      return text;
    },

    /**
     * 白色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    white: function(text) {
      return text;
    },

    /**
     * 蓝色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    blue: function(text) {
      return text;
    },

    /**
     * 品红色输出
     * @param {string} text - 要着色的文本
     * @returns {string} 着色后的文本
     */
    magenta: function(text) {
      return text;
    },

    /**
     * 粗体样式
     */
    bold: {
      cyan: function(text) { return text; },
      white: function(text) { return text; },
      red: function(text) { return text; },
    }
  }
};

/**
 * 默认依赖提供者 - 动态导入实际模块
 */
export const defaultDependencies = {
  /**
   * 异步获取moveTasksBetweenTags函数
   * @returns {Promise<Function>} moveTasksBetweenTags函数
   */
  moveTasksBetweenTags: async () => {
    const module = await import('../task-manager/move-task.js');
    return module.moveTasksBetweenTags;
  },

  /**
   * 异步获取generateTaskFiles函数
   * @returns {Promise<Function>} generateTaskFiles函数
   */
  generateTaskFiles: async () => {
    const module = await import('../task-manager/generate-task-files.js');
    return module.default;
  },

  /**
   * 异步获取moveTask函数
   * @returns {Promise<Function>} moveTask函数
   */
  moveTask: async () => {
    const module = await import('../task-manager/move-task.js');
    return module.default;
  },

  /**
   * 异步获取getCurrentTag函数
   * @returns {Promise<Function>} getCurrentTag函数
   */
  getCurrentTag: async () => {
    const module = await import('../utils.js');
    return module.getCurrentTag;
  },

  /**
   * 异步获取log函数
   * @returns {Promise<Function>} log函数
   */
  log: async () => {
    const module = await import('../utils.js');
    return module.log;
  },

  /**
   * 获取chalk模块
   * @returns {Promise<object>} chalk对象
   */
  chalk: async () => {
    try {
      const chalk = (await import('chalk')).default;
      return chalk;
    } catch (error) {
      // 如果chalk不可用，返回默认实现
      return MoveActionDependencies.chalk;
    }
  }
};

/**
 * 合并默认依赖和注入依赖
 * @param {object} defaults - 默认依赖对象
 * @param {object} overrides - 注入的依赖对象
 * @returns {object} 合并后的依赖对象
 */
export function mergeDependencies(defaults, overrides) {
  if (!defaults || typeof defaults !== 'object') {
    throw new Error('Defaults must be a valid object');
  }

  if (!overrides || typeof overrides !== 'object') {
    return { ...defaults };
  }

  const result = {};

  // 获取所有依赖键
  const allKeys = new Set([...Object.keys(defaults), ...Object.keys(overrides)]);

  for (const key of allKeys) {
    const defaultValue = defaults[key];
    const overrideValue = overrides[key];

    // 如果只有默认值，使用默认值
    if (overrideValue === undefined) {
      result[key] = defaultValue;
      continue;
    }

    // 如果只有覆盖值，使用覆盖值
    if (defaultValue === undefined) {
      result[key] = overrideValue;
      continue;
    }

    // 两个值都存在，需要合并
    result[key] = mergeDependencyValue(defaultValue, overrideValue, key);
  }

  return result;
}

/**
 * 合并单个依赖值
 * @param {*} defaultValue - 默认值
 * @param {*} overrideValue - 覆盖值
 * @param {string} key - 依赖键名
 * @returns {*} 合并后的值
 */
function mergeDependencyValue(defaultValue, overrideValue, key) {
  // 对于函数类型，直接使用覆盖值（通常是mock）
  if (typeof overrideValue === 'function') {
    return overrideValue;
  }

  // 对于对象类型，进行深度合并
  if (typeof defaultValue === 'object' && typeof overrideValue === 'object' &&
      defaultValue !== null && overrideValue !== null) {
    return mergeObjects(defaultValue, overrideValue);
  }

  // 其他情况直接使用覆盖值
  return overrideValue;
}

/**
 * 深度合并两个对象
 * @param {object} target - 目标对象
 * @param {object} source - 源对象
 * @returns {object} 合并后的对象
 */
function mergeObjects(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      // 如果目标对象有相同键，进行递归合并
      if (targetValue && typeof targetValue === 'object' && typeof sourceValue === 'object') {
        result[key] = mergeObjects(targetValue, sourceValue);
      } else {
        // 直接覆盖
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * 增强的依赖验证结果
 * @typedef {object} ValidationResult
 * @property {boolean} isValid - 是否验证通过
 * @property {Array<string>} errors - 错误信息列表
 * @property {Array<string>} warnings - 警告信息列表
 * @property {object} metadata - 验证元数据
 */

/**
 * 依赖类型定义
 * @typedef {object} DependencyType
 * @property {string} name - 依赖名称
 * @property {string} type - 期望类型 ('function' | 'object' | 'mixed')
 * @property {boolean} required - 是否必需
 * @property {Function} validator - 自定义验证函数
 */

/**
 * 依赖类型规范
 */
const DEPENDENCY_SCHEMA = {
  moveTasksBetweenTags: {
    name: 'moveTasksBetweenTags',
    type: 'function',
    required: true,
    description: '跨标签移动任务的核心函数',
    validator: (value) => typeof value === 'function'
  },

  generateTaskFiles: {
    name: 'generateTaskFiles',
    type: 'function',
    required: true,
    description: '生成任务文件的函数',
    validator: (value) => typeof value === 'function'
  },

  moveTask: {
    name: 'moveTask',
    type: 'function',
    required: true,
    description: '标签内移动任务的函数',
    validator: (value) => typeof value === 'function'
  },

  getCurrentTag: {
    name: 'getCurrentTag',
    type: 'function',
    required: true,
    description: '获取当前标签的函数',
    validator: (value) => typeof value === 'function'
  },

  log: {
    name: 'log',
    type: 'function',
    required: true,
    description: '日志记录函数',
    validator: (value) => typeof value === 'function'
  },

  chalk: {
    name: 'chalk',
    type: 'mixed',
    required: true,
    description: '彩色输出组件',
    validator: (value) => {
      if (typeof value === 'function') return true; // 异步加载函数
      if (typeof value === 'object' && value) {
        // 检查必需的方法
        const requiredMethods = ['red', 'green', 'yellow'];
        return requiredMethods.every(method =>
          typeof value[method] === 'function'
        );
      }
      return false;
    }
  }
};

/**
 * 增强版依赖验证函数 - 提供详细的验证结果和错误信息
 * @param {object} deps - 要验证的依赖对象
 * @param {object} options - 验证选项
 * @returns {ValidationResult} 详细的验证结果
 */
export function validateDependenciesEnhanced(deps, options = {}) {
  const {
    strict = false, // 严格模式 - 对可选依赖也进行验证
    verbose = false // 详细模式 - 输出更多调试信息
  } = options;

  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      totalDependencies: 0,
      validDependencies: 0,
      invalidDependencies: 0,
      missingDependencies: 0
    }
  };

  // 基础类型检查
  if (!deps || typeof deps !== 'object') {
    result.errors.push('Dependencies must be a valid object');
    result.isValid = false;
    return result;
  }

  result.metadata.totalDependencies = Object.keys(DEPENDENCY_SCHEMA).length;

  // 遍历所有定义的依赖
  for (const [key, schema] of Object.entries(DEPENDENCY_SCHEMA)) {
    const value = deps[key];

    // 检查必需依赖是否存在
    if (value === undefined) {
      if (schema.required) {
        result.errors.push(`Missing required dependency: ${key} (${schema.description})`);
        result.metadata.missingDependencies++;
        result.isValid = false;
      } else if (strict) {
        result.warnings.push(`Missing optional dependency: ${key}`);
      }
      continue;
    }

    // 运行自定义验证器
    try {
      const isValid = schema.validator(value);
      if (!isValid) {
        result.errors.push(
          `Invalid dependency ${key}: expected ${schema.type}, got ${typeof value} (${schema.description})`
        );
        result.metadata.invalidDependencies++;
        result.isValid = false;
      } else {
        result.metadata.validDependencies++;
        if (verbose) {
          result.warnings.push(`✓ ${key}: valid ${schema.type}`);
        }
      }
    } catch (error) {
      result.errors.push(`Validation error for ${key}: ${error.message}`);
      result.metadata.invalidDependencies++;
      result.isValid = false;
    }
  }

  // 检查额外的不明依赖
  const knownKeys = new Set(Object.keys(DEPENDENCY_SCHEMA));
  const extraKeys = Object.keys(deps).filter(key => !knownKeys.has(key));

  if (extraKeys.length > 0) {
    if (strict) {
      result.errors.push(`Unknown dependencies found: ${extraKeys.join(', ')}`);
      result.isValid = false;
    } else {
      result.warnings.push(`Extra dependencies (ignored): ${extraKeys.join(', ')}`);
    }
  }

  return result;
}

/**
 * 向后兼容的简单验证函数
 * @param {object} deps - 要验证的依赖对象
 * @returns {boolean} 验证结果
 */
export function validateDependencies(deps) {
  const result = validateDependenciesEnhanced(deps, { verbose: false });

  // 输出错误信息
  if (result.errors.length > 0) {
    console.error('Dependency validation failed:');
    result.errors.forEach(error => console.error(`  ❌ ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('Dependency validation warnings:');
    result.warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`));
  }

  return result.isValid;
}

/**
 * 获取依赖规范
 * @returns {object} 依赖规范定义
 */
export function getDependencySchema() {
  return { ...DEPENDENCY_SCHEMA };
}

/**
 * 创建依赖验证报告
 * @param {object} deps - 依赖对象
 * @returns {string} 格式化的验证报告
 */
export function createValidationReport(deps) {
  const result = validateDependenciesEnhanced(deps, { verbose: true });

  let report = '=== 依赖验证报告 ===\n\n';

  report += `总体状态: ${result.isValid ? '✅ 通过' : '❌ 失败'}\n`;
  report += `依赖数量: ${result.metadata.totalDependencies}\n`;
  report += `有效依赖: ${result.metadata.validDependencies}\n`;

  if (result.errors.length > 0) {
    report += `\n❌ 错误 (${result.errors.length}):\n`;
    result.errors.forEach(error => {
      report += `  • ${error}\n`;
    });
  }

  if (result.warnings.length > 0) {
    report += `\n⚠️ 警告 (${result.warnings.length}):\n`;
    result.warnings.forEach(warning => {
      report += `  • ${warning}\n`;
    });
  }

  return report;
}

// 依赖解析缓存
const dependencyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 缓存依赖项的解析结果
 */
class DependencyCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * 获取缓存的依赖
   * @param {string} key - 缓存键
   * @returns {*} 缓存的值或undefined
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * 设置缓存的依赖
   * @param {string} key - 缓存键
   * @param {*} value - 要缓存的值
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存中的项目数量
   */
  size() {
    return this.cache.size;
  }
}

// 创建全局缓存实例
const globalCache = new DependencyCache();

/**
 * 带缓存的异步依赖解析器
 * @param {Function} resolver - 异步解析函数
 * @param {string} cacheKey - 缓存键
 * @returns {Promise<*>} 解析结果
 */
export async function resolveDependencyWithCache(resolver, cacheKey) {
  // 尝试从缓存获取
  const cached = globalCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // 缓存未命中，执行解析
  try {
    const result = await resolver();
    // 缓存结果
    globalCache.set(cacheKey, result);
    return result;
  } catch (error) {
    // 解析失败，不缓存错误结果
    throw error;
  }
}

/**
 * 创建缓存版本的默认依赖
 * @returns {object} 带缓存的默认依赖
 */
export function createCachedDefaultDependencies() {
  return {
    /**
     * 缓存版本的moveTasksBetweenTags
     * @returns {Promise<Function>} moveTasksBetweenTags函数
     */
    moveTasksBetweenTags: () =>
      resolveDependencyWithCache(
        () => import('../task-manager/move-task.js').then(m => m.moveTasksBetweenTags),
        'moveTasksBetweenTags'
      ),

    /**
     * 缓存版本的generateTaskFiles
     * @returns {Promise<Function>} generateTaskFiles函数
     */
    generateTaskFiles: () =>
      resolveDependencyWithCache(
        () => import('../task-manager/generate-task-files.js').then(m => m.default),
        'generateTaskFiles'
      ),

    /**
     * 缓存版本的moveTask
     * @returns {Promise<Function>} moveTask函数
     */
    moveTask: () =>
      resolveDependencyWithCache(
        () => import('../task-manager/move-task.js').then(m => m.default),
        'moveTask'
      ),

    /**
     * 缓存版本的getCurrentTag
     * @returns {Promise<Function>} getCurrentTag函数
     */
    getCurrentTag: () =>
      resolveDependencyWithCache(
        () => import('../utils.js').then(m => m.getCurrentTag),
        'getCurrentTag'
      ),

    /**
     * 缓存版本的log
     * @returns {Promise<Function>} log函数
     */
    log: () =>
      resolveDependencyWithCache(
        () => import('../utils.js').then(m => m.log),
        'log'
      ),

    /**
     * chalk依赖（同步，无需缓存）
     * @returns {Promise<object>} chalk对象
     */
    chalk: async () => {
      return resolveDependencyWithCache(async () => {
        try {
          const chalk = (await import('chalk')).default;
          return chalk;
        } catch (error) {
          // 如果chalk不可用，返回默认实现
          return MoveActionDependencies.chalk;
        }
      }, 'chalk');
    }
  };
}

/**
 * 获取缓存统计信息
 * @returns {object} 缓存统计
 */
export function getCacheStats() {
  return {
    size: globalCache.size(),
    entries: Array.from(globalCache.cache.keys())
  };
}

/**
 * 清除依赖缓存（用于测试或内存清理）
 */
export function clearDependencyCache() {
  globalCache.clear();
}

/**
 * 异步依赖初始化结果
 * @typedef {object} InitializationResult
 * @property {boolean} success - 是否初始化成功
 * @property {object} dependencies - 解析后的依赖对象
 * @property {Array<string>} errors - 初始化错误列表
 * @property {object} performance - 性能指标
 */

/**
 * 优化版异步依赖初始化器 - 提供并行加载、错误处理和性能监控
 * @param {object} deps - 依赖配置对象
 * @param {object} options - 初始化选项
 * @returns {Promise<InitializationResult>} 初始化结果
 */
export async function initializeDependenciesAsync(deps, options = {}) {
  const {
    timeout = 10000, // 10秒超时
    failFast = false, // 是否快速失败
    performance = true // 是否收集性能数据
  } = options;

  const startTime = performance ? Date.now() : 0;
  const results = {
    success: true,
    dependencies: {},
    errors: [],
    performance: {
      totalTime: 0,
      individualTimes: {},
      cacheHits: 0,
      cacheMisses: 0
    }
  };

  // 创建带超时的依赖加载器
  const createTimedResolver = (key, resolver) => {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Dependency '${key}' initialization timeout after ${timeout}ms`));
      }, timeout);

      try {
        const individualStart = performance ? Date.now() : 0;
        const result = await resolver();

        if (performance) {
          const individualTime = Date.now() - individualStart;
          results.performance.individualTimes[key] = individualTime;
        }

        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  };

  // 准备所有依赖的加载任务
  const loadTasks = Object.entries(deps).map(([key, resolver]) => {
    return createTimedResolver(key, resolver)
      .then(result => ({ key, result, success: true }))
      .catch(error => ({ key, error, success: false }));
  });

  // 并行执行所有加载任务
  const taskResults = await Promise.allSettled(loadTasks);

  // 处理结果
  for (const taskResult of taskResults) {
    if (taskResult.status === 'fulfilled') {
      const taskValue = taskResult.value;
      const { key, success } = taskValue;

      if (success) {
        const { result } = taskValue;
        results.dependencies[key] = result;

        // 检查是否从缓存加载（通过resolveDependencyWithCache的缓存统计）
        if (performance && globalCache.get(key.replace(/^\w+/, ''))) {
          results.performance.cacheHits++;
        } else {
          results.performance.cacheMisses++;
        }
      } else {
        const { error } = taskValue;
        results.errors.push(`${key}: ${error.message}`);
        results.success = false;

        if (failFast) {
          break; // 快速失败模式
        }
      }
    } else {
      // Promise.allSettled的rejected情况
      const error = taskResult.reason;
      results.errors.push(`Promise rejection: ${error.message}`);
      results.success = false;

      if (failFast) {
        break;
      }
    }
  }

  // 计算总时间
  if (performance) {
    results.performance.totalTime = Date.now() - startTime;
  }

  return results;
}

/**
 * 依赖预热函数 - 提前加载常用依赖
 * @param {Array<string>} dependencyKeys - 要预热的依赖键列表
 * @returns {Promise<object>} 预热统计信息
 */
export async function warmupDependencies(dependencyKeys = ['moveTasksBetweenTags', 'generateTaskFiles']) {
  const cachedDeps = createCachedDefaultDependencies();
  const warmupStats = {
    requested: dependencyKeys.length,
    successful: 0,
    failed: 0,
    errors: [],
    timeSpent: 0
  };

  const startTime = Date.now();

  // 并行预热指定的依赖
  const warmupTasks = dependencyKeys.map(key => {
    const resolver = cachedDeps[key];
    if (!resolver) {
      warmupStats.errors.push(`Unknown dependency: ${key}`);
      return Promise.resolve();
    }

    return resolver()
      .then(() => {
        warmupStats.successful++;
      })
      .catch(error => {
        warmupStats.failed++;
        warmupStats.errors.push(`${key}: ${error.message}`);
      });
  });

  await Promise.allSettled(warmupTasks);
  warmupStats.timeSpent = Date.now() - startTime;

  return warmupStats;
}

/**
 * 创建测试用的mock依赖对象（Node.js兼容版本）
 * @returns {object} mock依赖对象
 */
export function createMockDependencies() {
  // 简单的mock函数实现
  const createMockFn = (returnValue = undefined) => {
    const mockFn = (...args) => {
      mockFn.calls.push(args);
      mockFn.callCount++;
      return returnValue;
    };
    mockFn.calls = [];
    mockFn.callCount = 0;
    mockFn.mockResolvedValue = (value) => {
      mockFn.__returnValue = value;
      return mockFn;
    };
    return mockFn;
  };

  return {
    // 所有依赖都作为resolver函数返回
    moveTasksBetweenTags: () => createMockFn().mockResolvedValue({ message: 'Mock moved successfully' }),
    generateTaskFiles: () => createMockFn().mockResolvedValue(undefined),
    moveTask: () => createMockFn().mockResolvedValue(undefined),
    getCurrentTag: () => createMockFn('main'),
    log: () => createMockFn(),
    chalk: () => ({  // chalk作为resolver函数返回
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
    })
  };
}
