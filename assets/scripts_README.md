# 元开发脚本

此文件夹包含一个**元开发脚本**（`dev.js`）以及相关工具，用于管理 AI 驱动或传统软件开发工作流程的任务。该脚本围绕一个 `tasks.json` 文件展开，该文件保存最新的开发任务列表。

## 概述

在 AI 驱动的开发过程中——特别是使用像 [Cursor](https://www.cursor.so/) 这样的工具时——拥有一个**单一的事实来源**对于任务管理非常有益。此脚本允许您：

1. **解析** PRD 或需求文档（`.txt`）以初始化一组任务（`tasks.json`）。
2. **列出**所有现有任务（ID、状态、标题）。
3. **更新**任务以适应新的提示或架构变更（当您发现"实现偏差"时很有用）。
4. **生成**单个任务文件（例如 `task_001.txt`），便于参考或输入到 AI 编码工作流程中。
5. **设置任务状态**——根据进度将任务标记为 `done`、`pending` 或 `deferred`。
6. **扩展**任务为子任务——将复杂任务分解为更小、更易管理的子任务。
7. **基于研究的子任务生成**——使用 Perplexity AI 生成更有信息量和上下文相关的子任务。
8. **清除子任务**——从指定任务中移除子任务，以允许重新生成或重组。
9. **显示任务详情**——显示特定任务及其子任务的详细信息。

## 配置（已更新）

Task Master 配置现在通过两种主要方法进行管理：

1.  **`.taskmaster/config.json` 文件（项目根目录 - 主要配置）**

    - 存储 AI 模型选择（`main`、`research`、`fallback`）、模型参数（`maxTokens`、`temperature`）、`logLevel`、`defaultSubtasks`、`defaultPriority`、`projectName` 等。
    - 使用 `task-master models --setup` 命令或 `models` MCP 工具进行管理。
    - 这是大多数设置的主要配置文件。

2.  **环境变量（`.env` 文件 - 仅用于 API 密钥）**
    - **仅用于**敏感的 **API 密钥**（例如 `ANTHROPIC_API_KEY`、`PERPLEXITY_API_KEY`）。
    - 在项目根目录创建 `.env` 文件以供 CLI 使用。
    - 请查看 `assets/env.example` 获取所需的密钥名称。

**重要提示：**像 `MODEL`、`MAX_TOKENS`、`TEMPERATURE`、`TASKMASTER_LOG_LEVEL` 等设置**不再通过 `.env` 设置**。请使用 `task-master models --setup` 代替。

## 工作原理

1. **`tasks.json`**：

   - 位于项目根目录的 JSON 文件，包含任务数组（每个任务都有 `id`、`title`、`description`、`status` 等）。
   - `meta` 字段可以存储额外信息，如项目名称、版本或对 PRD 的引用。
   - 任务可以有 `subtasks`，用于更详细的实现步骤。
   - 依赖关系以状态指示器显示（✅ 表示已完成，⏱️ 表示待处理），便于跟踪进度。

2. **CLI 命令**
   您可以通过以下方式运行命令：

   ```bash
   # 如果全局安装
   task-master [command] [options]

   # 如果在项目中使用本地版本
   node scripts/dev.js [command] [options]
   ```

   可用命令：

   - `init`: 初始化新项目
   - `list`: 显示所有任务及其状态
   - `update`: 根据新信息更新任务
   - `generate`: 创建单个任务文件
   - `set-status`: 更改任务状态
   - `clear-subtasks`: 从指定任务中移除子任务
   - `next`: 根据依赖关系确定下一个要处理的任务
   - `show`: 显示特定任务的详细信息
   - `add-dependency`: 在任务之间添加依赖关系
   - `remove-dependency`: 从任务中移除依赖关系
   - `validate-dependencies`: 检查无效的依赖关系
   - `fix-dependencies`: 自动修复无效的依赖关系
   - `add-task`: 添加新任务

   运行 `task-master --help` 或 `node scripts/dev.js --help` 查看详细使用信息。

## 列出任务

`list` 命令允许您查看所有任务及其状态：

```bash
# 列出所有任务
task-master list

# 列出特定状态的任务
task-master list --status=pending

# 列出任务并包含其子任务
task-master list --with-subtasks

# 列出特定状态的任务并包含其子任务
task-master list --status=pending --with-subtasks
```

## 更新任务

`update` 命令允许您根据新信息或实现变更来更新任务：

```bash
# 从 ID 4 开始更新任务，使用新的提示
task-master update --from=4 --prompt="重构从 ID 4 开始的任务，使用 Express 而不是 Fastify"

# 更新所有任务（默认从 1 开始）
task-master update --prompt="为所有相关任务添加认证"

# 指定不同的任务文件
task-master update --file=custom-tasks.json --from=5 --prompt="将数据库从 MongoDB 更改为 PostgreSQL"
```

注意事项：

- `--prompt` 参数是必需的，应该解释变更或新上下文
- 只有未标记为 'done' 的任务才会被更新
- ID >= 指定 --from 值的任务将被更新

## 设置任务状态

`set-status` 命令允许您更改任务的状态：

```bash
# 将任务标记为完成
task-master set-status --id=3 --status=done

# 将任务标记为待处理
task-master set-status --id=4 --status=pending

# 将特定子任务标记为完成
task-master set-status --id=3.1 --status=done

# 一次性标记多个任务
task-master set-status --id=1,2,3 --status=done
```

注意事项：

- 当将父任务标记为"done"时，其所有子任务也将自动标记为"done"
- 常见状态值是 'done'、'pending' 和 'deferred'，但接受任何字符串
- 您可以通过用逗号分隔来指定多个任务 ID
- 子任务 ID 使用 `parentId.subtaskId` 格式指定（例如 `3.1`）
- 依赖关系会更新以显示完成状态（✅ 表示已完成，⏱️ 表示待处理）贯穿整个系统

## 扩展任务


## 清除子任务

`clear-subtasks` 命令允许您从指定任务中移除子任务：

```bash
# 从特定任务清除子任务
task-master clear-subtasks --id=3

# 从多个任务清除子任务
task-master clear-subtasks --id=1,2,3

# 从所有任务清除子任务
task-master clear-subtasks --all
```

注意事项：

- 清除子任务后，任务文件会自动重新生成
- 当您想要使用不同方法重新生成子任务时，这很有用
- 可以与 `expand` 命令结合使用，以立即生成新的子任务
- 适用于父任务和单个子任务

## AI 集成（已更新）

- 该脚本现在使用统一的 AI 服务层（`ai-services-unified.js`）。
- 模型选择（例如，用于 `--research` 的 Claude 与 Perplexity）根据 `.taskmaster/config.json` 中的配置和请求的 `role`（`main` 或 `research`）来确定。
- API 密钥会自动从您的 `.env` 文件（用于 CLI）或 MCP 会话环境中解析。
- 要使用研究功能（例如 `expand --research`），请确保您已：
  1. 使用 `task-master models --setup` 为 `research` 角色配置模型（推荐使用 Perplexity 模型）。
  2. 将相应的 API 密钥（例如 `PERPLEXITY_API_KEY`）添加到您的 `.env` 文件中。

## 日志记录

该脚本支持由 `TASKMASTER_LOG_LEVEL` 环境变量控制的不同日志级别：

- `debug`: 详细信息，通常用于故障排除
- `info`: 确认事情按预期工作（默认值）
- `warn`: 不阻止执行的警告消息
- `error`: 可能阻止执行的错误消息

当设置 `DEBUG=true` 时，调试日志也会写入项目根目录中的 `dev-debug.log` 文件。

## 管理任务依赖关系

`add-dependency` 和 `remove-dependency` 命令允许您管理任务依赖关系：

```bash
# 为任务添加依赖关系
task-master add-dependency --id=<id> --depends-on=<id>

# 从任务中移除依赖关系
task-master remove-dependency --id=<id> --depends-on=<id>
```

这些命令：

1. **允许精确的依赖关系管理**：

   - 在任务之间添加依赖关系，并进行自动验证
   - 在不再需要时移除依赖关系
   - 更改后自动更新任务文件

2. **包含验证检查**：

   - 防止循环依赖（任务依赖于自身）
   - 防止重复依赖
   - 在添加/移除依赖之前验证两个任务都存在
   - 在尝试移除之前检查依赖是否存在

3. **提供清晰的反馈**：

   - 成功消息确认何时添加/移除了依赖关系
   - 错误消息解释操作失败的原因（如果适用）

4. **自动更新任务文件**：
   - 重新生成任务文件以反映依赖关系变更
   - 确保任务及其文件保持同步

## 依赖验证和修复

该脚本提供两个专门的命令来确保任务依赖关系保持有效并得到正确维护：

### 验证依赖关系

`validate-dependencies` 命令允许您检查无效的依赖关系而不进行更改：

```bash
# 检查 tasks.json 中的无效依赖关系
task-master validate-dependencies

# 指定不同的任务文件
task-master validate-dependencies --file=custom-tasks.json
```

此命令：

- 扫描所有任务和子任务以查找不存在的依赖关系
- 识别潜在的自依赖（任务引用自身）
- 报告所有发现的问题而不修改文件
- 提供依赖状态的综合摘要
- 提供任务依赖关系的详细统计信息

使用此命令在应用修复之前审核您的任务结构。

### 修复依赖关系

`fix-dependencies` 命令主动查找并修复所有无效的依赖关系：

```bash
# 查找并修复所有无效的依赖关系
task-master fix-dependencies

# 指定不同的任务文件
task-master fix-dependencies --file=custom-tasks.json
```

此命令：

1. **验证所有依赖关系**贯穿任务和子任务
2. **自动移除**：
   - 对不存在的任务和子任务的引用
   - 自依赖（任务依赖于自身）
3. **修复两个位置的问题**：
   - tasks.json 数据结构
   - 重新生成期间的单个任务文件
4. **提供详细报告**：
   - 修复问题的类型（不存在的依赖关系 vs. 自依赖）
   - 受影响的任务数量（任务 vs. 子任务）
   - 应用修复的位置（tasks.json vs. 任务文件）
   - 所有单独修复的列表

这在任务已被删除或 ID 已更改时特别有用，可能破坏依赖链。




## 查找下一个任务

`next` 命令帮助您根据依赖关系和状态确定下一个要处理的任务：

```bash
# 显示下一个要处理的任务
task-master next

# 指定不同的任务文件
task-master next --file=custom-tasks.json
```

此命令：

1. 识别所有**符合条件的任务** - 待处理或进行中的任务，其所有依赖关系都已满足（标记为完成）
2. **优先排序**这些符合条件的任务：
   - 优先级（高 > 中 > 低）
   - 依赖关系数量（较少依赖优先）
   - 任务 ID（较低 ID 优先）
3. **显示**关于选中任务的综合信息：
   - 基本任务详情（ID、标题、优先级、依赖关系）
   - 详细描述和实现详情
   - 子任务（如果存在）
4. 提供**上下文建议操作**：
   - 将任务标记为进行中的命令
   - 完成后将任务标记为完成的命令
   - 处理子任务的命令（更新状态或扩展）

此功能确保您始终根据项目的当前状态和依赖结构处理最合适的任务。

## 显示任务详情

`show` 命令允许您查看特定任务的详细信息：

```bash
# 显示特定任务的详情
task-master show 1

# 使用 --id 选项的替代语法
task-master show --id=1

# 显示子任务的详情
task-master show --id=1.2

# 指定不同的任务文件
task-master show 3 --file=custom-tasks.json
```

此命令：

1. **显示指定任务的综合信息**：
   - 基本任务详情（ID、标题、优先级、依赖关系、状态）
   - 完整描述和实现详情
   - 测试策略信息
   - 子任务（如果存在）
2. **处理常规任务和子任务**：
   - 对于常规任务，显示所有子任务及其状态
   - 对于子任务，显示父任务关系
3. **提供上下文建议操作**：
   - 更新任务状态的命令
   - 处理子任务的命令
   - 对于子任务，提供查看父任务的链接

此命令在您需要详细检查特定任务以便实现它时特别有用，或者当您想要检查特定任务的状态和详情时。
