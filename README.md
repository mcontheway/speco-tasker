<div align="center">
  <h1>Speco Tasker</h1>
  <p><strong>纯净的任务管理系统 | Pure Task Management System</strong></p>
  <p><em>基于 <a href="https://github.com/eyaltoledano/claude-task-master">claude-task-master</a> 二次开发，完全移除 AI 功能</em></p>
  <p>可通过 Cursor 等 AI 编辑器内置 Agent 调用的任务管理工具</p>
  <p>Task management tool callable by built-in Agents in AI editors like Cursor</p>
</div>

## ✨ 核心功能 | Core Features

- **📋 任务管理 | Task Management** - 完整的任务 CRUD 操作，支持状态跟踪和子任务管理 | Complete task CRUD operations with status tracking and subtask management
- **🏷️ 多标签系统 | Multi-tag System** - 按功能、分支、环境组织任务，支持跨标签移动 | Organize tasks by features, branches, environments with cross-tag movement support
- **🔗 依赖管理 | Dependency Management** - 智能的任务依赖关系管理和循环检测 | Intelligent task dependency management with cycle detection
- **🛡️ 安全验证 | Security Validation** - 先进的文件系统安全验证和路径保护 | Advanced filesystem security validation and path protection
- **⚙️ 路径配置 | Path Configuration** - 动态路径映射和跨平台兼容性 | Dynamic path mapping and cross-platform compatibility
- **📊 进度追踪 | Progress Tracking** - 可视化进度显示和统计报告 | Visual progress display and statistical reporting

### 📦 安装 | Installation

```bash
# 全局安装 CLI 工具 | Install CLI tool globally
npm install -g speco-tasker

# 或本地安装 | Or install locally
npm install speco-tasker
```

### 🔧 MCP 配置 | MCP Configuration

#### 一键添加到 Cursor | Add to Cursor

[<img src="https://cursor.com/deeplink/mcp-install-dark.png" alt="Add Speco Tasker to Cursor" height="32">](cursor://anysphere.cursor-deeplink/mcp/install?name=speco-tasker&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJzcGVjby10YXNrZXIiXX0K)

#### 手动配置 | Manual Configuration

##### Cursor 用户 | Cursor Users
添加以下配置到 `~/.cursor/mcp.json`：
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

#### VS Code 用户 | VS Code Users
添加以下配置到 `settings.json`：
```json
{
  "mcp.servers": {
    "speco-tasker": {
      "command": "npx",
      "args": ["speco-tasker"],
      "type": "stdio"
    }
  }
}
```

### 🎯 基础使用 | Basic Usage

```bash
# 初始化项目（自动检测配置）| Initialize project (auto-detect configuration)
speco-tasker init

# 查看任务列表 | View task list
speco-tasker list

# 查看下一个任务 | View next task
speco-tasker next

# 创建新任务 | Create new task
speco-tasker add-task --title "Feature Name" --description "Feature Description" --details "Implementation Details" --test-strategy "Testing Strategy" --spec-files "docs/spec.md"

# 更新任务状态 | Update task status
speco-tasker set-status --id=1 --status=done

# 管理标签 | Manage tags
speco-tasker add-tag feature-branch
speco-tasker use-tag feature-branch

# 跨标签移动任务 | Move tasks across tags
speco-tasker move --from=1 --from-tag=main --to-tag=feature-branch
```

## 📚 文档 | Documentation

- [📖 安装指南 | Installation Guide](docs/installation-guide.md) - 详细安装和配置说明 | Detailed installation and configuration instructions
- [📋 命令参考 | Command Reference](docs/comprehensive-cli-mcp-reference.md) - 完整 CLI 和 MCP 工具参考 | Complete CLI and MCP tool reference
- [📚 使用教程 | Tutorial](docs/tutorial.md) - 开发工作流程教程 | Development workflow tutorial
- [🔄 跨标签移动 | Cross-tag Movement](docs/cross-tag-task-movement.md) - 跨标签任务移动指南 | Cross-tag task movement guide

## 📄 许可证 | License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情 | This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.