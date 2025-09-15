---
name: plan
description: "规划如何实现指定功能。这是规范驱动开发生命周期的第二步。"
---

规划如何实现指定功能。

这是规范驱动开发生命周期的第二步。

根据提供的实现细节参数，执行以下操作：

1. 从仓库根目录运行 `spec/scripts/setup-plan.sh --json` 并解析 JSON 获取 FEATURE_SPEC、IMPL_PLAN、SPECS_DIR、BRANCH。所有后续文件路径必须为绝对路径。
2. 阅读并分析功能规范以理解：
   - 功能需求和用户故事
   - 功能性和非功能性需求
   - 成功标准和验收标准
   - 提到的任何技术约束或依赖关系

3. 阅读 `spec/memory/constitution.md` 中的章程以理解宪法要求。

4. 执行实现计划模板：
   - 加载 `/spec/templates/plan-template.md`（已复制到 IMPL_PLAN 路径）
   - 将输入路径设置为 FEATURE_SPEC
   - 运行执行流程（主函数）步骤 1-10
   - 模板是自包含且可执行的
   - 遵循指定的错误处理和门控检查
   - 让模板指导在 $SPECS_DIR 中生成工件：
     * 第 0 阶段生成 research.md
     * 第 1 阶段生成 data-model.md、contracts/、quickstart.md
     * 第 2 阶段生成 tasks.md
   - 将用户提供的参数详情纳入技术上下文：{ARGS}
   - 在完成每个阶段时更新进度跟踪

5. 验证执行完成：
   - 检查进度跟踪显示所有阶段已完成
   - 确保生成了所有必需的工件
   - 确认执行中没有 ERROR 状态

6. 报告结果，包括分支名称、文件路径和生成的工件。

对所有文件操作使用仓库根目录的绝对路径以避免路径问题。
