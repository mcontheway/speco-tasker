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

# 运行CLI功能验证
echo ""
echo "💻 第二阶段：CLI功能完整性验证"
echo "------------------------------"
if bash tests/e2e/cli-functionality-test.sh; then
    echo "✅ CLI功能验证通过"
else
    echo "❌ CLI功能验证失败"
    exit 1
fi

# 运行MCP功能验证
echo ""
echo "🔌 第三阶段：MCP功能完整性验证"
echo "------------------------------"
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
if bash tests/e2e/cross-interface-consistency-test.sh; then
    echo "✅ 跨界面一致性验证通过"
else
    echo "❌ 跨界面一致性验证失败"
    exit 1
fi

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
