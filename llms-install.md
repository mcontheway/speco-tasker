# Speco Tasker Installation Guide

This guide helps AI assistants install and configure Speco Tasker for users in their development projects.

## What is Speco Tasker?

Speco Tasker is a pure manual task management system designed for development workflows. It helps break down projects into manageable tasks, track dependencies, and maintain development momentum through structured planning - completely without AI assistance.

## Installation Steps

### Step 1: Add MCP Configuration

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

### Step 2: System Requirements

Speco Tasker is a pure manual task management system with zero external dependencies:

- ✅ **No API keys required** - Works completely offline
- ✅ **No internet connection needed** - All operations are local
- ✅ **No external services** - Zero cost, zero privacy concerns
- ✅ **Node.js 18+** - Only requirement for running the tool

### Step 3: Initialize Project

Once the MCP server is configured, initialize Speco Tasker in the user's project:

> Can you initialize Speco Tasker in my project?

This will run the `initialize_project` tool to set up the basic file structure.

### Step 4: Create Initial Tasks

Users can create tasks manually through natural language commands:

**Manual Task Creation**

> Can you help me add my first task: [describe the task]

You can also create tasks from scratch or organize existing work into the task management system.

## Common Usage Patterns

### Daily Workflow

> What's the next task I should work on?
> Can you show me the details for task [ID]?
> Can you mark task [ID] as done?

### Task Management

> Can you break down task [ID] into subtasks?
> Can you add a new task: [description]
> Can you show me task dependencies?

### Project Organization

> Can you show me all my pending tasks?
> Can you move task [ID] to become a subtask of [parent ID]?
> Can you update task [ID] with this new information: [details]

## Verification Steps

After installation, verify everything is working:

1. **Check MCP Connection**: The AI should be able to access Speco Tasker tools
2. **Test Basic Commands**: Try `get_tasks` to list current tasks
3. **Verify Offline Operation**: Confirm all functions work without internet connection

Speco Tasker works completely offline with zero external dependencies.

## Troubleshooting

**If MCP server doesn't start:**

- Verify the JSON configuration is valid
- Check that Node.js 18+ is installed
- Ensure the package name is correct (`speco-tasker`)

## CLI Fallback

Speco Tasker is also available via CLI commands, by installing with `npm install speco-tasker@latest` in a terminal. Running `task-master help` will show all available commands, which offer a 1:1 experience with the MCP server.

## Next Steps

Once installed, users can:

- Create new tasks manually with `add-task`
- Organize tasks with dependencies and subtasks
- Track progress with status updates
- Use tagging for multi-context development
- Manage complex projects with hierarchical task structures

For detailed documentation, refer to the Speco Tasker docs directory.``
