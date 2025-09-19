// Jest configuration for Speco-Tasker TDD workflow
const config = {
	// Use Node.js environment for testing
	testEnvironment: "node",

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
	},
};

module.exports = config;
