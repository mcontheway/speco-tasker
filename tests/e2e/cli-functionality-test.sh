#!/bin/bash

# CLI功能完整性测试
# 验证实际的任务管理命令是否正常工作（已移除AI功能后的实际可用功能）

set - e

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

# 检查是否生成了任务文件结构
if [ ! -d ".taskmaster" ] || [ ! -d ".taskmaster/tasks" ]; then
    echo "❌ 项目结构未正确生成"
    exit 1
fi

echo "  ✅ 项目初始化成功"

# 测试任务列表功能（空列表）
echo "  📋 测试任务列表功能..."
if ! node "$OLDPWD/bin/task-master.js" list > /dev/null 2>&1; then
    echo "❌ 任务列表失败"
    exit 1
fi
echo "  ✅ 任务列表正常（空项目）"

# 添加测试任务（提供所有必需参数）
echo "  ➕ 添加测试任务..."
if ! node "$OLDPWD/bin/task-master.js" add-task \
    --title "CLI测试任务" \
    --description "用于测试CLI功能的任务" \
    --details "这是一个详细的实现说明，用于验证CLI的任务创建功能。" \
    --test-strategy "通过CLI命令验证任务创建、状态更新和查询功能" \
    --spec-files "cli-test-spec.md" \
    --priority "high" > /dev/null 2>&1; then
    echo "❌ 添加任务失败"
    exit 1
fi

# 验证任务是否添加成功
TASK_EXISTS=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
if (fs.existsSync(tasksFile)) {
    const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
    console.log(Object.keys(tasks).length > 0 ? 'true' : 'false');
} else {
    console.log('false');
}
")

if [ "$TASK_EXISTS" != "true" ]; then
    echo "❌ 任务未添加成功"
    exit 1
fi

echo "  ✅ 任务添加成功"

# 获取任务ID
TASK_ID=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const taskIds = Object.keys(tasks);
console.log(taskIds[0]);
")

# 测试任务详情查看
echo "  👀 测试任务详情查看..."
if ! node "$OLDPWD/bin/task-master.js" show "$TASK_ID" > /dev/null 2>&1; then
    echo "❌ 任务详情查看失败"
    exit 1
fi
echo "  ✅ 任务详情查看正常"

# 测试任务状态更新
echo "  🔄 测试任务状态更新..."
if ! node "$OLDPWD/bin/task-master.js" set-status --id "$TASK_ID" --status "in-progress" > /dev/null 2>&1; then
    echo "❌ 状态更新失败"
    exit 1
fi

# 验证状态是否更新成功
TASK_STATUS=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const task = tasks['$TASK_ID'];
console.log(task ? task.status : 'not found');
")

if [ "$TASK_STATUS" != "in-progress" ]; then
    echo "❌ 任务状态未正确更新"
    exit 1
fi

echo "  ✅ 状态更新成功"

# 测试任务列表功能（非空列表）
echo "  📋 测试任务列表功能（非空）..."
if ! node "$OLDPWD/bin/task-master.js" list > /dev/null 2>&1; then
    echo "❌ 非空任务列表失败"
    exit 1
fi
echo "  ✅ 任务列表正常（非空项目）"

# 测试next命令
echo "  🎯 测试next命令..."
if ! node "$OLDPWD/bin/task-master.js" next > /dev/null 2>&1; then
    echo "❌ next命令失败"
    exit 1
fi
echo "  ✅ next命令正常"

# 测试标签管理功能
echo "  🏷️ 测试标签管理功能..."
if ! node "$OLDPWD/bin/task-master.js" tags > /dev/null 2>&1; then
    echo "❌ 标签列表失败"
    exit 1
fi
echo "  ✅ 标签管理正常"

# 测试生成任务文件功能
echo "  📄 测试生成任务文件功能..."
if ! node "$OLDPWD/bin/task-master.js" generate > /dev/null 2>&1; then
    echo "❌ 生成任务文件失败"
    exit 1
fi
echo "  ✅ 生成任务文件正常"

# 测试添加子任务
echo "  👶 测试添加子任务..."
if ! node "$OLDPWD/bin/task-master.js" add-subtask --parent "$TASK_ID" --title "子任务测试" --description "测试子任务功能" > /dev/null 2>&1; then
    echo "❌ 添加子任务失败"
    exit 1
fi
echo "  ✅ 添加子任务成功"

# 测试依赖管理
echo "  🔗 测试依赖管理..."
# 添加第二个任务用于依赖测试
if ! node "$OLDPWD/bin/task-master.js" add-task \
    --title "依赖测试任务" \
    --description "用于测试依赖关系" \
    --details "测试任务间的依赖关系" \
    --test-strategy "验证依赖关系正确性" \
    --spec-files "dependency-test-spec.md" \
    --priority "medium" > /dev/null 2>&1; then
    echo "❌ 添加第二个任务失败"
    exit 1
fi

# 获取第二个任务ID
SECOND_TASK_ID=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const taskIds = Object.keys(tasks).filter(id => id !== '$TASK_ID');
console.log(taskIds[0]);
")

# 添加依赖关系
if ! node "$OLDPWD/bin/task-master.js" add-dependency --id "$SECOND_TASK_ID" --depends-on "$TASK_ID" > /dev/null 2>&1; then
    echo "❌ 添加依赖关系失败"
    exit 1
fi
echo "  ✅ 依赖关系添加成功"

# 验证依赖关系
echo "  🔍 验证依赖关系..."
DEPENDENCY_EXISTS=$(node -e "
const fs = require('fs');
const path = require('path');
const tasksFile = path.join('.taskmaster', 'tasks', 'tasks.json');
const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
const task = tasks['$SECOND_TASK_ID'];
const hasDependency = task && task.dependencies && task.dependencies.includes('$TASK_ID');
console.log(hasDependency ? 'true' : 'false');
")

if [ "$DEPENDENCY_EXISTS" != "true" ]; then
    echo "❌ 依赖关系未正确设置"
    exit 1
fi
echo "  ✅ 依赖关系验证成功"

# 清理测试目录
echo "  🧹 清理测试目录..."
cd /
rm -rf "$TEST_DIR"

echo "✅ CLI功能完整性测试通过 - 所有核心功能正常工作"
