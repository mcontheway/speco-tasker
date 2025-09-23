/**
 * Unit tests for format utilities
 */

import { formatElapsedTime } from "../../../src/utils/format.js";

describe("Format Utilities", () => {
	describe("formatElapsedTime", () => {
		test("should format seconds correctly", () => {
			expect(formatElapsedTime(0)).toBe("0m 00s");
			expect(formatElapsedTime(59)).toBe("0m 59s");
			expect(formatElapsedTime(60)).toBe("1m 00s");
			expect(formatElapsedTime(61)).toBe("1m 01s");
			expect(formatElapsedTime(119)).toBe("1m 59s");
			expect(formatElapsedTime(120)).toBe("2m 00s");
		});

		test("should handle decimal seconds by flooring", () => {
			expect(formatElapsedTime(60.9)).toBe("1m 00s");
			expect(formatElapsedTime(61.5)).toBe("1m 01s");
		});

		test("should handle large time values", () => {
			expect(formatElapsedTime(3600)).toBe("60m 00s");
			expect(formatElapsedTime(3661)).toBe("61m 01s");
		});
	});
});
