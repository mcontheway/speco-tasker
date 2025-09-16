<a name="readme-top"></a>

<div align='center'>
<a href="https://github.com/mcontheway/taskmaster-no-ai" target="_blank"><img src="https://img.shields.io/badge/TaskMaster-纯手动任务管理系统-blue?style=for-the-badge&logo=github" alt="TaskMaster Project" style="width: 280px; height: 55px;" width="280" height="55"/></a>
</div>

<p align="center">
  <img src="./images/logo.png?raw=true" alt="Taskmaster logo">
</p>

<p align="center">
<b>TaskMaster No-AI</b> - 纯净的手动任务管理系统，为高效的开发工作流程而设计，可无缝集成到任何开发环境。
</p>

<p align="center">
  <a href="https://github.com/mcontheway/taskmaster-no-ai/actions/workflows/ci.yml"><img src="https://github.com/mcontheway/taskmaster-no-ai/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcontheway/taskmaster-no-ai/stargazers"><img src="https://img.shields.io/github/stars/mcontheway/taskmaster-no-ai?style=social" alt="GitHub stars"></a>
  <a href="https://www.npmjs.com/package/taskmaster-no-ai"><img src="https://img.shields.io/npm/v/taskmaster-no-ai.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT%20with%20Commons%20Clause-blue.svg" alt="License"></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/taskmaster-no-ai"><img src="https://img.shields.io/npm/dm/taskmaster-no-ai.svg" alt="npm downloads"></a>
</p>

## 🎯 项目简介

**TaskMaster No-AI** 是一个专注于手动任务管理的系统，完全不依赖任何AI服务。它提供了27个核心功能，帮助开发者高效地组织和管理开发工作流程。

### ✨ 核心特性

- 🔧 **纯手动操作** - 零AI依赖，完全可控的工作流程
- 📋 **任务管理** - 创建、编辑、状态跟踪、依赖关系管理
- 🏷️ **多标签支持** - 按功能、分支或环境组织任务
- 🔗 **依赖管理** - 智能的任务依赖关系处理
- 📊 **进度追踪** - 可视化的任务完成度统计
- 🔄 **灵活移动** - 支持跨标签的任务移动
- 📝 **文档生成** - 自动生成任务文件和文档
- 🔍 **智能查询** - 快速查找和过滤任务

### 🆚 与 TaskMaster-AI 的关系

**TaskMaster No-AI** 是 **TaskMaster-AI** 的纯净版本，完全移除了所有AI功能：

| 特性 | TaskMaster-AI | TaskMaster No-AI |
|------|---------------|------------------|
| AI任务生成 | ✅ 支持 | ❌ 已移除 |
| 智能分析 | ✅ 支持 | ❌ 已移除 |
| 自动研究 | ✅ 支持 | ❌ 已移除 |
| 手动任务管理 | ✅ 支持 | ✅ **完整保留** |
| 依赖关系 | ✅ 支持 | ✅ **完整保留** |
| 多标签管理 | ✅ 支持 | ✅ **完整保留** |
| MCP集成 | ✅ 支持 | ✅ **完整保留** |
| 外部依赖 | 多项AI服务 | 零外部依赖 |

**选择 TaskMaster No-AI 的理由：**
- 🚀 **性能更佳** - 无AI调用延迟
- 🔒 **隐私保护** - 不发送任何数据到外部服务
- 💰 **成本为零** - 无API调用费用
- 🎛️ **完全可控** - 所有操作都在本地完成
- 🛠️ **环境友好** - 适用于无网络环境

## 📚 文档

以下文档可帮助您更好地使用 TaskMaster No-AI：

- [使用教程](docs/tutorial.md) - 快速入门指南
- [命令参考](docs/command-reference.md) - 完整命令列表
- [任务结构](docs/task-structure.md) - 任务格式和功能说明
- [使用示例](docs/examples.md) - 常见使用场景和流程
- [迁移指南](docs/migration-guide.md) - 从其他工具迁移的指南
- [配置说明](docs/configuration.md) - 自定义配置选项

### 🔧 MCP 集成 (推荐)

TaskMaster No-AI 支持通过 MCP (Model Context Protocol) 与您的编辑器集成，提供无缝的使用体验。

## ⚡ 系统要求

TaskMaster No-AI 是一个纯手动任务管理系统，无需任何外部API密钥或AI服务，完全离线工作。

**最低系统要求：**
- Node.js 18.0.0 或更高版本
- npm (通常与 Node.js 一起安装)
- 任意代码编辑器或IDE
- Git (推荐，用于版本控制)

**✅ 零外部依赖：**
- 无需API密钥
- 无需网络连接
- 无需外部服务
- 完全本地化运行

## 🚀 快速开始

### 方法一：MCP 集成 (推荐)

通过 MCP (Model Context Protocol)，您可以在编辑器中直接使用 TaskMaster No-AI。

#### 1. 添加 MCP 配置

根据您的编辑器，在相应路径添加配置文件：

| 编辑器 | 范围 | Linux/macOS 路径 | Windows 路径 | 配置键 |
|--------|------|------------------|--------------|--------|
| **Cursor** | 全局 | `~/.cursor/mcp.json` | `%USERPROFILE%\.cursor\mcp.json` | `mcpServers` |
| | 项目 | `<项目文件夹>/.cursor/mcp.json` | `<项目文件夹>\.cursor\mcp.json` | `mcpServers` |
| **Windsurf** | 全局 | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | `mcpServers` |
| **VS Code** | 项目 | `<项目文件夹>/.vscode/mcp.json` | `<项目文件夹>\.vscode\mcp.json` | `servers` |

##### 手动配置

###### Cursor & Windsurf (`mcpServers`)

**推荐配置**：
```json
{
  "mcpServers": {
    "taskmaster-no-ai": {
      "command": "task-master-mcp"
    }
  }
}
```

**临时替代方案**：
```json
{
  "mcpServers": {
    "taskmaster-no-ai": {
      "command": "npx",
      "args": ["-y", "taskmaster-no-ai"]
    }
  }
}
```

###### VS Code (`servers` + `type`)

```json
{
  "servers": {
    "taskmaster-no-ai": {
      "command": "task-master-mcp",
      "type": "stdio"
    }
  }
}
```

**临时替代方案 (推荐)**：
```json
{
  "servers": {
    "taskmaster-no-ai": {
      "command": "npx",
      "args": ["-y", "taskmaster-no-ai"],
      "type": "stdio"
    }
  }
}
```

#### 2. (仅 Cursor) 启用 TaskMaster MCP

打开 Cursor 设置 (Ctrl+Shift+J) ➡ 点击左侧的 MCP 标签页 ➡ 启用 taskmaster-no-ai 开关

#### 2.5 临时解决方案 (如果遇到 "command not found" 错误)

如果遇到 `taskmaster-no-ai: command not found` 错误，请使用以下任一临时解决方案：

**方案A：使用本地安装**
```bash
# 在项目根目录执行
npm install taskmaster-no-ai
```

然后修改MCP配置为：
```json
{
  "mcpServers": {
    "taskmaster-no-ai": {
      "command": "npx",
      "args": ["taskmaster-no-ai"]
    }
  }
}
```

**方案B：使用完整路径**
```json
{
  "mcpServers": {
    "taskmaster-no-ai": {
      "command": "/opt/homebrew/lib/node_modules/taskmaster-no-ai/mcp-server/server.js"
    }
  }
}
```

**方案C：使用task-master-mcp命令**
```json
{
  "mcpServers": {
    "taskmaster-no-ai": {
      "command": "task-master-mcp"
    }
  }
}
```

#### 3. 初始化项目

在聊天中输入：

```
初始化 TaskMaster No-AI 项目
```

#### 4. 准备项目文档 (推荐)

**新项目**：在 `.taskmaster/docs/prd.txt` 创建产品需求文档  
**现有项目**：可以使用 `task-master migrate` 进行迁移

初始化后可以在 `.taskmaster/templates/example_prd.txt` 中找到示例模板。

> [!提示]
> 对于复杂项目，建议先创建详细的PRD文档。您也可以随时通过聊天创建单个任务。

**建议从详细的PRD开始，这样可以更好地组织任务结构。**

#### 5. 常用命令

使用 TaskMaster 命令进行操作：

- 查看任务列表：`task-master list`
- 查看下一个任务：`task-master next`
- 查看特定任务：`task-master show 1`
- 创建新任务：`task-master add-task --prompt "新功能描述"`
- 更新任务状态：`task-master set-status --id=1 --status=done`
- 移动任务：`task-master move --from=1 --to=2`

[查看更多示例](docs/examples.md)

### 方法二：命令行使用

#### 📦 安装

```bash
# 全局安装 (推荐)
npm install -g taskmaster-no-ai

# 或在项目中本地安装
npm install taskmaster-no-ai
```

#### 🏗️ 初始化新项目

```bash
# 如果全局安装
task-master init

# 如果本地安装
npx task-master init

# 使用特定规则初始化项目
task-master init --rules cursor,windsurf,vscode
```

这将提示您输入项目详细信息，并创建必要的文件和目录结构。

#### 💻 常用命令

```bash
# 初始化新项目
task-master init

# 查看所有任务
task-master list

# 查看下一个要处理的任务
task-master next

# 查看特定任务 (支持逗号分隔的多个ID)
task-master show 1,3,5

# 创建新任务
task-master add-task --prompt "新功能描述"

# 更新任务状态
task-master set-status --id=1 --status=done

# 在标签间移动任务
task-master move --from=5 --to=6

# 生成任务文件
task-master generate

# 管理标签
task-master add-tag feature-name
task-master use-tag feature-name

# 管理依赖关系
task-master add-dependency --id=2 --depends-on=1
task-master validate-dependencies
```

## 🔧 27个核心功能

TaskMaster No-AI 提供完整的任务管理功能，完全不需要AI支持：

### 📋 任务管理
- ✅ **任务创建与编辑** - 手动创建、编辑任务内容
- ✅ **状态跟踪** - pending、in-progress、done、review、deferred、cancelled
- ✅ **批量操作** - 支持多个任务的批量操作
- ✅ **任务详情查看** - 完整的任务信息展示

### 🏷️ 多标签系统
- ✅ **标签创建** - 创建按功能、分支或环境组织的标签
- ✅ **标签切换** - 快速切换不同的工作上下文
- ✅ **跨标签移动** - 支持任务在标签间的移动
- ✅ **标签管理** - 重命名、删除、复制标签

### 🔗 依赖关系管理
- ✅ **依赖设置** - 为任务设置前置依赖
- ✅ **依赖验证** - 检查依赖关系的有效性
- ✅ **依赖修复** - 自动修复无效的依赖关系
- ✅ **依赖可视化** - 显示任务依赖状态

### 📊 进度追踪
- ✅ **完成度统计** - 可视化的进度条和百分比
- ✅ **任务计数** - 按状态统计任务数量
- ✅ **时间追踪** - 记录任务创建和完成时间
- ✅ **报告生成** - 生成项目进度报告

### 🔄 高级功能
- ✅ **任务移动** - 支持任务位置的重排序
- ✅ **子任务管理** - 创建和管理任务的子任务
- ✅ **文档生成** - 自动生成任务文档
- ✅ **数据导出** - 导出任务数据到外部格式

## 🔍 故障排除

### 如果 `task-master init` 无响应

尝试使用 Node 直接运行：

```bash
node node_modules/taskmaster-no-ai/scripts/init.js
```

或者克隆仓库并运行：

```bash
git clone https://github.com/mcontheway/taskmaster-no-ai.git
cd taskmaster-no-ai
node scripts/init.js
```

### 常见问题

**Q: 为什么选择 TaskMaster No-AI 而不是 AI 版本？**

A: TaskMaster No-AI 提供以下优势：
- 🚀 **更快的响应速度** - 无AI调用延迟
- 🔒 **完全隐私保护** - 数据完全本地存储
- 💰 **零成本运行** - 无API调用费用
- 🎛️ **完全可控** - 所有功能都在本地执行
- 🛠️ **离线可用** - 无需网络连接

**Q: 如何从 TaskMaster-AI 迁移？**

A: 由于 TaskMaster No-AI 完全移除了AI功能，不支持直接从AI版本迁移。请在新项目中重新初始化，或手动创建任务。

**Q: 支持哪些编辑器？**

A: 通过MCP协议，支持所有主流编辑器：
- Cursor (推荐)
- Windsurf
- VS Code
- 其他支持MCP的编辑器

## 📄 许可证

TaskMaster No-AI 使用 MIT 许可证配合 Commons Clause 进行授权。这意味着您可以：

### ✅ 允许的行为

- 将 TaskMaster 用于任何目的（个人、商业、学术）
- 修改代码
- 分发副本
- 使用 TaskMaster 创建和销售产品

### ❌ 不允许的行为

- 销售 TaskMaster 本身
- 提供 TaskMaster 作为托管服务
- 基于 TaskMaster 创建竞争产品

查看 [LICENSE](LICENSE) 文件了解完整的许可证文本和 [许可证详情](docs/licensing.md) 获取更多信息。

---

## 🤝 贡献

欢迎为 TaskMaster No-AI 项目做出贡献！请查看我们的 [贡献指南](CONTRIBUTING.md) 了解如何参与。

## 📈 开发路线图

- [ ] 增强的标签管理功能
- [ ] 任务时间追踪
- [ ] 导出到更多格式
- [ ] 团队协作功能
- [ ] 移动端支持

## 📞 支持

如果您在使用过程中遇到问题或有建议：

- 📧 [提交 Issue](https://github.com/mcontheway/taskmaster-no-ai/issues)
- 💬 [查看讨论](https://github.com/mcontheway/taskmaster-no-ai/discussions)
- 📖 [阅读文档](docs/)

---

**TaskMaster No-AI** - 让手动任务管理变得简单而强大！ 🚀
