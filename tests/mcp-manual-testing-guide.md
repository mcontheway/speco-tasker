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
| `delete_tag` | 删除标签 | 🟡 中 |
| `rename_tag` | 重命名标签 | 🟡 中 |
| `copy_tag` | 复制标签 | 🟡 中 |
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

### 🧪 测试场景 7: 批量操作和高级管理

**测试目标：** 验证批量任务操作、复杂任务重组和跨上下文管理能力

#### 批量任务创建和管理

1. **批量创建多个任务**
   ```json
   // 连续创建多个任务（任务 4）
   {
     "title": "API 文档编写",
     "description": "编写 REST API 文档",
     "details": "使用 Swagger 生成 API 文档",
     "testStrategy": "文档验证",
     "spec_files": "api-docs.md",
     "priority": "low"
   }

   // 任务 5
   {
     "title": "数据库迁移脚本",
     "description": "创建用户表和索引",
     "details": "设计用户表结构，添加必要的约束和索引",
     "testStrategy": "迁移测试和回滚测试",
     "spec_files": "database-schema.md",
     "priority": "high"
   }

   // 任务 6
   {
     "title": "单元测试框架搭建",
     "description": "配置 Jest 测试环境",
     "details": "集成测试覆盖率报告，配置 CI/CD",
     "testStrategy": "测试框架验证",
     "spec_files": "testing-framework.md",
     "priority": "medium"
   }
   ```

2. **批量任务状态更新**
   ```json
   // 使用 set_task_status 工具批量更新（多个ID用逗号分隔）
   {"id": "4,5", "status": "in-progress"}
   ```

3. **批量查看任务列表**
   ```json
   // 使用 get_tasks 工具查看所有任务
   {"withSubtasks": true}
   ```

#### 复杂任务重组

1. **批量移动任务**
   ```json
   // 使用 move_task 工具批量移动
   {
     "from": "4,5",
     "to": "3.1",
     "withDependencies": false
   }
   ```

2. **批量添加依赖关系**
   ```json
   // 任务 6 依赖任务 3
   {"id": "6", "dependsOn": "3"}

   // 任务 3.1 依赖任务 6
   {"id": "3.1", "dependsOn": "6"}
   ```

3. **验证复杂依赖关系**
   ```json
   // 使用 validate_dependencies 工具
   {}
   ```

#### 批量子任务管理

1. **批量创建子任务**
   ```json
   // 为任务 3 创建多个子任务
   {
     "id": "3",
     "title": "配置测试环境",
     "description": "设置 Jest 和测试数据库",
     "details": "安装依赖包，配置测试脚本"
   }

   {
     "id": "3",
     "title": "编写测试用例",
     "description": "为核心功能编写单元测试",
     "details": "覆盖主要业务逻辑和边界条件"
   }
   ```

2. **批量清除子任务**
   ```json
   // 使用 clear_subtasks 工具清除任务 3 的所有子任务
   {"id": "3"}
   ```

3. **批量移除子任务**
   ```json
   // 使用 remove_subtask 工具（如果需要移除特定子任务）
   {"id": "3.1"}
   ```

#### 跨标签批量操作

1. **批量跨标签移动**
   ```json
   // 创建新标签用于测试
   {"name": "backend", "description": "后端开发任务"}

   // 批量移动任务到新标签
   {
     "from": "5,6",
     "toTag": "backend",
     "ignoreDependencies": true
   }
   ```

2. **验证跨标签数据一致性**
   ```json
   // 切换到 backend 标签
   {"name": "backend"}

   // 查看标签中的任务
   {"withSubtasks": true}
   ```

#### 高级任务更新

1. **批量字段更新**
   ```json
   // 使用 update_task 工具批量更新优先级
   {"id": "1,2,3", "priority": "high", "append": false}
   ```

2. **追加模式更新**
   ```json
   // 使用追加模式更新任务详情
   {
     "id": "1",
     "details": "\n补充：需要考虑安全性，添加输入验证",
     "append": true
   }
   ```

3. **批量依赖管理**
   ```json
   // 添加多个依赖关系
   {"id": "7", "dependsOn": "1,2"}  // 任务7依赖任务1和2

   // 移除特定依赖
   {"id": "7", "dependsOn": "2"}  // 移除任务7对任务2的依赖
   ```

**预期结果：**

**批量 add_task：**
- ✅ 每个响应：`{"success": true, "data": {"id": "4", ...}, {"id": "5", ...}, {"id": "6", ...}}`
- ✅ ID 依次递增且不重复

**批量 set_task_status：**
- ✅ 响应：`{"success": true, "data": [{"id": "4", "status": "in-progress"}, {"id": "5", "status": "in-progress"}]}`
- ✅ 多个任务状态同时更新

**批量 move_task：**
- ✅ 响应：`{"success": true, "data": {"moved": true, "tasks": ["4", "5"], "to": "3.1"}}`
- ✅ 任务正确转换为子任务（4→3.1, 5→3.2）

**批量 clear_subtasks：**
- ✅ 响应：`{"success": true, "data": {"clearedCount": 3, "taskId": "3"}}`
- ✅ 显示清除的子任务数量

**跨标签批量操作：**
- ✅ 响应：`{"success": true, "data": {"moved": true, "from": "5,6", "toTag": "backend"}}`
- ✅ 任务成功移动到目标标签

**批量 update_task：**
- ✅ 响应：`{"success": true, "data": {"updated": true, "ids": ["1", "2", "3"]}}`
- ✅ 多个任务字段同时更新

**验证步骤：**
1. 批量操作正确处理多个ID（逗号分隔）
2. ID 自动重新编号和排序
3. 跨上下文操作保持数据一致性
4. 依赖关系在移动时正确处理
5. 批量操作的原子性（全部成功或全部失败）

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

**测试目标：** 验证任务字段的更新功能，包括替换模式和追加模式

**测试步骤：**

1. **字段替换更新**
   ```json
   // 使用 update_task 工具替换任务标题和描述
   {
     "id": "1",
     "title": "实现安全用户认证功能",
     "description": "创建包含密码强度验证的用户注册和登录功能",
     "append": false
   }
   ```

2. **追加模式更新**
   ```json
   // 使用 update_task 工具追加实现细节
   {
     "id": "1",
     "details": "\n补充要求：密码至少8位，包含大小写字母、数字和特殊字符",
     "append": true
   }
   ```

3. **状态和优先级更新**
   ```json
   // 使用 update_task 工具更新状态和优先级
   {
     "id": "1",
     "status": "in-progress",
     "priority": "high"
   }
   ```

4. **依赖关系更新**
   ```json
   // 使用 update_task 工具更新依赖关系
   {
     "id": "1",
     "dependencies": "2,3"
   }
   ```

**预期结果：**

**字段替换更新：**
- ✅ 响应：`{"success": true, "data": {"updated": true, "id": "1"}}`
- ✅ 任务标题和描述被完全替换

**追加模式更新：**
- ✅ 响应：`{"success": true, "data": {"updated": true, "id": "1"}}`
- ✅ 新的实现细节被追加到现有内容后

**状态和优先级更新：**
- ✅ 响应：`{"success": true, "data": {"updated": true, "id": "1", "status": "in-progress", "priority": "high"}}`
- ✅ 任务状态和优先级正确更新

**依赖关系更新：**
- ✅ 响应：`{"success": true, "data": {"updated": true, "id": "1", "dependencies": ["2", "3"]}}`
- ✅ 任务依赖关系被更新

### 🏷️ 标签系统完整测试

**测试目标：** 验证完整的标签生命周期管理，包括创建、使用、重命名、复制和删除

#### 创建和使用标签

1. **创建新标签**
   ```json
   // 使用 add_tag 工具
   {
     "name": "frontend-dev",
     "description": "前端开发任务集合",
     "copyFromCurrent": false
   }
   ```

2. **切换到新标签**
   ```json
   // 使用 use_tag 工具
   {"name": "frontend-dev"}
   ```

3. **在新标签中创建任务**
   ```json
   // 使用 add_task 工具（自动使用当前标签）
   {
     "title": "实现响应式布局",
     "description": "使用CSS Grid和Flexbox实现移动端适配",
     "details": "支持320px-1920px屏幕宽度，包含断点设计",
     "testStrategy": "跨设备浏览器测试",
     "spec_files": "responsive-design-spec.md",
     "priority": "high"
   }
   ```

#### 标签重命名

**重命名标签测试：**
```json
// 使用 rename_tag 工具
{"oldName": "frontend-dev", "newName": "ui-development"}
```
- ✅ 响应：`{"success": true, "data": {"renamed": true, "from": "frontend-dev", "to": "ui-development"}}`
- ✅ 原标签中的所有任务自动迁移到新标签名
- ✅ 标签描述保持不变

#### 标签复制

**复制标签测试：**
```json
// 使用 copy_tag 工具
{
  "sourceName": "ui-development",
  "targetName": "ui-development-v2",
  "description": "UI开发任务副本，用于实验性功能"
}
```
- ✅ 响应：`{"success": true, "data": {"copied": true, "source": "ui-development", "target": "ui-development-v2"}}`
- ✅ 创建新标签并复制所有任务数据
- ✅ 任务ID在新标签中重新编号

#### 标签删除

**删除空标签测试：**
```json
// 使用 delete_tag 工具
{"name": "ui-development-v2", "yes": true}
```
- ✅ 响应：`{"success": true, "data": {"deleted": true, "tag": "ui-development-v2"}}`

**删除有任务的标签测试：**
```json
// 尝试删除包含任务的标签
{"name": "ui-development", "yes": true}
```
- ❌ 预期响应：`{"success": false, "error": {"code": "TAG_NOT_EMPTY", "message": "Cannot delete tag with existing tasks"}}`
- ✅ 保护机制防止意外删除包含任务的标签

#### 跨标签任务移动

**跨标签移动任务：**
```json
// 使用 move_task 工具进行跨标签移动
{
  "from": "1",
  "fromTag": "main",
  "toTag": "ui-development",
  "ignoreDependencies": true
}
```
- ✅ 响应：`{"success": true, "data": {"moved": true, "from": "1", "toTag": "ui-development"}}`
- ✅ 任务从源标签移动到目标标签
- ✅ 依赖关系被断开（ignoreDependencies: true）

#### 标签列表管理

**查看所有标签：**
```json
// 使用 list_tags 工具
{"showMetadata": true}
```
- ✅ 响应：`{"success": true, "data": [{"name": "main", "tasks": 2, "description": "默认标签"}, {"name": "ui-development", "tasks": 3, "description": "前端开发任务集合"}]}`

#### 预期结果验证

**add_tag 响应：**
- ✅ 格式：`{"success": true, "data": {"name": "frontend-dev", "description": "...", "created": true}}`

**use_tag 响应：**
- ✅ 格式：`{"success": true, "data": {"switched": true, "currentTag": "frontend-dev"}}`

**标签操作响应验证：**
- ✅ 所有标签操作返回 `success: true` 并包含操作结果
- ✅ 标签间任务数据正确隔离
- ✅ 标签元数据（描述、创建时间）正确维护
- ✅ 跨标签操作保持数据一致性

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
  "projectRoot": "string?",       // 项目根目录路径（可选，会自动检测）
  "projectName": "string?",       // 项目名称（可选，会自动从Git仓库或目录名检测）
  "shell": "string?",             // Shell类型（可选，zsh或bash，用于添加别名）
  "force": "boolean?"             // 强制重新初始化，即使项目已存在
}
```

### get_tasks
```json
{
  "status": "string?",            // 状态过滤，支持: "pending"|"in-progress"|"done"|"cancelled"
  "withSubtasks": "boolean?",     // 是否包含子任务，默认false
  "tag": "string?",               // 标签过滤，默认使用当前标签
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?"        // 项目根目录（可选，会自动检测）
}
```

### get_task
```json
{
  "id": "string",                 // 任务ID，支持格式如"1"或"1.1"（子任务）
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### next_task
```json
{
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### add_task
```json
{
  "title": "string",              // 任务标题（必需）
  "description": "string",        // 任务描述（必需）
  "details": "string",            // 详细说明（必需）
  "testStrategy": "string",       // 测试策略（必需）
  "spec_files": "string",         // 规范文档文件路径列表，逗号分隔（必需）
  "priority": "string?",          // 优先级: "high"|"medium"|"low"，默认"medium"
  "dependencies": "string?",      // 依赖的任务ID列表，逗号分隔
  "logs": "string?",              // 任务相关的日志信息
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### add_subtask
```json
{
  "id": "string",                 // 父任务ID（必需）
  "title": "string",              // 子任务标题（必需）
  "description": "string",        // 子任务描述（必需）
  "details": "string",            // 子任务详细说明
  "status": "string?",            // 子任务状态，默认"pending"
  "priority": "string?",          // 子任务优先级，默认继承父任务
  "dependencies": "string?",      // 子任务依赖ID列表，逗号分隔
  "spec_files": "string?",        // 子任务规范文档文件路径列表
  "logs": "string?",              // 子任务相关的日志信息
  "file": "string?",              // 自定义tasks.json文件路径
  "skipGenerate": "boolean?",     // 跳过重新生成任务文件，默认false
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### set_task_status
```json
{
  "id": "string",                 // 任务ID，支持多个ID用逗号分隔（如"1,2,3"）
  "status": "string",             // 状态: "pending"|"in-progress"|"done"|"review"|"deferred"|"cancelled"
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### add_dependency
```json
{
  "id": "string",                 // 将依赖其他任务的任务ID
  "dependsOn": "string",          // 成为依赖项的任务ID
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### remove_dependency
```json
{
  "id": "string",                 // 要从中删除依赖项的任务ID
  "dependsOn": "string",          // 要作为依赖项删除的任务ID
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### validate_dependencies
```json
{
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### fix_dependencies
```json
{
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### clear_subtasks
```json
{
  "id": "string?",                // 要清除子任务的任务ID，支持多个ID用逗号分隔
  "all": "boolean?",              // 清除所有任务的子任务，默认false
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### remove_subtask
```json
{
  "id": "string",                 // 子任务ID，格式为"parentId.subtaskId"
  "convert": "boolean?",          // 转换为独立任务而非删除，默认false
  "file": "string?",              // 自定义tasks.json文件路径
  "skipGenerate": "boolean?",     // 跳过重新生成任务文件，默认false
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### remove_task
```json
{
  "id": "string",                 // 要删除的任务ID，支持多个ID用逗号分隔
  "file": "string?",              // 自定义tasks.json文件路径
  "confirm": "boolean?",          // 是否跳过确认提示，默认false
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### add_tag
```json
{
  "name": "string",               // 要创建的新标签名称（必需）
  "copyFromCurrent": "boolean?",  // 是否从当前标签复制任务，默认false
  "copyFromTag": "string?",       // 要复制任务的特定标签
  "fromBranch": "boolean?",       // 从当前git分支创建标签名称，默认false
  "description": "string?",       // 标签的可选描述
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?"        // 项目根目录（可选，会自动检测）
}
```

### list_tags
```json
{
  "showMetadata": "boolean?",     // 是否在输出中包含元数据，默认false
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?"        // 项目根目录（可选，会自动检测）
}
```

### use_tag
```json
{
  "name": "string",               // 要切换到的标签名称（必需）
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?"        // 项目根目录（可选，会自动检测）
}
```

### delete_tag
```json
{
  "name": "string",               // 要删除的标签名称（必需）
  "yes": "boolean?",              // 跳过确认提示，默认false
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?"        // 项目根目录（可选，会自动检测）
}
```

### rename_tag
```json
{
  "oldName": "string",            // 标签的当前名称（必需）
  "newName": "string",            // 标签的新名称（必需）
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?"        // 项目根目录（可选，会自动检测）
}
```

### copy_tag
```json
{
  "sourceName": "string",         // 要复制的源标签名称（必需）
  "targetName": "string",         // 要创建的新标签名称（必需）
  "description": "string?",       // 新标签的可选描述
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?"        // 项目根目录（可选，会自动检测）
}
```

### move_task
```json
{
  "from": "string",               // 要移动的任务ID，支持多个ID用逗号分隔
  "to": "string?",                // 目标ID（标签内移动时必需）
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?",               // 标签上下文，默认使用当前标签
  "fromTag": "string?",           // 跨标签移动的源标签
  "toTag": "string?",             // 跨标签移动的目标标签
  "withDependencies": "boolean?", // 同时移动主任务的依赖任务，默认false
  "ignoreDependencies": "boolean?" // 跨标签移动时断开依赖关系，默认false
}
```

### update_task
```json
{
  "id": "string",                 // 要更新的任务ID（必需）
  "title": "string?",             // 更新任务标题
  "description": "string?",       // 更新任务描述
  "status": "string?",            // 更新任务状态
  "priority": "string?",          // 更新任务优先级
  "details": "string?",           // 更新任务实现细节
  "testStrategy": "string?",      // 更新任务测试策略
  "dependencies": "string?",      // 更新任务依赖关系
  "spec_files": "string?",        // 更新规范文档文件路径列表
  "logs": "string?",              // 更新任务相关的日志信息
  "append": "boolean?",           // 追加模式而非替换，默认true
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### update_subtask
```json
{
  "id": "string",                 // 要更新的子任务ID，格式为"parentId.subtaskId"（必需）
  "title": "string?",             // 更新子任务标题
  "description": "string?",       // 更新子任务描述
  "status": "string?",            // 更新子任务状态
  "priority": "string?",          // 更新子任务优先级
  "details": "string?",           // 更新子任务实现细节
  "testStrategy": "string?",      // 更新子任务测试策略
  "dependencies": "string?",      // 更新子任务依赖关系
  "spec_files": "string?",        // 更新子任务规范文档文件路径列表
  "logs": "string?",              // 更新子任务相关的日志信息
  "append": "boolean?",           // 追加模式而非替换，默认true
  "file": "string?",              // 自定义tasks.json文件路径
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

### generate
```json
{
  "file": "string?",              // 任务文件的绝对路径
  "output": "string?",            // 输出目录，默认与任务文件相同目录
  "projectRoot": "string?",       // 项目根目录（可选，会自动检测）
  "tag": "string?"                // 标签上下文，默认使用当前标签
}
```

---

*最后更新：2025年09月23日*

*基于完整 MCP 工具规范生成的手动测试指南*
