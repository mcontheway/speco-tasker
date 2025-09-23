# 任务：修复 MCP 接口中 spec_files 字段的完整实现

**输入** : 从 `/specs/003-feature-mcp-spec-files-description/` 设计文档
**前提条件** : plan.md（必需），research.md，data-model.md，contracts/

## 执行流程（主流程）

```
1. 从功能目录加载 plan.md
   → 提取：Node.js/TypeScript, MCP SDK, Zod 验证
2. 加载可选设计文档：
   → data-model.md：提取 SpecFile 实体 → 参数验证任务
   → contracts/mcp-tools-api.yaml：提取 4 个工具 API → 合约测试任务
   → research.md：提取 MCP 参数验证模式 → 实现指导
3. 按类别生成任务：
   → 设置：项目结构确认、依赖检查
   → 测试：参数验证测试、合约测试、集成测试
   → 核心：MCP 工具参数更新、Direct 函数处理
   → 集成：错误处理、API 响应格式
   → 完善：文档更新、最终验证
4. 应用任务规则：
   → 不同文件 = 标记 [P] 表示并行
   → 相同文件 = 顺序执行（无 [P]）
   → 测试优先于实现（TDD）
5. 按顺序编号任务（T001、T002...）
6. 生成依赖关系图
7. 创建并行执行示例
8. 验证任务完整性：
   → 所有合同都有测试吗？
   → 所有实体都有验证吗？
   → 所有工具都更新了吗？
9. 返回：成功（任务准备就绪可执行）
```

## 格式: `[ID] [P?] 描述`

*   **[P]**: 可以并行运行（不同文件，无依赖）
*   在描述中包含确切的文件路径

## 路径规范

*   **项目结构** : `mcp-server/src/tools/`, `mcp-server/src/core/direct-functions/`
*   **测试位置** : `tests/contract/`, `tests/integration/`

## 阶段3.1：设置

- [ ] T001 确认当前分支为 003-feature-mcp-spec-files-description
- [ ] T002 验证项目依赖项（@modelcontextprotocol/sdk, zod）
- [ ] T003 [P] 检查当前 MCP 工具参数实现

## 阶段 3.2：先写测试（TDD） ⚠️ 必须在 3.3 之前完成

**关键：这些测试必须先编写并通过，然后才能进行任何实现**

- [ ] T004 [P] 在 tests/contract/test_mcp_add_task_spec_files.js 中编写 add_task 工具参数验证测试
- [ ] T005 [P] 在 tests/contract/test_mcp_update_task_spec_files.js 中编写 update_task 工具参数验证测试
- [ ] T006 [P] 在 tests/contract/test_mcp_add_subtask_spec_files.js 中编写 add_subtask 工具参数验证测试
- [ ] T007 [P] 在 tests/contract/test_mcp_update_subtask_spec_files.js 中编写 update_subtask 工具参数验证测试
- [ ] T008 [P] 在 tests/integration/test_mcp_spec_files_full_flow.js 中编写完整流程集成测试

## 阶段 3.3：核心实现（仅测试失败后）

- [ ] T009 更新 mcp-server/src/tools/add-task.js 中的 spec_files 参数定义为 JSON 对象数组格式
- [ ] T010 更新 mcp-server/src/tools/update-task.js 中的 spec_files 参数定义为 JSON 对象数组格式
- [ ] T011 为 mcp-server/src/tools/add-subtask.js 添加 spec_files 参数定义
- [ ] T012 更新 mcp-server/src/tools/update-subtask.js 中的 spec_files 参数定义为 JSON 对象数组格式
- [ ] T013 更新 mcp-server/src/core/direct-functions/add-task.js 中的 spec_files 处理逻辑
- [ ] T014 更新 mcp-server/src/core/direct-functions/update-task.js 中的 spec_files 处理逻辑

## 阶段 3.4: 集成

- [ ] T015 在所有 MCP 工具中实现统一的错误处理和中文错误消息
- [ ] T016 验证 API 响应格式符合 contracts/mcp-tools-api.yaml 规范
- [ ] T017 测试参数验证失败时的错误响应格式
- [ ] T018 验证 Direct 函数正确传递对象数组到核心逻辑

## 第三阶段.5: 精细调整

- [ ] T019 [P] 在 tests/unit/test_spec_files_validation.js 中添加 SpecFile 对象验证单元测试
- [ ] T020 更新 docs/mcp-tools-complete-guide.md 中的工具使用示例
- [ ] T021 更新 docs/comprehensive-cli-mcp-reference.md 中的参数格式说明
- [ ] T022 运行完整的功能测试验证所有场景
- [ ] T023 执行回归测试确保现有功能不受影响

## 依赖项

*   实现前（T009-T014）的测试（T004-T008）
*   T009-T012 阻塞 T013-T014（参数定义先于处理逻辑）
*   T015 阻塞 T016-T018（错误处理先于集成测试）
*   精炼前的实现 (T019-T023)

## 并行示例

```
# 同时启动 T004-T008（合约和集成测试）:
任务: "在 tests/contract/test_mcp_add_task_spec_files.js 中编写 add_task 工具参数验证测试"
任务: "在 tests/contract/test_mcp_update_task_spec_files.js 中编写 update_task 工具参数验证测试"
任务: "在 tests/contract/test_mcp_add_subtask_spec_files.js 中编写 add_subtask 工具参数验证测试"
任务: "在 tests/contract/test_mcp_update_subtask_spec_files.js 中编写 update_subtask 工具参数验证测试"
任务: "在 tests/integration/test_mcp_spec_files_full_flow.js 中编写完整流程集成测试"

# 同时启动 T009-T012（MCP 工具参数更新）:
任务: "更新 mcp-server/src/tools/add-task.js 中的 spec_files 参数定义"
任务: "更新 mcp-server/src/tools/update-task.js 中的 spec_files 参数定义"
任务: "为 mcp-server/src/tools/add-subtask.js 添加 spec_files 参数"
任务: "更新 mcp-server/src/tools/update-subtask.js 中的 spec_files 参数定义"
```

## 笔记

*   [P] 任务是不同的文件，没有依赖关系
*   在实现前验证测试失败（RED 阶段）
*   每完成一个任务后提交代码变更
*   避免：模糊的任务，同一文件的冲突修改

## 任务生成规则

*在 main() 执行期间应用*

1.  **从合约** :

    *   每个工具 API → 合约测试任务 [P]
    *   每个参数格式 → 验证测试
2.  **从数据模型** ：

    *   SpecFile 实体 → 参数验证任务 [P]
    *   验证规则 → 错误处理任务
3.  **从用户故事** ：

    *   每个验收场景 → 集成测试 [P]
    *   边界情况 → 错误处理测试
4.  **顺序** :

    *   设置 → 测试 → 核心实现 → 集成 → 完善
    *   依赖项块并行执行

## 验证清单

*GATE：在 main() 返回前由主程序检查*

- [ ] 所有 MCP 工具都有相应的参数验证测试
- [ ] SpecFile 实体有完整的验证逻辑
- [ ] 所有测试都在实现之前进行
- [ ] 并行任务真正独立（不同文件）
- [ ] 每个任务指定精确的文件路径
- [ ] 没有任务修改另一个[P]任务相同的文件
- [ ] 错误消息提供清晰的格式指导
- [ ] API 响应符合 OpenAPI 规范
