# MCP 手动测试指南

## 概述

本文档提供了在 Cursor 等 MCP 集成环境中手动测试 Speco Tasker MCP 功能的方法。**所有测试必须通过 MCP 工具执行，禁止任何直接文件系统访问或命令行操作**。重点验证 MCP 工具在实际 IDE 使用场景中的功能正确性、用户体验和错误处理能力。

## MCP 配置设置

### 🔧 配置本地仓库版本

**用途：** 测试最新功能、验证修复、调试 MCP 服务器

**配置方法：**
```json
// 编辑 .cursor/mcp.json
{
  "mcpServers": {
    "speco-tasker": {
      "command": "node",
      "args": ["mcp-server/server.js"]
    }
  }
}
```

**验证：** 重启 Cursor，确认 MCP 面板中显示"已连接"

**常见错误：**
- ❌ `npx speco-tasker` → ✅ `node mcp-server/server.js`
- ❌ `"./mcp-server/server.js"` → ✅ `"mcp-server/server.js"`

## 测试准备

### 环境要求
- ✅ 已配置 `.cursor/mcp.json` 使用本地仓库版本
- ✅ Cursor 已重启，MCP 服务器显示为"已连接"状态
- ✅ 在 Speco Tasker 项目根目录中工作
- ✅ **必须通过 MCP 工具面板进行所有操作和验证**

### 测试原则
- 🧪 **必须使用 MCP 工具**：**禁止**任何直接文件系统访问，所有验证都通过 MCP 工具响应进行
- 🎯 **用户体验导向**：关注 Cursor 中的实际使用体验和响应速度
- 🔄 **工具协作验证**：测试工具间的配合和数据一致性
- ⚡ **响应性能测试**：观察工具调用速度和稳定性
- 🛡️ **错误处理验证**：测试各种异常情况下的错误提示和恢复

### MCP 工具清单

| 工具名称 | 描述 | 测试优先级 |
|---------|------|----------|
| `initialize_project` | 初始化项目 | 🔴 高 |
| `get_tasks` | 获取任务列表 | 🔴 高 |
| `get_task` | 获取单个任务详情 | 🔴 高 |
| `next_task` | 获取下一个任务 | 🔴 高 |
| `add_task` | 添加任务 | 🔴 高 |
| `add_subtask` | 添加子任务 | 🔴 高 |
| `set_task_status` | 设置任务状态 | 🔴 高 |
| `add_dependency` | 添加依赖关系 | 🟡 中 |
| `remove_dependency` | 移除依赖关系 | 🟡 中 |
| `validate_dependencies` | 验证依赖关系 | 🟡 中 |
| `fix_dependencies` | 修复依赖关系 | 🟡 中 |
| `clear_subtasks` | 清除子任务 | 🟡 中 |
| `remove_subtask` | 移除子任务 | 🟡 中 |
| `remove_task` | 移除任务 | 🟡 中 |
| `add_tag` | 添加标签 | 🟡 中 |
| `list_tags` | 列出标签 | 🟡 中 |
| `use_tag` | 使用标签 | 🟡 中 |
| `move_task` | 移动任务 | 🟠 低 |
| `update_task` | 更新任务 | 🟠 低 |
| `update_subtask` | 更新子任务 | 🟠 低 |
| `generate` | 生成任务文件 | 🟠 低 |

## 核心功能测试

### 🧪 测试场景 1: 项目初始化

**测试目标：** 验证 MCP 工具能正确初始化新项目

**测试步骤：**
1. 在 Cursor 中打开 MCP 工具面板
2. 搜索并调用 `initialize_project` 工具，填入参数：
   ```json
   {
     "projectName": "MCP 手动测试项目"
   }
   ```

**预期结果：**
- ✅ 响应格式：`{"success": true, "data": {...}}`
- ✅ 包含字段：`data.projectName`, `data.created` 等
- ✅ 无 `error` 字段

**验证步骤：**
1. 检查响应 JSON 中 `success` 字段为 `true`
2. 确认 `data` 对象包含项目配置信息
3. 调用 `get_tasks` 应返回空数组（新项目）

---

### 🧪 测试场景 2: 任务创建和管理

**测试目标：** 验证基本的任务 CRUD 操作和状态管理

**测试步骤：**

1. **添加任务**
   调用 `add_task` 工具：
   ```json
   {
     "title": "实现用户认证功能",
     "description": "创建用户注册和登录功能",
     "details": "使用 JWT 实现用户认证，包含密码加密和会话管理",
     "testStrategy": "单元测试和集成测试",
     "spec_files": "auth-api-spec.md",
     "priority": "high"
   }
   ```

2. **查看任务列表**
   调用 `get_tasks` 工具验证任务创建

3. **查看特定任务详情**
   调用 `get_task` 工具查看任务 1 的详细信息

4. **设置任务状态**
   调用 `set_task_status` 工具将任务 1 设为 "in-progress"

**预期结果：**

**add_task 响应：**
- ✅ 格式：`{"success": true, "data": {"id": "1", "title": "实现用户认证功能", ...}}`
- ✅ ID 字段为字符串格式（如 "1"）

**get_tasks 响应：**
- ✅ 格式：`{"success": true, "data": [{"id": "1", "title": "...", ...}]}`
- ✅ 返回数组，包含刚创建的任务

**get_task 响应：**
- ✅ 格式：`{"success": true, "data": {"id": "1", "title": "...", "status": "pending", ...}}`
- ✅ 包含所有字段：title, description, status, priority 等

**set_task_status 响应：**
- ✅ 格式：`{"success": true, "data": {"id": "1", "status": "in-progress"}}`
- ✅ status 字段已更新

**验证步骤：**
1. 每个工具调用后检查 `success: true`
2. 确认返回的 JSON 结构符合上述格式
3. 任务 ID 应为字符串格式的数字

---

### 🧪 测试场景 3: 子任务管理

**测试步骤：**

1. **添加子任务**
   ```json
   // 使用 add_subtask 工具
   {
     "id": "1",
     "title": "实现密码加密",
     "description": "使用 bcrypt 加密用户密码",
     "details": "集成 bcrypt 库，实现密码哈希和验证功能"
   }
   ```

2. **查看任务详情（包含子任务）**
   ```json
   // 使用 get_task 工具
   {"id": "1"}
   ```

3. **设置子任务状态**
   ```json
   // 使用 set_task_status 工具
   {"id": "1.1", "status": "done"}
   ```

**预期结果：**

**add_subtask 响应：**
- ✅ 格式：`{"success": true, "data": {"id": "1.1", "title": "实现密码加密", ...}}`
- ✅ ID 格式为 "父ID.子ID"（如 "1.1"）

**get_task 响应（查看父任务）：**
- ✅ 格式：`{"success": true, "data": {"id": "1", "subtasks": [{"id": "1.1", ...}]}}`
- ✅ subtasks 数组包含新创建的子任务

**set_task_status 响应（子任务）：**
- ✅ 格式：`{"success": true, "data": {"id": "1.1", "status": "done"}}`
- ✅ 子任务状态独立于父任务

**验证步骤：**
1. 子任务 ID 应为 "父ID.子ID" 格式
2. 父任务的 subtasks 字段应包含子任务信息
3. 子任务状态更改不影响父任务状态

---

### 🧪 测试场景 4: 依赖关系管理

**测试步骤：**

1. **创建第二个任务**
   ```json
   // 使用 add_task 工具
   {
     "title": "创建用户数据库表",
     "description": "设计和实现用户数据表结构",
     "details": "创建用户表，包含必要的字段和索引",
     "testStrategy": "数据库迁移测试",
     "spec_files": "database-spec.md",
     "priority": "high"
   }
   ```

2. **添加依赖关系**
   ```json
   // 使用 add_dependency 工具
   {"id": "2", "dependsOn": "1"}
   ```

3. **验证依赖关系**
   ```json
   // 使用 validate_dependencies 工具
   {}
   ```

4. **查看下一个可执行任务**
   ```json
   // 使用 next_task 工具
   {}
   ```

**预期结果：**

**add_task 响应（任务 2）：**
- ✅ 格式：`{"success": true, "data": {"id": "2", "dependencies": ["1"], ...}}`
- ✅ dependencies 字段包含 "1"

**add_dependency 响应：**
- ✅ 格式：`{"success": true, "data": {"id": "2", "dependsOn": "1"}}`

**validate_dependencies 响应：**
- ✅ 格式：`{"success": true, "data": {"valid": true, "errors": []}}`
- ✅ 无循环依赖错误

**next_task 响应：**
- ✅ 格式：`{"success": true, "data": {"id": "1", "title": "...", ...}}`
- ✅ 返回任务 1（因为任务 2 依赖它）

**验证步骤：**
1. 任务 2 的 dependencies 数组应包含 "1"
2. validate_dependencies 返回无错误
3. next_task 返回任务 1 而不是任务 2

---

### 🧪 测试场景 5: 标签系统

**测试步骤：**

1. **创建标签**
   ```json
   // 使用 add_tag 工具
   {"name": "auth-feature", "description": "用户认证功能开发"}
   ```

2. **添加任务到标签**
   ```json
   // 使用 add_task 工具（会自动使用当前标签）
   {
     "title": "实现第三方登录",
     "description": "支持 Google 和 GitHub 登录",
     "details": "集成 OAuth 2.0 实现第三方登录",
     "testStrategy": "OAuth 流程测试",
     "spec_files": "oauth-spec.md",
     "priority": "medium"
   }
   ```

3. **查看标签列表**
   ```json
   // 使用 list_tags 工具
   {}
   ```

**预期结果：**

**add_tag 响应：**
- ✅ 格式：`{"success": true, "data": {"name": "auth-feature", "description": "..."}}`

**add_task 响应（在标签上下文）：**
- ✅ 格式：`{"success": true, "data": {"id": "3", "tag": "auth-feature", ...}}`
- ✅ 任务自动分配到当前标签

**list_tags 响应：**
- ✅ 格式：`{"success": true, "data": [{"name": "main", "tasks": 2}, {"name": "auth-feature", "tasks": 1}]}`
- ✅ 显示各标签的任务数量

**验证步骤：**
1. 新创建的任务应分配到当前激活的标签
2. list_tags 显示正确的任务计数
3. 标签间任务数据隔离

---

### 🧪 测试场景 6: 错误处理和边界条件

**测试步骤：**

1. **测试不存在的任务**
   ```json
   // 使用 get_task 工具
   {"id": "999"}
   ```

2. **测试循环依赖**
   ```json
   // 先创建任务 3
   {
     "title": "实现用户界面",
     "description": "创建用户登录界面",
     "details": "使用 React 创建登录表单",
     "testStrategy": "UI 组件测试",
     "spec_files": "ui-spec.md",
     "priority": "medium"
   }

   // 添加循环依赖
   {"id": "1", "dependsOn": "3"}  // 1 -> 3
   {"id": "3", "dependsOn": "1"}  // 3 -> 1
   ```

3. **验证依赖关系**
   ```json
   // 使用 validate_dependencies 工具
   {}
   ```

4. **修复依赖关系**
   ```json
   // 使用 fix_dependencies 工具
   {}
   ```

**预期结果：**

**get_task（不存在任务）：**
- ✅ 响应：`{"success": false, "error": {"code": "TASK_NOT_FOUND", "message": "Task 999 not found"}}`

**add_dependency（循环依赖）：**
- ✅ 第一个调用成功：`{"success": true, "data": {...}}`
- ✅ 第二个调用失败：`{"success": false, "error": {"code": "CIRCULAR_DEPENDENCY", ...}}`

**validate_dependencies 响应：**
- ✅ 响应：`{"success": true, "data": {"valid": false, "errors": ["Circular dependency detected"]}}`

**fix_dependencies 响应：**
- ✅ 响应：`{"success": true, "data": {"fixed": true, "removedDependencies": ["3->1"]}}`
- ✅ 自动移除冲突的依赖关系

**验证步骤：**
1. 不存在的任务立即返回错误
2. 循环依赖在创建时被阻止，或通过验证检测
3. fix_dependencies 能自动清理问题依赖

---

### 🧪 测试场景 7: 批量操作

**测试步骤：**

1. **创建多个任务**
   ```json
   // 连续创建多个任务
   {
     "title": "API 文档编写",
     "description": "编写 REST API 文档",
     "details": "使用 Swagger 生成 API 文档",
     "testStrategy": "文档验证",
     "spec_files": "api-docs.md",
     "priority": "low"
   }
   ```

2. **查看所有任务**
   ```json
   // 使用 get_tasks 工具
   {}
   ```

3. **清除所有子任务**
   ```json
   // 使用 clear_subtasks 工具
   {"all": true}
   ```

**预期结果：**

**批量 add_task：**
- ✅ 每个响应：`{"success": true, "data": {"id": "4", ...}}`
- ✅ ID 依次递增（"1", "2", "3", "4"...）

**get_tasks 响应：**
- ✅ 格式：`{"success": true, "data": [{"id": "1", ...}, {"id": "2", ...}, {"id": "3", ...}, {"id": "4", ...}]}`
- ✅ 返回数组包含所有任务

**clear_subtasks 响应（批量）：**
- ✅ 格式：`{"success": true, "data": {"clearedCount": 5}}`
- ✅ 显示清除的子任务数量

**验证步骤：**
1. 连续创建多个任务时 ID 正确递增
2. get_tasks 返回完整任务列表
3. 批量操作影响所有相关任务

---

### 🧪 测试场景 8: 任务文件生成

**测试目标：** 验证文件生成功能和数据持久化

**测试步骤：**

1. **生成任务文件**
   调用 `generate` 工具生成 Markdown 文件

**预期结果：**

**generate 响应：**
- ✅ 格式：`{"success": true, "data": {"files": ["task_001.txt", "task_002.txt"], "count": 2}}`
- ✅ 包含生成的文件列表和数量

**验证步骤：**
1. 检查 generate 响应中的 `files` 数组是否包含正确的文件名
2. 验证 `count` 字段是否与生成的文件数量一致
3. 通过后续的 `get_task` 调用确认任务数据完整性

## 高级功能测试

### 🔄 任务移动和重组

**测试步骤：**
```json
// 创建任务 A, B, C
// 使用 move_task 工具移动任务
{"from": "2", "to": "1.1"}  // 将任务 2 移动为任务 1 的子任务
```

**预期结果：**
- ✅ 响应：`{"success": true, "data": {"moved": true, "from": "2", "to": "1.1"}}`
- ✅ 任务 2 变为任务 1 的子任务 1.1
- ✅ 原任务 2 从根级别移除

### 📝 任务更新

**测试步骤：**
```json
// 使用 update_task 工具
{
  "id": "1",
  "prompt": "增加对密码强度的要求，包含特殊字符和长度验证"
}
```

**预期结果：**
- ✅ 响应：`{"success": true, "data": {"updated": true, "id": "1"}}`
- ✅ 任务详情中新增或更新相关字段
- ✅ AI 生成的内容符合更新要求

### 🏷️ 标签操作

**copy_tag 测试：**
```json
{"sourceName": "auth-feature", "targetName": "auth-feature-v2"}
```
- ✅ 响应：`{"success": true, "data": {"copied": true, "source": "auth-feature", "target": "auth-feature-v2"}}`

**rename_tag 测试：**
```json
{"oldName": "auth-feature", "newName": "authentication"}
```
- ✅ 响应：`{"success": true, "data": {"renamed": true, "from": "auth-feature", "to": "authentication"}}`

**delete_tag 测试：**
```json
{"name": "auth-feature-v2"}
```
- ✅ 响应：`{"success": true, "data": {"deleted": true, "tag": "auth-feature-v2"}}`

## 性能和稳定性测试

### 🧪 测试场景 9: 大量任务处理

**测试步骤：**
1. 创建 20+ 个任务
2. 测试列表显示性能
3. 测试搜索和过滤功能

### 🧪 测试场景 10: 并发操作

**测试步骤：**
1. 同时执行多个 MCP 工具调用
2. 验证数据一致性
3. 检查错误处理

## MCP 错误处理测试

### 🧪 测试场景 9: 参数验证错误

**测试目标：** 验证 MCP 工具的参数验证和错误提示

**测试用例：**

1. **无效的任务ID**
   ```json
   // 调用 get_task 工具
   {"id": "invalid-id"}
   ```

2. **缺失必需参数**
   ```json
   // 调用 add_task 工具，缺少 title
   {"description": "测试描述"}
   ```

3. **无效的状态值**
   ```json
   // 调用 set_task_status 工具
   {"id": "1", "status": "invalid-status"}
   ```

**预期结果：**

**无效任务ID：**
- ✅ 响应：`{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "Invalid task ID format"}}`

**缺失必需参数：**
- ✅ 响应：`{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "Missing required field: title"}}`

**无效状态值：**
- ✅ 响应：`{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "Invalid status value"}}`

**验证步骤：**
1. 每个错误调用返回 `success: false`
2. error 对象包含 `code` 和 `message` 字段
3. 错误信息应清晰描述问题所在
4. 不应导致 MCP 服务器崩溃

### 🧪 测试场景 10: 业务逻辑错误

**测试目标：** 验证业务规则约束和错误处理

**测试用例：**

1. **循环依赖创建**
   ```json
   // 创建两个任务后建立循环依赖
   {"id": "1", "dependsOn": "2"}
   {"id": "2", "dependsOn": "1"}
   ```

2. **不存在的任务依赖**
   ```json
   // 任务 1 依赖不存在的任务 999
   {"id": "1", "dependsOn": "999"}
   ```

3. **重复标签创建**
   ```json
   // 尝试创建已存在的标签
   {"name": "existing-tag"}
   ```

**预期结果：**

**循环依赖错误：**
- ✅ 响应：`{"success": false, "error": {"code": "CIRCULAR_DEPENDENCY", "message": "Circular dependency detected: 1 -> 2 -> 1"}}`

**不存在依赖错误：**
- ✅ 响应：`{"success": false, "error": {"code": "DEPENDENCY_ERROR", "message": "Task 999 does not exist"}}`

**重复标签错误：**
- ✅ 响应：`{"success": false, "error": {"code": "DUPLICATE_TAG", "message": "Tag 'existing-tag' already exists"}}`

**验证步骤：**
1. 业务规则违反时返回 `success: false`
2. 错误信息明确指出问题类型和涉及的任务
3. 对于循环依赖，建议使用 `fix_dependencies` 工具解决

### 🧪 测试场景 11: MCP 协议错误

**测试目标：** 验证 MCP 协议层面的错误处理

**测试用例：**

1. **工具不存在**
   - 调用不存在的工具名称

2. **参数格式错误**
   - 发送非 JSON 格式的参数
   - 发送错误的参数类型

3. **服务器连接问题**
   - 测试 MCP 服务器断开时的行为
   - 测试网络超时情况

**预期结果：**

**工具不存在：**
- ✅ 响应：`{"success": false, "error": {"code": "METHOD_NOT_FOUND", "message": "Tool 'nonexistent_tool' not found"}}`

**参数格式错误：**
- ✅ 响应：`{"success": false, "error": {"code": "PARSE_ERROR", "message": "Invalid JSON format"}}`

**服务器连接问题：**
- ✅ Cursor 显示："MCP 服务器连接失败"
- ✅ 错误面板显示具体错误信息
- ✅ IDE 功能不受影响，可重试连接

**验证步骤：**
1. 协议错误不导致 MCP 服务器崩溃
2. Cursor 优雅处理连接问题
3. 错误信息有助于诊断问题

## 测试报告和验证

### 自动化验证脚本

创建简单的验证脚本：

```javascript
// tests/verify-mcp-functionality.js
// 注意：此脚本必须通过 MCP 工具进行验证，不得直接访问文件系统

async function verifyMCPFunctionality() {
    console.log('🔍 开始 MCP 功能验证...');

    // 1. 检查 MCP 服务器连接（通过工具响应时间）
    // 2. 验证基本工具可用性（get_tasks, get_task）
    // 3. 验证任务数据结构完整性（通过工具响应格式）
    // 4. 检查业务逻辑正确性（依赖关系、状态管理）

    // 示例：通过 get_tasks 工具验证数据结构
    // 预期响应格式：{"success": true, "data": [{"id": "1", ...}, ...]}

    console.log('✅ MCP 功能验证完成');
}

verifyMCPFunctionality();
```

### 手动验证清单

- [ ] MCP 服务器成功连接到 Cursor
- [ ] 所有核心工具响应正常
- [ ] 任务数据正确持久化
- [ ] 错误情况处理得当
- [ ] 性能满足要求
- [ ] UI 显示正确

## 故障排除指南

### 常见问题

1. **MCP 服务器连接失败**
   - 检查 `.cursor/mcp.json` 配置
   - 验证本地 MCP 服务器可执行
   - 重启 Cursor

2. **工具调用失败**
   - 检查参数格式是否正确
   - 验证项目根目录设置
   - 查看 MCP 服务器日志

3. **数据不一致**
   - 使用 `get_tasks` 工具验证数据结构完整性
   - 使用 `validate_dependencies` 检查依赖关系
   - 使用 `list_tags` 验证标签系统状态

### MCP 专用调试方法

**通过工具结果验证：**
- 🔍 使用 `get_tasks` 检查任务数据结构
- 📊 使用 `validate_dependencies` 检查数据完整性
- 🏷️ 使用 `list_tags` 验证标签系统

**Cursor MCP 面板调试：**
- 📋 查看工具调用历史
- ⚠️ 检查错误响应详情
- ⏱️ 观察响应时间

**服务器日志检查：**
- Cursor 输出面板中的 MCP 服务器日志
- 错误堆栈跟踪
- 性能指标

## 与 CLI 测试对比分析

基于 `run_e2e.sh` 的分析，以下是 MCP 测试中缺失或需要补充的测试用例：

### 🔴 缺失的核心测试场景

#### 1. **环境和依赖验证**
```json
// CLI 测试包含但 MCP 测试缺失
- 依赖检查 (jq, bc)
- npm link 创建和验证
- 全局包使用测试
```

#### 2. **复杂任务批量操作**
```json
// CLI 测试包含但 MCP 测试简化
- 批量创建多个任务 (6个任务同时创建)
- 批量移除子任务 (multi-ID: 2.1,2.2)
- 批量清除所有子任务 (--all 标志)
```

#### 3. **状态管理深度测试**
```json
// CLI 测试包含但 MCP 测试缺失
- 状态变化对 next_task 的影响
- 状态过滤列表显示 (--status=done)
- 任务状态变化后的依赖验证
```

#### 4. **依赖关系高级测试**
```json
// CLI 测试更详细但 MCP 测试简化
- 非存在依赖的详细错误验证 (grep 具体错误信息)
- 循环依赖的详细检测和修复验证
- 修复后的重新验证
```

#### 5. **标签系统验证**
```json
// CLI 测试包含但 MCP 测试缺失
- 标签内任务数量统计验证
- 跨标签上下文切换验证
- 标签功能的具体数值验证
```

#### 6. **子任务依赖关系**
```json
// CLI 测试包含但 MCP 测试缺失
- 任务依赖子任务 (Task 4 -> Subtask 3.1)
- 子任务依赖关系的添加/移除
- 子任务依赖对任务执行顺序的影响
```

#### 7. **文件操作验证**
```json
// CLI 测试包含但 MCP 测试简化
- 任务文件生成的完整性验证
- 文件内容格式验证
- 文件命名规范验证 (task_001.txt)
```

### 🟡 需要补充的测试场景

#### 8. **错误恢复和边界条件**
```json
// MCP 测试应补充的详细场景
- npm link 失败的处理
- 依赖安装失败的处理
- 磁盘空间不足的处理
- 文件权限问题的处理
```

#### 9. **性能和并发测试**
```json
// MCP 测试应补充的场景
- 同时执行多个 MCP 工具调用
- 大量任务 (>20个) 的处理性能
- 长时运行操作的中断处理
```

#### 10. **数据一致性验证**
```json
// MCP 测试应补充的验证
- 任务数据 JSON 结构完整性检查
- 标签间数据隔离验证
- 操作后的数据一致性检查
```

## MCP 测试完成标准

### 🎯 功能完整性
- ✅ 所有声明的 MCP 工具可正常调用
- ✅ 工具参数验证正确
- ✅ 业务逻辑处理准确
- ✅ 数据持久化可靠

### 🎨 用户体验质量
- ✅ Cursor UI 中工具响应清晰可读
- ✅ 工具调用响应时间 < 3秒
- ✅ 错误信息用户友好
- ✅ 工具间数据一致性

### 🛡️ 错误处理健壮性
- ✅ 参数验证错误正确提示
- ✅ 业务逻辑错误适当处理
- ✅ MCP 协议错误优雅降级
- ✅ 不影响 Cursor 稳定性

### ⚡ 性能和稳定性
- ✅ 连续调用无性能 degradation
- ✅ 大量数据处理流畅
- ✅ 内存使用合理
- ✅ 长时间运行稳定

### 🔗 协议兼容性
- ✅ MCP 协议实现标准兼容
- ✅ 工具发现和描述正确
- ✅ 错误响应格式规范
- ✅ 与 Cursor 集成无缝

### 📊 与 CLI 测试的差异说明
- **环境差异**：MCP 测试关注 IDE 集成体验，CLI 测试关注系统完整性
- **验证方法**：MCP **必须**通过工具响应验证，CLI 通过文件系统和命令输出验证
- **错误场景**：MCP 关注协议和参数错误，CLI 关注系统和权限错误
- **性能指标**：MCP 强调响应速度，CLI 强调批量处理效率

---

## 附录：MCP 工具详细参数

### initialize_project
```json
{
  "projectName": "string?",        // 项目名称
  "shell": "string?",              // Shell类型
  "force": "boolean?"              // 强制重新初始化
}
```

### add_task
```json
{
  "title": "string",              // 任务标题
  "description": "string",        // 任务描述
  "details": "string",            // 详细说明
  "testStrategy": "string",       // 测试策略
  "spec_files": "string",         // 规范文件
  "priority": "string",           // 优先级: "high"|"medium"|"low"
  "dependencies": "string?"       // 依赖任务ID，逗号分隔
}
```

### get_tasks
```json
{
  "status": "string?",            // 状态过滤
  "withSubtasks": "boolean?",     // 是否包含子任务
  "tag": "string?"               // 标签过滤
}
```

### set_task_status
```json
{
  "id": "string",                 // 任务ID
  "status": "string"              // 状态: "pending"|"in-progress"|"done"|"cancelled"
}
```

### add_dependency
```json
{
  "id": "string",                 // 依赖任务ID
  "dependsOn": "string"           // 被依赖任务ID
}
```

---

*最后更新：2025年01月22日*

*基于 `test_mcp_e2e_automated.js` 自动化测试脚本生成的手动测试指南*
