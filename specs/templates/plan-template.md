实施计划：[功能]
分支： [###-feature-name] | 日期：[日期] | 规格：[链接] 输入：来自 /specs/[###-feature-name]/spec.md 的功能规范

执行流程 (/plan 命令范围)
、、
1. 从输入路径加载功能规范
   → 如果未找到：错误 "在 {path} 处没有功能规范"
2. 填写技术背景（扫描需要澄清的部分）
   → 根据上下文检测项目类型（web=前端+后端，mobile=应用+API）
   → 根据项目类型设置结构决策
3. 评估下方的宪法检查部分
   → 如果存在违规：在复杂性跟踪中记录
   → 如果无法提供正当理由：错误 "首先简化方法"
   → 更新进度跟踪：初始宪法检查
4. 执行阶段 0 → research.md
   → 如果仍有需要澄清的部分：错误 "解决未知问题"
5. 执行阶段 1 → contracts, data-model.md, quickstart.md, 代理特定模板文件（例如，`CLAUDE.md` 用于 Claude Code，`.github/copilot-instructions.md` 用于 GitHub Copilot，或 `GEMINI.md` 用于 Gemini CLI）
6. 重新评估宪法检查部分
   → 如果有新的违规：重构设计，返回阶段 1
   → 更新进度跟踪：设计后宪法检查
7. 规划阶段 2 → 描述任务生成方法（不要创建 tasks.md）
8. 停止 - 准备执行 /tasks 命令
```
重要提示：/plan 命令在步骤 7 处停止。阶段 2-4 由其他命令执行：

第二阶段：/tasks 命令创建 tasks.md
第三至四阶段：实施执行（手动或通过工具）
总结
[从功能规范中提取：主要需求 + 研究中的技术方法]

技术背景
语言/版本：[例如：Python 3.11、Swift 5.9、Rust 1.75 或 需要澄清]
主要依赖：[例如：FastAPI、UIKit、LLVM 或 需要澄清]
存储：[如适用，例如：PostgreSQL、CoreData、文件 或 不适用]
测试：[例如，pytest、XCTest、cargo test 或需澄清]
目标平台：[例如，Linux 服务器、iOS 15+、WASM 或需澄清] 项目类型：[单一/网络/移动 - 决定源代码结构]
性能目标：[特定领域，例如，1000 请求/秒、10k 行/秒、60 帧/秒或需澄清]
限制条件：[特定领域，例如，p95<200 毫秒、内存<100MB、离线可用或需澄清]
规模/范围：[特定领域，例如，10k 用户，1M 行代码，50 个界面或需澄清]

宪法检查
GATE：必须在 0 阶段研究前通过。1 阶段设计后重新检查。

简洁性：

项目：[#]（最多 3 个 - 例如，api、cli、tests）
直接使用框架？（无包装类）
单一数据模型？（除非序列化不同，否则无 DTO）
避免模式？（无实际需求时不使用 Repository/UoW）
架构：

每个功能都作为库？(没有直接的应用代码)
列出的库：[名称 + 每个库的用途]
每个库一个 CLI：[带有 --help/--version/--format 的命令]
库文档：llms.txt 格式计划好了吗？
测试（不可协商）：

RED-GREEN-重构周期执行吗？（测试必须先失败）
Git 提交显示测试在实现之前？
顺序：合同→集成→端到端→单元是否严格遵循？
是否使用实际依赖（非模拟）？
对新库、合同变更、共享模式进行集成测试？
禁止：测试前实施，跳过 RED 阶段
可观察性：

是否包含结构化日志？
前端日志 → 后端？(统一流)
错误上下文是否充分？
版本控制：

是否分配了版本号（MAJOR.MINOR.BUILD）？
每次变更时 BUILD 是否递增？
是否处理了破坏性变更（并行测试、迁移计划）？
项目结构
文档（此功能）
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
源代码（仓库根目录）
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
结构决策：[默认为选项 1，除非技术背景表明是网络/移动应用]

阶段 0：大纲与研究
从上方技术背景中提取未知因素：

对于每个需要澄清的 → 研究任务
对于每个依赖项 → 最佳实践任务
对于每个集成→模式任务
生成并发送研究代理：

For each unknown in Technical Context:
  Task: "Research {unknown} for {feature context}"
For each technology choice:
  Task: "Find best practices for {tech} in {domain}"
使用格式在 research.md 中整合发现：

决策：[所选择的内容]
理由：[为何选择]
考虑过的替代方案：[评估了什么其他选项]
输出：research.md，所有 NEEDS CLARIFICATION 问题已解决

第一阶段：设计与合同
前提条件：research.md 完成

从功能规范中提取实体 → data-model.md :

实体名称、字段、关系
来自需求的有效性规则
适用状态转换
根据功能需求生成 API 合约：

每个用户操作→端点
使用标准的 REST/GraphQL 模式
输出 OpenAPI/GraphQL schema 到 /contracts/
从合约生成合约测试：

每个端点一个测试文件
断言请求/响应模式
测试必须失败（尚未实现）
从用户故事中提取测试场景：

每个故事 → 集成测试场景
快速启动测试 = 故事验证步骤
逐步更新代理文件（O(1)操作）：

为您的 AI 助手运行 /scripts/update-agent-context.sh [claude|gemini|copilot]
如果存在：仅添加当前计划中的新技术
在标记之间保留手动添加的内容
更新最近更改（保留最后 3 条）
保持在 150 行以内以优化 token 效率
输出到仓库根目录
输出：data-model.md, /contracts/*, 失败的测试, quickstart.md, 特定代理的文件

第二阶段：任务规划方法
本节描述了 /tasks 命令将执行的操作 - 在 /plan 期间请勿执行

任务生成策略：

加载 /templates/tasks-template.md 作为基础
从第一阶段设计文档（合同、数据模型、快速入门）生成任务
每个合同 → 合同测试任务 [P]
每个实体 → 模型创建任务 [P]
每个用户故事 → 集成测试任务
实现任务以使测试通过
排序策略：

TDD 顺序：测试在实现之前
依赖顺序：模型在服务之前，服务在 UI 之前
标记[P]以并行执行（独立文件）
预计输出：tasks.md 中包含 25-30 个编号、有序的任务

重要提示：此阶段由/tasks 命令执行，而非/plan 命令

阶段 3+：未来实现
这些阶段超出了 /plan 命令的范围

阶段 3：任务执行 (/tasks 命令创建 tasks.md)
阶段 4：实施（遵循宪法原则执行 tasks.md）
阶段 5：验证（运行测试，执行 quickstart.md，性能验证）

复杂度跟踪
仅当宪法检查存在必须说明的违规时填写

违规	为何需要	更简单的替代方案被拒绝
[e.g., 第 4 个项目]	[当前需求]	[为什么 3 个项目不足]
[e.g., 仓库模式]	[具体问题]	[直接访问数据库的不足之处]
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
基于宪法 v2.1.1 - 查看 /memory/constitution.md