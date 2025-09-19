# 🤝 贡献指南 | Contributing Guide

感谢您对 Speco Tasker 的兴趣！我们欢迎所有形式的贡献，无论是代码、文档、测试，还是功能建议。

Thank you for your interest in Speco Tasker! We welcome all forms of contributions, whether it's code, documentation, tests, or feature suggestions.

## 📋 目录 | Table of Contents

- [🚀 快速开始 | Quick Start](#快速开始--quick-start)
- [🐛 报告问题 | Reporting Issues](#报告问题--reporting-issues)
- [💡 功能建议 | Feature Suggestions](#功能建议--feature-suggestions)
- [🔧 开发环境设置 | Development Environment Setup](#开发环境设置--development-environment-setup)
- [📝 代码规范 | Code Standards](#代码规范--code-standards)
- [🧪 测试 | Testing](#测试--testing)
- [📄 文档 | Documentation](#文档--documentation)
- [🔄 提交规范 | Commit Standards](#提交规范--commit-standards)
- [📦 发布流程 | Release Process](#发布流程--release-process)

## 🚀 快速开始 | Quick Start

### 环境要求 | Requirements

- **Node.js**: `>= 20.0.0`
- **npm**: `>= 8.0.0`
- **Git**: `>= 2.30.0`

### 开发设置 | Development Setup

```bash
# 1. 克隆项目 | Clone the repository
git clone https://github.com/your-org/speco-tasker.git
cd speco-tasker

# 2. 安装依赖 | Install dependencies
npm ci

# 3. 验证安装 | Verify installation
npm run quality-check

# 4. 运行测试 | Run tests
npm test

# 5. 启动开发模式 | Start development mode
npm run test:watch
```

## 🐛 报告问题 | Reporting Issues

### 问题模板 | Issue Template

创建问题时，请使用以下模板：

When creating an issue, please use the following template:

```markdown
## 问题描述 | Description

[清晰简洁地描述问题 | Clear and concise description of the issue]

## 复现步骤 | Steps to Reproduce

1. [第一步 | Step 1]
2. [第二步 | Step 2]
3. [第三步 | Step 3]

## 预期行为 | Expected Behavior

[描述期望的结果 | Describe the expected result]

## 实际行为 | Actual Behavior

[描述实际的结果 | Describe the actual result]

## 环境信息 | Environment

- **OS**: [操作系统 | Operating System]
- **Node.js**: [版本 | Version]
- **npm**: [版本 | Version]
- **Speco Tasker**: [版本 | Version]

## 附加信息 | Additional Information

[任何其他相关信息 | Any other relevant information]
```

### 问题分类 | Issue Categories

- 🐛 **Bug**: 代码错误或异常行为
- ✨ **Feature**: 新功能请求
- 📚 **Documentation**: 文档相关问题
- 🔧 **Enhancement**: 功能改进建议
- ❓ **Question**: 问题和帮助请求

## 💡 功能建议 | Feature Suggestions

### 建议模板 | Suggestion Template

```markdown
## 功能概述 | Feature Overview

[简要描述建议的功能 | Brief description of the suggested feature]

## 背景 | Background

[为什么需要这个功能？ | Why is this feature needed?]

## 实现方案 | Implementation Plan

[如何实现这个功能 | How to implement this feature]

## 影响范围 | Impact Scope

[这个功能会影响哪些部分？ | What parts will this feature affect?]

## 替代方案 | Alternative Solutions

[是否有其他解决方案？ | Are there alternative solutions?]
```

## 🔧 开发环境设置 | Development Environment Setup

### 推荐工具 | Recommended Tools

- **编辑器**: [Cursor](https://cursor.sh/), [VS Code](https://code.visualstudio.com/)
- **Node.js 版本管理**: [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm)
- **Git GUI**: [GitKraken](https://www.gitkraken.com/) 或 [Sourcetree](https://www.sourcetreeapp.com/)

### 开发工作流 | Development Workflow

```bash
# 1. 创建功能分支 | Create feature branch
git checkout -b feature/your-feature-name

# 2. 编写代码和测试 | Write code and tests
# 遵循测试驱动开发 (TDD) | Follow Test-Driven Development (TDD)

# 3. 代码质量检查 | Code quality checks
npm run quality-check

# 4. 运行测试 | Run tests
npm run test:ci

# 5. 提交更改 | Commit changes
git add .
npm run changeset # 如果需要版本更新 | If version update is needed
git commit -m "feat: add your feature description"

# 6. 推送分支 | Push branch
git push origin feature/your-feature-name

# 7. 创建 Pull Request | Create Pull Request
```

## 📝 代码规范 | Code Standards

### JavaScript/TypeScript 规范 | JavaScript/TypeScript Standards

```javascript
// ✅ 推荐写法 | Recommended
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export class TaskManager {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async loadTasks(filePath) {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load tasks: ${error.message}`);
    }
  }
}

// ❌ 避免写法 | Avoid
const fs = require('fs');
const path = require('path');

function loadTasks(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}
```

### 关键原则 | Key Principles

- **ESM First**: 优先使用 ES Modules
- **Async/Await**: 优先使用 async/await 而非 Promise 构造函数
- **Error Handling**: 始终处理错误，不要静默失败
- **Type Safety**: 使用 JSDoc 类型注释
- **Functional Programming**: 优先使用纯函数和不可变数据

## 🧪 测试 | Testing

### 测试策略 | Testing Strategy

```bash
# 运行所有测试 | Run all tests
npm test

# 运行单元测试 | Run unit tests
npm run test:unit

# 运行集成测试 | Run integration tests
npm run test:integration

# 运行测试覆盖率 | Run test coverage
npm run test:coverage

# 监听模式测试 | Watch mode testing
npm run test:watch
```

### 测试编写指南 | Test Writing Guidelines

```javascript
import { describe, test, expect } from '@jest/globals';

describe('TaskManager', () => {
  test('should load tasks from file', async () => {
    // Arrange
    const taskManager = new TaskManager();
    const testFile = '/path/to/test/tasks.json';

    // Act
    const tasks = await taskManager.loadTasks(testFile);

    // Assert
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toHaveProperty('id');
    expect(tasks[0]).toHaveProperty('title');
  });

  test('should throw error for invalid file', async () => {
    // Arrange
    const taskManager = new TaskManager();
    const invalidFile = '/nonexistent/file.json';

    // Act & Assert
    await expect(taskManager.loadTasks(invalidFile))
      .rejects
      .toThrow('Failed to load tasks');
  });
});
```

### 测试覆盖率目标 | Coverage Targets

- **语句覆盖率**: `>= 80%`
- **分支覆盖率**: `>= 70%`
- **函数覆盖率**: `>= 80%`
- **行覆盖率**: `>= 80%`

## 📄 文档 | Documentation

### 文档结构 | Documentation Structure

```
docs/
├── installation-guide.md    # 安装指南
├── configuration-zh.md      # 配置说明
├── command-reference-zh.md  # 命令参考
├── tutorial.md             # 使用教程
├── changelog.md            # 更新日志
└── README.md              # 主文档
```

### 文档编写规范 | Documentation Standards

- 使用中文和英文双语
- 保持内容更新和准确
- 使用 markdown 格式
- 包含实际使用示例

## 🔄 提交规范 | Commit Standards

### 提交消息格式 | Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型 | Commit Types

- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建工具或辅助工具的变动

### 示例 | Examples

```bash
# 新功能 | New feature
git commit -m "feat: add task priority system"

# 修复bug | Bug fix
git commit -m "fix: resolve memory leak in task loader"

# 文档更新 | Documentation
git commit -m "docs: update installation guide"

# 测试 | Testing
git commit -m "test: add integration tests for CLI commands"
```

## 📦 发布流程 | Release Process

### 版本号规范 | Version Number Standards

遵循 [Semantic Versioning](https://semver.org/)：

- **MAJOR.MINOR.PATCH** (主版本.次版本.补丁版本)
- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 新功能，向后兼容
- **PATCH**: 修复，向后兼容

### 发布步骤 | Release Steps

1. **创建发布分支** | Create release branch
   ```bash
   git checkout -b release/v1.2.0
   ```

2. **更新版本号** | Update version number
   ```bash
   npm version patch  # patch | minor | major
   ```

3. **生成变更日志** | Generate changelog
   ```bash
   npm run changeset
   ```

4. **运行完整测试** | Run full test suite
   ```bash
   npm run ci:full
   ```

5. **创建发布标签** | Create release tag
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

6. **发布到 npm** | Publish to npm
   ```bash
   npm publish
   ```

7. **合并到主分支** | Merge to main branch
   ```bash
   git checkout main
   git merge release/v1.2.0
   ```

---

## 🎯 行为准则 | Code of Conduct

### 我们的承诺 | Our Pledge

我们致力于为所有人提供一个无骚扰的社区环境。我们致力于使这个项目成为一个安全、开放和友好的地方。

We are committed to providing a harassment-free community environment for everyone. We are committed to making this project a safe, open and friendly place.

### 我们的标准 | Our Standards

**鼓励的行为 | Encouraged behaviors:**
- 使用友好的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有益的事情

**不可接受的行为 | Unacceptable behaviors:**
- 骚扰或侮辱性语言
- 发布虚假信息
- 侵犯隐私
- 其他不适当的行为

### 责任与后果 | Responsibilities and Consequences

社区维护者有责任澄清和执行可接受行为的标准，并对任何不可接受行为采取适当和公平的纠正措施。

Community maintainers are responsible for clarifying and enforcing standards of acceptable behavior and will take appropriate and fair corrective action in response to any instances of unacceptable behavior.

## 📞 获取帮助 | Getting Help

如果您需要帮助，请：

If you need help, please:

- 查看 [文档](docs/) | Check the [documentation](docs/)
- 查看已有的 [问题](https://github.com/your-org/speco-tasker/issues) | Check existing [issues](https://github.com/your-org/speco-tasker/issues)
- 创建新问题 | Create a new issue
- 加入我们的讨论 | Join our discussion

---

感谢您的贡献！🎉

Thank you for your contribution! 🎉
