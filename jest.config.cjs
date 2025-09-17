const config = {
	// Use Node.js environment for testing
	testEnvironment: "node",

	// Automatically clear mock calls between every test
	clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false,

	// The directory where Jest should output its coverage files
	coverageDirectory: "coverage",

	// Don't transform node_modules except specific ones - fix module loading issues
	transformIgnorePatterns: [
		"node_modules/(?!(supertest|chalk|boxen|@inquirer)/)",
	],

	// Setup file - use .cjs extension for CommonJS
	setupFilesAfterEnv: ["<rootDir>/tests/setup.cjs"],

	// Properly initialize source-map-support
	setupFiles: ["source-map-support/register"],

	// Module file extensions
	moduleFileExtensions: ["js", "cjs", "mjs", "json"],

	// Test file patterns - include .cjs and .mjs files
	testMatch: [
		"**/__tests__/**/*.js",
		"**/__tests__/**/*.cjs",
		"**/__tests__/**/*.mjs",
		"**/?(*.)+(spec|test).js",
		"**/?(*.)+(spec|test).cjs",
		"**/?(*.)+(spec|test).mjs",
		"**/contract/**/*.js",
		"**/contract/**/*.cjs",
		"**/contract/**/*.mjs",
		"**/integration/**/*.js",
		"**/integration/**/*.cjs",
		"**/integration/**/*.mjs",
		"**/unit/**/*.js",
		"**/unit/**/*.cjs",
		"**/unit/**/*.mjs",
		"**/performance/**/*.js",
		"**/performance/**/*.cjs",
		"**/performance/**/*.mjs",
	],

	// Isolate modules to prevent cross-test contamination
	resetModules: true,
	resetMocks: true,
	restoreMocks: true,

	// Prevent memory leaks and improve test isolation
	maxWorkers: 1,

	// Verbose output
	verbose: true,
};

module.exports = config;
