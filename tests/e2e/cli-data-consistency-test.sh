#!/bin/bash

# CLI数据一致性测试
# 验证CLI功能的数据完整性和持久性

set -e

echo "🔄 运行CLI数据一致性测试..."

# 创建测试目录
TEST_DIR="/tmp/taskmaster-consistency-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "  📁 测试目录: $TEST_DIR"

# 初始化项目
echo "  🚀 初始化项目..."
TASK_MASTER_CLI="/Volumes/Data_SSD/Coding/startkits/Speco-Tasker/bin/speco-tasker.js"
if ! node "$TASK_MASTER_CLI" init --name "Consistency Test" > /dev/null 2>&1; then
    echo "❌ 项目初始化失败"
    exit 1
fi

echo "  ✅ 项目初始化成功"

# 添加测试任务
echo "  ➕ 添加测试任务..."
if ! node "$TASK_MASTER_CLI" add-task \
    --title "一致性测试任务" \
    --description "用于测试数据一致性的任务" \
    --details "验证任务数据的完整性和持久性" \
    --test-strategy "通过多次读取验证数据一致性" \
    --spec-files "consistency-test-spec.md" \
    --priority "medium" > /dev/null 2>&1; then
    echo "❌ 添加任务失败"
    exit 1
fi

echo "  ✅ 任务添加成功"

# 获取任务ID
TASK_ID=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
let taskId = null;
if (tasksData.main && typeof tasksData.main === 'object' && tasksData.main.tasks && Array.isArray(tasksData.main.tasks) && tasksData.main.tasks.length > 0) {
    taskId = tasksData.main.tasks[0].id;
}
console.log(taskId);
" 2>&1)

if [ -z "$TASK_ID" ]; then
    echo "❌ 无法获取任务ID"
    exit 1
fi

echo "  📋 任务ID: $TASK_ID"

# 更新任务状态
echo "  🔄 更新任务状态..."
if ! node "$TASK_MASTER_CLI" set-status --id "$TASK_ID" --status "in-progress" --tag main > /dev/null 2>&1; then
    echo "❌ 状态更新失败"
    exit 1
fi

echo "  ✅ 状态更新成功"

# 验证数据一致性 - 多次读取并比较
echo "  🔍 验证数据一致性..."

# 读取第一次
DATA1=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const task = tasksData.main.tasks.find(t => t.id == '$TASK_ID');
console.log(JSON.stringify({ id: task.id, title: task.title, status: task.status }));
")

# 等待一秒
sleep 1

# 读取第二次
DATA2=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const task = tasksData.main.tasks.find(t => t.id == '$TASK_ID');
console.log(JSON.stringify({ id: task.id, title: task.title, status: task.status }));
")

# 比较数据
if [ "$DATA1" != "$DATA2" ]; then
    echo "❌ 数据不一致！"
    echo "  第一次读取: $DATA1"
    echo "  第二次读取: $DATA2"
    exit 1
fi

echo "  ✅ 数据一致性验证通过"

# 验证任务列表功能
echo "  📋 验证任务列表功能..."
if ! node "$TASK_MASTER_CLI" list > /dev/null 2>&1; then
    echo "❌ 任务列表失败"
    exit 1
fi

echo "  ✅ 任务列表正常"

# 验证任务详情查看
echo "  👀 验证任务详情查看..."
if ! node "$TASK_MASTER_CLI" show "$TASK_ID" --tag main > /dev/null 2>&1; then
    echo "❌ 任务详情查看失败"
    exit 1
fi

echo "  ✅ 任务详情查看正常"

# 清理测试目录
echo "  🧹 清理测试目录..."
cd /
rm -rf "$TEST_DIR"

echo "✅ CLI数据一致性测试通过 - 数据完整性验证成功"
