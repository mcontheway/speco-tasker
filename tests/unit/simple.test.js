/**
 * Simple unit test to verify Jest configuration
 */

const path = require("node:path");

describe("Jest Configuration Test", () => {
	test("should resolve paths correctly", () => {
		const projectRoot = path.resolve(__dirname, "../..");
		expect(projectRoot).toBeDefined();
		expect(typeof projectRoot).toBe("string");
	});

	test("should handle basic mocking", () => {
		const mockFn = jest.fn().mockReturnValue("mocked");
		expect(mockFn()).toBe("mocked");
	});

	test("should work with environment variables", () => {
		process.env.TEST_VAR = "test_value";
		expect(process.env.TEST_VAR).toBe("test_value");
		process.env.TEST_VAR = undefined;
	});
});
