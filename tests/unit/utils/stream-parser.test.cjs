/**
 * Unit tests for stream parser utilities
 */

const {
	StreamingError,
	STREAMING_ERROR_CODES,
	DEFAULT_MAX_BUFFER_SIZE,
} = require("../../../src/utils/stream-parser.js");

describe("Stream Parser", () => {
	describe("StreamingError", () => {
		test("should create error with message and code", () => {
			const error = new StreamingError("Test error message", "TEST_CODE");

			expect(error.message).toBe("Test error message");
			expect(error.name).toBe("StreamingError");
			expect(error.code).toBe("TEST_CODE");
		});

		test("should maintain proper instanceof relationship", () => {
			const error = new StreamingError("Test", "CODE");

			expect(error instanceof StreamingError).toBe(true);
			expect(error instanceof Error).toBe(true);
		});

		test("should have proper stack trace", () => {
			const error = new StreamingError("Test", "CODE");

			expect(error.stack).toBeDefined();
			expect(typeof error.stack).toBe("string");
		});
	});

	describe("STREAMING_ERROR_CODES", () => {
		test("should contain all expected error codes", () => {
			expect(STREAMING_ERROR_CODES).toEqual({
				NOT_ASYNC_ITERABLE: "STREAMING_NOT_SUPPORTED",
				STREAM_PROCESSING_FAILED: "STREAM_PROCESSING_FAILED",
				STREAM_NOT_ITERABLE: "STREAM_NOT_ITERABLE",
				BUFFER_SIZE_EXCEEDED: "BUFFER_SIZE_EXCEEDED",
			});
		});

		test("should have string values for all codes", () => {
			Object.values(STREAMING_ERROR_CODES).forEach((code) => {
				expect(typeof code).toBe("string");
				expect(code.length).toBeGreaterThan(0);
			});
		});

		test("should have unique error codes", () => {
			const codes = Object.values(STREAMING_ERROR_CODES);
			const uniqueCodes = new Set(codes);

			expect(uniqueCodes.size).toBe(codes.length);
		});
	});

	describe("DEFAULT_MAX_BUFFER_SIZE", () => {
		test("should be 1MB", () => {
			expect(DEFAULT_MAX_BUFFER_SIZE).toBe(1024 * 1024);
		});

		test("should be a reasonable size", () => {
			expect(DEFAULT_MAX_BUFFER_SIZE).toBeGreaterThan(0);
			expect(DEFAULT_MAX_BUFFER_SIZE).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
		});
	});

	// Note: parseStream and other complex functions would require more extensive mocking
	// and are better tested in integration tests
});
