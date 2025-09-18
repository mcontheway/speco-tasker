// ESLint configuration for Speco-Tasker
// Complements Biome for additional Node.js specific rules

module.exports = {
	// Use modern ESLint flat config approach
	root: true,

	// Environment
	env: {
		node: true,
		es2022: true,
		jest: true,
	},

	// Extend recommended configurations
	extends: ["eslint:recommended"],

	// Parser options
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: "module",
		allowImportExportEverywhere: true,
	},

	// Global variables
	globals: {
		global: "readonly",
		process: "readonly",
		console: "readonly",
		Buffer: "readonly",
		__dirname: "readonly",
		__filename: "readonly",
	},

	// Custom rules for Speco-Tasker
	rules: {
		// Error rules - strict enforcement
		"no-console": "off", // Allow console in CLI tools
		"no-debugger": "error",
		"no-duplicate-imports": "error",
		"no-self-compare": "error",
		"no-template-curly-in-string": "error",
		"no-unreachable-loop": "error",
		"no-unsafe-negation": "error",
		"require-atomic-updates": "error",

		// Warning rules - code quality
		complexity: ["warn", 10],
		"max-depth": ["warn", 4],
		"max-lines": ["warn", 300],
		"max-lines-per-function": ["warn", 50],
		"max-nested-callbacks": ["warn", 3],
		"max-params": ["warn", 4],

		// Code style
		"prefer-const": "error",
		"no-var": "error",
		"object-shorthand": "warn",
		"prefer-arrow-callback": "warn",
		"prefer-template": "warn",

		// Node.js specific
		"no-new-require": "error",
		"no-path-concat": "error",
		"handle-callback-err": "warn",

		// Promises and async
		"no-async-promise-executor": "error",

		// Best practices
		"array-callback-return": "error",
		"consistent-return": "warn",
		"default-case": "warn",
		"dot-notation": "warn",
		eqeqeq: ["error", "always"],
		"no-alert": "error",
		"no-caller": "error",
		"no-case-declarations": "error",
		"no-else-return": "warn",
		"no-empty-function": "warn",
		"no-eq-null": "error",
		"no-eval": "error",
		"no-extend-native": "error",
		"no-extra-bind": "warn",
		"no-floating-decimal": "error",
		"no-global-assign": "error",
		"no-implicit-coercion": "warn",
		"no-implicit-globals": "error",
		"no-invalid-this": "warn",
		"no-iterator": "error",
		"no-labels": "error",
		"no-lone-blocks": "error",
		"no-loop-func": "warn",
		"no-multi-str": "error",
		"no-new": "warn",
		"no-new-wrappers": "error",
		"no-octal": "error",
		"no-octal-escape": "error",
		"no-param-reassign": "warn",
		"no-proto": "error",
		"no-return-assign": "error",
		"no-return-await": "warn",
		"no-script-url": "error",
		"no-sequences": "error",
		"no-throw-literal": "error",
		"no-undef-init": "warn",
		"no-underscore-dangle": "off", // Allow underscores in private methods
		"no-unmodified-loop-condition": "error",
		"no-unused-expressions": "error",
		"no-useless-call": "error",
		"no-useless-concat": "error",
		"no-useless-return": "error",
		"no-void": "error",
		"prefer-promise-reject-errors": "error",
		radix: "error",
		"require-await": "off",
		"vars-on-top": "error",
		"wrap-iife": ["error", "any"],
		yoda: ["error", "never"],
	},

	// File-specific overrides
	overrides: [
		{
			// Test files
			files: [
				"tests/**/*.js",
				"tests/**/*.cjs",
				"tests/**/*.mjs",
				"**/*.test.js",
				"**/*.test.cjs",
				"**/*.test.mjs",
			],
			env: {
				jest: true,
				node: true,
			},
			rules: {
				"max-lines": "off",
				"max-lines-per-function": "off",
				"no-console": "off",
				"max-nested-callbacks": "off",
			},
		},
		{
			// Configuration files
			files: [
				"*.config.js",
				"*.config.cjs",
				"*.config.mjs",
				".eslintrc.cjs",
				"jest.config.cjs",
			],
			env: {
				node: true,
			},
			rules: {
				"no-console": "off",
			},
		},
		{
			// Speco configuration files
			files: [".speco/**/*.js", ".speco/**/*.json"],
			rules: {
				"no-console": "off",
				"max-lines": "off",
			},
		},
	],

	// Ignore patterns
	ignorePatterns: [
		"node_modules/",
		"coverage/",
		"dist/",
		"build/",
		".speco/logs/",
		".speco/backups/",
		"tmp/",
		"*.min.js",
	],
};
