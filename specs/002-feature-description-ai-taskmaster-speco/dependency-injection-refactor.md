# 依赖注入重构方案 - 解决Vitest ES模块Mock问题

## 📋 元信息

- **文档版本**: v1.0.0
- **创建日期**: 2025年9月23日
- **最后更新**: 2025年9月23日
- **作者**: AI Assistant
- **状态**: Phase 1完成，Phase 2准备开始
- **优先级**: 高

## 🎯 明确目标

### 核心问题
Vitest测试框架对ES模块mock的支持存在稳定性问题，导致`tests/integration/cli/move-cross-tag.test.js`等CLI集成测试无法稳定运行，具体表现为：
- `moveTasksBetweenTags does not exist` - 函数引用丢失
- `Cannot read properties of undefined (reading 'mockResolvedValue')` - mock对象未正确创建
- `ReferenceError: Cannot access 'mockMoveTask' before initialization` - hoisting问题

### 解决方案目标
通过依赖注入重构彻底解决ES模块mock问题，实现：
1. **100%测试稳定性** - 消除所有mock框架相关的不确定性
2. **清晰的依赖关系** - 代码结构更易理解和维护
3. **灵活的测试能力** - 支持各种测试场景和依赖替换
4. **渐进式实施** - 不破坏现有功能，逐步迁移

### 验收标准
- ✅ `move-cross-tag.test.js` 22个测试用例全部稳定通过
- ✅ 测试执行时间不超过30秒
- ✅ 代码覆盖率不低于85%
- ✅ 新架构支持所有现有CLI功能
- ✅ 向后兼容，不影响现有API

---

## 🏗️ 方案描述

### 核心架构思路

#### 当前架构问题
```javascript
// ❌ 硬编码依赖 - 难以测试
async function moveAction(options) {
  const sourceTag = fromTag || utilsModule.getCurrentTag(); // 直接调用
  await moveTaskModule.moveTasksBetweenTags(...); // 硬编码依赖
  await generateTaskFilesModule.default(...); // 硬编码依赖
}
```

#### 目标架构设计
```javascript
// ✅ 依赖注入 - 完全可控
async function moveAction(options, dependencies = {}) {
  const {
    moveTasksBetweenTags = defaultMoveTasksBetweenTags,
    generateTaskFiles = defaultGenerateTaskFiles,
    getCurrentTag = defaultGetCurrentTag,
  } = dependencies;

  const sourceTag = fromTag || getCurrentTag();
  await moveTasksBetweenTags(...);
  await generateTaskFiles(...);
}
```

### 技术方案

#### 1. 依赖接口定义
```javascript
// 📁 scripts/modules/cli/move-action-dependencies.js
export interface MoveActionDependencies {
  moveTasksBetweenTags: Function;
  generateTaskFiles: Function;
  getCurrentTag: Function;
  readJSON: Function;
  writeJSON: Function;
  log: Function;
}
```

#### 2. 默认依赖提供者
```javascript
export const defaultDependencies = {
  moveTasksBetweenTags: async () =>
    (await import('./task-manager/move-task.js')).moveTasksBetweenTags,

  generateTaskFiles: async () =>
    (await import('./task-manager/generate-task-files.js')).default,

  getCurrentTag: async () =>
    (await import('./utils.js')).getCurrentTag,

  // ... 其他依赖
};
```

#### 3. 重构后的核心函数
```javascript
export async function moveAction(options, dependencies = {}) {
  const deps = { ...defaultDependencies, ...dependencies };

  // 异步解析依赖
  const moveTasksBetweenTags = await deps.moveTasksBetweenTags();
  const generateTaskFiles = await deps.generateTaskFiles();
  const getCurrentTag = await deps.getCurrentTag();

  // 使用注入的依赖执行逻辑
  // ...
}
```

#### 4. 测试中的使用
```javascript
describe("Cross-Tag Move CLI Integration", () => {
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      moveTasksBetweenTags: vi.fn().mockResolvedValue({ message: "ok" }),
      generateTaskFiles: vi.fn().mockResolvedValue(undefined),
      getCurrentTag: vi.fn().mockReturnValue("main"),
    };
  });

  it("should move task successfully", async () => {
    await moveAction(options, mockDeps);
    expect(mockDeps.moveTasksBetweenTags).toHaveBeenCalled();
  });
});
```

### 架构优势

#### 1. 测试稳定性
- **零框架依赖**: 不依赖Vitest的mock机制
- **完全可控**: 开发者100%控制依赖行为
- **并行安全**: 不同测试可使用独立依赖实例

#### 2. 代码质量
- **依赖清晰**: 所有外部依赖一目了然
- **易于重构**: 修改依赖不再需要更改多处代码
- **类型安全**: TypeScript支持下有完整的类型检查

#### 3. 维护性
- **渐进迁移**: 可以逐步迁移，无需大爆炸式重构
- **向后兼容**: 保持现有API不变
- **扩展性**: 轻松添加新的依赖或替换现有实现

---

## 📅 实施计划

### Phase 1: 设计与准备 (1-2天)
**目标**: 完成架构设计和基础代码结构
**负责人**: 开发团队
**风险等级**: 低

### Phase 2: 核心重构 (3-4天)
**目标**: 重构moveAction函数和核心逻辑
**负责人**: 开发团队
**风险等级**: 中等

### Phase 3: 测试重构 (2-3天)
**目标**: 重构所有相关测试文件
**负责人**: QA团队
**风险等级**: 中等

### Phase 4: 集成与验证 (2-3天)
**目标**: 端到端验证和性能测试
**负责人**: 开发团队 + QA团队
**风险等级**: 低

### Phase 5: 部署与监控 (1天)
**目标**: 生产部署和监控
**负责人**: DevOps团队
**风险等级**: 低

**总时间**: 9-13个工作日

---

## 📝 任务拆解

### Phase 1: 设计与准备

#### 1.1 依赖接口设计
- **任务**: 定义MoveActionDependencies接口
- **输入**: 当前moveAction函数分析
- **输出**: `move-action-dependencies.js` 文件
- **验收标准**: 接口完整定义所有外部依赖
- **时间**: 4小时
- **负责人**: 架构师

#### 1.2 默认依赖提供者实现
- **任务**: 实现defaultDependencies对象
- **输入**: 现有模块结构分析
- **输出**: 默认依赖工厂函数
- **验收标准**: 支持异步动态导入
- **时间**: 4小时
- **负责人**: 开发工程师

#### 1.3 原型验证
- **任务**: 创建最小可行原型
- **输入**: 依赖接口设计
- **输出**: 工作原型代码
- **验收标准**: 基本功能正常工作
- **时间**: 4小时
- **负责人**: 开发工程师

### Phase 2: 核心重构

#### 2.1 moveAction函数重构
- **任务**: 重构moveAction函数支持依赖注入
- **输入**: 原moveAction函数
- **输出**: 新moveAction函数
- **验收标准**: 保持原有API兼容性
- **时间**: 8小时
- **负责人**: 开发工程师

#### 2.2 依赖解析逻辑
- **任务**: 实现依赖合并和解析逻辑
- **输入**: 依赖接口定义
- **输出**: 依赖解析工具函数
- **验收标准**: 支持默认依赖和注入依赖的合并
- **时间**: 4小时
- **负责人**: 开发工程师

#### 2.3 异步依赖处理
- **任务**: 处理异步依赖的初始化和缓存
- **输入**: 动态导入需求
- **输出**: 依赖缓存机制
- **验收标准**: 避免重复导入，提升性能
- **时间**: 4小时
- **负责人**: 开发工程师

### Phase 3: 测试重构

#### 3.1 测试环境重构
- **任务**: 重构move-cross-tag.test.js的基础结构
- **输入**: 原测试文件
- **输出**: 新测试文件结构
- **验收标准**: 移除所有vi.mock调用
- **时间**: 6小时
- **负责人**: QA工程师

#### 3.2 Mock依赖创建
- **任务**: 创建测试专用的mock依赖对象
- **输入**: 依赖接口定义
- **输出**: 测试辅助函数
- **验收标准**: 支持所有测试场景
- **时间**: 4小时
- **负责人**: QA工程师

#### 3.3 测试用例重构
- **任务**: 重构22个测试用例
- **输入**: 原测试用例
- **输出**: 新测试用例
- **验收标准**: 所有测试用例通过
- **时间**: 8小时
- **负责人**: QA工程师

### Phase 4: 集成与验证

#### 4.1 功能验证
- **任务**: 端到端功能测试
- **输入**: 重构后的代码
- **输出**: 功能验证报告
- **验收标准**: 所有原有功能正常工作
- **时间**: 4小时
- **负责人**: QA工程师

#### 4.2 性能测试
- **任务**: 性能基准测试
- **输入**: 重构前后对比
- **输出**: 性能测试报告
- **验收标准**: 性能无明显下降
- **时间**: 2小时
- **负责人**: QA工程师

#### 4.3 集成测试
- **任务**: 与其他模块的集成测试
- **输入**: 重构后的moveAction
- **输出**: 集成测试报告
- **验收标准**: 不影响其他模块
- **时间**: 4小时
- **负责人**: 开发工程师

### Phase 5: 部署与监控

#### 5.1 生产部署
- **任务**: 部署到生产环境
- **输入**: 通过验证的代码
- **输出**: 部署成功确认
- **验收标准**: 无生产问题
- **时间**: 2小时
- **负责人**: DevOps工程师

#### 5.2 监控设置
- **任务**: 设置性能和错误监控
- **输入**: 部署后的系统
- **输出**: 监控仪表板
- **验收标准**: 关键指标正常
- **时间**: 2小时
- **负责人**: DevOps工程师

#### 5.3 回滚计划
- **任务**: 准备回滚方案
- **输入**: 部署过程
- **输出**: 回滚文档
- **验收标准**: 5分钟内可完成回滚
- **时间**: 2小时
- **负责人**: DevOps工程师

---

## 🎯 风险评估与应对

### 技术风险

#### R1: 异步依赖处理复杂性
- **概率**: 中等
- **影响**: 高
- **应对**: Phase 1进行原型验证，确保异步处理可行

#### R2: 向后兼容性破坏
- **概率**: 低
- **影响**: 高
- **应对**: 保持原有函数签名，新增可选参数

#### R3: 性能下降
- **概率**: 低
- **影响**: 中等
- **应对**: 实现依赖缓存，避免重复初始化

### 业务风险

#### R4: 功能回归
- **概率**: 中等
- **影响**: 高
- **应对**: 完善测试覆盖，确保所有场景都被测试

#### R5: 实施时间超期
- **概率**: 中等
- **影响**: 中等
- **应对**: 分阶段实施，每阶段都有明确的验收标准

---

## 📊 成功指标

### 量化指标
- **测试通过率**: ≥95% (当前 ~90%)
- **测试执行时间**: ≤30秒 (当前 ~45秒)
- **代码覆盖率**: ≥85% (当前 ~80%)
- **构建时间**: 无明显变化
- **错误率**: 0生产错误

### 质量指标
- **代码复杂度**: 降低 (依赖关系更清晰)
- **可维护性**: 提升 (模块化更好)
- **可测试性**: 大幅提升 (从"困难"到"容易")
- **技术债务**: 减少 (解决mock问题)

---

## 📋 依赖关系

### 前置条件
- Node.js >= 18.0.0 (支持ESM)
- Vitest >= 1.0.0
- TypeScript >= 5.0.0 (可选，用于类型检查)

### 相关文档
- `specs/002-feature-description-ai-taskmaster-speco/spec.md` - 功能规格
- `specs/002-feature-description-ai-taskmaster-speco/tasks.md` - 任务列表
- `tests/README.md` - 测试框架说明

### 相关代码
- `scripts/modules/cli/move-action.js` - 待重构的核心函数
- `tests/integration/cli/move-cross-tag.test.js` - 待重构的测试文件
- `scripts/modules/task-manager/move-task.js` - 依赖模块

---

## 🔄 后续计划

### 扩展应用
成功后，可以将依赖注入模式扩展到其他CLI命令：
1. `add-task` 命令
2. `remove-task` 命令
3. `list-tasks` 命令
4. `validate-dependencies` 命令

### 持续改进
1. **类型安全**: 添加完整的TypeScript类型定义
2. **性能优化**: 实现更智能的依赖缓存
3. **监控告警**: 添加依赖解析失败的监控
4. **文档完善**: 创建依赖注入使用指南

---

## 📞 联系方式

- **项目负责人**: [项目负责人名称]
- **技术负责人**: [技术负责人名称]
- **QA负责人**: [QA负责人名称]

---

## ✅ 决策记录

- **2025-09-23**: 确定采用依赖注入重构方案
- **决策依据**: 彻底解决Vitest mock问题，架构更清晰
- **备选方案**: E2E测试替代 (被否决，复杂度过高)
- **风险评估**: 中等风险，可控实施

---

## ✅ Phase 1 执行总结

### 已完成工作
- ✅ **1.1 依赖接口设计**: 完成MoveActionDependencies接口定义
- ✅ **1.2 默认依赖提供者**: 实现defaultDependencies异步依赖解析
- ✅ **1.3 原型验证**: 创建并验证最小可行原型，所有测试通过
- ✅ **1.4 代码结构准备**: 建立完整的CLI模块目录结构
- ✅ **1.5 计划精化**: 根据原型结果确认Phase 2可立即开始

### 关键成果
1. **依赖注入架构验证**: 原型测试100%通过，证明方案可行
2. **代码结构就绪**: 创建了`scripts/modules/cli/`目录和基础文件
3. **接口定义完整**: 定义了所有外部依赖的类型和契约
4. **测试基础设施**: 建立了mock依赖创建和验证机制

### 技术验证结果
```
✅ 默认依赖解析: 通过 (异步import正常工作)
✅ Mock依赖注入: 通过 (函数调用正确)
✅ 错误处理机制: 通过 (异常正确抛出)
✅ 类型安全检查: 通过 (validateDependencies正常工作)
```

---

## 🚀 Phase 2 准备状态

### 下一步行动
Phase 2 **核心重构** 可以立即开始：
- **2.1 moveAction函数重构** - 将现有逻辑迁移到依赖注入架构
- **2.2 依赖解析逻辑** - 实现高效的依赖合并和缓存
- **2.3 异步依赖处理** - 优化异步依赖的初始化性能

### 风险评估
- **技术风险**: 低 (原型已验证架构可行)
- **时间风险**: 中等 (需要仔细迁移现有逻辑)
- **质量风险**: 低 (有完整的验证机制)

### 建议
**立即开始Phase 2.1**，预计4-6小时内完成moveAction函数的重构。

---

*本文档遵循 Speco Tasker 项目文档规范，使用中文编写以确保团队成员的理解一致性。*
