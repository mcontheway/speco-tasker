# Speco-Tasker 代码质量指南

本项目采用多层次代码质量保障策略，结合Biome、ESLint、Prettier和Jest测试框架。本指南详细阐述了项目遵循的代码质量标准和实践，作为团队内部的指导性文档。

## 概述

本文档不仅涵盖工具配置，还详细说明了代码质量标准、编程规范、测试策略、错误处理和开发流程，确保代码的可维护性、可读性和可靠性。

## 1. 编程语言与规范

### JavaScript/Node.js 标准

#### 模块系统
- **ES Modules优先**: 优先使用ES模块 (`import`/`export`) 而非CommonJS
- **文件扩展名**: 使用 `.js` 作为ES模块文件扩展名
- **严格模式**: 所有代码默认运行在严格模式下

#### 代码风格
- **缩进**: 使用2个空格缩进（配置文件除外）
- **分号**: 强制使用分号
- **引号**: 优先使用双引号，但导入语句使用单引号
- **行长度**: 单行不超过120字符

#### 命名约定
```javascript
// ✅ 好的命名示例
class PathConfigService {
  async getConfiguration() {
    // ...
  }
}

const MAX_RETRY_ATTEMPTS = 3;
const pathConfig = new PathConfig();

// ❌ 不好的命名示例
class pathconfigservice {
  async getconfig() {
    // ...
  }
}

const maxretryattempts = 3;
const pc = new PathConfig();
```

### TypeScript 支持

项目虽以JavaScript为主，但需为未来TypeScript迁移做准备：
- 使用JSDoc注释标注类型信息
- 保持类型定义的清晰和一致性

## 2. 项目结构与组织

### 目录结构规范

```
specs/002-feature-description-ai-taskmaster-speco/
├── contracts/          # OpenAPI/Swagger合约文件
├── data-model.md       # 数据模型定义
├── plan.md            # 技术实现计划
├── quickstart.md      # 快速开始指南
├── research.md        # 调研和分析报告
└── tasks.md           # 任务分解清单

src/
├── constants/         # 常量定义
├── controllers/       # API控制器
├── models/           # 数据模型
├── services/         # 业务逻辑服务
├── ui/              # 用户界面组件
└── utils/           # 工具函数

tests/
├── contract/         # 合同测试（API行为契约）
├── integration/      # 集成测试（端到端场景）
├── unit/            # 单元测试（独立组件）
└── e2e/             # 端到端测试（完整流程）
```

### 文件组织原则

#### 单职责原则
- **一个文件一个职责**: 每个文件只负责一个明确的功能模块
- **文件大小限制**: 单个文件不超过500行代码
- **函数长度限制**: 单个函数不超过50行代码

#### 导入导出规范
```javascript
// ✅ 推荐的导入顺序
import fs from 'fs';
import path from 'path';

import { format } from '../utils/format.js';
import { PathConfig } from '../models/PathConfig.js';

// 本地常量和工具函数
const DEFAULT_TIMEOUT = 5000;

// 主要导出
export class PathConfigService {
  // ...
}
```

## 3. 测试策略与标准

### TDD（测试驱动开发）流程

#### 测试优先原则
1. **先写测试**: 在实现任何功能前编写对应的测试
2. **测试失败**: 确保测试能够正确失败
3. **实现功能**: 编写最少的代码使测试通过
4. **重构优化**: 在测试保护下重构代码
5. **验证完整**: 确保所有测试通过

#### 测试类型分层

##### 合同测试（Contract Tests）
- **位置**: `tests/contract/`
- **职责**: 验证API行为契约的一致性
- **标准**: 每个API端点必须有对应的合同测试
- **示例**: 验证OpenAPI规范与实际实现的一致性

##### 单元测试（Unit Tests）
- **位置**: `tests/unit/`
- **职责**: 测试独立组件和函数
- **标准**: 覆盖率≥80%，关键业务逻辑≥90%
- **原则**: 隔离依赖，使用mock/stub

##### 集成测试（Integration Tests）
- **位置**: `tests/integration/`
- **职责**: 测试组件间的协作
- **标准**: 验证端到端用户场景
- **策略**: 逐步从模拟调用转向真实CLI命令

##### E2E测试（End-to-End Tests）
- **位置**: `tests/e2e/`
- **职责**: 测试完整用户工作流
- **标准**: 覆盖主要用户场景
- **执行**: 顺序执行，确保稳定性

### 测试覆盖率标准

```javascript
// jest.config.cjs 中的覆盖率阈值
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  // 关键业务逻辑更高标准
  "./src/models/": {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  "./src/services/": {
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85,
  },
  "./src/controllers/": {
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

### 测试代码质量标准

#### 测试文件结构
```javascript
// SCOPE: 测试<具体职责>
// 每个测试文件顶部必须有明确的职责说明

describe("FeatureName", () => {
  beforeEach(() => {
    // 合理的测试前置设置
    jest.clearAllMocks();
  });

  describe("functionName", () => {
    it("should handle normal case", () => {
      // 清晰的测试描述
      // 合理的断言数量（≤5个）
    });

    it("should throw error for invalid input", async () => {
      // 错误场景测试
      await expect(functionName(invalidInput))
        .rejects.toThrow("Specific error message");
    });
  });
});
```

#### 测试规范限制
- **单测断言数**: 单个测试用例≤15行代码
- **describe块长度**: ≤100行代码
- **测试文件名**: `<模块>.<层级>.test.<ext>`
- **Mock管理**: 测试结束后自动清理

## 4. 错误处理与日志

### 错误处理模式

#### 统一错误格式
```javascript
// 错误响应标准化
{
  code: "ERROR_CODE",
  message: "用户友好的错误信息",
  details: {
    // 技术细节，仅开发环境显示
    reason: "具体错误原因",
    context: "错误上下文信息"
  }
}
```

#### 异常处理层次
- **控制器层**: 捕获业务异常，返回标准错误响应
- **服务层**: 抛出业务异常，包含详细上下文
- **工具层**: 抛出技术异常，不包含业务逻辑

### 日志规范

#### 日志级别
- **ERROR**: 系统错误，需要立即处理
- **WARN**: 警告信息，可能影响功能
- **INFO**: 重要业务操作记录
- **DEBUG**: 开发调试信息

#### 结构化日志
```javascript
logger.info("Operation completed", {
  operation: "cleanup_ai_content",
  duration: 1500,
  filesProcessed: 5,
  userId: "user123"
});
```

## 5. 性能与安全

### 性能标准

#### 响应时间要求
- **API响应**: <100ms（简单查询），<500ms（复杂操作）
- **文件处理**: <2秒（单文件），<30秒（批量操作）
- **CLI命令**: <5秒（常规命令）

#### 资源使用限制
- **内存使用**: 单操作<100MB
- **CPU使用**: 避免长时间CPU密集操作
- **磁盘I/O**: 合理使用缓存，减少重复I/O

### 安全实践

#### 文件系统安全
- 权限验证：所有文件操作前检查权限
- 路径验证：防止路径遍历攻击
- 备份策略：重要操作前创建备份

#### 数据验证
- 输入验证：所有外部输入进行严格验证
- 类型检查：使用schema验证数据结构
- 边界检查：防止缓冲区溢出

## 6. 文档与注释

### 代码注释规范

#### JSDoc注释
```javascript
/**
 * 获取AI内容清单
 * @param {Object} options - 查询选项
 * @param {boolean} options.includeMetadata - 是否包含元数据
 * @returns {Promise<AIContentList>} AI内容清单
 * @throws {Error} 当扫描失败时抛出错误
 */
async function getAIContentList(options = {}) {
  // 实现细节
}
```

#### 复杂逻辑注释
```javascript
// 路径解析算法：
// 1. 标准化输入路径
// 2. 解析相对路径为绝对路径
// 3. 验证路径存在且可访问
// 4. 返回标准化结果
function resolvePath(inputPath) {
  // 实现细节
}
```

### 文档维护

#### README更新
- 功能变更时同步更新README
- 保持示例代码的时效性
- 文档与代码版本同步

#### API文档
- OpenAPI规范与实现同步
- 合同测试验证文档准确性

## 7. 开发流程与质量保证

### 分支管理

#### Git Flow策略
```
main (稳定版)
├── develop (集成测试版)
│   ├── feature/* (功能开发分支)
│   ├── release/* (发布准备分支)
│   └── hotfix/* (紧急修复分支)
```

#### 提交规范
```bash
# 格式：<类型>(<范围>): <描述>
feat(task-001): 添加用户认证功能
fix(auth): 修复登录超时问题
test(auth): 完善认证单元测试
docs(readme): 更新安装指南
```

### 代码审查标准

#### 审查清单
- [ ] 代码符合项目规范
- [ ] 测试覆盖率达标
- [ ] 没有明显的安全风险
- [ ] 性能影响评估完成
- [ ] 文档更新同步

#### 审查要点
- **功能正确性**: 测试是否完整覆盖功能
- **代码质量**: 是否符合编码规范
- **性能影响**: 是否存在性能瓶颈
- **安全隐患**: 是否存在安全风险
- **可维护性**: 代码是否易于理解和维护

## 8. 持续改进机制

### 质量指标监控

#### 自动化指标
- 测试覆盖率趋势
- 代码复杂度分析
- 性能基准测试
- 安全漏洞扫描

#### 人工审查
- 定期代码审查
- 重构机会识别
- 技术债务评估

### 改进流程

#### 问题发现
1. 识别代码质量问题
2. 分析根本原因
3. 制定改进方案

#### 方案实施
1. 创建改进任务
2. 实现解决方案
3. 验证改进效果

#### 持续优化
1. 建立反馈循环
2. 定期审查标准
3. 根据项目演进调整规范

---

## 工具概览

### Biome
**位置**: `config/biome.json`
**用途**: 快速的代码检查和格式化
**优势**: 内置格式化和检查，性能优异

### ESLint
**位置**: `.eslintrc.cjs`
**用途**: 高级代码质量检查
**优势**: 丰富的规则集，Node.js专项规则

### Prettier
**位置**: `.prettierrc`, `.prettierignore`
**用途**: 代码格式化
**优势**: 自动化格式化，确保一致性

## 使用命令

### 开发时检查
```bash
# 快速代码质量检查（推荐）
npm run quality-check

# 单独检查
npm run lint          # 代码质量检查
npm run format-check  # 格式检查

# 自动修复
npm run lint:fix      # 自动修复代码问题
npm run format        # 自动格式化代码
```

### 提交前检查
```bash
# 完整代码质量检查（包括单元测试）
npm run code-quality

# CI/CD 环境
npm run quality-check && npm run test:unit
```

## 配置说明

### Biome 配置 (`config/biome.json`)
- **格式化**: Tab缩进，单引号，行宽100字符
- **检查规则**: 推荐规则 + 项目特定规则
- **忽略文件**: 构建产物、日志、测试固件等

### ESLint 配置 (`.eslintrc.cjs`)
- **环境**: Node.js + ES2022 + Jest
- **规则级别**:
  - `error`: 必须修复的严重问题
  - `warn`: 建议修复的代码质量问题
  - `off`: 项目特意关闭的规则

### Prettier 配置 (`.prettierrc`)
- **风格**: 单引号，Tab缩进，尾逗号关闭
- **特殊处理**: JSON、Markdown、YAML文件格式优化

## 规则优先级

1. **Biome**: 基础格式化和通用检查
2. **ESLint**: Node.js特定和高级代码质量规则
3. **Prettier**: 最终格式化确保一致性

## 文件类型覆盖

| 文件类型 | Biome | ESLint | Prettier |
| -------- | ----- | ------ | -------- |
| `.js`    | ✅    | ✅     | ✅       |
| `.cjs`   | ✅    | ✅     | ✅       |
| `.mjs`   | ✅    | ✅     | ✅       |
| `.json`  | ✅    | ❌     | ✅       |
| `.md`    | ❌    | ❌     | ✅       |

## 忽略规则

### 自动忽略
- `node_modules/`
- `coverage/`
- `.speco/logs/`
- `tmp/`

### 测试文件特殊处理
- 允许`console.log`（调试需要）
- 放宽行数限制
- 允许Jest全局变量

## 性能优化

- **Biome**: 快速的Rust实现
- **ESLint**: 缓存机制，增量检查
- **Prettier**: 仅在文件变更时格式化

## CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Code Quality
  run: npm run quality-check

- name: Test
  run: npm run test:unit

- name: Format Check
  run: npm run format-check
```

## 开发工作流

1. **编写代码**
2. **运行检查**: `npm run quality-check`
3. **修复问题**: `npm run lint:fix && npm run format`
4. **运行测试**: `npm run test:unit`
5. **提交代码**

## 常见问题

### Biome 和 Prettier 冲突
**解决方案**: Prettier 具有更高优先级，确保最终格式化一致性

### ESLint 规则与 Biome 重叠
**解决方案**: Biome 处理基础规则，ESLint 处理高级规则

### 大文件处理
**解决方案**: 测试文件和配置文件有放宽的行数限制

## 自定义配置

如需修改配置，请遵循以下原则：

1. **保持一致性**: 规则应在团队内达成共识
2. **性能优先**: 避免影响开发效率的规则
3. **实用至上**: 规则应解决实际问题而非理论完美
4. **渐进改进**: 新规则应逐步引入，避免一次性变更过多

---

*最后更新：2025年09月18日*
*维护者：Speco Team*
