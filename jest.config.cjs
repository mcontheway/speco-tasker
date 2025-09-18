// Jest configuration for Speco-Tasker TDD workflow
// Disable graceful-fs patching globally
process.env.GRACEFUL_FS_PATCH = "0";

const config = {
  // Use Node.js environment for testing
  testEnvironment: "node",

  // Automatically clear mock calls between every test
  clearMocks: true,

  // Enable coverage collection
  collectCoverage: true,

  // Coverage directory
  coverageDirectory: "coverage",

  // Coverage reporters
  coverageReporters: ["text", "text-summary", "lcov", "html", "json"],

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
  ],

  // Transform configuration for both CommonJS and ES modules
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.mjs$": "babel-jest",
  },

  // Module name mapping for ES modules
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Mock import.meta.url for ES modules
    "import\\.meta\\.url": "jest.fn(() => \"file:///mock/path\")",
  },

  // Don't transform node_modules except specific ones
  transformIgnorePatterns: [
    "node_modules/(?!(supertest|chalk|boxen|@inquirer|fastmcp)/)",
  ],

  // Test timeout (global)
  testTimeout: 10000,

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.cjs"],

  // Module file extensions
  moduleFileExtensions: ["js", "cjs", "mjs", "json"],

  // Test file patterns - organized by test type
  testMatch: [
    // Contract tests (API behavior verification)
    "**/tests/contract/**/*.test.js",
    "**/tests/contract/**/*.test.cjs",

    // Integration tests (end-to-end scenarios)
    "**/tests/integration/**/*.test.js",
    "**/tests/integration/**/*.test.cjs",

    // Unit tests (isolated component testing)
    "**/tests/unit/**/*.test.js",
    "**/tests/unit/**/*.test.cjs",

    // E2E tests (full system testing)
    "**/tests/e2e/**/*.test.js",
    "**/tests/e2e/**/*.test.cjs",
  ],

  // Projects for different test types with specific configurations
  projects: [
    // Contract Tests - API contract verification
    {
      displayName: "contract",
      testMatch: ["**/tests/contract/**/*.test.{js,cjs}"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup/contract.cjs"],
      collectCoverageFrom: [
        "src/controllers/**/*.js",
        "src/services/**/*.js",
        "!src/**/*.test.js",
      ],
    },

    // Integration Tests - Component and service integration
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.{js,cjs}"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup/integration.cjs"],
      maxWorkers: 2, // Parallel execution for integration tests
      collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js", "!tests/**"],
    },

    // Unit Tests - Isolated function and module testing
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.{js,cjs}"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup/unit.cjs"],
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
      testMatch: ["<rootDir>/tests/e2e/**/*.test.{js,cjs}"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/setup/e2e.cjs"],
      maxWorkers: 1, // Sequential execution for E2E stability
      collectCoverage: false, // E2E tests don't contribute to coverage
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
