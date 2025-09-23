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
 * 验证依赖对象是否完整
 * @param {object} deps - 要验证的依赖对象
 * @returns {boolean} 验证结果
 */
export function validateDependencies(deps) {
  if (!deps || typeof deps !== 'object') {
    console.error('Dependencies must be an object');
    return false;
  }

  // 检查必需的依赖
  const required = [
    'moveTasksBetweenTags',
    'generateTaskFiles',
    'moveTask',
    'getCurrentTag',
    'log',
    'chalk'
  ];

  for (const key of required) {
    if (!(key in deps)) {
      console.error(`Missing required dependency: ${key}`);
      return false;
    }
  }

  // 检查函数类型（异步函数也是函数）
  const functions = ['moveTasksBetweenTags', 'generateTaskFiles', 'moveTask', 'getCurrentTag', 'log'];
  for (const key of functions) {
    if (typeof deps[key] !== 'function') {
      console.error(`Dependency ${key} must be a function, got ${typeof deps[key]}`);
      return false;
    }
  }

  // 检查chalk - 可能是异步函数或对象
  const chalk = deps.chalk;
  if (typeof chalk === 'function') {
    // 异步chalk加载函数，这是允许的
  } else if (typeof chalk === 'object' && chalk && typeof chalk.red === 'function' && typeof chalk.green === 'function') {
    // 同步chalk对象，也是允许的
  } else {
    console.error('chalk dependency must be a function (for async loading) or an object with red and green methods');
    return false;
  }

  return true;
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
    // 这些是同步返回的函数，不需要异步包装
    moveTasksBetweenTags: () => createMockFn().mockResolvedValue({ message: 'Mock moved successfully' }),
    generateTaskFiles: () => createMockFn().mockResolvedValue(undefined),
    moveTask: () => createMockFn().mockResolvedValue(undefined),
    getCurrentTag: () => createMockFn('main'),
    log: () => createMockFn(),
    chalk: {  // chalk是同步对象，直接返回
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
}
