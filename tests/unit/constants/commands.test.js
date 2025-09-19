/**
 * Unit tests for command constants
 */

import { AI_COMMAND_NAMES } from "../../../src/constants/commands.js";

describe("Command Constants", () => {
	describe("AI_COMMAND_NAMES", () => {
		test("should be an array", () => {
			expect(Array.isArray(AI_COMMAND_NAMES)).toBe(true);
		});

		test("should be empty array (no AI commands)", () => {
			expect(AI_COMMAND_NAMES).toEqual([]);
		});

		test("should have length 0", () => {
			expect(AI_COMMAND_NAMES.length).toBe(0);
		});

		test("should contain only strings if not empty", () => {
			// This test will pass even if array grows in future
			if (AI_COMMAND_NAMES.length > 0) {
				expect(AI_COMMAND_NAMES.every(name => typeof name === "string")).toBe(true);
			}
		});
	});
});
