// E2E test setup for Speco-Tasker
// SCOPE: 端到端测试环境配置，测试完整用户工作流

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

// Setup E2E test environment
beforeAll(async () => {
	// Create E2E test utilities
	global.e2eUtils = {
		// Setup complete test project
		setupTestProject: async () => {
			const testProjectDir = global.testUtils.createTempDir();

			// Initialize git repository
			execSync("git init", { cwd: testProjectDir, stdio: "pipe" });

			// Create basic project structure
			const structure = {
				"package.json": JSON.stringify(
					{
						name: "test-project",
						version: "1.0.0",
						scripts: { test: 'echo "test"' },
					},
					null,
					2,
				),
				"README.md": "# Test Project",
				"src/index.js": 'console.log("Hello World");',
				"tests/unit/example.test.js":
					'test("example", () => { expect(true).toBe(true); });',
			};

			Object.entries(structure).forEach(([filePath, content]) => {
				const fullPath = path.join(testProjectDir, filePath);
				fs.mkdirSync(path.dirname(fullPath), { recursive: true });
				fs.writeFileSync(fullPath, content);
			});

			// Initialize Speco-Tasker in test project
			execSync("npm install", { cwd: testProjectDir, stdio: "pipe" });

			return testProjectDir;
		},

		// Execute CLI commands
		executeCliCommand: (command, cwd) => {
			try {
				const result = execSync(command, {
					cwd,
					stdio: "pipe",
					encoding: "utf8",
					timeout: 30000,
				});
				return { success: true, output: result };
			} catch (error) {
				return {
					success: false,
					error: error.message,
					output: error.stdout || "",
				};
			}
		},

		// Mock user interactions
		mockUserInput: (inputs) => {
			// Mock inquirer or other interactive libraries
			const mockPrompt = jest.fn();
			inputs.forEach((input) => mockPrompt.mockResolvedValueOnce(input));

			jest.mock("inquirer", () => ({
				prompt: mockPrompt,
			}));

			return mockPrompt;
		},

		// Verify file system state
		verifyProjectStructure: (projectDir, expectedStructure) => {
			expectedStructure.forEach((filePath) => {
				const fullPath = path.join(projectDir, filePath);
				expect(fs.existsSync(fullPath)).toBe(true);
			});
		},

		// Load E2E test scenarios
		loadE2eScenario: (scenarioName) => {
			const scenarioPath = path.join(
				__dirname,
				"../fixtures/e2e",
				scenarioName + ".json",
			);
			if (fs.existsSync(scenarioPath)) {
				return JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
			}
			return null;
		},
	};
});

afterAll(async () => {
	// Cleanup E2E test resources
	delete global.e2eUtils;
});
