const config = {
	// Use Node.js environment for testing
	testEnvironment: "node",

	// Automatically clear mock calls between every test
	clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false,

	// The directory where Jest should output its coverage files
	coverageDirectory: "coverage",

	// A list of paths to directories that Jest should use to search for files in
	roots: ["<rootDir>/tests", "<rootDir>/scripts"],

	// The glob patterns Jest uses to detect test files
	testMatch: [
		"**/__tests__/**/*.js",
		"**/__tests__/**/*.cjs",
		"**/?(*.)+(spec|test).js",
		"**/?(*.)+(spec|test).cjs",
		"**/contract/**/*.js",
		"**/contract/**/*.cjs",
		"**/integration/**/*.js",
		"**/integration/**/*.cjs",
		"**/unit/**/*.js",
		"**/unit/**/*.cjs",
		"**/performance/**/*.js",
		"**/performance/**/*.cjs",
	],

	// Don't transform node_modules except specific ones - fix module loading issues
	transformIgnorePatterns: [
		"node_modules/(?!(supertest|chalk|boxen|@inquirer)/)",
	],

	// Disable transforms for CommonJS files to avoid jest conflicts
	transform: {},

	// Set moduleNameMapper for absolute paths
	// moduleNameMapper: {},

	// Setup module aliases
	moduleDirectories: ["node_modules"],

	// Configure test coverage thresholds
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},

	// Generate coverage report in these formats
	coverageReporters: ["text", "lcov"],

	// Verbose output
	verbose: true,

	// Setup file - use .cjs extension for CommonJS
	setupFilesAfterEnv: ["<rootDir>/tests/setup.cjs"],

	// Properly initialize source-map-support
	setupFiles: ["source-map-support/register"],

	// Module file extensions
	moduleFileExtensions: ["js", "cjs", "mjs", "json"],

	// Isolate modules to prevent cross-test contamination
	resetModules: true,
	resetMocks: true,
	restoreMocks: true,

	// Prevent memory leaks and improve test isolation
	maxWorkers: 1,

	// Force sequential execution to avoid module loading conflicts
	// runInBand: true
};

module.exports = config;
