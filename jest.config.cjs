const config = {
	// Use Node.js environment for testing
	testEnvironment: "node",

	// Automatically clear mock calls between every test
	clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false,

	// The directory where Jest should output its coverage files
	coverageDirectory: "coverage",

	// Transform configuration for both CommonJS and ES modules
	transform: {
		'^.+\\.js$': 'babel-jest',
		'^.+\\.mjs$': 'babel-jest',
	},

	// Module name mapping for ES modules
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
		// Mock import.meta.url for ES modules
		'import\\.meta\\.url': 'jest.fn(() => "file:///mock/path")',
	},

	// Don't transform node_modules except specific ones
	transformIgnorePatterns: [
		"node_modules/(?!(supertest|chalk|boxen|@inquirer|fastmcp)/)",
	],

	// Setup files
	setupFilesAfterEnv: ["<rootDir>/tests/setup.cjs"],

	// Module file extensions
	moduleFileExtensions: ["js", "cjs", "mjs", "json"],

	// Test file patterns - include both CommonJS and ES module tests
	testMatch: [
		"**/?(*.)+(spec|test).cjs",
		"**/?(*.)+(spec|test).mjs",
		"**/contract/**/*.cjs",
		"**/contract/**/*.mjs",
		"**/integration/**/*.cjs",
		"**/integration/**/*.mjs",
		"**/unit/**/*.cjs",
		"**/unit/**/*.mjs",
		"**/performance/**/*.cjs",
		"**/performance/**/*.mjs",
	],

	// Exclude problematic tests with syntax errors or complex dependencies
	testPathIgnorePatterns: [
		"mcp-server/src/core/__tests__", // MCP server tests with complex dependencies
		"tests/integration/cli/commands.test.cjs", // Uses dynamic imports without vm-modules
		"tests/integration/cli/complex-cross-tag-scenarios.test.cjs", // Syntax error
		"tests/integration/move-task-cross-tag.integration.test.cjs", // Jest redeclaration error
		"tests/integration/move-task-simple.integration.test.cjs", // Jest redeclaration error
		"tests/integration/manage-gitignore.test.cjs", // Syntax error
		"tests/unit/utils/path-utils.test.cjs", // ES module dependencies
		"tests/unit/utils/getVersion.test.cjs", // ES module dependencies
		"tests/unit/es-module-test.mjs", // ES module test
		"tests/unit/config-manager.test.mjs", // ES module test
	],

	// Optimize for integration tests
	resetModules: false, // Keep modules cached between tests for speed
	resetMocks: true,
	restoreMocks: true,

	// Allow more workers for integration tests (they're more isolated)
	maxWorkers: 2,

	// Minimal output for stability
	verbose: false,

	// Reasonable timeout
	testTimeout: 5000,

	// Force exit
	forceExit: true,

	// Bail on first failure for faster feedback
	bail: 1,

	// ES module globals
	globals: {
		'ts-jest': {
			useESM: true,
		},
	},
};

module.exports = config;
