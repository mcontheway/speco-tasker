# 任务结构

Speco Tasker 中的任务遵循特定格式，旨在为人类和 AI 助手提供全面信息。

## tasks.json 中的任务字段

tasks.json 中的任务具有以下结构：

- `id`：任务的唯一标识符（示例：`1`）
- `title`：任务的简短描述性标题（示例：`"Initialize Repo"`）
- `description`：**必需** 任务涉及内容的简明描述（示例：`"Create a new repository, set up initial structure."`）
- `status`：任务的当前状态（示例：`"pending"`、`"done"`、`"deferred"`）
- `dependencies`：必须在此任务之前完成的任务 ID（示例：`[1, 2]`）
  - 依赖关系以状态指示器显示（✅ 表示已完成，⏱️ 表示待处理）
  - 这有助于快速识别哪些先决任务正在阻塞工作
- `priority`：**必需** 任务的重要性级别。必须是以下之一：`"high"`、`"medium"`、`"low"`（示例：`"high"`）
- `details`：**必需** 深入的实现说明（示例：`"Use GitHub client ID/secret, handle callback, set session token."`）
- `testStrategy`：**必需** 验证方法（示例：`"Deploy and call endpoint to confirm 'Hello World' response."`）
- `spec_files`：**必需** 关联的规范文档（示例：`[{"type": "plan", "title": "Implementation Plan", "file": "specs/001-task-plan.md"}]`)
- `logs`：实现过程日志（示例：`"2024-01-15: Started implementation, identified key challenges..."`）
- `subtasks`：构成主任务的更小、更具体的任务列表（示例：`[{"id": 1, "title": "Configure OAuth", ...}]`）

## 任务文件格式

单个任务文件遵循以下格式：

```
# 任务 ID: <id>
# 标题: <title>
# 状态: <status>
# 依赖关系: <依赖 ID 的逗号分隔列表>
# 优先级: <priority>
# 描述: <brief description>
# 详细信息:
<详细的实现说明>

# 测试策略:
<验证方法>
```

## 新增必需字段

### spec_files（必需）

此字段对于所有任务和子任务都是**强制性的**。它在实现任务与其规范文档之间建立清晰的链接。

**结构：**
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

**常见类型：**
- `plan`：实现计划和路线图
- `spec`：技术规范和需求
- `requirement`：业务需求文档
- `design`：设计文档和线框图
- `analysis`：分析报告和研究发现

**验证规则：**
- 字段为必需且不能为空
- 每个条目必须有 `type`、`title` 和 `file` 字段
- 文件路径应相对于项目根目录
- 如果引用的文件不存在，系统将发出警告

### logs（可选）

此字段提供实现过程的时间记录，包括遇到的挑战和做出的决定。

**示例：**
```json
"logs": "2024-01-15 10:30: Started implementation of authentication module\n2024-01-15 14:20: Identified issue with token validation - switched to JWT\n2024-01-16 09:15: Completed basic auth flow, testing in progress"
```

**使用指南：**
- 使用时间戳进行时间顺序跟踪
- 记录重要决定以及做出决定的原因
- 记录遇到的挑战以及如何解决
- 包含相关代码变更或提交的引用

## 必需字段验证

### 验证规则

系统在任务创建和更新期间对所有必需字段强制执行严格验证：

#### 任务必需字段：
- **description**：必须为非空字符串
- **priority**：必须是以下之一：`"high"`、`"medium"`、`"low"`
- **details**：必须为非空字符串
- **testStrategy**：必须为非空字符串
- **spec_files**：必须包含至少一个规范文档

#### 子任务必需字段：
- **description**：必须为非空字符串
- **priority**：必须是以下之一：`"high"`、`"medium"`、`"low"`
- **details**：必须为非空字符串
- **testStrategy**：必须为非空字符串
- **spec_files**：必须包含至少一个规范文档

### 验证行为

- **创建**：没有所有必需字段就无法创建任务和子任务
- **更新**：尝试使用无效必需字段更新任务/子任务将被拒绝
- **错误消息**：清晰、具体的错误消息指导用户完成缺失信息
- **严格验证**：不提供默认值；用户必须为所有必需字段提供有意义的内容

### 必需字段的最佳实践

#### Description 字段：
- 编写清晰、可操作的描述
- 专注于任务完成的内容
- 保持描述简洁但信息丰富

#### Priority 字段：
- 对关键、时间敏感的任务使用 `"high"`
- 对标准开发任务使用 `"medium"`（默认）
- 对可有可无或延迟的任务使用 `"low"`

#### Details 字段：
- 提供全面的实现指导
- 包含技术规范和约束
- 引用相关代码、文件或外部资源
- 考虑边缘情况和错误处理

#### Test Strategy 字段：
- 定义清晰的验证标准
- 包含正面和负面测试用例
- 指定预期结果和成功指标
- 考虑集成和回归测试需求

## 功能详解

### 分析任务复杂度

`analyze-complexity` 命令：

- 使用 AI 分析每个任务，在 1-10 范围内评估其复杂度
- 根据配置的 DEFAULT_SUBTASKS 推荐最佳子任务数量
- 为每个任务生成定制的扩展提示
- 创建包含现成命令的综合 JSON 报告
- 默认将报告保存到 scripts/task-complexity-report.json

生成的报告包含：

- 每个任务的复杂度分析（1-10 分）
- 基于复杂度的推荐子任务数量
- 为每个任务定制的 AI 生成扩展提示
- 每个任务分析中的现成扩展命令

### 查看复杂度报告

`complexity-report` 命令：

- 显示复杂度分析报告的格式化、易读版本
- 按复杂度分数显示任务（从高到低）
- 提供复杂度分布统计（低、中、高）
- 根据阈值分数突出显示推荐扩展的任务
- 为每个复杂任务包含现成的扩展命令
- 如果不存在报告，则提供现场生成选项

### 智能任务扩展

`expand` 命令自动检查并使用复杂度报告：

当存在复杂度报告时：

- 使用推荐的子任务计数和提示自动扩展任务
- 扩展所有任务时，按复杂度顺序处理（最高优先）
- 从复杂度分析中保留研究支持的生成
- 您仍然可以使用显式命令行选项覆盖推荐

示例工作流程：

```bash
# 使用研究功能生成复杂度分析报告
task-master analyze-complexity --research

# 以可读格式查看报告
task-master complexity-report

# 使用优化推荐扩展任务
task-master expand --id=8
# 或扩展所有任务
task-master expand --all
```

### 查找下一个任务

`next` 命令：

- 识别所有依赖关系已满足的待处理/进行中任务
- 按优先级、依赖计数和任务 ID 排序任务
- 显示有关选定任务的综合信息：
  - 基本任务详情（ID、标题、优先级、依赖关系）
  - 实现详情
  - 子任务（如果存在）
- 提供上下文建议操作：
  - 将任务标记为进行中的命令
  - 将任务标记为完成的命令
  - 处理子任务的命令

### 查看特定任务详情

`show` 命令：

- 显示特定任务或子任务的综合详情
- 显示任务状态、优先级、依赖关系和详细实现说明
- 对于父任务，显示所有子任务及其状态
- 对于子任务，显示父任务关系
- 根据任务状态提供上下文操作建议
- 适用于常规任务和子任务（使用 taskId.subtaskId 格式）

## AI 驱动开发的最佳实践

1. **从详细的 PRD 开始**：您的 PRD 越详细，生成的任务就越好。

2. **审查生成的任务**：解析 PRD 后，审查任务以确保它们合理并具有适当的依赖关系。

3. **分析任务复杂度**：使用复杂度分析功能来识别哪些任务应该进一步分解。

4. **遵循依赖链**：始终尊重任务依赖关系 - Cursor 代理会帮助您处理这个问题。

5. **随时更新**：如果您的实现偏离了计划，请使用更新命令来保持未来任务与您当前方法一致。

6. **分解复杂任务**：使用扩展命令将复杂任务分解为可管理的子任务。

7. **重新生成任务文件**：对 tasks.json 进行任何更新后，重新生成任务文件以保持同步。

8. **向代理传达上下文**：当要求 Cursor 代理帮助处理任务时，提供您试图实现的目标的上下文。

9. **验证依赖关系**：定期运行 validate-dependencies 命令来检查无效或循环依赖关系。

# 任务结构文档

Speco Tasker 使用结构化的 JSON 格式来组织和管理任务。从版本 0.16.2 开始，Speco Tasker 引入了**带标签的任务列表**用于多上下文任务管理，同时保持完全向后兼容性。

## 带标签的任务列表系统

Speco Tasker 现在将任务组织到称为**标签**的单独上下文中。这使得可以在不同分支、环境或项目阶段等多上下文环境中工作，而不会产生冲突。

### 数据结构概述

**带标签格式（当前）**：

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

**传统格式（自动迁移）**：

```json
{
  "tasks": [
    { "id": 1, "title": "Setup API", "status": "pending", ... }
  ]
}
```

### 基于标签的任务列表（v0.17+）和兼容性

- **无缝迁移**：现有的 `tasks.json` 文件自动迁移以使用"main"标签
- **零中断**：所有现有命令继续完全按以前的方式工作
- **向后兼容**：现有工作流程保持不变
- **静默过程**：迁移在首次使用时透明进行，并显示友好的通知

## 核心任务属性

标签上下文中的每个任务都包含以下属性：

### 必需属性

- **`id`** (number)：标签上下文中的唯一标识符

  ```json
  "id": 1
  ```

- **`title`** (string)：简短的描述性标题

  ```json
  "title": "Implement user authentication"
  ```

- **`description`** (string)：任务涉及内容的简明摘要

  ```json
  "description": "Create a secure authentication system using JWT tokens"
  ```

- **`status`** (string)：任务的当前状态
  - 有效值：`"pending"`、`"in-progress"`、`"done"`、`"review"`、`"deferred"`、`"cancelled"`
  ```json
  "status": "pending"
  ```

### 可选属性

- **`dependencies`** (array)：必须先完成的前提任务 ID

  ```json
  "dependencies": [2, 3]
  ```

- **`priority`** (string)：重要性级别

  - 有效值：`"high"`、`"medium"`、`"low"`
  - 默认：`"medium"`

  ```json
  "priority": "high"
  ```

- **`details`** (string)：深入的实现说明

  ```json
  "details": "Use GitHub OAuth client ID/secret, handle callback, set session token"
  ```

- **`testStrategy`** (string)：验证方法

  ```json
  "testStrategy": "Deploy and call endpoint to confirm authentication flow"
  ```

- **`subtasks`** (array)：更小、更具体的任务列表
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

## 子任务结构

子任务遵循与主任务类似的结构，但有一些差异：

### 子任务属性

- **`id`** (number)：父任务内的唯一标识符
- **`title`** (string)：简短的描述性标题
- **`description`** (string)：**必需** 子任务的简明摘要
- **`status`** (string)：当前状态（与主任务相同的值）
- **`dependencies`** (array)：可以引用其他子任务或主任务 ID
- **`priority`** (string)：**必需** 重要性级别。必须是以下之一：`"high"`、`"medium"`、`"low"`
- **`details`** (string)：**必需** 实现说明和注释
- **`testStrategy`** (string)：**必需** 子任务的验证方法
- **`spec_files`** (array)：**必需** 关联的规范文档（与主任务相同结构）
- **`logs`** (string)：**可选** 实现过程日志

### 子任务示例

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

## 完整示例

以下是显示带标签任务结构的完整示例：

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

## 标签上下文管理

### 当前标签解析

Speco Tasker 根据以下内容自动确定当前标签上下文：

1. **状态配置**：存储在 `.taskmaster/state.json` 中的当前标签
2. **默认回退**：未指定上下文时使用"main"标签
3. **未来增强**：基于 Git 分支的标签切换（第 2 部分）

### 标签隔离

- **上下文分离**：不同标签中的任务完全隔离
- **独立编号**：每个标签都有自己的从 1 开始的任务 ID 序列
- **并行开发**：多个团队成员可以在单独的标签中工作而不会产生冲突

## 数据验证

Speco Tasker 验证任务数据的以下方面：

### 必需验证

- **唯一 ID**：任务 ID 在每个标签上下文中必须唯一
- **有效状态**：状态值必须来自允许的集合
- **依赖引用**：依赖关系必须引用同一标签内存在的任务 ID
- **子任务 ID**：子任务 ID 在其父任务内必须唯一

### 可选验证

- **循环依赖**：系统检测并防止循环依赖链
- **优先级值**：如果指定，优先级必须是允许的值之一
- **数据类型**：所有属性必须与其预期数据类型匹配

## 文件生成

Speco Tasker 可以基于 JSON 结构为每个任务生成单独的 markdown 文件。这些文件包括：

- **任务概览**：ID、标题、状态、依赖关系
- **标签上下文**：任务所属的标签
- **实现详情**：完整的任务详情和测试策略
- **子任务分解**：所有子任务及其当前状态
- **依赖状态**：显示哪些依赖关系已完成的视觉指示器

## 迁移过程

当 Speco Tasker 遇到传统格式的 `tasks.json` 文件时：

1. **检测**：自动检测 `{"tasks": [...]}` 格式
2. **转换**：转换为 `{"main": {"tasks": [...]}}` 格式
3. **配置**：使用带标签的系统设置更新 `.taskmaster/config.json`
4. **状态创建**：创建 `.taskmaster/state.json` 用于标签管理
5. **通知**：显示关于新系统的一次性友好通知
6. **保留**：所有现有任务数据完全按原样保留

## 最佳实践

### 任务组织

- **逻辑分组**：使用标签对相关任务进行分组（例如，按功能、分支或里程碑）
- **清晰标题**：使用描述性标题来解释任务的目的
- **适当依赖关系**：定义依赖关系以确保正确的执行顺序
- **详细说明**：在 `details` 字段中包含足够的实现细节

### 规范文档管理

- **完整文档**：在任务实现之前始终确保 `spec_files` 字段已填充
- **文件组织**：将规范文档保存在一致的位置（例如，`specs/` 目录）
- **版本控制**：将规范文档纳入版本控制
- **交叉引用**：使用一致的文件命名模式以便于引用

### 实现日志记录

- **定期更新**：在实现过程中定期更新 `logs` 字段
- **时间戳**：包含时间戳以进行时间顺序跟踪
- **决策记录**：记录重要的架构和实现决策
- **问题-解决方案对**：记录遇到的挑战以及如何解决

### 标签管理

- **有意义名称**：使用反映其目的的描述性标签名称
- **一致命名**：建立标签的命名约定（例如，分支名称、功能名称）
- **上下文切换**：注意您正在使用哪个标签上下文
- **隔离优势**：利用标签隔离来防止合并冲突

### 子任务设计

- **细粒度任务**：将复杂任务分解为可管理的子任务
- **清晰依赖关系**：定义子任务依赖关系以显示实现顺序
- **实现注释**：使用子任务详情来跟踪进度和决策
- **状态跟踪**：保持子任务状态的更新，因为工作进展
