---
"speco-tasker": patch
---

添加 pre-commit hooks 和自动化质量检查

- 添加 Husky 用于管理 Git hooks
- 配置 lint-staged 用于提交前代码格式化和检查
- 添加 commitlint 用于验证提交信息格式
- 设置 pre-commit hook：运行代码质量检查和单元测试
- 设置 commit-msg hook：验证提交信息格式
- 设置 post-commit hook：提醒未处理的 changeset
- 设置 pre-push hook：运行完整测试套件并检查 changeset
