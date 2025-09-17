#!/bin/bash

# 跨界面一致性测试
# 验证CLI和MCP是否共享相同的数据状态

set -e

echo "🔄 运行跨界面一致性测试..."

# 创建临时测试目录
TEST_DIR="/tmp/taskmaster-cross-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "  📁 测试目录: $TEST_DIR"

# 初始化项目
echo "  🚀 初始化项目..."
if ! node "$OLDPWD/bin/task-master.js" init --name "Cross Interface Test" --description "Test cross-interface consistency" --yes > /dev/null 2>&1; then
    echo "❌ 项目初始化失败"
    exit 1
fi

# 使用CLI添加任务
echo "  📝 使用CLI添加任务..."
if ! node "$OLDPWD/bin/task-master.js" add-task --prompt "跨界面一致性测试任务" > /dev/null 2>&1; then
    echo "❌ CLI添加任务失败"
    exit 1
fi

# 获取CLI添加的任务ID和内容
CLI_TASK_DATA=$(node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('.taskmaster/tasks/tasks.json', 'utf8'));
const taskIds = Object.keys(tasks);
const latestTask = tasks[taskIds[taskIds.length - 1]];
console.log(JSON.stringify({
    id: taskIds[taskIds.length - 1],
    title: latestTask.title,
    description: latestTask.description,
    status: latestTask.status
}));
")

echo "  ✅ CLI添加任务成功"

# 创建MCP一致性测试脚本
cat > mcp-consistency-test.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

const cliTaskData = JSON.parse(process.env.CLI_TASK_DATA);

console.log('  🔍 验证MCP读取的任务数据...');

// 启动MCP服务器
const serverProcess = spawn('node', [
    path.join(process.env.OLDPWD, 'mcp-server/server.js')
], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
        ...process.env,
        TASKMASTER_PROJECT_ROOT: process.cwd()
    }
});

let serverReady = false;

serverProcess.stdout.on('data', (data) => {
    const output = data.toString();

    if (output.includes('MCP server listening') || output.includes('Server started')) {
        serverReady = true;
    }
});

function sendMCPRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36);
        const request = {
            jsonrpc: '2.0',
            id: requestId,
            method,
            params
        };

        const requestStr = JSON.stringify(request) + '\n';

        let responseData = '';
        let responseReceived = false;

        const responseHandler = (data) => {
            responseData += data.toString();

            try {
                const lines = responseData.trim().split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        const response = JSON.parse(line);
                        if (response.id === requestId) {
                            responseReceived = true;
                            serverProcess.stdout.removeListener('data', responseHandler);
                            if (response.error) {
                                reject(new Error(response.error.message));
                            } else {
                                resolve(response.result);
                            }
                            return;
                        }
                    }
                }
            } catch (e) {
                // 继续等待
            }
        };

        serverProcess.stdout.on('data', responseHandler);
        serverProcess.stdin.write(requestStr);

        setTimeout(() => {
            if (!responseReceived) {
                serverProcess.stdout.removeListener('data', responseHandler);
                reject(new Error('Request timeout'));
            }
        }, 5000);
    });
}

async function testConsistency() {
    try {
        // 等待服务器就绪
        let attempts = 0;
        while (!serverReady && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!serverReady) {
            throw new Error('MCP server failed to start');
        }

        // 获取MCP的任务数据
        const mcpTasksResult = await sendMCPRequest('get_tasks');
        if (!mcpTasksResult.success) {
            throw new Error('Failed to get tasks from MCP');
        }

        const mcpTasks = mcpTasksResult.data || {};
        const mcpTask = mcpTasks[cliTaskData.id];

        if (!mcpTask) {
            throw new Error('Task not found in MCP');
        }

        // 验证数据一致性
        if (mcpTask.title !== cliTaskData.title) {
            throw new Error(`Title mismatch: CLI="${cliTaskData.title}", MCP="${mcpTask.title}"`);
        }

        if (mcpTask.description !== cliTaskData.description) {
            throw new Error(`Description mismatch: CLI="${cliTaskData.description}", MCP="${mcpTask.description}"`);
        }

        if (mcpTask.status !== cliTaskData.status) {
            throw new Error(`Status mismatch: CLI="${cliTaskData.status}", MCP="${mcpTask.status}"`);
        }

        console.log('  ✅ MCP数据与CLI一致');

        // 测试MCP修改数据后CLI是否能看到
        console.log('  🔄 测试MCP修改数据...');
        const updateResult = await sendMCPRequest('set_task_status', {
            id: cliTaskData.id,
            status: 'done'
        });

        if (!updateResult.success) {
            throw new Error('Failed to update task status via MCP');
        }

        // 验证CLI是否能看到MCP的修改
        const cliUpdatedTask = JSON.parse(require('child_process').execSync(`node -e "
const fs = require('fs');
const tasks = JSON.parse(fs.readFileSync('.taskmaster/tasks/tasks.json', 'utf8'));
const task = tasks['${cliTaskData.id}'];
console.log(JSON.stringify(task ? { status: task.status } : null));
"`, { encoding: 'utf8' }));

        if (!cliUpdatedTask || cliUpdatedTask.status !== 'done') {
            throw new Error('CLI did not see MCP status update');
        }

        console.log('  ✅ CLI能看到MCP的数据修改');

        console.log('✅ 跨界面一致性测试通过 - CLI和MCP共享相同数据状态');

    } catch (error) {
        console.error('❌ 一致性测试失败:', error.message);
        process.exit(1);
    } finally {
        serverProcess.kill();
    }
}

setTimeout(testConsistency, 2000);

process.on('SIGINT', () => {
    serverProcess.kill();
    process.exit(1);
});
EOF

# 运行跨界面一致性测试
echo "  🔌 启动MCP一致性验证..."
export CLI_TASK_DATA="$CLI_TASK_DATA"

if ! timeout 30s node mcp-consistency-test.js; then
    echo "❌ 跨界面一致性测试失败"
    exit 1
fi

# 清理测试目录
echo "  🧹 清理测试目录..."
cd /
rm -rf "$TEST_DIR"

echo "✅ 跨界面一致性测试完成"
