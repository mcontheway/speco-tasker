# 快速开始：MCP 接口 spec_files 字段升级

**功能分支**: 003-feature-mcp-spec-files-description
**日期**: 2025年09月23日

## 概述

本指南帮助您快速上手新的 MCP 接口 spec_files 参数格式，从简单的字符串格式升级为完整的 JSON 对象数组格式。

## 主要变更

### 之前（字符串格式）
```json
{
  "spec_files": "docs/api-spec.md,docs/db-schema.yaml"
}
```

### 现在（对象数组格式）
```json
{
  "spec_files": [
    {
      "type": "spec",
      "title": "API 技术规格",
      "file": "docs/api-spec.md"
    },
    {
      "type": "design",
      "title": "数据库设计文档",
      "file": "docs/db-schema.yaml"
    }
  ]
}
```

## 快速示例

### 1. 创建任务

```json
{
  "title": "用户认证功能",
  "description": "实现完整的用户登录和注册功能",
  "details": "包含密码加密、JWT token 生成、会话管理",
  "testStrategy": "单元测试 + 集成测试 + E2E 测试",
  "spec_files": [
    {
      "type": "spec",
      "title": "认证 API 规格",
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

### 2. 更新任务规范文档

```json
{
  "id": "5",
  "spec_files": [
    {
      "type": "spec",
      "title": "用户认证 API 规格",
      "file": "docs/auth-api-spec.yaml"
    },
    {
      "type": "test",
      "title": "认证测试用例",
      "file": "tests/auth-test-cases.md"
    }
  ]
}
```

### 3. 添加子任务（包含规范文档）

```json
{
  "id": "5",
  "title": "JWT Token 实现",
  "description": "实现 JWT token 的生成和验证逻辑",
  "details": "使用 jsonwebtoken 库实现 token 管理",
  "spec_files": [
    {
      "type": "spec",
      "title": "JWT 安全规格",
      "file": "docs/jwt-security-spec.md"
    }
  ]
}
```

## 文档类型选择指南

| 类型 | 适用场景 | 示例 |
|------|----------|------|
| `plan` | 实施计划、路线图 | 功能实施计划、里程碑规划 |
| `spec` | 技术规格、API 文档 | API 规格、数据模型定义 |
| `requirement` | 需求文档、用户故事 | 业务需求、验收标准 |
| `design` | 设计文档、架构图 | 系统架构图、UI 设计稿 |
| `test` | 测试文档、测试用例 | 测试计划、测试用例文档 |
| `other` | 其他类型的文档 | README、部署文档等 |

## 错误处理

### 常见错误及解决方案

#### 1. 缺少必要字段
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "spec_files[0] 缺少必要字段 'title'",
    "details": {
      "field": "spec_files",
      "suggestion": "请为所有文档提供标题，例如: 'API 技术规格'"
    }
  }
}
```
**解决方案**: 为每个文档对象添加 `title` 字段

#### 2. 无效的文档类型
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "文档类型必须是以下值之一: plan, spec, requirement, design, test, other",
    "details": {
      "field": "spec_files",
      "issue": "无效的枚举值 'document'"
    }
  }
}
```
**解决方案**: 使用预定义的枚举值替换无效的类型

#### 3. 主任务缺少规范文档
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "至少需要关联一个规范文档"
  }
}
```
**解决方案**: 为 `spec_files` 数组添加至少一个文档对象

## 迁移指南

### 从旧格式迁移

如果您之前使用字符串格式，现在需要转换为对象数组格式：

```javascript
// 旧格式
"spec_files": "docs/api.md,docs/db.yaml"

// 新格式
"spec_files": [
  {"type": "spec", "title": "API 文档", "file": "docs/api.md"},
  {"type": "design", "title": "数据库设计", "file": "docs/db.yaml"}
]
```

### 自动化迁移脚本

```bash
# 将逗号分隔的字符串转换为对象数组
node -e "
const oldFormat = 'docs/api.md,docs/db.yaml';
const files = oldFormat.split(',').map(f => f.trim());
const newFormat = files.map(file => ({
  type: 'spec',
  title: file.split('/').pop() || '文档',
  file: file
}));
console.log(JSON.stringify(newFormat, null, 2));
"
```

## 测试验证

### 验证参数格式

使用以下测试用例验证您的参数格式：

```json
// ✅ 有效的完整格式
{
  "spec_files": [
    {
      "type": "spec",
      "title": "用户 API 规格",
      "file": "docs/user-api.yaml"
    }
  ]
}

// ❌ 缺少 title 字段
{
  "spec_files": [
    {
      "type": "spec",
      "file": "docs/user-api.yaml"
    }
  ]
}

// ❌ 无效的类型值
{
  "spec_files": [
    {
      "type": "invalid_type",
      "title": "用户 API 规格",
      "file": "docs/user-api.yaml"
    }
  ]
}
```

## 最佳实践

1. **始终提供有意义的标题**: 使用描述性的标题而非文件名
2. **选择正确的文档类型**: 根据文档内容选择最合适的类型
3. **保持文件路径规范**: 使用相对路径，推荐使用正斜杠
4. **限制文档数量**: 单个任务建议不超过 5-10 个文档
5. **验证参数格式**: 在发送请求前验证 JSON 格式的正确性

## 故障排除

### 参数验证失败
- 检查所有必需字段是否存在
- 验证 `type` 字段是有效的枚举值
- 确保 `title` 和 `file` 是非空字符串

### API 调用失败
- 确认使用正确的工具名称
- 检查参数格式是否符合 OpenAPI 规范
- 查看错误响应中的详细原因

### 数据不一致
- 确认所有相关工具都使用相同的参数格式
- 检查 Direct 函数是否正确处理对象数组
- 验证核心逻辑是否支持新的数据结构

## 相关资源

- [API 合约规范](./contracts/mcp-tools-api.yaml)
- [数据模型定义](./data-model.md)
- [功能规范](./spec.md)
- [研究报告](./research.md)
