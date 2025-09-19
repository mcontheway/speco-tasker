/**
 * Unit tests for version utilities
 */

const fs = require("node:fs");
const path = require("node:path");
const { fileURLToPath } = require("node:url");

// Mock fs and path modules with proper mock implementations
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockDirname = jest.fn();
const mockJoin = jest.fn();
const mockFileURLToPath = jest.fn();

jest.mock("node:fs", () => ({
	existsSync: mockExistsSync,
	readFileSync: mockReadFileSync,
}));
jest.mock("node:path", () => ({
	dirname: mockDirname,
	join: mockJoin,
}));
jest.mock("node:url", () => ({
	fileURLToPath: mockFileURLToPath,
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
			mockFileURLToPath.mockReturnValue("/path/to/src/utils/getVersion.js");
			mockDirname.mockReturnValue("/path/to/src/utils");
			mockJoin.mockImplementation((...args) => args.join("/"));
		});

		test("should return version from package.json", () => {
			const mockPackageJson = { version: "1.2.3" };

			mockExistsSync.mockReturnValue(true);
			mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

			const result = getTaskMasterVersion();
			expect(result).toBe("1.2.3");
			expect(fs.readFileSync).toHaveBeenCalledWith(
				"/path/to/src/utils/../../package.json",
				"utf8",
			);
		});

		test("should return 'unknown' when package.json does not exist", () => {
			mockExistsSync.mockReturnValue(false);

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
			expect(fs.readFileSync).not.toHaveBeenCalled();
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
			expect(result).toBe(undefined);
		});
	});
});
