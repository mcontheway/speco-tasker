// Jest configuration for Speco-Tasker TDD workflow
const config = {
	// Use Node.js environment for testing
	testEnvironment: "node",

	// Mock process.cwd globally to prevent graceful-fs issues
	setupFiles: ["<rootDir>/tests/setup.js"],

	// Test execution settings
	verbose: true,

	// Force exit to prevent hanging
	forceExit: true,

	// Bail on first failure for faster feedback during development
	bail: 0,

	// Disable silent mode to avoid console issues
	silent: false,

	// Simplified worker configuration
	maxWorkers: 1,

	// Module name mapping for ESM compatibility
	moduleNameMapper: {
		// Mock chalk for ESM compatibility
		"^chalk$": "<rootDir>/tests/mocks/chalk.mock.js",
		"^boxen$": "<rootDir>/tests/mocks/boxen.mock.js",
		"^gradient-string$": "<rootDir>/tests/mocks/gradient-string.mock.js",
		"^ora$": "<rootDir>/tests/mocks/ora.mock.js",
		"^cli-table3$": "<rootDir>/tests/mocks/cli-table3.mock.js",
		"^figlet$": "<rootDir>/tests/mocks/figlet.mock.js",
		// Map test fixtures to absolute paths to avoid resolution issues
		"^../../fixtures/sample-tasks.js$":
			"<rootDir>/tests/fixtures/sample-tasks.js",
	},

	// Transform ignore patterns - allow node_modules ESM packages
	transformIgnorePatterns: [
		"node_modules/(?!(fastmcp|@modelcontextprotocol)/)",
	],

	// Transform files using Babel
	transform: {
		"^.+\\.(js|mjs|cjs)$": "babel-jest",
	},

	// Explicit test match patterns to include all test files
	testMatch: [
		"**/__tests__/**/*.?([mc])[jt]s?(x)",
		"**/?(*.)+(spec|test).?([mc])[jt]s?(x)",
		"**/simple-config-test.js",
		"**/es-module-test.mjs",
	],

	// Enable ESM support for Babel
	globals: {
		"babel-jest": {
			useESM: true,
		},
	},
};

module.exports = config;
