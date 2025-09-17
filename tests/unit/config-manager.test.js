import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { jest } from "@jest/globals";

// Mock modules first before any imports
jest.mock("fs", () => ({
	existsSync: jest.fn((filePath) => {
		// Prevent Jest internal file access
		if (
			filePath.includes("jest-message-util") ||
			filePath.includes("node_modules")
		) {
			return false;
		}
		return false; // Default to false for config discovery prevention
	}),
	readFileSync: jest.fn(() => "{}"),
	writeFileSync: jest.fn(),
	mkdirSync: jest.fn(),
}));

jest.mock("path", () => ({
	join: jest.fn((dir, file) => `${dir}/${file}`),
	dirname: jest.fn((filePath) => filePath.split("/").slice(0, -1).join("/")),
	resolve: jest.fn((...paths) => paths.join("/")),
	basename: jest.fn((filePath) => filePath.split("/").pop()),
}));

jest.mock("chalk", () => ({
	red: jest.fn((text) => text),
	blue: jest.fn((text) => text),
	green: jest.fn((text) => text),
	yellow: jest.fn((text) => text),
	white: jest.fn((text) => ({
		bold: jest.fn((text) => text),
	})),
	reset: jest.fn((text) => text),
	dim: jest.fn((text) => text), // Add dim function to prevent chalk errors
}));

// Mock console to prevent Jest internal access
const mockConsole = {
	log: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};
global.console = mockConsole;

// --- Define Mock Function Instances ---
const mockFindConfigPath = jest.fn(() => null); // Default to null, can be overridden in tests

// Mock path-utils to prevent config file path discovery and logging
jest.mock("../../src/utils/path-utils.js", () => ({
	__esModule: true,
	findProjectRoot: jest.fn(() => "/mock/project"),
	findConfigPath: mockFindConfigPath, // Use the mock function instance
	findTasksPath: jest.fn(() => "/mock/tasks.json"),
	findComplexityReportPath: jest.fn(() => null),
	resolveTasksOutputPath: jest.fn(() => "/mock/tasks.json"),
	resolveComplexityReportOutputPath: jest.fn(() => "/mock/report.json"),
}));

// --- Read REAL supported-models.json data BEFORE mocks ---
const __filename = fileURLToPath(import.meta.url); // Get current file path
const __dirname = path.dirname(__filename); // Get current directory
const realSupportedModelsPath = path.resolve(
	__dirname,
	"../../scripts/modules/supported-models.json",
);
let REAL_SUPPORTED_MODELS_CONTENT;
let REAL_SUPPORTED_MODELS_DATA;
try {
	REAL_SUPPORTED_MODELS_CONTENT = fs.readFileSync(
		realSupportedModelsPath,
		"utf-8",
	);
	REAL_SUPPORTED_MODELS_DATA = JSON.parse(REAL_SUPPORTED_MODELS_CONTENT);
} catch (err) {
	console.error(
		"FATAL TEST SETUP ERROR: Could not read or parse real supported-models.json",
		err,
	);
	REAL_SUPPORTED_MODELS_CONTENT = "{}"; // Default to empty object on error
	REAL_SUPPORTED_MODELS_DATA = {};
	process.exit(1); // Exit if essential test data can't be loaded
}

// --- Define Mock Function Instances ---
const mockFindProjectRoot = jest.fn();
const mockLog = jest.fn();

// --- Mock Dependencies BEFORE importing the module under test ---

// Mock the 'utils.js' module using a factory function
jest.mock("../../scripts/modules/utils.js", () => ({
	__esModule: true, // Indicate it's an ES module mock
	findProjectRoot: mockFindProjectRoot, // Use the mock function instance
	log: mockLog, // Use the mock function instance
	// Include other necessary exports from utils if config-manager uses them directly
	resolveEnvVariable: jest.fn(), // Example if needed
}));

// Import the mocked 'fs' module to allow spying on its functions
import fsMocked from "fs";
// --- Import the module under test AFTER mocks are defined ---
import * as configManager from "../../scripts/modules/config-manager.js";

// --- Test Data (Keep as is, ensure DEFAULT_CONFIG is accurate) ---
const MOCK_PROJECT_ROOT = "/mock/project";
const MOCK_CONFIG_PATH = path.join(
	MOCK_PROJECT_ROOT,
	".taskmaster/config.json",
);

// Updated DEFAULT_CONFIG reflecting the implementation
const DEFAULT_CONFIG = {
	global: {
		logLevel: "info",
		debug: false,
		defaultNumTasks: 10,
		defaultSubtasks: 5,
		defaultPriority: "medium",
		projectName: "Task Master",
	},
};

// Other test data (VALID_CUSTOM_CONFIG, PARTIAL_CONFIG, INVALID_PROVIDER_CONFIG)
const VALID_CUSTOM_CONFIG = {
	global: {
		logLevel: "debug",
		defaultPriority: "high",
		projectName: "My Custom Project",
	},
};

const PARTIAL_CONFIG = {
	global: {
		projectName: "Partial Project",
	},
};

const INVALID_PROVIDER_CONFIG = {
	global: {
		logLevel: "warn",
	},
};

// AI functionality has been removed - no Claude Code test data needed

// Define spies globally to be restored in afterAll
let consoleErrorSpy;
let consoleWarnSpy;
let fsReadFileSyncSpy;
let fsWriteFileSyncSpy;
let fsExistsSyncSpy;

beforeAll(() => {
	// Set up console spies
	consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
	// Restore all spies
	jest.restoreAllMocks();
});

// Reset mocks before each test for isolation
beforeEach(() => {
	// Clear all mock calls and reset implementations between tests
	jest.clearAllMocks();
	// Reset the external mock instances for utils
	mockFindProjectRoot.mockReset();
	mockLog.mockReset();
	mockFindConfigPath.mockReset();

	// --- Set up spies ON the imported 'fs' mock ---
	fsExistsSyncSpy = jest.spyOn(fsMocked, "existsSync");
	fsReadFileSyncSpy = jest.spyOn(fsMocked, "readFileSync");
	fsWriteFileSyncSpy = jest.spyOn(fsMocked, "writeFileSync");

	// --- Default Mock Implementations ---
	mockFindProjectRoot.mockReturnValue(MOCK_PROJECT_ROOT); // Default for utils.findProjectRoot
	mockFindConfigPath.mockReturnValue(null); // Default to no config file found
	fsExistsSyncSpy.mockReturnValue(true); // Assume files exist by default

	// Default readFileSync: Return REAL models content, mocked config, or throw error
	fsReadFileSyncSpy.mockImplementation((filePath) => {
		const baseName = path.basename(filePath);
		if (baseName === "supported-models.json") {
			// Return the REAL file content stringified
			return REAL_SUPPORTED_MODELS_CONTENT;
		} else if (filePath === MOCK_CONFIG_PATH) {
			// Still mock the .taskmasterconfig reads
			return JSON.stringify(DEFAULT_CONFIG); // Default behavior
		}
		// For Jest internal files or other unexpected files, return empty string instead of throwing
		// This prevents Jest's internal file operations from breaking tests
		if (
			filePath.includes("jest-message-util") ||
			filePath.includes("node_modules")
		) {
			return "{}"; // Return empty JSON for Jest internal files
		}
		// Throw for truly unexpected reads that should be caught in tests
		throw new Error(`Unexpected fs.readFileSync call in test: ${filePath}`);
	});

	// Default writeFileSync: Do nothing, just allow calls
	fsWriteFileSyncSpy.mockImplementation(() => {});
});

// AI functionality has been removed - no validation function tests needed

// AI functionality has been removed - no Claude Code tests needed

// --- getConfig Tests ---
describe("getConfig Tests", () => {
	test("should return default config if .taskmasterconfig does not exist", () => {
		// Arrange
		fsExistsSyncSpy.mockReturnValue(false);
		// findProjectRoot mock is set in beforeEach

		// Act: Call getConfig with explicit root
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true); // Force reload

		// Assert
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(mockFindProjectRoot).not.toHaveBeenCalled(); // Explicit root provided
		// The implementation checks for .taskmaster directory first
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(
			path.join(MOCK_PROJECT_ROOT, ".taskmaster"),
		);
		expect(fsReadFileSyncSpy).not.toHaveBeenCalled(); // No read if file doesn't exist
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining("not found at provided project root"),
		);
	});

	test.skip("should use findProjectRoot and return defaults if file not found", () => {
		// TODO: Fix mock interaction, findProjectRoot isn't being registered as called
		// Arrange
		fsExistsSyncSpy.mockReturnValue(false);
		// findProjectRoot mock is set in beforeEach

		// Act: Call getConfig without explicit root
		const config = configManager.getConfig(null, true); // Force reload

		// Assert
		expect(mockFindProjectRoot).toHaveBeenCalled(); // Should be called now
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(fsReadFileSyncSpy).not.toHaveBeenCalled();
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			expect.stringContaining("not found at derived root"),
		); // Adjusted expected warning
	});

	test("should read and merge valid config file with defaults", () => {
		// Arrange: Override readFileSync for this test
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH)
				return JSON.stringify(VALID_CUSTOM_CONFIG);
			if (path.basename(filePath) === "supported-models.json") {
				// Provide necessary models for validation within getConfig
				return JSON.stringify({
					openai: [{ id: "gpt-4o" }],
					google: [{ id: "gemini-1.5-pro-latest" }],
					perplexity: [{ id: "sonar-pro" }],
					anthropic: [
						{ id: "claude-3-opus-20240229" },
						{ id: "claude-3-5-sonnet" },
						{ id: "claude-3-7-sonnet-20250219" },
						{ id: "claude-3-5-sonnet" },
					],
					ollama: [],
					openrouter: [],
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true); // Force reload

		// Assert: Construct expected merged config
		const expectedMergedConfig = {
			global: { ...DEFAULT_CONFIG.global, ...VALID_CUSTOM_CONFIG.global },
		};
		expect(config).toEqual(expectedMergedConfig);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
		expect(fsReadFileSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH, "utf-8");
	});

	test("should merge defaults for partial config file", () => {
		// Arrange
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) return JSON.stringify(PARTIAL_CONFIG);
			if (path.basename(filePath) === "supported-models.json") {
				return JSON.stringify({
					openai: [{ id: "gpt-4-turbo" }],
					perplexity: [{ id: "sonar-pro" }],
					anthropic: [
						{ id: "claude-3-7-sonnet-20250219" },
						{ id: "claude-3-5-sonnet" },
					],
					ollama: [],
					openrouter: [],
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert: Construct expected merged config
		const expectedMergedConfig = {
			global: { ...DEFAULT_CONFIG.global, ...PARTIAL_CONFIG.global },
		};
		expect(config).toEqual(expectedMergedConfig);
		expect(fsReadFileSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH, "utf-8");
	});

	test("should handle JSON parsing error and return defaults", () => {
		// Arrange
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) return "invalid json";
			// Mock models read needed for initial load before parse error
			if (path.basename(filePath) === "supported-models.json") {
				return JSON.stringify({
					anthropic: [{ id: "claude-3-7-sonnet-20250219" }],
					perplexity: [{ id: "sonar-pro" }],
					fallback: [{ id: "claude-3-5-sonnet" }],
					ollama: [],
					openrouter: [],
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error reading or parsing"),
		);
	});

	test("should handle file read error and return defaults", () => {
		// Arrange
		const readError = new Error("Permission denied");
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) throw readError;
			// Mock models read needed for initial load before read error
			if (path.basename(filePath) === "supported-models.json") {
				return JSON.stringify({
					anthropic: [{ id: "claude-3-7-sonnet-20250219" }],
					perplexity: [{ id: "sonar-pro" }],
					fallback: [{ id: "claude-3-5-sonnet" }],
					ollama: [],
					openrouter: [],
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert
		expect(config).toEqual(DEFAULT_CONFIG);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"Permission denied. Using default configuration.",
			),
		);
	});

	test("should read and merge invalid config file with defaults", () => {
		// Arrange
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH)
				return JSON.stringify(INVALID_PROVIDER_CONFIG);
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const config = configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Assert: Should merge global config, no validation warnings expected
		const expectedMergedConfig = {
			global: { ...DEFAULT_CONFIG.global, ...INVALID_PROVIDER_CONFIG.global },
		};
		expect(config).toEqual(expectedMergedConfig);
		expect(consoleWarnSpy).not.toHaveBeenCalled();
	});
});

// --- writeConfig Tests ---
describe("writeConfig", () => {
	test("should write valid config to file", () => {
		// Arrange (Default mocks are sufficient)
		// findProjectRoot mock set in beforeEach
		fsWriteFileSyncSpy.mockImplementation(() => {}); // Ensure it doesn't throw

		// Act
		const success = configManager.writeConfig(
			VALID_CUSTOM_CONFIG,
			MOCK_PROJECT_ROOT,
		);

		// Assert
		expect(success).toBe(true);
		expect(fsWriteFileSyncSpy).toHaveBeenCalledWith(
			MOCK_CONFIG_PATH,
			JSON.stringify(VALID_CUSTOM_CONFIG, null, 2), // writeConfig stringifies
		);
		expect(consoleErrorSpy).not.toHaveBeenCalled();
	});

	test("should return false and log error if write fails", () => {
		// Arrange
		const mockWriteError = new Error("Disk full");
		fsWriteFileSyncSpy.mockImplementation(() => {
			throw mockWriteError;
		});
		// findProjectRoot mock set in beforeEach

		// Act
		const success = configManager.writeConfig(
			VALID_CUSTOM_CONFIG,
			MOCK_PROJECT_ROOT,
		);

		// Assert
		expect(success).toBe(false);
		expect(fsWriteFileSyncSpy).toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Disk full"),
		);
	});

	test.skip("should return false if project root cannot be determined", () => {
		// TODO: Fix mock interaction or function logic, returns true unexpectedly in test
		// Arrange: Override mock for this specific test
		mockFindProjectRoot.mockReturnValue(null);

		// Act: Call without explicit root
		const success = configManager.writeConfig(VALID_CUSTOM_CONFIG);

		// Assert
		expect(success).toBe(false); // Function should return false if root is null
		expect(mockFindProjectRoot).toHaveBeenCalled();
		expect(fsWriteFileSyncSpy).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Could not determine project root"),
		);
	});
});

// --- Getter Functions ---
describe("Getter Functions", () => {
	// AI functionality has been removed - no getMainProvider test needed

	test("getLogLevel should return logLevel from config", () => {
		// Arrange: Set up readFileSync to return VALID_CUSTOM_CONFIG
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH)
				return JSON.stringify(VALID_CUSTOM_CONFIG);
			if (path.basename(filePath) === "supported-models.json") {
				// Provide enough mock model data for validation within getConfig
				return JSON.stringify({
					openai: [{ id: "gpt-4o" }],
					google: [{ id: "gemini-1.5-pro-latest" }],
					anthropic: [
						{ id: "claude-3-opus-20240229" },
						{ id: "claude-3-7-sonnet-20250219" },
						{ id: "claude-3-5-sonnet" },
					],
					perplexity: [{ id: "sonar-pro" }],
					ollama: [],
					openrouter: [],
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach

		// Act
		const logLevel = configManager.getLogLevel(MOCK_PROJECT_ROOT);

		// Assert
		expect(logLevel).toBe(VALID_CUSTOM_CONFIG.global.logLevel);
	});

	// Add more tests for other getters (getResearchProvider, getProjectName, etc.)
});

// --- isConfigFilePresent Tests ---
describe("isConfigFilePresent", () => {
	test("should return true if config file exists", () => {
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach
		expect(configManager.isConfigFilePresent(MOCK_PROJECT_ROOT)).toBe(true);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
	});

	test("should return false if config file does not exist", () => {
		fsExistsSyncSpy.mockReturnValue(false);
		// findProjectRoot mock set in beforeEach
		expect(configManager.isConfigFilePresent(MOCK_PROJECT_ROOT)).toBe(false);
		expect(fsExistsSyncSpy).toHaveBeenCalledWith(MOCK_CONFIG_PATH);
	});

	test.skip("should use findProjectRoot if explicitRoot is not provided", () => {
		// TODO: Fix mock interaction, findProjectRoot isn't being registered as called
		fsExistsSyncSpy.mockReturnValue(true);
		// findProjectRoot mock set in beforeEach
		expect(configManager.isConfigFilePresent()).toBe(true);
		expect(mockFindProjectRoot).toHaveBeenCalled(); // Should be called now
	});
});

// AI functionality has been removed - no getAllProviders test needed

// Add tests for getParametersForRole if needed

// --- defaultNumTasks Tests ---
describe("Configuration Getters", () => {
	test("getDefaultNumTasks should return default value when config is valid", () => {
		// Arrange: Mock fs.readFileSync to return valid config when called with the expected path
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) {
				return JSON.stringify({
					global: {
						defaultNumTasks: 15,
					},
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);

		// Force reload to clear cache
		configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Act: Call getDefaultNumTasks with explicit root
		const result = configManager.getDefaultNumTasks(MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(15);
	});

	test("getDefaultNumTasks should return fallback when config value is invalid", () => {
		// Arrange: Mock fs.readFileSync to return invalid config
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) {
				return JSON.stringify({
					global: {
						defaultNumTasks: "invalid",
					},
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);

		// Force reload to clear cache
		configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Act: Call getDefaultNumTasks with explicit root
		const result = configManager.getDefaultNumTasks(MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(10); // Should fallback to DEFAULTS.global.defaultNumTasks
	});

	test("getDefaultNumTasks should return fallback when config value is missing", () => {
		// Arrange: Mock fs.readFileSync to return config without defaultNumTasks
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) {
				return JSON.stringify({
					global: {},
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);

		// Force reload to clear cache
		configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Act: Call getDefaultNumTasks with explicit root
		const result = configManager.getDefaultNumTasks(MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(10); // Should fallback to DEFAULTS.global.defaultNumTasks
	});

	test("getDefaultNumTasks should handle non-existent config file", () => {
		// Arrange: Mock file not existing
		fsExistsSyncSpy.mockReturnValue(false);

		// Force reload to clear cache
		configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Act: Call getDefaultNumTasks with explicit root
		const result = configManager.getDefaultNumTasks(MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(10); // Should fallback to DEFAULTS.global.defaultNumTasks
	});

	test("getDefaultNumTasks should accept explicit project root", () => {
		// Arrange: Mock fs.readFileSync to return valid config
		fsReadFileSyncSpy.mockImplementation((filePath) => {
			if (filePath === MOCK_CONFIG_PATH) {
				return JSON.stringify({
					global: {
						defaultNumTasks: 20,
					},
				});
			}
			throw new Error(`Unexpected fs.readFileSync call: ${filePath}`);
		});
		fsExistsSyncSpy.mockReturnValue(true);

		// Force reload to clear cache
		configManager.getConfig(MOCK_PROJECT_ROOT, true);

		// Act: Call getDefaultNumTasks with explicit project root
		const result = configManager.getDefaultNumTasks(MOCK_PROJECT_ROOT);

		// Assert
		expect(result).toBe(20);
	});
});

// Note: Tests for setMainModel, setResearchModel were removed as the functions were removed in the implementation.
// If similar setter functions exist, add tests for them following the writeConfig pattern.
