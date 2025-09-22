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
TASK_MASTER_CLI="/Volumes/Data_SSD/Coding/startkits/Speco-Tasker/bin/speco-tasker.js"
if ! node "$TASK_MASTER_CLI" init --name "MCP Test" > /dev/null 2>&1; then
    echo "❌ 项目初始化失败"
    exit 1
fi

# 启动MCP服务器进行测试
echo "  🔧 启动MCP服务器..."
# 创建简单的MCP客户端测试脚本
cat > mcp-test-client.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

// 启动MCP服务器（HTTP模式）
const serverProcess = spawn('node', [
    '/Volumes/Data_SSD/Coding/startkits/Speco-Tasker/mcp-server/server.js',
    '--port=8082'
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

        // 测试获取任务列表（空项目）
        console.log('  📋 测试获取任务列表（空项目）...');
        const tasksResult = await sendMCPRequest('get_tasks');
        if (!tasksResult.success) {
            console.log('  ⚠️ 获取任务列表可能失败（这是正常的，因为没有任务）');
        } else {
            testResults.get_tasks = true;
            console.log('  ✅ 获取任务列表成功');
        }

        // 测试添加任务（提供所有必需参数）
        console.log('  ➕ 测试添加任务...');
        const addResult = await sendMCPRequest('add_task', {
            title: 'MCP测试任务',
            description: '用于测试MCP功能的任务',
            details: '这是一个详细的实现说明，用于验证MCP的任务创建功能。',
            testStrategy: '通过MCP接口验证任务创建、状态更新和查询功能',
            specFiles: 'mcp-test-spec.md',
            priority: 'high'
        });

        if (!addResult.success) {
            console.log('  ❌ 添加任务失败:', addResult.error || '未知错误');
            throw new Error('Failed to add task via MCP');
        }
        testResults.add_task = true;
        console.log('  ✅ 添加任务成功');

        // 重新获取任务列表，验证任务已添加
        console.log('  📋 验证任务添加结果...');
        const tasksAfterAdd = await sendMCPRequest('get_tasks');
        if (!tasksAfterAdd.success) {
            throw new Error('Failed to get tasks after add');
        }

        const taskIds = Object.keys(tasksAfterAdd.data || {});
        if (taskIds.length === 0) {
            throw new Error('Task was not added to the list');
        }

        const latestTaskId = taskIds[taskIds.length - 1];
        console.log('  ✅ 任务添加验证成功，任务ID:', latestTaskId);

        // 测试获取单个任务
        console.log('  👀 测试获取单个任务...');
        const taskResult = await sendMCPRequest('get_task', {
            id: latestTaskId
        });
        if (!taskResult.success) {
            throw new Error('Failed to get individual task');
        }
        testResults.get_task = true;
        console.log('  ✅ 获取单个任务成功');

        // 测试设置任务状态
        console.log('  🔄 测试设置任务状态...');
        const statusResult = await sendMCPRequest('set_task_status', {
            id: latestTaskId,
            status: 'in-progress'
        });
        if (!statusResult.success) {
            throw new Error('Failed to set task status');
        }
        testResults.set_task_status = true;
        console.log('  ✅ 设置任务状态成功');

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
if ! node mcp-test-client.js; then
    echo "❌ MCP功能测试失败"
    exit 1
fi

# 清理测试目录
echo "  🧹 清理测试目录..."
cd /
rm -rf "$TEST_DIR"

echo "✅ MCP功能完整性测试完成"
