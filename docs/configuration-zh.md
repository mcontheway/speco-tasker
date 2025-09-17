# 配置

Speco Tasker 是一个纯净的手动任务管理系统，已经完全移除了AI功能。配置主要集中在标签系统和其他项目设置上。

## `.taskmaster/config.json` 文件

此 JSON 文件存储项目配置设置，包括日志级别、标签系统设置和项目默认值。

**位置：** 当您运行 `task-master init` 初始化新项目时，此文件将在 `.taskmaster/` 目录中创建。

**管理：** 文件会在项目初始化时自动创建。您也可以手动编辑此文件，但建议通过命令行工具进行管理。

**示例结构：**
```json
{
  "global": {
    "logLevel": "info",
    "debug": false,
    "defaultNumTasks": 10,
    "defaultSubtasks": 5,
    "defaultPriority": "medium",
    "defaultTag": "main",
    "projectName": "Your Project Name"
  },
  "tags": {
    "main": {
      "description": "主任务列表"
    },
    "feature-branch": {
      "description": "功能开发任务"
    }
  }
}
```

## 状态管理文件

Speco Tasker 使用 `.taskmaster/state.json` 来跟踪标签系统运行时信息：

```json
{
  "currentTag": "main",
  "lastSwitched": "2025-06-11T20:26:12.598Z",
  "migrationNoticeShown": true
}
```

- **`currentTag`**：当前激活的标签上下文
- **`lastSwitched`**：上次标签切换的时间戳
- **`migrationNoticeShown`**：是否已显示迁移通知

此文件在标签系统迁移期间自动创建，不应手动编辑。

## 带标签的任务列表配置

Speco Tasker 包含一个带标签的任务列表系统，用于多上下文任务管理。

### 全局标签设置

```json
"global": {
  "defaultTag": "main"
}
```

- **`defaultTag`** (字符串)：新操作的默认标签上下文（默认："main"）

### Git 集成

Speco Tasker 通过 `--from-branch` 选项提供手动 git 集成：

- **手动标签创建**：使用 `task-master add-tag --from-branch` 根据当前 git 分支名称创建标签
- **用户控制**：没有自动标签切换 - 您控制何时以及如何创建标签
- **灵活工作流**：支持任何 git 工作流，而不强制分支-标签映射

## 示例 `.env` 文件

由于 Speco Tasker 已经完全移除了AI功能，环境变量配置已大大简化：

```
# Speco Tasker 不需要AI API密钥
# 如果您使用其他工具，可能需要配置相关环境变量
```

## 故障排除

### 配置错误

- 如果 Speco Tasker 报告缺少配置或找不到配置文件错误，请在项目根目录运行 `task-master init` 来创建必要的配置文件。
- 对于新项目，配置将在 `task-master init` 时自动创建。
- 标签系统将在首次使用时自动初始化。

### 标签系统错误

- 如果遇到标签相关错误，请检查 `.taskmaster/state.json` 文件是否存在
- 使用 `task-master tags` 查看可用标签
- 使用 `task-master use-tag <tag-name>` 切换到特定标签

## 故障排除

### 配置错误

- 如果 Speco Tasker 报告缺少配置或找不到配置文件错误，请在项目根目录运行 `task-master init` 来创建必要的配置文件。
- 对于新项目，配置将在 `task-master init` 时自动创建。
- 标签系统将在首次使用时自动初始化。

### 如果 `task-master init` 没有响应：

尝试直接使用 Node 运行它：

```bash
node node_modules/speco-tasker/scripts/init.js
```

或克隆仓库并运行：

```bash
git clone https://github.com/mcontheway/speco-tasker.git
cd speco-tasker
node scripts/init.js
```

---

---

*最后更新：2025年09月17日*
