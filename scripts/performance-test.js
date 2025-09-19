/**
 * 性能测试脚本
 * 用于验证PathConfig和CleanupRule的性能优化效果
 */

import {
	CleanupAction,
	CleanupRule,
	CleanupType,
} from "../src/models/CleanupRule.js";
import { PathConfig } from "../src/models/PathConfig.js";

console.log("🚀 开始性能测试...\n");

/**
 * 测试PathConfig性能
 */
function testPathConfigPerformance() {
	console.log("📁 测试 PathConfig 路径解析性能:");

	const config = new PathConfig();
	const benchmark = config.benchmarkPathResolution(10000);

	console.log(`  ✅ 总时间: ${benchmark.totalTime}ms`);
	console.log(`  ✅ 平均时间: ${benchmark.avgTime.toFixed(3)}ms`);
	console.log(`  ✅ 迭代次数: ${benchmark.iterations}`);
	console.log(`  ✅ 缓存大小: ${benchmark.cacheSize}`);
	console.log(
		`  ✅ 性能达标: ${benchmark.withinLimit ? "✅ (<100ms)" : "❌ (≥100ms)"}\n`,
	);

	return benchmark.withinLimit;
}

/**
 * 测试CleanupRule性能
 */
function testCleanupRulePerformance() {
	console.log("🧹 测试 CleanupRule 清理操作性能:");

	const rule = new CleanupRule({
		name: "AI服务清理",
		type: CleanupType.AI_SERVICE,
		contentPatterns: [/AI_SERVICE/gi, /aiService/gi, /OpenAI/gi, /anthropic/gi],
		action: CleanupAction.REMOVE,
	});

	const benchmark = rule.benchmarkCleanup(1000);

	console.log(`  ✅ 总时间: ${benchmark.totalTime}ms`);
	console.log(`  ✅ 平均时间: ${benchmark.avgTime.toFixed(3)}ms`);
	console.log(`  ✅ 迭代次数: ${benchmark.iterations}`);
	console.log(`  ✅ 匹配次数: ${benchmark.totalMatches}`);
	console.log(`  ✅ 处理次数: ${benchmark.totalProcessed}`);
	console.log(`  ✅ 匹配效率: ${(benchmark.efficiency * 100).toFixed(1)}%`);
	console.log(
		`  ✅ 性能达标: ${benchmark.withinLimit ? "✅ (<10ms)" : "❌ (≥10ms)"}\n`,
	);

	return benchmark.withinLimit;
}

/**
 * 测试缓存机制
 */
function testCachingMechanism() {
	console.log("💾 测试缓存机制:");

	const config = new PathConfig();

	// 测试路径缓存
	console.log("  📂 路径缓存测试:");
	const path1 = config.getPath("file", "tasks");
	const path2 = config.getPath("file", "tasks"); // 应该从缓存获取

	console.log(`    第一次获取: ${path1}`);
	console.log(`    第二次获取: ${path2}`);
	console.log(`    缓存命中: ${path1 === path2 ? "✅" : "❌"}`);

	const cacheStats = config.getCacheStats();
	console.log(`    缓存大小: ${cacheStats.size}`);
	console.log(
		`    缓存时间戳: ${new Date(cacheStats.timestamp).toLocaleString()}`,
	);

	// 测试规则编译缓存
	console.log("\n  🔧 规则编译缓存测试:");
	const rule = new CleanupRule({
		contentPatterns: [/test/gi, /demo/gi],
		validationPatterns: [/valid/gi],
	});

	console.log(
		`    编译前: ${rule._compiledPatterns === null ? "✅ 未编译" : "❌ 已编译"}`,
	);

	const compiled1 = rule._compilePatterns();
	console.log(`    第一次编译: ${compiled1 ? "✅ 成功" : "❌ 失败"}`);

	const compiled2 = rule._compilePatterns();
	console.log(`    缓存命中: ${compiled1 === compiled2 ? "✅" : "❌"}`);

	console.log(`    内容模式数量: ${compiled1.contentPatterns.length}`);
	console.log(`    验证模式数量: ${compiled1.validationPatterns.length}`);

	const perfStats = rule.getPerformanceStats();
	console.log(`    性能统计: ${JSON.stringify(perfStats, null, 2)}\n`);
}

/**
 * 运行综合性能测试
 */
async function runComprehensiveTest() {
	console.log("🔬 运行综合性能测试...\n");

	const results = {
		pathConfig: testPathConfigPerformance(),
		cleanupRule: testCleanupRulePerformance(),
	};

	testCachingMechanism();

	console.log("📊 测试结果汇总:");
	console.log(
		`  📁 PathConfig 性能: ${results.pathConfig ? "✅ 通过" : "❌ 失败"}`,
	);
	console.log(
		`  🧹 CleanupRule 性能: ${results.cleanupRule ? "✅ 通过" : "❌ 失败"}`,
	);

	const allPassed = Object.values(results).every((result) => result);
	console.log(
		`\n🎯 总体结果: ${allPassed ? "✅ 所有性能测试通过" : "❌ 部分性能测试失败"}`,
	);

	if (!allPassed) {
		console.log("\n💡 性能优化建议:");
		if (!results.pathConfig) {
			console.log("  - PathConfig 路径解析性能未达标，请检查缓存机制");
		}
		if (!results.cleanupRule) {
			console.log("  - CleanupRule 清理操作性能未达标，请检查正则表达式编译");
		}
	}

	return allPassed;
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
	runComprehensiveTest().catch((error) => {
		console.error("❌ 性能测试失败:", error);
		process.exit(1);
	});
}

export {
	testPathConfigPerformance,
	testCleanupRulePerformance,
	testCachingMechanism,
	runComprehensiveTest,
};
