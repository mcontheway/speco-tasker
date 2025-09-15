# Task Master 项目改造需求文档

## 1. 项目概述

Task Master 是一个任务管理工具，目前集成了AI功能用于任务生成、分析和优化。本次改造旨在移除所有AI相关功能，专注于提供纯粹的手动任务管理能力。

## 2. 当前状态

### 2.1 现有功能状态
- 项目包含 38 个功能模块
- 其中 11 个功能涉及AI调用
- 27 个功能为纯手动操作
- 1 个功能支持混合模式（可选择使用AI）

### 2.2 AI功能分布
- 任务解析与生成：parse-prd, add-task（部分AI）
- 任务更新：update, update-task, update-subtask
- 任务复杂度调整：scope-up, scope-down
- 任务分解：expand, expand-all
- 复杂度分析：analyze-complexity
- AI研究：research

## 3. 改造目标

### 3.1 主要目标
- 移除所有AI功能调用
- 保留完整的任务管理核心功能
- 简化系统架构和依赖关系
- 提高系统稳定性和可预测性

### 3.2 质量目标
- 保持现有纯手动功能的完整性
- 不影响任务管理的核心业务逻辑
- 维持向后兼容性
- 确保移除操作不破坏现有功能

## 4. 功能移除需求

### 4.1 AI服务移除
- 移除所有 generateObjectService 调用
- 移除所有 generateTextService 调用
- 移除 AI 模型配置相关功能
- 移除 Perplexity AI 集成

### 4.2 功能模块移除
- parse-prd 功能（PRD解析功能）
- update 系列功能（update, update-task, update-subtask）
- scope-up 和 scope-down 功能
- expand 和 expand-all 功能
- analyze-complexity 功能
- research 功能

### 4.3 配置和依赖移除
- 移除 AI 模型配置文件
- 移除 AI 服务相关依赖包
- 移除 AI 相关环境变量配置
- 移除 AI 服务初始化代码

## 5. 功能保留需求

### 5.1 核心任务管理功能
- 任务列表查看（get-tasks）
- 单个任务查看（get-task）
- 任务状态设置（set-status）
- 任务位置移动（move-task）
- 任务删除（remove-task）

### 5.2 子任务管理功能
- 子任务添加（add-subtask）
- 子任务删除（remove-subtask）
- 子任务清理（clear-subtasks）

### 5.3 任务更新功能
- 单个任务更新（update-task）
- 子任务更新（update-subtask）
- 支持更新部分或全部任务字段
- 支持字段覆盖更新方式
- 对 details 和 description 字段支持头部添加更新方式

### 5.4 依赖关系管理功能
- 依赖关系添加（add-dependency）
- 依赖关系移除（remove-dependency）
- 依赖关系验证（validate-dependencies）
- 依赖关系修复（fix-dependencies）

### 5.5 标签管理功能
- 标签创建（add-tag）
- 标签删除（delete-tag）
- 标签列表查看（list-tags）
- 标签切换（use-tag）
- 标签重命名（rename-tag）
- 标签复制（copy-tag）

### 5.6 文件和报告功能
- 任务文件生成（generate）
- 复杂度报告查看（complexity-report）
- README同步（sync-readme）

### 5.7 系统管理功能
- 项目初始化（init）
- 数据迁移（migrate）
- 规则管理（rules）
- 语言设置（lang）

## 6. 混合模式处理需求

### 6.1 add-task 功能处理
- 保留手动参数创建任务的功能
- 移除AI自动生成任务的逻辑
- 简化参数验证和任务创建流程

## 7. 验收标准

### 7.1 功能验收标准
- 所有保留功能正常工作
- 所有AI功能已被完全移除
- 系统不再依赖任何AI服务
- 手动任务创建功能完整保留
- 任务更新功能支持部分或全部字段更新
- 任务更新功能支持字段覆盖更新方式
- 对 details 和 description 字段支持头部添加更新方式

### 7.2 性能验收标准
- 系统启动时间不超过原有系统的80%
- 核心功能响应时间保持不变
- 内存使用量有所减少

### 7.3 兼容性验收标准
- 现有任务数据完全兼容
- 配置文件格式保持兼容
- API接口保持向后兼容

## 8. 风险识别

### 8.1 技术风险
- 移除AI功能可能影响某些间接依赖的功能
- 配置文件格式变化可能导致兼容性问题
- 系统性能优化需要额外调整

### 8.2 业务风险
- 用户习惯的改变
- 功能简化可能影响用户体验
- 缺少AI辅助可能降低操作效率

## 9. 范围界定

### 9.1 包含范围
- 源代码中AI功能的移除
- 相关依赖包的清理
- 配置文件的调整
- 文档的更新

### 9.2 不包含范围
- 用户界面的重新设计
- 数据库结构的重新设计
- 新功能的开发
- 第三方集成的修改
