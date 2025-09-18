/**
 * Unit tests for task status constants and utilities
 */

const {
	TASK_STATUS_OPTIONS,
	isValidTaskStatus,
} = require("../../../src/constants/task-status.js");

describe("Task Status Constants", () => {
	describe("TASK_STATUS_OPTIONS", () => {
		test("should contain all expected status options", () => {
			expect(TASK_STATUS_OPTIONS).toEqual([
				"pending",
				"done",
				"in-progress",
				"review",
				"deferred",
				"cancelled",
			]);
		});

		test("should be an array", () => {
			expect(Array.isArray(TASK_STATUS_OPTIONS)).toBe(true);
		});

		test("should contain only strings", () => {
			TASK_STATUS_OPTIONS.forEach((status) => {
				expect(typeof status).toBe("string");
			});
		});

		test("should have reasonable length", () => {
			expect(TASK_STATUS_OPTIONS.length).toBeGreaterThan(0);
			expect(TASK_STATUS_OPTIONS.length).toBeLessThan(20);
		});
	});

	describe("isValidTaskStatus", () => {
		test("should return true for valid statuses", () => {
			const validStatuses = [
				"pending",
				"done",
				"in-progress",
				"review",
				"deferred",
				"cancelled",
			];

			validStatuses.forEach((status) => {
				expect(isValidTaskStatus(status)).toBe(true);
			});
		});

		test("should return false for invalid statuses", () => {
			const invalidStatuses = [
				"unknown",
				"completed",
				"waiting",
				"",
				null,
				undefined,
				123,
			];

			invalidStatuses.forEach((status) => {
				expect(isValidTaskStatus(status)).toBe(false);
			});
		});

		test("should handle edge cases", () => {
			expect(isValidTaskStatus("")).toBe(false);
			expect(isValidTaskStatus(null)).toBe(false);
			expect(isValidTaskStatus(undefined)).toBe(false);
			expect(isValidTaskStatus(123)).toBe(false);
			expect(isValidTaskStatus({})).toBe(false);
			expect(isValidTaskStatus([])).toBe(false);
		});

		test("should be case sensitive", () => {
			expect(isValidTaskStatus("PENDING")).toBe(false);
			expect(isValidTaskStatus("Done")).toBe(false);
			expect(isValidTaskStatus("IN-PROGRESS")).toBe(false);
		});
	});
});
