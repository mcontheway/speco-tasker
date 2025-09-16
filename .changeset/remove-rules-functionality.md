---
"taskmaster-no-ai": major
---

feat: 完全移除rules功能及相关配置

**BREAKING CHANGES**
- 完全移除rules功能，不再提供向后兼容性
- 删除所有rules相关命令（`task-master rules`）
- 删除所有rules相关MCP工具
- 删除所有rules相关文件和配置
- 移除rules相关的初始化选项

**新增功能**
- 实现动态projectName配置（Git仓库名 > 根目录名 > MyProject兜底）
- 移除defaultSubtasks配置
- 移除初始化时创建.gitignore文件

**修复**
- 修复项目初始化时的路径错误
- 清理所有导入错误和无效引用
- 清理所有相关测试文件
- 更新文档和配置说明

**影响范围**
- CLI: 移除了`rules`命令
- MCP: 移除了`rules`工具
- 初始化: 移除了rules相关选项
- 配置: 移除了rules相关配置
