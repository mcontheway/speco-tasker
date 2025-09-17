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
