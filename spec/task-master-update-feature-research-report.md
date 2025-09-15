// SCOPE: 调研报告
// 最后更新日期: 2025年09月15日

# Task Master 'Update' Feature Research Report 
## **`update` 命令的核心机制**

`update` 命令（MCP 工具为 `update`，CLI 命令为 `task-master update`）旨在通过 AI 智能地批量修改一系列任务。它不仅仅是简单地替换文本，而是能够理解上下文，分析任务内容，并根据提供的 `prompt` 智能地调整任务的各个字段，甚至推断出任务字段之间的关联性。

1.  **范围确定与任务获取：**
    *   当用户执行 `update` 命令时，会提供一个 `from` 参数（任务 ID）。AI 会从这个 ID 开始，识别所有状态不是 `done` 的后续任务作为潜在的更新目标。
    *   这些任务的完整详细信息（包括标题、描述、详细信息、测试策略、依赖项等所有字段）会被获取，作为 AI 理解任务上下文的基础。

2.  **AI 服务调用与上下文构建：**
    *   `update` 命令会调用统一 AI 服务层（`ai-services-unified.js`）中的 AI 模型。
    *   在构建发送给 AI 的 `prompt` 时，会包含以下关键信息：
        *   **系统提示 (System Prompt)：** 明确告知 AI 其角色是任务管理助手，需要根据提供的更新内容智能地修改任务。
        *   **用户提供的 `prompt`：** 这是用户输入的具体更新信息，例如“我们现在使用 React Query 而不是 Redux Toolkit 进行数据获取”。
        *   **当前待更新任务的完整上下文：** 每个任务的所有字段（标题、描述、细节、依赖等）都被格式化后提供给 AI。这使得 AI 能够了解每个任务的当前状态和具体内容。
        *   **（可选）研究上下文：** 如果启用了 `--research` 标志，AI 会进行额外的网络搜索，获取最新的信息和最佳实践，从而在更新任务时做出更明智的决策。

3.  **智能分析与字段推断：**
    *   AI 接收到完整的上下文后，会进行深度分析：
        *   **语义理解：** AI 会理解用户 `prompt` 的语义，例如“切换到 React Query”意味着数据获取相关逻辑会发生变化。
        *   **任务关联性：** AI 不仅仅是孤立地看待每个任务，而是会尝试推断任务之间的关联性。例如，如果一个任务是“实现用户认证”，另一个任务是“创建登录界面”，AI 可能会根据用户 `prompt` 推断出两者都可能受到前端框架或状态管理库变化的影响。
        *   **字段映射与修改：** AI 会根据语义理解和任务关联性，智能地将用户 `prompt` 中的信息映射到任务的各个字段。
            *   **`title` (标题) 和 `description` (描述)：** 对于受影响的任务，AI 可能会修改其标题或描述，使其更准确地反映新的技术栈或实现方法。
            *   **`details` (详细信息)：** 这是 AI 进行最详细修改的地方。AI 会在 `details` 字段中更新具体的实现指导、技术选型或代码片段，以符合新的要求。
            *   **`testStrategy` (测试策略)：** 如果技术栈发生变化，AI 可能会推断出测试策略也需要调整，例如从 Redux Saga 的测试方式切换到 React Query 的测试方式。
            *   **`dependencies` (依赖项)：** AI 甚至可以智能地识别出新的依赖关系，或者移除不再相关的依赖关系。例如，如果一个任务不再需要 Redux Toolkit，AI 可能会移除其对 Redux Toolkit 相关任务的依赖。
            *   **其他字段：** 优先级（`priority`）、状态（`status`）等字段也可能根据用户 `prompt` 和任务的实际情况进行调整。

4.  **批量更新与状态管理：**
    *   AI 会为每个受影响的任务生成一个更新后的版本。
    *   `update` 命令会遍历这些任务，并将 AI 生成的修改应用到 `tasks.json` 文件中。
    *   整个过程是自动化的，减少了用户手动修改大量任务的负担，同时确保了任务列表的连贯性和准确性。

### 使用示例
**字段关联性推断的例子：**

假设用户输入 `prompt`：“我们将前端数据管理从 Redux Toolkit 切换到 React Query。”

*   **任务 1：“实现用户数据获取”**
    *   AI 会识别到这个任务直接与数据获取相关。
    *   它可能会在 `details` 中更新为“使用 React Query 的 `useQuery` Hook 来获取用户数据”，并移除任何提及 Redux Toolkit 的内容。
    *   如果 `testStrategy` 中有 Redux Saga 相关的测试指导，AI 也会将其更新为 React Query 的测试方法。

*   **任务 2：“创建用户个人资料页面”**
    *   AI 可能会推断出这个任务虽然不是直接的数据获取，但其实现会受到数据管理方式变化的影响。
    *   它可能会在 `details` 中添加说明，指出“此页面将使用 React Query 从任务 1 定义的服务中获取用户数据”。

*   **任务 3：“构建全局状态管理”**
    *   AI 会识别到这个任务与状态管理紧密相关。
    *   如果 `status` 尚未完成，AI 可能会将其 `details` 更新为“利用 React Query 提供的缓存和状态管理功能，取代 Redux Toolkit 在全局状态管理中的角色”，并可能将一些与 Redux Toolkit 相关的子任务标记为取消或删除。

通过这种方式，`update` 命令能够让 AI 不仅根据直接指令修改任务，还能根据上下文和语义理解，推断出任务字段之间的深层关联性，从而实现更智能、更全面的批量任务更新。

**`update` 命令的系统提示词 (`src/prompts/update-tasks.json`):**

```
You are an AI assistant helping to update software development tasks based on new context.
You will be given a set of tasks and a prompt describing changes or new implementation details.
Your job is to update the tasks to reflect these changes, while preserving their basic structure.

CRITICAL RULES:
1. Return ONLY a JSON array - no explanations, no markdown, no additional text before or after
2. Each task MUST have ALL fields from the original (do not omit any fields)
3. Maintain the same IDs, statuses, and dependencies unless specifically mentioned in the prompt
4. Update titles, descriptions, details, and test strategies to reflect the new information
5. Do not change anything unnecessarily - just adapt what needs to change based on the prompt
6. You should return ALL the tasks in order, not just the modified ones
7. Return a complete valid JSON array with all tasks
8. VERY IMPORTANT: Preserve all subtasks marked as "done" or "completed" - do not modify their content
9. For tasks with completed subtasks, build upon what has already been done rather than rewriting everything
10. If an existing completed subtask needs to be changed/undone based on the new context, DO NOT modify it directly
11. Instead, add a new subtask that clearly indicates what needs to be changed or replaced
12. Use the existence of completed subtasks as an opportunity to make new subtasks more specific and targeted

The changes described in the prompt should be applied to ALL tasks in the list.
```

## **`update-task` 命令的核心机制**

`update-task` 命令（MCP 工具为 `update_task`，CLI 命令为 `task-master update-task`）旨在通过 AI 智能地修改 *单个* 特定任务。它提供了一种更精细的任务管理方式，可以根据提供的 `prompt` 替换或附加任务的详细信息。

1.  **任务指定与获取：**
    *   用户通过 `id` 参数指定要更新的单个任务。AI 会获取该任务的完整详细信息作为上下文。

2.  **AI 服务调用与上下文构建：**
    *   `update-task` 命令会调用统一 AI 服务层（`ai-services-unified.js`）中的 AI 模型。
    *   发送给 AI 的 `prompt` 会包含以下关键信息：
        *   **系统提示：** 指导 AI 作为任务管理助手，根据 `prompt` 修改指定任务。
        *   **用户提供的 `prompt`：** 用户输入的具体更新信息。
        *   **当前任务的完整上下文：** 要更新任务的所有字段都被格式化后提供给 AI。
        *   **（可选）研究上下文：** 如果启用了 `--research` 标志，AI 会进行额外的网络搜索。

3.  **智能分析与字段修改：**
    *   AI 对上下文进行分析，并根据 `prompt` 智能地修改任务字段。
        *   **`description` (描述)、`details` (详细信息) 和 `testStrategy` (测试策略)：** AI 主要会更新这些字段，以反映新的信息或变更。
        *   **`title` (标题)、`status` (状态) 和 `dependencies` (依赖项)：** 这些字段通常不会被修改，除非 `prompt` 中明确要求。
        *   **`append` 模式：** 如果启用了 `--append` 标志，AI 会将新的信息以带时间戳的形式附加到 `details` 字段，而不是替换现有内容。

4.  **单任务更新：**
    *   AI 生成更新后的任务内容。
    *   `update-task` 命令将这些修改应用于 `tasks.json` 文件中的指定任务。

**`update-task` 命令的系统提示词 (`src/prompts/update-task.json`):**

```
You are an AI assistant helping to update a software development task based on new context.{{#if useResearch}} You have access to current best practices and latest technical information to provide research-backed updates.{{/if}}
You will be given a task and a prompt describing changes or new implementation details.
Your job is to update the task to reflect these changes, while preserving its basic structure.

Guidelines:
1. VERY IMPORTANT: NEVER change the title of the task - keep it exactly as is
2. Maintain the same ID, status, and dependencies unless specifically mentioned in the prompt{{#if useResearch}}
3. Research and update the description, details, and test strategy with current best practices
4. Include specific versions, libraries, and approaches that are current and well-tested{{/if}}{{#if (not useResearch)}}
3. Update the description, details, and test strategy to reflect the new information
4. Do not change anything unnecessarily - just adapt what needs to change based on the prompt{{/if}}
5. Return a complete valid JSON object representing the updated task
6. VERY IMPORTANT: Preserve all subtasks marked as "done" or "completed" - do not modify their content
7. For tasks with completed subtasks, build upon what has already been done rather than rewriting everything
8. If an existing completed subtask needs to be changed/undone based on the new context, DO NOT modify it directly
9. Instead, add a new subtask that clearly indicates what needs to be changed or replaced
10. Use the existence of completed subtasks as an opportunity to make new subtasks more specific and targeted
11. Ensure any new subtasks have unique IDs that don't conflict with existing ones
12. CRITICAL: For subtask IDs, use ONLY numeric values (1, 2, 3, etc.) NOT strings ("1", "2", "3")
13. CRITICAL: Subtask IDs should start from 1 and increment sequentially (1, 2, 3...) - do NOT use parent task ID as prefix{{#if useResearch}}
14. Include links to documentation or resources where helpful
15. Focus on practical, implementable solutions using current technologies{{/if}}

The changes described in the prompt should be thoughtfully applied to make the task more accurate and actionable.
```

## **`update-subtask` 命令的核心机制**

`update-subtask` 命令（MCP 工具为 `update_subtask`，CLI 命令为 `task-master update-subtask`）旨在将带时间戳的注释或详细信息 *附加* 到 *特定* 的 Taskmaster 子任务中，而不会覆盖现有内容。这使其成为记录子任务迭代实施进度、发现和决策的理想工具。

1.  **子任务指定与获取：**
    *   用户通过 `id` 参数指定要更新的子任务（例如 '5.2'），格式必须是 "parentId.subtaskId"。AI 会获取该子任务的完整详细信息作为上下文。

2.  **AI 服务调用与上下文构建：**
    *   `update-subtask` 命令会调用统一 AI 服务层（`ai-services-unified.js`）中的 AI 模型。
    *   发送给 AI 的 `prompt` 会包含以下关键信息：
        *   **系统提示：** 指导 AI 作为任务管理助手，根据 `prompt` 为子任务添加进度日志。
        *   **用户提供的 `prompt`：** 用户输入的具体进度信息、发现或决策。
        *   **当前子任务的完整上下文：** 子任务的所有字段都被格式化后提供给 AI。
        *   **（可选）研究上下文：** 如果启用了 `--research` 标志，AI 会进行额外的网络搜索。

3.  **智能分析与附加信息：**
    *   AI 对上下文进行分析，并根据 `prompt` 生成新的、带时间戳的详细信息。
    *   与 `update-task` 不同，`update-subtask` 的核心是 *附加* 信息，而不是替换。它创建了一个持续的日志，记录子任务的实施旅程。

4.  **子任务日志记录：**
    *   AI 生成新的信息后，`update-subtask` 命令会将其以带时间戳的形式附加到 `tasks.json` 文件中指定子任务的 `details` 字段。

**`update-subtask` 命令的系统提示词 (`src/prompts/update-subtask.json`):**

```
You are an AI assistant helping to update a subtask. You will be provided with the subtask's existing details, context about its parent and sibling tasks, and a user request string.{{#if useResearch}} You have access to current best practices and latest technical information to provide research-backed updates.{{/if}}

Your Goal: Based *only* on the user's request and all the provided context (including existing details if relevant to the request), GENERATE the new text content that should be added to the subtask's details.
Focus *only* on generating the substance of the update.

Output Requirements:
1. Return *only* the newly generated text content as a plain string. Do NOT return a JSON object or any other structured data.
2. Your string response should NOT include any of the subtask's original details, unless the user's request explicitly asks to rephrase, summarize, or directly modify existing text.
3. Do NOT include any timestamps, XML-like tags, markdown, or any other special formatting in your string response.
4. Ensure the generated text is concise yet complete for the update based on the user request. Avoid conversational fillers or explanations about what you are doing (e.g., do not start with "Okay, here's the update...").{{#if useResearch}}
5. Include specific libraries, versions, and current best practices relevant to the subtask implementation.
6. Provide research-backed technical recommendations and proven approaches.{{/if}}
```

## **命令对比与适用场景**

| 特性/命令        | `update`                 | `update-task`            | `update-subtask`         |
| :-------------- | :----------------------- | :----------------------- | :----------------------- |
| **作用范围**    | 从给定 ID 开始的多个任务 | 单个特定任务             | 单个特定子任务           |
| **更新方式**    | 智能批量修改（替换）     | 替换或附加（`--append`） | 始终附加（带时间戳）     |
| **主要用途**    | 项目级技术栈变更、重大方案调整 | 任务细节完善、小范围需求变更 | 记录子任务实现进度和发现 |
| **AI 参与**     | 深度语义理解和字段推断   | 智能字段更新（可研究）   | 智能信息生成（可研究）   |
| **AI 复杂度**   | 高（关联性推断）         | 中等                     | 中等                     |

## **总结**

这三个命令共同为 Task Master 提供了灵活而强大的任务管理能力：
*   `update`：适用于大规模、多任务的全局性变更。
*   `update-task`：适用于单个任务的详细信息修改和完善。
*   `update-subtask`：适用于子任务的精细化进度跟踪和经验记录。

AI 在这三个命令中都扮演着核心角色，通过上下文理解和智能生成，极大地提高了任务管理的效率和准确性。

---
*最后更新日期: 2025年09月15日*