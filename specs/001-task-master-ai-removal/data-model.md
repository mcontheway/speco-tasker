# 数据模型设计

## 概述

Speco Tasker AI功能移除重构项目的数据模型保持现有系统的JSON格式，但移除了所有AI相关的字段和处理逻辑。

## 核心实体

### 任务实体 (Task)

```javascript
{
  id: number,           // 任务唯一标识符
  title: string,        // 任务标题
  description: string,  // 任务描述
  status: string,       // 任务状态
  dependencies: number[], // 依赖任务ID数组
  priority: string,     // 优先级
  details: string,      // 详细说明
  testStrategy: string, // 测试策略
  subtasks: Subtask[]   // 子任务数组
}
```

#### 状态转换
- `pending` → `in-progress` → `done`
- `pending` → `deferred`
- `in-progress` → `review` → `done`
- 任何状态 → `cancelled`

#### 有效性规则
- `id`: 必须为正整数
- `title`: 非空字符串，最大长度100字符
- `description`: 可为空，最大长度500字符
- `status`: 必须是预定义状态值之一
- `dependencies`: 数组中的ID必须存在
- `priority`: 必须是 'high', 'medium', 'low' 之一

### 子任务实体 (Subtask)

```javascript
{
  id: number,           // 子任务标识符（父任务内唯一）
  title: string,        // 子任务标题
  description: string,  // 子任务描述
  status: string,       // 子任务状态
  dependencies: number[], // 依赖子任务ID数组
  details: string       // 子任务详细说明
}
```

#### 有效性规则
- `id`: 必须为正整数，从1开始递增
- `title`: 非空字符串，最大长度100字符
- `description`: 可为空，最大长度300字符
- `status`: 同任务状态值
- `dependencies`: 数组中的ID必须在同一父任务内存在

### 标签实体 (Tag)

```javascript
{
  name: string,         // 标签名称
  description: string,  // 标签描述
  created: string,      // 创建时间 (ISO格式)
  taskCount: number     // 任务数量
}
```

#### 有效性规则
- `name`: 非空字符串，只能包含字母、数字、连字符、下划线
- `description`: 可为空，最大长度200字符

## 数据关系

### 任务依赖关系
- 任务可以依赖其他任务
- 不允许循环依赖
- 依赖任务必须先完成

### 父子任务关系
- 子任务只能属于一个父任务
- 子任务ID在父任务范围内唯一
- 子任务可以依赖其他子任务或父任务

### 标签任务关系
- 一个任务可以属于多个标签上下文
- 不同标签的同名任务完全隔离
- 标签切换时任务数据独立保存

## 数据约束

### 完整性约束
- 所有任务ID在同一标签上下文中必须唯一
- 依赖关系引用的任务必须存在
- 子任务ID在父任务范围内必须唯一

### 业务规则约束
- 已完成的任务不能被修改（除状态外）
- 循环依赖被严格禁止
- 任务状态转换必须遵循预定义流程

## 数据迁移策略

### AI功能移除的影响
- 移除所有AI生成的内容字段
- 保持现有数据格式兼容性
- 清理可能存在的AI相关元数据

### 向后兼容性保证
- 现有JSON文件格式完全保持
- 所有字段结构不变
- 只移除功能调用，不改变数据结构

## 性能考虑

### 存储优化
- 移除AI相关字段可以减少存储空间
- 保持JSON格式的读取性能
- 优化文件I/O操作

### 内存优化
- 移除AI服务初始化减少内存占用
- 简化对象结构降低内存使用
- 减少运行时依赖库的内存消耗
