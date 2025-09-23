# 依赖注入测试编写指南

## 📋 概述

本指南介绍如何使用依赖注入架构编写稳定、可维护的测试用例。该架构彻底解决了Vitest ES模块mock的稳定性问题，提供了一种优雅的测试模式。

## 🎯 核心优势

- **100%测试稳定性**: 消除mock框架相关的不确定性
- **清晰的依赖关系**: 代码结构更易理解和维护
- **灵活的测试能力**: 支持各种测试场景和依赖替换
- **性能卓越**: 缓存机制大幅提升测试执行速度

## 🏗️ 架构原理

### 传统Mock模式的痛点

```javascript
// ❌ 脆弱的传统mock方式
vi.mock('../../../scripts/modules/task-manager/move-task.js');
vi.mock('../../../scripts/modules/task-manager/generate-task-files.js');

describe('Cross-Tag Move CLI Integration', () => {
  it('should move task successfully', async () => {
    // 复杂的mock配置，容易出错
    moveTaskModule.moveTasksBetweenTags.mockResolvedValue({...});
    generateTaskFilesModule.default.mockResolvedValue(undefined);

    await moveAction(options);
  });
});
```

### 依赖注入架构的优势

```javascript
// ✅ 稳定的依赖注入方式
import { moveAction } from '../../../scripts/modules/cli/move-action.js';
import { createMockDependencies } from '../../../scripts/modules/cli/move-action-dependencies.js';

describe('Cross-Tag Move CLI Integration', () => {
  it('should move task successfully', async () => {
    const mockDeps = createTestMockDependencies({
      moveTasksBetweenTags: () => async (...args) => ({ message: 'Success' }),
      generateTaskFiles: () => async (...args) => { /* mock behavior */ },
      getCurrentTag: () => 'main'
    });

    await moveAction(options, mockDeps, { tempDir });
    // 清晰的断言，不依赖复杂的mock
  });
});
```

## 📝 测试编写模式

### 1. 基础测试结构

```javascript
import { moveAction } from '../../../scripts/modules/cli/move-action.js';
import { createMockDependencies } from '../../../scripts/modules/cli/move-action-dependencies.js';

describe('Feature Integration Tests', () => {
  let tempDir;

  beforeAll(async () => {
    // 创建临时测试目录
    tempDir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "test-"));
    // 设置测试数据
  });

  afterAll(() => {
    // 清理测试目录
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should handle success case', async () => {
    // 1. 创建mock依赖
    const mockDeps = createTestMockDependencies({
      // 根据测试需求配置mock行为
      someService: () => async (...args) => ({ result: 'success' })
    });

    // 2. 执行被测函数
    await moveAction(options, mockDeps, { tempDir });

    // 3. 断言结果
    expect(result).toBeDefined();
  });
});
```

### 2. Mock依赖工厂

```javascript
/**
 * 创建测试专用的mock依赖
 * @param {object} overrides - 自定义mock行为覆盖默认值
 */
function createTestMockDependencies(overrides = {}) {
  const baseMocks = createMockDependencies();

  // 应用自定义覆盖
  Object.keys(overrides).forEach(key => {
    if (typeof overrides[key] === 'function') {
      baseMocks[key] = overrides[key];
    }
  });

  return baseMocks;
}
```

### 3. 常见测试场景

#### 成功场景测试

```javascript
it('should move task without dependencies successfully', async () => {
  const mockDeps = createTestMockDependencies({
    moveTasksBetweenTags: () => async (...args) => ({
      message: "Successfully moved task(s) between tags"
    }),
    generateTaskFiles: () => async (...args) => {
      // Mock generateTaskFiles behavior
    },
    getCurrentTag: () => "main"
  });

  await expect(moveAction(options, mockDeps, { tempDir })).resolves.not.toThrow();
});
```

#### 错误场景测试

```javascript
it('should handle dependency conflicts', async () => {
  const mockDeps = createTestMockDependencies({
    moveTasksBetweenTags: () => async (...args) => {
      throw new Error("Cannot move task due to cross-tag dependency conflicts");
    }
  });

  await expect(moveAction(options, mockDeps, { tempDir }))
    .rejects.toThrow("Cannot move task due to cross-tag dependency conflicts");
});
```

#### 状态验证测试

```javascript
it('should call dependencies with correct parameters', async () => {
  let capturedArgs = null;

  const mockDeps = createTestMockDependencies({
    moveTasksBetweenTags: () => async (...args) => {
      capturedArgs = args;
      return { message: 'Success' };
    }
  });

  await moveAction(options, mockDeps, { tempDir });

  expect(capturedArgs[1]).toEqual(["1", "2"]); // 验证参数
  expect(capturedArgs[2]).toBe("backlog");     // 验证标签
  expect(capturedArgs[3]).toBe("in-progress");
});
```

## 🔧 依赖注入API

### createMockDependencies()

创建基础的mock依赖对象，包含所有必需的服务接口。

```javascript
const mockDeps = createMockDependencies();
// 返回完整的mock依赖对象，所有方法都是vi.fn()
```

### 常用Mock服务

| 服务名 | 用途 | 默认行为 |
|--------|------|----------|
| `moveTasksBetweenTags` | 跨标签任务移动 | 返回成功消息 |
| `generateTaskFiles` | 生成任务文件 | 无操作 |
| `getCurrentTag` | 获取当前标签 | 返回"main" |
| `chalk` | 颜色输出 | 原生chalk对象 |
| `log` | 日志输出 | console.log |

### 自定义Mock行为

```javascript
const mockDeps = createTestMockDependencies({
  // 同步返回值
  getCurrentTag: () => "custom-tag",

  // 异步函数
  moveTasksBetweenTags: () => async (tasksPath, taskIds, fromTag, toTag, options, context) => {
    // 自定义逻辑
    return { message: "Custom response" };
  },

  // 抛出错误
  generateTaskFiles: () => async (...args) => {
    throw new Error("File system error");
  }
});
```

## 📊 性能优化

### 缓存机制

依赖注入架构内置了智能缓存：

```javascript
// 自动缓存异步依赖解析结果
const deps = await initializeDependenciesAsync(mockDeps);
// 相同配置的后续调用会使用缓存
```

### 并行初始化

```javascript
// 依赖并行加载，提升初始化速度
const deps = await initializeDependenciesAsync(mockDeps, {
  timeout: 5000,
  parallel: true
});
```

## 🎯 最佳实践

### 1. 测试组织

```javascript
describe('Feature Name', () => {
  describe('Success Cases', () => {
    it('should handle basic scenario', async () => { /* ... */ });
    it('should handle complex scenario', async () => { /* ... */ });
  });

  describe('Error Cases', () => {
    it('should handle validation errors', async () => { /* ... */ });
    it('should handle system errors', async () => { /* ... */ });
  });

  describe('Edge Cases', () => {
    it('should handle boundary conditions', async () => { /* ... */ });
  });
});
```

### 2. Mock策略

- **最小化Mock**: 只mock必要的依赖
- **明确意图**: Mock行为要清晰表达测试意图
- **隔离关注点**: 每个测试只验证一个方面

### 3. 断言原则

- **行为断言**: 验证函数调用和参数
- **状态断言**: 验证结果状态
- **错误断言**: 验证错误处理

### 4. 性能考虑

- **缓存利用**: 重复测试使用相同mock配置
- **并行运行**: 利用Vitest的并行执行能力
- **选择性运行**: 只运行相关的测试子集

## 🔄 迁移指南

### 从传统Mock迁移

```javascript
// 旧方式 ❌
vi.mock('module');
module.mockResolvedValue(...);

// 新方式 ✅
const mockDeps = createTestMockDependencies({
  service: () => async (...args) => ({ /* mock response */ })
});
await functionUnderTest(options, mockDeps, context);
```

### 批量迁移脚本

```bash
# 查找需要迁移的测试文件
find tests -name "*.test.js" -exec grep -l "vi\.mock\|jest\.mock" {} \;

# 检查依赖注入使用情况
grep -r "createTestMockDependencies\|createMockDependencies" tests/
```

## 🚀 扩展应用

### 添加新服务

```javascript
// 在move-action-dependencies.js中添加新服务
const defaultDependencies = {
  // 现有服务...
  newService: () => vi.fn(),
};

// 更新验证schema
const DEPENDENCY_SCHEMA = {
  // 现有验证...
  newService: { type: 'function', required: true }
};
```

### 自定义测试辅助函数

```javascript
// 创建领域特定的测试辅助函数
function createFileSystemMock(options = {}) {
  return createTestMockDependencies({
    fs: () => ({
      readFileSync: vi.fn().mockReturnValue(options.content || ''),
      writeFileSync: vi.fn(),
      existsSync: vi.fn().mockReturnValue(options.exists !== false)
    })
  });
}
```

## 📚 参考资源

- [依赖注入重构方案](./dependency-injection-refactor.md)
- [Vitest官方文档](https://vitest.dev/)
- [测试最佳实践](../../docs/testing-best-practices.md)

---

**🎉 恭喜！您现在已经掌握了依赖注入测试架构的核心技能。这种模式将为您的测试带来前所未有的稳定性和可维护性！**
