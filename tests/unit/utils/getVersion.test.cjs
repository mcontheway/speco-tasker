/**
 * Unit tests for version utilities
 */

const fs = require("node:fs");
const path = require("node:path");

// Mock fs and path modules
jest.mock("node:fs");
jest.mock("node:path");
jest.mock("node:url");

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
			// Mock fileURLToPath and path functions
			const mockFileURLToPath = require("node:url").fileURLToPath;
			const mockPath = require("node:path");

			mockFileURLToPath.mockReturnValue("/path/to/src/utils/getVersion.js");
			mockPath.dirname.mockReturnValue("/path/to/src/utils");
			mockPath.join.mockImplementation((...args) => args.join("/"));
		});

		test("should return version from package.json", () => {
			const mockPackageJson = { version: "1.2.3" };

			fs.existsSync.mockReturnValue(true);
			fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

			const result = getTaskMasterVersion();
			expect(result).toBe("1.2.3");
			expect(fs.readFileSync).toHaveBeenCalledWith(
				"/path/to/src/utils/../../package.json",
				"utf8"
			);
		});

		test("should return 'unknown' when package.json does not exist", () => {
			fs.existsSync.mockReturnValue(false);

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
			expect(fs.readFileSync).not.toHaveBeenCalled();
		});

		test("should return 'unknown' when JSON parsing fails", () => {
			fs.existsSync.mockReturnValue(true);
			fs.readFileSync.mockReturnValue("invalid json");

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});

		test("should return 'unknown' when file reading fails", () => {
			fs.existsSync.mockReturnValue(true);
			fs.readFileSync.mockImplementation(() => {
				throw new Error("File read error");
			});

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});

		test("should handle version field missing from package.json", () => {
			const mockPackageJson = { name: "test" };

			fs.existsSync.mockReturnValue(true);
			fs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

			const result = getTaskMasterVersion();
			expect(result).toBe(undefined);
		});
	});
});
