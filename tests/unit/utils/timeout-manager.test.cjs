/**
 * Unit tests for timeout manager utilities
 */

const {
	withTimeout,
	withSoftTimeout,
	createTimeoutController,
	isTimeoutError,
	Duration,
} = require("../../../src/utils/timeout-manager.js");

// Import the actual classes for testing
const {
	StreamingError,
	STREAMING_ERROR_CODES,
} = require("../../../src/utils/stream-parser.js");

describe("Timeout Manager", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("withTimeout", () => {
		test("should resolve when promise resolves before timeout", async () => {
			const promise = Promise.resolve("success");
			const result = await withTimeout(promise, 1000, "Test operation");

			expect(result).toBe("success");
		});

		test("should reject with timeout error when promise takes too long", async () => {
			const slowPromise = new Promise((resolve) => {
				setTimeout(() => resolve("too late"), 200);
			});

			await expect(
				withTimeout(slowPromise, 100, "Slow operation"),
			).rejects.toThrow("Slow operation timed out after 0.1 seconds");
		});

		test("should reject with original error when promise rejects", async () => {
			const failingPromise = Promise.reject(new Error("Original error"));

			await expect(
				withTimeout(failingPromise, 1000, "Failing operation"),
			).rejects.toThrow("Original error");
		});

		test("should clear timeout when promise resolves first", async () => {
			const promise = Promise.resolve("success");
			const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

			await withTimeout(promise, 1000, "Test");

			expect(clearTimeoutSpy).toHaveBeenCalled();
			clearTimeoutSpy.mockRestore();
		});
	});

	describe("withSoftTimeout", () => {
		test("should return result when promise resolves before timeout", async () => {
			const promise = Promise.resolve("success");
			const result = await withSoftTimeout(promise, 1000);

			expect(result).toBe("success");
		});

		test("should return default value when promise times out", async () => {
			const slowPromise = new Promise((resolve) => {
				setTimeout(() => resolve("too late"), 200);
			});

			const result = await withSoftTimeout(slowPromise, 100, "default");

			expect(result).toBe("default");
		});

		test("should return default value when promise rejects", async () => {
			const failingPromise = Promise.reject(new Error("Original error"));

			const result = await withSoftTimeout(failingPromise, 1000, "fallback");

			expect(result).toBe("fallback");
		});
	});

	describe("createTimeoutController", () => {
		test("should create controller with specified timeout", () => {
			const controller = createTimeoutController(5000, "Test service");

			expect(controller.timeoutMs).toBe(5000);
			expect(controller.operationName).toBe("Test service");
		});

		test("should wrap promise with timeout", async () => {
			const controller = createTimeoutController(1000, "Test");
			const promise = Promise.resolve("success");

			const result = await controller.wrap(promise, "sub operation");

			expect(result).toBe("success");
		});

		test("should wrapSoft promise with default value", async () => {
			const controller = createTimeoutController(100, "Test");
			const slowPromise = new Promise((resolve) => {
				setTimeout(() => resolve("too late"), 200);
			});

			const result = await controller.wrapSoft(slowPromise, "default");

			expect(result).toBe("default");
		});
	});

	describe("isTimeoutError", () => {
		test("should return true for timeout errors", () => {
			const {
				StreamingError,
				STREAMING_ERROR_CODES,
			} = require("../../../src/utils/stream-parser.js");
			const timeoutError = new StreamingError(
				"Operation timed out after 5 seconds",
				STREAMING_ERROR_CODES.STREAM_PROCESSING_FAILED,
			);

			expect(isTimeoutError(timeoutError)).toBe(true);
		});

		test("should return false for non-timeout errors", () => {
			const regularError = new Error("Regular error");

			expect(isTimeoutError(regularError)).toBe(false);
		});

		test("should return false for streaming errors without timeout message", () => {
			const streamingError =
				new (require("../../../src/utils/stream-parser.js").StreamingError)(
					"Some other streaming error",
					"STREAM_PROCESSING_FAILED",
				);

			expect(isTimeoutError(streamingError)).toBe(false);
		});
	});

	describe("Duration", () => {
		test("should create duration from milliseconds", () => {
			const duration = new Duration(5000, "ms");

			expect(duration.milliseconds).toBe(5000);
			expect(duration.seconds).toBe(5);
		});

		test("should create duration from seconds", () => {
			const duration = new Duration(30, "s");

			expect(duration.milliseconds).toBe(30000);
			expect(duration.seconds).toBe(30);
		});

		test("should create duration from minutes", () => {
			const duration = new Duration(2, "m");

			expect(duration.milliseconds).toBe(120000);
			expect(duration.minutes).toBe(2);
		});

		test("should create duration from hours", () => {
			const duration = new Duration(1, "h");

			expect(duration.milliseconds).toBe(3600000);
			expect(duration.hours).toBe(1);
		});

		test("should provide static factory methods", () => {
			expect(Duration.milliseconds(1000).milliseconds).toBe(1000);
			expect(Duration.seconds(60).milliseconds).toBe(60000);
			expect(Duration.minutes(5).milliseconds).toBe(300000);
			expect(Duration.hours(2).milliseconds).toBe(7200000);
		});

		test("should format duration as string", () => {
			expect(Duration.milliseconds(500).toString()).toBe("500ms");
			expect(Duration.seconds(30).toString()).toBe("30s");
			expect(Duration.minutes(2).toString()).toBe("2m 0s");
			expect(Duration.hours(1).toString()).toBe("1h 0m");
		});

		test("should handle complex duration formatting", () => {
			const duration = new Duration(90000, "ms"); // 1.5 minutes
			expect(duration.toString()).toBe("1m 30s");
		});
	});
});
