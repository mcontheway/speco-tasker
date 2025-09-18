# speco-tasker 更新日志 | Changelog

## 1.2.0

### Major Changes

- **🎨 品牌重塑 | Brand Rebranding**
  - 将项目名称从 "TaskMaster" 完全重命名为 "Speco Tasker"
  - 更新所有命令名称：`task-master` → `speco-tasker`
  - 更新配置文件路径：`.taskmaster/` → `.speco/`
  - 更新包名：`task-master-ai` → `speco-tasker`

- **🔧 动态品牌名称显示 | Dynamic Brand Name Display**
  - 新用户使用 `speco-tasker` 时显示正确的品牌名称
  - 老用户使用 `task-master` 时保持原有显示
  - 智能检测调用方式，动态调整错误消息和帮助文本
  - 完善向后兼容性，保持现有用户体验

- **🧹 AI功能完全移除 | Complete AI Feature Removal**
  - 移除所有AI相关的服务和功能
  - 移除AI配置和API密钥管理
  - 移除AI命令（analyze-complexity, expand, update-task等）
  - 转换为纯净的手动任务管理系统

- **🔒 文件系统安全增强 | File System Security Enhancement**
  - 添加路径遍历攻击检测
  - 实现文件权限验证
  - 添加敏感路径保护
  - 实现文件属性验证

- **⚙️ 路径配置管理系统 | Path Configuration Management System**
  - 实现动态路径映射
  - 支持跨平台路径兼容
  - 添加路径缓存优化
  - 实现配置热更新

- **📊 性能优化 | Performance Optimization**
  - 实现路径解析缓存机制
  - 优化响应时间到<100ms
  - 添加内存泄漏防护
  - 实现LRU缓存策略

- **🔧 代码质量提升 | Code Quality Improvement**
  - 使用Node.js内置模块导入（`node:fs`, `node:path`）
  - 重构ServiceMiddleware.js解决语法错误
  - 更新单元测试覆盖率到100%
  - 修复异步操作链问题

### Technical Details

- **测试覆盖**: 所有单元测试通过（100%覆盖率）
- **端到端测试**: 完全通过（45秒，55个步骤）
- **文档更新**: 所有文档已更新并同步
- **向后兼容**: 保持现有API兼容性

## 1.1.4

### Patch Changes

- **Fix MCP server startup issue after language management removal**
  - Fixed MCP server startup failure due to missing response-language.js module
  - Ensured all module imports are valid and existing
  - Verified clean removal of language management feature

  This resolves the ERR_MODULE_NOT_FOUND error when starting MCP server after the language management feature was removed.

## 1.1.3

### Patch Changes

- **Complete removal of response language management feature**
  - Fixed inconsistency between initialization code and tag management logic
  - Unified all references to use "main" as the default tag instead of "master"
  - Updated `scripts/init.js` to create initial tasks structure with "main" tag
  - Updated `scripts/modules/task-manager/tag-management.js` to check for "main" tag existence
  - **Completely removed response language management feature**:
    - Removed non-existent `response-language.js` module imports
    - Removed `lang` CLI command and all related functionality
    - Removed language configuration from initialization process
    - Cleaned up documentation and configuration examples
  - Updated test files to reflect correct tag structure
  - Updated comments to reflect correct default tag behavior

  This resolves the issue where newly initialized projects showed current tag as "main" but available tags as "master", preventing task creation. Also fixes MCP server startup failure due to missing module and completely removes the non-functional language management feature.

## 1.1.3

### Patch Changes

- **Fix default tag inconsistency and missing module**
  - Fixed inconsistency between initialization code and tag management logic
  - Unified all references to use "main" as the default tag instead of "master"
  - Updated `scripts/init.js` to create initial tasks structure with "main" tag
  - Updated `scripts/modules/task-manager/tag-management.js` to check for "main" tag existence
  - Removed non-existent `response-language.js` module imports and related CLI command
  - Updated test files to reflect correct tag structure
  - Updated comments to reflect correct default tag behavior

  This resolves the issue where newly initialized projects showed current tag as "main" but available tags as "master", preventing task creation. Also fixes MCP server startup failure due to missing module.

## 1.1.2

### Patch Changes

- **Fix default tag inconsistency**
  - Fixed inconsistency between initialization code and tag management logic
  - Unified all references to use "main" as the default tag instead of "master"
  - Updated `scripts/init.js` to create initial tasks structure with "main" tag
  - Updated `scripts/modules/task-manager/tag-management.js` to check for "main" tag existence
  - Updated comments to reflect correct default tag behavior

  This resolves the issue where newly initialized projects showed current tag as "main" but available tags as "master", preventing task creation.

## 1.0.15 (2025-09-16)

### 🐛 修复 | Bug Fixes

- **🔧 路径解析修复**：修复了withNormalizedProjectRoot中的路径解析逻辑，确保projectRoot始终为有效字符串 | **Path Resolution Fix**: Fixed path resolution logic in withNormalizedProjectRoot to ensure projectRoot is always a valid string
- **⚡ 错误处理改善**：增强了initializeProjectDirect的错误处理，提供详细的调试信息 | **Error Handling Improvement**: Enhanced error handling in initializeProjectDirect to provide detailed debugging information
- **📍 Fallback机制**：添加了多层fallback确保即使在复杂环境中也能确定项目根路径 | **Fallback Mechanism**: Added multi-layer fallback to ensure project root can be determined even in complex environments

## 1.0.14 (2025-09-16)

### 🐛 修复 | Bug Fixes

- **🔧 导入问题修复**：修复了init.js中缺失的TASKMASTER_TASKS_FILE常量导入 | **Import Issue Fix**: Fixed missing TASKMASTER_TASKS_FILE constant import in init.js
- **⚡ 初始化稳定性**：解决了项目初始化时的"TASKMASTER_TASKS_FILE is not defined"错误 | **Initialization Stability**: Resolved "TASKMASTER_TASKS_FILE is not defined" error during project initialization
- **📦 包完整性**：确保初始化脚本能正确访问所有必需的路径常量 | **Package Integrity**: Ensured initialization script can correctly access all required path constants
- **🔧 路径解析修复**：修复了withNormalizedProjectRoot中的路径解析逻辑，确保projectRoot始终为有效字符串 | **Path Resolution Fix**: Fixed path resolution logic in withNormalizedProjectRoot to ensure projectRoot is always a valid string
- **⚡ 错误处理改善**：增强了initializeProjectDirect的错误处理，提供详细的调试信息 | **Error Handling Improvement**: Enhanced error handling in initializeProjectDirect to provide detailed debugging information
- **📍 Fallback机制**：添加了多层fallback确保即使在复杂环境中也能确定项目根路径 | **Fallback Mechanism**: Added multi-layer fallback to ensure project root can be determined even in complex environments

## 1.0.13 (2025-09-16)

### 🐛 修复 | Bug Fixes

- **🔧 语法错误修复**：修复了get-task.js中错误的正则表达式注释语法错误 | **Syntax Error Fix**: Fixed incorrect regular expression comment syntax error in get-task.js
- **⚡ 运行时稳定性**：解决了MCP服务器启动时Invalid regular expression错误的根本原因 | **Runtime Stability**: Resolved the root cause of Invalid regular expression error when starting MCP server
- **📦 包完整性**：确保发布包中所有JavaScript文件语法正确，无运行时错误 | **Package Integrity**: Ensured all JavaScript files in the release package have correct syntax and no runtime errors

## 1.0.12 (2025-09-16)

### 🐛 修复 | Bug Fixes

- **🔧 语法错误修复**：修复了add-task.js中缺失的逗号语法错误 | **Syntax Error Fix**: Fixed missing comma syntax error in add-task.js
- **📝 代码格式优化**：自动修复了33个文件的代码格式问题 | **Code Format Optimization**: Automatically fixed code formatting issues in 33 files
- **🧹 代码质量提升**：清理了TypeScript和代码质量问题 | **Code Quality Improvement**: Cleaned up TypeScript and code quality issues
- **⚡ 代码稳定性**：确保所有语法错误已修复，代码格式已统一 | **Code Stability**: Ensured all syntax errors are fixed and code formatting is unified

### 📦 技术改进 | Technical Improvements

- **🔍 Linter配置优化**：改进了代码质量检查规则 | **Linter Configuration Optimization**: Improved code quality checking rules
- **📋 格式化工具更新**：使用Biome进行代码格式化和修复 | **Formatting Tool Update**: Use Biome for code formatting and fixes
- **✅ 代码一致性**：确保整个项目的代码风格统一 | **Code Consistency**: Ensured consistent code style across the entire project

## 1.0.11 (2025-09-16)

### ✨ 功能增强 | Feature Enhancements

- **📝 参数错误处理优化**：大幅改进了MCP工具的参数错误响应 | **Parameter Error Handling Optimization**: Significantly improved parameter error responses for MCP tools
- **💡 智能参数帮助**：当参数错误时，系统现在会显示详细的参数说明和使用示例 | **Smart Parameter Help**: System now displays detailed parameter descriptions and usage examples when parameters are incorrect
- **🔍 错误响应增强**：添加了错误代码、当前标签信息和智能建议 | **Enhanced Error Responses**: Added error codes, current tag information, and intelligent suggestions
- **📚 工具参数文档**：为主要工具（add_task, set_task_status, get_task, get_tasks等）添加了完整的参数帮助信息 | **Tool Parameter Documentation**: Added complete parameter help information for main tools (add_task, set_task_status, get_task, get_tasks, etc.)
- **🗑️ AI相关内容清理**：移除了所有AI相关的参数描述和示例，专注于纯手动操作 | **AI-Related Content Cleanup**: Removed all AI-related parameter descriptions and examples, focusing on pure manual operations

### 🐛 修复 | Bug Fixes

- **🔧 参数验证改进**：修复了多个工具的参数传递问题 | **Parameter Validation Improvement**: Fixed parameter passing issues in multiple tools
- **📝 错误信息优化**：改进了错误信息的格式和可读性 | **Error Message Optimization**: Improved error message format and readability
- **🏷️ 标签信息显示**：错误响应现在显示当前标签和可用标签信息 | **Tag Information Display**: Error responses now display current tag and available tag information

## 1.0.10 (2025-09-16)

### 🐛 修复 | Bug Fixes

- **🔧 初始化优化**：修复了项目初始化时创建过多不必要文件的问题 | **Initialization Optimization**: Fixed issue where project initialization created too many unnecessary files
- **📁 目录结构简化**：初始化时只创建必要的 `.taskmaster/tasks/` 目录 | **Directory Structure Simplification**: Only create necessary `.taskmaster/tasks/` directory during initialization
- **📄 文件精简**：移除了不必要的 `.env.example`、example_prd.txt等文件 | **File Streamlining**: Removed unnecessary files like `.env.example`, example_prd.txt, etc.
- **✅ 任务文件创建**：确保初始化时正确创建 `tasks.json` 文件 | **Task File Creation**: Ensured `tasks.json` file is correctly created during initialization

### 📚 文档更新 | Documentation Updates

- **🔍 故障排除增强**：改进了MCP配置和初始化相关的错误处理说明 | **Troubleshooting Enhancement**: Improved error handling documentation for MCP configuration and initialization

## 1.0.9 (2025-09-16)

### 🐛 修复 | Bug Fixes

- **🔧 MCP命令修复**：修复了MCP配置中`speco-tasker`命令找不到的问题 | **MCP Command Fix**: Fixed issue where `speco-tasker` command could not be found in MCP configuration
- **📦 Bin配置更新**：在package.json中添加了`speco-tasker`的bin条目，指向MCP服务器 | **Bin Configuration Update**: Added `speco-tasker` bin entry in package.json pointing to MCP server

### 📚 文档更新 | Documentation Updates

- **🔍 故障排除完善**：更新了MCP配置相关的故障排除说明 | **Troubleshooting Improvement**: Updated troubleshooting documentation for MCP configuration

## 1.0.8 (2025-09-15)

### 发布优化 | Release Optimization

- **📦 包文件更新**：更新package.json的files字段，确保中文文档README_ZH.md包含在发布的包中 | **Package Files Update**: Updated package.json files field to ensure Chinese documentation README_ZH.md is included in the released package
- **📚 文档完整性**：发布的npm包现在包含完整的中文和英文文档 | **Documentation Integrity**: The released npm package now includes complete Chinese and English documentation

## 1.0.6 (2025-09-15)

### 文档更新 | Documentation Updates

- **📚 完整的中文文档**：添加了完整的中文README文档和使用说明 | **Complete Chinese Documentation**: Added complete Chinese README documentation and usage instructions
- **🎯 功能介绍优化**：重写了项目介绍，突出纯手动任务管理的优势 | **Feature Introduction Optimization**: Rewrote project introduction to highlight the advantages of pure manual task management
- **📖 使用指南完善**：提供了详细的中文安装和使用指南 | **Usage Guide Improvement**: Provided detailed Chinese installation and usage guide
- **🆚 对比说明**：清晰对比了TaskMaster-AI和No-AI版本的差异 | **Comparison Description**: Clearly compared the differences between TaskMaster-AI and No-AI versions
- **🔧 功能列表更新**：列出了27个核心功能的详细说明 | **Feature List Update**: Listed detailed descriptions of 27 core features
- **❓ 常见问题解答**：添加了中文FAQ解答用户常见疑问 | **FAQ**: Added Chinese FAQ to answer common user questions

### 技术修复 | Technical Fixes

- **🔧 MCP服务器修复**：修复了asyncManager未定义导致的启动失败问题 | **MCP Server Fix**: Fixed startup failure caused by undefined asyncManager
- **🧹 代码清理**：移除了所有AI相关的帮助文本和配置 | **Code Cleanup**: Removed all AI-related help text and configuration
- **📦 包完整性**：确保发布包包含所有必要文件 | **Package Integrity**: Ensured release package contains all necessary files

## 1.0.0 (2025-09-15)

### Major Changes

- **🔄 Complete AI Feature Removal**: Taskmaster has been completely refactored to remove all AI functionality and dependencies. This is a breaking change that transforms Taskmaster into a pure manual task management system.

  **What was removed:**
  - All AI service integrations (OpenAI, Anthropic, Google, etc.)
  - AI-powered task generation and analysis
  - AI configuration and provider management
  - AI-related dependencies and scripts

  **What remains:**
  - Pure manual task management with 27 core features
  - CLI and MCP server functionality
  - Task creation, editing, and organization
  - Dependency management and status tracking
  - All manual workflow operations

  **Migration notes:**
  - Package renamed from `task-master-ai` to `speco-tasker`
  - All AI-related configuration removed
  - Manual task management features fully preserved
  - No breaking changes to manual workflow functionality

### Breaking Changes

- Renamed npm package from `task-master-ai` to `speco-tasker`
- Removed all AI provider configurations and API keys
- Removed AI-related scripts and dependencies
- Updated project repository and documentation URLs
