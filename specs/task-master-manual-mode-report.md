# Speco Tasker 功能探查报告 - 手动模式使用指南

## 概述

本文档专注于 Speco Tasker 系统中**手动模式**的使用方法。所有功能按照功能类型分组，清晰标注是否集成 AI 功能。

## 🎯 模式类型说明

### 🔧 **纯手动模式** (27个功能)
完全不调用任何 AI 模型，可以放心使用的功能：
- ✅ **任务管理**：get-tasks, get-task, next-task, set-status, move-task, remove-task
- ✅ **子任务管理**：add-subtask, remove-subtask, clear-subtasks
- ✅ **依赖关系管理**：add-dependency, remove-dependency, validate-dependencies, fix-dependencies
- ✅ **标签管理**：add-tag, delete-tag, list-tags, use-tag, rename-tag, copy-tag
- ✅ **文件与报告**：generate, complexity-report, sync-readme
- ✅ **系统管理**：init, migrate, rules

### 🔄 **混合模式** (1个功能)
部分支持手动模式，可以通过特定参数完全跳过 AI：
- 🔄 **add-task**：通过提供手动参数完全跳过 AI

### 🤖 **完全 AI 模式** (10个功能)
必须使用 AI 模型的功能，无法使用纯手动模式：
- ❌ **任务解析与生成**：parse-prd
- ❌ **任务更新**：update, update-task, update-subtask
- ❌ **复杂度调整**：scope-up, scope-down
- ❌ **任务分解**：expand, expand-all
- ❌ **复杂度分析**：analyze-complexity
- ❌ **AI 研究**：research

## 🎯 分析原则

- **🤖 集成 AI 功能**：调用任何 AI 模型的功能（无论 main 模型还是 research 模型）
- **🔧 纯手动功能**：不调用任何 AI 模型的功能

---

## 🔧 纯手动功能（不使用 AI）

### 1. 🔧 任务管理

#### 1.1 get-tasks / get_tasks - 获取任务列表
```bash
# 查看所有任务
task-master list

# 查看特定状态的任务
task-master list --status pending

# 查看包含子任务的任务
task-master list --with-subtasks

# MCP 使用
{
  "status": "pending",
  "withSubtasks": true,
  "projectRoot": "/path/to/project"
}
```

#### 1.2 get-task / get_task - 获取单个任务详情
```bash
# 查看任务详情
task-master show 1

# 查看子任务详情
task-master show 1.2

# MCP 使用
{
  "id": "1",
  "projectRoot": "/path/to/project"
}
```

#### 1.3 next-task / next_task - 获取下一个可执行任务
```bash
# 获取下一个任务
task-master next

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

#### 1.4 set-status / set_task_status - 设置任务状态
```bash
# 设置任务状态
task-master set-status --id 1 --status in-progress

# 批量设置状态
task-master set-status --id 1,2,3 --status done

# MCP 使用
{
  "id": "1",
  "status": "in-progress",
  "projectRoot": "/path/to/project"
}
```

#### 1.5 move-task / move_task - 移动任务位置
```bash
# 将任务移动到新位置
task-master move --from 5 --to 3

# 批量移动任务
task-master move --from 10,11,12 --to 16,17,18

# MCP 使用
{
  "from": "5",
  "to": "3",
  "projectRoot": "/path/to/project"
}
```

#### 1.6 remove-task / remove_task - 删除任务
```bash
# 删除任务
task-master remove-task --id 5 --yes

# MCP 使用
{
  "id": "5",
  "projectRoot": "/path/to/project"
}
```

### 2. 🔧 子任务管理

#### 2.1 🔧 add-subtask / add_subtask - 添加子任务
```bash
# 添加新子任务
task-master add-subtask --id 1 \
  --title "实现登录表单" \
  --description "创建用户登录的表单组件" \
  --status pending

# 将现有任务转换为子任务
task-master add-subtask --id 1 --task-id 5

# MCP 使用
{
  "id": "1",
  "title": "实现登录表单",
  "description": "创建用户登录的表单组件",
  "projectRoot": "/path/to/project"
}
```

#### 2.2 🔧 remove-subtask / remove_subtask - 删除子任务
```bash
# 删除子任务
task-master remove-subtask --id 1.2 --yes

# 删除并转换为独立任务
task-master remove-subtask --id 1.2 --convert --yes

# MCP 使用
{
  "id": "1.2",
  "convert": true,
  "projectRoot": "/path/to/project"
}
```

#### 2.3 🔧 clear-subtasks / clear_subtasks - 清除所有子任务
```bash
# 清除任务的所有子任务
task-master clear-subtasks --id 1,2,3 --yes

# 清除所有任务的子任务
task-master clear-subtasks --all --yes

# MCP 使用
{
  "id": "1,2,3",
  "projectRoot": "/path/to/project"
}
```

### 3. 🔧 依赖关系管理

#### 3.1 add-dependency / add_dependency - 添加任务依赖
```bash
# 添加依赖关系
task-master add-dependency --id 5 --depends-on 3

# MCP 使用
{
  "id": "5",
  "dependsOn": "3",
  "projectRoot": "/path/to/project"
}
```

#### 3.2 remove-dependency / remove_dependency - 移除任务依赖
```bash
# 移除依赖关系
task-master remove-dependency --id 5 --depends-on 3

# MCP 使用
{
  "id": "5",
  "dependsOn": "3",
  "projectRoot": "/path/to/project"
}
```

#### 3.3 validate-dependencies / validate_dependencies - 验证依赖关系
```bash
# 验证依赖关系完整性
task-master validate-dependencies

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

#### 3.4 fix-dependencies / fix_dependencies - 修复依赖问题
```bash
# 自动修复依赖问题
task-master fix-dependencies

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

### 4. 🔧 标签管理（多上下文支持）

#### 4.1 🔧 add-tag / add_tag - 创建新标签
```bash
# 创建新标签
task-master add-tag feature-auth \
  --description "用户认证功能开发"

# 从当前标签复制
task-master add-tag feature-auth \
  --copy-from-current \
  --description "用户认证功能开发"

# 从指定标签复制
task-master add-tag feature-auth \
  --copy-from main \
  --description "用户认证功能开发"

# 从 Git 分支创建标签
task-master add-tag --from-branch \
  --description "基于当前分支创建标签"

# MCP 使用
{
  "name": "feature-auth",
  "description": "用户认证功能开发",
  "copyFromCurrent": false,
  "projectRoot": "/path/to/project"
}
```

#### 4.2 delete-tag / delete_tag - 删除标签
```bash
# 删除标签
task-master delete-tag old-feature --yes

# MCP 使用
{
  "name": "old-feature",
  "projectRoot": "/path/to/project"
}
```

#### 4.3 list-tags / list_tags - 列出所有标签
```bash
# 列出所有标签
task-master tags

# 显示详细信息
task-master tags --show-metadata

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

#### 4.4 use-tag / use_tag - 切换标签上下文
```bash
# 切换到指定标签
task-master use-tag feature-auth

# MCP 使用
{
  "name": "feature-auth",
  "projectRoot": "/path/to/project"
}
```

#### 4.5 rename-tag / rename_tag - 重命名标签
```bash
# 重命名标签
task-master rename-tag old-name new-name

# MCP 使用
{
  "oldName": "old-name",
  "newName": "new-name",
  "projectRoot": "/path/to/project"
}
```

#### 4.6 copy-tag / copy_tag - 复制标签
```bash
# 复制标签
task-master copy-tag source-tag target-tag \
  --description "复制的标签"

# MCP 使用
{
  "sourceName": "source-tag",
  "targetName": "target-tag",
  "description": "复制的标签",
  "projectRoot": "/path/to/project"
}
```

### 5. 🔧 文件与报告

#### 5.1 🔧 generate / generate - 生成任务文件
```bash
# 生成任务 Markdown 文件
task-master generate

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

#### 5.2 complexity-report / complexity_report - 查看复杂度报告
```bash
# 查看复杂度分析报告
task-master complexity-report

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

#### 5.3 sync-readme / sync_readme - 同步 README
```bash
# 将任务列表同步到 README
task-master sync-readme

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

### 6. 🔧 系统管理

#### 6.1 🔧 init / initialize_project - 初始化项目
```bash
# 初始化新项目
task-master init --name "My Project"

# 使用默认设置快速初始化
task-master init --yes

# MCP 使用
{
  "projectName": "My Project",
  "yes": false
}
```

#### 6.2 migrate / migrate - 数据迁移
```bash
# 执行数据迁移
task-master migrate

# MCP 使用
{
  "projectRoot": "/path/to/project"
}
```

#### 6.3 rules / rules - 规则管理
```bash
# 查看可用规则
task-master rules list

# 添加规则
task-master rules add cursor,roo

# 移除规则
task-master rules remove cursor

# 交互式设置
task-master rules setup

# MCP 使用
{
  "action": "add",
  "profiles": ["cursor", "roo"],
  "projectRoot": "/path/to/project"
}
```

---

## 🤖 集成 AI 功能（使用 AI 模型）

### 1. 🔄 任务解析与生成

#### 1.1 🔄 add-task / add_task - 任务创建
```bash
# 使用 AI 根据描述生成任务
task-master add-task "实现一个完整的用户认证系统"

# 使用手动参数（完全跳过 AI）
task-master add-task \
  --title "实现用户登录功能" \
  --description "添加完整的用户认证系统" \
  --details "使用 JWT token，需要密码加密，前端表单验证" \
  --priority "high" \
  --dependencies "1,2" \
  --testStrategy "单元测试 + 集成测试"

# MCP 使用 - AI 模式
{
  "prompt": "实现一个完整的用户认证系统",
  "projectRoot": "/path/to/project"
}

# MCP 使用 - 手动模式
{
  "title": "实现用户登录功能",
  "description": "添加完整的用户认证系统",
  "details": "使用 JWT token，需要密码加密，前端表单验证",
  "priority": "high",
  "dependencies": "1,2",
  "testStrategy": "单元测试 + 集成测试",
  "projectRoot": "/path/to/project"
}
```

### 2. 🤖 任务解析与生成

#### 2.1 🤖 parse-prd / parse_prd - PRD 解析
```bash
# 使用 AI 解析 PRD 文件
task-master parse-prd requirements.txt \
  --num-tasks 10 \
  --force

# 使用研究增强模式
task-master parse-prd requirements.txt --research

# MCP 使用
{
  "input": "requirements.txt",
  "research": true,
  "numTasks": "10",
  "force": true,
  "projectRoot": "/path/to/project"
}
```

### 3. 🤖 任务更新

#### 3.1 🤖 update / update - 批量任务更新
```bash
# 批量更新任务
task-master update --from 5 --prompt "更新说明"

# MCP 使用
{
  "from": "5",
  "prompt": "更新说明",
  "research": true,
  "projectRoot": "/path/to/project"
}
```

#### 3.2 🤖 update-task / update_task - 单个任务更新
```bash
# 更新单个任务
task-master update-task --id 5 --prompt "更新说明"

# MCP 使用
{
  "id": "5",
  "prompt": "更新说明",
  "research": true,
  "projectRoot": "/path/to/project"
}
```

#### 3.3 🤖 update-subtask / update_subtask - 子任务更新
```bash
# 更新子任务
task-master update-subtask --id 5.1 --prompt "更新说明"

# MCP 使用
{
  "id": "5.1",
  "prompt": "更新说明",
  "research": true,
  "projectRoot": "/path/to/project"
}
```

### 4. 🤖 任务复杂度调整

#### 4.1 🤖 scope-up / scope_up_task - 增加任务复杂度
```bash
# 增加任务复杂度
task-master scope-up --id 5 \
  --strength heavy \
  --prompt "增加更多安全验证"

# MCP 使用
{
  "id": "5",
  "strength": "heavy",
  "prompt": "增加更多安全验证",
  "research": true,
  "projectRoot": "/path/to/project"
}
```

#### 4.2 🤖 scope-down / scope_down_task - 减少任务复杂度
```bash
# 减少任务复杂度
task-master scope-down --id 5 \
  --strength light \
  --prompt "简化实现方案"

# MCP 使用
{
  "id": "5",
  "strength": "light",
  "prompt": "简化实现方案",
  "research": true,
  "projectRoot": "/path/to/project"
}
```

### 5. 🤖 任务分解

#### 5.1 🤖 expand / expand_task - 任务分解
```bash
# 将任务分解为子任务
task-master expand --id 5 \
  --num 5 \
  --prompt "分解为具体实现步骤"

# MCP 使用
{
  "id": "5",
  "num": "5",
  "prompt": "分解为具体实现步骤",
  "research": true,
  "projectRoot": "/path/to/project"
}
```

#### 5.2 🤖 expand-all / expand_all - 批量任务分解
```bash
# 批量分解任务
task-master expand --all \
  --num 3 \
  --prompt "为所有任务生成子任务"

# MCP 使用
{
  "num": "3",
  "prompt": "为所有任务生成子任务",
  "research": true,
  "projectRoot": "/path/to/project"
}
```

### 6. 🤖 复杂度分析

#### 6.1 🤖 analyze-complexity / analyze_project_complexity - 复杂度分析
```bash
# 分析任务复杂度
task-master analyze-complexity \
  --threshold 7 \
  --research

# MCP 使用
{
  "threshold": 7,
  "research": true,
  "projectRoot": "/path/to/project"
}
```

### 7. 🤖 AI 研究

#### 7.1 🤖 research / research - AI 研究查询
```bash
# AI 研究查询
task-master research "如何实现用户认证" \
  --task-ids 1,2 \
  --detail-level high

# MCP 使用
{
  "query": "如何实现用户认证",
  "taskIds": "1,2",
  "detailLevel": "high",
  "projectRoot": "/path/to/project"
}
```

---

## 📊 统计总结

| 功能分组 | 模式类型 | 功能数量 | 手动模式支持 | 说明 |
|----------|----------|----------|-------------|------|
| **任务管理** | 🔧 纯手动 | 6 | ✅ 完全支持 | get-tasks, get-task, next-task, set-status, move-task, remove-task |
| **子任务管理** | 🔧 纯手动 | 3 | ✅ 完全支持 | add-subtask, remove-subtask, clear-subtasks |
| **依赖关系管理** | 🔧 纯手动 | 4 | ✅ 完全支持 | add-dependency, remove-dependency, validate-dependencies, fix-dependencies |
| **标签管理** | 🔧 纯手动 | 6 | ✅ 完全支持 | add-tag, delete-tag, list-tags, use-tag, rename-tag, copy-tag |
| **文件与报告** | 🔧 纯手动 | 3 | ✅ 完全支持 | generate, complexity-report, sync-readme |
| **系统管理** | 🔧 纯手动 | 4 | ✅ 完全支持 | init, migrate, rules |
| **任务解析与生成** | 🔄 混合模式 | 1 | 🔄 部分支持 | add-task |
| **任务解析与生成** | 🤖 完全 AI | 1 | ❌ 不支持 | parse-prd |
| **任务更新** | 🤖 完全 AI | 3 | ❌ 不支持 | update, update-task, update-subtask |
| **任务复杂度调整** | 🤖 完全 AI | 2 | ❌ 不支持 | scope-up, scope-down |
| **任务分解** | 🤖 完全 AI | 2 | ❌ 不支持 | expand, expand-all |
| **复杂度分析** | 🤖 完全 AI | 1 | ❌ 不支持 | analyze-complexity |
| **AI 研究** | 🤖 完全 AI | 1 | ❌ 不支持 | research |

**总计：🔧 纯手动功能 27 个，🔄 混合模式功能 1 个，🤖 完全 AI 功能 10 个**

---

## 🔍 技术实现说明

### AI 调用检测方法：

本文档通过分析源码中的以下模式来识别 AI 使用：

1. **generateObjectService 调用**：对象生成服务，用于结构化数据生成
2. **generateTextService 调用**：文本生成服务，用于自然语言生成
3. **任何 AI 模型调用**：无论使用 main 模型还是 research 模型

### 手动模式实现原理：

1. **参数条件分支**：通过检测特定参数来决定是否使用 AI
2. **功能完全跳过**：某些功能通过提供完整的手动参数来完全跳过 AI

---

*本文档专注于手动模式的使用方法，不包含 AI 功能的使用说明。如需了解 AI 功能的使用，请参考其他相关文档。*
