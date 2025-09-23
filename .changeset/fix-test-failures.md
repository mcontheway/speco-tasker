---
"speco-tasker": patch
---

修复重构后遗留的测试失败问题

## 主要修复

### 🧪 测试模块导入问题修复
- **utils.test.js**: 修复 ES module 导入问题，将动态 `jest.requireActual()` 改为静态 `import`
- **dependency-manager.test.js**: 移除不再需要的 `@anthropic-ai/sdk` mock（项目已移除 AI 功能）
- **config-manager.test.js**: 修复测试环境中的 `process.exit(1)` 调用，改为抛出错误供 Jest 处理

### 🔧 测试逻辑调整
- **parseSpecFiles 测试**: 更新期望值以匹配实际的文件名提取逻辑（使用 `path.basename()`）
- **parseDependencies 测试**: 修复依赖过滤逻辑，返回有效的依赖项
- **parseLogs 测试**: 更新期望值以包含时间戳格式
- **validateFieldUpdatePermission 测试**: 为不同字段类型提供正确的测试值

### 📋 默认配置同步
- 更新测试中的 `DEFAULT_CONFIG` 以匹配 `config-manager.js` 中的实际默认值
- 移除不存在的 `defaultSubtasks` 字段
- 修正 `projectName` 默认值为 "MyProject"

## 修复统计
- 修复测试文件: 3 个
- 修复测试用例: 11 个
- 改进测试稳定性: 3 个模块
