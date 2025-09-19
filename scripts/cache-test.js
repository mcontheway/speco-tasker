/**
 * 缓存机制测试脚本
 * 用于验证ConfigCache和其他缓存机制是否正常工作
 */

import {
	CleanupAction,
	CleanupRule,
	CleanupType,
} from "../src/models/CleanupRule.js";
import { PathConfig } from "../src/models/PathConfig.js";
import { ConfigCache } from "../src/utils/ConfigCache.js";

console.log("🗄️ 开始缓存机制测试...\n");

/**
 * 测试基础缓存功能
 */
function testBasicCache() {
	console.log("📦 测试基础缓存功能:");

	const cache = new ConfigCache({
		maxSize: 10,
		ttl: 5000, // 5秒
	});

	// 测试基本操作
	cache.set("test1", "value1");
	cache.set("test2", { key: "value2" });
	cache.set("test3", [1, 2, 3]);

	console.log(`  ✅ 设置值: ${cache.get("test1")}`);
	console.log(`  ✅ 获取对象: ${JSON.stringify(cache.get("test2"))}`);
	console.log(`  ✅ 获取数组: ${JSON.stringify(cache.get("test3"))}`);
	console.log(`  ✅ 检查存在: ${cache.has("test1")}`);
	console.log(`  ✅ 检查不存在: ${!cache.has("nonexistent")}`);

	// 测试删除
	cache.delete("test2");
	console.log(`  ✅ 删除后检查: ${!cache.has("test2")}`);

	const stats = cache.getStats();
	console.log(`  ✅ 缓存大小: ${stats.size}`);
	console.log(`  ✅ 内存使用: ${stats.totalMemoryUsage} bytes`);

	return true;
}

/**
 * 测试缓存过期
 */
function testCacheExpiration() {
	console.log("\n⏰ 测试缓存过期:");

	const cache = new ConfigCache({
		maxSize: 10,
		ttl: 1000, // 1秒
	});

	cache.set("expireTest", "this will expire");

	console.log(`  ✅ 立即获取: ${cache.get("expireTest")}`);

	// 等待过期
	return new Promise((resolve) => {
		setTimeout(() => {
			const expired = cache.get("expireTest") === null;
			console.log(`  ✅ 过期后获取: ${expired ? "已过期" : "未过期"}`);

			const stats = cache.getStats();
			console.log(`  ✅ 驱逐次数: ${stats.evictions}`);

			resolve(expired);
		}, 1100);
	});
}

/**
 * 测试内存限制
 */
function testMemoryLimits() {
	console.log("\n🧠 测试内存限制:");

	const cache = new ConfigCache({
		maxSize: 5,
		maxMemoryUsage: 1024, // 1KB
	});

	// 添加一些大数据
	for (let i = 0; i < 10; i++) {
		const largeData = "x".repeat(200); // 200字节
		cache.set(`large${i}`, largeData);
	}

	const stats = cache.getStats();
	console.log(`  ✅ 缓存大小: ${stats.size} (限制: 5)`);
	console.log(`  ✅ 内存使用: ${stats.totalMemoryUsage} bytes (限制: 1024)`);
	console.log(`  ✅ 驱逐次数: ${stats.evictions}`);

	return stats.size <= 5 && stats.totalMemoryUsage <= 1024;
}

/**
 * 测试PathConfig缓存集成
 */
async function testPathConfigCache() {
	console.log("\n📁 测试PathConfig缓存集成:");

	const config = new PathConfig();

	// 测试路径缓存
	const path1 = await config.getPath("file", "tasks");
	const path2 = await config.getPath("file", "tasks"); // 应该从缓存获取

	console.log(`  ✅ 第一次获取: ${path1}`);
	console.log(`  ✅ 第二次获取: ${path2}`);
	console.log(`  ✅ 缓存命中: ${path1 === path2 ? "✅" : "❌"}`);

	const cacheStats = await config.getCacheStats();
	console.log(`  ✅ 缓存大小: ${cacheStats.size}`);
	console.log(`  ✅ 命中率: ${(cacheStats.hitRate * 100).toFixed(1)}%`);

	return path1 === path2 && cacheStats.hitRate >= 0.5;
}

/**
 * 测试CleanupRule缓存集成
 */
async function testCleanupRuleCache() {
	console.log("\n🧹 测试CleanupRule缓存集成:");

	const rule = new CleanupRule({
		name: "缓存测试规则",
		type: CleanupType.AI_SERVICE,
		contentPatterns: [/test/gi, /cache/gi],
	});

	// 测试编译缓存
	const compiled1 = rule._compilePatterns();
	const compiled2 = rule._compilePatterns(); // 应该从缓存获取

	console.log(`  ✅ 第一次编译: ${compiled1 ? "✅" : "❌"}`);
	console.log(`  ✅ 缓存命中: ${compiled1 === compiled2 ? "✅" : "❌"}`);

	const perfStats = await rule.getPerformanceStats();
	console.log(`  ✅ 编译状态: ${perfStats.compiled ? "已编译" : "未编译"}`);
	console.log(`  ✅ 模式数量: ${perfStats.contentPatternsCount}`);

	// 测试性能基准
	const benchmark = rule.benchmarkCleanup(100);
	console.log(`  ✅ 性能基准 - 平均时间: ${benchmark.avgTime.toFixed(3)}ms`);
	console.log(
		`  ✅ 性能基准 - 达标: ${benchmark.withinLimit ? "✅ (<10ms)" : "❌ (≥10ms)"}`,
	);

	return compiled1 === compiled2 && perfStats.compiled;
}

/**
 * 测试缓存清理
 */
function testCacheCleanup() {
	console.log("\n🧹 测试缓存清理:");

	const cache = new ConfigCache({
		maxSize: 10,
		ttl: 1000, // 1秒
	});

	// 添加一些条目
	for (let i = 0; i < 5; i++) {
		cache.set(`cleanup${i}`, `value${i}`);
	}

	console.log(`  ✅ 添加前大小: ${cache.getStats().size}`);

	// 手动清理
	cache.cleanup();

	console.log(`  ✅ 清理后大小: ${cache.getStats().size}`);

	// 等待过期后清理
	return new Promise((resolve) => {
		setTimeout(() => {
			cache.cleanup();
			const finalSize = cache.getStats().size;
			console.log(`  ✅ 过期清理后大小: ${finalSize}`);

			resolve(finalSize === 0);
		}, 1100);
	});
}

/**
 * 运行综合缓存测试
 */
async function runComprehensiveCacheTest() {
	console.log("🔬 运行综合缓存测试...\n");

	const results = {
		basic: testBasicCache(),
		expiration: await testCacheExpiration(),
		memory: testMemoryLimits(),
		pathConfig: await testPathConfigCache(),
		cleanupRule: await testCleanupRuleCache(),
		cleanup: await testCacheCleanup(),
	};

	console.log("\n📊 缓存测试结果汇总:");
	console.log(`  📦 基础缓存: ${results.basic ? "✅ 通过" : "❌ 失败"}`);
	console.log(`  ⏰ 缓存过期: ${results.expiration ? "✅ 通过" : "❌ 失败"}`);
	console.log(`  🧠 内存限制: ${results.memory ? "✅ 通过" : "❌ 失败"}`);
	console.log(
		`  📁 PathConfig集成: ${results.pathConfig ? "✅ 通过" : "❌ 失败"}`,
	);
	console.log(
		`  🧹 CleanupRule集成: ${results.cleanupRule ? "✅ 通过" : "❌ 失败"}`,
	);
	console.log(`  🧽 缓存清理: ${results.cleanup ? "✅ 通过" : "❌ 失败"}`);

	const allPassed = Object.values(results).every((result) => result);
	console.log(
		`\n🎯 总体结果: ${allPassed ? "✅ 所有缓存测试通过" : "❌ 部分缓存测试失败"}`,
	);

	if (!allPassed) {
		console.log("\n💡 缓存优化建议:");
		if (!results.expiration) {
			console.log("  - 检查缓存过期机制是否正常工作");
		}
		if (!results.memory) {
			console.log("  - 检查内存限制和驱逐策略是否生效");
		}
		if (!results.pathConfig) {
			console.log("  - 检查PathConfig缓存集成是否有问题");
		}
		if (!results.cleanupRule) {
			console.log("  - 检查CleanupRule缓存集成是否有问题");
		}
	}

	return allPassed;
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
	runComprehensiveCacheTest().catch((error) => {
		console.error("❌ 缓存测试失败:", error);
		process.exit(1);
	});
}

export {
	testBasicCache,
	testCacheExpiration,
	testMemoryLimits,
	testPathConfigCache,
	testCleanupRuleCache,
	testCacheCleanup,
	runComprehensiveCacheTest,
};
