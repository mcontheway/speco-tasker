/**
 * Unit tests for path utilities
 */

// Mock fs and path modules for testing with proper implementations
jest.mock("node:fs", () => ({
	existsSync: jest.fn(),
	mkdirSync: jest.fn(),
}));
jest.mock("node:path", () => ({
	resolve: jest.fn(),
	dirname: jest.fn(),
	isAbsolute: jest.fn(),
	basename: jest.fn(),
	parse: jest.fn(),
	join: jest.fn(),
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
import {
	findProjectRoot,
	normalizeProjectRoot,
	resolveTasksOutputPath,
} from "../../../src/utils/path-utils.js";

// Get references to mocked functions (avoid jest.mocked with require to prevent process.cwd conflicts)
const mockFs = require("node:fs");
const mockPath = require("node:path");

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
			mockPath.resolve.mockImplementation((...args) => args.join("/"));
			mockPath.dirname.mockImplementation(
				(p) => p.split("/").slice(0, -1).join("/") || "/",
			);
			mockPath.isAbsolute.mockReturnValue(false);
			mockPath.basename.mockImplementation((p) => p.split("/").pop() || "");
			mockPath.parse.mockReturnValue({ root: "/" });
			mockPath.join.mockImplementation((...args) => args.join("/"));
		});

		test("should return cwd when no project markers found", () => {
			mockFs.existsSync.mockReturnValue(false);
			const spyCwd = jest.spyOn(process, "cwd");
			spyCwd.mockReturnValue("/current/dir");

			const result = findProjectRoot("/start/dir");
			expect(result).toBe("/current/dir");

			spyCwd.mockRestore();
		});

		test("should find project root with .speco marker", () => {
			mockFs.existsSync.mockImplementation(
				(p) =>
					typeof p === "string" &&
					(p === "/home/user/project/src/.speco/tasks/tasks.json" ||
						p.includes(".taskmaster")),
			);
			mockPath.resolve.mockImplementation((p) => p);
			const spyCwd = jest.spyOn(process, "cwd");
			spyCwd.mockReturnValue("/current/dir");

			const result = findProjectRoot("/home/user/project/src");
			expect(result).toBe("/home/user/project/src");

			spyCwd.mockRestore();
		});
	});

	describe("resolveTasksOutputPath", () => {
		let spyCwd;

		beforeEach(() => {
			spyCwd = jest.spyOn(process, "cwd");
			spyCwd.mockReturnValue("/mock/cwd");
			mockPath.isAbsolute.mockReturnValue(false);
			mockPath.resolve.mockImplementation((...args) => {
				if (args.length === 2 && args[0] === "/mock/cwd") {
					return `/mocked/resolved/${args[1]}`;
				}
				return args.join("/");
			});
			mockPath.dirname.mockImplementation(
				(p) => p.split("/").slice(0, -1).join("/") || "/",
			);
			mockPath.join.mockImplementation((...args) => args.join("/"));
		});

		afterEach(() => {
			if (spyCwd) {
				spyCwd.mockRestore();
			}
		});

		test("should return explicit absolute path", () => {
			mockPath.isAbsolute.mockReturnValue(true);
			mockPath.resolve.mockImplementation((...args) => args.join("/"));
			mockPath.dirname.mockImplementation(
				(p) => p.split("/").slice(0, -1).join("/") || "/",
			);
			const result = resolveTasksOutputPath("/explicit/path/tasks.json");
			expect(result).toBe("/explicit/path/tasks.json");
		});

		test("should resolve explicit relative path", () => {
			const result = resolveTasksOutputPath("custom/tasks.json");
			expect(mockPath.resolve).toHaveBeenCalledWith(
				process.cwd(),
				"custom/tasks.json",
			);
		});

		test("should create default .speco path when no explicit path", () => {
			mockFs.existsSync.mockReturnValue(false);

			resolveTasksOutputPath(null, { projectRoot: "/project" });

			expect(mockFs.mkdirSync).toHaveBeenCalledWith(
				expect.stringContaining(".speco"),
				{ recursive: true },
			);
		});
	});
});
