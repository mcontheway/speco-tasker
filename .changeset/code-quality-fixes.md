---
"speco-tasker": patch
---

fix: 解决所有代码质量问题、Jest兼容性问题和遗留测试问题

- 将所有 forEach 循环转换为 for...of 循环以符合 Biome 规则
- 修复 Node.js 模块导入协议 (使用 node: 前缀)
- 修复字符串拼接为模板字面量
- 修复函数参数重新赋值问题
- 修复测试文件中的导入和模块路径问题
- 修复 __filename 重复声明问题
- 修复 switch 语句结构和函数结束括号问题
- 修复 unreachable code 和其他 linting 错误
- 解决循环依赖问题，重构模块结构
- 修复测试断言失败和逻辑问题
- **修复Jest与Node.js 23.11.0兼容性问题：降级Jest从30.1.3到29.7.0**
- **移除重复的Jest配置文件，清理项目结构**
- **添加Node.js兼容性标志：--experimental-specifier-resolution=node --experimental-modules --no-deprecation --no-warnings**
- **修复Jest退出错误：TypeError: (0 , _exitX(...).default) is not a function**
- **更新Jest命令行选项：--testPathPattern改为--testPathPatterns以符合API变更**

所有 linting 错误已解决，Jest兼容性问题已修复，代码质量显著提升
