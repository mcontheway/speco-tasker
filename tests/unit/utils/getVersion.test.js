/**
 * Unit tests for version utilities
 */

// Mock external dependencies before importing the module under test
import { vi } from "vitest";

vi.mock("../../../scripts/modules/utils.js", () => ({
	log: vi.fn(),
}));

// Import the module under test
import { getTaskMasterVersion } from "../../../src/utils/getVersion.js";

describe("Version Utilities", () => {
	describe("getTaskMasterVersion", () => {
		test("should return version from package.json", () => {
			// Test with real package.json - this should work in the test environment
			const result = getTaskMasterVersion();

			// Basic validation that we get a string result
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toBe("unknown");
		});
	});
});
