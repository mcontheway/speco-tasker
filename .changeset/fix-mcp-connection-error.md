---
"speco-tasker": patch
---

**修复 MCP add_dependency 工具连接关闭错误**

**问题描述：**
在使用 MCP speco-tasker 的 add_dependency 工具时，遇到循环依赖等错误情况会导致 "Connection closed" 错误。

**根本原因：**
在 `scripts/modules/dependency-manager.js` 的 `addDependency` 函数中，当遇到错误时调用 `process.exit(1)`，这在 CLI 环境中正常，但在 MCP 服务器环境中会导致整个服务器进程退出。

**修复方案：**
将 `process.exit(1)` 调用替换为抛出 `DependencyError` 异常，让 MCP direct function 正确捕获并返回错误响应给客户端。

**变更内容：**
- 修改 `addDependency` 函数，将所有 `process.exit(1)` 调用替换为抛出异常
- 添加新的错误类型：`INVALID_TASKS_FILE`、`DEPENDENCY_NOT_FOUND`、`PARENT_TASK_NOT_FOUND`、`NO_SUBTASKS`、`SUBTASK_NOT_FOUND`、`TASK_NOT_FOUND`、`SELF_DEPENDENCY`、`CIRCULAR_DEPENDENCY`
- MCP direct function 现在能正确处理异常并返回结构化错误响应

**测试验证：**
- CLI 命令继续正常工作
- MCP 工具现在正确返回错误响应而不导致连接关闭
- 错误消息保持一致性和用户友好性
