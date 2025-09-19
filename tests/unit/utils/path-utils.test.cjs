/**
 * Unit tests for path utilities
 */

const path = require("node:path");
const fs = require("node:fs");

// Mock fs and path modules for testing with proper implementations
const mockExistsSync = jest.fn();
const mockMkdirSync = jest.fn();
const mockResolve = jest.fn();
const mockDirname = jest.fn();
const mockIsAbsolute = jest.fn();
const mockBasename = jest.fn();
const mockParse = jest.fn();
const mockJoin = jest.fn();

jest.mock("node:fs", () => ({
	existsSync: mockExistsSync,
	mkdirSync: mockMkdirSync,
}));
jest.mock("node:path", () => ({
	resolve: mockResolve,
	dirname: mockDirname,
	isAbsolute: mockIsAbsolute,
	basename: mockBasename,
	parse: mockParse,
	join: mockJoin,
	sep: "/",
}));

// Mock the utils module to avoid import.meta.url issues
jest.mock("../../../scripts/modules/utils.js", () => ({
	log: jest.fn(),
	findProjectRoot: jest.fn(() => "/mock/project/root"),
	isEmpty: jest.fn(() => false),
	resolveEnvVariable: jest.fn(() => "mock_value"),
}));

// Mock config-manager to avoid import.meta.url issues
jest.mock("../../../scripts/modules/config-manager.js", () => ({
	getDebugFlag: jest.fn(() => false),
	getLogLevel: jest.fn(() => "info"),
}));

// Import after mocking
const {
	normalizeProjectRoot,
	findProjectRoot,
	resolveTasksOutputPath,
} = require("../../../src/utils/path-utils.js");

describe("Path Utilities", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("normalizeProjectRoot", () => {
		test("should return input when no .taskmaster or .speco segment exists", () => {
			const input = "/home/user/project";
			const result = normalizeProjectRoot(input);
			expect(result).toBe(input);
		});


		test("should remove .taskmaster segment and everything after it", () => {
			const input = "/home/user/project/.taskmaster/tasks";
			const result = normalizeProjectRoot(input);
			expect(result).toBe("/home/user/project");
		});

		test("should handle .taskmaster at the end", () => {
			const input = "/home/user/project/.taskmaster";
			const result = normalizeProjectRoot(input);
			expect(result).toBe("/home/user/project");
		});

		test("should remove .speco segment and everything after it", () => {
			const input = "/home/user/project/.speco/tasks";
			const result = normalizeProjectRoot(input);
			expect(result).toBe("/home/user/project");
		});

		test("should handle .speco at the end", () => {
			const input = "/home/user/project/.speco";
			const result = normalizeProjectRoot(input);
			expect(result).toBe("/home/user/project");
		});

		test("should handle empty input", () => {
			expect(normalizeProjectRoot("")).toBe("");
			expect(normalizeProjectRoot(null)).toBe(null);
			expect(normalizeProjectRoot(undefined)).toBe(undefined);
		});

		test("should convert non-string input to string", () => {
			const result = normalizeProjectRoot(123);
			expect(result).toBe("123");
		});
	});

	describe("findProjectRoot", () => {
		beforeEach(() => {
			// Mock path functions
			mockResolve.mockImplementation((...args) => args.join("/"));
			mockDirname.mockImplementation(
				(p) => p.split("/").slice(0, -1).join("/") || "/",
			);
			mockIsAbsolute.mockReturnValue(false);
			mockBasename.mockImplementation((p) => p.split("/").pop() || "");
			mockParse.mockReturnValue({ root: "/" });
		});

		test("should return cwd when no project markers found", () => {
			mockExistsSync.mockReturnValue(false);
			process.cwd = jest.fn().mockReturnValue("/current/dir");

			const result = findProjectRoot("/start/dir");
			expect(result).toBe("/current/dir");
		});

		test("should find project root with .speco marker", () => {
			mockExistsSync.mockImplementation(
				(p) => typeof p === "string" && (p.includes(".speco") || p.includes(".taskmaster")),
			);
			mockResolve.mockImplementation((p) => p);
			process.cwd = jest.fn().mockReturnValue("/current/dir");

			const result = findProjectRoot("/home/user/project/src");
			expect(result).toBe("/home/user/project/src");
		});
	});

	describe("resolveTasksOutputPath", () => {
		beforeEach(() => {
			mockIsAbsolute.mockReturnValue(false);
			mockResolve.mockImplementation((...args) => args.join("/"));
			mockDirname.mockImplementation(
				(p) => p.split("/").slice(0, -1).join("/") || "/",
			);
			mockJoin.mockImplementation((...args) => args.join("/"));
		});

		test("should return explicit absolute path", () => {
			mockIsAbsolute.mockReturnValue(true);
			mockResolve.mockImplementation((...args) => args.join("/"));
			mockDirname.mockImplementation(
				(p) => p.split("/").slice(0, -1).join("/") || "/",
			);
			const result = resolveTasksOutputPath("/explicit/path/tasks.json");
			expect(result).toBe("/explicit/path/tasks.json");
		});

		test("should resolve explicit relative path", () => {
			const result = resolveTasksOutputPath("custom/tasks.json");
			expect(mockResolve).toHaveBeenCalledWith(
				process.cwd(),
				"custom/tasks.json",
			);
		});

		test("should create default .speco path when no explicit path", () => {
			mockExistsSync.mockReturnValue(false);

			resolveTasksOutputPath(null, { projectRoot: "/project" });

			expect(mockMkdirSync).toHaveBeenCalledWith(
				expect.stringContaining(".speco"),
				{ recursive: true },
			);
		});
	});
});
