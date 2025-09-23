# Speco Tasker 命令参考 | Command Reference

这是所有可用命令的完整参考。Speco Tasker 是纯净的手动任务管理系统，完全移除了AI功能，专注于高效的手动任务管理。

This is a complete reference of all available commands. Speco Tasker is a pure manual task management system with all AI features completely removed, focusing on efficient manual task management.

## 📚 文档导航 | Documentation Navigation

- [📖 英文完整参考](comprehensive-cli-mcp-reference.md) - 包含更多使用提示和最佳实践
- [🔧 MCP 工具指南](mcp-tools-complete-guide.md) - 专门的 MCP 工具使用指南
- [📋 使用教程](tutorial.md) - 完整的使用教程和示例

## 项目初始化 | Project Initialization

```bash
# 初始化新项目（自动检测配置） | Initialize new project (auto-detect configuration)
speco-tasker init
```

## 列出任务 | List Tasks

```bash
# 列出所有任务 | List all tasks
speco-tasker list

# 列出特定状态的任务 | List tasks with specific status
speco-tasker list --status=<status>

# 列出包含子任务的任务 | List tasks with subtasks
speco-tasker list --with-subtasks

# 使用紧凑格式显示任务 | Display tasks in compact format
speco-tasker list --compact

# 在特定标签中列出任务 | List tasks in specific tag
speco-tasker list --tag=<tag-name>
```

## 显示下一个任务 | Show Next Task

```bash
# 根据依赖关系和状态显示下一个可以处理的任务 | Display the next task that can be processed based on dependencies and status
speco-tasker next

# 在特定标签中查找下一个任务 | Find next task in specific tag
speco-tasker next --tag=<tag-name>
```

## 显示特定任务 | Show Specific Task

```bash
# 显示特定任务的详细信息 | Display detailed information for specific task
speco-tasker show <id>
# 或 | or
speco-tasker show --id=<id>

# 使用逗号分隔的 ID 查看多个任务 | View multiple tasks using comma-separated IDs
speco-tasker show 1,3,5

# 查看特定子任务（例如任务 1 的子任务 2） | View specific subtask (e.g., subtask 2 of task 1)
speco-tasker show 1.2

# 在特定标签中显示任务 | Display task in specific tag
speco-tasker show 1 --tag=<tag-name>
```

## 设置任务状态 | Set Task Status

```bash
# 设置单个任务的状态 | Set status for single task
speco-tasker set-status --id=<id> --status=<status>

# 设置多个任务的状态 | Set status for multiple tasks
speco-tasker set-status --id=1,2,3 --status=<status>

# 设置子任务的状态 | Set status for subtasks
speco-tasker set-status --id=1.1,1.2 --status=<status>

# 在特定标签中设置任务状态 | Set task status in specific tag
speco-tasker set-status --id=1 --status=done --tag=<tag-name>

# 别名命令 | Alias commands
speco-tasker mark --id=<id> --status=<status>    # set-status 的别名
speco-tasker set --id=<id> --status=<status>     # set-status 的别名
```

## 添加新任务 | Add New Task

```bash
# 添加新任务（规范驱动开发） | Add new task (Specification-driven Development)
speco-tasker add-task \
  --title="用户认证" \
  --description="实现用户认证功能" \
  --details="实现登录、注册、密码重置功能" \
  --test-strategy="单元测试和集成测试" \
  --spec-files="docs/auth-spec.md"

# 添加具有依赖关系的任务 | Add task with dependencies
speco-tasker add-task \
  --title="数据库迁移" \
  --description="创建用户表结构" \
  --dependencies=1,2 \
  --priority=high \
  --spec-files="docs/database-schema.md"

# 在特定标签中添加任务 | Add task in specific tag
speco-tasker add-task \
  --title="新功能" \
  --description="实现新功能" \
  --tag=<tag-name> \
  --spec-files="docs/feature-spec.md"
```

## 添加子任务 | Add Subtask

```bash
# 为现有任务添加新的子任务 | Add new subtask to existing task
speco-tasker add-subtask --parent=<id> --title="子任务标题" --description="子任务描述"

# 将现有任务转换为子任务 | Convert existing task to subtask
speco-tasker add-subtask --parent=<id> --task-id=<existing-task-id>

# 创建具有依赖关系的子任务 | Create subtask with dependencies
speco-tasker add-subtask --parent=<id> --title="数据库迁移" --dependencies="1.1,1.2"

# 创建子任务时可选择性地指定规范文档（不会继承父任务的规范文档） | Optionally specify spec files when creating subtask (does not inherit parent task's spec files)
speco-tasker add-subtask --parent=<id> --title="实现功能" --spec-files="docs/feature-spec.md"
```

**注意**: 子任务的规范文档字段是独立的，不会自动继承父任务的规范文档。 | **Note**: Subtask's spec files field is independent and does not automatically inherit the parent task's spec files.

## 更新特定任务 | Update Specific Task

```bash
# 更新任务的多个字段 | Update multiple fields of a task
speco-tasker update-task --id=<id> --status="in-progress" --details="开始实现API端点"

# 更新任务的规范文档 | Update task's spec files
speco-tasker update-task --id=<id> --spec-files="docs/api-spec.md,docs/test-plan.md"

# 追加模式更新任务详情 | Append mode update task details
speco-tasker update-task --id=<id> --details="添加错误处理逻辑" --append
```

## 更新子任务 | Update Subtask

```bash
# 更新子任务的状态和详情 | Update subtask status and details
speco-tasker update-subtask --id=<parentId.subtaskId> --status="in-progress" --details="开始实现认证逻辑"

# 追加模式更新子任务（保留历史记录） | Append mode update subtask (preserve history)
speco-tasker update-subtask --id=5.2 --details="更新：实现认证逻辑" --append

# 更新子任务的依赖关系 | Update subtask dependencies
speco-tasker update-subtask --id=5.2 --dependencies="5.1,5.3"
```

## 生成任务文件

```bash
# 从 tasks.json 生成任务文件
speco-tasker generate

# 指定输出目录
speco-tasker generate --output=<output-dir>

# 在特定标签中生成任务文件
speco-tasker generate --tag=<tag-name>
```

## 清除子任务

```bash
# 从特定任务清除子任务
speco-tasker clear-subtasks --id=<id>

# 从多个任务清除子任务
speco-tasker clear-subtasks --id=1,2,3

# 从所有任务清除子任务
speco-tasker clear-subtasks --all

# 在特定标签中清除子任务
speco-tasker clear-subtasks --id=1 --tag=<tag-name>
```

## 移除任务

```bash
# 移除单个任务
speco-tasker remove-task --id=<id>

# 移除多个任务
speco-tasker remove-task --id=1,2,3

# 在特定标签中移除任务
speco-tasker remove-task --id=1 --tag=<tag-name>
```

## 移除子任务

```bash
# 移除特定子任务
speco-tasker remove-subtask --id=<parentId.subtaskId>

# 将子任务提升为独立任务
speco-tasker remove-subtask --id=<parentId.subtaskId> --convert

# 在特定标签中移除子任务
speco-tasker remove-subtask --id=1.1 --tag=<tag-name>
```

## 管理任务依赖关系

```bash
# 为任务添加依赖关系
speco-tasker add-dependency --id=<id> --depends-on=<id>

# 从任务移除依赖关系
speco-tasker remove-dependency --id=<id> --depends-on=<id>

# 验证依赖关系
speco-tasker validate-dependencies

# 自动修复无效依赖关系
speco-tasker fix-dependencies

# 在特定标签中管理依赖关系
speco-tasker add-dependency --id=1 --depends-on=2 --tag=<tag-name>
```

## 移动任务

```bash
# 将任务或子任务移动到新位置
speco-tasker move --from=<id> --to=<id>

# 示例：
# 移动任务使其成为子任务
speco-tasker move --from=5 --to=7

# 移动子任务使其成为独立任务
speco-tasker move --from=5.2 --to=7

# 将子任务移动到其他父任务
speco-tasker move --from=5.2 --to=7.3

# 在同一父任务内重新排序子任务
speco-tasker move --from=5.2 --to=5.4

# 将任务移动到新 ID 位置（如果不存在则创建占位符）
speco-tasker move --from=5 --to=25

# 同时移动多个任务（源 ID 和目标 ID 数量必须相同）
speco-tasker move --from=10,11,12 --to=16,17,18

# 在不同标签之间移动任务
speco-tasker move --from=5 --from-tag=<source-tag> --to-tag=<target-tag>
```


## 项目迁移

```bash
# 迁移现有项目以使用新的目录结构
speco-tasker migrate

# 强制迁移，即使目录已存在
speco-tasker migrate --force

# 迁移前创建备份
speco-tasker migrate --backup

# 成功迁移后删除旧文件
speco-tasker migrate --cleanup

# 跳过确认提示
speco-tasker migrate --yes

# 显示将要迁移的内容但不实际执行
speco-tasker migrate --dry-run
```

## README 同步

```bash
# 将当前任务列表同步到项目根目录的 README.md 文件
speco-tasker sync-readme

# 在 README 输出中包含子任务
speco-tasker sync-readme --with-subtasks

# 仅显示匹配特定状态的任务
speco-tasker sync-readme --status=pending

# 在特定标签中同步任务
speco-tasker sync-readme --tag=<tag-name>
```

## 标签管理

Speco Tasker 支持带标签的任务列表，用于多上下文任务管理。每个标签代表一个单独的、隔离的任务上下文。

```bash
# 列出所有可用标签及其任务计数和状态
speco-tasker tags

# 列出包含详细元数据的标签
speco-tasker tags --show-metadata

# 创建新的空标签
speco-tasker add-tag <tag-name>

# 创建带有描述的新标签
speco-tasker add-tag <tag-name> --description="功能开发任务"

# 基于当前 git 分支名称创建标签
speco-tasker add-tag --from-branch

# 通过复制当前标签的任务创建新标签
speco-tasker add-tag <new-tag> --copy-from-current

# 通过从特定标签复制任务创建新标签
speco-tasker add-tag <new-tag> --copy-from=<source-tag>

# 切换到不同的标签上下文
speco-tasker use-tag <tag-name>

# 重命名现有标签
speco-tasker rename-tag <old-name> <new-name>

# 复制整个标签以创建新标签
speco-tasker copy-tag <source-tag> <target-tag>

# 复制带有描述的标签
speco-tasker copy-tag <source-tag> <target-tag> --description="用于测试的复制"

# 删除标签及其所有任务（带确认）
speco-tasker delete-tag <tag-name>

# 删除标签而不显示确认提示
speco-tasker delete-tag <tag-name> --yes
```

**标签上下文：**
- 所有任务操作（list、show、add、update 等）都在当前激活的标签内工作
- 使用 `--tag=<name>` 标志与大多数命令一起在特定标签上下文中操作
- 标签提供完全隔离 - 不同标签中的任务不会相互干扰

## 初始化项目

```bash
# 使用 Speco Tasker 结构初始化新项目
speco-tasker init
```

**标签上下文：**
- 所有任务操作（list、show、add、update 等）都在当前激活的标签内工作
- 使用 `--tag=<name>` 标志与大多数命令一起在特定标签上下文中操作
- 标签提供完全隔离 - 不同标签中的任务不会相互干扰

---

*最后更新：2025年09月23日*
