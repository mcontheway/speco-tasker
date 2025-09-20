/**
 * Simple unit test to verify Jest configuration
 */

// SCOPE: 测试 Jest 配置的基本功能，包括路径解析、mock和环境变量处理

import path from "node:path";

describe("Jest Configuration Test", () => {
	test("should resolve paths correctly", () => {
		const projectRoot = path.resolve(process.cwd(), "tests/..");
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
