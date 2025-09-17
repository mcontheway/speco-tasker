<div align="center">
  <h1>Speco Tasker</h1>
  <p><strong>纯净的任务管理系统 | Pure Task Management System</strong></p>
  <p>专为 Cursor、Windsurf 等 AI 编辑器内置 Agent 优化的任务管理工具</p>
  <p>Task management tool optimized for built-in Agents in AI editors like Cursor and Windsurf</p>
</div>

## 📚 文档导航 | Documentation Navigation

- [📖 快速开始](docs/installation-guide.md) - 安装和配置指南 | Installation and Configuration Guide
- [📝 更新日志](docs/changelog.md) - 版本更新历史 | Version Update History
- [📋 命令参考](docs/command-reference-zh.md) - 详细命令说明 | Detailed Command Reference
- [⚙️ 配置指南](docs/configuration-zh.md) - 配置选项详解 | Configuration Options Details

---

## 📖 关于 Speco Tasker | About Speco Tasker

**Speco Tasker** 是 [TaskMaster-AI](https://github.com/eyaltoledano/claude-task-master) 的纯净版本，完全移除了所有AI功能，专为现代AI编辑器设计。

**Speco Tasker** is a pure version of [TaskMaster-AI](https://github.com/eyaltoledano/claude-task-master), with all AI features completely removed, specifically designed for modern AI editors.

### 🤔 为什么移除AI功能？ | Why Remove AI Features?

在 Cursor、Windsurf 等 AI 编辑器中，内置 Agent 具有天然优势：

Built-in Agents in AI editors like Cursor and Windsurf have natural advantages:

- **免除配置步骤** - 无需额外配置外部AI服务 | **No Configuration Required** - No need to configure external AI services
- **降低使用成本** - 直接使用编辑器内置资源 | **Reduced Usage Cost** - Directly use built-in editor resources
- **上下文更充分** - Agent 对项目情况更为了解 | **More Context** - Agent has better understanding of project context
- **集成更自然** - 与编辑器生态系统完美融合 | **Natural Integration** - Perfect integration with editor ecosystem

### ✅ 核心功能 | Core Features

#### 📋 任务管理系统 | Task Management System
- **完整的CRUD操作** - 创建、读取、更新、删除任务 | **Complete CRUD Operations** - Create, Read, Update, Delete tasks
- **状态跟踪** - pending、in-progress、done、review、deferred、cancelled | **Status Tracking** - pending, in-progress, done, review, deferred, cancelled
- **子任务管理** - 支持多层级任务分解和组织 | **Subtask Management** - Support for multi-level task decomposition and organization
- **批量操作** - 支持多个任务的批量状态更新和操作 | **Batch Operations** - Support for batch status updates and operations on multiple tasks

#### 🏷️ 多标签系统 | Multi-Tag System
- **标签组织** - 按功能、分支、环境、项目阶段组织任务 | **Tag Organization** - Organize tasks by function, branch, environment, project phase
- **标签切换** - 快速切换不同的工作上下文 | **Tag Switching** - Quickly switch between different work contexts
- **跨标签移动** - 支持任务在不同标签间的移动和复制 | **Cross-Tag Movement** - Support for moving and copying tasks between different tags
- **标签管理** - 创建、重命名、删除、合并标签 | **Tag Management** - Create, rename, delete, merge tags
- **并行开发** - 支持多条开发线同时进行 | **Parallel Development** - Support for multiple development lines simultaneously

#### 🔗 智能依赖管理 | Intelligent Dependency Management
- **依赖设置** - 为任务设置前置和后续依赖关系 | **Dependency Setup** - Set prerequisite and subsequent dependency relationships for tasks
- **依赖验证** - 自动检查依赖关系的有效性和完整性 | **Dependency Validation** - Automatically check validity and completeness of dependency relationships
- **循环检测** - 智能检测和防止循环依赖关系 | **Cycle Detection** - Intelligently detect and prevent circular dependency relationships
- **依赖修复** - 自动修复无效或损坏的依赖关系 | **Dependency Repair** - Automatically fix invalid or broken dependency relationships
- **依赖可视化** - 显示任务的依赖状态和层级关系 | **Dependency Visualization** - Display task dependency status and hierarchical relationships

#### 📊 进度追踪与分析 | Progress Tracking & Analysis
- **完成度统计** - 可视化的进度条和百分比显示 | **Completion Statistics** - Visual progress bars and percentage display
- **任务计数** - 按状态、标签、优先级统计任务数量 | **Task Counting** - Count tasks by status, tag, priority
- **时间追踪** - 记录任务的创建、更新、完成时间 | **Time Tracking** - Record task creation, update, completion times
- **工作量评估** - 基于任务复杂度进行工作量预估 | **Workload Assessment** - Estimate workload based on task complexity
- **报告生成** - 生成详细的项目进度和状态报告 | **Report Generation** - Generate detailed project progress and status reports

#### 🔄 高级任务操作 | Advanced Task Operations
- **任务移动** - 支持任务在不同位置的重排序和重组 | **Task Movement** - Support for reordering and reorganizing tasks in different positions
- **任务拆分** - 将复杂任务分解为多个子任务 | **Task Splitting** - Break down complex tasks into multiple subtasks
- **任务合并** - 将相关任务合并为更大任务 | **Task Merging** - Merge related tasks into larger tasks
- **任务复制** - 在不同标签间复制任务模板 | **Task Copying** - Copy task templates between different tags
- **任务搜索** - 支持ID、标题、内容的关键字搜索 | **Task Search** - Support for ID, title, content keyword search

#### 📝 文档与集成 | Documentation & Integration
- **文档生成** - 自动生成任务Markdown文档 | **Document Generation** - Automatically generate task Markdown documents
- **MCP集成** - 与 Cursor、Windsurf 等AI编辑器的深度集成 | **MCP Integration** - Deep integration with AI editors like Cursor and Windsurf
- **CLI工具** - 完整的命令行界面支持 | **CLI Tools** - Complete command-line interface support
- **配置管理** - 灵活的项目配置和个性化设置 | **Configuration Management** - Flexible project configuration and personalized settings
- **跨平台支持** - 支持 Windows、macOS、Linux | **Cross-Platform Support** - Support for Windows, macOS, Linux

## ⚙️ 配置和使用 | Configuration & Usage

### 安装配置 | Installation & Setup

```bash
# 全局安装 | Global Installation
npm install -g speco-tasker

# 初始化项目 | Initialize Project
task-master init  # 自动检测配置，一键完成
```

### MCP 配置 | MCP Configuration

**Cursor 用户：| Cursor Users:**
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

**VS Code 用户：| VS Code Users:**
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

### 基础使用 | Basic Usage

```bash
# 查看任务列表 | View task list
task-master list

# 查看下一个任务 | View next task
task-master next

# 创建新任务（规范驱动开发） | Create new task (Specification-driven Development)
task-master add-task --title "用户认证" --description "实现JWT用户认证功能" --details "使用JWT库实现token生成和验证" --test-strategy "单元测试token生成，集成测试认证流程" --spec-files "docs/auth-spec.md"

# 更新任务状态 | Update task status
task-master set-status --id=1 --status=done

# 管理标签 | Manage tags
task-master add-tag feature-name
task-master use-tag feature-name
```