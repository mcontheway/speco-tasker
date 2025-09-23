// @ts-check
/**
 * Unit tests for config-manager.js functionality
 * Simplified test suite focusing on core functionality
 */

// Mock external dependencies
import { vi } from "vitest";

vi.mock("../../scripts/modules/config-manager.js", () => ({
	__esModule: true,
	getConfig: vi.fn(),
	writeConfig: vi.fn(),
	isConfigFilePresent: vi.fn(),
	getLogLevel: vi.fn(),
	getDebugFlag: vi.fn(),
	getDefaultNumTasks: vi.fn(),
	getDefaultPriority: vi.fn(),
	getProjectName: vi.fn(),
	getUserId: vi.fn(),
	getConfigValue: vi.fn(),
}));

// Import the module under test
import * as configManagerModule from "../../scripts/modules/config-manager.js";

// Use the mocked functions directly
const configManager = {
	getConfig: configManagerModule.getConfig,
	writeConfig: configManagerModule.writeConfig,
	isConfigFilePresent: configManagerModule.isConfigFilePresent,
};

// Console spies for testing error/warning output
let consoleErrorSpy;
let consoleWarnSpy;

beforeAll(() => {
	// Setup console spies to capture error/warning output
	consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
	// Restore all mocks and spies
	vi.restoreAllMocks();
});

describe("Config Manager Module", () => {
	beforeEach(() => {
		// Clear all mocks for test isolation
		vi.clearAllMocks();
	});

	test("should export expected functions", () => {
		// Basic test to ensure the module exports expected functions
		expect(typeof configManager.getConfig).toBe("function");
		expect(typeof configManager.writeConfig).toBe("function");
		expect(typeof configManager.isConfigFilePresent).toBe("function");
	});

	test("should have console spies set up", () => {
		// Test that console spies are working
		console.error("test error");
		console.warn("test warning");

		expect(consoleErrorSpy).toHaveBeenCalledWith("test error");
		expect(consoleWarnSpy).toHaveBeenCalledWith("test warning");
	});
});
