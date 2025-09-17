#!/bin/bash

# 综合功能验证脚本
# 验证CLI和MCP的完整功能和跨界面一致性

set -e

echo "🎯 运行Task Master综合功能验证..."
echo "========================================"

# 记录开始时间
START_TIME=$(date +%s)

# 运行快速验证
echo ""
echo "📋 第一阶段：快速基础验证"
echo "------------------------------"
if bash tests/e2e/quick-verify.sh; then
    echo "✅ 快速验证通过"
else
    echo "❌ 快速验证失败"
    exit 1
fi

# 运行CLI功能验证（创建任务并获取任务信息）
echo ""
echo "💻 第二阶段：CLI功能完整性验证"
echo "------------------------------"

# 创建临时目录用于CLI测试
CLI_TEST_DIR="/tmp/taskmaster-cli-verification-$(date +%s)"
mkdir -p "$CLI_TEST_DIR"
cd "$CLI_TEST_DIR"

# 运行CLI功能验证
if bash "$OLDPWD/tests/e2e/cli-functionality-test.sh"; then
    echo "✅ CLI功能验证通过"

    # 获取CLI创建的任务信息
    TASK_ID=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const taskIds = Object.keys(tasks);
console.log(taskIds[0]);
")

    TASK_DATA=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const task = tasks['$TASK_ID'];
console.log(JSON.stringify({
    id: '$TASK_ID',
    title: task.title,
    description: task.description,
    status: task.status
}));
")
else
    echo "❌ CLI功能验证失败"
    exit 1
fi

# 运行MCP功能验证
echo ""
echo "🔌 第三阶段：MCP功能完整性验证"
echo "------------------------------"
cd /
if bash tests/e2e/mcp-functionality-test.sh; then
    echo "✅ MCP功能验证通过"
else
    echo "❌ MCP功能验证失败"
    exit 1
fi

# 运行跨界面一致性验证
echo ""
echo "🔄 第四阶段：跨界面一致性验证"
echo "------------------------------"
cd "$CLI_TEST_DIR"
export CLI_TASK_DATA="$TASK_DATA"
if bash "$OLDPWD/tests/e2e/cross-interface-consistency-test.sh"; then
    echo "✅ 跨界面一致性验证通过"
else
    echo "❌ 跨界面一致性验证失败"
    exit 1
fi

# 清理测试目录
echo ""
echo "🧹 清理测试环境..."
cd /
rm -rf "$CLI_TEST_DIR"

# 计算总时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "========================================"
echo "🎉 所有验证阶段均通过！"
echo ""
echo "📊 验证总结:"
echo "   ⏱️  总耗时: ${DURATION}秒"
echo "   ✅ 基础功能: 通过"
echo "   ✅ CLI功能: 通过"
echo "   ✅ MCP功能: 通过"
echo "   ✅ 数据一致性: 通过"
echo ""
echo "🚀 Task Master CLI和MCP服务都工作正常！"
