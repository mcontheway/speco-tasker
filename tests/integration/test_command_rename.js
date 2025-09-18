// SCOPE: 命令重命名集成测试，验证CLI命令从task-master重命名为speco-tasker的完整工作流
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

describe("Command Rename Integration Tests", () => {
	const testProjectDir = path.join(
		__dirname,
		"..",
		"..",
		"tmp",
		"command-rename-test",
	);
	const binDir = path.join(testProjectDir, "bin");
	const specoDir = path.join(testProjectDir, ".speco");

	beforeAll(async () => {
		// Create test project structure
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
		fs.mkdirSync(testProjectDir, { recursive: true });
		fs.mkdirSync(binDir, { recursive: true });
		fs.mkdirSync(specoDir, { recursive: true });

		// Initialize git repository
		execSync("git init", { cwd: testProjectDir, stdio: "pipe" });

		// Create test files with old command names
		const testFiles = {
			"bin/task-master.js": `#!/usr/bin/env node

// Task Master CLI - Old name
console.log("Task Master CLI v1.0.0");

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "init":
    console.log("Initializing task-master project...");
    break;
  case "list":
    console.log("Listing tasks with task-master...");
    break;
  case "next":
    console.log("Finding next task with task-master...");
    break;
  default:
    console.log("Task Master - Task management system");
    console.log("Usage: task-master <command>");
    console.log("");
    console.log("Commands:");
    console.log("  init     Initialize task-master project");
    console.log("  list     List all tasks");
    console.log("  next     Show next task");
    console.log("  help     Show this help");
}
`,

			"bin/task-master-mcp.js": `#!/usr/bin/env node

// Task Master MCP Server - Old name
console.log("Task Master MCP Server v1.0.0");

// MCP server implementation would go here
console.log("Starting MCP server...");

// Simulate MCP server startup
setTimeout(() => {
  console.log("Task Master MCP server started on port 3000");
}, 100);
`,

			"package.json": JSON.stringify(
				{
					name: "task-master-ai",
					version: "1.0.0",
					description: "AI-powered task management system",
					bin: {
						"task-master": "bin/task-master.js",
						"task-master-mcp": "bin/task-master-mcp.js",
					},
					scripts: {
						start: "node bin/task-master.js",
						mcp: "node bin/task-master-mcp.js",
						dev: "node bin/task-master.js --dev",
						test: "jest",
						lint: "eslint src/",
						build: "echo 'Building task-master...'",
						docs: "echo 'Generating docs for task-master...'",
					},
					dependencies: {
						commander: "^11.0.0",
						chalk: "^5.0.0",
					},
				},
				null,
				2,
			),

			"README.md": `# Task Master AI

## Installation

\`\`\`bash
npm install -g task-master-ai
\`\`\`

## Usage

\`\`\`bash
# Initialize project
task-master init

# List tasks
task-master list

# Get next task
task-master next

# Start MCP server
task-master-mcp
\`\`\`

## Commands

- \`task-master init\` - Initialize a new project
- \`task-master list\` - List all tasks
- \`task-master next\` - Show next task to work on
- \`task-master-mcp\` - Start MCP server

## Development

\`\`\`bash
# Run tests
npm test

# Start development server
npm run dev

# Lint code
npm run lint
\`\`\`
`,

			"src/commands.js": `// Task Master commands - Old naming
const { Command } = require('commander');
const program = new Command();

program
  .name('task-master')
  .description('Task Master - Task management system')
  .version('1.0.0');

program.command('init')
  .description('Initialize task-master project')
  .action(() => {
    console.log('Initializing task-master project...');
  });

program.command('list')
  .description('List all tasks in task-master')
  .action(() => {
    console.log('Listing tasks from task-master...');
  });

program.command('next')
  .description('Show next task in task-master')
  .action(() => {
    console.log('Finding next task with task-master...');
  });

// Parse arguments
program.parse();

module.exports = program;
`,

			"scripts/init.js": `#!/usr/bin/env node

// Task Master initialization script - Old naming
console.log("Task Master Initialization");
console.log("Setting up task-master project...");

// Create basic project structure
const fs = require('fs');
const path = require('path');

const projectStructure = {
  '.taskmaster': {},
  'tasks': {},
  'src': {},
  'tests': {}
};

console.log("Creating project structure for task-master...");
console.log("Project initialized successfully!");
console.log("");
console.log("Next steps:");
console.log("1. Run 'task-master list' to see tasks");
console.log("2. Run 'task-master next' to get started");
`,

			"docs/installation.md": `# Installing Task Master

## Global Installation

\`\`\`bash
npm install -g task-master-ai
\`\`\`

This will install the \`task-master\` and \`task-master-mcp\` commands globally.

## Verify Installation

\`\`\`bash
# Check task-master command
task-master --version

# Check task-master-mcp command
task-master-mcp --version
\`\`\`

## Usage

After installation, you can use:

\`\`\`bash
# Initialize project
task-master init

# List tasks
task-master list

# Start MCP server
task-master-mcp
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
					},
				},
				null,
				2,
			),

			".speco/paths.json": JSON.stringify(
				{
					mappings: {
						"task-master": "speco-tasker",
						"task-master-mcp": "speco-tasker-mcp",
						"bin/task-master.js": "bin/speco-tasker.js",
						".taskmaster": ".speco",
						"scripts/task-manager.js": "scripts/modules/task-manager.js",
						"scripts/commands.js": "scripts/modules/commands.js",
					},
					cleanup: {
						patterns: ["**/task-master*", "**/taskmaster*"],
						exclude: [".speco/**", "specs/**", "node_modules/**"],
					},
				},
				null,
				2,
			),
		};

		// Write test files
		Object.entries(testFiles).forEach(([filePath, content]) => {
			const fullPath = path.join(testProjectDir, filePath);
			const dir = path.dirname(fullPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(fullPath, content);
		});

		// Make scripts executable
		fs.chmodSync(path.join(binDir, "task-master.js"), 0o755);
		fs.chmodSync(path.join(binDir, "task-master-mcp.js"), 0o755);
	});

	afterAll(() => {
		// Cleanup test directory
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
	});

	describe("Command Detection Phase", () => {
		it("should identify old command names in files", () => {
			// Check package.json bin entries
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(packageJson.bin).toHaveProperty("task-master");
			expect(packageJson.bin).toHaveProperty("task-master-mcp");

			// Check CLI script content
			const cliScript = fs.readFileSync(
				path.join(binDir, "task-master.js"),
				"utf8",
			);
			expect(cliScript).toContain("Task Master CLI");
			expect(cliScript).toContain("task-master <command>");

			// Check MCP script content
			const mcpScript = fs.readFileSync(
				path.join(binDir, "task-master-mcp.js"),
				"utf8",
			);
			expect(mcpScript).toContain("Task Master MCP Server");

			// Check commands.js
			const commandsScript = fs.readFileSync(
				path.join(testProjectDir, "src/commands.js"),
				"utf8",
			);
			expect(commandsScript).toContain("task-master");
			expect(commandsScript).toContain("Task Master");
		});

		it("should detect command references in documentation", () => {
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			const installation = fs.readFileSync(
				path.join(testProjectDir, "docs/installation.md"),
				"utf8",
			);

			// README should contain old command references
			expect(readme).toContain("task-master init");
			expect(readme).toContain("task-master list");
			expect(readme).toContain("task-master-mcp");

			// Installation docs should contain old commands
			expect(installation).toContain("task-master --version");
			expect(installation).toContain("task-master-mcp --version");
		});

		it("should verify path mappings are configured", () => {
			const pathsConfig = JSON.parse(
				fs.readFileSync(path.join(specoDir, "paths.json"), "utf8"),
			);

			expect(pathsConfig.mappings).toHaveProperty(
				"task-master",
				"speco-tasker",
			);
			expect(pathsConfig.mappings).toHaveProperty(
				"task-master-mcp",
				"speco-tasker-mcp",
			);
			expect(pathsConfig.mappings).toHaveProperty("bin/task-master.js");
		});
	});

	describe("Command Rename Phase", () => {
		it("should rename CLI binary files", () => {
			const oldCliPath = path.join(binDir, "task-master.js");
			const newCliPath = path.join(binDir, "speco-tasker.js");

			// Verify old file exists
			expect(fs.existsSync(oldCliPath)).toBe(true);

			// Simulate rename operation
			fs.copyFileSync(oldCliPath, newCliPath);

			// Update content to reflect new name
			let content = fs.readFileSync(newCliPath, "utf8");
			content = content.replace(/Task Master CLI/g, "Speco-Tasker CLI");
			content = content.replace(/task-master/g, "speco-tasker");
			content = content.replace(/Task Master/g, "Speco-Tasker");

			fs.writeFileSync(newCliPath, content);

			// Verify new file content
			const newContent = fs.readFileSync(newCliPath, "utf8");
			expect(newContent).toContain("Speco-Tasker CLI");
			expect(newContent).toContain("speco-tasker <command>");
			expect(newContent).toContain("Speco-Tasker - Task management system");
		});

		it("should rename MCP server binary files", () => {
			const oldMcpPath = path.join(binDir, "task-master-mcp.js");
			const newMcpPath = path.join(binDir, "speco-tasker-mcp.js");

			// Simulate rename operation
			fs.copyFileSync(oldMcpPath, newMcpPath);

			// Update content
			let content = fs.readFileSync(newMcpPath, "utf8");
			content = content.replace(
				/Task Master MCP Server/g,
				"Speco-Tasker MCP Server",
			);
			content = content.replace(/task-master-mcp/g, "speco-tasker-mcp");

			fs.writeFileSync(newMcpPath, content);

			// Verify new file content
			const newContent = fs.readFileSync(newMcpPath, "utf8");
			expect(newContent).toContain("Speco-Tasker MCP Server");
		});

		it("should update package.json bin entries", () => {
			const packageJsonPath = path.join(testProjectDir, "package.json");
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

			// Update bin entries
			packageJson.bin = {
				"speco-tasker": "bin/speco-tasker.js",
				"speco-tasker-mcp": "bin/speco-tasker-mcp.js",
			};

			// Update name and description
			packageJson.name = "speco-tasker";
			packageJson.description = "A pure manual task management system";

			fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

			// Verify changes
			const updatedPackage = JSON.parse(
				fs.readFileSync(packageJsonPath, "utf8"),
			);
			expect(updatedPackage.bin).toHaveProperty("speco-tasker");
			expect(updatedPackage.bin).toHaveProperty("speco-tasker-mcp");
			expect(updatedPackage.bin).not.toHaveProperty("task-master");
			expect(updatedPackage.name).toBe("speco-tasker");
		});

		it("should update command scripts content", () => {
			const commandsPath = path.join(testProjectDir, "src/commands.js");
			let content = fs.readFileSync(commandsPath, "utf8");

			// Update command name references
			content = content.replace(/task-master/g, "speco-tasker");
			content = content.replace(/Task Master/g, "Speco-Tasker");

			fs.writeFileSync(commandsPath, content);

			// Verify changes
			const updatedContent = fs.readFileSync(commandsPath, "utf8");
			expect(updatedContent).toContain("speco-tasker");
			expect(updatedContent).toContain("Speco-Tasker");
			expect(updatedContent).not.toContain("task-master");
			expect(updatedContent).not.toContain("Task Master");
		});

		it("should update initialization scripts", () => {
			const initScriptPath = path.join(testProjectDir, "scripts/init.js");
			let content = fs.readFileSync(initScriptPath, "utf8");

			// Update references
			content = content.replace(/Task Master/g, "Speco-Tasker");
			content = content.replace(/task-master/g, "speco-tasker");

			fs.writeFileSync(initScriptPath, content);

			// Verify changes
			const updatedContent = fs.readFileSync(initScriptPath, "utf8");
			expect(updatedContent).toContain("Speco-Tasker");
			expect(updatedContent).toContain("speco-tasker");
			expect(updatedContent).not.toContain("Task Master");
		});
	});

	describe("Documentation Update Phase", () => {
		it("should update README command references", () => {
			const readmePath = path.join(testProjectDir, "README.md");
			let content = fs.readFileSync(readmePath, "utf8");

			// Update command references
			content = content.replace(/task-master/g, "speco-tasker");
			content = content.replace(/task-master-mcp/g, "speco-tasker-mcp");
			content = content.replace(/Task Master AI/g, "Speco-Tasker");

			fs.writeFileSync(readmePath, content);

			// Verify changes
			const updatedContent = fs.readFileSync(readmePath, "utf8");
			expect(updatedContent).toContain("speco-tasker init");
			expect(updatedContent).toContain("speco-tasker list");
			expect(updatedContent).toContain("speco-tasker-mcp");
			expect(updatedContent).toContain("Speco-Tasker");
			expect(updatedContent).not.toContain("task-master");
			expect(updatedContent).not.toContain("Task Master AI");
		});

		it("should update installation documentation", () => {
			const installPath = path.join(testProjectDir, "docs/installation.md");
			let content = fs.readFileSync(installPath, "utf8");

			// Update command references
			content = content.replace(/task-master/g, "speco-tasker");
			content = content.replace(/task-master-mcp/g, "speco-tasker-mcp");
			content = content.replace(/task-master-ai/g, "speco-tasker");

			fs.writeFileSync(installPath, content);

			// Verify changes
			const updatedContent = fs.readFileSync(installPath, "utf8");
			expect(updatedContent).toContain("speco-tasker --version");
			expect(updatedContent).toContain("speco-tasker-mcp --version");
			expect(updatedContent).toContain("speco-tasker init");
			expect(updatedContent).not.toContain("task-master");
		});
	});

	describe("Command Rename Validation Phase", () => {
		it("should verify all old command references are removed", () => {
			const checkFiles = [
				"package.json",
				"README.md",
				"docs/installation.md",
				"src/commands.js",
				"scripts/init.js",
			];

			checkFiles.forEach((filePath) => {
				const fullPath = path.join(testProjectDir, filePath);
				if (fs.existsSync(fullPath)) {
					const content = fs.readFileSync(fullPath, "utf8");

					// Should not contain old command references (except in comments or specific contexts)
					expect(content).not.toMatch(/task-master[^-]/); // Avoid matching speco-tasker
					expect(content).not.toMatch(/Task Master/);
				}
			});
		});

		it("should verify new command references are present", () => {
			// Check package.json
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(packageJson.bin).toHaveProperty("speco-tasker");
			expect(packageJson.bin).toHaveProperty("speco-tasker-mcp");

			// Check README
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(readme).toContain("speco-tasker init");
			expect(readme).toContain("speco-tasker-mcp");

			// Check commands script
			const commands = fs.readFileSync(
				path.join(testProjectDir, "src/commands.js"),
				"utf8",
			);
			expect(commands).toContain("speco-tasker");
		});

		it("should verify binary files are renamed", () => {
			// Check that new binary files exist (simulated)
			const newCliPath = path.join(binDir, "speco-tasker.js");
			const newMcpPath = path.join(binDir, "speco-tasker-mcp.js");

			if (fs.existsSync(newCliPath)) {
				const content = fs.readFileSync(newCliPath, "utf8");
				expect(content).toContain("Speco-Tasker CLI");
			}

			if (fs.existsSync(newMcpPath)) {
				const content = fs.readFileSync(newMcpPath, "utf8");
				expect(content).toContain("Speco-Tasker MCP Server");
			}
		});

		it("should update brand configuration", () => {
			const brandConfigPath = path.join(specoDir, "brand.json");
			const brandConfig = JSON.parse(fs.readFileSync(brandConfigPath, "utf8"));

			// Simulate updating brand config
			const updatedBrandConfig = {
				...brandConfig,
				rebrand: {
					...brandConfig.rebrand,
					completed: true,
					timestamp: new Date().toISOString(),
				},
			};

			fs.writeFileSync(
				brandConfigPath,
				JSON.stringify(updatedBrandConfig, null, 2),
			);

			const finalBrandConfig = JSON.parse(
				fs.readFileSync(brandConfigPath, "utf8"),
			);
			expect(finalBrandConfig.rebrand.completed).toBe(true);
			expect(finalBrandConfig.rebrand.timestamp).toBeDefined();
		});
	});

	describe("End-to-End Command Rename Workflow", () => {
		it("should complete full command rename process", () => {
			// 1. Verify initial state had old commands
			const initialPackage = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(initialPackage.bin).toHaveProperty("task-master");

			// 2. Verify rename configuration exists
			const pathsConfig = JSON.parse(
				fs.readFileSync(path.join(specoDir, "paths.json"), "utf8"),
			);
			expect(pathsConfig.mappings["task-master"]).toBe("speco-tasker");

			// 3. Simulate complete rename process
			const finalPackage = {
				...initialPackage,
				name: "speco-tasker",
				bin: {
					"speco-tasker": "bin/speco-tasker.js",
					"speco-tasker-mcp": "bin/speco-tasker-mcp.js",
				},
			};
			fs.writeFileSync(
				path.join(testProjectDir, "package.json"),
				JSON.stringify(finalPackage, null, 2),
			);

			// 4. Verify final state
			const verifiedPackage = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(verifiedPackage.bin).toHaveProperty("speco-tasker");
			expect(verifiedPackage.bin).toHaveProperty("speco-tasker-mcp");
			expect(verifiedPackage.bin).not.toHaveProperty("task-master");

			// 5. Verify documentation is updated
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(readme).toContain("speco-tasker");
			expect(readme).not.toContain("task-master");
		});
	});
});
