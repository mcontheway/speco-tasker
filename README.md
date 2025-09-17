<div align="center">
  <h1>Speco Tasker</h1>
  <p><strong>纯净的手动任务管理系统</strong></p>
  <p>专为 Cursor、Windsurf 等 AI 编辑器内置 Agent 优化的任务管理工具</p>
</div>

## 🌐 语言切换

- [English Version](README_EN.md) | 中文版本

---

## 📖 关于 Speco Tasker

**Speco Tasker** 是 [TaskMaster-AI](https://github.com/eyaltoledano/claude-task-master) 的纯净版本，完全移除了所有AI功能，专为现代AI编辑器设计。

### 🤔 为什么移除AI功能？

在 Cursor、Windsurf 等 AI 编辑器中，内置 Agent 具有天然优势：

- **免除配置步骤** - 无需额外配置外部AI服务
- **降低使用成本** - 直接使用编辑器内置资源
- **上下文更充分** - Agent 对项目情况更为了解
- **集成更自然** - 与编辑器生态系统完美融合

### ✅ 核心功能

#### 📋 任务管理系统
- **完整的CRUD操作** - 创建、读取、更新、删除任务
- **状态跟踪** - pending、in-progress、done、review、deferred、cancelled
- **子任务管理** - 支持多层级任务分解和组织
- **批量操作** - 支持多个任务的批量状态更新和操作

#### 🏷️ 多标签系统
- **标签组织** - 按功能、分支、环境、项目阶段组织任务
- **标签切换** - 快速切换不同的工作上下文
- **跨标签移动** - 支持任务在不同标签间的移动和复制
- **标签管理** - 创建、重命名、删除、合并标签
- **并行开发** - 支持多条开发线同时进行

#### 🔗 智能依赖管理
- **依赖设置** - 为任务设置前置和后续依赖关系
- **依赖验证** - 自动检查依赖关系的有效性和完整性
- **循环检测** - 智能检测和防止循环依赖关系
- **依赖修复** - 自动修复无效或损坏的依赖关系
- **依赖可视化** - 显示任务的依赖状态和层级关系

#### 📊 进度追踪与分析
- **完成度统计** - 可视化的进度条和百分比显示
- **任务计数** - 按状态、标签、优先级统计任务数量
- **时间追踪** - 记录任务的创建、更新、完成时间
- **工作量评估** - 基于任务复杂度进行工作量预估
- **报告生成** - 生成详细的项目进度和状态报告

#### 🔄 高级任务操作
- **任务移动** - 支持任务在不同位置的重排序和重组
- **任务拆分** - 将复杂任务分解为多个子任务
- **任务合并** - 将相关任务合并为更大任务
- **任务复制** - 在不同标签间复制任务模板
- **任务搜索** - 支持ID、标题、内容的关键字搜索

#### 📝 文档与集成
- **文档生成** - 自动生成任务Markdown文档
- **MCP集成** - 与 Cursor、Windsurf 等AI编辑器的深度集成
- **CLI工具** - 完整的命令行界面支持
- **配置管理** - 灵活的项目配置和个性化设置
- **跨平台支持** - 支持 Windows、macOS、Linux

## ⚙️ 配置和使用

### 安装配置

```bash
# 全局安装
npm install -g speco-tasker

# 初始化项目
task-master init
```

### MCP 配置

**Cursor 用户：**
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

**VS Code 用户：**
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

### 基础使用

```bash
# 查看任务列表
task-master list

# 查看下一个任务
task-master next

# 创建新任务（规范驱动开发）
task-master add-task --title "用户认证" --description "实现JWT用户认证功能" --details "使用JWT库实现token生成和验证" --test-strategy "单元测试token生成，集成测试认证流程" --spec-files "docs/auth-spec.md"

# 更新任务状态
task-master set-status --id=1 --status=done

# 管理标签
task-master add-tag feature-name
task-master use-tag feature-name
```