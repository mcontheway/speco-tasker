# Task Master AI Removal Migration Guide

This guide helps users migrate from the AI-powered Task Master to the new pure manual version (`taskmaster-no-ai`).

## Overview

Task Master has been completely refactored to remove all AI dependencies and become a pure manual task management system. This change eliminates the need for API keys and external AI services while maintaining all core task management functionality.

## What Changed

### Removed Features
- ❌ AI-powered task generation from PRDs
- ❌ AI-assisted task expansion and breakdown
- ❌ AI research capabilities
- ❌ AI model configuration and management
- ❌ All external AI provider integrations (Anthropic, OpenAI, etc.)

### Retained Features
- ✅ Manual task creation and management
- ✅ Task dependencies and status tracking
- ✅ Subtask management
- ✅ Tag-based task organization
- ✅ MCP server integration (for Cursor/VS Code)
- ✅ Command-line interface
- ✅ All manual task operations

## Migration Steps

### 1. Backup Your Data
Before migrating, backup your existing `.taskmaster/` directory:

```bash
# Backup existing Task Master data
cp -r .taskmaster .taskmaster-backup-ai
```

### 2. Remove Old Installation
Uninstall the AI version:

```bash
# Remove globally installed AI version
npm uninstall -g task-master-ai

# Remove locally installed AI version (if applicable)
npm uninstall task-master-ai
```

### 3. Install New Version
Install the pure manual version:

```bash
# Install globally
npm install -g taskmaster-no-ai

# Or install locally in your project
npm install taskmaster-no-ai
```

### 4. Update MCP Configuration
Update your MCP configuration to remove API keys:

**Cursor (.cursor/mcp.json):**
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

**VS Code (.vscode/mcp.json):**
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

### 5. Reinitialize Project
Reinitialize Task Master in your project:

```bash
# Initialize the new version
task-master init

# Note: The new version does not support automatic PRD parsing
# You will need to create tasks manually
```

### 6. Manual Task Creation
Since AI-powered PRD parsing is removed, create tasks manually:

```bash
# Create your first task
task-master add-task --title "Set up project structure" --description "Create basic directory structure and configuration files"

# Create more tasks as needed
task-master add-task --title "Implement user authentication" --description "Add user login and registration functionality"

# View all tasks
task-master list
```

### 7. Update Workflows
Replace AI-dependent workflows with manual processes:

**Old AI Workflow:**
```
1. Write PRD
2. Ask AI: "Parse my PRD at docs/prd.txt"
3. Ask AI: "What's the next task?"
4. Ask AI: "Help me implement task 3"
```

**New Manual Workflow:**
```
1. Write PRD
2. Manually create tasks: task-master parse-prd docs/prd.txt (Note: This now only reads plain text, no AI analysis)
3. Check next task: task-master next
4. View task details: task-master show 3
5. Implement manually based on task description
```

## Breaking Changes

### Command Changes
- `task-master parse-prd` now only accepts plain text files (no AI analysis)
- Removed all AI-related commands:
  - `task-master models` (model configuration)
  - `task-master research` (AI research)
  - `task-master update` (AI-powered task updates)
  - `task-master expand --research` (AI research expansion)

### Configuration Changes
- Removed `.taskmaster/config.json` AI model settings
- No longer requires API keys in environment variables
- Simplified MCP configuration (no environment variables needed)

### File Structure Changes
- Removed `src/ai-providers/` directory
- Removed `src/prompts/` directory
- Removed AI-related modules from `scripts/modules/`

## New Capabilities

While AI features were removed, the new version offers:

### Improved Performance
- ⚡ Faster startup times (no AI initialization)
- 💾 Lower memory usage
- 🔒 No external API dependencies

### Enhanced Reliability
- 🛠️ No API rate limits or outages
- 🔄 Consistent behavior across environments
- 📦 Self-contained operation

### Simplified Setup
- 🚀 No API key configuration required
- 📝 Straightforward installation
- 🧹 Minimal dependencies

## Troubleshooting

### Common Issues

**"Command not found" after installation:**
```bash
# Try using npx
npx taskmaster-no-ai --help

# Or reinstall globally
npm install -g taskmaster-no-ai
```

**Old tasks not loading:**
The new version maintains backward compatibility with existing task files. If you encounter issues:
```bash
# Check task file format
cat .taskmaster/tasks/tasks.json

# Reinitialize if needed
rm -rf .taskmaster/
task-master init
```

**MCP server not connecting:**
1. Verify MCP configuration syntax
2. Restart your editor
3. Check that the package is properly installed

### Getting Help

- 📖 Check the updated documentation in `docs/`
- 🐛 Report issues on GitHub
- 💬 Community discussions (when available)

## Benefits of the Change

### For Individual Developers
- **Cost Savings**: No API key expenses
- **Privacy**: All data stays local
- **Reliability**: No external service dependencies
- **Performance**: Faster operation without AI overhead

### For Teams
- **Consistency**: Same behavior across all environments
- **Security**: No sensitive API keys to manage
- **Compliance**: Better for air-gapped or restricted environments
- **Maintenance**: Fewer moving parts to maintain

### For Organizations
- **Scalability**: No API rate limiting concerns
- **Compliance**: Meets strict data residency requirements
- **Cost Control**: Predictable operational costs
- **Simplicity**: Easier deployment and management

## Future Plans

The pure manual version establishes a solid foundation for future enhancements:

- 🔧 Enhanced manual task management features
- 📊 Improved reporting and analytics
- 🔗 Better integration with development tools
- 📱 Potential GUI interfaces
- 🌐 Web-based interfaces

## Summary

The migration to `taskmaster-no-ai` represents a strategic shift toward simplicity and reliability. While AI-powered features provided convenience, the manual approach offers better performance, security, and maintainability for most use cases.

The core task management functionality remains intact, ensuring that all your project planning and tracking needs are still met with a more robust and dependable solution.