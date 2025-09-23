#!/bin/bash

# Quick verification script for pre-push hooks
# Performs basic functionality checks without full E2E test suite

set -e

echo "🔍 运行快速功能验证..."

# Check if basic CLI commands work
echo "  📋 检查基本CLI命令..."

# Test --help (should not require any setup)
echo "    测试 --help 命令..."
if ! (node bin/speco-tasker.js --help > /dev/null 2>&1); then
    echo "❌ --help 命令失败"
    exit 1
fi

# Test --version
echo "    测试 --version 命令..."
if ! (node bin/speco-tasker.js --version > /dev/null 2>&1); then
    echo "❌ --version 命令失败"
    exit 1
fi

# Test list command (may fail if no tasks, but should not crash)
echo "    测试 list 命令..."
node bin/speco-tasker.js list > /dev/null 2>&1 || true

echo "  ✅ 基本CLI功能正常"

# Check if project structure is valid
echo "  📁 检查项目结构..."

if [ ! -f "package.json" ]; then
    echo "❌ package.json 不存在"
    exit 1
fi

if [ ! -d "src" ]; then
    echo "❌ src 目录不存在"
    exit 1
fi

if [ ! -f "bin/speco-tasker.js" ]; then
    echo "❌ 主执行文件不存在"
    exit 1
fi

echo "  ✅ 项目结构完整"

# Check if dependencies are installed
echo "  📦 检查依赖安装..."

if [ ! -d "node_modules" ]; then
    echo "❌ node_modules 不存在，请运行 npm install"
    exit 1
fi

# Quick syntax check on main files
echo "  🔍 快速语法检查..."

# Check main CLI file syntax
if ! node -c bin/speco-tasker.js; then
    echo "❌ bin/speco-tasker.js 语法错误"
    exit 1
fi

# Check main source file syntax
if ! node -c src/task-master.js; then
    echo "❌ src/task-master.js 语法错误"
    exit 1
fi

echo "  ✅ 语法检查通过"

echo "✅ 快速验证完成 - 项目基本功能正常"
