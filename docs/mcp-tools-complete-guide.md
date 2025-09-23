# Speco Tasker MCP 工具完整使用指南

## 概述

Speco Tasker 是一个纯净的手动任务管理系统，完全移除了AI功能，专注于高效的手动任务管理。本文档提供了所有 MCP (Model Context Protocol) 工具的完整使用指南，这些工具专门为 Cursor、Windsurf 等 AI 编辑器中的内置代理优化。

**🚀 快速开始：**
1. 安装：`npm install -g speco-tasker`
2. 配置 MCP 服务器指向 `speco-tasker` 包
3. 在任何项目中使用，无需克隆本项目

## 📚 文档导航 | Documentation Navigation

- [📋 综合命令参考](comprehensive-cli-mcp-reference.md) - 包含 CLI 命令和 MCP 工具的完整参考
- [📖 使用教程](tutorial.md) - 完整的使用教程和实际示例
- [📝 安装指南](installation-guide.md) - 详细的安装和配置说明
- [🔧 命令参考（中文版）](command-reference-zh.md) - 中文用户的命令速查手册

### 核心特性

- **🏷️ 多标签系统**: 支持多个独立的任务上下文
- **📋 手动任务管理**: 纯净的任务管理，无 AI 干扰
- **🔄 依赖关系管理**: 完整的任务依赖关系支持
- **📁 文件自动生成**: 从 JSON 自动生成 Markdown 任务文件
- **🔧 MCP 集成**: 与 AI 编辑器无缝集成

### 💡 使用说明

**Speco Tasker 是一个 npm 包，你不需要克隆这个项目！**

- ✅ 只需要：`npm install -g speco-tasker`
- ✅ 然后：在编辑器的 MCP 配置中指向 `speco-tasker` 包
- ✅ 即可：在任何项目中使用 MCP 工具管理任务
- ✅ 无需：克隆项目、构建代码或处理依赖关系

### 主要工具分类

1. **项目初始化** - 设置和管理项目结构
2. **任务查看** - 查询和显示任务信息
3. **任务管理** - 创建、更新、删除任务
4. **状态管理** - 跟踪任务进度
5. **依赖管理** - 处理任务间的依赖关系
6. **标签管理** - 组织多上下文任务
7. **文件管理** - 生成和管理任务文件

---

## 安装和设置

### 系统要求

- Node.js 16+
- 支持 MCP 的编辑器 (Cursor, Windsurf, VS Code with MCP extension)

### 安装步骤

1. **安装 Speco Tasker**
   ```bash
   # 全局安装（推荐）
   npm install -g speco-tasker

   # 或使用 npx（无需全局安装）
   npx speco-tasker --version
   ```

2. **配置 MCP 服务器**

   在编辑器的 MCP 配置文件中添加：
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

   **推荐配置（最简洁）：**
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

   **明确指定包名的配置（适用于有命名冲突的情况）：**
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

3. **验证安装**
   ```bash
   speco-tasker --version
   ```

4. **项目初始化**
   ```bash
   speco-tasker init  # 或通过 MCP 工具使用 initialize_project
   ```

### MCP 配置

在你的编辑器中配置 MCP 服务器：

```json
{
  "mcpServers": {
    "speco-tasker": {
      "command": "node",
      "args": ["/path/to/speco-tasker/mcp-server/server.js"]
    }
  }
}
```

**注意**: 确保使用项目的完整绝对路径，避免相对路径问题。

### 验证安装

运行以下命令验证安装：

```bash
speco-tasker --version
```

---

## MCP 工具详细说明

### 1. initialize_project (项目初始化)

初始化新的 Speco Tasker 项目结构。

**参数：**
- `projectRoot` (可选): 项目根目录路径（会自动检测）
- `projectName` (可选): 项目名称（会自动从 Git 仓库或目录名检测）
- `shell` (可选): Shell 类型（zsh 或 bash，用于添加别名）
- `force` (可选): 强制重新初始化，即使项目已存在

**使用示例：**
```json
{}
```
```json
{
  "projectRoot": "/path/to/project",
  "projectName": "my-project",
  "shell": "zsh"
}
```

**说明：**
- 自动检测项目配置，无需复杂参数设置
- 自动检测 Git 状态（有 Git 用现有，无 Git 初始化）
- 自动选择最佳配置
- 在任何现有项目中初始化，无需克隆或创建新项目

### 2. add_task (添加任务)

手动添加新任务到任务列表。

**参数：**
- `projectRoot` (可选): 项目根目录（会自动检测）
- `title` (必需): 任务标题
- `description` (必需): 任务描述
- `details` (必需): 实现细节
- `testStrategy` (必需): 测试策略
- `spec_files` (必需): 规范文档文件路径列表，用逗号分隔（至少一个文档）
- `dependencies` (可选): 依赖的任务ID列表，用逗号分隔
- `priority` (可选): 任务优先级（high, medium, low）
- `logs` (可选): 任务相关的日志信息
- `file` (可选): 任务文件路径（默认：tasks/tasks.json）
- `tag` (可选): 选择要处理的任务分组

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "title": "用户认证",
  "description": "实现JWT用户认证功能",
  "details": "使用JWT库实现token生成和验证",
  "testStrategy": "单元测试token生成，集成测试认证流程",
  "spec_files": "docs/auth-spec.md,docs/api-spec.yaml",
  "priority": "high"
}
```

### 3. add_subtask (添加子任务)

为现有任务添加子任务。

**参数：**
- `id` 或 `parent` (必需): 父任务ID
- `taskId` (可选): 要转换的现有任务ID
- `title` (必需): 子任务标题（除非使用 taskId）
- `description` (可选): 子任务描述
- `details` (可选): 实现细节
- `dependencies` (可选): 依赖任务ID
- `status` (可选): 初始状态
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "id": "1",
  "title": "数据库迁移",
  "description": "创建用户表结构",
  "dependencies": "1.1,1.2"
}
```

### 4. update_task (更新任务)

修改现有任务的内容。

**参数：**
- `id` (必需): 任务ID
- `title` (可选): 新标题
- `description` (可选): 新描述
- `details` (可选): 新实现细节
- `testStrategy` (可选): 新测试策略
- `spec_files` (可选): 新规范文档
- `dependencies` (可选): 新依赖关系
- `priority` (可选): 新优先级
- `status` (可选): 新状态
- `append` (可选): 是否追加模式（默认为 true）
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "id": "1",
  "status": "in-progress",
  "details": "开始实现API端点",
  "append": true
}
```

### 5. update_subtask (更新子任务)

修改子任务内容并记录历史。

**参数：**
- `id` (必需): 子任务ID（如 "1.2"）
- `title` (可选): 新标题
- `description` (可选): 新描述
- `details` (可选): 新实现细节
- `status` (可选): 新状态
- `dependencies` (可选): 新依赖关系
- `priority` (可选): 新优先级
- `append` (可选): 是否追加模式（默认为 true）
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 6. set_task_status (设置任务状态)

更新任务或子任务的状态。

**参数：**
- `id` (必需): 任务ID（支持逗号分隔）
- `status` (必需): 新状态（pending, in-progress, done, review, cancelled）
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**状态说明：**
- `pending`: 待处理
- `in-progress`: 进行中
- `done`: 已完成
- `review`: 审查中
- `cancelled`: 已取消

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "id": "1,2,3",
  "status": "in-progress"
}
```

### 7. get_tasks (获取任务列表)

列出所有任务，支持状态过滤和子任务显示。

**参数：**
- `status` (可选): 状态过滤（支持逗号分隔多个状态）
- `withSubtasks` (可选): 是否包含子任务
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录
- `tag` (可选): 标签名称

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "status": "pending,in-progress",
  "withSubtasks": true,
  "tag": "main"
}
```

### 8. get_task (获取任务详情)

显示特定任务的详细信息。

**参数：**
- `id` (必需): 任务ID（支持逗号分隔多个ID）
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "id": "1,2,3",
  "tag": "main"
}
```

### 9. next_task (获取下一个任务)

显示下一个可以处理的任务。

**参数：**
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录
- `tag` (可选): 标签名称

### 10. remove_task (删除任务)

永久删除任务或子任务。

**参数：**
- `id` (必需): 任务ID（支持逗号分隔）
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "id": "1,2,3",
  "tag": "main"
}
```

### 11. remove_subtask (删除子任务)

删除子任务或将其转换为独立任务。

**参数：**
- `id` (必需): 子任务ID（如 "1.2"）
- `convert` (可选): 是否转换为独立任务
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 12. clear_subtasks (清除子任务)

从父任务中移除所有子任务。

**参数：**
- `id` (可选): 父任务ID（不指定时需要 all）
- `all` (可选): 清除所有任务的子任务
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 13. move_task (移动任务)

在任务层次结构中移动任务。

**参数：**
- `from` (必需): 源任务ID（支持逗号分隔）
- `to` (必需): 目标位置ID（支持逗号分隔）
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "from": "5",
  "to": "7"
}
```

### 14. add_dependency (添加依赖关系)

为任务添加依赖关系。

**参数：**
- `id` (必需): 任务ID
- `dependsOn` (必需): 依赖的任务ID
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "id": "2",
  "dependsOn": "1"
}
```

### 15. remove_dependency (删除依赖关系)

移除任务间的依赖关系。

**参数：**
- `id` (必需): 任务ID
- `dependsOn` (必需): 要移除依赖的任务ID
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 16. validate_dependencies (验证依赖关系)

检查任务依赖关系的完整性。

**参数：**
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 17. fix_dependencies (修复依赖关系)

自动修复依赖关系问题。

**参数：**
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 18. generate (生成任务文件)

从 tasks.json 生成 Markdown 任务文件。

**参数：**
- `output` (可选): 输出目录
- `tag` (可选): 标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 19. list_tags (列出标签)

显示所有可用标签及其统计信息。

**参数：**
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 20. add_tag (添加标签)

创建新的标签上下文。

**参数：**
- `name` (必需): 要创建的新标签名称
- `copyFromCurrent` (可选): 是否从当前标签复制任务到新标签
- `copyFromTag` (可选): 要复制任务的特定标签
- `fromBranch` (可选): 从当前 git 分支创建标签名称
- `description` (可选): 标签的可选描述
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "name": "new-feature",
  "description": "新功能开发"
}
```

### 21. delete_tag (删除标签)

永久删除标签及其所有任务。

**参数：**
- `name` (必需): 要删除的标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 22. use_tag (使用标签)

切换到不同的标签上下文。

**参数：**
- `name` (必需): 要使用的标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 23. rename_tag (重命名标签)

重命名现有标签。

**参数：**
- `oldName` (必需): 当前标签名称
- `newName` (必需): 新标签名称
- `file` (可选): 任务文件路径
- `projectRoot` (可选): 项目根目录

### 24. copy_tag (复制标签)

复制整个标签上下文。

**参数：**
- `sourceName` (必需): 源标签名称
- `targetName` (必需): 目标标签名称
- `description` (可选): 目标标签描述
- `projectRoot` (可选): 项目根目录

---

## 使用示例

### 基本工作流程

1. **初始化项目**
   ```json
   {
     "tool": "initialize_project",
     "params": {}
   }
   ```

2. **创建新功能任务**
   ```json
   {
     "tool": "add_task",
     "params": {
       "title": "用户注册功能",
       "description": "实现完整的用户注册流程",
       "details": "创建注册表单、验证逻辑、数据库存储",
       "testStrategy": "单元测试表单验证，集成测试完整流程",
       "spec_files": "docs/user-registration-spec.md",
       "priority": "high"
     }
   }
   ```

3. **添加子任务**
   ```json
   {
     "tool": "add_subtask",
     "params": {
       "id": "1",
       "title": "表单验证",
       "description": "实现注册表单的字段验证",
       "details": "验证邮箱格式、密码强度、确认密码匹配"
     }
   }
   ```

4. **更新任务状态**
   ```json
   {
     "tool": "set_task_status",
     "params": {
       "id": "1",
       "status": "in-progress"
     }
   }
   ```

5. **查看任务列表**
   ```json
   {
     "tool": "get_tasks",
     "params": {
       "status": "in-progress",
       "withSubtasks": true
     }
   }
   ```

### 高级用法

#### 批量操作
```json
{
  "tool": "set_task_status",
  "params": {
    "id": "1,2,3,4",
    "status": "done"
  }
}
```

#### 依赖关系管理
```json
{
  "tool": "add_dependency",
  "params": {
    "id": "3",
    "dependsOn": "1,2"
  }
}
```

#### 标签管理
```json
{
  "tool": "add_tag",
  "params": {
    "name": "backend-refactor",
    "description": "后端重构项目",
    "copyFromCurrent": true
  }
}
```

---

## 最佳实践

### 项目结构

Speco Tasker 会在用户项目中自动创建以下目录结构：

```
my-project/
├── .speco/
│   ├── tasks/
│   │   └── tasks.json        # 任务数据文件
│   └── state.json             # 标签状态文件
└── docs/
    ├── user-registration-spec.md
    └── database-schema.md
```

### 2. 任务命名规范

- **清晰描述**: 任务标题应清楚描述要完成的工作
- **动词开头**: 使用 "实现"、"创建"、"修复"、"优化" 等动词
- **具体范围**: 避免过于宽泛的描述

### 3. 标签使用策略

- **默认标签**: 使用 `main` 处理常规任务
- **功能分支**: 为每个功能分支创建对应标签
- **上下文隔离**: 不同标签的任务完全隔离
- **定期清理**: 删除不再需要的标签

### 4. 依赖关系管理

- **最小依赖**: 只添加必要的依赖关系
- **验证依赖**: 定期使用 `validate_dependencies` 检查依赖关系
- **避免循环**: 防止任务间形成循环依赖

### 5. 状态管理

- **及时更新**: 任务状态应及时反映实际进度
- **状态流转**: pending → in-progress → done
- **使用 review**: 需要审查的任务使用 review 状态

### 6. 规范文档

- **必要文档**: 每个任务至少关联一个规范文档
- **文档位置**: 规范文档应与任务相关性高
- **文档更新**: 任务更新时同步更新相关文档

---

## 常见问题和解决方案

### Q: MCP 服务器连接失败

**问题**: 编辑器无法连接到 Speco Tasker MCP 服务器

**解决方案**:
1. 确保已安装 Node.js 18+
2. 检查 MCP 配置是否正确：
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
   或：
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
3. 重启编辑器
4. 测试命令行：`npx speco-tasker --version`

### Q: 项目初始化失败

**问题**: `initialize_project` 工具报错 "Project root not found"

**解决方案**:
1. 确保当前工作目录是正确的项目目录
2. 提供完整的绝对路径：
   ```json
   {
     "tool": "initialize_project",
     "params": {
       "projectRoot": "/absolute/path/to/your/project"
     }
   }
   ```
3. 检查目录写入权限

### Q: 找不到 tasks.json 文件

**问题**: 工具返回 "Failed to find tasks.json"

**解决方案**:
1. 确保项目已正确初始化：`{"tool": "initialize_project"}`
2. 检查项目结构中是否存在 `.speco/tasks/` 目录

### Q: 标签不存在错误

**问题**: `Error: Tag 'feature-x' does not exist`

**解决方案**:
1. 先创建标签：
   ```json
   {
     "tool": "add_tag",
     "params": {
       "name": "feature-x"
     }
   }
   ```
2. 或者使用默认的 `main` 标签

### Q: 依赖关系循环错误

**问题**: `Error: Circular dependency detected`

**解决方案**:
1. 使用验证工具检查依赖关系：
   ```json
   {
     "tool": "validate_dependencies"
   }
   ```
2. 修复循环依赖
3. 使用修复工具自动修复：
   ```json
   {
     "tool": "fix_dependencies"
   }
   ```

### Q: 子任务操作失败

**问题**: `Error: Subtask 1.2 not found`

**解决方案**:
1. 确认任务ID格式正确（使用点号分隔：父任务ID.子任务ID）
2. 检查父任务是否存在
3. 使用 `get_task` 工具查看任务详情

### Q: 文件权限问题

**问题**: `Error: Permission denied`

**解决方案**:
1. 确保项目目录有写入权限
2. 检查文件系统权限设置
3. 在某些系统上可能需要管理员权限

---

## 错误代码参考

| 错误代码 | 说明 | 解决方案 |
|---------|------|----------|
| INITIALIZE_PROJECT_FAILED | 项目初始化失败 | 检查项目路径和权限 |
| TASKS_JSON_NOT_FOUND | 找不到任务文件 | 确保项目已初始化 |
| TAG_NOT_FOUND | 标签不存在 | 创建标签或使用现有标签 |
| TASK_NOT_FOUND | 任务不存在 | 检查任务ID是否正确 |
| CIRCULAR_DEPENDENCY | 循环依赖 | 使用 validate_dependencies 检查 |
| INVALID_TASK_ID | 无效任务ID | 检查ID格式 |
| PERMISSION_DENIED | 权限不足 | 检查文件系统权限 |

---

## 版本信息

- **当前版本**: 1.2.1
- **文档版本**: 2.2
- **最后更新**: 2025年09月23日
- **兼容性**: MCP 协议 v1.0+

---

## 贡献和支持

如有问题或建议，请：

1. 查看 [项目文档](https://github.com/your-repo/speco-tasker/docs/)
2. 提交 Issue 报告问题
3. 参与社区讨论

---

*此文档提供了 Speco Tasker MCP 工具的完整使用指南。所有工具都经过优化，专为 AI 编辑器中的手动任务管理而设计。*
