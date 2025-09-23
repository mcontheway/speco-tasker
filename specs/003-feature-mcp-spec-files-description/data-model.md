# 数据模型：MCP 接口 spec_files 字段

**功能分支**: 003-feature-mcp-spec-files-description
**日期**: 2025年09月23日

## 概述

本功能对 MCP 接口的 spec_files 字段进行重构，从简单的字符串格式升级为完整的 JSON 对象数组格式，以提供更好的规范文档管理能力。

## 数据实体

### 规范文档对象 (SpecFile)

规范文档对象表示单个规范文档，包含完整的元数据信息。

**字段定义**:

| 字段名 | 类型 | 必需 | 描述 | 验证规则 |
|--------|------|------|------|----------|
| `type` | 枚举字符串 | 是 | 文档类型 | 必须是预定义枚举值之一 |
| `title` | 字符串 | 是 | 文档标题 | 非空字符串，最长 200 字符 |
| `file` | 字符串 | 是 | 文件路径 | 有效的相对路径格式 |

**枚举值定义**:

```typescript
enum SpecFileType {
  PLAN = "plan",           // 实施计划文档
  SPEC = "spec",           // 技术规格文档
  REQUIREMENT = "requirement", // 需求文档
  DESIGN = "design",       // 设计文档
  TEST = "test",           // 测试文档
  OTHER = "other"          // 其他类型文档
}
```

### MCP 工具参数

#### add_task 工具

**参数结构**:
```typescript
interface AddTaskParams {
  title: string;
  description: string;
  details: string;
  testStrategy: string;
  spec_files: SpecFile[];  // 必需，最小长度 1
  dependencies?: string[];
  priority?: "high" | "medium" | "low";
  logs?: string;
  // ... 其他参数
}
```

**验证规则**:
- `spec_files`: 必需，数组类型，最小长度 1
- 每个数组元素必须符合 SpecFile 结构

#### update_task 工具

**参数结构**:
```typescript
interface UpdateTaskParams {
  id: string;
  spec_files?: SpecFile[];  // 可选，用于更新规范文档
  // ... 其他可选参数
}
```

**验证规则**:
- `spec_files`: 可选，数组类型，无长度限制
- 如果提供，每个数组元素必须符合 SpecFile 结构

#### add_subtask 工具

**参数结构**:
```typescript
interface AddSubtaskParams {
  id: string;  // 父任务 ID
  title?: string;
  description?: string;
  details?: string;
  spec_files?: SpecFile[];  // 可选，新增参数
  // ... 其他参数
}
```

**验证规则**:
- `spec_files`: 可选，数组类型，无长度限制
- 如果提供，每个数组元素必须符合 SpecFile 结构

#### update_subtask 工具

**参数结构**:
```typescript
interface UpdateSubtaskParams {
  id: string;  // 子任务 ID (格式: "parentId.subtaskId")
  spec_files?: SpecFile[];  // 可选，用于更新规范文档
  // ... 其他可选参数
}
```

**验证规则**:
- `spec_files`: 可选，数组类型，无长度限制
- 如果提供，每个数组元素必须符合 SpecFile 结构

## 数据验证规则

### 字段级验证

#### type 字段
- **类型**: 字符串
- **必需**: 是
- **枚举约束**: 必须是预定义的枚举值
- **错误消息**: "文档类型必须是以下值之一: plan, spec, requirement, design, test, other"

#### title 字段
- **类型**: 字符串
- **必需**: 是
- **长度约束**: 1-200 字符
- **格式约束**: 不能只包含空白字符
- **错误消息**: "文档标题不能为空"

#### file 字段
- **类型**: 字符串
- **必需**: 是
- **格式约束**: 有效的相对文件路径
- **推荐格式**: 使用正斜杠分隔符，支持子目录
- **错误消息**: "文件路径不能为空"

### 数组级验证

#### 主任务 spec_files
- **必需性**: 必需
- **最小长度**: 1
- **最大长度**: 无限制（但推荐不超过 10 个文档）
- **错误消息**: "至少需要关联一个规范文档"

#### 子任务 spec_files
- **必需性**: 可选
- **最小长度**: 0
- **最大长度**: 无限制
- **默认值**: 空数组

## 数据流

### 输入处理流程

```
MCP 客户端请求
    ↓
Zod 参数验证 (JSON Schema)
    ↓
Direct 函数处理 (对象数组传递)
    ↓
核心任务管理逻辑 (对象数组存储)
    ↓
JSON 文件持久化
```

### 输出格式

所有 API 响应中的 spec_files 字段都使用相同的对象数组格式：

```json
{
  "spec_files": [
    {
      "type": "spec",
      "title": "用户认证 API 规格",
      "file": "docs/auth-api-spec.yaml"
    },
    {
      "type": "plan",
      "title": "认证模块实施计划",
      "file": "docs/auth-implementation-plan.md"
    }
  ]
}
```

## 兼容性考虑

### 与现有数据格式的兼容

- **存储格式**: 完全兼容现有的 JSON 文件格式
- **读取操作**: 现有的任务查询接口无需修改
- **写入操作**: MCP 接口升级为对象数组格式

### 版本控制

- **API 版本**: 不引入新版本，直接升级现有工具
- **数据迁移**: 无需迁移，现有的 spec_files 数据保持不变
- **客户端影响**: MCP 客户端需要更新调用方式

## 错误处理

### 验证错误分类

1. **参数格式错误**: JSON 解析失败
2. **字段缺失错误**: 必需字段不存在
3. **类型不匹配错误**: 字段类型不正确
4. **枚举值错误**: type 字段值不在允许列表中
5. **长度约束错误**: 数组长度不符合要求

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": {
      "field": "spec_files",
      "issue": "缺少必要字段 'title'",
      "suggestion": "请提供文档标题，例如: 'API 技术规格'"
    }
  }
}
```

## 测试数据

### 有效数据示例

```json
[
  {
    "type": "spec",
    "title": "用户管理 API 规格",
    "file": "docs/user-api-spec.yaml"
  },
  {
    "type": "plan",
    "title": "用户模块实施计划",
    "file": "docs/user-implementation-plan.md"
  },
  {
    "type": "test",
    "title": "用户认证测试用例",
    "file": "tests/user-auth-test-cases.md"
  }
]
```

### 边界情况测试数据

1. **最小有效数组**: 单个文档对象
2. **最大推荐数组**: 5-10 个文档对象
3. **特殊字符标题**: 包含中文、特殊符号的标题
4. **深层路径**: 多级目录的文件路径
5. **不同文档类型**: 所有枚举值的组合使用
