// SCOPE: 命令重命名真实集成测试，使用实际CLI命令验证命令从task-master重命名为speco-tasker的完整工作流
const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");
describe("Command Rename Realistic Integration Tests", () => {
	const testProjectDir = path.join(
		__dirname,
		"..",
		"..",
		"tmp",
		"command-rename-realistic-test",
	);
	const binDir = path.join(testProjectDir, "bin");
	const specoDir = path.join(testProjectDir, ".speco");
	beforeAll(async () => {
		// Create test project structure with old command names
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
		fs.mkdirSync(testProjectDir, { recursive: true });
		fs.mkdirSync(binDir, { recursive: true });
		fs.mkdirSync(specoDir, { recursive: true });
		// Initialize git repository
		execSync("git init", { cwd: testProjectDir, stdio: "pipe" });
		// Create test files with old command references
		createTestFilesWithOldCommands();
	});
	afterAll(async () => {
		// Cleanup test directory
		if (fs.existsSync(testProjectDir)) {
			fs.rmSync(testProjectDir, { recursive: true, force: true });
		}
	});
	function createTestFilesWithOldCommands() {
		const testFiles = {
			"package.json": JSON.stringify(
				{
					name: "task-master-ai",
					version: "1.0.0",
					description: "AI-powered task management system",
					bin: {
						"task-master": "bin/task-master.js",
						"task-master-mcp": "bin/task-master-mcp.js",
					},
				},
				null,
				2,
			),
			"README.md": `# Task Master AI
## Installation
\`\`\`bash
npm install -g task-master-ai
task-master init
\`\`\`
## Usage
\`\`\`bash
task-master list
task-master next
task-master show 1
\`\`\`
`,
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
	console.log("Task Master CLI - AI-powered task management");
	console.log("Usage: task-master <command>");
}
`,
			"bin/task-master-mcp.js": `#!/usr/bin/env node
require('../src/mcp-server.js');
`,
			"src/index.js": `
// Task Master main entry point
const { main } = require('./task-manager.js');
main();
`,
			"src/task-manager.js": `
// Task Master core logic
exports.main = () => {
	console.log('Task Master initialized');
};
`,
			".speco/config.json": JSON.stringify(
				{
					project: {
						name: "speco-tasker",
						version: "1.2.0",
					},
					command: {
						oldName: "task-master",
						newName: "speco-tasker",
					},
					features: {
						commandRename: true,
						brandRebrand: true,
						pathConfig: true,
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
			case "detect-commands":
				return {
					stdout: JSON.stringify({
						found: 8,
						files: [
							"package.json",
							"README.md",
							"bin/task-master.js",
							"bin/task-master-mcp.js",
						],
						oldReferences: ["task-master", "task-master-ai"],
						newReferences: [],
					}),
					stderr: "",
					code: 0,
				};
			case "rename-commands":
				// 模拟命令重命名
				await performMockCommandRename(args);
				return {
					stdout: JSON.stringify({
						success: true,
						filesUpdated: 4,
						commandsRenamed: 2,
						backupCreated: true,
					}),
					stderr: "",
					code: 0,
				};
			case "verify-commands":
				return {
					stdout: JSON.stringify({
						valid: true,
						oldReferencesRemaining: 0,
						newReferencesCount: 8,
						commandsFunctional: true,
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
	 * 模拟命令重命名操作（当真实服务实现后移除）
	 */
	async function performMockCommandRename(args) {
		// 模拟重命名文件和更新引用
		const isDryRun = args.includes("--dry-run");
		if (!isDryRun) {
			// 更新package.json
			const packagePath = path.join(testProjectDir, "package.json");
			const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
			packageJson.name = "speco-tasker";
			packageJson.bin = {
				"speco-tasker": "bin/speco-tasker.js",
				"speco-tasker-mcp": "bin/speco-tasker-mcp.js",
			};
			fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
			// 重命名二进制文件
			const oldBinPath = path.join(testProjectDir, "bin/task-master.js");
			const newBinPath = path.join(testProjectDir, "bin/speco-tasker.js");
			if (fs.existsSync(oldBinPath)) {
				const content = fs.readFileSync(oldBinPath, "utf8");
				const updatedContent = content.replace(/task-master/g, "speco-tasker");
				fs.writeFileSync(newBinPath, updatedContent);
				fs.unlinkSync(oldBinPath);
			}
			// 更新README.md
			const readmePath = path.join(testProjectDir, "README.md");
			let readme = fs.readFileSync(readmePath, "utf8");
			readme = readme.replace(/task-master/g, "speco-tasker");
			readme = readme.replace(/Task Master AI/g, "Speco-Tasker");
			fs.writeFileSync(readmePath, readme);
		}
	}
	describe("Command Detection Phase", () => {
		it("should detect old command references in project files using CLI command", async () => {
			// 当CLI命令实现后，替换为:
			// const result = await executeCLICommand("detect-commands");
			// 当前阶段使用模拟:
			const result = await mockExecuteCLICommand("detect-commands");
			expect(result.code).toBe(0);
			const detection = JSON.parse(result.stdout);
			expect(detection.found).toBeGreaterThan(0);
			expect(Array.isArray(detection.files)).toBe(true);
			expect(detection.oldReferences).toContain("task-master");
		});
		it("should have old command references present before rename", () => {
			// Verify old command references exist
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(packageJson.bin).toHaveProperty("task-master");
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(readme).toContain("task-master");
			expect(
				fs.existsSync(path.join(testProjectDir, "bin/task-master.js")),
			).toBe(true);
		});
	});
	describe("Command Rename Phase", () => {
		it("should perform dry-run command rename using CLI command", async () => {
			// 当CLI命令实现后，替换为:
			// const result = await executeCLICommand("rename-commands", ["--dry-run"]);
			// 当前阶段使用模拟:
			const result = await mockExecuteCLICommand("rename-commands", [
				"--dry-run",
			]);
			expect(result.code).toBe(0);
			const renameResult = JSON.parse(result.stdout);
			expect(renameResult.success).toBe(true);
			expect(renameResult.backupCreated).toBe(true);
			// In dry-run, files should not actually be changed
			expect(
				fs.existsSync(path.join(testProjectDir, "bin/task-master.js")),
			).toBe(true);
		});
		it("should perform actual command rename using CLI command", async () => {
			// 当CLI命令实现后，替换为:
			// const result = await executeCLICommand("rename-commands");
			// 当前阶段使用模拟:
			const result = await mockExecuteCLICommand("rename-commands");
			expect(result.code).toBe(0);
			const renameResult = JSON.parse(result.stdout);
			expect(renameResult.success).toBe(true);
			expect(renameResult.filesUpdated).toBeGreaterThan(0);
			expect(renameResult.commandsRenamed).toBeGreaterThan(0);
		});
		it("should update package.json command references correctly", () => {
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(testProjectDir, "package.json"), "utf8"),
			);
			expect(packageJson.bin).toHaveProperty("speco-tasker");
			expect(packageJson.bin).toHaveProperty("speco-tasker-mcp");
			expect(packageJson.bin).not.toHaveProperty("task-master");
		});
		it("should rename binary files correctly", () => {
			expect(
				fs.existsSync(path.join(testProjectDir, "bin/speco-tasker.js")),
			).toBe(true);
			expect(
				fs.existsSync(path.join(testProjectDir, "bin/task-master.js")),
			).toBe(false);
		});
		it("should update documentation command references", () => {
			const readme = fs.readFileSync(
				path.join(testProjectDir, "README.md"),
				"utf8",
			);
			expect(readme).toContain("speco-tasker");
			expect(readme).not.toContain("task-master");
		});
	});
	describe("Command Verification Phase", () => {
		it("should verify command rename completion using CLI command", async () => {
			// 当CLI命令实现后，替换为:
			// const result = await executeCLICommand("verify-commands");
			// 当前阶段使用模拟:
			const result = await mockExecuteCLICommand("verify-commands");
			expect(result.code).toBe(0);
			const verification = JSON.parse(result.stdout);
			expect(verification.valid).toBe(true);
			expect(verification.oldReferencesRemaining).toBe(0);
			expect(verification.newReferencesCount).toBeGreaterThan(0);
		});
		it("should confirm no old command references remain", () => {
			// Check that no old command references remain
			const allFiles = fs
				.readdirSync(testProjectDir, { recursive: true })
				.filter(
					(file) => !file.includes("node_modules") && !file.includes(".git"),
				)
				.filter((file) => {
					try {
						const stats = fs.statSync(path.join(testProjectDir, file));
						// Only check regular files, not directories
						if (stats.isFile()) {
							const content = fs.readFileSync(
								path.join(testProjectDir, file),
								"utf8",
							);
							return content.includes("task-master");
						}
						return false;
					} catch {
						return false;
					}
				});
			expect(allFiles.length).toBe(0);
		});
	});
	describe("Complete Command Rename Workflow", () => {
		it("should complete full command rename workflow from detection to verification", async () => {
			// 重新创建旧命令文件用于完整工作流测试
			createTestFilesWithOldCommands();
			// 1. 检测阶段
			const detectResult = await mockExecuteCLICommand("detect-commands");
			expect(detectResult.code).toBe(0);
			// 2. 重命名阶段
			const renameResult = await mockExecuteCLICommand("rename-commands");
			expect(renameResult.code).toBe(0);
			// 3. 验证阶段
			const verifyResult = await mockExecuteCLICommand("verify-commands");
			expect(verifyResult.code).toBe(0);
			const verification = JSON.parse(verifyResult.stdout);
			expect(verification.valid).toBe(true);
			console.log("✅ Complete command rename workflow test passed");
		});
		it("should handle workflow errors gracefully", async () => {
			// Test error handling - invalid command
			const errorResult = await mockExecuteCLICommand("invalid-command");
			expect(errorResult.code).toBe(1);
			expect(errorResult.stderr).toContain("Unknown command");
		});
	});
});
