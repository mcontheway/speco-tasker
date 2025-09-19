/**
 * Unit tests for task priority constants and utilities
 */

import {
	DEFAULT_TASK_PRIORITY,
	TASK_PRIORITY_OPTIONS,
	isValidTaskPriority,
	normalizeTaskPriority,
} from "../../../src/constants/task-priority.js";

describe("Task Priority Constants", () => {
	describe("TASK_PRIORITY_OPTIONS", () => {
		test("should contain all expected priority options", () => {
			expect(TASK_PRIORITY_OPTIONS).toEqual(["high", "medium", "low"]);
		});

		test("should be an array", () => {
			expect(Array.isArray(TASK_PRIORITY_OPTIONS)).toBe(true);
		});

		test("should contain only strings", () => {
			expect(
				TASK_PRIORITY_OPTIONS.every((option) => typeof option === "string"),
			).toBe(true);
		});

		test("should have reasonable length", () => {
			expect(TASK_PRIORITY_OPTIONS.length).toBeGreaterThan(0);
			expect(TASK_PRIORITY_OPTIONS.length).toBeLessThanOrEqual(5);
		});
	});

	describe("DEFAULT_TASK_PRIORITY", () => {
		test("should be a valid priority", () => {
			expect(TASK_PRIORITY_OPTIONS).toContain(DEFAULT_TASK_PRIORITY);
		});

		test("should be medium priority", () => {
			expect(DEFAULT_TASK_PRIORITY).toBe("medium");
		});

		test("should be a string", () => {
			expect(typeof DEFAULT_TASK_PRIORITY).toBe("string");
		});
	});

	describe("isValidTaskPriority", () => {
		test("should return true for valid priorities", () => {
			expect(isValidTaskPriority("high")).toBe(true);
			expect(isValidTaskPriority("medium")).toBe(true);
			expect(isValidTaskPriority("low")).toBe(true);
		});

		test("should return true for valid priorities with different case", () => {
			expect(isValidTaskPriority("HIGH")).toBe(true);
			expect(isValidTaskPriority("Medium")).toBe(true);
			expect(isValidTaskPriority("LOW")).toBe(true);
		});

		test("should return false for invalid priorities", () => {
			expect(isValidTaskPriority("urgent")).toBe(false);
			expect(isValidTaskPriority("critical")).toBe(false);
			expect(isValidTaskPriority("")).toBe(false);
		});

		test("should handle edge cases", () => {
			expect(isValidTaskPriority(null)).toBe(false);
			expect(isValidTaskPriority(undefined)).toBe(false);
			expect(isValidTaskPriority(123)).toBe(false);
			expect(isValidTaskPriority({})).toBe(false);
		});
	});

	describe("normalizeTaskPriority", () => {
		test("should normalize valid priorities to lowercase", () => {
			expect(normalizeTaskPriority("HIGH")).toBe("high");
			expect(normalizeTaskPriority("Medium")).toBe("medium");
			expect(normalizeTaskPriority("LOW")).toBe("low");
		});

		test("should return the same value for already lowercase valid priorities", () => {
			expect(normalizeTaskPriority("high")).toBe("high");
			expect(normalizeTaskPriority("medium")).toBe("medium");
			expect(normalizeTaskPriority("low")).toBe("low");
		});

		test("should return null for invalid priorities", () => {
			expect(normalizeTaskPriority("urgent")).toBe(null);
			expect(normalizeTaskPriority("critical")).toBe(null);
			expect(normalizeTaskPriority("")).toBe(null);
		});

		test("should handle edge cases", () => {
			expect(normalizeTaskPriority(null)).toBe(null);
			expect(normalizeTaskPriority(undefined)).toBe(null);
			expect(normalizeTaskPriority(123)).toBe(null);
			expect(normalizeTaskPriority({})).toBe(null);
		});

		test("should handle whitespace", () => {
			expect(normalizeTaskPriority("  HIGH  ")).toBe("high");
			expect(normalizeTaskPriority(" medium ")).toBe("medium");
		});
	});
});
