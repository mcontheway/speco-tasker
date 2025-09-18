# 跨标签任务移动 | Cross-Tag Task Movement

Speco Tasker 现在支持在不同的标签上下文中移动任务，允许您跨多个项目上下文、功能分支或开发阶段组织工作。

Speco Tasker now supports moving tasks between different tag contexts, allowing you to organize work across multiple project contexts, feature branches, or development stages.

## 概述 | Overview

跨标签任务移动使您能够：

Cross-tag task movement enables you to:

- 在不同的标签上下文之间移动任务（例如，从 "backlog" 到 "in-progress"）| Move tasks between different tag contexts (e.g., from "backlog" to "in-progress")
- 智能处理跨标签依赖关系 | Intelligently handle cross-tag dependencies
- 维护跨不同上下文的任务关系 | Maintain task relationships across different contexts
- 组织跨多个项目阶段的工作 | Organize work across multiple project stages

## 基本用法 | Basic Usage

### 同标签内移动 | Within-Tag Movement

在同一个标签上下文中移动任务：

Moving tasks within the same tag context:

```bash
# 移动单个任务 | Move single task
task-master move --from=5 --to=7

# 移动子任务 | Move subtask
task-master move --from=5.2 --to=7.3

# 移动多个任务 | Move multiple tasks
task-master move --from=5,6,7 --to=10,11,12
```

### 跨标签移动 | Cross-Tag Movement

在不同的标签上下文之间移动任务：

Moving tasks between different tag contexts:

```bash
# 基本的跨标签移动 | Basic cross-tag movement
task-master move --from=5 --from-tag=backlog --to-tag=in-progress

# 移动多个任务 | Move multiple tasks
task-master move --from=5,6,7 --from-tag=backlog --to-tag=done
```

## 依赖关系解析 | Dependency Resolution

在标签之间移动任务时，您可能会遇到跨标签依赖关系。Speco Tasker 提供了几种处理这些依赖关系的选项：

When moving tasks between tags, you may encounter cross-tag dependencies. Speco Tasker provides several options for handling these dependencies:

### 连带依赖关系移动 | Cascading Dependency Movement

将主任务连同其所有依赖任务一起移动：

Move the main task along with all its dependency tasks:

```bash
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

这确保所有依赖任务一起移动，维护任务关系。

This ensures all dependency tasks move together, maintaining task relationships.

### 断开依赖关系 | Breaking Dependencies

断开跨标签依赖关系，仅移动指定的任务：

Break cross-tag dependencies and move only the specified tasks:

```bash
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
```

这将移除依赖关系，仅移动指定的任务。

This will remove dependencies and move only the specified tasks.

### 强制移动 | Force Movement

注意：不再支持强制移动。请使用以下选项之一：

Note: Force movement is no longer supported. Please use one of the following options:

- `--with-dependencies` — 连带依赖任务一起移动 | Move along with dependency tasks
- `--ignore-dependencies` — 断开跨标签依赖关系 | Break cross-tag dependencies

⚠️ **警告**：这可能会破坏依赖关系，应谨慎使用。| **Warning**: This may break dependencies and should be used with caution.

## 错误处理 | Error Handling

Speco Tasker 提供增强的错误消息，并附带具体的解决建议：

Speco Tasker provides enhanced error messages with specific resolution suggestions:

### 跨标签依赖冲突 | Cross-Tag Dependency Conflicts

当您遇到依赖冲突时，您会看到：

When you encounter dependency conflicts, you will see:

```text
❌ 无法将任务从 "backlog" 移动到 "in-progress" | ❌ Cannot move tasks from "backlog" to "in-progress"

检测到跨标签依赖冲突：| Detected cross-tag dependency conflicts:
  • 任务 5 依赖于任务 2（在 backlog 中）| • Task 5 depends on Task 2 (in backlog)
  • 任务 6 依赖于任务 3（在 done 中）| • Task 6 depends on Task 3 (in done)

解决选项：| Resolution options:
  1. 连带依赖关系移动：task-master move --from=5,6 --from-tag=backlog --to-tag=in-progress --with-dependencies
  2. 断开依赖关系：task-master move --from=5,6 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
  3. 验证并修复依赖关系：task-master validate-dependencies && task-master fix-dependencies
  4. 先移动依赖任务：task-master move --from=2,3 --from-tag=backlog --to-tag=in-progress
  5. 决定后，使用 --with-dependencies 或 --ignore-dependencies 重新运行移动命令
```

### 子任务移动限制 | Subtask Movement Restrictions

子任务不能直接在标签之间移动：

Subtasks cannot be moved directly between tags:

```text
❌ 无法直接在标签之间移动子任务 5.2 | ❌ Cannot move subtask 5.2 directly between tags

子任务移动限制：| Subtask movement restrictions:
  • 子任务不能直接在标签之间移动 | • Subtasks cannot be moved directly between tags
  • 必须先将其提升为完整任务 | • Must first promote it to a complete task

解决选项：| Resolution options:
  1. 将子任务提升为完整任务：task-master remove-subtask --id=5.2 --convert
  2. 然后移动提升后的任务：task-master move --from=5 --from-tag=backlog --to-tag=in-progress
  3. 或连带所有子任务移动父任务：task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

### 无效标签组合 | Invalid Tag Combinations

当源标签和目标标签相同时：

When source and target tags are the same:

```text
❌ 无效的标签组合 | ❌ Invalid tag combination

错误详情：| Error details:
  • 源标签："backlog" | • Source tag: "backlog"
  • 目标标签："backlog" | • Target tag: "backlog"
  • 原因：源标签和目标标签相同 | • Reason: Source and target tags are the same

解决选项：| Resolution options:
  1. 为跨标签移动使用不同的标签 | Use different tags for cross-tag movement
  2. 使用同标签内移动：task-master move --from=<id> --to=<id> --tag=backlog | Use within-tag movement: task-master move --from=<id> --to=<id> --tag=backlog
  3. 检查可用标签：task-master tags | Check available tags: task-master tags
```

## 最佳实践 | Best Practices

### 1. 首先检查依赖关系 | Check Dependencies First

在移动任务之前，先验证依赖关系：

Validate dependencies before moving tasks:

```bash
# 检查依赖关系问题 | Check for dependency issues
task-master validate-dependencies

# 修复常见的依赖关系问题 | Fix common dependency issues
task-master fix-dependencies
```

### 2. 使用适当的标志 | Use Appropriate Flags

- **`--with-dependencies`**：当您想要维护任务关系时 | When you want to maintain task relationships
- **`--ignore-dependencies`**：当您想要断开跨标签依赖关系时 | When you want to break cross-tag dependencies

### 3. 按上下文组织 | Organize by Context

使用标签按以下方式组织工作：

Organize work using tags in the following ways:

- **开发阶段**：`backlog`、`in-progress`、`review`、`done` | **Development Stages**: `backlog`, `in-progress`, `review`, `done`
- **功能分支**：`feature-auth`、`feature-dashboard` | **Feature Branches**: `feature-auth`, `feature-dashboard`
- **团队成员**：`alice-tasks`、`bob-tasks` | **Team Members**: `alice-tasks`, `bob-tasks`
- **项目版本**：`v1.0`、`v2.0` | **Project Versions**: `v1.0`, `v2.0`

### 4. 正确处理子任务 | Handle Subtasks Properly

对于子任务，可以：

For subtasks, you can:
1. 先将子任务提升为完整任务 | First promote the subtask to a complete task
2. 使用 `--with-dependencies` 连带所有子任务移动父任务 | Use `--with-dependencies` to move the parent task along with all subtasks

## 高级用法 | Advanced Usage

### 多个任务移动 | Multiple Task Movement

一次移动多个任务：

Move multiple tasks at once:

```bash
# 连带依赖关系移动多个任务 | Move multiple tasks with dependencies
task-master move --from=5,6,7 --from-tag=backlog --to-tag=in-progress --with-dependencies

# 断开依赖关系移动多个任务 | Move multiple tasks ignoring dependencies
task-master move --from=5,6,7 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
```

### 标签创建 | Tag Creation

如果目标标签不存在，将自动创建：

If the target tag doesn't exist, it will be created automatically:

```bash
# 如果 "new-feature" 标签不存在，这将创建它 | If "new-feature" tag doesn't exist, this will create it
task-master move --from=5 --from-tag=backlog --to-tag=new-feature
```

### 当前标签回退 | Current Tag Fallback

如果未提供 `--from-tag`，将使用当前标签：

If `--from-tag` is not provided, the current tag will be used:

```bash
# 使用当前标签作为源 | Use current tag as source
task-master move --from=5 --to-tag=in-progress
```

## MCP 集成 | MCP Integration

跨标签移动功能也可通过 MCP 工具使用：

Cross-tag movement functionality is also available through MCP tools:

```javascript
// 连带依赖关系移动任务 | Move task with dependencies
await moveTask({
  from: "5",
  fromTag: "backlog",
  toTag: "in-progress",
  withDependencies: true
});

// 断开依赖关系 | Break dependencies
await moveTask({
  from: "5",
  fromTag: "backlog",
  toTag: "in-progress",
  ignoreDependencies: true
});
```

## 故障排除 | Troubleshooting

### 常见问题 | Common Issues

1. **"Source tag not found"**：使用 `task-master tags` 检查可用标签 | Use `task-master tags` to check available tags
2. **"Task not found"**：使用 `task-master list` 验证任务 ID | Use `task-master list` to verify task ID
3. **"Cross-tag dependency conflicts"**：使用依赖关系解析标志 | Use dependency resolution flags
4. **"Cannot move subtask"**：先提升子任务或移动父任务 | First promote subtask or move parent task

### 获取帮助 | Getting Help

```bash
# 显示移动命令帮助 | Show move command help
task-master move --help

# 检查可用标签 | Check available tags
task-master tags

# 验证依赖关系 | Validate dependencies
task-master validate-dependencies

# 修复依赖关系问题 | Fix dependency issues
task-master fix-dependencies
```

## 示例 | Examples

### 场景 1：从 Backlog 移动到 In-Progress | Scenario 1: Move from Backlog to In-Progress

```bash
# 首先检查依赖关系 | First check dependencies
task-master validate-dependencies

# 连带依赖关系移动 | Move with dependencies
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

### 场景 2：断开依赖关系 | Scenario 2: Break Dependencies

```bash
# 移动任务，断开跨标签依赖关系 | Move task, break cross-tag dependencies
task-master move --from=5 --from-tag=backlog --to-tag=done --ignore-dependencies
```

### 场景 3：强制移动 | Scenario 3: Force Movement

明确选择以下选项之一：

Choose one of the following options explicitly:

```bash
# 连带依赖关系一起移动 | Move along with dependencies
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies

# 或断开依赖关系 | Or break dependencies
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
```

### 场景 4：移动子任务 | Scenario 4: Moving Subtasks

```bash
# 选项 1：先提升子任务 | Option 1: First promote subtask
task-master remove-subtask --id=5.2 --convert
task-master move --from=5 --from-tag=backlog --to-tag=in-progress

# 选项 2：连带所有子任务移动父任务 | Option 2: Move parent task along with all subtasks
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

---

*最后更新：2025年09月17日 | Last updated: September 17, 2025*
