/**
 * @vitest-ready: full
 * @graceful-fs-impact: none
 * @migration-priority: high
 *
 * 这个测试文件展示了如何编写 Vitest 兼容的测试
 * 它完全不依赖 graceful-fs，不会受到当前测试环境问题的影响
 *
 * 标记说明:
 * - @vitest-ready: full - 完全兼容 Vitest，可以直接迁移
 * - @graceful-fs-impact: none - 不受 graceful-fs 问题影响
 * - @migration-priority: high - 优先迁移
 */

import { describe, it, expect } from "vitest";

describe("Vitest Ready Example - Utility Functions", () => {
	describe("纯函数测试示例", () => {
		it("should handle basic arithmetic", () => {
			// ✅ 标准断言，Vitest 完全兼容
			expect(2 + 2).toBe(4);
			expect(10 - 5).toBe(5);
		});

		it("should handle string operations", () => {
			// ✅ 字符串操作，Vitest 完全兼容
			const result = "hello".toUpperCase();
			expect(result).toBe("HELLO");
			expect(result.length).toBe(5);
		});

		it("should work with arrays", () => {
			// ✅ 数组操作，Vitest 完全兼容
			const arr = [1, 2, 3, 4, 5];
			expect(arr.length).toBe(5);
			expect(arr.includes(3)).toBe(true);
			expect(arr.filter((x) => x > 2)).toEqual([3, 4, 5]);
		});
	});

	describe("对象操作测试", () => {
		it("should handle object properties", () => {
			// ✅ 对象操作，Vitest 完全兼容
			const obj = { name: "test", value: 42 };
			expect(obj.name).toBe("test");
			expect(obj.value).toBe(42);
			expect(obj).toHaveProperty("name");
		});

		it("should work with object spread", () => {
			// ✅ 对象展开，现代 JavaScript 特性
			const base = { a: 1, b: 2 };
			const extended = { ...base, c: 3 };
			expect(extended).toEqual({ a: 1, b: 2, c: 3 });
		});
	});

	describe("异步操作测试", () => {
		it("should handle promises", async () => {
			// ✅ Promise 测试，Vitest 完全兼容
			const promise = Promise.resolve("success");
			await expect(promise).resolves.toBe("success");
		});

		it("should handle async/await", async () => {
			// ✅ async/await 语法，Vitest 完全兼容
			const result = await Promise.resolve(42);
			expect(result).toBe(42);
		});
	});

	describe("错误处理测试", () => {
		it("should handle thrown errors", () => {
			// ✅ 错误断言，Vitest 兼容
			expect(() => {
				throw new Error("test error");
			}).toThrow("test error");
		});

		it("should handle error types", () => {
			// ✅ 错误类型检查，Vitest 兼容
			expect(() => {
				throw new TypeError("type error");
			}).toThrow(TypeError);
		});
	});
});

/**
 * 迁移指南：
 *
 * 1. 将 require('@jest/globals') 改为 import { describe, it, expect } from 'vitest'
 * 2. 移除 @jest/globals 依赖
 * 3. 更新 package.json 中的测试脚本
 * 4. 可能需要调整一些配置选项
 *
 * 迁移后的代码示例：
 *
 * import { describe, it, expect } from 'vitest';
 *
 * describe('Vitest Ready Example - Utility Functions', () => {
 *   // ... 其余代码完全不需要修改
 * });
 */
