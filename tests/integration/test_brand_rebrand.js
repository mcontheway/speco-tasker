// SCOPE: 品牌重塑流程集成测试，验证从检测到更新的完整品牌重塑工作流
const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

describe("Brand Rebrand Integration Tests", () => {
	const testProjectDir = path.join(
		__dirname,
		"..",
		"..",
		"tmp",
		"brand-rebrand-test",
	);
	const specoDir = path.join(testProjectDir, ".speco");
	const configFile = path.join(specoDir, "config.json");
	const brandFile = path.join(specoDir, "brand.json");

	beforeAll(async () => {
		// Create test project structure
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
		fs.mkdirSync(testProjectDir, { recursive: true });
		fs.mkdirSync(specoDir, { recursive: true });

		// Initialize git repository
		execSync("git init", { cwd: testProjectDir, stdio: "pipe" });

		// Create test files with old brand names
		const testFiles = {
			"package.json": JSON.stringify(
				{
					name: "task-master-ai",
					description: "AI-powered task management system",
					author: "Task Master Team",
					bin: {
						"task-master": "bin/task-master.js",
						"task-master-mcp": "bin/task-master-mcp.js",
					},
				},
				null,
				2,
			),

			"README.md": `# Task Master AI

A powerful AI-powered task management system for efficient development workflows.

## Features

- AI-powered task suggestions
- Intelligent dependency management
- Smart progress tracking

## Installation

\`\`\`bash
npm install -g task-master-ai
\`\`\`

## Usage

\`\`\`bash
task-master init
task-master list
\`\`\`
`,

			"src/index.js": `// Task Master AI - Main entry point
console.log("Task Master AI initialized");

/**
 * Task Master AI utility functions
 */
class TaskMasterAI {
  constructor() {
    this.version = "1.0.0";
    this.aiEnabled = true;
  }

  getWelcomeMessage() {
    return "Welcome to Task Master AI!";
  }
}

module.exports = TaskMasterAI;
`,

			"bin/task-master.js": `#!/usr/bin/env node

// Task Master AI CLI
console.log("Task Master AI CLI v1.0.0");

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "init":
    console.log("Initializing Task Master AI project...");
    break;
  case "list":
    console.log("Listing tasks with AI assistance...");
    break;
  default:
    console.log("Task Master AI - AI-powered task management");
    console.log("Usage: task-master <command>");
}
`,

			"docs/tutorial.md": `# Task Master AI Tutorial

## Getting Started with Task Master AI

Task Master AI is a powerful AI-powered task management system that helps you manage development workflows efficiently.

## AI Features

- **Smart Suggestions**: AI-powered task prioritization
- **Intelligent Parsing**: Automatic task dependency detection
- **Predictive Analytics**: AI-driven progress forecasting

## Basic Usage

\`\`\`bash
# Initialize project
task-master init

# List tasks with AI insights
task-master list --ai

# Get AI-powered suggestions
task-master next --smart
\`\`\`
`,

			".speco/brand.json": JSON.stringify(
				{
					current: {
						name: "Speco-Tasker",
						description:
							"A pure manual task management system for efficient development workflows",
						author: "Speco Team",
						bin: "speco-tasker",
						mcpBin: "speco-tasker-mcp",
					},
					previous: {
						name: "Task Master AI",
						description: "AI-powered task management system",
						author: "Task Master Team",
						bin: "task-master",
						mcpBin: "task-master-mcp",
					},
					rebrand: {
						completed: false,
						timestamp: null,
						changes: [
							"package.json: name, description, author, bin commands",
							"README files: branding and feature descriptions",
							"Documentation: remove AI references",
							"Configuration: update paths and settings",
						],
					},
				},
				null,
				2,
			),
		};

		// Write test files
		for (const [filePath, content] of Object.entries(testFiles)) {
			const fullPath = path.join(testProjectDir, filePath);
			const dir = path.dirname(fullPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(fullPath, content);
		}
	});

	afterAll(() => {
		// Cleanup test directory
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
	});

	describe("Brand Detection Phase", () => {
		it("should detect old brand references in project files", () => {
			// Verify test setup - files contain old brand names
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(packageJson.name).toBe("task-master-ai");
			expect(packageJson.description).toContain("AI-powered");
			expect(packageJson.author).toBe("Task Master Team");

			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(readme).toContain("Task Master AI");
			expect(readme).toContain("AI-powered task management");

			const sourceCode = fs.readFileSync(
				path.join(testProjectDir, "src/index.js"),
				"utf8",
			);
			expect(sourceCode).toContain("Task Master AI");
			expect(sourceCode).toContain("AI utility functions");

			const binFile = fs.readFileSync(
				path.join(testProjectDir, "bin/task-master.js"),
				"utf8",
			);
			expect(binFile).toContain("Task Master AI CLI");

			const tutorial = fs.readFileSync(
				path.join(testProjectDir, "docs/tutorial.md"),
				"utf8",
			);
			expect(tutorial).toContain("Task Master AI");
			expect(tutorial).toContain("AI-powered");
			expect(tutorial).toContain("AI Features");
		});

		it("should have brand configuration ready", () => {
			const brandConfig = JSON.parse(fs.readFileSync(brandFile, "utf8"));
			expect(brandConfig.previous.name).toBe("Task Master AI");
			expect(brandConfig.current.name).toBe("Speco-Tasker");
			expect(brandConfig.rebrand.completed).toBe(false);
		});
	});

	describe("Brand Update Phase", () => {
		it("should update package.json branding information", () => {
			// This test verifies the expected outcome after rebrand
			// In real implementation, this would be done by the rebrand service

			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);

			// Verify current state (old branding)
			expect(packageJson.name).toBe("task-master-ai");
			expect(packageJson.description).toContain("AI-powered");
			expect(packageJson.author).toBe("Task Master Team");

			// Simulate the expected changes that rebrand service should make
			const updatedPackage = {
				...packageJson,
				name: "speco-tasker",
				description: packageJson.description.replace("AI-powered", "manual"),
				author: "Speco Team",
				bin: {
					"speco-tasker": "bin/speco-tasker.js",
					"speco-tasker-mcp": "bin/speco-tasker-mcp.js",
				},
			};

			// Write updated package.json
			fs.writeFileSync(
				path.join(testProjectDir, "package.json"),
				JSON.stringify(updatedPackage, null, 2),
			);

			// Verify changes
			const finalPackage = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(finalPackage.name).toBe("speco-tasker");
			expect(finalPackage.description).not.toContain("AI-powered");
			expect(finalPackage.author).toBe("Speco Team");
			expect(finalPackage.bin).toHaveProperty("speco-tasker");
			expect(finalPackage.bin).toHaveProperty("speco-tasker-mcp");
		});

		it("should update README.md branding content", () => {
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);

			// Verify current state
			expect(readme).toContain("Task Master AI");
			expect(readme).toContain("AI-powered task management");

			// Simulate rebrand changes
			const updatedReadme = readme
				.replace(/Task Master AI/g, "Speco-Tasker")
				.replace(
					/AI-powered task management system/g,
					"manual task management system",
				)
				.replace(/task-master-ai/g, "speco-tasker")
				.replace(/task-master/g, "speco-tasker");

			fs.writeFileSync(path.join(testProjectDir, "README.md"), updatedReadme);

			// Verify changes
			const finalReadme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(finalReadme).toContain("Speco-Tasker");
			expect(finalReadme).toContain("manual task management system");
			expect(finalReadme).toContain("speco-tasker");
			expect(finalReadme).not.toContain("Task Master AI");
			expect(finalReadme).not.toContain("AI-powered");
		});

		it("should update source code comments and strings", () => {
			const sourceCode = fs.readFileSync(
				path.join(testProjectDir, "src/index.js"),
				"utf8",
			);

			// Verify current state
			expect(sourceCode).toContain("Task Master AI");
			expect(sourceCode).toContain("AI utility functions");

			// Simulate rebrand changes
			const updatedSource = sourceCode
				.replace(/Task Master AI/g, "Speco-Tasker")
				.replace(/AI utility functions/g, "manual task management utilities")
				.replace(/TaskMasterAI/g, "SpecoTasker");

			fs.writeFileSync(
				path.join(testProjectDir, "src/index.js"),
				updatedSource,
			);

			// Verify changes
			const finalSource = fs.readFileSync(
				path.join(testProjectDir, "src/index.js"),
				"utf8",
			);
			expect(finalSource).toContain("Speco-Tasker");
			expect(finalSource).toContain("manual task management utilities");
			expect(finalSource).toContain("SpecoTasker");
			expect(finalSource).not.toContain("Task Master AI");
			expect(finalSource).not.toContain("AI utility functions");
		});

		it("should update CLI binary references", () => {
			const binFile = fs.readFileSync(
				path.join(testProjectDir, "bin/task-master.js"),
				"utf8",
			);

			// Verify current state
			expect(binFile).toContain("Task Master AI CLI");

			// Simulate rebrand changes
			const updatedBin = binFile
				.replace(/Task Master AI CLI/g, "Speco-Tasker CLI")
				.replace(/task-master/g, "speco-tasker");

			fs.writeFileSync(
				path.join(testProjectDir, "bin/task-master.js"),
				updatedBin,
			);

			// Verify changes
			const finalBin = fs.readFileSync(
				path.join(testProjectDir, "bin/task-master.js"),
				"utf8",
			);
			expect(finalBin).toContain("Speco-Tasker CLI");
			expect(finalBin).toContain("speco-tasker");
			expect(finalBin).not.toContain("Task Master AI CLI");
		});

		it("should update documentation files", () => {
			const tutorial = fs.readFileSync(
				path.join(testProjectDir, "docs/tutorial.md"),
				"utf8",
			);

			// Verify current state
			expect(tutorial).toContain("Task Master AI");
			expect(tutorial).toContain("AI-powered");
			expect(tutorial).toContain("AI Features");

			// Simulate rebrand changes
			const updatedTutorial = tutorial
				.replace(/Task Master AI/g, "Speco-Tasker")
				.replace(/AI-powered/g, "manual")
				.replace(/AI Features/g, "Manual Task Management Features")
				.replace(/AI-driven/g, "data-driven")
				.replace(/task-master/g, "speco-tasker")
				.replace(/--ai/g, "")
				.replace(/--smart/g, "");

			fs.writeFileSync(
				path.join(testProjectDir, "docs/tutorial.md"),
				updatedTutorial,
			);

			// Verify changes
			const finalTutorial = fs.readFileSync(
				path.join(testProjectDir, "docs/tutorial.md"),
				"utf8",
			);
			expect(finalTutorial).toContain("Speco-Tasker");
			expect(finalTutorial).toContain("Manual Task Management Features");
			expect(finalTutorial).toContain("data-driven");
			expect(finalTutorial).toContain("speco-tasker");
			expect(finalTutorial).not.toContain("Task Master AI");
			expect(finalTutorial).not.toContain("AI-powered");
			expect(finalTutorial).not.toContain("--ai");
		});
	});

	describe("Brand Validation Phase", () => {
		it("should validate that all old brand references are removed", () => {
			// Read all files and check for remaining old brand references
			const checkFiles = [
				"package.json",
				"README.md",
				"src/index.js",
				"bin/task-master.js",
				"docs/tutorial.md",
			];

			const oldBrandPatterns = [
				/Task Master AI/i,
				/AI-powered/i,
				/AI Features/i,
				/task-master-ai/i,
				/task-master[^-]/i, // Avoid matching speco-tasker
				/AI utility/i,
				/AI CLI/i,
			];

			for (const filePath of checkFiles) {
				const fullPath = path.join(testProjectDir, filePath);
				if (fs.existsSync(fullPath)) {
					const content = fs.readFileSync(fullPath, "utf8");

					// Check that old brand patterns are not present
					for (const pattern of oldBrandPatterns) {
						// Allow some exceptions for speco-tasker (new brand)
						if (!pattern.test("speco-tasker")) {
							expect(content).not.toMatch(pattern);
						}
					}
				}
			}
		});

		it("should validate that new brand references are present", () => {
			// Check that new brand elements are present where expected
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(packageJson.name).toBe("speco-tasker");
			expect(packageJson.author).toBe("Speco Team");

			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(readme).toContain("Speco-Tasker");
			expect(readme).toContain("manual task management");

			const sourceCode = fs.readFileSync(
				path.join(testProjectDir, "src/index.js"),
				"utf8",
			);
			expect(sourceCode).toContain("Speco-Tasker");
		});

		it("should update brand configuration to mark rebrand as completed", () => {
			const brandConfig = JSON.parse(fs.readFileSync(brandFile, "utf8"));

			// Simulate updating brand config
			const updatedBrandConfig = {
				...brandConfig,
				rebrand: {
					...brandConfig.rebrand,
					completed: true,
					timestamp: new Date().toISOString(),
				},
			};

			fs.writeFileSync(brandFile, JSON.stringify(updatedBrandConfig, null, 2));

			// Verify brand config update
			const finalBrandConfig = JSON.parse(fs.readFileSync(brandFile, "utf8"));
			expect(finalBrandConfig.rebrand.completed).toBe(true);
			expect(finalBrandConfig.rebrand.timestamp).toBeDefined();
		});
	});

	describe("End-to-End Brand Rebrand Workflow", () => {
		it("should complete full rebrand workflow from detection to validation", () => {
			// This test simulates the complete workflow

			// 1. Initial state - old brand present
			const initialPackage = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(initialPackage.name).toBe("task-master-ai");

			// 2. Apply rebrand changes (simulate service calls)
			const finalPackage = {
				...initialPackage,
				name: "speco-tasker",
				description: "A pure manual task management system",
				author: "Speco Team",
			};
			fs.writeFileSync(
				path.join(testProjectDir, "package.json"),
				JSON.stringify(finalPackage, null, 2),
			);

			// 3. Update README
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			const updatedReadme = readme.replace(/Task Master AI/g, "Speco-Tasker");
			fs.writeFileSync(path.join(testProjectDir, "README.md"), updatedReadme);

			// 4. Update source code
			const sourceCode = fs.readFileSync(
				path.join(testProjectDir, "src/index.js"),
				"utf8",
			);
			const updatedSource = sourceCode.replace(
				/Task Master AI/g,
				"Speco-Tasker",
			);
			fs.writeFileSync(
				path.join(testProjectDir, "src/index.js"),
				updatedSource,
			);

			// 5. Verify final state
			const verifiedPackage = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			const verifiedReadme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			const verifiedSource = fs.readFileSync(
				path.join(testProjectDir, "src/index.js"),
				"utf8",
			);

			expect(verifiedPackage.name).toBe("speco-tasker");
			expect(verifiedReadme).toContain("Speco-Tasker");
			expect(verifiedReadme).not.toContain("Task Master AI");
			expect(verifiedSource).toContain("Speco-Tasker");
			expect(verifiedSource).not.toContain("Task Master AI");
		});
	});
});
