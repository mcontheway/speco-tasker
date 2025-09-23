---
'speco-tasker': patch
---

完成第一阶段项目设置和基础架构

- 创建 .speco/ 主配置目录和完整的配置文件系统
  - config.json: 项目基本配置和路径映射
  - paths.json: 文件路径映射和清理规则
  - brand.json: 品牌重塑配置和状态跟踪
  - cleanup-rules.json: AI内容清理和文件重命名规则
- 设置Jest TDD测试框架，支持分层测试(contract/integration/unit/e2e)
- 配置Biome、ESLint、Prettier代码质量工具链
- 创建完整的项目目录结构和测试环境setup
- 添加代码质量检查和格式化脚本到package.json

BREAKING CHANGE: 项目配置系统迁移到.speco/目录，旧的.taskmaster/配置将被弃用
