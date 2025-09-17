# 配置 | Configuration

Speco Tasker 是一个纯净的手动任务管理系统，已经完全移除了AI功能。配置主要集中在标签系统和其他项目设置上。

Speco Tasker is a pure manual task management system with all AI features completely removed. Configuration focuses mainly on the tag system and other project settings.

## `.taskmaster/config.json` 文件 | `.taskmaster/config.json` File

此 JSON 文件存储项目配置设置，包括日志级别、标签系统设置和项目默认值。

This JSON file stores project configuration settings, including log levels, tag system settings, and project defaults.

**位置：** 当您运行 `task-master init` 初始化新项目时，此文件将在 `.taskmaster/` 目录中创建。

**Location:** This file is created in the `.taskmaster/` directory when you run `task-master init` to initialize a new project.

**管理：** 文件会在项目初始化时自动创建。您也可以手动编辑此文件，但建议通过命令行工具进行管理。

**Management:** The file is created automatically during project initialization. You can also edit this file manually, but it is recommended to manage it through command-line tools.

**示例结构：| Example Structure:**
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

## 状态管理文件 | State Management File

Speco Tasker 使用 `.taskmaster/state.json` 来跟踪标签系统运行时信息：

Speco Tasker uses `.taskmaster/state.json` to track tag system runtime information:

```json
{
  "currentTag": "main",
  "lastSwitched": "2025-06-11T20:26:12.598Z",
  "migrationNoticeShown": true
}
```

- **`currentTag`**：当前激活的标签上下文 | **`currentTag`**: Current active tag context
- **`lastSwitched`**：上次标签切换的时间戳 | **`lastSwitched`**: Timestamp of last tag switch
- **`migrationNoticeShown`**：是否已显示迁移通知 | **`migrationNoticeShown`**: Whether migration notice has been shown

此文件在标签系统迁移期间自动创建，不应手动编辑。

This file is created automatically during tag system migration and should not be edited manually.

## 带标签的任务列表配置 | Tagged Task List Configuration

Speco Tasker 包含一个带标签的任务列表系统，用于多上下文任务管理。

Speco Tasker includes a tagged task list system for multi-context task management.

### 全局标签设置 | Global Tag Settings

```json
"global": {
  "defaultTag": "main"
}
```

- **`defaultTag`** (字符串)：新操作的默认标签上下文（默认："main"） | **`defaultTag`** (string): Default tag context for new operations (default: "main")

### Git 集成 | Git Integration

Speco Tasker 通过 `--from-branch` 选项提供手动 git 集成：

Speco Tasker provides manual git integration through the `--from-branch` option:

- **手动标签创建**：使用 `task-master add-tag --from-branch` 根据当前 git 分支名称创建标签 | **Manual Tag Creation**: Use `task-master add-tag --from-branch` to create tags based on current git branch name
- **用户控制**：没有自动标签切换 - 您控制何时以及如何创建标签 | **User Control**: No automatic tag switching - you control when and how tags are created
- **灵活工作流**：支持任何 git 工作流，而不强制分支-标签映射 | **Flexible Workflow**: Supports any git workflow without forcing branch-tag mapping

## 示例 `.env` 文件 | Example `.env` File

由于 Speco Tasker 已经完全移除了AI功能，环境变量配置已大大简化：

Since Speco Tasker has completely removed AI features, environment variable configuration has been greatly simplified:

```
# Speco Tasker 不需要AI API密钥
# 如果您使用其他工具，可能需要配置相关环境变量
```

```
# Speco Tasker does not require AI API keys
# If you use other tools, you may need to configure related environment variables
```

## 故障排除 | Troubleshooting

### 配置错误 | Configuration Errors

- 如果 Speco Tasker 报告缺少配置或找不到配置文件错误，请在项目根目录运行 `task-master init` 来创建必要的配置文件。 | If Speco Tasker reports missing configuration or cannot find configuration file errors, please run `task-master init` in the project root directory to create the necessary configuration files.
- 对于新项目，配置将在 `task-master init` 时自动创建。 | For new projects, configuration will be created automatically during `task-master init`.
- 标签系统将在首次使用时自动初始化。 | The tag system will be automatically initialized on first use.

### 标签系统错误 | Tag System Errors

- 如果遇到标签相关错误，请检查 `.taskmaster/state.json` 文件是否存在 | If you encounter tag-related errors, please check if the `.taskmaster/state.json` file exists
- 使用 `task-master tags` 查看可用标签 | Use `task-master tags` to view available tags
- 使用 `task-master use-tag <tag-name>` 切换到特定标签 | Use `task-master use-tag <tag-name>` to switch to a specific tag

### 如果 `task-master init` 没有响应：| If `task-master init` doesn't respond:

尝试直接使用 Node 运行它：

Try running it directly with Node:

```bash
node node_modules/speco-tasker/scripts/init.js
```

或克隆仓库并运行：

Or clone the repository and run:

```bash
git clone https://github.com/mcontheway/speco-tasker.git
cd speco-tasker
node scripts/init.js
```

---

*最后更新：2025年09月17日 | Last updated: September 17, 2025*
