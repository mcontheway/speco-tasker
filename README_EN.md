<div align="center">
  <h1>Speco Tasker</h1>
  <p><strong>Pure Manual Task Management System</strong></p>
  <p>Optimized task management tool for Cursor, Windsurf and other AI editor built-in agents</p>
</div>

## 🌐 Language Switch

- [中文版本](README.md) | English Version

---

## 📖 About Speco Tasker

**Speco Tasker** is a pure version of [TaskMaster-AI](https://github.com/eyaltoledano/claude-task-master), completely removing all AI features, designed for modern AI editors.

### 🤔 Why Remove AI Features?

Built-in agents in AI editors like Cursor and Windsurf have natural advantages:

- **No Configuration Steps** - No additional external AI service configuration required
- **Lower Cost** - Direct use of editor built-in resources
- **Better Context** - Agent has better understanding of project context
- **Natural Integration** - Perfect integration with editor ecosystem

### ✅ Core Features

#### 📋 Task Management System
- **Full CRUD Operations** - Create, read, update, delete tasks
- **Status Tracking** - pending, in-progress, done, review, deferred, cancelled
- **Subtask Management** - Multi-level task decomposition and organization
- **Batch Operations** - Support bulk status updates and operations for multiple tasks

#### 🏷️ Multi-Tag System
- **Tag Organization** - Organize tasks by function, branch, environment, or project phase
- **Tag Switching** - Quick switching between different work contexts
- **Cross-Tag Movement** - Support task movement and copying between different tags
- **Tag Management** - Create, rename, delete, merge tags
- **Parallel Development** - Support multiple development streams simultaneously

#### 🔗 Smart Dependency Management
- **Dependency Setup** - Set prerequisite and subsequent dependencies for tasks
- **Dependency Validation** - Automatic validation of dependency validity and completeness
- **Cycle Detection** - Intelligent detection and prevention of circular dependencies
- **Dependency Repair** - Automatic repair of invalid or corrupted dependencies
- **Dependency Visualization** - Display task dependency status and hierarchical relationships

#### 📊 Progress Tracking & Analytics
- **Completion Statistics** - Visual progress bars and percentage displays
- **Task Counting** - Count tasks by status, tag, priority
- **Time Tracking** - Record task creation, update, completion times
- **Workload Assessment** - Estimate workload based on task complexity
- **Report Generation** - Generate detailed project progress and status reports

#### 🔄 Advanced Task Operations
- **Task Movement** - Support task reordering and reorganization at different positions
- **Task Splitting** - Break down complex tasks into multiple subtasks
- **Task Merging** - Merge related tasks into larger tasks
- **Task Copying** - Copy task templates between different tags
- **Task Search** - Support ID, title, content keyword search

#### 📝 Documentation & Integration
- **Document Generation** - Auto-generate task Markdown documentation
- **MCP Integration** - Deep integration with Cursor, Windsurf and other AI editors
- **CLI Tools** - Complete command-line interface support
- **Configuration Management** - Flexible project configuration and personalization
- **Cross-Platform Support** - Support Windows, macOS, Linux

## ⚙️ Configuration and Usage

### Installation

```bash
# Global installation
npm install -g speco-tasker

# Initialize project
task-master init
```

### MCP Configuration

**Cursor Users:**
```json
{
  "mcpServers": {
    "speco-tasker": {
      "command": "npx",
      "args": ["speco-tasker"]
    }
  }
}
```

**VS Code Users:**
```json
{
  "servers": {
    "speco-tasker": {
      "command": "npx",
      "args": ["speco-tasker"],
      "type": "stdio"
    }
  }
}
```

### Basic Usage

```bash
# View task list
task-master list

# View next task
task-master next

# Create new task (Spec-driven development)
task-master add-task --title "User Authentication" --description "Implement JWT user authentication" --details "Use JWT library for token generation and validation" --test-strategy "Unit tests for token generation, integration tests for auth flow" --spec-files "docs/auth-spec.md"

# Update task status
task-master set-status --id=1 --status=done

# Manage tags
task-master add-tag feature-name
task-master use-tag feature-name
```
