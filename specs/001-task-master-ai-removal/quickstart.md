# Task Master 快速入门指南

## 概述

Task Master 现已完成AI功能移除重构，提供纯粹的手动任务管理能力。本指南将帮助您快速上手使用新的Task Master。

## 安装和设置

### 前提条件
- Node.js 16.0 或更高版本
- npm 或 yarn

### 安装
```bash
npm install -g task-master-ai
# 或者
npm install -g taskmaster-no-ai  # 重构后的版本
```

### 初始化项目
```bash
# 创建新项目
mkdir my-project
cd my-project
task-master init --name "My Project"

# 或者从现有项目开始
task-master init --yes
```

## 核心功能使用

### 1. 任务管理

#### 创建任务
```bash
# 手动创建任务（推荐方式）
task-master add-task \
  --title "实现用户认证模块" \
  --description "添加完整的用户认证系统" \
  --details "使用JWT token，前端表单验证" \
  --priority "high" \
  --testStrategy "单元测试 + 集成测试"
```

#### 查看任务
```bash
# 查看所有任务
task-master list

# 查看特定状态的任务
task-master list --status pending

# 查看包含子任务的任务
task-master list --with-subtasks

# 查看单个任务详情
task-master show 1
```

#### 更新任务状态
```bash
# 开始处理任务
task-master set-status --id 1 --status in-progress

# 完成任务
task-master set-status --id 1 --status done

# 批量更新状态
task-master set-status --id 1,2,3 --status done
```

### 2. 子任务管理

#### 添加子任务
```bash
# 添加子任务
task-master add-subtask --id 1 \
  --title "实现登录表单" \
  --description "创建用户登录的表单组件"

# 将现有任务转换为子任务
task-master add-subtask --id 1 --task-id 5
```

#### 管理子任务
```bash
# 删除子任务
task-master remove-subtask --id 1.2 --yes

# 删除并转换为独立任务
task-master remove-subtask --id 1.2 --convert --yes

# 清除所有子任务
task-master clear-subtasks --id 1 --yes
```

### 3. 依赖关系管理

#### 添加依赖
```bash
# 添加任务依赖
task-master add-dependency --id 5 --depends-on 3

# 子任务依赖
task-master add-dependency --id 5.2 --depends-on 5.1
```

#### 移除依赖
```bash
task-master remove-dependency --id 5 --depends-on 3
```

#### 验证依赖
```bash
# 检查依赖关系完整性
task-master validate-dependencies

# 自动修复依赖问题
task-master fix-dependencies
```

### 4. 标签管理（多上下文支持）

#### 创建标签
```bash
# 创建新标签
task-master add-tag feature-auth --description "用户认证功能"

# 从当前标签复制
task-master add-tag feature-auth --copy-from-current

# 从Git分支创建标签
task-master add-tag --from-branch
```

#### 切换标签
```bash
# 切换到指定标签
task-master use-tag feature-auth

# 查看所有标签
task-master tags
```

### 5. 手动更新功能

#### 更新任务内容
```bash
# 更新单个任务（保留原有逻辑）
task-master update-task --id 5 \
  --prompt "更新任务描述和实现细节"

# 更新子任务
task-master update-subtask --id 5.1 \
  --prompt "记录实现过程中的发现"
```

## 工作流程示例

### 典型开发流程

```bash
# 1. 初始化项目
task-master init --name "Web App Development"

# 2. 创建主要任务
task-master add-task \
  --title "实现用户管理系统" \
  --description "完整的用户注册、登录、权限管理" \
  --priority "high"

# 3. 任务分解为子任务
task-master add-subtask --id 1 --title "设计数据库模型"
task-master add-subtask --id 1 --title "实现API接口"
task-master add-subtask --id 1 --title "创建前端界面"

# 4. 设置依赖关系
task-master add-dependency --id 1.2 --depends-on 1.1
task-master add-dependency --id 1.3 --depends-on 1.2

# 5. 开始工作
task-master set-status --id 1.1 --status in-progress

# 6. 记录进度
task-master update-subtask --id 1.1 \
  --prompt "完成了用户表的创建和基础字段设计"

# 7. 完成子任务
task-master set-status --id 1.1 --status done

# 8. 继续下一个任务
task-master next  # 查看下一个可执行任务
```

### 多功能并行开发

```bash
# 为不同功能创建标签
task-master add-tag frontend --description "前端界面开发"
task-master add-tag backend --description "后端API开发"
task-master add-tag testing --description "测试用例编写"

# 在不同标签间切换
task-master use-tag frontend
# ... 前端相关任务

task-master use-tag backend
# ... 后端相关任务

task-master use-tag testing
# ... 测试相关任务
```

## 配置和定制

### AI模型配置（保留用于兼容性）
```bash
# 查看当前配置
task-master models

# 设置模型（如果需要）
task-master models --set-main gpt-4o

# 交互式配置
task-master models --setup
```

### 规则管理
```bash
# 查看可用规则
task-master rules list

# 添加规则集
task-master rules add cursor,windsurf

# 移除规则
task-master rules remove cursor
```

### 语言设置
```bash
# 设置中文响应
task-master lang zh

# 设置英文响应
task-master lang en
```

## 测试和验证

### 运行测试
```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 查看测试覆盖率
npm run test:coverage
```

### 验证任务完整性
```bash
# 验证依赖关系
task-master validate-dependencies

# 生成任务报告
task-master generate

# 查看复杂度报告
task-master complexity-report
```

## 故障排除

### 常见问题

1. **任务文件找不到**
   ```bash
   # 检查当前目录结构
   ls -la .taskmaster/

   # 重新初始化
   task-master init --yes
   ```

2. **命令执行失败**
   ```bash
   # 检查Node.js版本
   node --version

   # 检查Task Master版本
   task-master --version

   # 重新安装
   npm install -g taskmaster-no-ai
   ```

3. **标签切换问题**
   ```bash
   # 查看当前标签
   task-master tags

   # 确保标签存在
   task-master add-tag my-tag --description "My tasks"
   ```

## 最佳实践

1. **定期备份**: 重要任务数据定期备份
2. **清晰命名**: 任务标题简洁明了
3. **合理分解**: 复杂任务分解为可管理的小任务
4. **及时更新**: 任务状态及时更新
5. **依赖管理**: 正确设置任务依赖关系
6. **标签组织**: 使用标签组织不同类型的任务

## 从AI版本迁移

如果您之前使用的是包含AI功能的Task Master版本：

1. **数据完全兼容**: 现有任务数据无需转换
2. **功能调整**: 原来使用AI创建的任务需要手动调整
3. **工作流变化**: 现在所有任务创建和更新都是手动操作
4. **性能提升**: 系统启动更快，响应更稳定

## 获取帮助

```bash
# 查看所有可用命令
task-master --help

# 查看特定命令帮助
task-master add-task --help
task-master list --help
```

更多详细信息请参考项目文档和示例。
