# Speco Tasker 命令参考

这是所有可用命令的完整参考：

## 解析 PRD

```bash
# 解析 PRD 文件并生成任务
task-master parse-prd <prd-file.txt>

# 限制生成的任务数量（默认值为 10）
task-master parse-prd <prd-file.txt> --num-tasks=5

# 允许 Speco Tasker 根据复杂度确定任务数量
task-master parse-prd <prd-file.txt> --num-tasks=0
```

## 列出任务

```bash
# 列出所有任务
task-master list

# 列出特定状态的任务
task-master list --status=<status>

# 列出包含子任务的任务
task-master list --with-subtasks

# 列出特定状态且包含子任务的任务
task-master list --status=<status> --with-subtasks
```

## 显示下一个任务

```bash
# 根据依赖关系和状态显示下一个可以处理的任务
task-master next
```

## 显示特定任务

```bash
# 显示特定任务的详细信息
task-master show <id>
# 或
task-master show --id=<id>

# 使用逗号分隔的 ID 查看多个任务
task-master show 1,3,5
task-master show 44,55

# 查看特定子任务（例如任务 1 的子任务 2）
task-master show 1.2

# 混合显示父任务和子任务
task-master show 44,44.1,55,55.2
```

**多个任务显示：**

- **单个 ID**：显示详细的任务视图，包含完整的实现细节
- **多个 ID**：显示紧凑的摘要表格，包含交互式操作菜单
- **操作菜单**：提供可复制粘贴的命令，用于批量操作：
  - 将所有任务标记为进行中/完成
  - 显示下一个可用任务
  - 展开所有任务（生成子任务）
  - 查看依赖关系
  - 生成任务文件

## 更新任务

```bash
# 从特定 ID 开始更新多个任务
task-master update --from=<id> --description="更新所有相关任务的描述"

# 更新多个任务的测试策略（追加模式）
task-master update --from=<id> --test-strategy="添加性能测试要求" --append
```

## 更新特定任务

```bash
# 通过 ID 更新单个任务的多个字段
task-master update-task --id=<id> --status="in-progress" --details="开始实现API端点"

# 更新任务的测试策略和规范文档
task-master update-task --id=<id> --test-strategy="添加单元测试和集成测试" --spec-files="docs/api-spec.md,docs/test-plan.md"

# 追加模式更新任务详情
task-master update-task --id=<id> --details="添加错误处理逻辑" --append
```

## 更新子任务

```bash
# 更新子任务的状态和详情
task-master update-subtask --id=<parentId.subtaskId> --status="in-progress" --details="开始实现认证逻辑"

# 示例：为任务 5 的子任务 2 添加 API 速率限制详情
task-master update-subtask --id=5.2 --details="添加每分钟 100 个请求的速率限制"

# 追加模式更新子任务（保留历史记录）
task-master update-subtask --id=5.2 --details="更新：使用 Redis 缓存实现速率限制" --append

# 更新子任务的依赖关系和日志
task-master update-subtask --id=5.2 --dependencies="5.1,5.3" --logs="2024-01-15: 开始实现速率限制功能"
```

与 `update-task` 命令替换任务信息不同，`update-subtask` 命令支持 `--append` 模式，会_追加_新信息到现有子任务详情中，并标记时间戳。这对于迭代增强子任务很有用，同时保留原始内容。

## 生成任务文件

```bash
# 从 tasks.json 生成单个任务文件
task-master generate
```

## 设置任务状态

```bash
# 设置单个任务的状态
task-master set-status --id=<id> --status=<status>

# 设置多个任务的状态
task-master set-status --id=1,2,3 --status=<status>

# 设置子任务的状态
task-master set-status --id=1.1,1.2 --status=<status>
```

标记任务为"done"时，所有子任务将自动标记为"done"。

## 添加子任务

```bash
# 为现有任务添加新的子任务（继承父任务的规范字段）
task-master add-subtask --parent=<id> --title="子任务标题" --description="子任务描述" --inherit-parent

# 手动指定所有字段创建子任务
task-master add-subtask --parent=<id> --title="API 实现" --description="实现 REST API 端点" --details="使用 Express.js 实现 CRUD 操作" --test-strategy="单元测试每个端点，集成测试完整流程" --spec-files="docs/api-spec.md"

# 将现有任务转换为子任务
task-master add-subtask --parent=<id> --task-id=<existing-task-id>

# 创建具有依赖关系的子任务
task-master add-subtask --parent=<id> --title="数据库迁移" --description="创建用户表" --dependencies="1.1,1.2"
```

子任务会自动继承父任务的 `priority`、`testStrategy` 和 `spec_files` 字段（除非使用 `--inherit-parent=false` 明确禁用）。这确保了子任务符合父任务的规范要求。

## 清除子任务

```bash
# 从特定任务清除子任务
task-master clear-subtasks --id=<id>

# 从多个任务清除子任务
task-master clear-subtasks --id=1,2,3

# 从所有任务清除子任务
task-master clear-subtasks --all
```

## 分析任务复杂度

```bash
# 分析所有任务的复杂度
task-master analyze-complexity

# 将报告保存到自定义位置
task-master analyze-complexity --output=my-report.json

# 使用特定的 LLM 模型
task-master analyze-complexity --model=claude-3-opus-20240229

# 设置自定义复杂度阈值（1-10）
task-master analyze-complexity --threshold=6

# 使用备用任务文件
task-master analyze-complexity --file=custom-tasks.json

# 使用 Perplexity AI 进行研究支持的复杂度分析
task-master analyze-complexity --research
```

## 查看复杂度报告

```bash
# 以可读格式显示任务复杂度分析报告
task-master complexity-report

# 查看自定义位置的报告
task-master complexity-report --file=my-report.json
```

## 管理任务依赖关系

```bash
# 为任务添加依赖关系
task-master add-dependency --id=<id> --depends-on=<id>

# 从任务移除依赖关系
task-master remove-dependency --id=<id> --depends-on=<id>

# 验证依赖关系而不修复
task-master validate-dependencies

# 自动查找并修复无效依赖关系
task-master fix-dependencies
```

## 移动任务

```bash
# 将任务或子任务移动到新位置
task-master move --from=<id> --to=<id>

# 示例：
# 移动任务使其成为子任务
task-master move --from=5 --to=7

# 移动子任务使其成为独立任务
task-master move --from=5.2 --to=7

# 将子任务移动到其他父任务
task-master move --from=5.2 --to=7.3

# 在同一父任务内重新排序子任务
task-master move --from=5.2 --to=5.4

# 将任务移动到新 ID 位置（如果不存在则创建占位符）
task-master move --from=5 --to=25

# 同时移动多个任务（源 ID 和目标 ID 数量必须相同）
task-master move --from=10,11,12 --to=16,17,18
```

## 添加新任务

```bash
# 使用规范驱动开发方式添加新任务（所有字段必需）
task-master add-task \
  --title="用户认证" \
  --description="实现JWT用户认证功能" \
  --details="使用JWT库实现token生成和验证，包含登录、注册、token刷新功能" \
  --test-strategy="单元测试token生成，集成测试认证流程，端到端测试用户登录" \
  --spec-files="docs/auth-spec.md,docs/api-spec.yaml"

# 添加具有依赖关系的任务
task-master add-task \
  --title="数据库迁移" \
  --description="创建用户表结构" \
  --details="使用SQL创建users表，包含id, email, password, created_at字段" \
  --test-strategy="测试表创建、数据插入、约束验证" \
  --spec-files="docs/database-schema.md" \
  --dependencies=1,2,3

# 添加具有优先级设置的任务
task-master add-task \
  --title="安全审计" \
  --description="进行代码安全审计" \
  --details="使用安全扫描工具检查代码漏洞，审查权限控制" \
  --test-strategy="验证安全补丁，测试权限控制逻辑" \
  --spec-files="docs/security-requirements.md" \
  --priority=high
```

## 标签管理

Speco Tasker 支持带标签的任务列表，用于多上下文任务管理。每个标签代表一个单独的、隔离的任务上下文。

```bash
# 列出所有可用标签及其任务计数和状态
task-master tags

# 列出包含详细元数据的标签
task-master tags --show-metadata

# 创建新的空标签
task-master add-tag <tag-name>

# 创建带有描述的新标签
task-master add-tag <tag-name> --description="功能开发任务"

# 基于当前 git 分支名称创建标签
task-master add-tag --from-branch

# 通过复制当前标签的任务创建新标签
task-master add-tag <new-tag> --copy-from-current

# 通过从特定标签复制任务创建新标签
task-master add-tag <new-tag> --copy-from=<source-tag>

# 切换到不同的标签上下文
task-master use-tag <tag-name>

# 重命名现有标签
task-master rename-tag <old-name> <new-name>

# 复制整个标签以创建新标签
task-master copy-tag <source-tag> <target-tag>

# 复制带有描述的标签
task-master copy-tag <source-tag> <target-tag> --description="用于测试的复制"

# 删除标签及其所有任务（带确认）
task-master delete-tag <tag-name>

# 删除标签而不显示确认提示
task-master delete-tag <tag-name> --yes
```

**标签上下文：**
- 所有任务操作（list、show、add、update 等）都在当前激活的标签内工作
- 使用 `--tag=<name>` 标志与大多数命令一起在特定标签上下文中操作
- 标签提供完全隔离 - 不同标签中的任务不会相互干扰

## 初始化项目

```bash
# 使用 Speco Tasker 结构初始化新项目
task-master init


## 配置 AI 模型

```bash
# 查看当前 AI 模型配置和 API 密钥状态
task-master models

# 设置用于生成/更新的主模型（如果已知则推断提供商）
task-master models --set-main=claude-3-opus-20240229

# 设置研究模型
task-master models --set-research=sonar-pro

# 设置备用模型
task-master models --set-fallback=claude-3-haiku-20240307

# 为主要角色设置自定义 Ollama 模型
task-master models --set-main=my-local-llama --ollama

# 为研究角色设置自定义 OpenRouter 模型
task-master models --set-research=google/gemini-pro --openrouter

# 运行交互式设置来配置模型，包括自定义模型
task-master models --setup
```

配置存储在项目根目录的 `.taskmaster/config.json` 文件中（旧版 `.taskmasterconfig` 文件会自动迁移）。API 密钥仍通过 `.env` 或 MCP 配置管理。使用 `task-master models` 查看内置支持的模型。使用 `--setup` 获取引导式体验。

状态存储在项目根目录的 `.taskmaster/state.json` 文件中。它维护重要的标签系统信息。不要手动编辑此文件。

## 进行最新研究

```bash
# 使用最新的最新信息执行 AI 驱动的研究查询
task-master research "Node.js 中 JWT 认证的最佳实践有哪些？"

# 研究特定任务上下文
task-master research "如何实现 OAuth 2.0？" --id=15,16

# 研究文件上下文以获得代码感知建议
task-master research "如何优化这个 API 实现？" --files=src/api.js,src/auth.js

# 研究自定义上下文和项目树
task-master research "错误处理的最佳实践" --context="我们正在使用 Express.js" --tree

# 研究不同详细级别
task-master research "React Query v5 迁移指南" --detail=high

# 禁用交互式后续问题（对脚本很有用，默认情况下 MCP 为此）
# 使用自定义任务文件位置
task-master research "如何实现这个功能？" --file=custom-tasks.json

# 在特定标签上下文中进行研究
task-master research "数据库优化策略" --tag=feature-branch

# 将研究对话保存到 .taskmaster/docs/research/ 目录（供以后参考）
task-master research "数据库优化技术" --save-file

# 将关键发现直接保存到任务或子任务（推荐用于可操作的见解）
task-master research "如何实现 OAuth？" --save-to=15
task-master research "API 优化策略" --save-to=15.2

# 结合上下文收集与自动保存发现
task-master research "这个实现的最佳实践" --id=15,16 --files=src/auth.js --save-to=15.3
```

**research 命令是一个强大的探索工具，它提供：**

- **超出 AI 知识截止日期的最新信息**
- **项目感知上下文** 来自您的任务和文件
- **自动任务发现** 使用模糊搜索
- **多种详细级别**（低、中、高）
- **令牌计数和成本跟踪**
- **交互式后续问题** 用于深入探索
- **灵活的保存选项**（将发现提交到任务或保留对话）
- **迭代发现** 通过持续提问和完善

**经常使用 research 来：**

- 在实现功能之前获取当前最佳实践
- 研究新技术库
- 查找复杂问题的解决方案
- 验证您的实现方法
- 随时了解最新的安全建议

**交互功能（CLI）：**

- **后续问题** 维护对话上下文并允许深入探索
- **保存菜单** 在研究期间或之后使用灵活选项：
  - **保存到任务/子任务**：提交关键发现和可操作的见解（推荐）
  - **保存到文件**：如果需要保留整个对话以供以后参考
  - **继续探索**：提出更多后续问题以深入挖掘
- **自动文件名** 使用时间戳和查询相关的 slug 保存对话时

---

*最后更新：2025年09月16日*
