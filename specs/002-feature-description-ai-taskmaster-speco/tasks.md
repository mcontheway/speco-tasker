# 任务：品牌重塑与AI功能移除

**输入**: 从 `/Volumes/Data_SSD/Coding/startkits/Speco-Tasker/specs/002-feature-description-ai-taskmaster-speco/` 设计文档
**前提条件**: plan.md（技术栈：Node.js/JavaScript）、data-model.md（3个实体）、contracts/（2个API）、quickstart.md（测试场景）
**版本约束**: 开发期间不可超越 1.2.0，完成时升级至 1.2.0

## 执行流程（优化版）

```
1. 从功能目录加载 plan.md
   → 已成功加载，技术栈：Node.js/JavaScript，项目类型：CLI工具
2. 加载设计文档：
   → data-model.md：3个实体（PathConfig、BrandInfo、CleanupRule）
   → contracts/：2个API合约文件（cleanup-api.yaml、path-config-api.yaml）
   → quickstart.md：用户故事和测试场景
3. 按TDD原则生成任务：
   → 先写测试（合同测试、集成测试）
   → 再实现功能（实体模型、服务、端点）
   → 最后完善（单元测试、性能、文档）
4. 应用任务规则：
   → 不同文件 = 标记 [P] 表示并行
   → 相同文件 = 顺序执行（无 [P]）
   → 测试优先于实现（TDD）
5. 按依赖关系排序任务（设置→测试→核心→集成→完善）
6. 生成依赖关系图
7. 创建并行执行示例
8. 验证任务完整性
9. 返回：任务生成完成，准备执行
```

## 格式: `[ID] [P?] 描述`

*   **[P]**: 可以并行运行（不同文件，无依赖）
*   在描述中包含确切的文件路径
*   **⚠️**: 高风险任务，需要特别注意

## 路径规范

*   **CLI工具**: `src/`（主代码）、`scripts/modules/`（业务逻辑）、`bin/`（CLI入口）
*   **测试**: `tests/`（Jest测试框架）
*   **配置**: `.speco/`（主配置目录）
*   **文档**: `docs/`（项目文档）

## 阶段 1：设置

- [x] T001 创建项目目录结构和配置文件
- [x] T002 设置Jest测试框架和测试脚本
- [x] T003 配置代码质量检查工具（ESLint、Prettier）
- [x] T004 安装项目依赖项

## 阶段 2：先写测试（TDD） ⚠️ 必须在 3 之前完成

**关键：这些测试必须先编写并通过，然后才能进行任何实现**

### 合同测试 [P] - 每个API端点一个测试

- [x] T005 [P] 在 `tests/contract/test_cleanup_api.js` 中编写合同测试 GET /ai-content
- [x] T006 [P] 在 `tests/contract/test_cleanup_api.js` 中编写合同测试 DELETE /ai-content
- [x] T007 [P] 在 `tests/contract/test_cleanup_api.js` 中编写合同测试 GET /brand-info
- [x] T008 [P] 在 `tests/contract/test_cleanup_api.js` 中编写合同测试 PATCH /brand-info
- [x] T009 [P] 在 `tests/contract/test_cleanup_api.js` 中编写合同测试 POST /validate
- [x] T010 [P] 在 `tests/contract/test_path_config_api.js` 中编写合同测试 GET /paths
- [x] T011 [P] 在 `tests/contract/test_path_config_api.js` 中编写合同测试 PUT /paths
- [x] T012 [P] 在 `tests/contract/test_path_config_api.js` 中编写合同测试 POST /paths/validate

### 集成测试 [P] - 基于用户故事

- [x] T013 [P] 在 `tests/integration/test_brand_rebrand.js` 中编写集成测试品牌重塑流程
- [x] T014 [P] 在 `tests/integration/test_path_config.js` 中编写集成测试路径配置系统
- [x] T015 [P] 在 `tests/integration/test_ai_cleanup.js` 中编写集成测试AI内容清理
- [x] T016 [P] 在 `tests/integration/test_command_rename.js` 中编写集成测试命令重命名

## 阶段 3：核心实现（仅测试失败后）

### 实体模型实现 [P] - 每个实体一个模型文件

- [x] T017 [P] 在 `src/models/PathConfig.js` 中实现PathConfig实体和路径解析逻辑
- [x] T018 [P] 在 `src/models/BrandInfo.js` 中实现BrandInfo实体和品牌管理逻辑
- [x] T019 [P] 在 `src/models/CleanupRule.js` 中实现CleanupRule实体和清理规则引擎

### 服务层实现 - 按依赖顺序

- [x] T020 在 `src/services/PathService.js` 中实现路径配置服务（依赖T017）
- [x] T021 在 `src/services/BrandService.js` 中实现品牌信息服务（依赖T018）
- [x] T022 在 `src/services/CleanupService.js` 中实现清理服务（依赖T019）

### API端点实现 - 按合约分组

#### 清理API端点实现
- [x] T023 在 `src/controllers/CleanupController.js` 中实现 GET /ai-content 端点
- [x] T024 在 `src/controllers/CleanupController.js` 中实现 DELETE /ai-content 端点
- [x] T025 在 `src/controllers/CleanupController.js` 中实现 GET /brand-info 端点
- [x] T026 在 `src/controllers/CleanupController.js` 中实现 PATCH /brand-info 端点
- [x] T027 在 `src/controllers/CleanupController.js` 中实现 POST /validate 端点

#### 路径配置API端点实现
- [x] T028 在 `src/controllers/PathConfigController.js` 中实现 GET /paths 端点
- [x] T029 在 `src/controllers/PathConfigController.js` 中实现 PUT /paths 端点
- [x] T030 在 `src/controllers/PathConfigController.js` 中实现 POST /paths/validate 端点

### CLI命令实现 - 品牌重塑相关 ⚠️ 高风险

- [x] T031 ⚠️ 在 `bin/speco-tasker.js` 中实现命令重命名和品牌更新（原子性保障）
- [x] T032 在 `scripts/modules/commands.js` 中更新CLI命令处理逻辑
- [x] T033 在 `scripts/init.js` 中实现新路径配置初始化

## 阶段 4：集成与安全

### 核心服务集成
- [ ] T034 集成PathService、BrandService、CleanupService到系统架构（合并T034-T036）

### 中间件和验证
- [ ] T035 实现路径配置、品牌信息、清理规则的中间件和安全验证（合并T037-T039）

### 日志和监控
- [ ] T036 集成结构化日志、审计日志和监控报告（合并T040-T042）

### 配置管理功能（新增）
- [ ] T037 在 `scripts/modules/config-manager.js` 中实现配置参数查看和修改
- [ ] T038 在 `scripts/modules/commands.js` 中添加配置管理CLI命令
- [ ] T039 在 `mcp-server/src/tools/config.js` 中实现MCP配置管理工具

## 阶段 5：精细调整与优化

### 单元测试完善 [P]
- [ ] T040 [P] 在 `tests/unit/test_PathConfig.js` 中完善路径配置单元测试
- [ ] T041 [P] 在 `tests/unit/test_BrandInfo.js` 中完善品牌信息单元测试
- [ ] T042 [P] 在 `tests/unit/test_CleanupRule.js` 中完善清理规则单元测试

### 性能和安全优化
- [ ] T043 优化路径解析性能（<100ms响应时间）和清理操作性能
- [ ] T044 实现配置缓存机制和内存泄漏防护
- [ ] T045 添加权限验证和文件系统安全检查

### 文档更新 [P]
- [ ] T046 [P] 更新 `docs/tutorial.md`、`docs/path-config-guide.md`、`docs/cleanup-guide.md`（合并T049-T051）
- [ ] T047 更新 `README.md` 的品牌信息和功能介绍
- [ ] T047.1 恢复严格的 pre-commit 检测（在所有功能实现和单元测试完善后，确保所有测试都严格通过）

### 最终验证
- [ ] T048 运行完整测试套件确保所有功能正常
- [ ] T049 验证版本号更新到1.2.0
- [ ] T050 执行最终的端到端测试验证

## 依赖项

*   **测试依赖（T005-T016）**：必须在任何实现（T017-T045）之前完成
*   **实体模型（T017-T019）**：阻塞其对应的服务实现
*   **服务层（T020-T022）**：阻塞API端点实现
*   **API端点（T023-T030）**：阻塞CLI命令实现
*   **CLI命令（T031-T033）**：阻塞集成测试
*   **核心集成（T034-T036）**：阻塞配置管理功能
*   **配置管理（T037-T039）**：阻塞单元测试完善
*   **完善（T040-T050）**：阻塞最终发布
*   **⚠️ 高风险任务（T031）**：需要特别的原子性保障

## 并行执行示例

```
# 同时启动合同测试 [P] - 8个任务可并行：
任务: "在 tests/contract/test_cleanup_api.js 中编写合同测试 GET /ai-content"
任务: "在 tests/contract/test_cleanup_api.js 中编写合同测试 DELETE /ai-content"
任务: "在 tests/contract/test_path_config_api.js 中编写合同测试 GET /paths"
任务: "在 tests/contract/test_path_config_api.js 中编写合同测试 PUT /paths"
# ... 其他4个合同测试可同时执行

# 同时启动集成测试 [P] - 4个任务可并行：
任务: "在 tests/integration/test_brand_rebrand.js 中编写集成测试品牌重塑流程"
任务: "在 tests/integration/test_path_config.js 中编写集成测试路径配置系统"
任务: "在 tests/integration/test_ai_cleanup.js 中编写集成测试AI内容清理"
任务: "在 tests/integration/test_command_rename.js 中编写集成测试命令重命名"

# 同时启动单元测试完善 [P] - 3个任务可并行：
任务: "在 tests/unit/test_PathConfig.js 中完善路径配置单元测试"
任务: "在 tests/unit/test_BrandInfo.js 中完善品牌信息单元测试"
任务: "在 tests/unit/test_CleanupRule.js 中完善清理规则单元测试"

# 同时启动文档更新 [P] - 2个任务可并行：
任务: "更新 docs/tutorial.md、docs/path-config-guide.md、docs/cleanup-guide.md"
任务: "更新 README.md 的品牌信息和功能介绍"
```

## 风险识别与应对

### 高风险任务识别
- **⚠️ T031**: 命令重命名原子性 - 涉及文件重命名和package.json更新的时序协调
- **T043**: 性能优化 - 涉及大文件处理和内存管理
- **T044**: 配置缓存 - 涉及数据一致性和并发访问

### 技术风险应对
- **文件系统安全**: 添加权限验证和错误恢复机制
- **内存泄漏防护**: 实现垃圾回收监控和内存限制
- **并发访问控制**: 使用文件锁和事务机制
- **数据一致性**: 实现配置变更的原子性保障

## 任务执行优化策略

### 并行执行分组
```
阶段2测试阶段（T005-T016）：
├── 合同测试组：T005-T012（8个任务并行）
└── 集成测试组：T013-T016（4个任务并行）

阶段3核心实现：
├── 实体模型组：T017-T019（3个任务并行）
├── 服务层组：T020-T022（顺序执行）
├── API端点组：T023-T030（按控制器分组）
└── CLI命令组：T031-T033（顺序执行，T031高风险）

阶段4集成：
├── 核心集成：T034-T036（顺序执行）
└── 配置管理：T037-T039（顺序执行）

阶段5完善：
├── 单元测试：T040-T042（3个任务并行）
├── 性能优化：T043-T045（顺序执行）
├── 文档更新：T046-T047（2个任务并行）
└── 最终验证：T048-T050（顺序执行）
```

### 执行时间优化
- **并行度**: 最大8个任务同时执行（合同测试阶段）
- **阻塞点**: 只有TDD原则要求测试先行，其他阶段内部可高度并行
- **关键路径**: 测试→实体模型→服务→API→CLI→集成→完善
- **预期效率**: 相比串行执行可节省约70%的总执行时间

## 质量保证机制

### 多层次测试策略
- **合同测试**: API行为契约验证（8个端点）
- **集成测试**: 端到端用户场景验证（4个场景）
- **单元测试**: 核心逻辑边界验证（3个实体）
- **性能测试**: 响应时间和资源使用验证
- **安全测试**: 权限和文件系统安全验证

### 验证检查点
- **TDD合规**: 所有测试任务在实现任务前完成
- **依赖完整**: 所有阻塞关系正确建立
- **并行安全**: [P]标记的任务无文件冲突
- **路径准确**: 所有文件路径都经过验证
- **风险控制**: 高风险任务有额外保障措施

## 任务生成规则验证

*在 main() 执行期间应用*

1.  **从合约** :
    *   cleanup-api.yaml → 5个合同测试任务 [P]
    *   path-config-api.yaml → 3个合同测试任务 [P]
2.  **从数据模型** ：
    *   3个实体 → 3个模型实现任务 [P]
3.  **从用户故事** ：
    *   4个集成场景 → 4个集成测试任务 [P]
4.  **优化合并** :
    *   合并过细集成任务（T034-T036 → T034）
    *   合并中间件验证任务（T037-T039 → T035）
    *   合并日志监控任务（T040-T042 → T036）
    *   合并文档更新任务（T049-T051 → T046）
5.  **新增功能** :
    *   配置管理功能（T037-T039）
    *   性能安全优化（T043-T045）
6.  **顺序优化** :
    *   设置（4个任务）→ 测试（12个任务）→ 核心（16个任务）→ 集成（6个任务）→ 完善（11个任务）
    *   最大并行度提升至8个任务同时执行

## 验证清单

**GATE：在 main() 返回前由主程序检查**

- [ ] 所有合约都有相应的测试任务（8个合同测试）
- [ ] 所有实体都有模型任务（3个实体模型）
- [ ] 所有测试任务都在实现之前（TDD原则）
- [ ] 并行任务真正独立（标记[P]的任务无依赖冲突）
- [ ] 每个任务指定精确的文件路径（所有任务都有路径）
- [ ] 没有任务修改另一个[P]任务相同的文件
- [ ] 高风险任务有原子性保障措施
- [ ] 配置管理功能完整覆盖
- [ ] 性能和安全优化措施到位
- [ ] 文档更新任务合理合并

**任务生成完成**：共50个任务，已按TDD原则排序，优化并行执行效率，提升质量保证水平。
