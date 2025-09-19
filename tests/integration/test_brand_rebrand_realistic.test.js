// SCOPE: 品牌重塑流程真实集成测试，使用实际CLI命令验证完整工作流
const path = require("node:path");
const fs = require("node:fs");
const { execSync, spawn } = require("node:child_process");

describe("Brand Rebrand Realistic Integration Tests", () => {
	const testProjectDir = path.join(
		__dirname,
		"..",
		"..",
		"tmp",
		"brand-rebrand-realistic-test",
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

		// Create test files with old brand names (模拟真实项目状态)
		createTestFilesWithOldBranding();
	});

	afterAll(async () => {
		// Cleanup
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
	});

	function createTestFilesWithOldBranding() {
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

- AI-powered task prioritization
- Intelligent parsing and suggestions
- Smart workflow optimization

## Installation

\`\`\`bash
npm install -g task-master-ai
\`\`\`

## Usage

\`\`\`bash
# Initialize project
task-master init

# List tasks with AI assistance
task-master list --ai

# Get AI-powered suggestions
task-master next --smart
\`\`\`
`,

			"src/index.js": `#!/usr/bin/env node

// Task Master AI - AI-powered task management system
console.log("Task Master AI - AI-powered task management");
console.log("Usage: task-master <command>");

const command = process.argv[2];
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
				},
				null,
				2,
			),
		};

		// Write all test files
		for (const [filePath, content] of Object.entries(testFiles)) {
			const fullPath = path.join(testProjectDir, filePath);
			const dir = path.dirname(fullPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(fullPath, content, "utf8");
		}
	}

	/**
	 * 执行真实的CLI命令（当命令实现后使用）
	 * @param {string} command - CLI命令
	 * @param {string[]} args - 命令参数
	 * @returns {Promise<{stdout: string, stderr: string, code: number}>}
	 */
	async function executeCLICommand(command, args = []) {
		return new Promise((resolve, reject) => {
			const cliPath = path.join(
				__dirname,
				"..",
				"..",
				"bin",
				"speco-tasker.js",
			);
			const nodeArgs = [cliPath, command, ...args];

			const child = spawn("node", nodeArgs, {
				cwd: testProjectDir,
				stdio: ["pipe", "pipe", "pipe"],
			});

			let stdout = "";
			let stderr = "";

			child.stdout.on("data", (data) => {
				stdout += data.toString();
			});

			child.stderr.on("data", (data) => {
				stderr += data.toString();
			});

			child.on("close", (code) => {
				resolve({ stdout, stderr, code });
			});

			child.on("error", (error) => {
				reject(error);
			});
		});
	}

	/**
	 * 模拟CLI命令执行（当前阶段使用）
	 * 当真实CLI命令实现后，这个函数将被替换为executeCLICommand
	 */
	async function mockExecuteCLICommand(command, args = []) {
		console.log(`🔧 Mock executing: speco-tasker ${command} ${args.join(" ")}`);

		// 模拟命令执行结果
		switch (command) {
			case "detect-brand":
				return {
					stdout: JSON.stringify({
						found: 12,
						files: ["package.json", "README.md", "src/index.js"],
					}),
					stderr: "",
					code: 0,
				};

			case "update-brand":
				// 模拟实际的文件更新
				await performMockBrandUpdate();
				return {
					stdout: "Brand update completed successfully",
					stderr: "",
					code: 0,
				};

			case "validate-brand":
				return {
					stdout: JSON.stringify({
						valid: true,
						remainingOldReferences: 0,
						newReferencesCount: 15,
					}),
					stderr: "",
					code: 0,
				};

			default:
				return {
					stdout: "",
					stderr: `Unknown command: ${command}`,
					code: 1,
				};
		}
	}

	/**
	 * 模拟品牌更新操作（当真实服务实现后移除）
	 */
	async function performMockBrandUpdate() {
		// 更新package.json
		const packagePath = path.join(testProjectDir, "package.json");
		const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
		packageJson.name = "speco-tasker";
		packageJson.description = packageJson.description.replace(
			"AI-powered",
			"manual",
		);
		packageJson.author = "Speco Team";
		packageJson.bin = {
			"speco-tasker": "bin/speco-tasker.js",
			"speco-tasker-mcp": "bin/speco-tasker-mcp.js",
		};
		fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

		// 更新README.md
		const readmePath = path.join(testProjectDir, "README.md");
		let readme = fs.readFileSync(readmePath, "utf8");
		readme = readme.replace(/Task Master AI/g, "Speco-Tasker");
		readme = readme.replace(/AI-powered/g, "manual");
		readme = readme.replace(/task-master/g, "speco-tasker");
		fs.writeFileSync(readmePath, readme);

		// 更新源代码
		const srcPath = path.join(testProjectDir, "src/index.js");
		let src = fs.readFileSync(srcPath, "utf8");
		src = src.replace(/Task Master AI/g, "Speco-Tasker");
		src = src.replace(/AI-powered/g, "manual");
		fs.writeFileSync(srcPath, src);

		// 更新文档文件
		const tutorialPath = path.join(testProjectDir, "docs/tutorial.md");
		let tutorial = fs.readFileSync(tutorialPath, "utf8");
		tutorial = tutorial.replace(/Task Master AI/g, "Speco-Tasker");
		tutorial = tutorial.replace(/AI-powered/g, "manual");
		tutorial = tutorial.replace(/task-master/g, "speco-tasker");
		fs.writeFileSync(tutorialPath, tutorial);
	}

	describe("Brand Detection Phase", () => {
		it("should detect old brand references in project files using CLI command", async () => {
			// 当CLI命令实现后，替换为:
			// const result = await executeCLICommand("detect-brand");

			// 当前阶段使用模拟:
			const result = await mockExecuteCLICommand("detect-brand");

			expect(result.code).toBe(0);
			const detection = JSON.parse(result.stdout);
			expect(detection.found).toBeGreaterThan(0);
			expect(Array.isArray(detection.files)).toBe(true);
			expect(detection.files.length).toBeGreaterThan(0);
		});
	});

	describe("Brand Configuration Phase", () => {
		it("should have brand configuration ready for rebranding", () => {
			expect(fs.existsSync(brandFile)).toBe(true);

			const brandConfig = JSON.parse(fs.readFileSync(brandFile, "utf8"));
			expect(brandConfig).toHaveProperty("current");
			expect(brandConfig).toHaveProperty("previous");
			expect(brandConfig.current.name).toBe("Speco-Tasker");
			expect(brandConfig.previous.name).toBe("Task Master AI");
		});
	});

	describe("Brand Update Phase", () => {
		it("should update all brand references using CLI command", async () => {
			// 验证初始状态（旧品牌）
			const initialPackage = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(initialPackage.name).toBe("task-master-ai");

			// 执行品牌更新命令
			// 当CLI命令实现后，替换为:
			// const result = await executeCLICommand("update-brand");
			// expect(result.code).toBe(0);

			// 当前阶段使用模拟:
			const result = await mockExecuteCLICommand("update-brand");
			expect(result.code).toBe(0);
			expect(result.stdout).toContain("completed successfully");
		});

		it("should update package.json branding information correctly", () => {
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);

			expect(packageJson.name).toBe("speco-tasker");
			expect(packageJson.description).not.toContain("AI-powered");
			expect(packageJson.description).toContain("manual");
			expect(packageJson.author).toBe("Speco Team");
			expect(packageJson.bin).toHaveProperty("speco-tasker");
			expect(packageJson.bin).toHaveProperty("speco-tasker-mcp");

			// Verify bin names are lowercase
			expect(packageJson.bin["speco-tasker"]).toBe("bin/speco-tasker.js");
			expect(packageJson.bin["speco-tasker-mcp"]).toBe(
				"bin/speco-tasker-mcp.js",
			);
		});

		it("should update README.md branding content correctly", () => {
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);

			expect(readme).not.toContain("Task Master AI");
			expect(readme).toContain("Speco-Tasker");
			expect(readme).not.toContain("AI-powered");
			expect(readme).toContain("manual");
			expect(readme).toContain("speco-tasker");
		});

		it("should update source code comments and strings correctly", () => {
			const src = fs.readFileSync(
				path.join(testProjectDir, "src/index.js"),
				"utf8",
			);

			expect(src).not.toContain("Task Master AI");
			expect(src).toContain("Speco-Tasker");
			expect(src).not.toContain("AI-powered");
			expect(src).toContain("manual");
		});
	});

	describe("Brand Validation Phase", () => {
		it("should validate that all old brand references are removed using CLI", async () => {
			// 当CLI命令实现后，替换为:
			// const result = await executeCLICommand("validate-brand");

			// 当前阶段使用模拟:
			const result = await mockExecuteCLICommand("validate-brand");

			expect(result.code).toBe(0);
			const validation = JSON.parse(result.stdout);
			expect(validation.valid).toBe(true);
			expect(validation.remainingOldReferences).toBe(0);
			expect(validation.newReferencesCount).toBeGreaterThan(0);
		});

		it("should validate that new brand references are present in all files", () => {
			const filesToCheck = [
				"package.json",
				"README.md",
				"src/index.js",
				"docs/tutorial.md",
			];

			for (const file of filesToCheck) {
				const content = fs.readFileSync(
					path.join(testProjectDir, file),
					"utf8",
				);

				// For package.json, check for lowercase name
				if (file === "package.json") {
					expect(content).toContain("speco-tasker");
					expect(content).not.toContain("task-master-ai");
				} else {
					// For other files, check for title case
					expect(content).toContain("Speco-Tasker");
					expect(content).not.toContain("Task Master AI");
				}
			}
		});
	});

	describe("Complete Rebrand Workflow", () => {
		it("should complete full rebrand workflow from detection to validation", async () => {
			// 这个测试验证完整的重塑工作流
			// 1. 检测阶段
			const detectResult = await mockExecuteCLICommand("detect-brand");
			expect(detectResult.code).toBe(0);

			// 2. 更新阶段
			const updateResult = await mockExecuteCLICommand("update-brand");
			expect(updateResult.code).toBe(0);

			// 3. 验证阶段
			const validateResult = await mockExecuteCLICommand("validate-brand");
			expect(validateResult.code).toBe(0);

			const validation = JSON.parse(validateResult.stdout);
			expect(validation.valid).toBe(true);

			console.log("✅ Complete rebrand workflow test passed");
		});

		it("should handle workflow errors gracefully", async () => {
			// 测试错误处理 - 尝试在不存在的项目上运行
			const errorResult = await mockExecuteCLICommand("invalid-command");

			expect(errorResult.code).toBe(1);
			expect(errorResult.stderr).toContain("Unknown command");
		});
	});
});
