---
'speco-tasker': patch
---

完成第二阶段TDD测试实现

- 编写完整的合同测试套件
  - `tests/contract/cleanup_api.test.js`: 清理API的5个端点测试 (GET/DELETE ai-content, GET/PATCH brand-info, POST validate)
  - `tests/contract/path_config_api.test.js`: 路径配置API的3个端点测试 (GET/PUT/POST paths)
  - 验证API合约行为和错误处理
- 编写完整的集成测试套件
  - `tests/integration/test_brand_rebrand.js`: 品牌重塑流程集成测试
  - `tests/integration/test_path_config.js`: 路径配置系统集成测试
  - `tests/integration/test_ai_cleanup.js`: AI内容清理集成测试
  - `tests/integration/test_command_rename.js`: 命令重命名集成测试
- 更新Jest配置支持分层测试结构
- 添加test:contract npm脚本支持合同测试运行
- 遵循TDD原则：先写测试，后实现功能
- 测试覆盖完整的用户故事和业务流程

Note: 测试当前会失败，因为控制器和服务层尚未实现。这是预期的TDD行为，将在第三阶段实现代码让测试通过。
