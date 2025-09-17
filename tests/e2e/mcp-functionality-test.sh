#!/bin/bash

# MCP功能完整性测试
# 验证MCP服务的基本功能是否正常工作

set -e

echo "🔌 运行MCP功能完整性测试..."

# 创建临时测试目录
TEST_DIR="/tmp/taskmaster-mcp-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "  📁 测试目录: $TEST_DIR"

# 初始化项目
echo "  🚀 初始化项目..."
if ! node "$OLDPWD/bin/task-master.js" init --name "MCP Test" --description "Test project for MCP functionality" --yes > /dev/null 2>&1; then
    echo "❌ 项目初始化失败"
    exit 1
fi

# 启动MCP服务器进行测试
echo "  🔧 启动MCP服务器..."
# 创建简单的MCP客户端测试脚本
cat > mcp-test-client.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

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
let testResults = {
    get_tasks: false,
    add_task: false,
    set_task_status: false,
    get_task: false
};

serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    // console.log('Server output:', output);

    // 等待服务器就绪
    if (output.includes('MCP server listening') || output.includes('Server started')) {
        serverReady = true;
    }
});

serverProcess.stderr.on('data', (data) => {
    // console.log('Server stderr:', data.toString());
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

            // 检查是否收到完整的JSON响应
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
                // 继续等待更多数据
            }
        };

        serverProcess.stdout.on('data', responseHandler);

        serverProcess.stdin.write(requestStr);

        // 设置超时
        setTimeout(() => {
            if (!responseReceived) {
                serverProcess.stdout.removeListener('data', responseHandler);
                reject(new Error('Request timeout'));
            }
        }, 5000);
    });
}

async function runMCPTests() {
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

        console.log('  ✅ MCP服务器启动成功');

        // 测试获取任务列表
        console.log('  📋 测试获取任务列表...');
        const tasksResult = await sendMCPRequest('get_tasks');
        if (!tasksResult.success) {
            throw new Error('Failed to get tasks');
        }
        testResults.get_tasks = true;
        console.log('  ✅ 获取任务列表成功');

        // 测试添加任务
        console.log('  ➕ 测试添加任务...');
        const addResult = await sendMCPRequest('add_task', {
            prompt: 'MCP测试任务'
        });
        if (!addResult.success) {
            throw new Error('Failed to add task');
        }
        testResults.add_task = true;
        console.log('  ✅ 添加任务成功');

        // 获取最新任务ID
        const tasksAfterAdd = await sendMCPRequest('get_tasks');
        const taskIds = Object.keys(tasksAfterAdd.data || {});
        const latestTaskId = taskIds[taskIds.length - 1];

        if (latestTaskId) {
            // 测试设置任务状态
            console.log('  🔄 测试设置任务状态...');
            const statusResult = await sendMCPRequest('set_task_status', {
                id: latestTaskId,
                status: 'done'
            });
            if (!statusResult.success) {
                throw new Error('Failed to set task status');
            }
            testResults.set_task_status = true;
            console.log('  ✅ 设置任务状态成功');

            // 测试获取单个任务
            console.log('  👀 测试获取单个任务...');
            const taskResult = await sendMCPRequest('get_task', {
                id: latestTaskId
            });
            if (!taskResult.success) {
                throw new Error('Failed to get task');
            }
            testResults.get_task = true;
            console.log('  ✅ 获取单个任务成功');
        }

        console.log('✅ MCP功能完整性测试通过 - 所有基本功能正常工作');

    } catch (error) {
        console.error('❌ MCP测试失败:', error.message);
        process.exit(1);
    } finally {
        // 清理进程
        serverProcess.kill();
    }
}

// 延迟启动测试
setTimeout(runMCPTests, 2000);

// 处理退出信号
process.on('SIGINT', () => {
    serverProcess.kill();
    process.exit(1);
});
EOF

# 运行MCP测试
if ! timeout 30s node mcp-test-client.js; then
    echo "❌ MCP功能测试失败"
    exit 1
fi

# 清理测试目录
echo "  🧹 清理测试目录..."
cd /
rm -rf "$TEST_DIR"

echo "✅ MCP功能完整性测试完成"
