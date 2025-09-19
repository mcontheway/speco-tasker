/**
 * @type {import('vitest/config').UserConfig}
 */
export default {
	test: {
		// Use Node.js environment
		environment: "node",

		// Test file patterns
		include: [
			"tests/unit/**/*.test.js",
			"tests/integration/**/*.test.js",
			"tests/contract/**/*.test.js",
			"tests/e2e/**/*.test.js",
		],

		// Exclude patterns
		exclude: [
			"node_modules/**",
			"tests/e2e/**", // Skip E2E tests for now
			"tests/setup/**",
		],

		// Timeout settings
		testTimeout: 5000,

		// Setup files
		setupFiles: ["tests/setup.js"],

		// Coverage configuration
		coverage: {
			enabled: false, // Disable for now to avoid issues
			reporter: ["text", "lcov"],
			exclude: ["node_modules/**", "tests/**", "coverage/**"],
		},

		// Globals for describe, it, expect
		globals: true,

		// Watch mode settings
		watch: false,

		// Bail on first failure
		bail: 1,
	},
};
