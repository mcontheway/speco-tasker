# Speco Tasker 教程

本教程将指导您设置和使用 Speco Tasker 进行手动开发工作流程。

## 初始设置

设置 Speco Tasker 有两种方式：使用 MCP（推荐）或通过 npm 安装。

### 选项 1：使用 MCP（推荐）

MCP（模型控制协议）提供了在您的编辑器中直接开始使用 Speco Tasker 的最简单方式。

1. **安装包**

```bash
npm i -g speco-tasker
```

2. **将 MCP 配置添加到您的 IDE/MCP 客户端**（推荐使用 Cursor，但也支持其他客户端）：

```json
{
  "mcpServers": {
    "speco-tasker": {
      "command": "npx",
      "args": ["-y", "--package=speco-tasker", "speco-tasker"]
    }
  }
}
```

**注意：** Taskmaster 是一个纯手动系统，不需要 API 密钥或外部服务。

3. **在编辑器设置中启用 MCP**

4. **在项目中初始化 Speco Tasker**：

```bash
task-master init
```

AI 将会：

- 创建必要的项目结构
- 设置初始配置文件
- 指导您完成其余过程

5. 将您的 PRD 文档放置在 `.taskmaster/docs/` 目录中（例如：`.taskmaster/docs/prd.txt`）

6. **使用自然语言命令**与 Speco Tasker 交互：

```
Can you parse my PRD at .taskmaster/docs/prd.txt?
What's the next task I should work on?
Can you help me implement task 3?
```

### 选项 2：手动安装

如果您更喜欢直接使用命令行界面：

```bash
# 全局安装
npm install -g task-master-ai

# 或者在项目中本地安装
npm install task-master-ai
```

初始化新项目：

```bash
# 如果全局安装
task-master init

# 如果本地安装
npx task-master init
```

这将提示您输入项目详细信息，并使用必要的文件和结构设置新项目。

## 常用命令

设置 Speco Tasker 后，您可以使用这些命令（通过 AI 提示或 CLI）：

```bash
# 解析 PRD 并生成任务
task-master parse-prd your-prd.txt

# 列出所有任务
task-master list

# 显示下一个要处理的任务
task-master next

# 生成任务文件
task-master generate
```

## 设置 Cursor AI 集成

Speco Tasker 设计为与 [Cursor AI](https://www.cursor.so/) 无缝协作，为手动开发提供结构化的工作流程。

### 使用 Cursor 和 MCP（推荐）

如果您已经在 Cursor 中设置了 Speco Tasker 的 MCP 集成，则集成是自动的。您可以简单地使用自然语言与 Speco Tasker 交互：

```
What tasks are available to work on next?
Can you analyze the complexity of our tasks?
I'd like to implement task 4. What does it involve?
```

### 手动 Cursor 设置

如果您不使用 MCP，您仍然可以设置 Cursor 集成：

1. 初始化项目后，在 Cursor 中打开它
2. `.cursor/rules/dev_workflow.mdc` 文件会被 Cursor 自动加载，为 AI 提供任务管理系统知识
3. 将您的 PRD 文档放置在 `.taskmaster/docs/` 目录中（例如：`.taskmaster/docs/prd.txt`）
4. 打开 Cursor 的 AI 聊天并切换到代理模式

### Cursor 中的替代 MCP 设置

您也可以在 Cursor 设置中设置 MCP 服务器：

1. 转到 Cursor 设置
2. 导航到 MCP 部分
3. 点击"添加新的 MCP 服务器"
4. 使用以下详细信息进行配置：
   - 名称："Speco Tasker"
   - 类型："命令"
   - 命令："npx -y --package=task-master-ai task-master-ai"
5. 保存设置

配置完成后，您可以直接通过 Cursor 的界面与 Speco Tasker 的任务管理命令进行交互，提供更集成的体验。

## 初始任务生成

在 Cursor 的 AI 聊天中，指示代理从您的 PRD 生成任务：

```
Please use the task-master parse-prd command to generate tasks from my PRD. The PRD is located at .taskmaster/docs/prd.txt.
```

代理将执行：

```bash
task-master parse-prd .taskmaster/docs/prd.txt
```

这将：

- 解析您的 PRD 文档
- 生成包含任务、依赖关系、优先级和测试策略的结构化 `tasks.json` 文件
- 代理将通过其配置理解此过程

### 生成单个任务文件

接下来，要求代理从 tasks.json 生成单个任务文件：

```
Please generate individual task files from tasks.json
```

代理将执行：

```bash
task-master generate
```

这会在 `tasks/` 目录中创建单个任务文件（例如：`task_001.txt`、`task_002.txt`），使引用特定任务更容易。

## AI 驱动的开发工作流程

Cursor 代理配置为遵循以下工作流程：

### 1. 任务发现和选择

要求代理列出可用任务：

```
What tasks are available to work on next?
```

```
Can you show me tasks 1, 3, and 5 to understand their current status?
```

代理将：

- 运行 `task-master list` 查看所有任务
- 运行 `task-master next` 确定下一个要处理的任务
- 运行 `task-master show 1,3,5` 显示多个任务及交互选项
- 分析依赖关系以确定哪些任务已准备好处理
- 根据优先级和 ID 顺序对任务进行优先级排序
- 建议要实现的下一个任务

### 2. 任务实现

实现任务时，代理将：

- 引用任务的详细信息部分以获取实现细节
- 考虑对之前任务的依赖关系
- 遵循项目的编码标准
- 根据任务的 testStrategy 创建适当的测试

您可以询问：

```
Let's implement task 3. What does it involve?
```

### 2.1. 查看多个任务

为了高效的上下文收集和批量操作：

```
Show me tasks 5, 7, and 9 so I can plan my implementation approach.
```

代理将：

- 运行 `task-master show 5,7,9` 显示紧凑的摘要表格
- 显示任务状态、优先级和进度指示器
- 提供带有批量操作的交互式操作菜单
- 允许您执行组操作，如将多个任务标记为进行中

### 3. 任务验证

在标记任务为完成之前，请根据以下内容进行验证：

- 任务指定的 testStrategy
- 代码库中的任何自动化测试
- 如需要的手动验证

### 4. 任务完成

当任务完成时，告诉代理：

```
Task 3 is now complete. Please update its status.
```

代理将执行：

```bash
task-master set-status --id=3 --status=done
```

### 5. 处理实现偏差

如果在实现过程中您发现：

- 当前方法与计划有重大差异
- 由于当前实现选择需要修改未来任务
- 出现了新的依赖关系或需求

告诉代理：

```
We've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks (from ID 4) to reflect this change?
```

代理将执行：

```bash
task-master update --from=4 --prompt="Now we are using MongoDB instead of PostgreSQL."

# 或者，如果需要研究 MongoDB 的最佳实践：
task-master update --from=4 --prompt="Update to use MongoDB, researching best practices" --research
```

这将重写或重新调整 tasks.json 中的后续任务，同时保留已完成的工作。

### 6. 重组任务

如果您需要重组任务结构：

```
I think subtask 5.2 would fit better as part of task 7 instead. Can you move it there?
```

代理将执行：

```bash
task-master move --from=5.2 --to=7.3
```

您可以通过多种方式重组任务：

- 将独立任务移动为子任务：`--from=5 --to=7`
- 将子任务移动为独立任务：`--from=5.2 --to=7`
- 将子任务移动到不同的父任务：`--from=5.2 --to=7.3`
- 在同一父任务内重新排序子任务：`--from=5.2 --to=5.4`
- 将任务移动到新的 ID 位置：`--from=5 --to=25`（即使任务 25 还不存在）
- 一次移动多个任务：`--from=10,11,12 --to=16,17,18`（必须具有相同数量的 ID，Taskmaster 将逐个查看每个位置）

将任务移动到新 ID 时：

- 系统会为不存在的目标 ID 自动创建占位符任务
- 这可以防止重组期间意外丢失数据
- 任何依赖于移动任务的任务都将更新其依赖关系
- 移动父任务时，所有子任务都会自动与其一起移动并重新编号

当您的项目理解演变并且需要优化任务结构时，这特别有用。

### 7. 解决任务合并冲突

与团队合作时，如果多个团队成员在不同分支上创建任务，您可能会遇到 tasks.json 文件的合并冲突。move 命令使解决这些冲突变得简单：

```
I just merged the main branch and there's a conflict with tasks.json. My teammates created tasks 10-15 while I created tasks 10-12 on my branch. Can you help me resolve this?
```

代理将帮助您：

1. 保留您队友的任务（10-15）
2. 将您的任务移动到新位置以避免冲突：

```bash
# 将您的任务移动到新位置（例如：16-18）
task-master move --from=10 --to=16
task-master move --from=11 --to=17
task-master move --from=12 --to=18
```

这种方法保留了每个人的工作，同时维护干净的任务结构，使处理任务冲突比尝试手动合并 JSON 文件更容易。

### 8. 拆分复杂任务

对于需要更多粒度的复杂任务：

```
Task 5 seems complex. Can you break it down into subtasks?
```

代理将执行：

```bash
task-master expand --id=5 --num=3
```

您可以提供额外上下文：

```
Please break down task 5 with a focus on security considerations.
```

代理将执行：

```bash
task-master expand --id=5 --prompt="Focus on security aspects"
```

您也可以展开所有待处理任务：

```
Please break down all pending tasks into subtasks.
```

代理将执行：

```bash
task-master expand --all
```

对于使用配置的研究模型的研究支持的子任务生成：

```
Please break down task 5 using research-backed generation.
```

代理将执行：

```bash
task-master expand --id=5 --research
```

## Example Cursor AI Interactions

### Starting a new project

```
I've just initialized a new project with Speco Tasker. I have a PRD at .taskmaster/docs/prd.txt.
Can you help me parse it and set up the initial tasks?
```

### Working on tasks

```
What's the next task I should work on? Please consider dependencies and priorities.
```

### Implementing a specific task

```
I'd like to implement task 4. Can you help me understand what needs to be done and how to approach it?
```

### Managing subtasks

```
I need to regenerate the subtasks for task 3 with a different approach. Can you help me clear and regenerate them?
```

### Handling changes

```
We've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks to reflect this change?
```

### Completing work

```
I've finished implementing the authentication system described in task 2. All tests are passing.
Please mark it as complete and tell me what I should work on next.
```

### Analyzing complexity

```
Can you analyze the complexity of our tasks to help me understand which ones need to be broken down further?
```

### Viewing complexity report

```
Can you show me the complexity report in a more readable format?
```

### 研究驱动的开发

Speco Tasker 包含一个强大的研究工具，它提供了超出 AI 知识截止日期的新鲜、最新的信息。这对于以下情况特别有价值：

#### 获取当前最佳实践

```
Before implementing task 5 (authentication), research the latest JWT security recommendations.
```

代理将执行：

```bash
task-master research "Latest JWT security recommendations 2024" --id=5
```

#### 带项目上下文的研究

```
Research React Query v5 migration strategies for our current API implementation.
```

代理将执行：

```bash
task-master research "React Query v5 migration strategies" --files=src/api.js,src/hooks.js
```

#### 研究和更新模式

一个强大的工作流程是先研究，然后用发现更新任务：

```
Research the latest Node.js performance optimization techniques and update task 12 with the findings.
```

代理将：

1. 运行研究：`task-master research "Node.js performance optimization 2024" --id=12`
2. 更新任务：`task-master update-subtask --id=12.2 --prompt="Updated with latest performance findings: [research results]"`

#### 何时使用研究

- **在实现任何新技术之前**
- **遇到安全相关任务时**
- **进行性能优化任务时**
- **调试复杂问题时**
- **在做出架构决策之前**
- **更新依赖项时**

研究工具自动包含相关项目上下文，并提供新鲜信息，可以显著提高实现质量。

## Git 集成和标签管理

Speco Tasker 支持带标签的任务列表以进行多上下文开发，这在处理 git 分支或不同项目阶段时特别有用。

### 使用标签

标签提供隔离的任务上下文，允许您为不同的功能、分支或实验维护单独的任务列表：

```
I'm starting work on a new feature branch. Can you create a new tag for this work?
```

代理将执行：

```bash
# 基于您的当前 git 分支创建标签
task-master add-tag --from-branch
```

或者您可以使用特定名称创建标签：

```
Create a new tag called 'user-auth' for authentication-related tasks.
```

代理将执行：

```bash
task-master add-tag user-auth --description="User authentication feature tasks"
```

### 在上下文之间切换

在处理不同功能或分支时：

```
Switch to the 'user-auth' tag context so I can work on authentication tasks.
```

代理将执行：

```bash
task-master use-tag user-auth
```

### 在标签之间复制任务

当您需要在上下文之间复制工作时：

```
Copy all tasks from the current tag to a new 'testing' tag for QA work.
```

代理将执行：

```bash
task-master add-tag testing --copy-from-current --description="QA and testing tasks"
```

### 标签管理

查看和管理您的标签上下文：

```
Show me all available tags and their current status.
```

代理将执行：

```bash
task-master tags --show-metadata
```

### 带标签任务列表的好处

- **分支隔离**：每个 git 分支可以有自己的任务上下文
- **防止合并冲突**：不同标签中的任务不会相互干扰
- **并行开发**：多个团队成员可以在单独的上下文中工作
- **上下文切换**：轻松在不同的项目阶段或功能之间切换
- **实验性工作**：创建实验性任务列表而不影响主要工作

### Git 工作流程集成

使用 Speco Tasker 标签的典型 git 工作流程：

1. **创建功能分支**：`git checkout -b feature/user-auth`
2. **创建匹配标签**：要求代理运行 `task-master add-tag --from-branch`
3. **在隔离上下文中工作**：所有任务操作都在新标签内工作
4. **根据需要切换上下文**：使用 `task-master use-tag <name>` 在不同的工作流之间切换
5. **合并和清理**：合并分支后，可选择使用 `task-master delete-tag <name>` 删除标签

这个工作流程确保您的任务管理保持有组织，并且在与团队合作或处理多个功能时冲突最小化。
