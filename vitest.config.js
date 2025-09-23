/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
	test: {
		// Use Node.js environment for testing
		environment: "node",

		// Enable global test APIs (describe, test, expect, etc.)
		globals: true,

		// Mock process.cwd globally to prevent graceful-fs issues
		setupFiles: ["./tests/setup.js"],

		// Test execution settings
		verbose: true,

		// Force exit to prevent hanging
		forceExit: true,

		// Bail on first failure for faster feedback during development
		bail: 0,

		// Disable silent mode to avoid console issues
		silent: false,

		// Simplified worker configuration
		pool: "threads",
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},

		// Module name mapping for ESM compatibility
		alias: {
			// Mock chalk for ESM compatibility
			"^chalk$": "./tests/mocks/chalk.mock.js",
			"^boxen$": "./tests/mocks/boxen.mock.js",
			"^gradient-string$": "./tests/mocks/gradient-string.mock.js",
			"^ora$": "./tests/mocks/ora.mock.js",
			"^cli-table3$": "./tests/mocks/cli-table3.mock.js",
			"^figlet$": "./tests/mocks/figlet.mock.js",
			// Map test fixtures to absolute paths to avoid resolution issues
			"^../../fixtures/sample-tasks.js$": "./tests/fixtures/sample-tasks.js",
		},

		// Explicit test match patterns to include all test files
		include: [
			"**/__tests__/**/*.?([mc])[jt]s?(x)",
			"**/?(*.)+(spec|test).?([mc])[jt]s?(x)",
			"**/simple-config-test.js",
			"**/es-module-test.mjs",
		],

		// Exclude problematic files temporarily
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/coverage/**",
			"tests/fixtures/**",
			"tests/e2e/**", // Skip E2E tests initially
		],

		// Global test timeout
		testTimeout: 10000,
	},
});
