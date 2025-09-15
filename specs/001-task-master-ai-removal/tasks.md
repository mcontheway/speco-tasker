# 任务：Task Master AI功能移除重构

**输入** : 从 `/specs/001-task-master-ai-removal/` 设计文档
**前提条件** : plan.md（必需），research.md，data-model.md，contracts/task-management-api.yaml，quickstart.md

## 执行流程（主流程）

```
1. 从功能目录加载 plan.md
   → 提取：Node.js/JavaScript技术栈、Commander.js框架、单一CLI工具结构
2. 加载设计文档：
   → data-model.md：提取Task/Subtask/Tag实体 → 27个保留功能验证任务
   → contracts/task-management-api.yaml：7个CLI端点 → 合同测试任务
   → research.md：提取AI移除策略 → 代码分析和清理任务
   → quickstart.md：提取用户工作流程 → 集成测试任务
3. 按类别生成任务：
   → 设置：项目初始化、依赖清理、配置更新
   → 测试：7个合同测试、集成测试场景
   → 核心：11个AI功能模块移除、27个保留功能验证
   → 集成：依赖清理、配置更新、兼容性保证
   → 完善：性能测试、文档更新、回归验证
4. 应用任务规则：
   → 不同文件 = 标记 [P] 表示并行执行
   → 相同文件 = 顺序执行（无 [P]）
   → 测试优先于实现（TDD）
5. 按顺序编号任务（T001、T002...）
6. 生成依赖关系图
7. 创建并行执行示例
8. 验证任务完整性：
   → 所有7个API端点都有测试吗？
   → 所有27个保留功能都验证了吗？
   → AI功能完全移除了吗？
9. 返回：成功（任务准备就绪可执行）
```

## 格式: `[ID] [P?] 描述`

*   **[P]**: 可以并行运行（不同文件，无依赖）
*   在描述中包含确切的文件路径

## 路径规范

*   **CLI工具**: `src/`, `scripts/`, `mcp-server/` 位于仓库根目录
*   **测试**: `tests/` 目录下按类型组织
*   **配置**: `package.json`, `.taskmaster/config.json`, 环境变量文件

## 阶段3.1：设置

- [x] T001 初始化项目备份和分支管理
- [x] T002 安装依赖清理工具和代码分析工具
- [x] T003 [P] 配置代码质量检查工具（ESLint, Prettier）

## 阶段 3.2：先写测试（TDD） ⚠️ 必须在 3.3 之前完成

**关键：这些测试必须先编写并通过，然后才能进行任何实现**

### 合同测试（基于task-management-api.yaml的7个端点）
- [ ] T004 [P] 在 tests/contract/test_list_endpoint.js 中编写合同测试 GET /list
- [ ] T005 [P] 在 tests/contract/test_show_endpoint.js 中编写合同测试 GET /show/{id}
- [ ] T006 [P] 在 tests/contract/test_set_status_endpoint.js 中编写合同测试 POST /set-status
- [ ] T007 [P] 在 tests/contract/test_move_endpoint.js 中编写合同测试 POST /move
- [ ] T008 [P] 在 tests/contract/test_remove_task_endpoint.js 中编写合同测试 DELETE /remove-task
- [ ] T009 [P] 在 tests/contract/test_add_subtask_endpoint.js 中编写合同测试 POST /add-subtask
- [ ] T010 [P] 在 tests/contract/test_add_dependency_endpoint.js 中编写合同测试 POST /add-dependency

### 集成测试（基于quickstart.md的用户工作流程）
- [ ] T011 [P] 在 tests/integration/test_manual_task_creation.js 中编写集成测试手动任务创建流程
- [ ] T012 [P] 在 tests/integration/test_task_management_workflow.js 中编写集成测试完整任务管理流程
- [ ] T013 [P] 在 tests/integration/test_dependency_management.js 中编写集成测试依赖关系管理
- [ ] T014 [P] 在 tests/integration/test_tag_system.js 中编写集成测试标签系统功能

## 阶段 3.3：核心实现（仅测试失败后）

### AI功能移除（11个模块）
- [ ] T015 [P] 移除 scripts/modules/ai-services-unified.js 中的AI服务统一接口
- [ ] T016 [P] 移除 src/ai-providers/ 目录下的所有AI提供商模块（21个文件）
- [ ] T017 [P] 移除 mcp-server/src/core/ 中的AI相关直接函数
- [ ] T018 [P] 移除 mcp-server/src/tools/ 中的AI工具实现
- [ ] T019 [P] 移除 src/prompts/ 目录下的AI提示模板（11个文件）
- [ ] T020 [P] 移除 scripts/modules/prompt-manager.js 中的提示管理器
- [ ] T021 [P] 移除 scripts/modules/task-manager/ 中的AI增强功能
- [ ] T022 [P] 移除 src/constants/ 中的AI相关常量定义
- [ ] T023 [P] 移除 src/profiles/ 中的AI助手配置（16个文件）
- [ ] T024 [P] 移除 src/ui/ 中的AI状态显示组件
- [ ] T025 [P] 移除 package.json 中的AI相关依赖包

### 保留功能验证（27个核心功能）
- [ ] T026 [P] 在 tests/unit/test_task_creation.js 中验证任务创建功能
- [ ] T027 [P] 在 tests/unit/test_task_listing.js 中验证任务列表功能
- [ ] T028 [P] 在 tests/unit/test_task_update.js 中验证任务更新功能
- [ ] T029 [P] 在 tests/unit/test_task_deletion.js 中验证任务删除功能
- [ ] T030 [P] 在 tests/unit/test_subtask_management.js 中验证子任务管理功能
- [ ] T031 [P] 在 tests/unit/test_dependency_management.js 中验证依赖关系管理
- [ ] T032 [P] 在 tests/unit/test_status_management.js 中验证状态管理功能
- [ ] T033 [P] 在 tests/unit/test_tag_system.js 中验证标签系统功能
- [ ] T034 [P] 在 tests/unit/test_task_movement.js 中验证任务移动功能
- [ ] T035 [P] 在 tests/unit/test_task_validation.js 中验证任务验证功能
- [ ] T036 [P] 在 tests/unit/test_config_management.js 中验证配置管理功能
- [ ] T037 [P] 在 tests/unit/test_file_operations.js 中验证文件操作功能
- [ ] T038 [P] 在 tests/unit/test_error_handling.js 中验证错误处理功能
- [ ] T039 [P] 在 tests/unit/test_cli_commands.js 中验证CLI命令功能
- [ ] T040 [P] 在 tests/unit/test_mcp_integration.js 中验证MCP集成功能
- [ ] T041 [P] 在 tests/unit/test_task_templates.js 中验证任务模板功能
- [ ] T042 [P] 在 tests/unit/test_project_init.js 中验证项目初始化功能
- [ ] T043 [P] 在 tests/unit/test_task_search.js 中验证任务搜索功能
- [ ] T044 [P] 在 tests/unit/test_task_filtering.js 中验证任务过滤功能
- [ ] T045 [P] 在 tests/unit/test_task_sorting.js 中验证任务排序功能
- [ ] T046 [P] 在 tests/unit/test_task_dependencies.js 中验证任务依赖功能
- [ ] T047 [P] 在 tests/unit/test_task_priorities.js 中验证任务优先级功能
- [ ] T048 [P] 在 tests/unit/test_task_details.js 中验证任务详情功能
- [ ] T049 [P] 在 tests/unit/test_task_history.js 中验证任务历史功能
- [ ] T050 [P] 在 tests/unit/test_task_export.js 中验证任务导出功能
- [ ] T051 [P] 在 tests/unit/test_task_import.js 中验证任务导入功能
- [ ] T052 [P] 在 tests/unit/test_backup_restore.js 中验证备份恢复功能

## 阶段 3.4：集成

### 配置和依赖清理
- [ ] T053 移除 .taskmaster/config.json 中的AI配置项
- [ ] T054 移除 .env 和 mcp.json 中的AI相关环境变量
- [ ] T055 更新 package.json 中的脚本命令（移除AI相关命令）
- [ ] T056 清理 scripts/modules/ 中的AI相关模块导入
- [ ] T057 更新 mcp-server/server.js 中的服务器配置

### 兼容性保证
- [ ] T058 验证所有27个保留功能的向后兼容性
- [ ] T059 测试数据迁移和格式兼容性
- [ ] T060 验证CLI命令行接口的一致性
- [ ] T061 测试MCP服务器功能的完整性

## 阶段 3.5：完善

### 性能和质量保证
- [ ] T062 [P] 在 tests/performance/test_startup_time.js 中编写启动时间性能测试
- [ ] T063 [P] 在 tests/performance/test_memory_usage.js 中编写内存使用性能测试
- [ ] T064 [P] 在 tests/performance/test_response_time.js 中编写响应时间性能测试
- [ ] T065 运行完整的回归测试套件
- [ ] T066 生成代码覆盖率报告并验证阈值

### 文档更新
- [ ] T067 [P] 更新 README.md 移除AI功能相关内容
- [ ] T068 [P] 更新 docs/ 目录下的文档文件
- [ ] T069 [P] 更新 assets/ 目录下的文档和示例
- [ ] T070 [P] 更新 specs/ 目录下的规格文档
- [ ] T071 [P] 创建迁移指南文档

### 最终验证
- [ ] T072 运行所有测试确保通过率100%
- [ ] T073 执行quickstart.md中的所有场景验证
- [ ] T074 进行手动测试验证用户体验
- [ ] T075 创建发布版本标签

## 依赖项

*   **测试前置**: T004-T014 必须在 T015-T025 之前完成
*   **功能验证前置**: T015-T025 必须在 T026-T052 之前完成
*   **集成前置**: T053-T061 必须在 T062-T075 之前完成
*   **并行依赖**:
    *   T003 可与 T001-T002 并行
    *   T004-T014 可完全并行（7个合同测试 + 4个集成测试）
    *   T015-T025 可完全并行（11个AI移除任务）
    *   T026-T052 可完全并行（27个功能验证任务）
    *   T062-T064 可并行（3个性能测试）
    *   T067-T071 可并行（5个文档更新任务）

## 并行执行示例

```
# 同时启动合同测试 T004-T010 (7个任务):
task-master add-task --title "合同测试 GET /list" --priority high
task-master add-task --title "合同测试 GET /show/{id}" --priority high
task-master add-task --title "合同测试 POST /set-status" --priority high
task-master add-task --title "合同测试 POST /move" --priority high
task-master add-task --title "合同测试 DELETE /remove-task" --priority high
task-master add-task --title "合同测试 POST /add-subtask" --priority high
task-master add-task --title "合同测试 POST /add-dependency" --priority high

# 同时启动AI功能移除 T015-T025 (11个任务):
task-master add-task --title "移除AI服务统一接口" --priority high
task-master add-task --title "移除AI提供商模块" --priority high
task-master add-task --title "移除MCP AI直接函数" --priority high
task-master add-task --title "移除MCP AI工具" --priority high
task-master add-task --title "移除AI提示模板" --priority high
task-master add-task --title "移除提示管理器" --priority high
task-master add-task --title "移除任务管理器AI功能" --priority high
task-master add-task --title "移除AI常量定义" --priority high
task-master add-task --title "移除AI助手配置" --priority high
task-master add-task --title "移除AI状态显示组件" --priority high
task-master add-task --title "移除AI相关依赖包" --priority high

# 同时启动功能验证 T026-T052 (27个任务):
task-master add-task --title "验证任务创建功能" --priority medium
task-master add-task --title "验证任务列表功能" --priority medium
# ... 其他25个验证任务
```

## 笔记

*   **[P] 任务是不同的文件，没有依赖关系，可以安全并行**
*   **在实现前验证测试失败，然后在移除/验证后验证测试通过**
*   **每完成一个任务后提交，并更新任务状态**
*   **避免：模糊的任务描述，同一文件的冲突修改**
*   **目标：完全移除AI功能，保持27个手动功能完整性**

## 任务生成规则

*在 main() 执行期间应用*

1.  **从合约** :
    *   每个API端点 → 合同测试任务 [P]
    *   每个端点 → 实现验证任务
2.  **从数据模型** ：
    *   每个实体 → 功能验证任务 [P]
    *   关系 → 集成验证任务
3.  **从用户故事** ：
    *   每个工作流程 → 集成测试 [P]
    *   快速入门场景 → 端到端验证任务
4.  **从AI移除需求** ：
    *   每个AI模块 → 移除任务 [P]
    *   每个AI依赖 → 清理任务
5.  **顺序** :
    *   设置 → 测试 → AI移除 → 功能验证 → 集成 → 完善
    *   依赖项块内可并行执行

## 阶段 3.6：重新打包和发布准备

### 包配置更新
- [ ] T076 更新 package.json 中的项目名称为 "taskmaster-no-ai"
- [ ] T077 更新 package.json 中的描述移除AI相关内容
- [ ] T078 更新 package.json 中的关键词移除AI相关标签
- [ ] T079 移除 package.json 中所有AI相关的依赖包
- [ ] T080 更新 package.json 中的bin命令配置
- [ ] T081 更新 package.json 中的脚本命令

### 文档更新
- [ ] T082 [P] 更新 README.md 移除AI相关描述和功能介绍
- [ ] T083 [P] 更新 docs/ 目录下的所有文档文件
- [ ] T084 [P] 更新 assets/ 目录下的文档和示例
- [ ] T085 [P] 更新 .cursor/rules/ 目录下的规则文件

### MCP服务器重新配置
- [ ] T086 更新 mcp-server/server.js 中的服务器描述
- [ ] T087 更新 mcp-server/src/ 中的工具注册和描述
- [ ] T088 清理 mcp-server/ 中的AI相关配置
- [ ] T089 测试MCP服务器启动和功能完整性

### 发布准备
- [ ] T090 创建 .npmignore 文件确保发布文件完整性
- [ ] T091 更新 LICENSE 文件中的项目名称
- [ ] T092 创建发布说明文档
- [ ] T093 验证所有依赖关系正确性
- [ ] T094 运行完整测试套件确保质量

### 版本管理和发布
- [ ] T095 创建发布版本标签 (v1.0.0-no-ai)
- [ ] T096 更新 CHANGELOG.md 记录AI移除变更
- [ ] T097 验证 npm publish 权限和配置
- [ ] T098 执行 npm publish 发布新版本
- [ ] T099 创建 GitHub Release 说明安装方法

### 发布后验证
- [ ] T100 验证 npm install taskmaster-no-ai 正常工作
- [ ] T101 验证 task-master 命令可用性
- [ ] T102 验证 task-master-mcp 命令可用性
- [ ] T103 验证所有27个保留功能正常工作
- [ ] T104 验证AI功能已完全移除

## 重新打包依赖项

*   **配置前置**: T076-T081 必须在所有其他打包任务之前完成
*   **文档前置**: T082-T085 可以在配置完成后并行执行
*   **MCP前置**: T086-T089 可以在配置完成后并行执行
*   **发布前置**: T090-T094 必须在 T095-T099 之前完成
*   **验证前置**: T100-T104 必须在所有发布任务完成后执行

## 重新打包并行执行示例

```
# 同时启动文档更新 T082-T085 (4个任务):
task-master add-task --title "更新README.md" --priority high
task-master add-task --title "更新docs目录文档" --priority high
task-master add-task --title "更新assets目录文档" --priority high
task-master add-task --title "更新.cursor/rules规则" --priority high

# 同时启动验证任务 T100-T104 (5个任务):
task-master add-task --title "验证npm安装" --priority high
task-master add-task --title "验证CLI命令" --priority high
task-master add-task --title "验证MCP命令" --priority high
task-master add-task --title "验证保留功能" --priority high
task-master add-task --title "验证AI移除" --priority high
```

## 重新打包注意事项

*   **项目名称统一**: 所有地方都使用 "taskmaster-no-ai"
*   **安装命令**: `npm install -g taskmaster-no-ai`
*   **CLI命令**: `task-master` 和 `task-master-mcp`
*   **MCP服务器**: 通过 `task-master-mcp` 启动
*   **向后兼容**: 保持与原版本的命令接口兼容
*   **功能完整性**: 确保27个手动任务管理功能完全可用

## 验证清单

*GATE：在 main() 返回前由主程序检查*

- [ ] 所有7个API端点都有相应的合同测试
- [ ] 所有11个AI模块都有对应的移除任务
- [ ] 所有27个保留功能都有验证任务
- [ ] 所有测试都在实现之前进行（TDD）
- [ ] 并行任务真正独立（不同文件）
- [ ] 每个任务指定精确的文件路径
- [ ] 没有任务修改另一个[P]任务相同的文件
- [ ] AI功能完全移除，保留功能完整性保证
- [ ] package.json 已更新为 "taskmaster-no-ai"
- [ ] 所有AI依赖已从 package.json 中移除
- [ ] README和文档已更新移除AI相关内容
- [ ] MCP服务器配置已清理AI相关内容
- [ ] npm发布配置和权限已验证
- [ ] 发布后验证确保功能正常工作
