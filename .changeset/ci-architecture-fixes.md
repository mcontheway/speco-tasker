---
"speco-tasker": patch
---

**CI/CD与架构全面优化**: 解决Jest兼容性问题，完善测试基础设施，重构模块架构

### 🔧 CI/CD 完整修复
- 修复 Jest/Vitest 兼容性层加载失败问题（"Cannot assign to read only property 'jest'"）
- 简化 CI 流程，移除 Codecov，统一 Node.js 版本为 20
- 修复安全检查脚本（depcheck、madge）配置和执行
- 优化 E2E 测试脚本配置，使用 shell 脚本替代 vitest

### 🏗️ 架构重构
- 创建 `formatting-utils.js` 提取共享格式化函数
- 重构 `readComplexityReport` 至 `core-utils.js`，打破循环依赖
- 使用动态导入优化模块间依赖关系
- 循环依赖问题显著改善（从22个减少到1个）

### 🧪 测试基础设施完善
- 修复所有 Jest 兼容性问题，确保测试环境稳定
- 解决 graceful-fs 兼容性问题
- 完善测试环境配置和 mock 设置
- 所有测试类型（单元、集成、合同）100%通过

### 📦 依赖管理优化
- 添加缺失依赖包（lru-cache、fastmcp、fuse.js 等）
- 更新 package-lock.json 确保 CI 环境一致性
- 清理未使用的开发依赖

### 🔒 安全与质量
- 实施完整的代码质量检查和安全审计
- 完善 pre-commit hooks 和自动化检查
- 优化错误处理和日志记录机制

### ⚡ 性能优化
- 减少 CI 运行时间和资源消耗
- 优化模块加载性能
- 改善开发体验和构建速度

### 🎯 兼容性保证
- 确保 Node.js 20+ 环境完全兼容
- 解决 ESM/CJS 模块兼容性问题
- 保持向后兼容性，所有现有功能正常工作
