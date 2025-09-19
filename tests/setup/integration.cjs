// Integration test setup for Speco-Tasker
// SCOPE: 集成测试环境配置，测试组件和服务间的交互

const path = require("node:path");
const fs = require("node:fs");

// Setup integration test environment
beforeAll(async () => {
	// Create integration test utilities
	global.integrationUtils = {
		// Setup test database/file system
		setupTestEnvironment: async () => {
			const testDir = global.testUtils.createTempDir();

			// Create test configuration
			const configPath = path.join(testDir, ".speco", "config.json");
			fs.mkdirSync(path.dirname(configPath), { recursive: true });

			const testConfig = {
				project: { name: "test-project", version: "1.0.0" },
				paths: { root: testDir },
				testing: { framework: "jest" },
			};

			fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

			return testDir;
		},

		// Cleanup test environment
		cleanupTestEnvironment: (testDir) => {
			global.testUtils.cleanupTempDir(testDir);
		},

		// Mock external services
		mockExternalServices: () => {
			// Mock file system operations
			jest.mock("fs", () => ({
				...jest.requireActual("fs"),
				readFileSync: jest.fn(),
				writeFileSync: jest.fn(),
				existsSync: jest.fn(),
				mkdirSync: jest.fn(),
			}));

			// Mock path operations
			jest.mock("path", () => ({
				...jest.requireActual("path"),
				resolve: jest.fn(),
				join: jest.fn(),
			}));
		},

		// Load integration test scenarios
		loadScenario: (scenarioName) => {
			const scenarioPath = path.join(
				__dirname,
				"../fixtures/integration",
				`${scenarioName}.json`,
			);
			if (fs.existsSync(scenarioPath)) {
				return JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
			}
			return null;
		},
	};
});

afterAll(async () => {
	// Cleanup integration test resources
	global.integrationUtils = undefined;
});
