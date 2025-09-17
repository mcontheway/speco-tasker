# Speco Tasker 安装指南 | Installation Guide

本指南帮助AI助手为用户在开发项目中安装和配置Speco Tasker。

This guide helps AI assistants install and configure Speco Tasker for users in their development projects.

## 什么是Speco Tasker？| What is Speco Tasker?

Speco Tasker是一个纯手动任务管理系统，专为开发工作流设计。它帮助将项目分解为可管理的任务，跟踪依赖关系，并通过结构化规划保持开发势头 - 完全不需要AI辅助。

Speco Tasker is a pure manual task management system designed for development workflows. It helps break down projects into manageable tasks, track dependencies, and maintain development momentum through structured planning - completely without AI assistance.

## 安装步骤 | Installation Steps

### 步骤1：添加MCP配置 | Step 1: Add MCP Configuration

将以下配置添加到用户的MCP设置文件中（Cursor的`.cursor/mcp.json`，或其他编辑器的等效文件）：

Add the following configuration to the user's MCP settings file (`.cursor/mcp.json` for Cursor, or equivalent for other editors):

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

### 步骤2：系统要求 | Step 2: System Requirements

Speco Tasker是一个纯手动任务管理系统，零外部依赖：

Speco Tasker is a pure manual task management system with zero external dependencies:

- ✅ **无需API密钥** - 完全离线工作 | **No API keys required** - Works completely offline
- ✅ **无需互联网连接** - 所有操作都是本地的 | **No internet connection needed** - All operations are local
- ✅ **无需外部服务** - 零成本，零隐私担忧 | **No external services** - Zero cost, zero privacy concerns
- ✅ **Node.js 18+** - 运行工具的唯一要求 | **Node.js 18+** - Only requirement for running the tool

### 步骤3：初始化项目 | Step 3: Initialize Project

一旦MCP服务器配置完成，在用户的项目中初始化Speco Tasker：

Once the MCP server is configured, initialize Speco Tasker in the user's project:

> 你能在我的项目中初始化Speco Tasker吗？ | Can you initialize Speco Tasker in my project?

这将运行`initialize_project`工具来设置基本文件结构。

This will run the `initialize_project` tool to set up the basic file structure.

### 步骤4：创建初始任务 | Step 4: Create Initial Tasks

用户可以通过自然语言命令手动创建任务：

Users can create tasks manually through natural language commands:

**手动任务创建 | Manual Task Creation**

> 你能帮我添加我的第一个任务：[描述任务] | Can you help me add my first task: [describe the task]

您也可以从头创建任务或将现有工作组织到任务管理系统中。

You can also create tasks from scratch or organize existing work into the task management system.

## 常见使用模式 | Common Usage Patterns

### 日常工作流 | Daily Workflow

> 我应该处理哪个下一个任务？ | What's the next task I should work on?
> 你能显示任务[ID]的详细信息吗？ | Can you show me the details for task [ID]?
> 你能将任务[ID]标记为完成吗？ | Can you mark task [ID] as done?

### 任务管理 | Task Management

> 你能将任务[ID]分解为子任务吗？ | Can you break down task [ID] into subtasks?
> 你能添加一个新任务：[描述] | Can you add a new task: [description]
> 你能显示任务依赖关系吗？ | Can you show me task dependencies?

### 项目组织 | Project Organization

> 你能显示我所有待处理的任务吗？ | Can you show me all my pending tasks?
> 你能将任务[ID]移动为[父任务ID]的子任务吗？ | Can you move task [ID] to become a subtask of [parent ID]?
> 你能用这个新信息更新任务[ID]：[详细信息] | Can you update task [ID] with this new information: [details]

## 验证步骤 | Verification Steps

安装完成后，验证一切是否正常工作：

After installation, verify everything is working:

1. **检查MCP连接**：AI应该能够访问Speco Tasker工具 | **Check MCP Connection**: The AI should be able to access Speco Tasker tools
2. **测试基本命令**：尝试`get_tasks`来列出当前任务 | **Test Basic Commands**: Try `get_tasks` to list current tasks
3. **验证离线操作**：确认所有功能在没有互联网连接的情况下工作 | **Verify Offline Operation**: Confirm all functions work without internet connection

Speco Tasker完全离线工作，零外部依赖。

Speco Tasker works completely offline with zero external dependencies.

## 故障排除 | Troubleshooting

**如果MCP服务器没有启动：| If MCP server doesn't start:**

- 验证JSON配置是否有效 | Verify the JSON configuration is valid
- 检查是否安装了Node.js 18+ | Check that Node.js 18+ is installed
- 确保包名正确（`speco-tasker`）| Ensure the package name is correct (`speco-tasker`)

## CLI备用方案 | CLI Fallback

Speco Tasker也通过CLI命令提供，在终端中安装`npm install speco-tasker@latest`。运行`task-master help`将显示所有可用命令，这些命令与MCP服务器提供1:1的体验。

Speco Tasker is also available via CLI commands, by installing with `npm install speco-tasker@latest` in a terminal. Running `task-master help` will show all available commands, which offer a 1:1 experience with the MCP server.

## 后续步骤 | Next Steps

安装完成后，用户可以：

Once installed, users can:

- 使用`add-task`手动创建新任务 | Create new tasks manually with `add-task`
- 使用依赖关系和子任务组织任务 | Organize tasks with dependencies and subtasks
- 使用状态更新跟踪进度 | Track progress with status updates
- 使用标签进行多上下文开发 | Use tagging for multi-context development
- 使用层次任务结构管理复杂项目 | Manage complex projects with hierarchical task structures

有关详细文档，请参考Speco Tasker文档目录。

For detailed documentation, refer to the Speco Tasker docs directory.
