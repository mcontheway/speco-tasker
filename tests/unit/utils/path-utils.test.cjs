/**
 * Unit tests for path utilities
 */

const path = require("node:path");
const fs = require("node:fs");

// Mock fs and path modules for testing with proper implementations
jest.mock("node:fs", () => ({
	existsSync: jest.fn(),
}));
jest.mock("node:path", () => ({
	resolve: jest.fn(),
	dirname: jest.fn(),
	isAbsolute: jest.fn(),
	basename: jest.fn(),
	parse: jest.fn(),
	join: jest.fn(),
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
		test("should return input when no .taskmaster segment exists", () => {
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
			path.resolve.mockImplementation((...args) => args.join("/"));
			path.dirname.mockImplementation(
				(p) => p.split("/").slice(0, -1).join("/") || "/",
			);
			path.isAbsolute.mockImplementation(() => false);
			path.basename.mockImplementation((p) => p.split("/").pop() || "");
			path.parse.mockImplementation(() => ({ root: "/" }));
		});

		test("should return cwd when no project markers found", () => {
			fs.existsSync.mockImplementation(() => false);
			process.cwd = jest.fn().mockReturnValue("/current/dir");

			const result = findProjectRoot("/start/dir");
			expect(result).toBe("/current/dir");
		});

		test("should find project root with .taskmaster marker", () => {
			fs.existsSync.mockImplementation((p) => typeof p === 'string' && p.includes(".taskmaster"));
			path.resolve.mockImplementation((p) => p);
			process.cwd = jest.fn().mockReturnValue("/current/dir");

			const result = findProjectRoot("/home/user/project/src");
			expect(result).toBe("/home/user/project/src");
		});
	});

	describe("resolveTasksOutputPath", () => {
		beforeEach(() => {
			path.isAbsolute.mockImplementation(() => false);
			path.resolve.mockImplementation((...args) => args.join("/"));
			path.dirname.mockImplementation((p) =>
				p.split("/").slice(0, -1).join("/") || "/",
			);
			path.join.mockImplementation((...args) => args.join("/"));
		});

		test("should return explicit absolute path", () => {
			path.isAbsolute.mockImplementation(() => true);
			path.resolve.mockImplementation((...args) => args.join("/"));
			path.dirname.mockImplementation((p) =>
				p.split("/").slice(0, -1).join("/") || "/",
			);
			const result = resolveTasksOutputPath("/explicit/path/tasks.json");
			expect(result).toBe("/explicit/path/tasks.json");
		});

		test("should resolve explicit relative path", () => {
			const result = resolveTasksOutputPath("custom/tasks.json");
			expect(path.resolve).toHaveBeenCalledWith(
				process.cwd(),
				"custom/tasks.json",
			);
		});

		test("should create default .taskmaster path when no explicit path", () => {
			fs.existsSync.mockReturnValue(false);
			fs.mkdirSync.mockImplementation(() => {});

			resolveTasksOutputPath(null, { projectRoot: "/project" });

			expect(fs.mkdirSync).toHaveBeenCalledWith(
				expect.stringContaining(".taskmaster"),
				{ recursive: true },
			);
		});
	});
});
