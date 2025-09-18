# Speco-Tasker 代码质量配置

本项目采用多层次代码质量保障策略，结合Biome、ESLint、Prettier和Jest测试框架。

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
