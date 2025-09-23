#!/bin/bash
# tests/monitor-test-quality.sh
# 测试质量监控脚本
# 用于定期检查测试环境的健康状态和质量指标

set -e  # 遇到错误立即退出

echo "📊 测试质量监控报告"
echo "生成时间: $(date)"
echo "========================================"

# 检查测试覆盖率
echo ""
echo "🧪 测试覆盖率检查..."
if npm run test:coverage > /dev/null 2>&1; then
    # 尝试从 HTML 报告中提取覆盖率
    if [ -f "coverage/lcov-report/index.html" ]; then
        # 使用 grep 提取覆盖率百分比
        coverage_info=$(grep -o "[0-9.]*%" coverage/lcov-report/index.html | head -5)
        echo "✅ 覆盖率报告生成成功"
        echo "详细报告: coverage/lcov-report/index.html"

        # 提取总覆盖率
        total_coverage=$(echo "$coverage_info" | head -1)
        if [ ! -z "$total_coverage" ]; then
            echo "当前总覆盖率: $total_coverage"
        fi
    else
        echo "⚠️  覆盖率报告文件不存在"
    fi
else
    echo "❌ 覆盖率检查失败"
fi

# 检查测试文件数量
echo ""
echo "📁 测试文件统计..."
test_count=$(find tests -name "*.test.js" -o -name "*.test.mjs" -o -name "*.test.cjs" 2>/dev/null | wc -l)
integration_test_count=$(find tests -name "*integration*.test.js" 2>/dev/null | wc -l)
unit_test_count=$(find tests -name "*.test.js" ! -name "*integration*" ! -name "*e2e*" 2>/dev/null | wc -l)

echo "总测试文件数: $test_count"
echo "单元测试文件: $unit_test_count"
echo "集成测试文件: $integration_test_count"

# 检查 Vitest 就绪标记
echo ""
echo "🏷️  Vitest 兼容性检查..."
vitest_ready_count=$(grep -r "@vitest-ready" tests/ 2>/dev/null | wc -l)
vitest_ready_files=$(grep -l "@vitest-ready" tests/*/* 2>/dev/null | wc -l)

echo "Vitest 就绪标记: $vitest_ready_count (个)"
echo "Vitest 就绪文件: $vitest_ready_files (个)"

# 检查 graceful-fs 影响标记
echo ""
echo "🔍 graceful-fs 影响评估..."
graceful_fs_impacted=$(grep -r "graceful-fs-impact" tests/ 2>/dev/null | wc -l)

echo "已标记 graceful-fs 影响: $graceful_fs_impacted (个)"

# 质量评估
echo ""
echo "📈 质量评估结果:"
echo "----------------------------------------"

# 覆盖率评估
if [ -f "coverage/lcov-report/index.html" ]; then
    # 简单的覆盖率检查（需要 bc 命令）
    if command -v bc >/dev/null 2>&1; then
        coverage_num=$(echo "$total_coverage" | sed 's/%//')
        if (( $(echo "$coverage_num < 70" | bc -l 2>/dev/null || echo "1") )); then
            echo "⚠️  警告: 测试覆盖率 ($total_coverage) 低于 70% 目标"
        else
            echo "✅ 覆盖率达标: $total_coverage ≥ 70%"
        fi
    fi
else
    echo "⚠️  警告: 无法获取覆盖率数据"
fi

# 测试数量评估
if [ "$test_count" -lt 50 ]; then
    echo "🚨 警报: 测试文件数量 ($test_count) 过少，建议 >50 个"
elif [ "$test_count" -lt 30 ]; then
    echo "🔴 紧急: 测试文件数量 ($test_count) 严重不足"
else
    echo "✅ 测试数量充足: $test_count 个文件"
fi

# Vitest 迁移准备度
if [ "$vitest_ready_files" -gt 0 ]; then
    migration_readiness=$((vitest_ready_files * 100 / test_count))
    echo "📊 Vitest 迁移准备度: $migration_readiness% ($vitest_ready_files/$test_count)"
else
    echo "⚠️  注意: 尚未开始 Vitest 兼容性标记"
fi

# 运行严格测试检查
echo ""
echo "🔬 严格测试检查..."
if npm run test:ci:strict > /dev/null 2>&1; then
    echo "✅ 严格测试模式: 通过"
else
    echo "❌ 严格测试模式: 失败 (graceful-fs 问题仍然存在)"
fi

# 输出建议
echo ""
echo "💡 建议:"
echo "----------------------------------------"
if [ "$vitest_ready_files" -eq 0 ]; then
    echo "- 开始为新测试添加 @vitest-ready 标记"
fi
if [ "$graceful_fs_impacted" -lt "$test_count" ]; then
    echo "- 为现有测试添加 graceful-fs-impact 评估"
fi
echo "- 保持测试覆盖率 ≥70%"
echo "- 每周运行此监控脚本"

echo ""
echo "📅 下次检查建议: $(date -v+7d '+%Y-%m-%d')"

echo ""
echo "========================================"
echo "监控报告完成"
