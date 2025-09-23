# Speco Tasker CLI 命令和 MCP 工具完整参考

## 概述

Speco Tasker 是一个专注于开发工作流的任务管理系统。本文档提供了所有 CLI 命令和 MCP 工具的完整参考，支持自动检测配置的简化初始化体验。

**重要说明：**
- **自动初始化**：一键自动检测配置，无需复杂参数设置
- **CLI 命令**：用于终端直接交互或作为 MCP 的备选方案
- **MCP 工具**：用于 Cursor 等集成工具的程序化交互，推荐使用
- **🏷️ 标签系统**：支持多上下文任务管理，默认使用 "main" 标签
- **文件位置**：所有命令默认操作 `.speco/tasks/tasks.json`

## 📚 相关文档 | Related Documentation

- [📝 安装指南](installation-guide.md) - 安装和配置说明
- [📖 使用教程](tutorial.md) - 完整的使用教程和示例
- [📋 任务结构](task-structure.md) - 任务数据结构和格式说明

---

## 1. 项目初始化

### 初始化项目 (initialize_project / init)

自动检测项目配置并设置 Speco Tasker 的基本文件结构。

**CLI 命令：**
```bash
# 智能初始化（推荐）| Smart initialization (recommended)
speco-tasker init
```

**MCP 工具参数：**
- `projectRoot`: 项目根目录路径（可选，会自动检测）
- `projectName`: 项目名称（可选，会自动从Git仓库或目录名检测）
- `shell`: Shell类型（可选，zsh或bash，用于添加别名）
- `force`: 强制重新初始化（可选，布尔值）

**使用示例：**
```json
{}  // 自动检测，无需参数
{"projectRoot": "/path/to/project", "projectName": "my-project"}  // 指定项目路径和名称
{"projectName": "my-project", "shell": "zsh"}  // 指定名称和Shell类型
```

**特性说明：**
- 自动检测项目名称（从 Git 仓库或目录名）
- 自动 Git 状态检测（有 Git 用现有，无 Git 初始化）
- 自动选择最佳配置，无需手动设置
- MCP 模式下完全自动化

---

## 2. 任务列表查看

### 获取所有任务 (get_tasks / list)

列出所有任务，支持状态过滤和子任务显示。

**CLI 命令：**
```bash
# 列出所有任务
speco-tasker list

# 按状态过滤
speco-tasker list --status=pending
speco-tasker list --status=done,in-progress

# 显示子任务
speco-tasker list --with-subtasks

# 紧凑格式显示
speco-tasker list --compact

# 指定标签
speco-tasker list --tag=feature-branch
```

**MCP 工具参数：**
- `status`: 状态过滤（可选，支持逗号分隔多个状态）
- `withSubtasks`: 是否包含子任务
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）
- `tag`: 标签名称

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "status": "pending,in-progress",
  "withSubtasks": true,
  "tag": "main"
}
```

### 获取下一个任务 (next_task / next)

显示下一个可以处理的任务。

**CLI 命令：**
```bash
speco-tasker next
speco-tasker next --tag=feature-branch
```

**MCP 工具参数：**
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）
- `tag`: 标签名称

---

## 3. 任务详情查看

### 获取任务详情 (get_task / show)

显示特定任务的详细信息。

**CLI 命令：**
```bash
# 显示单个任务
speco-tasker show 1
speco-tasker show --id=1

# 显示多个任务
speco-tasker show 1,3,5

# 显示子任务
speco-tasker show 1.2

# 指定标签
speco-tasker show 1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需，支持逗号分隔多个ID）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

**使用示例：**
```json
{
  "projectRoot": "/path/to/project",
  "id": "1,2,3",
  "tag": "main"
}
```

---

## 4. 任务状态管理

### 设置任务状态 (set_task_status / set-status)

更新任务或子任务的状态。

**CLI 命令：**
```bash
# 设置单个任务状态
speco-tasker set-status --id=1 --status=done

# 设置多个任务状态
speco-tasker set-status --id=1,2,3 --status=in-progress

# 设置子任务状态
speco-tasker set-status --id=1.2 --status=done

# 指定标签
speco-tasker set-status --id=1 --status=done --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需，支持逗号分隔）
- `status`: 新状态（pending, in-progress, done, review, deferred, cancelled）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

**状态说明：**
- `pending`: 待处理
- `in-progress`: 进行中
- `done`: 已完成
- `review`: 审查中
- `deferred`: 延期/暂停
- `cancelled`: 已取消

---

## 5. 任务创建和管理

### 添加新任务 (add_task / add-task)

添加新任务到任务列表。

**CLI 命令：**
```bash
# 基本任务添加
speco-tasker add-task \
  --title="用户认证" \
  --description="实现用户认证功能" \
  --details="实现登录、注册、密码重置功能" \
  --testStrategy="单元测试和集成测试" \
  --spec-files="docs/auth-spec.md"

# 添加带依赖的任务
speco-tasker add-task \
  --title="数据库迁移" \
  --description="创建用户表结构" \
  --dependencies=1,2 \
  --priority=high \
  --spec-files="docs/database-schema.md"

# 指定标签
speco-tasker add-task \
  --title="新功能" \
  --description="实现新功能" \
  --tag=feature-branch \
  --spec-files="docs/feature-spec.md"
```

**MCP 工具参数：**
- `projectRoot`: 项目根目录（可选，会自动检测）
- `title`: 任务标题（必需）
- `description`: 任务描述（必需）
- `details`: 实现细节（必需）
- `testStrategy`: 测试策略（必需）
- `spec_files`: 规范文档路径（必需，用逗号分隔）
- `dependencies`: 依赖任务ID（可选）
- `priority`: 优先级（high, medium, low）
- `logs`: 日志信息（可选）
- `file`: 任务文件路径
- `tag`: 标签名称

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

### 添加子任务 (add_subtask / add-subtask)

为现有任务添加子任务。

**CLI 命令：**
```bash
# 添加新子任务
speco-tasker add-subtask --parent=1 --title="子任务标题" --description="子任务描述"

# 将现有任务转换为子任务
speco-tasker add-subtask --parent=1 --task-id=5

# 添加带依赖的子任务
speco-tasker add-subtask --parent=1 --title="数据库迁移" --dependencies="1.1,1.2"

# 指定规范文档
speco-tasker add-subtask --parent=1 --title="实现功能" --spec-files="docs/feature-spec.md"
```

**MCP 工具参数：**
- `id` 或 `parent`: 父任务ID（必需）
- `taskId`: 要转换的现有任务ID（可选）
- `title`: 子任务标题（必需，除非使用 taskId）
- `description`: 子任务描述
- `details`: 实现细节
- `dependencies`: 依赖任务ID
- `status`: 初始状态
- `generate`: 是否生成任务文件
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 6. 任务内容更新

### 更新任务 (update_task / update-task)

修改现有任务的内容。

**CLI 命令：**
```bash
# 更新任务字段
speco-tasker update-task --id=1 --status="in-progress" --details="开始实现API端点"

# 更新规范文档
speco-tasker update-task --id=1 --spec-files="docs/api-spec.md,docs/test-plan.md"

# 追加模式更新（保留历史）
speco-tasker update-task --id=1 --details="添加错误处理逻辑" --append
```

**MCP 工具参数：**
- `id`: 任务ID（必需）
- `title`: 新标题
- `description`: 新描述
- `details`: 新实现细节
- `testStrategy`: 新测试策略
- `spec_files`: 新规范文档
- `dependencies`: 新依赖关系
- `priority`: 新优先级
- `status`: 新状态
- `append`: 是否追加模式（默认为true，追加到现有内容；设为false则替换）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 更新子任务 (update_subtask / update-subtask)

修改子任务内容并记录历史。

**CLI 命令：**
```bash
# 更新子任务状态和详情
speco-tasker update-subtask --id=1.2 --status="in-progress" --details="开始实现认证逻辑"

# 追加模式更新（保留历史记录）
speco-tasker update-subtask --id=5.2 --details="更新：实现认证逻辑" --append

# 更新依赖关系
speco-tasker update-subtask --id=5.2 --dependencies="5.1,5.3"
```

**MCP 工具参数：**
- `id`: 子任务ID（必需，如 "1.2"）
- `title`: 新标题
- `description`: 新描述
- `details`: 新实现细节
- `status`: 新状态
- `dependencies`: 新依赖关系
- `priority`: 新优先级
- `append`: 是否追加模式（默认为true，追加到现有内容；设为false则替换）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 7. 任务组织管理

### 移动任务 (move_task / move)

在任务层次结构中移动任务。

**CLI 命令：**
```bash
# 将任务移动为子任务
speco-tasker move --from=5 --to=7

# 将子任务移动为独立任务
speco-tasker move --from=5.2 --to=7

# 移动子任务到其他父任务
speco-tasker move --from=5.2 --to=7.3

# 在同一父任务内重新排序子任务
speco-tasker move --from=5.2 --to=5.4

# 移动到新ID位置（自动创建占位符）
speco-tasker move --from=5 --to=25

# 同时移动多个任务
speco-tasker move --from=10,11,12 --to=16,17,18

# 在不同标签间移动任务
speco-tasker move --from=5 --from-tag=source-tag --to-tag=target-tag
```

**MCP 工具参数：**
- `from`: 源任务ID（必需，支持逗号分隔）
- `to`: 目标位置ID（必需，支持逗号分隔）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 8. 任务删除管理

### 删除任务 (remove_task / remove-task)

永久删除任务或子任务。

**CLI 命令：**
```bash
# 删除单个任务
speco-tasker remove-task --id=1

# 删除多个任务
speco-tasker remove-task --id=1,2,3

# 指定标签
speco-tasker remove-task --id=1 --tag=feature-branch

# 跳过确认提示
speco-tasker remove-task --id=1 --yes
```

**MCP 工具参数：**
- `id`: 任务ID（必需，支持逗号分隔）
- `yes`: 跳过确认提示
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 删除子任务 (remove_subtask / remove-subtask)

删除子任务或将其转换为独立任务。

**CLI 命令：**
```bash
# 删除子任务
speco-tasker remove-subtask --id=1.2

# 将子任务转换为独立任务
speco-tasker remove-subtask --id=1.2 --convert

# 指定标签
speco-tasker remove-subtask --id=1.2 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 子任务ID（必需，如 "1.2"）
- `convert`: 是否转换为独立任务
- `generate`: 是否生成任务文件
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 9. 依赖关系管理

### 添加依赖关系 (add_dependency / add-dependency)

为任务添加依赖关系。

**CLI 命令：**
```bash
speco-tasker add-dependency --id=2 --depends-on=1
speco-tasker add-dependency --id=2 --depends-on=1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需）
- `dependsOn`: 依赖的任务ID（必需）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 删除依赖关系 (remove_dependency / remove-dependency)

移除任务间的依赖关系。

**CLI 命令：**
```bash
speco-tasker remove-dependency --id=2 --depends-on=1
speco-tasker remove-dependency --id=2 --depends-on=1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需）
- `dependsOn`: 要移除依赖的任务ID（必需）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 验证依赖关系 (validate_dependencies / validate-dependencies)

检查任务依赖关系的完整性。

**CLI 命令：**
```bash
speco-tasker validate-dependencies
speco-tasker validate-dependencies --tag=feature-branch
```

**MCP 工具参数：**
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 修复依赖关系 (fix_dependencies / fix-dependencies)

自动修复依赖关系问题。

**CLI 命令：**
```bash
speco-tasker fix-dependencies
speco-tasker fix-dependencies --tag=feature-branch
```

**MCP 工具参数：**
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 10. 子任务批量管理

### 清除子任务 (clear_subtasks / clear-subtasks)

从父任务中移除所有子任务。

**CLI 命令：**
```bash
# 清除特定任务的子任务
speco-tasker clear-subtasks --id=1

# 清除多个任务的子任务
speco-tasker clear-subtasks --id=1,2,3

# 清除所有任务的子任务
speco-tasker clear-subtasks --all

# 指定标签
speco-tasker clear-subtasks --id=1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 父任务ID（可选，不指定时需要 all）
- `all`: 清除所有任务的子任务
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 11. 文件管理

### 生成任务文件 (generate)

从 tasks.json 生成 Markdown 任务文件。

**CLI 命令：**
```bash
# 生成任务文件
speco-tasker generate

# 指定输出目录
speco-tasker generate --output=custom-tasks-dir

# 指定标签
speco-tasker generate --tag=feature-branch
```

**MCP 工具参数：**
- `output`: 输出目录
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 12. 标签管理系统

### 列出标签 (list_tags / tags)

显示所有可用标签及其统计信息。

**CLI 命令：**
```bash
speco-tasker tags
speco-tasker tags --show-metadata
```

**MCP 工具参数：**
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 添加标签 (add_tag / add-tag)

创建新的标签上下文。

**CLI 命令：**
```bash
# 创建空标签
speco-tasker add-tag new-feature

# 创建带描述的标签
speco-tasker add-tag new-feature --description="新功能开发"

# 基于当前 git 分支创建标签
speco-tasker add-tag --from-branch

# 复制当前标签创建新标签
speco-tasker add-tag new-feature --copy-from-current

# 从指定标签复制
speco-tasker add-tag new-feature --copy-from=existing-tag
```

**MCP 工具参数：**
- `tagName`: 标签名称
- `--from-branch`: 从当前分支创建
- `--copy-from-current`: 复制当前标签
- `--copy-from`: 指定源标签
- `--description`: 标签描述
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 删除标签 (delete_tag / delete-tag)

永久删除标签及其所有任务。

**CLI 命令：**
```bash
speco-tasker delete-tag old-feature
speco-tasker delete-tag old-feature --yes
```

**MCP 工具参数：**
- `tagName`: 要删除的标签名称
- `--yes`: 跳过确认提示
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 使用标签 (use_tag / use-tag)

切换到不同的标签上下文。

**CLI 命令：**
```bash
speco-tasker use-tag feature-branch
```

**MCP 工具参数：**
- `tagName`: 要使用的标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 重命名标签 (rename_tag / rename-tag)

重命名现有标签。

**CLI 命令：**
```bash
speco-tasker rename-tag old-name new-name
```

**MCP 工具参数：**
- `oldName`: 当前标签名称
- `newName`: 新标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（可选，会自动检测）

### 复制标签 (copy_tag / copy-tag)

复制整个标签上下文。

**CLI 命令：**
```bash
speco-tasker copy-tag source-tag target-tag
speco-tasker copy-tag source-tag target-tag --description="复制描述"
```

**MCP 工具参数：**
- `sourceName`: 源标签名称
- `targetName`: 目标标签名称
- `--description`: 目标标签描述
- `projectRoot`: 项目根目录（可选，会自动检测）

---

## 13. 实验性功能

### 同步 README (sync-readme)

将任务列表导出到项目的 README.md 文件。

**CLI 命令：**
```bash
speco-tasker sync-readme
speco-tasker sync-readme --status=done
speco-tasker sync-readme --with-subtasks
speco-tasker sync-readme --tag=feature-branch
```

**MCP 工具：** 不适用

---

## 配置和环境变量

### 主要配置文件

- **`.taskmaster/config.json`**: 主要配置（参数、日志级别等）
- **`.taskmaster/tasks/tasks.json`**: 任务数据文件
- **`.taskmaster/state.json`**: 标签状态文件

### 环境变量

Speco Tasker 主要使用配置文件，通常不需要额外的环境变量配置。所有核心功能都可以直接使用，无需API密钥。

---

## 使用提示

### 标签系统最佳实践

1. **默认标签**: 使用 `main` 标签处理常规任务
2. **功能分支**: 为每个功能分支创建对应标签
3. **上下文隔离**: 不同标签的任务完全隔离
4. **分支同步**: 使用 `--tag` 参数在不同上下文间切换

### 任务管理流程

1. **自动初始化**: `speco-tasker init`（自动检测配置）
2. **查看任务**: `speco-tasker list`
3. **开始工作**: `speco-tasker next`
4. **查看详情**: `speco-tasker show <id>`
5. **更新状态**: `speco-tasker set-status --id=<id> --status=in-progress`
6. **完成任务**: `speco-tasker set-status --id=<id> --status=done`

### MCP 工具使用

- **自动初始化**: `initialize_project` 无需参数，自动检测项目配置
- **项目根目录**: 可选提供 `projectRoot`，会自动检测当前工作目录
- **标签上下文**: 使用 `tag` 参数指定任务上下文
- **批量操作**: 支持逗号分隔的多个 ID
- **错误处理**: 检查返回结果的 `success` 字段

---

## 常见错误和解决方案

### 文件未找到错误
```
错误: Failed to find tasks.json
解决方案: 确保项目已初始化 (speco-tasker init)
```

### 标签不存在错误
```
错误: Tag 'feature-x' does not exist
解决方案: 先创建标签 (speco-tasker add-tag feature-x)
```

### 依赖关系错误
```
错误: Circular dependency detected
解决方案: 使用 validate-dependencies 检查并修复
```

---

- **最后更新**: 2025年09月23日


*此文档提供了 Speco Tasker 所有 CLI 命令和 MCP 工具的完整参考。*