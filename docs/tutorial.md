# Speco Tasker 教程 | Tutorial

本教程将指导您设置和使用 Speco Tasker 进行纯手动开发工作流程。

This tutorial will guide you through setting up and using Speco Tasker for pure manual development workflows.

## 初始设置 | Initial Setup

设置 Speco Tasker 有两种方式：使用 MCP（推荐）或通过 npm 安装。

There are two ways to set up Speco Tasker: using MCP (recommended) or through npm installation.

### 选项 1：使用 MCP（推荐）| Option 1: Using MCP (Recommended)

MCP（模型控制协议）提供了在您的编辑器中直接开始使用 Speco Tasker 的最简单方式。

MCP (Model Control Protocol) provides the simplest way to start using Speco Tasker directly in your editor.

1. **安装包 | Install Package**

```bash
npm i -g speco-tasker
```

2. **将 MCP 配置添加到您的 IDE/MCP 客户端**（推荐使用 Cursor，但也支持其他客户端）：

**Add MCP configuration to your IDE/MCP client** (Cursor is recommended, but other clients are also supported):

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

**注意：** Speco Tasker 是一个纯手动任务管理系统，不需要 API 密钥或外部服务。

**Note:** Speco Tasker is a pure manual task management system that requires no API keys or external services.

3. **在编辑器设置中启用 MCP | Enable MCP in Editor Settings**

4. **在项目中初始化 Speco Tasker | Initialize Speco Tasker in Project**：

```bash
task-master init
```

初始化过程将会：

The initialization process will:

- 创建必要的项目结构 | Create the necessary project structure
- 设置初始配置文件 | Set up initial configuration files
- 指导您完成其余设置过程 | Guide you through the rest of the setup process

5. **开始手动创建任务 | Start Manually Creating Tasks**：

```bash
# 添加您的第一个任务 | Add your first task
task-master add-task --title="设置项目结构" --description="创建基本的项目目录结构和配置文件"

# 查看所有任务 | View all tasks
task-master list

# 查看下一个要处理的任务 | View the next task to work on
task-master next
```

### 选项 2：手动安装 | Option 2: Manual Installation

如果您更喜欢直接使用命令行界面：

If you prefer to use the command line interface directly:

```bash
# 全局安装 | Global installation
npm install -g speco-tasker

# 或者在项目中本地安装 | Or install locally in project
npm install speco-tasker
```

初始化新项目：

Initialize new project:

```bash
# 如果全局安装 | If globally installed
task-master init

# 如果本地安装 | If locally installed
npx task-master init
```

这将自动检测项目配置并使用必要的文件和结构设置新项目。

This will automatically detect project configuration and set up the new project with the necessary files and structure.

## 常用命令 | Common Commands

设置 Speco Tasker 后，您可以使用这些核心命令进行手动任务管理：

After setting up Speco Tasker, you can use these core commands for manual task management:

### 任务创建和管理 | Task Creation and Management

```bash
# 添加新任务 | Add new task
task-master add-task --title="任务标题" --description="任务详细描述"

# 列出所有任务 | List all tasks
task-master list

# 显示下一个要处理的任务 | Show next task to work on
task-master next

# 查看特定任务的详细信息 | View details of specific task
task-master show <task-id>

# 更新任务状态 | Update task status
task-master set-status --id=<task-id> --status=<status>

# 生成单个任务文件 | Generate single task file
task-master generate
```

### 子任务管理 | Subtask Management

```bash
# 为任务添加子任务 | Add subtask to task
task-master add-subtask --parent=<parent-id> --title="子任务标题"

# 从任务中移除子任务 | Remove subtask from task
task-master remove-subtask --id=<parent-id.subtask-id>

# 清除任务的所有子任务 | Clear all subtasks from task
task-master clear-subtasks --id=<task-id>
```

### 任务重组 | Task Reorganization

```bash
# 在任务层次结构中移动任务 | Move task within task hierarchy
task-master move --from=<source-id> --to=<destination-id>

# 添加任务依赖关系 | Add task dependency
task-master add-dependency --id=<task-id> --depends-on=<dependency-id>

# 移除任务依赖关系 | Remove task dependency
task-master remove-dependency --id=<task-id> --depends-on=<dependency-id>
```

## 设置 Cursor 集成 | Setting Up Cursor Integration

Speco Tasker 设计为与 [Cursor](https://www.cursor.so/) 无缝协作，为手动开发提供结构化的工作流程。

Speco Tasker is designed to work seamlessly with [Cursor](https://www.cursor.so/), providing structured workflows for manual development.

### 使用 Cursor 和 MCP（推荐）| Using Cursor with MCP (Recommended)

如果您已经在 Cursor 中设置了 Speco Tasker 的 MCP 集成，则集成是自动的。您可以直接通过 MCP 工具调用 Speco Tasker 的功能：

If you have already set up Speco Tasker's MCP integration in Cursor, the integration is automatic. You can call Speco Tasker functions directly through MCP tools:

```
# 通过MCP工具调用 | Call via MCP tools
get_tasks()              # 查看所有任务 | View all tasks
next_task()              # 获取下一个要处理的任务 | Get next task to work on
get_task({"id": "5"})    # 查看特定任务的详细信息 | View details of specific task
add_task({"title": "新任务", "description": "任务描述"})  # 添加新任务 | Add new task
set_task_status({"id": "5", "status": "done"})  # 更新任务状态 | Update task status
```

### 手动 Cursor 设置 | Manual Cursor Setup

如果您不使用 MCP，您仍然可以直接使用命令行：

If you don't use MCP, you can still use the command line directly:

1. 初始化项目后，在 Cursor 中打开它 | After initializing the project, open it in Cursor
2. 在终端中使用 Speco Tasker 命令进行任务管理 | Use Speco Tasker commands in terminal for task management
3. 使用 Cursor 的代码编辑功能来实现任务 | Use Cursor's code editing features to implement tasks

### Cursor 中的替代 MCP 设置 | Alternative MCP Setup in Cursor

您也可以在 Cursor 设置中设置 MCP 服务器：

You can also set up the MCP server in Cursor settings:

1. 转到 Cursor 设置 | Go to Cursor settings
2. 导航到 MCP 部分 | Navigate to MCP section
3. 点击"添加新的 MCP 服务器" | Click "Add new MCP server"
4. 使用以下详细信息进行配置：| Configure with the following details:
   - 名称："Speco Tasker" | Name: "Speco Tasker"
   - 类型："命令" | Type: "Command"
   - 命令："npx -y --package=speco-tasker speco-tasker" | Command: "npx -y --package=speco-tasker speco-tasker"
5. 保存设置 | Save settings

配置完成后，您可以直接通过 Cursor 的界面与 Speco Tasker 的 MCP 工具进行交互，提供更集成的体验。

Once configured, you can interact with Speco Tasker's MCP tools directly through Cursor's interface, providing a more integrated experience.

## 手动创建任务 | Manual Task Creation

Speco Tasker 专注于手动任务管理，您需要手动创建和组织任务。

Speco Tasker focuses on manual task management, requiring you to manually create and organize tasks.

### 创建您的第一个任务 | Create Your First Task

开始使用 Speco Tasker 的最简单方式是手动添加任务：

The simplest way to start using Speco Tasker is to manually add tasks:

```bash
# 创建一个项目设置任务 | Create a project setup task
task-master add-task --title="设置项目结构" --description="创建基本的项目目录结构，设置配置文件和依赖项"

# 创建一个开发任务 | Create a development task
task-master add-task --title="实现用户认证" --description="实现用户注册、登录和会话管理功能"

# 创建一个测试任务 | Create a testing task
task-master add-task --title="编写单元测试" --description="为用户认证功能编写完整的单元测试套件"
```

### 生成单个任务文件 | Generate Single Task Files

创建任务后，您可以生成单个任务文件以便更好地组织和引用：

After creating tasks, you can generate single task files for better organization and reference:

```bash
task-master generate
```

这会在 `tasks/` 目录中创建单个任务文件（例如：`task_001.txt`、`task_002.txt`），使引用特定任务更容易。

This creates single task files in the `tasks/` directory (e.g., `task_001.txt`, `task_002.txt`), making it easier to reference specific tasks.

### 查看和管理任务 | View and Manage Tasks

```bash
# 查看所有任务 | View all tasks
task-master list

# 查看下一个要处理的任务 | View next task to work on
task-master next

# 查看特定任务的详细信息 | View details of specific task
task-master show 1
```

## 手动开发工作流程 | Manual Development Workflow

Speco Tasker 支持结构化的手动开发工作流程：

Speco Tasker supports structured manual development workflows:

### 1. 任务发现和选择 | Task Discovery and Selection

查看可用任务并选择要处理的任务：

View available tasks and select the task to work on:

```bash
# 查看所有任务 | View all tasks
task-master list

# 查看下一个要处理的任务 | View next task to work on
task-master next

# 查看特定任务的详细信息 | View details of specific task
task-master show 1
```

### 2. 任务实现 | Task Implementation

实现任务时，您需要：

When implementing tasks, you need to:

- 阅读任务的详细信息部分以获取实现细节 | Read the task's details section for implementation specifics
- 考虑对之前任务的依赖关系 | Consider dependencies on previous tasks
- 遵循项目的编码标准 | Follow the project's coding standards
- 根据任务的需求创建适当的测试 | Create appropriate tests based on task requirements

### 3. 查看多个任务 | View Multiple Tasks

为了高效的上下文收集和批量操作：

For efficient context gathering and batch operations:

```bash
# 查看多个任务的详细信息 | View details of multiple tasks
task-master show 5,7,9
```

### 4. 任务验证 | Task Verification

在标记任务为完成之前，请根据以下内容进行验证：

Before marking a task as complete, verify based on:

- 任务的实现要求 | Task implementation requirements
- 代码库中的任何自动化测试 | Any automated tests in the codebase
- 如需要的手动验证 | Manual verification if needed

### 5. 任务完成 | Task Completion

当任务完成时，更新其状态：

When a task is completed, update its status:

```bash
task-master set-status --id=3 --status=done
```

### 6. 处理实现变更 | Handle Implementation Changes

如果在实现过程中您发现需要修改任务：

If you discover the need to modify tasks during implementation:

```bash
# 更新单个任务 | Update single task
task-master update-task --id=4 --title="修改后的标题"

# 添加新的子任务 | Add new subtask
task-master add-subtask --parent=4 --title="新的子任务"
```

### 7. 重组任务 | Reorganize Tasks

如果您需要重组任务结构：

If you need to reorganize the task structure:

```bash
# 将子任务移动到不同的父任务 | Move subtask to different parent task
task-master move --from=5.2 --to=7.3

# 将独立任务移动为子任务 | Move standalone task to become subtask
task-master move --from=5 --to=7

# 将子任务移动为独立任务 | Move subtask to become standalone task
task-master move --from=5.2 --to=7
```

您可以通过多种方式重组任务：

You can reorganize tasks in various ways:

- 将独立任务移动为子任务：`--from=5 --to=7` | Move standalone task to subtask: `--from=5 --to=7`
- 将子任务移动为独立任务：`--from=5.2 --to=7` | Move subtask to standalone task: `--from=5.2 --to=7`
- 将子任务移动到不同的父任务：`--from=5.2 --to=7.3` | Move subtask to different parent: `--from=5.2 --to=7.3`
- 在同一父任务内重新排序子任务：`--from=5.2 --to=5.4` | Reorder subtasks within same parent: `--from=5.2 --to=5.4`
- 将任务移动到新的 ID 位置：`--from=5 --to=25`（即使任务 25 还不存在）| Move task to new ID position: `--from=5 --to=25` (even if task 25 doesn't exist yet)
- 一次移动多个任务：`--from=10,11,12 --to=16,17,18`（必须具有相同数量的 ID，Taskmaster 将逐个查看每个位置）| Move multiple tasks at once: `--from=10,11,12 --to=16,17,18` (must have same number of IDs, Taskmaster will check each position individually)

将任务移动到新 ID 时：

When moving tasks to new IDs:

- 系统会为不存在的目标 ID 自动创建占位符任务 | System automatically creates placeholder tasks for non-existent target IDs
- 这可以防止重组期间意外丢失数据 | This prevents accidental data loss during reorganization
- 任何依赖于移动任务的任务都将更新其依赖关系 | Any tasks that depend on moved tasks will have their dependencies updated
- 移动父任务时，所有子任务都会自动与其一起移动并重新编号 | When moving parent tasks, all subtasks automatically move with them and get renumbered

当您的项目理解演变并且需要优化任务结构时，这特别有用。

This is especially useful when your project understanding evolves and you need to optimize the task structure.

### 8. 解决任务合并冲突 | Resolve Task Merge Conflicts

与团队合作时，如果多个团队成员在不同分支上创建任务，您可能会遇到 tasks.json 文件的合并冲突。move 命令使解决这些冲突变得简单：

When collaborating with a team, if multiple team members create tasks on different branches, you might encounter merge conflicts in the tasks.json file. The move command makes resolving these conflicts simple:

```bash
# 如果您的队友创建了任务10-15，而您创建了任务10-12
# 将您的任务移动到新位置以避免冲突

# If your teammate created tasks 10-15 and you created tasks 10-12
# Move your tasks to new positions to avoid conflicts

# 将您的任务移动到新位置（例如：16-18）
# Move your tasks to new positions (e.g.: 16-18)
task-master move --from=10 --to=16
task-master move --from=11 --to=17
task-master move --from=12 --to=18
```

这种方法保留了每个人的工作，同时维护干净的任务结构，使处理任务冲突比尝试手动合并 JSON 文件更容易。

This approach preserves everyone's work while maintaining a clean task structure, making it easier to handle task conflicts than trying to manually merge JSON files.

### 9. 拆分复杂任务 | Split Complex Tasks

对于需要更多粒度的复杂任务，您可以手动添加子任务：

For complex tasks that need more granularity, you can manually add subtasks:

```bash
# 为复杂任务添加子任务 | Add subtasks to complex task
task-master add-subtask --parent=5 --title="实现用户注册功能"

task-master add-subtask --parent=5 --title="实现用户登录功能"

task-master add-subtask --parent=5 --title="添加密码重置功能"
```

您也可以清除现有子任务后重新添加：

You can also clear existing subtasks and re-add them:

```bash
# 清除任务的所有子任务 | Clear all subtasks from task
task-master clear-subtasks --id=5

# 然后重新添加新的子任务 | Then re-add new subtasks
task-master add-subtask --parent=5 --title="新子任务"
```

## 实际使用示例 | Practical Usage Examples

### 开始新项目 | Start New Project

```bash
# 初始化项目 | Initialize project
task-master init

# 创建您的第一个任务 | Create your first task
task-master add-task --title="设置项目结构" --description="创建基本的项目目录结构"

# 查看任务列表 | View task list
task-master list
```

### 处理任务 | Process Tasks

```bash
# 查看下一个要处理的任务 | View next task to work on
task-master next

# 查看特定任务的详细信息 | View details of specific task
task-master show 1

# 开始处理任务 | Start working on task
task-master set-status --id=1 --status=in-progress
```

### 实现特定任务 | Implement Specific Tasks

```bash
# 为任务添加子任务 | Add subtask to task
task-master add-subtask --parent=1 --title="创建配置文件"

# 查看任务的完整详细信息 | View complete task details
task-master show 1
```

### 管理子任务 | Manage Subtasks

```bash
# 清除任务的所有子任务 | Clear all subtasks from task
task-master clear-subtasks --id=3

# 重新添加新的子任务
task-master add-subtask --parent=3 --title="新实现方法"
```

### 处理变更

```bash
# 更新任务标题
task-master update-task --id=4 --title="修改后的标题"

# 添加任务依赖关系
task-master add-dependency --id=5 --depends-on=4
```

### 完成工作

```bash
# 标记任务为完成
task-master set-status --id=2 --status=done

# 查看下一个要处理的任务
task-master next
```

### 管理任务依赖

```bash
# 添加依赖关系
task-master add-dependency --id=10 --depends-on=5

# 移除依赖关系
task-master remove-dependency --id=10 --depends-on=5

# 验证依赖关系
task-master validate-dependencies
```

### 高效的任务管理技巧

Speco Tasker 提供了多种手动任务管理技巧，帮助您更有效地组织和跟踪工作：

#### 批量任务管理

```bash
# 一次查看多个任务
task-master show 1,2,3,4

# 批量更新任务状态（如果支持）
task-master set-status --id=1,2,3 --status=done
```

#### 任务依赖管理

```bash
# 添加任务依赖关系
task-master add-dependency --id=5 --depends-on=3

# 查看哪些任务可以开始处理
task-master next

# 验证依赖关系是否正确
task-master validate-dependencies
```

#### 任务重组技巧

```bash
# 将复杂任务拆分为子任务
task-master add-subtask --parent=5 --title="第一步"
task-master add-subtask --parent=5 --title="第二步"
task-master add-subtask --parent=5 --title="第三步"

# 重新组织任务结构
task-master move --from=5.2 --to=6.1  # 将子任务移到其他父任务
```

#### 项目进度跟踪

```bash
# 查看所有任务状态
task-master list

# 查看特定状态的任务
task-master list --status=done
task-master list --status=in-progress

# 生成任务报告文件
task-master generate
```

#### 团队协作技巧

- **使用标签隔离不同功能的工作**：`task-master add-tag feature-auth`
- **定期同步任务状态**：确保团队成员了解最新进展
- **使用依赖关系协调工作**：避免多人同时处理相互依赖的任务

## Git 集成和标签管理

Speco Tasker 支持带标签的任务列表以进行多上下文开发，这在处理 git 分支或不同项目阶段时特别有用。

### 使用标签

标签提供隔离的任务上下文，允许您为不同的功能、分支或实验维护单独的任务列表：

```bash
# 基于您的当前 git 分支创建标签
task-master add-tag --from-branch

# 或者使用特定名称创建标签
task-master add-tag user-auth --description="User authentication feature tasks"
```

### 在上下文之间切换

在处理不同功能或分支时：

```bash
# 切换到特定的标签上下文
task-master use-tag user-auth

# 查看所有可用标签
task-master tags
```

### 在标签之间复制任务

当您需要在上下文之间复制工作时：

```bash
# 从当前标签复制任务到新标签
task-master add-tag testing --copy-from-current --description="QA and testing tasks"

# 从特定标签复制任务
task-master add-tag staging --copy-from production
```

### 标签管理

查看和管理您的标签上下文：

```bash
# 查看所有可用标签
task-master tags

# 查看标签的详细信息
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
2. **创建匹配标签**：`task-master add-tag --from-branch`
3. **在隔离上下文中工作**：所有任务操作都在新标签内工作
4. **根据需要切换上下文**：使用 `task-master use-tag <name>` 在不同的工作流之间切换
5. **合并和清理**：合并分支后，可选择使用 `task-master delete-tag <name>` 删除标签

这个工作流程确保您的任务管理保持有组织，并且在与团队合作或处理多个功能时冲突最小化。
