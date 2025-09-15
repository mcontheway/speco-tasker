# 任务：\[功能名称\]

**输入** : 从 `/specs/[###-feature-name]/` 设计文档**前提条件** : plan.md（必需），research.md，data-model.md，contracts/

## 执行流程（主流程）

```
1. 从功能目录加载 plan.md
   → 如果未找到：错误 "未找到实施计划"
   → 提取：技术栈、库、结构
2. 加载可选设计文档：
   → data-model.md：提取实体 → 模型任务
   → contracts/：每个文件 → 合同测试任务
   → research.md：提取决策 → 设置任务
3. 按类别生成任务：
   → 设置：项目初始化、依赖项、代码检查
   → 测试：合同测试、集成测试
   → 核心：模型、服务、CLI命令
   → 集成：数据库、中间件、日志
   → 完善：单元测试、性能、文档
4. 应用任务规则：
   → 不同文件 = 标记 [P] 表示并行
   → 相同文件 = 顺序执行（无 [P]）
   → 测试优先于实现（TDD）
5. 按顺序编号任务（T001、T002...）
6. 生成依赖关系图
7. 创建并行执行示例
8. 验证任务完整性：
   → 所有合同都有测试吗？
   → 所有实体都有模型吗？
   → 所有端点都实现了吗？
9. 返回：成功（任务准备就绪可执行）
```

## 格式: `[ID] [P?] 描述`

*   **\[P\]**: 可以并行运行（不同文件，无依赖）
*   在描述中包含确切的文件路径

## 路径规范

*   **单个项目** : `src/`, `tests/` 位于仓库根目录
*   **Web 应用** : `backend/src/`, `frontend/src/`
*   **移动端** : `api/src/`, `ios/src/` 或 `android/src/`
*   下方路径假设为单个项目 - 根据 plan.md 结构进行调整

## 阶段3.1：设置

- [ ] T001 按照实施计划创建项目结构
- [ ] T002 使用[语言]初始化项目并添加[框架]依赖
- [ ] T003 [P] 配置代码检查和格式化工具

## 阶段 3.2：先写测试（TDD） ⚠️ 必须在 3.3 之前完成

**关键：这些测试必须先编写并通过，然后才能进行任何实现**

- [ ] T004 [P] 在 tests/contract/test_users_post.py 中编写合同测试 POST /api/users
- [ ] T005 [P] 合约测试 GET /api/users/{id} 在 tests/contract/test_users_get.py
- [ ] T006 [P] 集成测试用户注册 在 tests/integration/test_registration.py
- [ ] T007 [P] 集成测试认证流程 在 tests/integration/test_auth.py

## 阶段 3.3：核心实现（仅测试失败后）

- [ ] T008 [P] src/models/user.py 中的用户模型
- [ ] T009 [P] src/services/user_service.py 中的 UserService CRUD
- [ ] T010 [P] src/cli/user_commands.py 中的 CLI --create-user
- [ ] T011 POST /api/users 端点
- [ ] T012 GET /api/users/{id} 端点
- [ ] T013 输入验证
- [ ] T014 错误处理和日志记录

## Phase 3.4: 集成

- [ ] T015 连接 UserService 到 DB
- [ ] T016 认证中间件
- [ ] T017 请求/响应日志
- [ ] T018 CORS 和安全头部

## 第三阶段.5: 精细调整

- [ ] T019 [P] 测试单元中的验证测试（tests/unit/test_validation.py）
- [ ] T020 性能测试（<200ms）
- [ ] T021 [P] 更新文档/api.md
- [ ] T022 移除重复项
- [ ] T023 运行 manual-testing.md

## 依赖项

*   实现前（T008-T014）的测试（T004-T007）
*   T008 阻塞 T009, T015
*   T016 阻塞 T018
*   精炼前的实现 (T019-T023)

## 并行示例

```
# 同时启动 T004-T007:
任务: "在 tests/contract/test_users_post.py 中编写合同测试 POST /api/users"
任务: "在 tests/contract/test_users_get.py 中编写合同测试 GET /api/users/{id}"
任务: "在 tests/integration/test_registration.py 中编写集成测试注册功能"
任务: "在 tests/integration/test_auth.py 中编写集成测试认证流程"
```

## 笔记

*   \[P\] 任务是不同的文件，没有依赖关系
*   在实现前验证测试失败
*   每完成一个任务后提交
*   避免：模糊的任务，同一文件的冲突

## 任务生成规则

*在 main() 执行期间应用*

1.  **从合约** :
    
    *   每个合约文件 → 合约测试任务 \[P\]
    *   每个端点 → 实现任务
2.  **从数据模型** ：
    
    *   每个实体 → 模型创建任务 \[P\]
    *   关系 → 服务层任务
3.  **从用户故事** ：
    
    *   每个故事 → 集成测试 \[P\]
    *   快速入门场景 → 验证任务
4.  **顺序** :
    
    *   设置 → 测试 → 模型 → 服务 → 端点 → 完善
    *   依赖项块并行执行

## 验证清单

*GATE：在 main() 返回前由主程序检查*

- [ ] 所有合约都有相应的测试
- [ ] 所有实体都有模型任务
- [ ] 所有测试都在实现之前进行
- [ ] 并行任务真正独立
- [ ] 每个任务指定精确的文件路径
- [ ] 没有任务修改另一个[P]任务相同的文件