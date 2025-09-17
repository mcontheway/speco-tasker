# 配置

Speco Tasker 使用两种主要方法进行配置：

1. **`.taskmaster/config.json` 文件（推荐 - 新结构）**

   - 此 JSON 文件存储大多数配置设置，包括 AI 模型选择、参数、日志级别和项目默认值。
   - **位置：** 当您运行 `task-master models --setup` 交互式设置或使用 `task-master init` 初始化新项目时，此文件将在 `.taskmaster/` 目录中创建。
   - **迁移：** 根目录中仍存在的 `.taskmasterconfig` 文件将继续工作，但应使用 `task-master migrate` 迁移到新结构。
   - **管理：** 使用 `task-master models --setup` 命令（或 `models` MCP 工具）以交互方式创建和管理此文件。您还可以直接设置特定模型，例如 `task-master models --set-main=<model_id>`，为自定义模型添加 `--ollama` 或 `--openrouter` 标志。手动编辑是可能的，但不推荐，除非您理解结构。
   - **示例结构：**
     ```json
     {
       "models": {
         "main": {
           "provider": "anthropic",
           "modelId": "claude-3-7-sonnet-20250219",
           "maxTokens": 64000,
           "temperature": 0.2,
           "baseURL": "https://api.anthropic.com/v1"
         },
         "research": {
           "provider": "perplexity",
           "modelId": "sonar-pro",
           "maxTokens": 8700,
           "temperature": 0.1,
           "baseURL": "https://api.perplexity.ai/v1"
         },
         "fallback": {
           "provider": "anthropic",
           "modelId": "claude-3-5-sonnet",
           "maxTokens": 64000,
           "temperature": 0.2
         }
       },
       "global": {
         "logLevel": "info",
         "debug": false,
         "defaultNumTasks": 10,
         "defaultSubtasks": 5,
         "defaultPriority": "medium",
         "defaultTag": "main",
         "projectName": "Your Project Name",
         "ollamaBaseURL": "http://localhost:11434/api",
         "azureBaseURL": "https://your-endpoint.azure.com/openai/deployments",
         "vertexProjectId": "your-gcp-project-id",
         "vertexLocation": "us-central1"
       }
     }
     ```

   > 有关 MCP 特定设置和故障排除，请参见[提供商特定配置](#provider-specific-configuration)。

2. **旧版 `.taskmasterconfig` 文件（向后兼容性）**

   - 对于尚未迁移到新结构的项目的文件。
   - **位置：** 项目根目录。
   - **迁移：** 使用 `task-master migrate` 将其移动到 `.taskmaster/config.json`。
   - **弃用：** 虽然仍受支持，但您会看到鼓励迁移到新结构的警告。

## 环境变量（`.env` 文件或 MCP `env` 块 - 仅用于 API 密钥）

- **专门**用于敏感 API 密钥和特定端点 URL。
- **位置：**
  - 对于 CLI 使用：在项目根目录中创建 `.env` 文件。
  - 对于 MCP/Cursor 使用：在 `.cursor/mcp.json` 文件的 `env` 部分配置密钥。
- **必需的 API 密钥（取决于配置的提供商）：**
  - `ANTHROPIC_API_KEY`：您的 Anthropic API 密钥。
  - `PERPLEXITY_API_KEY`：您的 Perplexity API 密钥。
  - `OPENAI_API_KEY`：您的 OpenAI API 密钥。
  - `GOOGLE_API_KEY`：您的 Google API 密钥（也用于 Vertex AI 提供商）。
  - `MISTRAL_API_KEY`：您的 Mistral API 密钥。
  - `AZURE_OPENAI_API_KEY`：您的 Azure OpenAI API 密钥（也需要 `AZURE_OPENAI_ENDPOINT`）。
  - `OPENROUTER_API_KEY`：您的 OpenRouter API 密钥。
  - `XAI_API_KEY`：您的 X-AI API 密钥。
- **可选端点覆盖：**
  - **每个角色的 `baseURL` 在 `.taskmasterconfig` 中：** 您可以在任何模型角色（`main`、`research`、`fallback`）中添加 `baseURL` 属性来覆盖该提供商的默认 API 端点。如果省略，将使用提供商的标准端点。
  - **环境变量覆盖（`<PROVIDER>_BASE_URL`）：** 为更大的灵活性，尤其是与第三方服务一起使用，您可以设置像 `OPENAI_BASE_URL` 或 `MISTRAL_BASE_URL` 这样的环境变量。这将覆盖配置文件的任何 `baseURL` 设置。这是连接到 OpenAI 兼容 API 的推荐方式。
  - `AZURE_OPENAI_ENDPOINT`：使用 Azure OpenAI 密钥时必需（也可以作为 Azure 模型角色的 `baseURL` 设置）。
  - `OLLAMA_BASE_URL`：覆盖默认的 Ollama API URL（默认：`http://localhost:11434/api`）。
  - `VERTEX_PROJECT_ID`：Vertex AI 的 Google Cloud 项目 ID。使用 'vertex' 提供商时必需。
  - `VERTEX_LOCATION`：Vertex AI 的 Google Cloud 区域（例如 'us-central1'）。默认值为 'us-central1'。
  - `GOOGLE_APPLICATION_CREDENTIALS`：Google Cloud 认证的服务账户凭据 JSON 文件路径（Vertex AI 的 API 密钥替代方案）。

**重要：** 模型 ID 选择（`main`、`research`、`fallback`）、`maxTokens`、`temperature`、`logLevel`、`defaultSubtasks`、`defaultPriority` 和 `projectName` 等设置**在 `.taskmaster/config.json`**（或未迁移项目的 `.taskmasterconfig`）中管理，而不是环境变量。

## 带标签的任务列表配置（v0.17+）

Taskmaster 包含一个带标签的任务列表系统，用于多上下文任务管理。

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

## 状态管理文件

Taskmaster 使用 `.taskmaster/state.json` 来跟踪标签系统运行时信息：

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

## 示例 `.env` 文件（用于 API 密钥）

```
# 根据 .taskmaster/config.json 中配置的提供商所需的 API 密钥
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here
# OPENAI_API_KEY=sk-your-key-here
# GOOGLE_API_KEY=AIzaSy...
# AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
# etc.

# 可选端点覆盖
# 为特定提供商使用基础 URL，例如用于 OpenAI 兼容 API
# OPENAI_BASE_URL=https://api.third-party.com/v1
#
# Azure OpenAI 配置
# AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/ 或 https://your-endpoint-name.cognitiveservices.azure.com/openai/deployments
# OLLAMA_BASE_URL=http://custom-ollama-host:11434/api

# Google Vertex AI 配置（如果使用 'vertex' 提供商则必需）
# VERTEX_PROJECT_ID=your-gcp-project-id
```

## 故障排除

### 配置错误

- 如果 Speco Tasker 报告缺少配置或找不到配置文件错误，请在项目根目录运行 `task-master models --setup` 来创建或修复文件。
- 对于新项目，配置将在 `.taskmaster/config.json` 创建。对于旧版项目，您可能希望使用 `task-master migrate` 移动到新结构。
- 确保 API 密钥正确放置在您的 `.env` 文件（用于 CLI）或 `.cursor/mcp.json`（用于 MCP）中，并且对配置文件中选择的提供商有效。

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

## 提供商特定配置

### MCP（模型上下文协议）提供商

1. **先决条件**：
   - 具有采样能力的活跃 MCP 会话
   - 支持采样的 MCP 客户端（例如 VS Code）
   - 无需 API 密钥（使用基于会话的认证）

2. **配置**：
   ```json
   {
     "models": {
       "main": {
         "provider": "mcp",
         "modelId": "mcp-sampling"
       },
       "research": {
         "provider": "mcp",
         "modelId": "mcp-sampling"
       }
     }
   }
   ```

3. **可用模型 ID**：
   - `mcp-sampling` - 使用 MCP 客户端采样的通用文本生成（支持所有角色）
   - `claude-3-5-sonnet-20241022` - 用于通用任务的高性能模型（支持所有角色）
   - `claude-3-opus-20240229` - 用于复杂任务的增强推理模型（支持所有角色）

4. **功能**：
   - ✅ **文本生成**：通过 MCP 采样的标准 AI 文本生成
   - ✅ **对象生成**：完整的模式驱动结构化输出生成
   - ✅ **PRD 解析**：将产品需求文档解析为结构化任务
   - ✅ **任务创建**：带有验证的 AI 驱动任务创建
   - ✅ **会话管理**：自动会话检测和上下文处理
   - ✅ **错误恢复**：强大的错误处理和回退机制

5. **使用要求**：
   - 必须在 MCP 上下文中运行（会话必须可用）
   - 会话必须提供 `clientCapabilities.sampling` 能力

6. **最佳实践**：
   - 始终配置非 MCP 回退提供商
   - 在 MCP 环境中为主/研究角色使用 `mcp`
   - 在生产使用前测试采样能力

7. **设置命令**：
   ```bash
   # 为主要角色设置 MCP 提供商
   task-master models set-main --provider mcp --model claude-3-5-sonnet-20241022

   # 为研究角色设置 MCP 提供商
   task-master models set-research --provider mcp --model claude-3-opus-20240229

   # 验证配置
   task-master models list
   ```

8. **故障排除**：
   - "MCP 提供商需要会话上下文" → 确保在 MCP 环境中运行
   - 有关详细故障排除，请参见 [MCP 提供商指南](./mcp-provider-guide.md)

### Google Vertex AI 配置

Google Vertex AI 是 Google Cloud 的企业 AI 平台，需要特定配置：

1. **先决条件**：
   - 启用了 Vertex AI API 的 Google Cloud 账户
   - 具有 Vertex AI 权限的 Google API 密钥或具有适当角色的服务账户
   - Google Cloud 项目 ID
2. **认证选项**：
   - **API 密钥**：设置 `GOOGLE_API_KEY` 环境变量
   - **服务账户**：设置 `GOOGLE_APPLICATION_CREDENTIALS` 指向您的服务账户 JSON 文件
3. **必需配置**：
   - 将 `VERTEX_PROJECT_ID` 设置为您的 Google Cloud 项目 ID
   - 将 `VERTEX_LOCATION` 设置为您的首选 Google Cloud 区域（默认：us-central1）
4. **示例设置**：

   ```bash
   # 在 .env 文件中
   GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
   VERTEX_PROJECT_ID=my-gcp-project-123
   VERTEX_LOCATION=us-central1
   ```

   或使用服务账户：

   ```bash
   # 在 .env 文件中
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   VERTEX_PROJECT_ID=my-gcp-project-123
   VERTEX_LOCATION=us-central1
   ```

5. **在 .taskmaster/config.json 中**：
   ```json
   "global": {
     "vertexProjectId": "my-gcp-project-123",
     "vertexLocation": "us-central1"
   }
   ```

### Azure OpenAI 配置

Azure OpenAI 通过 Microsoft 的 Azure 云平台提供企业级 OpenAI 模型，需要特定配置：

1. **先决条件**：
   - 具有活跃订阅的 Azure 账户
   - 在 Azure 门户中创建的 Azure OpenAI 服务资源
   - Azure OpenAI API 密钥和端点 URL
   - 在您的 Azure OpenAI 资源中部署的模型（例如 gpt-4o、gpt-4o-mini、gpt-4.1 等）

2. **认证**：
   - 使用您的 Azure OpenAI API 密钥设置 `AZURE_OPENAI_API_KEY` 环境变量
   - 使用以下方法之一配置端点 URL

3. **配置选项**：

   **选项 1：使用全局 Azure 基础 URL（影响所有 Azure 模型）**
   ```json
   // 在 .taskmaster/config.json 中
   {
     "models": {
       "main": {
         "provider": "azure",
         "modelId": "gpt-4o",
         "maxTokens": 16000,
         "temperature": 0.7
       },
       "fallback": {
         "provider": "azure",
         "modelId": "gpt-4o-mini",
         "maxTokens": 10000,
         "temperature": 0.7
       }
     },
     "global": {
       "azureBaseURL": "https://your-resource-name.azure.com/openai/deployments"
     }
   }
   ```

   **选项 2：使用每个模型的基础 URL（推荐以提高灵活性）**
   ```json
   // 在 .taskmaster/config.json 中
   {
     "models": {
       "main": {
         "provider": "azure",
         "modelId": "gpt-4o",
         "maxTokens": 16000,
         "temperature": 0.7,
         "baseURL": "https://your-resource-name.azure.com/openai/deployments"
       },
       "research": {
         "provider": "perplexity",
         "modelId": "sonar-pro",
         "maxTokens": 8700,
         "temperature": 0.1
       },
       "fallback": {
         "provider": "azure",
         "modelId": "gpt-4o-mini",
         "maxTokens": 10000,
         "temperature": 0.7,
         "baseURL": "https://your-resource-name.azure.com/openai/deployments"
       }
     }
   }
   ```

4. **环境变量**：
   ```bash
   # 在 .env 文件中
   AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here

   # 可选：覆盖所有 Azure 模型的端点
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.azure.com/openai/deployments
   ```

5. **重要说明**：
   - **模型部署名称**：配置中的 `modelId` 应匹配您在 Azure OpenAI Studio 中创建的**部署名称**，而不是底层模型名称
   - **基础 URL 优先级**：每个模型的 `baseURL` 设置会覆盖全局 `azureBaseURL` 设置
   - **端点格式**：使用每个模型的 `baseURL` 时，使用包含 `/openai/deployments` 的完整路径

6. **故障排除**：

   **"Resource not found" 错误：**
   - 确保您的 `baseURL` 包含完整路径：`https://your-resource-name.openai.azure.com/openai/deployments`
   - 验证 `modelId` 中的部署名称与 Azure OpenAI Studio 中的配置完全匹配
   - 检查您的 Azure OpenAI 资源是否在正确的区域并正确部署

   **认证错误：**
   - 验证您的 `AZURE_OPENAI_API_KEY` 是否正确且未过期
   - 确保您的 Azure OpenAI 资源具有必要的权限
   - 检查您的订阅是否未被暂停或达到配额限制

   **模型可用性错误：**
   - 确认模型已在您的 Azure OpenAI 资源中部署
   - 验证部署名称与您的配置完全匹配（区分大小写）
   - 确保 Azure OpenAI Studio 中的模型部署处于"成功"状态
   - 确保您没有因 `maxTokens` 而受到速率限制，请在部署中保持适当的每分钟令牌速率限制 (TPM)。

---

*最后更新：2025年09月16日*
