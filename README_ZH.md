# TaskMaster No-AI - 中文文档

## 📖 项目简介

**TaskMaster No-AI** 是一个专注于纯手动任务管理的系统，完全不需要任何AI服务支持。它提供了27个核心功能，帮助开发者高效地组织和管理开发工作流程。

## 🎯 核心特性

### ✅ 纯手动操作
- 零AI依赖，完全可控的工作流程
- 所有操作都在本地执行
- 无需网络连接，无API费用
- 完全离线可用

### 📋 完整任务管理
- **任务创建与编辑** - 支持详细的任务描述和属性设置
- **状态跟踪** - 6种状态：待处理、进行中、已完成、审查中、已延迟、已取消
- **批量操作** - 支持多个任务的批量状态更新
- **任务详情查看** - 完整的任务信息展示，包括依赖关系

### 🏷️ 多标签系统
- **标签组织** - 按功能、分支或环境组织任务
- **标签切换** - 快速切换不同的工作上下文
- **跨标签移动** - 支持任务在不同标签间的移动
- **标签管理** - 创建、重命名、删除、复制标签

### 🔗 智能依赖管理
- **依赖设置** - 为任务设置前置依赖关系
- **依赖验证** - 自动检查依赖关系的有效性
- **依赖修复** - 自动修复无效或循环的依赖关系
- **依赖可视化** - 显示任务的依赖状态和层级

### 📊 进度追踪
- **完成度统计** - 可视化的进度条和百分比显示
- **任务计数** - 按状态统计任务数量
- **时间追踪** - 记录任务的创建和完成时间
- **报告生成** - 生成详细的项目进度报告

## 🚀 快速开始

### 方法一：MCP 集成 (推荐)

1. **添加配置文件** - 根据您的编辑器创建MCP配置文件
2. **启用服务** - 在编辑器中启用 TaskMaster No-AI
3. **初始化项目** - 运行初始化命令
4. **开始使用** - 通过聊天界面管理任务

### 方法二：命令行使用

```bash
# 全局安装
npm install -g taskmaster-no-ai

# 初始化项目
task-master init

# 查看任务列表
task-master list

# 查看下一个任务
task-master next

# 创建新任务
task-master add-task --prompt "新功能描述"
```

## 💻 常用命令

### 任务管理
```bash
# 查看所有任务
task-master list

# 查看下一个要处理的任务
task-master next

# 查看特定任务
task-master show 1

# 创建新任务
task-master add-task --prompt "任务描述"

# 更新任务状态
task-master set-status --id=1 --status=done
```

### 标签管理
```bash
# 创建新标签
task-master add-tag feature-name

# 切换标签
task-master use-tag feature-name

# 查看所有标签
task-master tags
```

### 依赖管理
```bash
# 添加依赖关系
task-master add-dependency --id=2 --depends-on=1

# 验证依赖关系
task-master validate-dependencies

# 修复依赖问题
task-master fix-dependencies
```

### 其他功能
```bash
# 移动任务
task-master move --from=1 --to=2

# 生成任务文件
task-master generate

# 添加子任务
task-master add-subtask --parent=1 --title "子任务标题"
```

## 🔧 MCP 配置

### Cursor 编辑器

创建或编辑 `~/.cursor/mcp.json`：

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

### VS Code 编辑器

创建或编辑 `<项目文件夹>/.vscode/mcp.json`：

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

## 📋 使用流程

### 1. 项目初始化
```bash
task-master init
```
这将创建 `.taskmaster/` 目录和配置文件。

### 2. 创建任务
- 通过命令行：`task-master add-task --prompt "功能描述"`
- 或在MCP聊天中直接描述需求

### 3. 组织任务
- 使用标签分组：`task-master add-tag feature-name`
- 设置依赖关系：`task-master add-dependency --id=2 --depends-on=1`

### 4. 跟踪进度
- 查看任务列表：`task-master list`
- 标记完成：`task-master set-status --id=1 --status=done`
- 查看进度报告：任务列表会显示完成百分比

### 5. 管理工作流程
- 按优先级处理：`task-master next` 总是显示最合适的下一个任务
- 重新组织：`task-master move --from=1 --to=2`
- 生成文档：`task-master generate`

## 🔍 故障排除

### 常见问题

**Q: 为什么选择 No-AI 版本？**
A: No-AI 版本提供更快的响应速度、完全的隐私保护、零运行成本，以及完全可控的操作流程。

**Q: 支持哪些编辑器？**
A: 通过MCP协议，支持所有主流编辑器，包括Cursor、Windsurf、VS Code等。

**Q: 如何管理复杂项目？**
A: 使用标签系统将任务按功能分组，使用依赖管理确保正确的执行顺序。

**Q: 数据存储在哪里？**
A: 所有数据都存储在项目的 `.taskmaster/` 目录中，完全本地化。

## 📊 功能对比

| 功能类别 | TaskMaster-AI | TaskMaster No-AI |
|---------|---------------|------------------|
| **AI任务生成** | ✅ 支持 | ❌ 已移除 |
| **智能分析** | ✅ 支持 | ❌ 已移除 |
| **自动研究** | ✅ 支持 | ❌ 已移除 |
| **手动任务管理** | ✅ 支持 | ✅ **完整保留** |
| **依赖关系** | ✅ 支持 | ✅ **完整保留** |
| **多标签管理** | ✅ 支持 | ✅ **完整保留** |
| **MCP集成** | ✅ 支持 | ✅ **完整保留** |
| **外部依赖** | 多项AI服务 | 零外部依赖 |
| **性能** | 受网络影响 | 本地高速 |
| **隐私** | 数据发送外部 | 完全本地 |
| **成本** | API调用费用 | 零成本 |

## 🎉 开始使用

1. **安装**：`npm install -g taskmaster-no-ai`
2. **配置MCP**：根据您的编辑器添加配置文件
3. **初始化**：`task-master init`
4. **创建任务**：开始描述您的开发需求
5. **管理流程**：使用各种命令组织和跟踪任务进度

**TaskMaster No-AI** - 让手动任务管理变得简单而强大！ 🚀
