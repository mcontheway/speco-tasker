// Jest configuration for Speco-Tasker TDD workflow
// Disable graceful-fs patching globally
process.env.GRACEFUL_FS_PATCH = "0";

const config = {
	// Use Node.js environment for testing
	testEnvironment: "node",

	// Automatically clear mock calls between every test
	clearMocks: true,

	// Force exit to avoid hanging processes (compatible with Jest 29.7.0)
	forceExit: true,

	// Disable open handle detection to avoid internal errors
	detectOpenHandles: false,

	// Enable coverage collection (disable for now to avoid internal errors)
	collectCoverage: false,

	// Coverage directory
	coverageDirectory: "coverage",

	// Coverage reporters - completely disabled to avoid internal errors
	coverageReporters: [],

	// Coverage thresholds (TaskMaster standards)
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 80,
			lines: 80,
			statements: 80,
		},
		// Higher standards for critical business logic
		"./src/models/": {
			branches: 85,
			functions: 90,
			lines: 90,
			statements: 90,
		},
		"./src/services/": {
			branches: 80,
			functions: 85,
			lines: 85,
			statements: 85,
		},
		"./src/controllers/": {
			branches: 80,
			functions: 85,
			lines: 85,
			statements: 85,
		},
	},

	// Files to collect coverage from
	collectCoverageFrom: [
		"src/**/*.js",
		"!src/**/*.test.js",
		"!src/**/index.js",
		"!src/**/test-helpers.js",
		"!src/**/mocks/**",
		"!coverage/**",
		"!node_modules/**",
		// Exclude E2E tests and related files
		"!tests/e2e/**",
		"!tests/setup/e2e.js",
	],

	// Transform configuration for both CommonJS and ES modules
	transform: {
		"^.+\\.(js|jsx|mjs|cjs)$": "babel-jest",
	},

	// Enhanced module name mapping for ESM compatibility
	moduleNameMapper: {
		// Handle .js extensions in import paths for ESM
		"^(\\.{1,2}/.*)\\.js$": "$1",
		// ESM package mocks with full compatibility
		"^boxen$": "<rootDir>/tests/mocks/boxen.mock.js",
		"^chalk$": "<rootDir>/tests/mocks/chalk.mock.js",
		"^gradient-string$": "<rootDir>/tests/mocks/gradient-string.mock.js",
		"^ora$": "<rootDir>/tests/mocks/ora.mock.js",
		"^cli-table3$": "<rootDir>/tests/mocks/cli-table3.mock.js",
		"^figlet$": "<rootDir>/tests/mocks/figlet.mock.js",
		// Node.js built-in modules mapping
		"^node:path$": "path",
		"^node:fs$": "fs",
		"^node:url$": "url",
		"^node:child_process$": "child_process",
		"^node:os$": "os",
		"^node:process$": "process",
		// Handle import.meta.url for ESM compatibility
		"^import\\.meta\\.url$": "<rootDir>/tests/mocks/import-meta-url.mock.js",
	},

	// ESM support - transform ALL packages to handle complex ESM dependencies
	transformIgnorePatterns: [
		"node_modules/(?!(.*)/)",
	],

	// Enhanced ESM support configuration
	globals: {
		"ts-jest": {
			useESM: true,
		},
	},

	// ESM-specific Jest configuration
	testEnvironmentOptions: {
		node: {
			// Enable ESM support in test environment
			loader: 'node',
		},
	},

	// Test timeout (global)
	testTimeout: 10000,

	// Setup files
	setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

	// Module file extensions
	moduleFileExtensions: ["js", "cjs", "mjs", "json"],

	// Test file patterns - organized by test type (ESM compatible)
	testMatch: [
		// Contract tests (API behavior verification)
		"**/tests/contract/**/*.test.js",

		// Integration tests (end-to-end scenarios)
		"**/tests/integration/**/*.test.js",

		// Unit tests (isolated component testing)
		"**/tests/unit/**/*.test.js",

		// E2E tests (full system testing)
		"**/tests/e2e/**/*.test.js",
	],

	// Projects for different test types with specific configurations
	projects: [
		// Contract Tests - API contract verification
		{
			displayName: "contract",
			testMatch: ["**/tests/contract/**/*.test.js"],
			testEnvironment: "node",
			setupFilesAfterEnv: ["<rootDir>/tests/setup/contract.js"],
			collectCoverageFrom: [
				"src/controllers/**/*.js",
				"src/services/**/*.js",
				"!src/**/*.test.js",
			],
			// Contract tests are API integration tests, not unit tests
			// They don't need strict coverage requirements
			coverageThreshold: {
				global: {
					branches: 0,
					functions: 0,
					lines: 0,
					statements: 0,
				},
			},
		},

		// Integration Tests - Component and service integration
		{
			displayName: "integration",
			testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
			testEnvironment: "node",
			setupFilesAfterEnv: ["<rootDir>/tests/setup/integration.js"],
			maxWorkers: 2, // Parallel execution for integration tests
			collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js", "!tests/**"],
		},

		// Unit Tests - Isolated function and module testing
		{
			displayName: "unit",
			testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
			testEnvironment: "node",
			setupFilesAfterEnv: ["<rootDir>/tests/setup/unit.js"],
			maxWorkers: 4, // High parallelism for fast unit tests
			collectCoverageFrom: [
				"src/models/**/*.js",
				"src/utils/**/*.js",
				"src/constants/**/*.js",
				"!src/**/*.test.js",
			],
		},

		// E2E Tests - Full system verification
		{
			displayName: "e2e",
			testMatch: ["<rootDir>/tests/e2e/**/*.test.js"],
			testEnvironment: "node",
			setupFilesAfterEnv: ["<rootDir>/tests/setup/e2e.js"],
			maxWorkers: 1, // Sequential execution for E2E stability
			// Note: collectCoverage cannot be set at project level
			// E2E tests are excluded from coverage via collectCoverageFrom patterns
		},
	],

	// Global test configuration
	resetMocks: true,
	restoreMocks: true,

	// Test execution settings
	verbose: true,

	// Force exit to prevent hanging
	forceExit: true,

	// Bail on first failure for faster feedback during development
	bail: 0, // Set to 1 during strict TDD development
};

module.exports = config;
