/**
 * Unit tests for version utilities
 */

const fs = require("node:fs");
const path = require("node:path");

// Mock fs and path modules with proper mock implementations
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockResolve = jest.fn();

jest.mock("node:fs", () => ({
	existsSync: mockExistsSync,
	readFileSync: mockReadFileSync,
}));
jest.mock("node:path", () => ({
	resolve: mockResolve,
}));

// Mock the utils module
jest.mock("../../../scripts/modules/utils.js", () => ({
	log: jest.fn(),
}));

// Import after mocking
const { getTaskMasterVersion } = require("../../../src/utils/getVersion.js");

describe("Version Utilities", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getTaskMasterVersion", () => {
		beforeEach(() => {
			mockResolve.mockImplementation((...args) => {
				return args.join("/");
			});
		});

		test("should return version from package.json", () => {
			const mockPackageJson = { version: "1.2.3" };

			mockExistsSync.mockReturnValue(true);
			mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

			const result = getTaskMasterVersion();
			expect(result).toBe("1.2.3");
			expect(mockReadFileSync).toHaveBeenCalledWith(
				"package.json",
				"utf8",
			);
		});

		test("should return 'unknown' when package.json does not exist", () => {
			mockExistsSync.mockReturnValue(false);

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
			expect(mockReadFileSync).not.toHaveBeenCalled();
		});

		test("should return 'unknown' when JSON parsing fails", () => {
			mockExistsSync.mockReturnValue(true);
			mockReadFileSync.mockReturnValue("invalid json");

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});

		test("should return 'unknown' when file reading fails", () => {
			mockExistsSync.mockReturnValue(true);
			mockReadFileSync.mockImplementation(() => {
				throw new Error("File read error");
			});

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});

		test("should handle version field missing from package.json", () => {
			const mockPackageJson = { name: "test" };

			mockExistsSync.mockReturnValue(true);
			mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});
	});
});
