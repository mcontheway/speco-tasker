# 任务结构 | Task Structure

Speco Tasker 中的任务遵循特定格式，旨在为开发人员提供全面的手动任务管理信息。

Tasks in Speco Tasker follow a specific format designed to provide comprehensive manual task management information for developers.

## tasks.json 中的任务字段 | Task Fields in tasks.json

tasks.json 中的任务具有以下结构：

Tasks in tasks.json have the following structure:

- `id`：任务的唯一标识符（示例：`1`）| `id`: Unique identifier for the task (example: `1`)
- `title`：任务的简短描述性标题（示例：`"Initialize Repo"`）| `title`: Short descriptive title for the task (example: `"Initialize Repo"`)
- `description`：**必需** 任务涉及内容的简明描述（示例：`"Create a new repository, set up initial structure."`）| `description`: **Required** Concise description of what the task involves (example: `"Create a new repository, set up initial structure."`)
- `status`：任务的当前状态（示例：`"pending"`、`"done"`、`"deferred"`）| `status`: Current status of the task (example: `"pending"`, `"done"`, `"deferred"`)
- `dependencies`：必须在此任务之前完成的任务 ID（示例：`[1, 2]`）| `dependencies`: IDs of tasks that must be completed before this task (example: `[1, 2]`)
  - 依赖关系以状态指示器显示（✅ 表示已完成，⏱️ 表示待处理）| Dependencies are displayed with status indicators (✅ for completed, ⏱️ for pending)
  - 这有助于快速识别哪些先决任务正在阻塞工作 | This helps quickly identify which prerequisite tasks are blocking work
- `priority`：**必需** 任务的重要性级别。必须是以下之一：`"high"`、`"medium"`、`"low"`（示例：`"high"`）| `priority`: **Required** Importance level of the task. Must be one of: `"high"`, `"medium"`, `"low"` (example: `"high"`)
- `details`：**必需** 深入的实现说明（示例：`"Use GitHub client ID/secret, handle callback, set session token."`）| `details`: **Required** In-depth implementation instructions (example: `"Use GitHub client ID/secret, handle callback, set session token."`)
- `testStrategy`：**必需** 验证方法（示例：`"Deploy and call endpoint to confirm 'Hello World' response."`）| `testStrategy`: **Required** Verification approach (example: `"Deploy and call endpoint to confirm 'Hello World' response."`)
- `spec_files`：**必需** 关联的规范文档（示例：`[{"type": "plan", "title": "Implementation Plan", "file": "specs/001-task-plan.md"}]`）| `spec_files`: **Required** Associated specification documents (example: `[{"type": "plan", "title": "Implementation Plan", "file": "specs/001-task-plan.md"}]`)
- `logs`：实现过程日志（示例：`"2024-01-15: Started implementation, identified key challenges..."`）| `logs`: Implementation process logs (example: `"2024-01-15: Started implementation, identified key challenges..."`)
- `subtasks`：构成主任务的更小、更具体的任务列表（示例：`[{"id": 1, "title": "Configure OAuth", ...}]`）| `subtasks`: List of smaller, more specific tasks that make up the main task (example: `[{"id": 1, "title": "Configure OAuth", ...}]`)

## 任务文件格式 | Task File Format

单个任务文件遵循以下格式：

Individual task files follow this format:

```
# 任务 ID: <id> | Task ID: <id>
# 标题: <title> | Title: <title>
# 状态: <status> | Status: <status>
# 依赖关系: <依赖 ID 的逗号分隔列表> | Dependencies: <comma-separated list of dependency IDs>
# 优先级: <priority> | Priority: <priority>
# 描述: <brief description> | Description: <brief description>
# 详细信息: | Details:
<详细的实现说明> | <detailed implementation instructions>

# 测试策略: | Test Strategy:
<验证方法> | <verification method>
```

## 新增必需字段 | New Required Fields

### spec_files（必需）| spec_files (Required)

此字段对于所有任务和子任务都是**强制性的**。它在实现任务与其规范文档之间建立清晰的链接。

This field is **mandatory** for all tasks and subtasks. It establishes a clear link between task implementation and its specification documents.

**结构：| Structure:**
```json
"spec_files": [
  {
    "type": "plan",
    "title": "Implementation Plan",
    "file": "specs/001-task-plan.md"
  },
  {
    "type": "spec",
    "title": "Technical Specification",
    "file": "specs/001-technical-spec.md"
  }
]
```

**常见类型：| Common Types:**
- `plan`：实现计划和路线图 | `plan`: Implementation plans and roadmaps
- `spec`：技术规范和需求 | `spec`: Technical specifications and requirements
- `requirement`：业务需求文档 | `requirement`: Business requirement documents
- `design`：设计文档和线框图 | `design`: Design documents and wireframes
- `reference`：参考文档和相关材料 | `reference`: Reference documents and related materials

**验证规则：| Validation Rules:**
- 字段为必需且不能为空 | Field is required and cannot be empty
- 每个条目必须有 `type`、`title` 和 `file` 字段 | Each entry must have `type`, `title`, and `file` fields
- 文件路径应相对于项目根目录 | File paths should be relative to the project root directory
- 如果引用的文件不存在，系统将发出警告 | If referenced files don't exist, the system will issue warnings

### logs（可选）| logs (Optional)

此字段提供实现过程的时间记录，包括遇到的挑战和做出的决定。

This field provides timestamped records of the implementation process, including challenges encountered and decisions made.

**示例：| Example:**
```json
"logs": "2024-01-15 10:30: Started implementation of authentication module\n2024-01-15 14:20: Identified issue with token validation - switched to JWT\n2024-01-16 09:15: Completed basic auth flow, testing in progress"
```

**使用指南：| Usage Guidelines:**
- 使用时间戳进行时间顺序跟踪 | Use timestamps for chronological tracking
- 记录重要决定以及做出决定的原因 | Record important decisions and the reasoning behind them
- 记录遇到的挑战以及如何解决 | Record challenges encountered and how they were resolved
- 包含相关代码变更或提交的引用 | Include references to related code changes or commits

## 必需字段验证 | Required Field Validation

### 验证规则 | Validation Rules

系统在任务创建和更新期间对所有必需字段强制执行严格验证：

The system enforces strict validation on all required fields during task creation and updates:

#### 任务必需字段：| Task Required Fields:
- **description**：必须为非空字符串 | **description**: Must be a non-empty string
- **priority**：必须是以下之一：`"high"`、`"medium"`、`"low"` | **priority**: Must be one of: `"high"`, `"medium"`, `"low"`
- **details**：必须为非空字符串 | **details**: Must be a non-empty string
- **testStrategy**：必须为非空字符串 | **testStrategy**: Must be a non-empty string
- **spec_files**：必须包含至少一个规范文档 | **spec_files**: Must contain at least one specification document

#### 子任务必需字段：| Subtask Required Fields:
- **description**：必须为非空字符串 | **description**: Must be a non-empty string
- **priority**：必须是以下之一：`"high"`、`"medium"`、`"low"` | **priority**: Must be one of: `"high"`, `"medium"`, `"low"`
- **details**：必须为非空字符串 | **details**: Must be a non-empty string
- **testStrategy**：必须为非空字符串 | **testStrategy**: Must be a non-empty string
- **spec_files**：必须包含至少一个规范文档 | **spec_files**: Must contain at least one specification document

### 验证行为 | Validation Behavior

- **创建**：没有所有必需字段就无法创建任务和子任务 | **Creation**: Tasks and subtasks cannot be created without all required fields
- **更新**：尝试使用无效必需字段更新任务/子任务将被拒绝 | **Updates**: Attempts to update tasks/subtasks with invalid required fields will be rejected
- **错误消息**：清晰、具体的错误消息指导用户完成缺失信息 | **Error Messages**: Clear, specific error messages guide users to complete missing information
- **严格验证**：不提供默认值；用户必须为所有必需字段提供有意义的内容 | **Strict Validation**: No default values provided; users must provide meaningful content for all required fields

### 必需字段的最佳实践 | Best Practices for Required Fields

#### Description 字段：| Description Field:
- 编写清晰、可操作的描述 | Write clear, actionable descriptions
- 专注于任务完成的内容 | Focus on what the task completion entails
- 保持描述简洁但信息丰富 | Keep descriptions concise but informative

#### Priority 字段：| Priority Field:
- 对关键、时间敏感的任务使用 `"high"` | Use `"high"` for critical, time-sensitive tasks
- 对标准开发任务使用 `"medium"`（默认）| Use `"medium"` (default) for standard development tasks
- 对可有可无或延迟的任务使用 `"low"` | Use `"low"` for optional or delayed tasks

#### Details 字段：| Details Field:
- 提供全面的实现指导 | Provide comprehensive implementation guidance
- 包含技术规范和约束 | Include technical specifications and constraints
- 引用相关代码、文件或外部资源 | Reference related code, files, or external resources
- 考虑边缘情况和错误处理 | Consider edge cases and error handling

#### Test Strategy 字段：| Test Strategy Field:
- 定义清晰的验证标准 | Define clear validation criteria
- 包含正面和负面测试用例 | Include both positive and negative test cases
- 指定预期结果和成功指标 | Specify expected results and success metrics
- 考虑集成和回归测试需求 | Consider integration and regression testing needs

## 功能详解 | Feature Details

### 任务分解与扩展 | Task Decomposition and Expansion

Speco Tasker 支持手动任务分解功能：

Speco Tasker supports manual task decomposition functionality:

### 手动任务扩展 | Manual Task Expansion

您可以手动将复杂任务分解为更小的子任务：

You can manually break down complex tasks into smaller subtasks:

```bash
# 将任务分解为子任务 | Break down task into subtasks
speco-tasker add-subtask --parent=<task-id> --title="子任务标题" --description="子任务描述"

# 为子任务设置依赖关系 | Set dependencies for subtasks
speco-tasker add-subtask --parent=<task-id> --title="依赖任务" --dependencies="1.1,1.2"
```

### 任务重组 | Task Reorganization

支持任务的重组和重新排序：

Supports task reorganization and reordering:

```bash
# 将子任务提升为独立任务 | Promote subtask to standalone task
task-master remove-subtask --id=<parentId.subtaskId> --convert

# 在任务层次结构中移动任务 | Move task within task hierarchy
task-master move --from=<id> --to=<new-position>

# 在不同标签之间移动任务 | Move task between different tags
task-master move --from=<id> --from-tag=<source> --to-tag=<target>
```

### 查找下一个任务 | Find Next Task

`next` 命令：

`next` command:

- 识别所有依赖关系已满足的待处理/进行中任务 | Identifies all pending/in-progress tasks with satisfied dependencies
- 按优先级、依赖计数和任务 ID 排序任务 | Sorts tasks by priority, dependency count, and task ID
- 显示有关选定任务的综合信息：| Displays comprehensive information about selected task:
  - 基本任务详情（ID、标题、优先级、依赖关系）| Basic task details (ID, title, priority, dependencies)
  - 实现详情 | Implementation details
  - 子任务（如果存在）| Subtasks (if any exist)
- 提供上下文建议操作：| Provides contextual suggested actions:
  - 将任务标记为进行中的命令 | Command to mark task as in-progress
  - 将任务标记为完成的命令 | Command to mark task as done
  - 处理子任务的命令 | Commands to handle subtasks

### 查看特定任务详情 | View Specific Task Details

`show` 命令：

`show` command:

- 显示特定任务或子任务的综合详情 | Displays comprehensive details for specific task or subtask
- 显示任务状态、优先级、依赖关系和详细实现说明 | Shows task status, priority, dependencies, and detailed implementation instructions
- 对于父任务，显示所有子任务及其状态 | For parent tasks, shows all subtasks and their statuses
- 对于子任务，显示父任务关系 | For subtasks, shows parent task relationship
- 根据任务状态提供上下文操作建议 | Provides contextual action suggestions based on task status
- 适用于常规任务和子任务（使用 taskId.subtaskId 格式）| Applicable to both regular tasks and subtasks (using taskId.subtaskId format)

## 手动任务管理的最佳实践 | Best Practices for Manual Task Management

1. **制定详细的任务计划**：在开始项目前，仔细规划任务结构和依赖关系。 | **Create Detailed Task Plans**: Carefully plan task structure and dependencies before starting a project.

2. **定期审查任务**：定期检查任务状态，确保所有依赖关系正确设置。 | **Regular Task Review**: Regularly check task status to ensure all dependencies are correctly set.

3. **分解复杂任务**：将大任务分解为更小的、可管理的子任务。 | **Decompose Complex Tasks**: Break down large tasks into smaller, manageable subtasks.

4. **维护依赖关系**：始终尊重任务依赖关系，确保按正确的顺序执行任务。 | **Maintain Dependencies**: Always respect task dependencies to ensure tasks are executed in the correct order.

5. **及时更新状态**：任务状态发生变化时，及时更新以反映当前进度。 | **Update Status Timely**: Update task status promptly when changes occur to reflect current progress.

6. **使用标签组织**：利用标签系统按功能、分支或项目阶段组织任务。 | **Use Tags for Organization**: Utilize the tag system to organize tasks by function, branch, or project phase.

7. **定期生成文件**：对 tasks.json 进行更新后，重新生成任务文件以保持同步。 | **Generate Files Regularly**: Regenerate task files after updating tasks.json to maintain synchronization.

8. **协作时同步**：在团队协作时，确保所有成员及时了解任务状态变化。 | **Synchronize During Collaboration**: Ensure all team members are aware of task status changes during collaboration.

9. **验证依赖关系**：定期运行 validate-dependencies 命令来检查无效或循环依赖关系。 | **Validate Dependencies**: Regularly run the validate-dependencies command to check for invalid or circular dependencies.

# 任务结构文档 | Task Structure Documentation

Speco Tasker 使用结构化的 JSON 格式来组织和管理任务，引入了**带标签的任务列表**用于多上下文任务管理，同时保持完全向后兼容性。

Speco Tasker uses structured JSON format to organize and manage tasks, introducing **tagged task lists** for multi-context task management while maintaining full backward compatibility.

## 带标签的任务列表系统 | Tagged Task List System

Speco Tasker 现在将任务组织到称为**标签**的单独上下文中。这使得可以在不同分支、环境或项目阶段等多上下文环境中工作，而不会产生冲突。

Speco Tasker now organizes tasks into separate contexts called **tags**. This enables working in multiple contexts such as different branches, environments, or project phases without conflicts.

### 数据结构概述 | Data Structure Overview

**带标签格式（当前）| Tagged Format (Current):**

```json
{
  "main": {
    "tasks": [
      { "id": 1, "title": "Setup API", "status": "pending", ... }
    ]
  },
  "feature-branch": {
    "tasks": [
      { "id": 1, "title": "New Feature", "status": "pending", ... }
    ]
  }
}
```

**传统格式（自动迁移）| Legacy Format (Auto-migrated):**

```json
{
  "tasks": [
    { "id": 1, "title": "Setup API", "status": "pending", ... }
  ]
}
```

### 基于标签的任务列表（v0.17+）和兼容性 | Tag-Based Task Lists (v0.17+) and Compatibility

- **无缝迁移**：现有的 `tasks.json` 文件自动迁移以使用"main"标签 | **Seamless Migration**: Existing `tasks.json` files are automatically migrated to use the "main" tag
- **零中断**：所有现有命令继续完全按以前的方式工作 | **Zero Disruption**: All existing commands continue to work exactly as before
- **向后兼容**：现有工作流程保持不变 | **Backward Compatible**: Existing workflows remain unchanged
- **静默过程**：迁移在首次使用时透明进行，并显示友好的通知 | **Silent Process**: Migration occurs transparently on first use with friendly notifications

## 核心任务属性 | Core Task Properties

标签上下文中的每个任务都包含以下属性：

Each task in a tag context contains the following properties:

### 必需属性 | Required Properties

- **`id`** (number)：标签上下文中的唯一标识符 | **`id`** (number): Unique identifier within the tag context

  ```json
  "id": 1
  ```

- **`title`** (string)：简短的描述性标题 | **`title`** (string): Short descriptive title

  ```json
  "title": "Implement user authentication"
  ```

- **`description`** (string)：任务涉及内容的简明摘要 | **`description`** (string): Concise summary of what the task entails

  ```json
  "description": "Create a secure authentication system using JWT tokens"
  ```

- **`status`** (string)：任务的当前状态 | **`status`** (string): Current status of the task
  - 有效值：`"pending"`、`"in-progress"`、`"done"`、`"review"`、`"deferred"`、`"cancelled"` | Valid values: `"pending"`, `"in-progress"`, `"done"`, `"review"`, `"deferred"`, `"cancelled"`
  ```json
  "status": "pending"
  ```

### 可选属性 | Optional Properties

- **`dependencies`** (array)：必须先完成的前提任务 ID | **`dependencies`** (array): IDs of prerequisite tasks that must be completed first

  ```json
  "dependencies": [2, 3]
  ```

- **`priority`** (string)：重要性级别 | **`priority`** (string): Importance level

  - 有效值：`"high"`、`"medium"`、`"low"` | Valid values: `"high"`, `"medium"`, `"low"`
  - 默认：`"medium"` | Default: `"medium"`

  ```json
  "priority": "high"
  ```

- **`details`** (string)：深入的实现说明 | **`details`** (string): In-depth implementation instructions

  ```json
  "details": "Use GitHub OAuth client ID/secret, handle callback, set session token"
  ```

- **`testStrategy`** (string)：验证方法 | **`testStrategy`** (string): Verification method

  ```json
  "testStrategy": "Deploy and call endpoint to confirm authentication flow"
  ```

- **`subtasks`** (array)：更小、更具体的任务列表 | **`subtasks`** (array): List of smaller, more specific tasks
  ```json
  "subtasks": [
    {
      "id": 1,
      "title": "Configure OAuth",
      "description": "Set up OAuth configuration",
      "status": "pending",
      "dependencies": [],
      "details": "Configure GitHub OAuth app and store credentials"
    }
  ]
  ```

## 子任务结构 | Subtask Structure

子任务遵循与主任务类似的结构，但有一些差异：

Subtasks follow a similar structure to main tasks, but with some differences:

### 子任务属性 | Subtask Properties

- **`id`** (number)：父任务内的唯一标识符 | **`id`** (number): Unique identifier within the parent task
- **`title`** (string)：简短的描述性标题 | **`title`** (string): Short descriptive title
- **`description`** (string)：**必需** 子任务的简明摘要 | **`description`** (string): **Required** Concise summary of the subtask
- **`status`** (string)：当前状态（与主任务相同的值） | **`status`** (string): Current status (same values as main tasks)
- **`dependencies`** (array)：可以引用其他子任务或主任务 ID | **`dependencies`** (array): Can reference other subtasks or main task IDs
- **`priority`** (string)：**必需** 重要性级别。必须是以下之一：`"high"`、`"medium"`、`"low"` | **`priority`** (string): **Required** Importance level. Must be one of: `"high"`, `"medium"`, `"low"`
- **`details`** (string)：**必需** 实现说明和注释 | **`details`** (string): **Required** Implementation instructions and notes
- **`testStrategy`** (string)：**必需** 子任务的验证方法 | **`testStrategy`** (string): **Required** Verification method for the subtask
- **`spec_files`** (array)：**必需** 关联的规范文档（与主任务相同结构） | **`spec_files`** (array): **Required** Associated specification documents (same structure as main tasks)
- **`logs`** (string)：**可选** 实现过程日志 | **`logs`** (string): **Optional** Implementation process logs

### 子任务示例 | Subtask Example

```json
{
  "id": 2,
  "title": "Handle OAuth callback",
  "description": "Process the OAuth callback and extract user data",
  "status": "pending",
  "dependencies": [1],
  "priority": "high",
  "details": "Parse callback parameters, exchange code for token, fetch user profile",
  "testStrategy": "Test OAuth callback with valid and invalid parameters",
  "spec_files": [
    {
      "type": "spec",
      "title": "OAuth Implementation Specification",
      "file": "specs/oauth-callback-spec.md"
    }
  ],
  "logs": "2024-01-15: Started OAuth callback implementation\n2024-01-15: Completed parameter parsing logic"
}
```

## 完整示例 | Complete Example

以下是显示带标签任务结构的完整示例：

The following is a complete example showing the tagged task structure:

```json
{
  "main": {
    "tasks": [
      {
        "id": 1,
        "title": "Setup Express Server",
        "description": "Initialize and configure Express.js server with middleware",
        "status": "done",
        "dependencies": [],
        "priority": "high",
        "details": "Create Express app with CORS, body parser, and error handling",
        "testStrategy": "Start server and verify health check endpoint responds",
        "spec_files": [
          {
            "type": "plan",
            "title": "Express Server Setup Plan",
            "file": "specs/001-express-setup-plan.md"
          },
          {
            "type": "spec",
            "title": "Express Server Technical Specification",
            "file": "specs/001-express-server-spec.md"
          }
        ],
        "logs": "2024-01-15: 开始 Express 服务器设置\n2024-01-15: 配置了中间件和基本路由",
        "subtasks": [
          {
            "id": 1,
            "title": "Initialize npm project",
            "description": "Set up package.json and install dependencies",
            "status": "done",
            "dependencies": [],
            "priority": "high",
            "details": "Run npm init, install express, cors, body-parser",
            "testStrategy": "Verify package.json is created and dependencies are installed",
            "spec_files": [
              {
                "type": "spec",
                "title": "NPM Project Setup Specification",
                "file": "specs/001-npm-setup-spec.md"
              }
            ],
            "logs": "2024-01-15: 运行了 npm init 并安装了核心依赖"
          },
          {
            "id": 2,
            "title": "Configure middleware",
            "description": "Set up CORS and body parsing middleware",
            "status": "done",
            "dependencies": [1],
            "priority": "medium",
            "details": "Add app.use() calls for cors() and express.json()",
            "testStrategy": "Test middleware configuration with sample requests",
            "spec_files": [
              {
                "type": "spec",
                "title": "Middleware Configuration Specification",
                "file": "specs/001-middleware-config-spec.md"
              }
            ],
            "logs": "2024-01-15: 添加了 CORS 和 body 解析中间件\n2024-01-15: 验证了中间件配置"
          }
        ]
      },
      {
        "id": 2,
        "title": "Implement user authentication",
        "description": "Create secure authentication system",
        "status": "pending",
        "dependencies": [1],
        "priority": "high",
        "details": "Use JWT tokens for session management",
        "testStrategy": "Test login/logout flow with valid and invalid credentials",
        "spec_files": [
          {
            "type": "spec",
            "title": "Authentication System Specification",
            "file": "specs/002-auth-system-spec.md"
          },
          {
            "type": "design",
            "title": "Authentication Flow Design",
            "file": "specs/002-auth-flow-design.md"
          }
        ],
        "logs": "2024-01-16: 开始认证系统设计\n2024-01-16: 选择 JWT 而非基于会话的认证",
        "subtasks": []
      }
    ]
  },
  "feature-auth": {
    "tasks": [
      {
        "id": 1,
        "title": "OAuth Integration",
        "description": "Add OAuth authentication support",
        "status": "pending",
        "dependencies": [],
        "priority": "medium",
        "details": "Integrate with GitHub OAuth for user authentication",
        "testStrategy": "Test OAuth flow with GitHub account",
        "spec_files": [
          {
            "type": "spec",
            "title": "OAuth Integration Specification",
            "file": "specs/feature-auth-oauth-spec.md"
          },
          {
            "type": "requirement",
            "title": "OAuth Integration Requirements",
            "file": "specs/feature-auth-requirements.md"
          }
        ],
        "logs": "2024-01-17: 开始 OAuth 集成分析\n2024-01-17: 选择 GitHub OAuth 作为主要提供商",
        "subtasks": []
      }
    ]
  }
}
```

## 标签上下文管理 | Tag Context Management

### 当前标签解析 | Current Tag Resolution

Speco Tasker 根据以下内容自动确定当前标签上下文：

Speco Tasker automatically determines the current tag context based on:

1. **状态配置**：存储在 `.taskmaster/state.json` 中的当前标签 | **State Configuration**: Current tag stored in `.taskmaster/state.json`
2. **默认回退**：未指定上下文时使用"main"标签 | **Default Fallback**: Uses "main" tag when no context is specified
3. **未来增强**：基于 Git 分支的标签切换（第 2 部分） | **Future Enhancement**: Git branch-based tag switching (Part 2)

### 标签隔离 | Tag Isolation

- **上下文分离**：不同标签中的任务完全隔离 | **Context Separation**: Tasks in different tags are completely isolated
- **独立编号**：每个标签都有自己的从 1 开始的任务 ID 序列 | **Independent Numbering**: Each tag has its own task ID sequence starting from 1
- **并行开发**：多个团队成员可以在单独的标签中工作而不会产生冲突 | **Parallel Development**: Multiple team members can work in separate tags without conflicts

## 数据验证

Speco Tasker 验证任务数据的以下方面：

Speco Tasker validates the following aspects of task data:

### 必需验证 | Required Validation

- **唯一 ID**：任务 ID 在每个标签上下文中必须唯一 | **Unique ID**: Task ID must be unique within each tag context
- **有效状态**：状态值必须来自允许的集合 | **Valid Status**: Status value must come from the allowed set
- **依赖引用**：依赖关系必须引用同一标签内存在的任务 ID | **Dependency References**: Dependencies must reference task IDs that exist within the same tag
- **子任务 ID**：子任务 ID 在其父任务内必须唯一 | **Subtask ID**: Subtask ID must be unique within its parent task

### 可选验证 | Optional Validation

- **循环依赖**：系统检测并防止循环依赖链 | **Circular Dependencies**: System detects and prevents circular dependency chains
- **优先级值**：如果指定，优先级必须是允许的值之一 | **Priority Values**: If specified, priority must be one of the allowed values
- **数据类型**：所有属性必须与其预期数据类型匹配 | **Data Types**: All properties must match their expected data types

## 文件生成 | File Generation

Speco Tasker 可以基于 JSON 结构为每个任务生成单独的 markdown 文件。这些文件包括：

Speco Tasker can generate individual markdown files for each task based on the JSON structure. These files include:

- **任务概览**：ID、标题、状态、依赖关系 | **Task Overview**: ID, title, status, dependencies
- **标签上下文**：任务所属的标签 | **Tag Context**: The tag the task belongs to
- **实现详情**：完整的任务详情和测试策略 | **Implementation Details**: Complete task details and test strategy
- **子任务分解**：所有子任务及其当前状态 | **Subtask Breakdown**: All subtasks and their current status
- **依赖状态**：显示哪些依赖关系已完成的视觉指示器 | **Dependency Status**: Visual indicators showing which dependencies are completed

## 迁移过程 | Migration Process

当 Speco Tasker 遇到传统格式的 `tasks.json` 文件时：

When Speco Tasker encounters a legacy format `tasks.json` file:

1. **检测**：自动检测 `{"tasks": [...]}` 格式 | **Detection**: Automatically detects the `{"tasks": [...]}` format
2. **转换**：转换为 `{"main": {"tasks": [...]}}` 格式 | **Conversion**: Converts to `{"main": {"tasks": [...]}}` format
3. **配置**：使用带标签的系统设置更新 `.taskmaster/config.json` | **Configuration**: Updates `.taskmaster/config.json` with tagged system settings
4. **状态创建**：创建 `.taskmaster/state.json` 用于标签管理 | **State Creation**: Creates `.taskmaster/state.json` for tag management
5. **通知**：显示关于新系统的一次性友好通知 | **Notification**: Displays a one-time friendly notification about the new system
6. **保留**：所有现有任务数据完全按原样保留 | **Preservation**: All existing task data is preserved exactly as-is

## 最佳实践 | Best Practices

### 任务组织 | Task Organization

- **逻辑分组**：使用标签对相关任务进行分组（例如，按功能、分支或里程碑） | **Logical Grouping**: Use tags to group related tasks (e.g., by function, branch, or milestone)
- **清晰标题**：使用描述性标题来解释任务的目的 | **Clear Titles**: Use descriptive titles to explain the task's purpose
- **适当依赖关系**：定义依赖关系以确保正确的执行顺序 | **Appropriate Dependencies**: Define dependencies to ensure correct execution order
- **详细说明**：在 `details` 字段中包含足够的实现细节 | **Detailed Instructions**: Include sufficient implementation details in the `details` field

### 规范文档管理 | Specification Document Management

- **完整文档**：在任务实现之前始终确保 `spec_files` 字段已填充 | **Complete Documentation**: Always ensure the `spec_files` field is populated before task implementation
- **文件组织**：将规范文档保存在一致的位置（例如，`specs/` 目录） | **File Organization**: Store specification documents in a consistent location (e.g., `specs/` directory)
- **版本控制**：将规范文档纳入版本控制 | **Version Control**: Include specification documents in version control
- **交叉引用**：使用一致的文件命名模式以便于引用 | **Cross-Referencing**: Use consistent file naming patterns for easy reference

### 实现日志记录 | Implementation Logging

- **定期更新**：在实现过程中定期更新 `logs` 字段 | **Regular Updates**: Regularly update the `logs` field during implementation
- **时间戳**：包含时间戳以进行时间顺序跟踪 | **Timestamps**: Include timestamps for chronological tracking
- **决策记录**：记录重要的架构和实现决策 | **Decision Records**: Record important architectural and implementation decisions
- **问题-解决方案对**：记录遇到的挑战以及如何解决 | **Problem-Solution Pairs**: Record challenges encountered and how they were resolved

### 标签管理 | Tag Management

- **有意义名称**：使用反映其目的的描述性标签名称 | **Meaningful Names**: Use descriptive tag names that reflect their purpose
- **一致命名**：建立标签的命名约定（例如，分支名称、功能名称） | **Consistent Naming**: Establish naming conventions for tags (e.g., branch names, feature names)
- **上下文切换**：注意您正在使用哪个标签上下文 | **Context Switching**: Pay attention to which tag context you're using
- **隔离优势**：利用标签隔离来防止合并冲突 | **Isolation Benefits**: Utilize tag isolation to prevent merge conflicts

### 子任务设计 | Subtask Design

- **细粒度任务**：将复杂任务分解为可管理的子任务 | **Fine-Grained Tasks**: Break down complex tasks into manageable subtasks
- **清晰依赖关系**：定义子任务依赖关系以显示实现顺序 | **Clear Dependencies**: Define subtask dependencies to show implementation order
- **实现注释**：使用子任务详情来跟踪进度和决策 | **Implementation Notes**: Use subtask details to track progress and decisions
- **状态跟踪**：保持子任务状态的更新，因为工作进展 | **Status Tracking**: Keep subtask statuses updated as work progresses

---

*最后更新：2025年09月17日 | Last updated: September 17, 2025*
