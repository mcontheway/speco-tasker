<a name="readme-top"></a>

<div align='center'>
<a href="https://github.com/mcontheway/taskmaster-no-ai" target="_blank"><img src="https://img.shields.io/badge/TaskMaster-Project-blue?style=for-the-badge&logo=github" alt="TaskMaster Project" style="width: 250px; height: 55px;" width="250" height="55"/></a>
</div>

<p align="center">
  <img src="./images/logo.png?raw=true" alt="Taskmaster logo">
</p>

<p align="center">
<b>Taskmaster</b>: A pure manual task management system for efficient development workflows, designed to work seamlessly with any development environment.
</p>

<p align="center">
  <!-- TODO: Add Discord server link when available -->
  <!-- TODO: Add documentation site link when available -->
</p>

<p align="center">
  <a href="https://github.com/mcontheway/taskmaster-no-ai/actions/workflows/ci.yml"><img src="https://github.com/mcontheway/taskmaster-no-ai/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcontheway/taskmaster-no-ai/stargazers"><img src="https://img.shields.io/github/stars/mcontheway/taskmaster-no-ai?style=social" alt="GitHub stars"></a>
  <!-- TODO: Add npm version badge when package is published -->
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT%20with%20Commons%20Clause-blue.svg" alt="License"></a>
</p>

<p align="center">
  <!-- TODO: Add NPM download badges when package is published -->
</p>

## TaskMaster Project

*Streamlining Manual Development Workflows*

A pure manual task management system for efficient development workflows, designed to work seamlessly with any development environment.

## Documentation

📚 <!-- TODO: Add documentation site link when available -->

<!-- TODO: Add documentation site description when available -->

### Quick Reference

The following documentation is also available in the `docs` directory:

- [Configuration Guide](docs/configuration.md) - Set up environment variables and customize Task Master
- [Tutorial](docs/tutorial.md) - Step-by-step guide to getting started with Task Master
- [Command Reference](docs/command-reference.md) - Complete list of all available commands
- [Task Structure](docs/task-structure.md) - Understanding the task format and features
- [Examples](docs/examples.md) - Common usage examples and workflows
- [Migration Guide](docs/migration-guide.md) - Guide to migrating to the new project structure

#### Manual Installation for Cursor

<!-- TODO: Add Cursor one-click installation link when MCP server is published -->
<!-- TODO: Add installation instructions when ready -->

> **Note:** <!-- TODO: Update installation notes when MCP server is published -->

## Requirements

Taskmaster is a pure manual task management system that requires no external API keys or AI services. It works entirely offline and focuses on manual task management workflows.

**System Requirements:**
- Node.js 18+ and npm
- Any code editor or IDE
- Git (recommended for version control)

## Quick Start

### Option 1: MCP (Recommended)

MCP (Model Control Protocol) lets you run Task Master directly from your editor.

#### 1. Add your MCP config at the following path depending on your editor

| Editor       | Scope   | Linux/macOS Path                      | Windows Path                                      | Key          |
| ------------ | ------- | ------------------------------------- | ------------------------------------------------- | ------------ |
| **Cursor**   | Global  | `~/.cursor/mcp.json`                  | `%USERPROFILE%\.cursor\mcp.json`                  | `mcpServers` |
|              | Project | `<project_folder>/.cursor/mcp.json`   | `<project_folder>\.cursor\mcp.json`               | `mcpServers` |
| **Windsurf** | Global  | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | `mcpServers` |
| **VS Code**  | Project | `<project_folder>/.vscode/mcp.json`   | `<project_folder>\.vscode\mcp.json`               | `servers`    |

##### Manual Configuration

###### Cursor & Windsurf (`mcpServers`)

```json
{
  "mcpServers": {
    "taskmaster-no-ai": {
      "command": "npx",
      "args": ["-y", "--package=taskmaster-no-ai", "taskmaster-no-ai"]
    }
  }
}
```

> **Note**: Taskmaster is a pure manual system and requires no API keys or external services.

###### VS Code (`servers` + `type`)

```json
{
  "servers": {
    "taskmaster-no-ai": {
      "command": "npx",
      "args": ["-y", "--package=taskmaster-no-ai", "taskmaster-no-ai"],
      "type": "stdio"
    }
  }
}
```

#### 2. (Cursor-only) Enable Taskmaster MCP

Open Cursor Settings (Ctrl+Shift+J) ➡ Click on MCP tab on the left ➡ Enable taskmaster-no-ai with the toggle

#### 3. Initialize Task Master

In your terminal, run:

```txt
Initialize taskmaster-no-ai in my project
```

#### 4. Make sure you have a PRD (Recommended)

For **new projects**: Create your PRD at `.taskmaster/docs/prd.txt`  
For **existing projects**: You can use `scripts/prd.txt` or migrate with `task-master migrate`

An example PRD template is available after initialization in `.taskmaster/templates/example_prd.txt`.

> [!NOTE]
> While a PRD is recommended for complex projects, you can always create individual tasks by asking "Can you help me implement [description of what you want to do]?" in chat.

**Always start with a detailed PRD.**

The more detailed your PRD, the better the generated tasks will be.

#### 5. Common Commands

Use Task Master commands to:

- Parse requirements: `task-master parse-prd scripts/prd.txt`
- Plan next step: `task-master next`
- View tasks: `task-master list` or `task-master show 1`
- Create tasks: `task-master add-task --title "New Feature" --description "Description"`
- Update tasks: `task-master set-status --id=1 --status=done`
- Move tasks: `task-master move --from=1 --to=2`

[More examples](docs/examples.md)

### Option 2: Using Command Line

#### Installation

```bash
# Install globally
npm install -g taskmaster-no-ai

# OR install locally within your project
npm install taskmaster-no-ai
```

#### Initialize a new project

```bash
# If installed globally
task-master init

# If installed locally
npx task-master init

# Initialize project with specific rules
task-master init --rules cursor,windsurf,vscode
```

This will prompt you for project details and set up a new project with the necessary files and structure.

#### Common Commands

```bash
# Initialize a new project
task-master init

# Parse a PRD and generate tasks
task-master parse-prd your-prd.txt

# List all tasks
task-master list

# Show the next task to work on
task-master next

# Show specific task(s) - supports comma-separated IDs
task-master show 1,3,5

# Research fresh information with project context
task-master research "What are the latest best practices for JWT authentication?"

# Move tasks between tags (cross-tag movement)
task-master move --from=5 --from-tag=backlog --to-tag=in-progress
task-master move --from=5,6,7 --from-tag=backlog --to-tag=done --with-dependencies
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --ignore-dependencies

# Generate task files
task-master generate

# Add rules after initialization
task-master rules add windsurf,roo,vscode
```

## Claude Code Support

Task Master now supports Claude models through the Claude Code CLI, which requires no API key:

- **Models**: `claude-code/opus` and `claude-code/sonnet`
- **Requirements**: Claude Code CLI installed
- **Benefits**: No API key needed, uses your local Claude instance

[Learn more about Claude Code setup](docs/examples/claude-code-usage.md)

## Troubleshooting

### If `task-master init` doesn't respond

Try running it with Node directly:

```bash
node node_modules/claude-task-master/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/mcontheway/taskmaster-no-ai.git
cd taskmaster-no-ai
node scripts/init.js
```

## Contributors

<!-- TODO: Add contributors section when repository has contributors -->
<!-- TODO: Add contributors image when available -->

## Star History

<!-- TODO: Add Star History chart when repository has sufficient activity -->

## Licensing

Task Master is licensed under the MIT License with Commons Clause. This means you can:

✅ **Allowed**:

- Use Task Master for any purpose (personal, commercial, academic)
- Modify the code
- Distribute copies
- Create and sell products built using Task Master

❌ **Not Allowed**:

- Sell Task Master itself
- Offer Task Master as a hosted service
- Create competing products based on Task Master

See the [LICENSE](LICENSE) file for the complete license text and [licensing details](docs/licensing.md) for more information.
