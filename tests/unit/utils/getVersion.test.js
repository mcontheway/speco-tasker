/**
 * Unit tests for version utilities
 */

// Mock the utils module first
jest.mock("../../../scripts/modules/utils.js", () => ({
	log: jest.fn(),
}));

// Mock fs and path modules - declare mocks inline
jest.mock("node:fs", () => ({
	existsSync: jest.fn(),
	readFileSync: jest.fn(),
}));
jest.mock("node:path", () => ({
	resolve: jest.fn(),
}));

// Import after mocking
import { getTaskMasterVersion } from "../../../src/utils/getVersion.js";

// Get references to mocked functions
const mockFs = jest.mocked(require("node:fs"));
const mockPath = jest.mocked(require("node:path"));

describe("Version Utilities", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getTaskMasterVersion", () => {
		beforeEach(() => {
			mockPath.resolve.mockImplementation((...args) => {
				return args.join("/");
			});
		});

		test("should return version from package.json", () => {
			const mockPackageJson = { version: "1.2.3" };

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

			const result = getTaskMasterVersion();
			expect(result).toBe("1.2.3");
			expect(mockFs.readFileSync).toHaveBeenCalledWith("package.json", "utf8");
		});

		test("should return 'unknown' when package.json does not exist", () => {
			mockFs.existsSync.mockReturnValue(false);

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
			expect(mockFs.readFileSync).not.toHaveBeenCalled();
		});

		test("should return 'unknown' when JSON parsing fails", () => {
			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue("invalid json");

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});

		test("should return 'unknown' when file reading fails", () => {
			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockImplementation(() => {
				throw new Error("File read error");
			});

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});

		test("should handle version field missing from package.json", () => {
			const mockPackageJson = { name: "test" };

			mockFs.existsSync.mockReturnValue(true);
			mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

			const result = getTaskMasterVersion();
			expect(result).toBe("unknown");
		});
	});
});
