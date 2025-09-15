const config = {
	// Use Node.js environment for testing
	testEnvironment: 'node',

	// Automatically clear mock calls between every test
	clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false,

	// The directory where Jest should output its coverage files
	coverageDirectory: 'coverage',

	// A list of paths to directories that Jest should use to search for files in
	roots: ['<rootDir>/tests', '<rootDir>/scripts'],

	// The glob patterns Jest uses to detect test files
	testMatch: [
		'**/__tests__/**/*.js',
		'**/__tests__/**/*.cjs',
		'**/?(*.)+(spec|test).js',
		'**/?(*.)+(spec|test).cjs',
		'**/contract/**/*.js',
		'**/contract/**/*.cjs',
		'**/integration/**/*.js',
		'**/integration/**/*.cjs'
	],

	// Transform files to handle ES modules
	transform: {
		'^.+\\.(js|ts)$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},

	// Transform ignore patterns - allow ES modules in node_modules
	transformIgnorePatterns: [
		'node_modules/(?!(supertest|chalk|boxen|@inquirer)/)',
	],

	// Set moduleNameMapper for absolute paths
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1'
	},

	// Setup module aliases
	moduleDirectories: ['node_modules', '<rootDir>'],

	// Configure test coverage thresholds
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80
		}
	},

	// Generate coverage report in these formats
	coverageReporters: ['text', 'lcov'],

	// Verbose output
	verbose: true,

	// Setup file - use .cjs extension for CommonJS
	setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],

	// Module file extensions
	moduleFileExtensions: ['js', 'cjs', 'mjs', 'json']
}

module.exports = config
