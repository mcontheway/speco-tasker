#!/bin/bash

# CLI功能完整性测试
# 验证实际的任务管理命令是否正常工作

set -e

echo "🔧 运行CLI功能完整性测试..."

# 创建临时测试目录
TEST_DIR="/tmp/taskmaster-cli-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "  📁 测试目录: $TEST_DIR"

# 初始化项目
echo "  🚀 初始化项目..."
if ! node "$OLDPWD/bin/task-master.js" init --name "CLI Test" --description "Test project for CLI functionality" --yes > /dev/null 2>&1; then
    echo "❌ 项目初始化失败"
    exit 1
fi

# 检查是否生成了任务文件
if [ ! -f ".taskmaster/tasks/tasks.json" ]; then
    echo "❌ 任务文件未生成"
    exit 1
fi

echo "  ✅ 项目初始化成功"

# 测试PRD解析功能
echo "  📄 测试PRD解析功能..."
cat > test-prd.txt << 'EOF'
# CLI功能测试任务

这是一个用于测试CLI功能的项目。

## 核心功能
1. 用户注册和登录
2. 任务创建和管理
3. 项目协作

## 技术需求
- Node.js后端
- 数据库集成
- API设计
EOF

if ! node "$OLDPWD/bin/task-master.js" parse-prd test-prd.txt > /dev/null 2>&1; then
    echo "❌ PRD解析失败"
    exit 1
fi

# 检查是否生成了任务
TASK_COUNT=$(node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('.taskmaster/tasks/tasks.json', 'utf8'));
console.log(Object.keys(tasks).length);
")

if [ "$TASK_COUNT" -eq 0 ]; then
    echo "❌ 未生成任务"
    exit 1
fi

echo "  ✅ PRD解析成功，生成了 $TASK_COUNT 个任务"

# 测试任务列表功能
echo "  📋 测试任务列表功能..."
if ! node "$OLDPWD/bin/task-master.js" list > /dev/null 2>&1; then
    echo "❌ 任务列表失败"
    exit 1
fi
echo "  ✅ 任务列表正常"

# 测试添加任务功能
echo "  ➕ 测试添加任务功能..."
if ! node "$OLDPWD/bin/task-master.js" add-task --prompt "测试新任务添加功能" > /dev/null 2>&1; then
    echo "❌ 添加任务失败"
    exit 1
fi

# 验证任务是否添加成功
NEW_TASK_COUNT=$(node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('.taskmaster/tasks/tasks.json', 'utf8'));
console.log(Object.keys(tasks).length);
")

if [ "$NEW_TASK_COUNT" -le "$TASK_COUNT" ]; then
    echo "❌ 新任务未添加成功"
    exit 1
fi

echo "  ✅ 添加任务成功"

# 测试任务状态更新
echo "  🔄 测试任务状态更新..."
FIRST_TASK_ID=$(node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('.taskmaster/tasks/tasks.json', 'utf8'));
console.log(Object.keys(tasks).sort()[0]);
")

if ! node "$OLDPWD/bin/task-master.js" set-status --id "$FIRST_TASK_ID" --status "in-progress" > /dev/null 2>&1; then
    echo "❌ 状态更新失败"
    exit 1
fi

# 验证状态是否更新成功
TASK_STATUS=$(node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('.taskmaster/tasks/tasks.json', 'utf8'));
const taskId = '$FIRST_TASK_ID';
console.log(tasks[taskId] ? tasks[taskId].status : 'not found');
")

if [ "$TASK_STATUS" != "in-progress" ]; then
    echo "❌ 任务状态未正确更新"
    exit 1
fi

echo "  ✅ 状态更新成功"

# 测试任务详情查看
echo "  👀 测试任务详情查看..."
if ! node "$OLDPWD/bin/task-master.js" show "$FIRST_TASK_ID" > /dev/null 2>&1; then
    echo "❌ 任务详情查看失败"
    exit 1
fi
echo "  ✅ 任务详情查看正常"

# 测试next命令
echo "  🎯 测试next命令..."
if ! node "$OLDPWD/bin/task-master.js" next > /dev/null 2>&1; then
    echo "❌ next命令失败"
    exit 1
fi
echo "  ✅ next命令正常"

# 清理测试目录
echo "  🧹 清理测试目录..."
cd /
rm -rf "$TEST_DIR"

echo "✅ CLI功能完整性测试通过 - 所有核心功能正常工作"
