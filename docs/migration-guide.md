# Speco Tasker 迁移指南

本指南帮助用户从 AI 驱动的 Speco Tasker 迁移到新的纯手动版本（`speco-tasker`）。

## 概述

Speco Tasker 已被完全重构，移除了所有 AI 依赖，成为一个纯手动任务管理系统。这一变化消除了对 API 密钥和外部 AI 服务的需要，同时保持了所有核心任务管理功能。

## 变更内容

### 移除的功能
- ❌ 从 PRD 进行 AI 驱动的任务生成
- ❌ AI 辅助的任务扩展和分解
- ❌ AI 研究功能
- ❌ AI 模型配置和管理
- ❌ 所有外部 AI 提供商集成（Anthropic、OpenAI 等）

### 保留的功能
- ✅ 手动任务创建和管理
- ✅ 任务依赖关系和状态跟踪
- ✅ 子任务管理
- ✅ 基于标签的任务组织
- ✅ MCP 服务器集成（用于 Cursor/VS Code）
- ✅ 命令行界面
- ✅ 所有手动任务操作

## 迁移步骤

### 1. 备份您的数据
在迁移之前，备份您现有的 `.taskmaster/` 目录：

```bash
# 备份现有的 Speco Tasker 数据
cp -r .taskmaster .taskmaster-backup-ai
```

### 2. 移除旧版本
卸载 AI 版本：

```bash
# 移除全局安装的 AI 版本
npm uninstall -g task-master-ai

# 移除本地安装的 AI 版本（如果适用）
npm uninstall task-master-ai
```

### 3. 安装新版本
安装纯手动版本：

```bash
# 全局安装
npm install -g speco-tasker

# 或者在您的项目中本地安装
npm install speco-tasker
```

### 4. 更新 MCP 配置
更新您的 MCP 配置以移除 API 密钥：

**Cursor (.cursor/mcp.json)：**
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

**VS Code (.vscode/mcp.json)：**
```json
{
  "servers": {
    "speco-tasker": {
      "command": "npx",
      "args": ["-y", "--package=speco-tasker", "speco-tasker"],
      "type": "stdio"
    }
  }
}
```

### 5. 重新初始化项目
在您的项目中重新初始化 Speco Tasker：

```bash
# 初始化新版本
task-master init

# 注意：新版本不支持自动 PRD 解析
# 您需要手动创建任务
```

### 6. 手动任务创建
由于 AI 驱动的 PRD 解析已被移除，请手动创建任务：

```bash
# 创建您的第一个任务
task-master add-task --title "Set up project structure" --description "Create basic directory structure and configuration files"

# 根据需要创建更多任务
task-master add-task --title "Implement user authentication" --description "Add user login and registration functionality"

# 查看所有任务
task-master list
```

### 7. 更新工作流程
用手动流程替换依赖 AI 的工作流程：

**旧的 AI 工作流程：**
```
1. 编写 PRD
2. 询问 AI："Parse my PRD at docs/prd.txt"
3. 询问 AI："What's the next task?"
4. 询问 AI："Help me implement task 3"
```

**新的手动工作流程：**
```
1. 编写 PRD
2. 手动创建任务：task-master parse-prd docs/prd.txt（注意：这现在只读取纯文本，没有 AI 分析）
3. 检查下一个任务：task-master next
4. 查看任务详情：task-master show 3
5. 根据任务描述手动实现
```

## 重大变更

### 命令变更
- `task-master parse-prd` 现在只接受纯文本文件（无 AI 分析）
- 移除了所有与 AI 相关的命令：
  - `task-master models`（模型配置）
  - `task-master research`（AI 研究）
  - `task-master update`（AI 驱动的任务更新）
  - `task-master expand --research`（AI 研究扩展）

### 配置变更
- 移除了 `.taskmaster/config.json` 中的 AI 模型设置
- 不再需要在环境变量中配置 API 密钥
- 简化的 MCP 配置（不需要环境变量）

### 文件结构变更
- 移除了 `src/ai-providers/` 目录
- 移除了 `src/prompts/` 目录
- 从 `scripts/modules/` 中移除了 AI 相关模块

## 新功能

虽然 AI 功能已被移除，但新版本提供了：

### 改进的性能
- ⚡ 更快的启动时间（无 AI 初始化）
- 💾 更低的内存使用
- 🔒 无外部 API 依赖

### 增强的可靠性
- 🛠️ 无 API 速率限制或中断
- 🔄 跨环境的一致行为
- 📦 自包含操作

### 简化的设置
- 🚀 无需 API 密钥配置
- 📝 直接的安装过程
- 🧹 最少的依赖

## 故障排除

### 常见问题

**安装后出现"Command not found"：**
```bash
# 尝试使用 npx
npx speco-tasker --help

# 或者重新全局安装
npm install -g speco-tasker
```

**旧任务无法加载：**
新版本保持与现有任务文件的向后兼容性。如果遇到问题：
```bash
# 检查任务文件格式
cat .taskmaster/tasks/tasks.json

# 如需要重新初始化
rm -rf .taskmaster/
task-master init
```

**MCP 服务器无法连接：**
1. 验证 MCP 配置语法
2. 重启您的编辑器
3. 检查包是否正确安装

### 获取帮助

- 📖 查看 `docs/` 中的更新文档
- 🐛 在 GitHub 上报告问题
- 💬 社区讨论（可用时）

## 变更的好处

### 对于个人开发者
- **成本节省**：无 API 密钥费用
- **隐私**：所有数据都保存在本地
- **可靠性**：无外部服务依赖
- **性能**：无 AI 开销的更快操作

### 对于团队
- **一致性**：跨所有环境的行为相同
- **安全性**：无需管理敏感 API 密钥
- **合规性**：更适合隔离或受限环境
- **维护**：更少的移动部件需要维护

### 对于组织
- **可扩展性**：无 API 速率限制问题
- **合规性**：满足严格的数据驻留要求
- **成本控制**：可预测的运营成本
- **简单性**：更容易部署和管理

## 未来计划

纯手动版本为未来增强建立了坚实的基础：

- 🔧 增强的手动任务管理功能
- 📊 改进的报告和分析
- 🔗 与开发工具更好的集成
- 📱 潜在的 GUI 界面
- 🌐 基于 Web 的界面

## 总结

迁移到 `speco-tasker` 代表着向简单性和可靠性的战略转变。虽然 AI 驱动的功能提供了便利，但手动方法为大多数用例提供了更好的性能、安全性和可维护性。

核心任务管理功能保持完整，确保您的所有项目规划和跟踪需求仍能通过更强大、更可靠的解决方案得到满足。