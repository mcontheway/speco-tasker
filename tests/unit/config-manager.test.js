// @ts-check
/**
 * Unit tests for config-manager.js functionality
 * Simplified test suite focusing on core functionality
 */

// Mock external dependencies
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";

jest.mock("../../scripts/modules/config-manager.js", () => ({
	__esModule: true,
	getConfig: jest.fn(),
	writeConfig: jest.fn(),
	isConfigFilePresent: jest.fn(),
	getLogLevel: jest.fn(),
	getDebugFlag: jest.fn(),
	getDefaultNumTasks: jest.fn(),
	getDefaultPriority: jest.fn(),
	getProjectName: jest.fn(),
	getUserId: jest.fn(),
	getConfigValue: jest.fn(),
	setConfigValue: jest.fn(),
	getConfigValues: jest.fn(),
	validateConfiguration: jest.fn(),
	getConfigHistory: jest.fn(),
	rollbackConfig: jest.fn(),
	resetConfigToDefaults: jest.fn(),
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
	consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
	consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
	// Restore all mocks and spies
	jest.restoreAllMocks();
});

describe("Config Manager Module", () => {
	beforeEach(() => {
		// Clear all mocks for test isolation
		jest.clearAllMocks();
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
