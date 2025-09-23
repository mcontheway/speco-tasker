实施计划：修复 MCP 接口中 spec_files 字段的完整实现
分支： 003-feature-mcp-spec-files-description | 日期：2025年09月23日 | 规格：specs/003-feature-mcp-spec-files-description/spec.md 输入：来自 specs/003-feature-mcp-spec-files-description/spec.md 的功能规范

执行流程 (/plan 命令范围)
```
1. 从输入路径加载功能规范
   → 已找到：specs/003-feature-mcp-spec-files-description/spec.md
2. 填写技术背景（扫描需要澄清的部分）
   → 项目类型：Node.js/TypeScript 后端服务
   → 技术栈：Node.js, Express-like MCP 服务器, Zod 验证, JSON Schema
3. 评估下方的宪法检查部分
   → 初步评估：符合宪法要求，无复杂性违规
   → 更新进度跟踪：初始宪法检查
4. 执行阶段 0 → research.md
   → 研究 MCP 协议规范和现有实现
5. 执行阶段 1 → contracts, data-model.md, quickstart.md, 代理特定模板文件
6. 重新评估宪法检查部分
   → 确认设计符合宪法原则
   → 更新进度跟踪：设计后宪法检查
7. 规划阶段 2 → 描述任务生成方法（不要创建 tasks.md）
8. 停止 - 准备执行 /tasks 命令
```
重要提示：/plan 命令在步骤 7 处停止。阶段 2-4 由其他命令执行：

第二阶段：/tasks 命令创建 tasks.md
第三至四阶段：实施执行（手动或通过工具）
总结
[主要需求：修改 MCP 工具参数定义，支持完整的 JSON 对象数组格式的 spec_files 字段，使 MCP 接口功能与 CLI 接口保持一致]

技术背景
语言/版本：Node.js 18+, TypeScript 5.x
主要依赖：@modelcontextprotocol/sdk, zod, fastify (MCP 服务器框架)
存储：文件系统 (JSON 文件存储任务数据)
测试：Jest, supertest (MCP 协议测试)
目标平台：Node.js 运行时环境，跨平台兼容
性能目标：MCP 工具响应时间 < 100ms，参数验证 < 10ms
限制条件：必须保持向后兼容现有 MCP 客户端，API 变更最小化
规模/范围：修改 4 个 MCP 工具，2 个 Direct 函数，影响约 200 行代码

宪法检查
GATE：必须在 0 阶段研究前通过。1 阶段设计后重新检查。

简洁性：

项目：[1]（单一 Node.js 项目）
直接使用框架？（使用 MCP SDK，无额外包装）
单一数据模型？（使用现有任务数据模型，无 DTO）
避免模式？（直接使用文件系统存储，无 Repository 模式）

架构：

每个功能都作为库？(MCP 工具作为独立模块)
列出的库：[mcp-server/src/tools/, mcp-server/src/core/]
每个库一个 CLI：[MCP 服务器作为单一 CLI 应用]
库文档：需要更新 MCP 工具文档

测试（不可协商）：

RED-GREEN-重构周期执行吗？（是）
Git 提交显示测试在实现之前？（是）
顺序：合同→集成→端到端→单元是否严格遵循？（是）
是否使用实际依赖（非模拟）？（是，使用实际 MCP 协议）
对新库、合同变更、共享模式进行集成测试？（是）

可观察性：

是否包含结构化日志？（是，使用现有日志系统）
前端日志 → 后端？(N/A - MCP 协议)
错误上下文是否充分？（需要增强错误信息）

版本控制：

是否分配了版本号（MAJOR.MINOR.BUILD）？（使用现有版本控制）
每次变更时 BUILD 是否递增？（是）
是否处理了破坏性变更（并行测试、迁移计划）？（需要评估影响）

项目结构
文档（此功能）
specs/003-feature-mcp-spec-files-description/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)

源代码（仓库根目录）
mcp-server/
├── src/
│   ├── tools/
│   │   ├── add-task.js      # 需要修改参数定义
│   │   ├── update-task.js   # 需要修改参数定义
│   │   ├── add-subtask.js   # 需要添加参数
│   │   └── update-subtask.js # 需要修改参数定义
│   └── core/
│       ├── direct-functions/
│       │   ├── add-task.js      # 需要修改处理逻辑
│       │   └── update-task.js   # 需要修改处理逻辑
│       └── task-master-core.js

结构决策：[选项 1 - 单一项目，符合现有架构]

阶段 0：大纲与研究
从上方技术背景中提取未知因素：

对于 MCP 协议规范 → 研究 MCP 协议中工具参数验证的最佳实践
对于 JSON Schema 设计 → 研究对象数组参数的设计模式
对于向后兼容性策略 → 研究 API 变更管理策略

研究任务：
1. "Research MCP protocol parameter validation patterns"
2. "Research JSON Schema design for complex object arrays"
3. "Research API versioning strategies for MCP tools"

输出：research.md，所有 NEEDS CLARIFICATION 问题已解决

第一阶段：设计与合同
前提条件：research.md 完成

从功能规范中提取实体 → data-model.md :

规范文档对象：
- type: 枚举值 (plan, spec, requirement, design, test, other)
- title: 字符串，文档标题
- file: 字符串，文件路径

MCP 工具参数：
- spec_files: 数组<规范文档对象>，必需（主任务），可选（子任务）

根据功能需求生成 API 合约：

MCP 工具参数规范：
- add_task.spec_files: 数组<对象>，最小长度 1
- update_task.spec_files: 数组<对象>，可选
- add_subtask.spec_files: 数组<对象>，可选
- update_subtask.spec_files: 数组<对象>，可选

每个对象字段：
- type: 枚举 ["plan", "spec", "requirement", "design", "test", "other"]
- title: 字符串，非空
- file: 字符串，文件路径

输出 OpenAPI-like schema 到 contracts/mcp-tools-api.yaml

从合约生成合约测试：
每个工具参数一个测试文件
断言请求参数格式和验证错误

从用户故事中提取测试场景：
1. 创建任务时提供完整 spec_files 数组 → 成功创建
2. 缺少必要字段 → 明确的验证错误
3. 无效的文档类型 → 类型验证错误

更新代理文件：运行 update-agent-context.sh

输出：data-model.md, contracts/, 失败的测试, quickstart.md

第二阶段：任务规划方法
本节描述了 /tasks 命令将执行的操作 - 在 /plan 期间请勿执行

任务生成策略：

从设计文档生成任务：
- 每个 MCP 工具参数变更 → 参数更新任务 [P]
- 每个 Direct 函数修改 → 处理逻辑任务 [P]
- 每个验证规则 → 验证实现任务 [P]
- 每个错误处理 → 错误处理任务 [P]

排序策略：
TDD 顺序：验证测试 → 实现 → 集成测试
依赖顺序：参数定义 → Direct 函数 → 工具注册

预计输出：tasks.md 中包含约 12-15 个任务

重要提示：此阶段由/tasks 命令执行，而非/plan 命令

阶段 3+：未来实现
这些阶段超出了 /plan 命令的范围

阶段 3：任务执行 (/tasks 命令创建 tasks.md)
阶段 4：实施（遵循宪法原则执行 tasks.md）
阶段 5：验证（运行测试，执行 quickstart.md，性能验证）

复杂度跟踪
无宪法违规，无需复杂度跟踪

进度跟踪
这个清单在执行流程中会更新

阶段状态：

阶段 0：研究完成 (/plan 命令)
阶段 1：设计完成 (/plan 命令)
第二阶段：任务规划完成（/plan 命令 - 仅描述方法）
第三阶段：任务已生成（/tasks 命令）
第四阶段：实施完成
第五阶段：验证通过

门状态：

初始结构检查：通过
设计后结构检查：通过
所有 NEEDS CLARIFICATION 问题已解决
复杂性偏差已记录

基于宪法 v2.1.1
