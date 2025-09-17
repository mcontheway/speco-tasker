# 跨标签任务移动

Speco Tasker 现在支持在不同的标签上下文中移动任务，允许您跨多个项目上下文、功能分支或开发阶段组织工作。

## 概述

跨标签任务移动使您能够：
- 在不同的标签上下文之间移动任务（例如，从 "backlog" 到 "in-progress"）
- 智能处理跨标签依赖关系
- 维护跨不同上下文的任务关系
- 组织跨多个项目阶段的工作

## 基本用法

### 同标签内移动

在同一个标签上下文中移动任务：

```bash
# 移动单个任务
task-master move --from=5 --to=7

# 移动子任务
task-master move --from=5.2 --to=7.3

# 移动多个任务
task-master move --from=5,6,7 --to=10,11,12
```

### 跨标签移动

在不同的标签上下文之间移动任务：

```bash
# 基本的跨标签移动
task-master move --from=5 --from-tag=backlog --to-tag=in-progress

# 移动多个任务
task-master move --from=5,6,7 --from-tag=backlog --to-tag=done
```

## 依赖关系解析

在标签之间移动任务时，您可能会遇到跨标签依赖关系。Speco Tasker 提供了几种处理这些依赖关系的选项：

### 连带依赖关系移动

将主任务连同其所有依赖任务一起移动：

```bash
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

这确保所有依赖任务一起移动，维护任务关系。

### 断开依赖关系

断开跨标签依赖关系，仅移动指定的任务：

```bash
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
```

这将移除依赖关系，仅移动指定的任务。

### 强制移动

注意：不再支持强制移动。请使用以下选项之一：

- `--with-dependencies` — 连带依赖任务一起移动
- `--ignore-dependencies` — 断开跨标签依赖关系

⚠️ **警告**：这可能会破坏依赖关系，应谨慎使用。

## 错误处理

Speco Tasker 提供增强的错误消息，并附带具体的解决建议：

### 跨标签依赖冲突

当您遇到依赖冲突时，您会看到：

```text
❌ 无法将任务从 "backlog" 移动到 "in-progress"

检测到跨标签依赖冲突：
  • 任务 5 依赖于任务 2（在 backlog 中）
  • 任务 6 依赖于任务 3（在 done 中）

解决选项：
  1. 连带依赖关系移动：task-master move --from=5,6 --from-tag=backlog --to-tag=in-progress --with-dependencies
  2. 断开依赖关系：task-master move --from=5,6 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
  3. 验证并修复依赖关系：task-master validate-dependencies && task-master fix-dependencies
  4. 先移动依赖任务：task-master move --from=2,3 --from-tag=backlog --to-tag=in-progress
  5. 决定后，使用 --with-dependencies 或 --ignore-dependencies 重新运行移动命令
```

### 子任务移动限制

子任务不能直接在标签之间移动：

```text
❌ 无法直接在标签之间移动子任务 5.2

子任务移动限制：
  • 子任务不能直接在标签之间移动
  • 必须先将其提升为完整任务

解决选项：
  1. 将子任务提升为完整任务：task-master remove-subtask --id=5.2 --convert
  2. 然后移动提升后的任务：task-master move --from=5 --from-tag=backlog --to-tag=in-progress
  3. 或连带所有子任务移动父任务：task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

### 无效标签组合

当源标签和目标标签相同时：

```text
❌ 无效的标签组合

错误详情：
  • 源标签："backlog"
  • 目标标签："backlog"
  • 原因：源标签和目标标签相同

解决选项：
  1. 为跨标签移动使用不同的标签
  2. 使用同标签内移动：task-master move --from=<id> --to=<id> --tag=backlog
  3. 检查可用标签：task-master tags
```

## 最佳实践

### 1. 首先检查依赖关系

在移动任务之前，先验证依赖关系：

```bash
# 检查依赖关系问题
task-master validate-dependencies

# 修复常见的依赖关系问题
task-master fix-dependencies
```

### 2. 使用适当的标志

- **`--with-dependencies`**：当您想要维护任务关系时
- **`--ignore-dependencies`**：当您想要断开跨标签依赖关系时

### 3. 按上下文组织

使用标签按以下方式组织工作：
- **开发阶段**：`backlog`、`in-progress`、`review`、`done`
- **功能分支**：`feature-auth`、`feature-dashboard`
- **团队成员**：`alice-tasks`、`bob-tasks`
- **项目版本**：`v1.0`、`v2.0`

### 4. 正确处理子任务

对于子任务，可以：
1. 先将子任务提升为完整任务
2. 使用 `--with-dependencies` 连带所有子任务移动父任务

## 高级用法

### 多个任务移动

一次移动多个任务：

```bash
# 连带依赖关系移动多个任务
task-master move --from=5,6,7 --from-tag=backlog --to-tag=in-progress --with-dependencies

# 断开依赖关系移动多个任务
task-master move --from=5,6,7 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
```

### 标签创建

如果目标标签不存在，将自动创建：

```bash
# 如果 "new-feature" 标签不存在，这将创建它
task-master move --from=5 --from-tag=backlog --to-tag=new-feature
```

### 当前标签回退

如果未提供 `--from-tag`，将使用当前标签：

```bash
# 使用当前标签作为源
task-master move --from=5 --to-tag=in-progress
```

## MCP 集成

跨标签移动功能也可通过 MCP 工具使用：

```javascript
// 连带依赖关系移动任务
await moveTask({
  from: "5",
  fromTag: "backlog",
  toTag: "in-progress",
  withDependencies: true
});

// 断开依赖关系
await moveTask({
  from: "5",
  fromTag: "backlog",
  toTag: "in-progress",
  ignoreDependencies: true
});
```

## 故障排除

### 常见问题

1. **"Source tag not found"**：使用 `task-master tags` 检查可用标签
2. **"Task not found"**：使用 `task-master list` 验证任务 ID
3. **"Cross-tag dependency conflicts"**：使用依赖关系解析标志
4. **"Cannot move subtask"**：先提升子任务或移动父任务

### 获取帮助

```bash
# 显示移动命令帮助
task-master move --help

# 检查可用标签
task-master tags

# 验证依赖关系
task-master validate-dependencies

# 修复依赖关系问题
task-master fix-dependencies
```

## 示例

### 场景 1：从 Backlog 移动到 In-Progress

```bash
# 首先检查依赖关系
task-master validate-dependencies

# 连带依赖关系移动
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

### 场景 2：断开依赖关系

```bash
# 移动任务，断开跨标签依赖关系
task-master move --from=5 --from-tag=backlog --to-tag=done --ignore-dependencies
```

### 场景 3：强制移动

明确选择以下选项之一：

```bash
# 连带依赖关系一起移动
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies

# 或断开依赖关系
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --ignore-dependencies
```

### 场景 4：移动子任务

```bash
# 选项 1：先提升子任务
task-master remove-subtask --id=5.2 --convert
task-master move --from=5 --from-tag=backlog --to-tag=in-progress

# 选项 2：连带所有子任务移动父任务
task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies
```

---

*最后更新：2025年09月17日*
