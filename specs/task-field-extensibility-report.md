# Task Master 任务及子任务字段可扩展性调研报告

**报告日期**：2025年09月15日

## 1. 引言

本报告旨在调研和总结 Task Master 项目中任务（Task）和子任务（Subtask）字段的可扩展性。随着项目的发展，用户可能需要为任务添加自定义属性以满足更具体的业务需求。本报告将分析当前系统对字段扩展的支持程度、代码中的相关限制，并提出可能的扩展方案。

## 2. 当前任务字段结构

Task Master 在 `tasks.json` 文件中定义了标准化的任务和子任务字段结构。

### 2.1 任务核心字段

- **`id`** (number): 任务的唯一标识符。
- **`title`** (string): 任务的简明标题。
- **`description`** (string): 任务的简要描述。
- **`status`** (string): 任务的当前状态。预定义值包括 `pending` (待处理), `done` (完成), `in-progress` (进行中), `review` (评审中), `deferred` (推迟), `cancelled` (已取消)。
- **`dependencies`** (array): 前置任务的 ID 数组，这些任务必须先完成。
- **`priority`** (string): 任务的重要性级别。预定义值包括 `high` (高), `medium` (中), `low` (低)。
- **`details`** (string): 详细的实现说明和指导。
- **`testStrategy`** (string): 验证任务完成的详细方法。
- **`subtasks`** (array): 包含更小、更具体的子任务对象的数组。

### 2.2 子任务核心字段

子任务的结构与主任务类似，但有一些差异：

- **`id`** (number): 在父任务内部的唯一标识符。
- **`title`** (string): 子任务的简明标题。
- **`description`** (string): 子任务的简要描述。
- **`status`** (string): 子任务的当前状态，与主任务状态值相同。
- **`dependencies`** (array): 可以引用其他子任务或主任务的 ID。
- **`details`** (string): 实现说明和备注。

## 3. 自定义扩展的当前支持程度

### 3.1 ✅ 支持的扩展方式

1.  **现有文本字段的自定义内容**：
    *   `details` 和 `description` 字段可以存储大量的自定义文本信息，甚至可以嵌入 JSON 格式的字符串来模拟自定义数据。
    *   `title` 字段可以包含自定义的命名约定或简短标识符。
2.  **自定义状态值 (有限支持)**：
    *   `status` 字段理论上可以通过修改 `src/constants/task-status.js` 来添加新的状态值，从而扩展任务生命周期管理。
3.  **JSON 格式的灵活性 (间接)**：
    *   任务数据底层以 JSON 格式存储在 `tasks.json` 中，这为未来可能的结构扩展提供了基础。

### 3.2 ❌ 不支持的扩展方式

1.  **动态自定义字段名称**：
    *   Task Master 不支持在任务或子任务对象中直接添加任意命名的新字段。例如，不能直接添加 `"assignedTo": "userA"` 这样的字段。
    *   系统仅识别和处理预定义的字段结构。
2.  **配置化的字段定义**：
    *   当前系统没有提供配置机制（如配置文件或命令行选项）来动态定义新的任务字段及其类型。
    *   所有任务实例都必须遵循统一的字段结构。

## 4. 代码中的相关限制分析

### 4.1 任务创建与 Zod Schema 验证

在 `scripts/modules/task-manager/add-task.js` 文件中，新任务对象的创建是严格按照预定义结构进行的。AI 生成的任务数据会通过 `AiTaskDataSchema` 进行验证，该 Schema 使用 `zod` 库定义，仅包含标准字段：

```javascript
// `scripts/modules/task-manager/add-task.js` 中的部分代码
const AiTaskDataSchema = z.object({
    title: z.string().describe('Clear, concise title for the task'),
    description: z.string().describe('A one or two sentence description of the task'),
    details: z.string().describe('In-depth implementation details, considerations, and guidance'),
    testStrategy: z.string().describe('Detailed approach for verifying task completion'),
    dependencies: z.array(z.number()).nullable()
});

// `newTask` 对象的创建也遵循严格的结构，没有为自定义字段预留空间
const newTask = {
    id: newTaskId,
    title: taskData.title,
    description: taskData.description,
    details: taskData.details || '',
    testStrategy: taskData.testStrategy || '',
    status: 'pending',
    dependencies: taskData.dependencies?.length
        ? taskData.dependencies
        : numericDependencies,
    priority: effectivePriority,
    subtasks: [] // 子任务字段也是固定的
};
```
这意味着任何 AI 生成的或手动创建的任务，都必须符合 `AiTaskDataSchema` 中定义的字段。超出此 Schema 的字段将被忽略或导致验证失败。

### 4.2 任务数据读写过程中的过滤

`scripts/modules/utils.js` 中的 `readJSON` 和 `writeJSON` 函数负责处理 `tasks.json` 文件的读写。虽然这些函数在处理不同标签（tag）的任务数据时具有一定的灵活性，但在序列化和反序列化过程中，它们会确保数据结构符合内部期望，可能会对非标准字段进行过滤或不予处理。

## 5. 可能的扩展方案

如果业务需求确实需要自定义的任务字段，可以考虑以下几种方案：

### 方案 1：利用现有 `details` 字段存储 JSON 字符串（推荐短期方案）

这是最简单且无需修改核心代码的方案。将所有自定义数据序列化为 JSON 字符串，存储在 `details` 字段中。

**优点**：
- 无需修改现有代码，风险最低。
- 保持与现有系统的完全兼容性。

**缺点**：
- 自定义字段不可被 Task Master 直接解析和操作。
- 需要在业务逻辑中手动解析和序列化 `details` 字段的 JSON 内容。
- 搜索、过滤和报告功能无法直接利用这些自定义字段。

**示例**：
```json
{
  "id": 1,
  "title": "实现用户认证模块",
  "description": "使用 JWT 和 OAuth2 实现用户注册、登录和会话管理",
  "details": "{\"estimatedHours\": 40, \"assignedTo\": \"developerA\", \"dueDate\": \"2025-10-31\"}",
  // ... 其他标准字段
}
```

### 方案 2：修改核心代码以支持 `customFields` 对象

在任务结构中引入一个专门的 `customFields` 对象，用于存储所有自定义键值对。

**修改步骤**：
1.  **更新 `AiTaskDataSchema`** (`scripts/modules/task-manager/add-task.js`)：
    ```javascript
    const AiTaskDataSchema = z.object({
        // ... 现有字段
        customFields: z.record(z.any()).optional().describe('自定义字段，键值对形式')
    });
    ```
2.  **更新任务创建逻辑** (`scripts/modules/task-manager/add-task.js`)：
    在 `newTask` 对象中包含 `customFields` 字段。
    ```javascript
    const newTask = {
        // ... 现有字段
        customFields: manualTaskData?.customFields || {} // 从手动数据或 AI 数据中获取
    };
    ```
3.  **更新 `docs/task-structure.md`**：
    添加 `customFields` 字段的文档说明。
4.  **更新所有涉及任务对象读写和展示的模块**：
    确保这些模块在读写任务数据时能够正确处理 `customFields` 字段，并在需要时进行展示。

**优点**：
- 自定义字段被系统明确支持，结构清晰。
- 可以通过 `customFields` 对象进行统一访问和管理。

**缺点**：
- 需要修改核心代码，引入一定的维护成本。
- 自动化工具（如 AI 分析、报告）可能无法理解 `customFields` 内部的具体含义，除非增加额外的 AI 提示工程或解析逻辑。

### 方案 3：扩展 `src/constants/task-status.js` 或 `task-priority.js` (针对特定枚举类型)

如果自定义字段是枚举类型（如新的状态或优先级），可以直接修改相应的常量文件。

**修改步骤**：
1.  **修改 `src/constants/task-status.js` 或 `src/constants/task-priority.js`**：
    添加新的允许值到 `TASK_STATUS_OPTIONS` 或 `TASK_PRIORITY_OPTIONS` 数组。
2.  **更新相关验证逻辑**：
    如果自定义状态/优先级需要特殊的处理逻辑，则需要更新相应的处理函数。
3.  **更新文档** (`docs/task-structure.md`)。

**优点**：
- 对于枚举类型字段，这是最直接且官方支持的扩展方式。
- 系统能够直接理解和验证这些新值。

**缺点**：
- 仅适用于枚举类型，无法满足任意键值对的自定义。
- 每次添加新值都需要修改代码。

## 6. 结论

Task Master 的任务和子任务结构目前是固定的，不支持在不修改核心代码的情况下动态添加自定义字段。这主要是为了保持系统的简洁性、AI处理的确定性以及向后兼容性。

如果需要实现自定义字段，**短期内最稳妥的方案是利用 `details` 字段以 JSON 字符串的形式存储额外数据**。
若追求更结构化的支持，**引入一个 `customFields` 对象到任务结构中（方案 2）**是一个可行但需要修改核心代码的中长期方案。对于枚举类型的扩展，可以直接修改 `src/constants` 目录下的相关文件。

在做出扩展决策时，应权衡开发成本、维护复杂度以及对现有系统（尤其是 AI 相关功能）的潜在影响。
