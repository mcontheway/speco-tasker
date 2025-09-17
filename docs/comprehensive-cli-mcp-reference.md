# Speco Tasker CLI 命令和 MCP 工具完整参考

## 概述

Speco Tasker 是一个纯净的手动任务管理系统，完全移除了AI功能，专注于高效的手动任务管理。本文档提供了所有 CLI 命令和 MCP 工具的完整参考。

**重要说明：**
- **CLI 命令**：用于终端直接交互或作为 MCP 的备选方案
- **MCP 工具**：用于 Cursor 等集成工具的程序化交互，推荐使用
- **🏷️ 标签系统**：支持多上下文任务管理，默认使用 "main" 标签
- **文件位置**：所有命令默认操作 `.taskmaster/tasks/tasks.json`

---

## 1. 项目初始化

### 初始化项目 (initialize_project / init)

设置 Speco Tasker 的基本文件结构和配置。

**CLI 命令：**
```bash
# 基础初始化
task-master init

# 带项目信息初始化
task-master init --name="我的项目" --description="项目描述"

# 跳过依赖安装
task-master init --skip-install

# 添加 shell 别名
task-master init --add-aliases

# 静默模式（使用默认设置）
task-master init --yes
```

**MCP 工具参数：**
- `projectName`: 项目名称
- `projectDescription`: 项目描述
- `projectVersion`: 版本号（如 "0.1.0"）
- `authorName`: 作者名称
- `skipInstall`: 跳过依赖安装
- `addAliases`: 添加 shell 别名
- `noGit`: 跳过 Git 初始化
- `yes`: 使用默认设置跳过提示

**使用示例：**
```json
{
  "projectName": "电商平台",
  "projectDescription": "基于 Node.js 的电商平台",
  "projectVersion": "1.0.0",
  "authorName": "开发者"
}
```

---

## 2. 任务列表查看

### 获取所有任务 (get_tasks / list)

列出所有任务，支持状态过滤和子任务显示。

**CLI 命令：**
```bash
# 列出所有任务
task-master list

# 按状态过滤
task-master list --status=pending
task-master list --status=done,in-progress

# 显示子任务
task-master list --with-subtasks

# 紧凑格式显示
task-master list --compact

# 指定标签
task-master list --tag=feature-branch
```

**MCP 工具参数：**
- `status`: 状态过滤（可选，支持逗号分隔多个状态）
- `withSubtasks`: 是否包含子任务
- `file`: 任务文件路径
- `complexityReport`: 复杂度报告路径
- `projectRoot`: 项目根目录（必需）
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
task-master next
task-master next --tag=feature-branch
```

**MCP 工具参数：**
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）
- `tag`: 标签名称

---

## 3. 任务详情查看

### 获取任务详情 (get_task / show)

显示特定任务的详细信息。

**CLI 命令：**
```bash
# 显示单个任务
task-master show 1
task-master show --id=1

# 显示多个任务
task-master show 1,3,5

# 显示子任务
task-master show 1.2

# 指定标签
task-master show 1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需，支持逗号分隔多个ID）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

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
task-master set-status --id=1 --status=done

# 设置多个任务状态
task-master set-status --id=1,2,3 --status=in-progress

# 设置子任务状态
task-master set-status --id=1.2 --status=done

# 指定标签
task-master set-status --id=1 --status=done --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需，支持逗号分隔）
- `status`: 新状态（pending, in-progress, done, review, cancelled）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

**状态说明：**
- `pending`: 待处理
- `in-progress`: 进行中
- `done`: 已完成
- `review`: 审查中
- `cancelled`: 已取消

---

## 5. 任务创建和管理

### 添加新任务 (add_task / add-task)

手动添加新任务到任务列表。

**CLI 命令：**
```bash
# 基本任务添加
task-master add-task \
  --title="用户认证" \
  --description="实现用户认证功能" \
  --details="实现登录、注册、密码重置功能" \
  --testStrategy="单元测试和集成测试" \
  --spec-files="docs/auth-spec.md"

# 添加带依赖的任务
task-master add-task \
  --title="数据库迁移" \
  --description="创建用户表结构" \
  --dependencies=1,2 \
  --priority=high \
  --spec-files="docs/database-schema.md"

# 指定标签
task-master add-task \
  --title="新功能" \
  --description="实现新功能" \
  --tag=feature-branch \
  --spec-files="docs/feature-spec.md"
```

**MCP 工具参数：**
- `projectRoot`: 项目根目录（必需）
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
task-master add-subtask --parent=1 --title="子任务标题" --description="子任务描述"

# 将现有任务转换为子任务
task-master add-subtask --parent=1 --task-id=5

# 添加带依赖的子任务
task-master add-subtask --parent=1 --title="数据库迁移" --dependencies="1.1,1.2"

# 指定规范文档
task-master add-subtask --parent=1 --title="实现功能" --spec-files="docs/feature-spec.md"
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
- `projectRoot`: 项目根目录（必需）

---

## 6. 任务内容更新

### 更新任务 (update_task / update-task)

修改现有任务的内容。

**CLI 命令：**
```bash
# 更新任务字段
task-master update-task --id=1 --status="in-progress" --details="开始实现API端点"

# 更新规范文档
task-master update-task --id=1 --spec-files="docs/api-spec.md,docs/test-plan.md"

# 追加模式更新（保留历史）
task-master update-task --id=1 --details="添加错误处理逻辑" --append
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
- `append`: 是否追加模式
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 更新子任务 (update_subtask / update-subtask)

修改子任务内容并记录历史。

**CLI 命令：**
```bash
# 更新子任务状态和详情
task-master update-subtask --id=1.2 --status="in-progress" --details="开始实现认证逻辑"

# 追加模式更新（保留历史记录）
task-master update-subtask --id=5.2 --details="更新：实现认证逻辑" --append

# 更新依赖关系
task-master update-subtask --id=5.2 --dependencies="5.1,5.3"
```

**MCP 工具参数：**
- `id`: 子任务ID（必需，如 "1.2"）
- `title`: 新标题
- `description`: 新描述
- `details`: 新实现细节
- `status`: 新状态
- `dependencies`: 新依赖关系
- `priority`: 新优先级
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

---

## 7. 任务组织管理

### 移动任务 (move_task / move)

在任务层次结构中移动任务。

**CLI 命令：**
```bash
# 将任务移动为子任务
task-master move --from=5 --to=7

# 将子任务移动为独立任务
task-master move --from=5.2 --to=7

# 移动子任务到其他父任务
task-master move --from=5.2 --to=7.3

# 在同一父任务内重新排序子任务
task-master move --from=5.2 --to=5.4

# 移动到新ID位置（自动创建占位符）
task-master move --from=5 --to=25

# 同时移动多个任务
task-master move --from=10,11,12 --to=16,17,18

# 在不同标签间移动任务
task-master move --from=5 --from-tag=source-tag --to-tag=target-tag
```

**MCP 工具参数：**
- `from`: 源任务ID（必需，支持逗号分隔）
- `to`: 目标位置ID（必需，支持逗号分隔）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

---

## 8. 任务删除管理

### 删除任务 (remove_task / remove-task)

永久删除任务或子任务。

**CLI 命令：**
```bash
# 删除单个任务
task-master remove-task --id=1

# 删除多个任务
task-master remove-task --id=1,2,3

# 指定标签
task-master remove-task --id=1 --tag=feature-branch

# 跳过确认提示
task-master remove-task --id=1 --yes
```

**MCP 工具参数：**
- `id`: 任务ID（必需，支持逗号分隔）
- `yes`: 跳过确认提示
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 删除子任务 (remove_subtask / remove-subtask)

删除子任务或将其转换为独立任务。

**CLI 命令：**
```bash
# 删除子任务
task-master remove-subtask --id=1.2

# 将子任务转换为独立任务
task-master remove-subtask --id=1.2 --convert

# 指定标签
task-master remove-subtask --id=1.2 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 子任务ID（必需，如 "1.2"）
- `convert`: 是否转换为独立任务
- `generate`: 是否生成任务文件
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

---

## 9. 依赖关系管理

### 添加依赖关系 (add_dependency / add-dependency)

为任务添加依赖关系。

**CLI 命令：**
```bash
task-master add-dependency --id=2 --depends-on=1
task-master add-dependency --id=2 --depends-on=1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需）
- `dependsOn`: 依赖的任务ID（必需）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 删除依赖关系 (remove_dependency / remove-dependency)

移除任务间的依赖关系。

**CLI 命令：**
```bash
task-master remove-dependency --id=2 --depends-on=1
task-master remove-dependency --id=2 --depends-on=1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 任务ID（必需）
- `dependsOn`: 要移除依赖的任务ID（必需）
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 验证依赖关系 (validate_dependencies / validate-dependencies)

检查任务依赖关系的完整性。

**CLI 命令：**
```bash
task-master validate-dependencies
task-master validate-dependencies --tag=feature-branch
```

**MCP 工具参数：**
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 修复依赖关系 (fix_dependencies / fix-dependencies)

自动修复依赖关系问题。

**CLI 命令：**
```bash
task-master fix-dependencies
task-master fix-dependencies --tag=feature-branch
```

**MCP 工具参数：**
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

---

## 10. 子任务批量管理

### 清除子任务 (clear_subtasks / clear-subtasks)

从父任务中移除所有子任务。

**CLI 命令：**
```bash
# 清除特定任务的子任务
task-master clear-subtasks --id=1

# 清除多个任务的子任务
task-master clear-subtasks --id=1,2,3

# 清除所有任务的子任务
task-master clear-subtasks --all

# 指定标签
task-master clear-subtasks --id=1 --tag=feature-branch
```

**MCP 工具参数：**
- `id`: 父任务ID（可选，不指定时需要 all）
- `all`: 清除所有任务的子任务
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

---

## 11. 文件管理

### 生成任务文件 (generate)

从 tasks.json 生成 Markdown 任务文件。

**CLI 命令：**
```bash
# 生成任务文件
task-master generate

# 指定输出目录
task-master generate --output=custom-tasks-dir

# 指定标签
task-master generate --tag=feature-branch
```

**MCP 工具参数：**
- `output`: 输出目录
- `tag`: 标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

---

## 12. 标签管理系统

### 列出标签 (list_tags / tags)

显示所有可用标签及其统计信息。

**CLI 命令：**
```bash
task-master tags
task-master tags --show-metadata
```

**MCP 工具参数：**
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 添加标签 (add_tag / add-tag)

创建新的标签上下文。

**CLI 命令：**
```bash
# 创建空标签
task-master add-tag new-feature

# 创建带描述的标签
task-master add-tag new-feature --description="新功能开发"

# 基于当前 git 分支创建标签
task-master add-tag --from-branch

# 复制当前标签创建新标签
task-master add-tag new-feature --copy-from-current

# 从指定标签复制
task-master add-tag new-feature --copy-from=existing-tag
```

**MCP 工具参数：**
- `tagName`: 标签名称
- `--from-branch`: 从当前分支创建
- `--copy-from-current`: 复制当前标签
- `--copy-from`: 指定源标签
- `--description`: 标签描述
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 删除标签 (delete_tag / delete-tag)

永久删除标签及其所有任务。

**CLI 命令：**
```bash
task-master delete-tag old-feature
task-master delete-tag old-feature --yes
```

**MCP 工具参数：**
- `tagName`: 要删除的标签名称
- `--yes`: 跳过确认提示
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 使用标签 (use_tag / use-tag)

切换到不同的标签上下文。

**CLI 命令：**
```bash
task-master use-tag feature-branch
```

**MCP 工具参数：**
- `tagName`: 要使用的标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 重命名标签 (rename_tag / rename-tag)

重命名现有标签。

**CLI 命令：**
```bash
task-master rename-tag old-name new-name
```

**MCP 工具参数：**
- `oldName`: 当前标签名称
- `newName`: 新标签名称
- `file`: 任务文件路径
- `projectRoot`: 项目根目录（必需）

### 复制标签 (copy_tag / copy-tag)

复制整个标签上下文。

**CLI 命令：**
```bash
task-master copy-tag source-tag target-tag
task-master copy-tag source-tag target-tag --description="复制描述"
```

**MCP 工具参数：**
- `sourceName`: 源标签名称
- `targetName`: 目标标签名称
- `--description`: 目标标签描述
- `projectRoot`: 项目根目录（必需）

---

## 13. 实验性功能

### 同步 README (sync-readme)

将任务列表导出到项目的 README.md 文件。

**CLI 命令：**
```bash
task-master sync-readme
task-master sync-readme --status=done
task-master sync-readme --with-subtasks
task-master sync-readme --tag=feature-branch
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

1. **初始化**: `task-master init`
2. **查看任务**: `task-master list`
3. **开始工作**: `task-master next`
4. **查看详情**: `task-master show <id>`
5. **更新状态**: `task-master set-status --id=<id> --status=in-progress`
6. **完成任务**: `task-master set-status --id=<id> --status=done`

### MCP 工具使用

- **项目根目录**: 始终提供 `projectRoot` 参数
- **标签上下文**: 使用 `tag` 参数指定任务上下文
- **批量操作**: 支持逗号分隔的多个 ID
- **错误处理**: 检查返回结果的 `success` 字段

---

## 常见错误和解决方案

### 文件未找到错误
```
错误: Failed to find tasks.json
解决方案: 确保项目已初始化 (task-master init)
```

### 标签不存在错误
```
错误: Tag 'feature-x' does not exist
解决方案: 先创建标签 (task-master add-tag feature-x)
```

### 依赖关系错误
```
错误: Circular dependency detected
解决方案: 使用 validate-dependencies 检查并修复
```

---

## 版本信息

- **当前版本**: 基于 Speco Tasker 纯净版
- **最后更新**: 2025年09月17日
- **文档版本**: 1.1

---

*此文档提供了 Speco Tasker 所有 CLI 命令和 MCP 工具的完整参考。如有问题，请参考项目文档或提交 Issue。*
