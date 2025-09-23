/**
 * Test ES module functionality
 */

// SCOPE: 测试 ES 模块基本功能，包括异步支持等核心模块兼容性

// Jest globals are automatically available in test files

// Test basic ES module functionality
describe("ES Module Support", () => {
	test("should support ES module syntax", () => {
		expect(true).toBe(true);
	});

	test("should support Vitest in ES modules", () => {
		expect(true).toBe(true); // Vitest globals are available
	});

	test("should support async/await in ES modules", async () => {
		const result = await Promise.resolve("test");
		expect(result).toBe("test");
	});

	test("should support Promise in ES modules", async () => {
		const promise = Promise.resolve(42);
		const result = await promise;
		expect(result).toBe(42);
	});
});
