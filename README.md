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
- [🛡️ 路径配置指南](docs/path-config-guide.md) - 路径配置和安全验证 | Path Configuration and Security Guide
- [🧹 清理指南](docs/cleanup-guide.md) - AI内容清理指南 | AI Content Cleanup Guide
- [📚 使用教程](docs/tutorial.md) - 完整使用教程 | Complete Usage Tutorial

---

## 📖 关于 Speco Tasker | About Speco Tasker

**Speco Tasker** 是一个纯净的任务管理系统，完全移除了所有AI功能，专为现代AI编辑器设计，提供先进的文件系统安全验证和路径配置管理系统。

**Speco Tasker** is a pure task management system, completely removing all AI features, specifically designed for modern AI editors with advanced file system security validation and path configuration management system.

### 🤔 为什么移除AI功能？ | Why Remove AI Features?

在 Cursor、Windsurf 等 AI 编辑器中，内置 Agent 具有天然优势：

Built-in Agents in AI editors like Cursor and Windsurf have natural advantages:

- **免除配置步骤** - 无需额外配置外部AI服务 | **No Configuration Required** - No need to configure external AI services
- **降低使用成本** - 直接使用编辑器内置资源 | **Reduced Usage Cost** - Directly use built-in editor resources
- **上下文更充分** - Agent 对项目情况更为了解 | **More Context** - Agent has better understanding of project context
- **集成更自然** - 与编辑器生态系统完美融合 | **Natural Integration** - Perfect integration with editor ecosystem

### ✅ 核心功能 | Core Features

#### 🛡️ 文件系统安全验证 | File System Security Validation
- **路径遍历攻击检测** - 防止目录遍历安全漏洞 | **Path Traversal Attack Detection** - Prevent directory traversal security vulnerabilities
- **权限验证** - 自动检查文件和目录的读写权限 | **Permission Validation** - Automatically check read/write permissions for files and directories
- **文件属性验证** - 验证文件大小、类型和修改时间 | **File Attribute Validation** - Validate file size, type, and modification time
- **敏感路径保护** - 防止访问系统敏感目录 | **Sensitive Path Protection** - Prevent access to system-sensitive directories

#### ⚙️ 路径配置管理系统 | Path Configuration Management System
- **动态路径映射** - 支持配置文件定义的所有路径 | **Dynamic Path Mapping** - Support for all paths defined in configuration files
- **跨平台兼容** - 自动处理不同操作系统的路径分隔符 | **Cross-Platform Compatibility** - Automatically handle path separators for different operating systems
- **路径缓存优化** - 高效的路径解析缓存机制 | **Path Cache Optimization** - Efficient path resolution caching mechanism
- **配置热更新** - 支持运行时路径配置更新 | **Configuration Hot Update** - Support for runtime path configuration updates

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
speco-tasker init  # 自动检测配置，一键完成
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
speco-tasker list

# 查看下一个任务 | View next task
speco-tasker next

# 创建新任务（规范驱动开发） | Create new task (Specification-driven Development)
speco-tasker add-task --title "用户认证" --description "实现JWT用户认证功能" --details "使用JWT库实现token生成和验证" --test-strategy "单元测试token生成，集成测试认证流程" --spec-files "docs/auth-spec.md"

# 更新任务状态 | Update task status
speco-tasker set-status --id=1 --status=done

# 管理标签 | Manage tags
speco-tasker add-tag feature-name
speco-tasker use-tag feature-name

# 配置管理 | Configuration management
speco-tasker config show
speco-tasker config set paths.root.speco ".my-custom-path"

# 安全验证 | Security validation
speco-tasker validate-security --path=./src --operation=read
```

## 🛡️ 新功能：文件系统安全验证 | New Feature: File System Security Validation

Speco Tasker v1.2.0 引入了全面的文件系统安全验证机制，确保所有文件操作的安全性：

### 安全验证特性 | Security Validation Features

- **🛡️ 路径遍历攻击检测** - 自动检测和阻止 `../` 等路径遍历攻击
- **🔐 权限验证** - 检查文件和目录的读写权限
- **📁 文件属性验证** - 验证文件大小、类型和修改时间
- **🚫 敏感路径保护** - 防止访问系统敏感目录（如 `/etc`, `/usr`, `/root`）
- **⚡ 批量安全检查** - 支持批量文件操作的安全验证

### 安全验证命令 | Security Validation Commands

```bash
# 验证单个文件操作
speco-tasker validate-security --path=./src/index.js --operation=read

# 验证目录操作
speco-tasker validate-security --path=./src --operation=write

# 批量验证
speco-tasker validate-batch --operations=config.json

# 查看安全统计
speco-tasker security-stats
```

## ⚙️ 新功能：路径配置管理系统 | New Feature: Path Configuration Management System

全新的路径配置系统让您完全控制项目中的所有文件路径：

### 路径配置特性 | Path Configuration Features

- **🔄 动态路径映射** - 通过配置文件定义所有路径，避免硬编码
- **🌐 跨平台兼容** - 自动处理 Windows/macOS/Linux 的路径差异
- **💾 路径缓存优化** - 高效的路径解析缓存，提升性能
- **🔥 配置热更新** - 运行时更新路径配置，无需重启
- **🏷️ 标签支持** - 不同标签可以使用独立的路径配置

### 路径配置命令 | Path Configuration Commands

```bash
# 查看当前路径配置
speco-tasker config show

# 修改路径配置
speco-tasker config set paths.root.speco ".my-custom-dir"
speco-tasker config set dirs.tasks "project-tasks"

# 批量更新配置
speco-tasker config update --file=path-config.json

# 验证配置
speco-tasker config validate

# 配置历史管理
speco-tasker config history
speco-tasker config rollback --version=v1.1.0
```

### 配置示例 | Configuration Example

```json
{
  "version": "1.2.0",
  "paths": {
    "root": {
      "speco": ".speco",
      "legacy": ".taskmaster"
    },
    "dirs": {
      "tasks": "tasks",
      "docs": "docs",
      "reports": "reports",
      "templates": "templates"
    },
    "files": {
      "tasks": "tasks.json",
      "config": "config.json",
      "state": "state.json"
    }
  },
  "security": {
    "enabled": true,
    "maxFileSize": 104857600,
    "allowedExtensions": [".js", ".ts", ".json", ".md"],
    "forbiddenPaths": ["/etc", "/usr", "/bin"]
  }
}
```


## 📈 性能优化 | Performance Optimizations

### v1.2.0 性能提升 | v1.2.0 Performance Improvements

- **🚀 路径缓存** - 路径解析性能提升 90%
- **💾 内存优化** - 内存使用量减少 30%
- **⚡ 批量操作** - 批量文件操作性能提升 80%
- **🔒 安全验证** - 轻量级安全检查，最小性能影响

### 性能监控 | Performance Monitoring

```bash
# 查看性能统计
speco-tasker performance stats

# 运行性能测试
speco-tasker performance test

# 生成性能报告
speco-tasker performance report
```

## 🔄 迁移指南 | Migration Guide

### 从旧版本迁移 | Migrating from Previous Versions

如果您正在使用旧版本的 Speco Tasker，请按照以下步骤迁移：

1. **备份数据** - 备份 `.taskmaster/` 目录
2. **更新版本** - 安装最新版本
3. **运行迁移** - 自动迁移到新路径结构
4. **验证配置** - 检查新的配置文件
5. **测试功能** - 确保所有功能正常工作

```bash
# 自动迁移
speco-tasker migrate

# 验证迁移结果
speco-tasker validate-migration
```

## 🤝 贡献 | Contributing

我们欢迎各种形式的贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解详细信息。

### 开发环境设置 | Development Environment Setup

```bash
# 克隆仓库
git clone https://github.com/your-org/speco-tasker.git
cd speco-tasker

# 安装依赖
npm install

# 运行测试
npm test

# 启动开发服务器
npm run dev
```

## 📄 许可证 | License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**Speco Tasker** - 让任务管理变得简单、安全、高效！