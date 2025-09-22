/**
 * Speco Tasker
 * Copyright (c) 2025 Speco Team
 *
 * This software is licensed under the MIT License with Commons Clause.
 * You may use this software for any purpose, including commercial applications,
 * and modify and redistribute it freely, subject to the following restrictions:
 *
 * 1. You may not sell this software or offer it as a service.
 * 2. The origin of this software must not be misrepresented.
 * 3. Altered source versions must be plainly marked as such.
 *
 * For the full license text, see the LICENSE file in the root directory.
 */

import fs from "node:fs";
import path from "node:path";
import { dirname } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import boxen from "boxen";
import chalk from "chalk";
import figlet from "figlet";
import gradient from "gradient-string";
import { detectMCPMode, isSilentMode } from "./modules/utils.js";
import { insideGitWorkTree } from "./modules/utils/git-utils.js";

// 导入核心服务
import { PathService } from "../src/services/PathService.js";

import { execSync } from "node:child_process";
import {
	ENV_EXAMPLE_FILE,
	EXAMPLE_PRD_FILE,
	TASKMASTER_CONFIG_FILE,
	TASKMASTER_DIR,
	TASKMASTER_DOCS_DIR,
	TASKMASTER_REPORTS_DIR,
	TASKMASTER_STATE_FILE,
	TASKMASTER_TASKS_DIR,
	TASKMASTER_TASKS_FILE,
	TASKMASTER_TEMPLATES_DIR,
} from "../src/constants/paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Transactional initialization system for error recovery
class InitializationTransaction {
	constructor() {
		this.steps = [];
		this.rollbackSteps = [];
		this.completedSteps = [];
		this.backupPaths = new Map();
	}

	/**
	 * Add a step to the initialization transaction
	 * @param {string} name - Step name for logging
	 * @param {Function} stepFn - Function to execute the step
	 * @param {Function} rollbackFn - Function to rollback the step
	 */
	addStep(name, stepFn, rollbackFn = null) {
		this.steps.push({
			name,
			execute: stepFn,
			rollback: rollbackFn,
		});
	}

	/**
	 * Execute all steps with rollback capability
	 */
	async execute() {
		let stepIndex = 0;

		try {
			for (const step of this.steps) {
				log("info", `Executing step: ${step.name}`);

				await step.execute();

				this.completedSteps.push(step);
				stepIndex++;
			}

			log("success", "All initialization steps completed successfully");
			return { success: true };
		} catch (error) {
			log(
				"error",
				`Initialization failed at step "${this.steps[stepIndex]?.name}": ${error.message}`,
			);

			// Attempt rollback
			await this.rollback(stepIndex);

			return {
				success: false,
				error: error.message,
				failedStep: this.steps[stepIndex]?.name,
				rolledBack: true,
			};
		}
	}

	/**
	 * Rollback completed steps in reverse order
	 * @param {number} failedStepIndex - Index of the step that failed
	 */
	async rollback(failedStepIndex) {
		log("warn", "Initiating rollback of completed steps...");

		let rolledBackCount = 0;

		// Rollback in reverse order, but only steps that were completed
		for (let i = this.completedSteps.length - 1; i >= 0; i--) {
			const step = this.completedSteps[i];

			try {
				if (step.rollback) {
					log("info", `Rolling back step: ${step.name}`);
					await step.rollback();
					rolledBackCount++;
				} else {
					log("warn", `No rollback function for step: ${step.name}`);
				}
			} catch (rollbackError) {
				log(
					"error",
					`Failed to rollback step "${step.name}": ${rollbackError.message}`,
				);
				// Continue with other rollbacks even if one fails
			}
		}

		log("info", `Rollback completed. ${rolledBackCount} steps rolled back.`);

		// Clean up any backup files created during the process
		this.cleanupBackups();
	}

	/**
	 * Create a backup of a file or directory before modification
	 * @param {string} originalPath - Original file/directory path
	 * @param {string} backupPath - Backup location
	 */
	async createBackup(originalPath, backupPath) {
		try {
			if (fs.existsSync(originalPath)) {
				if (fs.statSync(originalPath).isDirectory()) {
					await copyDirectoryRecursive(originalPath, backupPath);
				} else {
					await fs.promises.copyFile(originalPath, backupPath);
				}
				this.backupPaths.set(originalPath, backupPath);
				log("debug", `Created backup: ${originalPath} -> ${backupPath}`);
			}
		} catch (error) {
			log(
				"warn",
				`Failed to create backup for ${originalPath}: ${error.message}`,
			);
		}
	}

	/**
	 * Restore from backup
	 * @param {string} originalPath - Original file/directory path
	 */
	async restoreFromBackup(originalPath) {
		const backupPath = this.backupPaths.get(originalPath);
		if (!backupPath || !fs.existsSync(backupPath)) {
			return false;
		}

		try {
			if (fs.statSync(backupPath).isDirectory()) {
				await copyDirectoryRecursive(backupPath, originalPath);
			} else {
				await fs.promises.copyFile(backupPath, originalPath);
			}
			log("debug", `Restored from backup: ${backupPath} -> ${originalPath}`);
			return true;
		} catch (error) {
			log(
				"error",
				`Failed to restore backup for ${originalPath}: ${error.message}`,
			);
			return false;
		}
	}

	/**
	 * Clean up backup files
	 */
	cleanupBackups() {
		for (const [originalPath, backupPath] of this.backupPaths) {
			try {
				if (fs.existsSync(backupPath)) {
					if (fs.statSync(backupPath).isDirectory()) {
						fs.rmSync(backupPath, { recursive: true, force: true });
					} else {
						fs.unlinkSync(backupPath);
					}
					log("debug", `Cleaned up backup: ${backupPath}`);
				}
			} catch (error) {
				log("warn", `Failed to cleanup backup ${backupPath}: ${error.message}`);
			}
		}
		this.backupPaths.clear();
	}
}

// Utility function to copy directory recursively
async function copyDirectoryRecursive(src, dest) {
	const entries = await fs.promises.readdir(src, { withFileTypes: true });

	await fs.promises.mkdir(dest, { recursive: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			await copyDirectoryRecursive(srcPath, destPath);
		} else {
			await fs.promises.copyFile(srcPath, destPath);
		}
	}
}

// Define log levels
const LOG_LEVELS = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	success: 4,
};

// Determine log level from environment variable or default to 'info'
const LOG_LEVEL = process.env.TASKMASTER_LOG_LEVEL
	? LOG_LEVELS[process.env.TASKMASTER_LOG_LEVEL.toLowerCase()]
	: LOG_LEVELS.info; // Default to info

// Create a color gradient for the banner
const coolGradient = gradient(["#00b4d8", "#0077b6", "#03045e"]);
const warmGradient = gradient(["#fb8b24", "#e36414", "#9a031e"]);

// Display a fancy banner
function displayBanner() {
	if (isSilentMode() || detectMCPMode()) return;

	console.clear();
	const bannerText = figlet.textSync("Speco Tasker", {
		font: "Standard",
		horizontalLayout: "default",
		verticalLayout: "default",
	});

	console.log(coolGradient(bannerText));

	// Add creator credit line below the banner
	console.log(
		chalk.dim("by ") +
			chalk.cyan.underline("https://github.com/mcontheway/speco-tasker"),
	);

	console.log(
		boxen(chalk.white(`${chalk.bold("Initializing")} your new project`), {
			padding: 1,
			margin: { top: 0, bottom: 1 },
			borderStyle: "round",
			borderColor: "cyan",
		}),
	);
}

// Logging function with icons and colors
function log(level, ...args) {
	const icons = {
		debug: chalk.gray("🔍"),
		info: chalk.blue("ℹ️"),
		warn: chalk.yellow("⚠️"),
		error: chalk.red("❌"),
		success: chalk.green("✅"),
	};

	if (LOG_LEVELS[level] >= LOG_LEVEL) {
		const icon = icons[level] || "";

		// Only output to console if not in silent mode and not in MCP mode
		if (!isSilentMode() && !detectMCPMode()) {
			if (level === "error") {
				console.error(icon, chalk.red(...args));
			} else if (level === "warn") {
				console.warn(icon, chalk.yellow(...args));
			} else if (level === "success") {
				console.log(icon, chalk.green(...args));
			} else if (level === "info") {
				console.log(icon, chalk.blue(...args));
			} else {
				console.log(icon, ...args);
			}
		}
	}

	// Write to debug log if DEBUG=true
	if (process.env.DEBUG === "true") {
		const logMessage = `[${level.toUpperCase()}] ${args.join(" ")}\n`;
		fs.appendFileSync("init-debug.log", logMessage);
	}
}

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		log("info", `Created directory: ${dirPath}`);
	}
}

// Function to add shell aliases to the user's shell configuration
function addShellAliases(shellType = null) {
	const homeDir = process.env.HOME || process.env.USERPROFILE;
	let shellConfigFile;

	// Determine which shell config file to use
	if (
		shellType === "zsh" ||
		(!shellType && process.env.SHELL?.includes("zsh"))
	) {
		shellConfigFile = path.join(homeDir, ".zshrc");
	} else if (
		shellType === "bash" ||
		(!shellType && process.env.SHELL?.includes("bash"))
	) {
		shellConfigFile = path.join(homeDir, ".bashrc");
	} else {
		log("warn", "Could not determine shell type. Aliases not added.");
		return false;
	}

	try {
		// Check if file exists
		if (!fs.existsSync(shellConfigFile)) {
			log(
				"warn",
				`Shell config file ${shellConfigFile} not found. Aliases not added.`,
			);
			return false;
		}

		// Check if aliases already exist
		const configContent = fs.readFileSync(shellConfigFile, "utf8");
		if (configContent.includes("alias st='speco-tasker'")) {
			log("info", "Speco Tasker aliases already exist in shell config.");
			return true;
		}

		// Add aliases to the shell config file
		const aliasBlock = `
# Speco Tasker aliases added on ${new Date().toLocaleDateString()}
alias st='speco-tasker'
alias taskmaster='speco-tasker'
`;

		fs.appendFileSync(shellConfigFile, aliasBlock);
		log("success", `Added Speco Tasker aliases to ${shellConfigFile}`);
		log(
			"info",
			`To use the aliases in your current terminal, run: source ${shellConfigFile}`,
		);

		return true;
	} catch (error) {
		log("error", `Failed to add aliases: ${error.message}`);
		return false;
	}
}

// Function to create initial state.json file for tag management
function createInitialStateFile(targetDir) {
	const stateFilePath = path.join(targetDir, TASKMASTER_STATE_FILE);

	// Check if state.json already exists
	if (fs.existsSync(stateFilePath)) {
		log("info", "State file already exists, preserving current configuration");
		return;
	}

	// Create initial state configuration
	const initialState = {
		currentTag: "main",
		lastSwitched: new Date().toISOString(),
		branchTagMapping: {},
		migrationNoticeShown: false,
	};

	try {
		fs.writeFileSync(stateFilePath, JSON.stringify(initialState, null, 2));
		log("success", `Created initial state file: ${stateFilePath}`);
		log("info", 'Default tag set to "main" for task organization');
	} catch (error) {
		log("error", `Failed to create state file: ${error.message}`);
	}
}

function createInitialTasksFile(targetDir) {
	const tasksFilePath = path.join(targetDir, TASKMASTER_TASKS_FILE);

	// Check if tasks.json already exists
	if (fs.existsSync(tasksFilePath)) {
		log("info", "Tasks file already exists, preserving current tasks");
		return;
	}

	// Create initial tasks structure
	const initialTasks = {
		main: {
			tasks: [],
		},
	};

	try {
		fs.writeFileSync(tasksFilePath, JSON.stringify(initialTasks, null, 2));
		log("success", `Created initial tasks file: ${tasksFilePath}`);
		log("info", 'Initialized with empty tasks list in "main" tag');
	} catch (error) {
		log("error", `Failed to create tasks file: ${error.message}`);
	}
}

// Function to create Speco configuration files
async function createSpecoConfig(targetDir, options) {
	try {
		log("info", "正在初始化 Speco 配置系统...");

		// 创建 .speco 目录结构
		const specoDir = path.join(targetDir, ".speco");
		const specoConfigDir = path.join(specoDir, "config");
		const specoTasksDir = path.join(specoDir, "tasks");
		const specoDocsDir = path.join(specoDir, "docs");
		const specoReportsDir = path.join(specoDir, "reports");
		const specoTemplatesDir = path.join(specoDir, "templates");
		const specoBackupsDir = path.join(specoDir, "backups");
		const specoLogsDir = path.join(specoDir, "logs");

		ensureDirectoryExists(specoDir);
		ensureDirectoryExists(specoConfigDir);
		ensureDirectoryExists(specoTasksDir);
		ensureDirectoryExists(specoDocsDir);
		ensureDirectoryExists(specoReportsDir);
		ensureDirectoryExists(specoTemplatesDir);
		ensureDirectoryExists(specoBackupsDir);
		ensureDirectoryExists(specoLogsDir);

		// 创建主配置文件
		const mainConfig = {
			project: {
				name: options.name || "MyProject",
				version: options.version || "1.2.0",
				description: options.description || "使用 Speco Tasker 管理项目任务",
				author: options.author || "Speco Team",
				license: "MIT WITH Commons-Clause",
				root: targetDir, // 持久化绝对根目录路径
			},
			paths: {
				root: ".",
				src: "src",
				scripts: "scripts/modules",
				bin: "bin",
				tests: "tests",
				config: ".speco",
				docs: "docs",
				specs: "specs",
			},
			logging: {
				level: "info",
				file: ".speco/logs/speco-tasker.log",
			},
		};

		// 创建路径配置文件
		const pathsConfig = {
			root: {
				speco: ".speco",
				legacy: ".taskmaster",
			},
			dirs: {
				tasks: "tasks",
				docs: "docs",
				reports: "reports",
				templates: "templates",
				backups: "backups",
				logs: "logs",
				config: "config",
			},
			files: {
				tasks: "tasks.json",
				config: "config.json",
				state: "state.json",
				changelog: "changelog.md",
				brand: "brand.json",
				paths: "paths.json",
				cleanup: "cleanup-rules.json",
			},
			tags: {},
			metadata: {
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				version: "1.0.0",
			},
		};

		// 写入配置文件
		const configPath = path.join(specoDir, "config.json");

		fs.writeFileSync(configPath, JSON.stringify(mainConfig, null, 2));

		log("success", "✓ Speco 配置创建完成");

		// 验证配置
		try {
			const pathService = new PathService();
			await pathService.initialize({ projectRoot: targetDir });
			log("success", "✓ 路径配置验证通过");
		} catch (error) {
			log("warn", `路径配置验证失败: ${error.message}`);
		}
	} catch (error) {
		log("error", `Speco 配置初始化失败: ${error.message}`);
	}
}

// Helper function to get project name dynamically
async function getDynamicProjectName(projectRoot) {
	try {
		// Try to get from Git remote URL
		const gitUrl = execSync("git config --get remote.origin.url", {
			cwd: projectRoot,
			stdio: "pipe",
		})
			.toString()
			.trim();
		if (gitUrl) {
			const parts = gitUrl.split("/");
			let repoName = parts[parts.length - 1];
			if (repoName.endsWith(".git")) {
				repoName = repoName.slice(0, -4);
			}
			log("debug", `从 Git 获取项目名称: ${repoName}`);
			return repoName;
		}
	} catch (error) {
		log("debug", `无法从 Git 获取项目名称: ${error.message}`);
	}

	// Fallback to directory name
	const fsName = path.basename(projectRoot);
	if (fsName && fsName !== ".") {
		log("debug", `从文件系统获取项目名称: ${fsName}`);
		return fsName;
	}

	log("debug", "使用兜底项目名称: MyProject");
	return "MyProject"; // Default fallback
}

// Function to copy a file from the package to the target directory
function copyTemplateFile(templateName, targetPath, replacements = {}) {
	let content;

	// Handle different template types
	if (templateName === "config.json") {
		// Create default config.json content inline
		content = JSON.stringify(
			{
				global: {
					logLevel: "info",
					debug: false,
					defaultNumTasks: 10,
					defaultSubtasks: 5,
					defaultPriority: "medium",
					projectName: "{{projectName}}",
					userId: "{{userId}}",
					defaultTag: "main",
					projectRoot: "{{projectRoot}}",
				},
			},
			null,
			"\t",
		);
	} else {
		log("error", `Unknown template: ${templateName}`);
		return;
	}

	// Replace placeholders with actual values
	for (const [key, value] of Object.entries(replacements)) {
		const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
		content = content.replace(regex, value);
	}

	// Handle special files that should be merged instead of overwritten
	if (fs.existsSync(targetPath)) {
		const filename = path.basename(targetPath);

		// Handle README.md - offer to preserve or create a different file
		if (filename === "README-task-master.md") {
			log("info", `${targetPath} already exists`);
			// Create a separate README file specifically for this project
			const taskMasterReadmePath = path.join(
				path.dirname(targetPath),
				"README-task-master.md",
			);
			fs.writeFileSync(taskMasterReadmePath, content);
			log(
				"success",
				`Created ${taskMasterReadmePath} (preserved original README-task-master.md)`,
			);
			return;
		}

		// For other files, warn and prompt before overwriting
		log("warn", `${targetPath} already exists, skipping.`);
		return;
	}

	// If the file doesn't exist, create it normally
	fs.writeFileSync(targetPath, content);
	log("info", `Created file: ${targetPath}`);
}

// Main function to initialize a new project
async function initializeProject(options = {}) {
	// Only display banner if not in silent mode
	if (!isSilentMode()) {
		displayBanner();
	}

	// Determine project root - use provided root or current directory
	const projectRoot = options.root || process.cwd();

	// Get dynamic project name for default
	const dynamicName = await getDynamicProjectName(projectRoot);

	// Build final options with defaults and user overrides
	const finalOptions = {
		name: options.name || dynamicName, // Use provided name or auto-detect
		description: options.description || "A project managed with Speco Tasker",
		version: options.version || "0.1.0",
		author: options.author || "Vibe coder",
		addAliases: !!options.shell, // Add aliases if shell is specified
		shell: options.shell, // Store shell type for later use
		initGit: !insideGitWorkTree(), // Only init Git if not already a Git repo
		storeTasksInGit: insideGitWorkTree(), // Store in Git if it's already a Git repo
		root: projectRoot, // Use the determined root
		rules: ["cursor"], // Default to cursor rules
		rulesExplicitlyProvided: true,
	};

	// Log what we're doing
	if (!isSilentMode() && !detectMCPMode()) {
		console.log(
			chalk.blue("🚀 Initializing Speco Tasker with intelligent defaults..."),
		);
		console.log(chalk.gray(`📁 Project root: ${projectRoot}`));
		console.log(chalk.gray(`📦 Project name: ${finalOptions.name}`));
		console.log(
			chalk.gray(
				`🔧 Git repository: ${finalOptions.initGit ? "Will initialize" : "Already exists"}`,
			),
		);
		console.log(
			chalk.gray(
				`🔗 Shell aliases: ${finalOptions.addAliases ? "Will add" : "Skipping"}`,
			),
		);
		console.log();
	}

	// Use enhanced initialization with validation and backup
	const result = await initializeProjectWithValidation(finalOptions);

	if (!result.success) {
		// Enhanced initialization failed, fall back to legacy method
		log("warn", "增强初始化失败，使用传统方法...");

		// Create project structure with smart defaults (legacy fallback)
		createProjectStructure(
			finalOptions.addAliases,
			finalOptions.initGit,
			finalOptions.storeTasksInGit,
			false, // dryRun
			finalOptions,
			finalOptions.shell,
		);
	} else {
		// Enhanced initialization succeeded, continue with additional setup
		// Run npm install automatically
		const npmInstallOptions = {
			cwd: projectRoot,
			// Default to inherit for interactive CLI, change if silent
			stdio: "inherit",
		};

		if (isSilentMode() || detectMCPMode()) {
			// If silent or MCP mode, suppress npm install output
			npmInstallOptions.stdio = "ignore";
			log("info", "Running npm install silently..."); // Log our own message
		} else {
			// Interactive mode, show the boxen message
			console.log(
				boxen(chalk.cyan("Installing dependencies..."), {
					padding: 0.5,
					margin: 0.5,
					borderStyle: "round",
					borderColor: "blue",
				}),
			);
		}

		// Add shell aliases if requested
		if (finalOptions.addAliases) {
			log("info", "Adding shell aliases...");
			const aliasResult = addShellAliases(finalOptions.shell);
			if (aliasResult) {
				log("success", "Shell aliases added successfully");
			}
		}

		// Display success message
		if (!isSilentMode() && !detectMCPMode()) {
			console.log(
				boxen(
					`${warmGradient.multiline(
						figlet.textSync("Success!", { font: "Standard" }),
					)}\n${chalk.green("Project initialized successfully!")}`,
					{
						padding: 1,
						margin: 1,
						borderStyle: "double",
						borderColor: "green",
					},
				),
			);
		}

		// Display next steps in a nice box
		if (!isSilentMode() && !detectMCPMode()) {
			console.log(
				boxen(
					`${chalk.cyan.bold("接下来您可以做的事情:")}\n\n${chalk.white("1. ")}${chalk.yellow(
						"创建您的第一个任务",
					)}\n${chalk.white("   └─ ")}${chalk.dim('使用: speco-tasker add-task --title="任务标题" --description="任务描述"')}\n${chalk.white("2. ")}${chalk.yellow(
						"查看所有任务列表",
					)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker list")}\n${chalk.white("3. ")}${chalk.yellow(
						"查看下一个要处理的任务",
					)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker next")}\n${chalk.white("4. ")}${chalk.yellow(
						"开始处理任务并更新状态",
					)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker set-status --id=<id> --status=in-progress")}\n${chalk.white("5. ")}${chalk.yellow(
						"为复杂任务添加子任务",
					)}\n${chalk.white("   └─ ")}${chalk.dim('使用: speco-tasker add-subtask --parent=<id> --title="子任务标题"')}\n${chalk.white("6. ")}${chalk.yellow(
						"管理任务依赖关系",
					)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker add-dependency --id=<id> --depends-on=<dependency-id>")}\n${chalk.white("7. ")}${chalk.yellow(
						"使用标签组织不同功能的任务",
					)}\n${chalk.white("   └─ ")}${chalk.dim('使用: speco-tasker add-tag <tag-name> --description="标签描述"')}\n${chalk.white("8. ")}${chalk.yellow(
						"生成任务文件以便查看和管理",
					)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker generate")}\n${chalk.white("9. ")}${chalk.yellow(
						"完成任务后标记为完成",
					)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker set-status --id=<id> --status=done")}\n${chalk.white("10. ")}${chalk.green.bold("开始您的开发工作流程!")}\n\n${chalk.dim(
						"💡 提示: 使用 speco-tasker --help 查看所有可用命令",
					)}\n${chalk.dim("📖 文档: 查看 docs/tutorial.md 了解完整的使用指南")}`,
					{
						padding: 1,
						margin: 1,
						borderStyle: "round",
						borderColor: "yellow",
						title: "开始使用 Speco Tasker",
						titleAlignment: "center",
					},
				),
			);
		}
	}
}

// Helper function to promisify readline question
function promptQuestion(rl, question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

// Function to create the project structure
function createProjectStructure(
	addAliases,
	initGit,
	storeTasksInGit,
	dryRun,
	options,
	shell = null,
) {
	const targetDir = options.root || process.cwd();
	log("info", `Initializing project in ${targetDir}`);

	// Create minimal .taskmaster directory structure (only what's needed)
	ensureDirectoryExists(path.join(targetDir, TASKMASTER_DIR));
	ensureDirectoryExists(path.join(targetDir, TASKMASTER_TASKS_DIR));

	// Create initial state.json file for tag management
	createInitialStateFile(targetDir);

	// Create initial tasks.json file
	createInitialTasksFile(targetDir);

	// 初始化新的路径配置系统
	if (!dryRun) {
		createSpecoConfig(targetDir, options);
	}

	// Note: Configuration files are now created by createSpecoConfig function above
	// No additional template copying needed for config.json

	// Skip example_prd.txt - not needed for minimal initialization

	// Initialize git repository if git is available
	try {
		if (initGit === false) {
			// 检查是否已经在Git仓库中，这是智能默认行为
			if (insideGitWorkTree()) {
				log("info", "已检测到现有Git仓库，跳过Git初始化。");
			} else {
				log("info", "Git初始化已禁用（--no-git标志）。");
			}
		} else if (initGit === true) {
			if (insideGitWorkTree()) {
				log("info", "已检测到现有Git仓库，跳过Git初始化。");
			} else {
				log("info", "正在初始化Git仓库...");
				execSync("git init", { cwd: targetDir, stdio: "ignore" });
				log("success", "Git仓库初始化完成");
			}
		} else {
			// Default behavior when no flag is provided (from interactive prompt)
			if (insideGitWorkTree()) {
				log("info", "已检测到现有Git仓库，跳过Git初始化。");
			} else {
				log("info", "未检测到Git仓库，正在项目根目录初始化...");
				execSync("git init", { cwd: targetDir, stdio: "ignore" });
				log("success", "Git仓库初始化完成");
			}
		}
	} catch (error) {
		log("warn", "Git不可用，跳过仓库初始化");
	}

	// Add shell aliases if requested (handled later in the flow)

	// Run npm install automatically
	const npmInstallOptions = {
		cwd: targetDir,
		// Default to inherit for interactive CLI, change if silent
		stdio: "inherit",
	};

	if (isSilentMode() || detectMCPMode()) {
		// If silent or MCP mode, suppress npm install output
		npmInstallOptions.stdio = "ignore";
		log("info", "Running npm install silently..."); // Log our own message
	} else {
		// Interactive mode, show the boxen message
		console.log(
			boxen(chalk.cyan("Installing dependencies..."), {
				padding: 0.5,
				margin: 0.5,
				borderStyle: "round",
				borderColor: "blue",
			}),
		);
	}

	// Add shell aliases if requested
	if (addAliases && !dryRun) {
		log("info", "Adding shell aliases...");
		const aliasResult = addShellAliases(shell);
		if (aliasResult) {
			log("success", "Shell aliases added successfully");
		}
	} else if (addAliases && dryRun) {
		log("info", "DRY RUN: Would add shell aliases (tm, taskmaster)");
	}

	// Display success message
	if (!isSilentMode() && !detectMCPMode()) {
		console.log(
			boxen(
				`${warmGradient.multiline(
					figlet.textSync("Success!", { font: "Standard" }),
				)}\n${chalk.green("Project initialized successfully!")}`,
				{
					padding: 1,
					margin: 1,
					borderStyle: "double",
					borderColor: "green",
				},
			),
		);
	}

	// Display next steps in a nice box
	if (!isSilentMode() && !detectMCPMode()) {
		console.log(
			boxen(
				`${chalk.cyan.bold("接下来您可以做的事情:")}\n\n${chalk.white("1. ")}${chalk.yellow(
					"创建您的第一个任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim('使用: speco-tasker add-task --title="任务标题" --description="任务描述"')}\n${chalk.white("2. ")}${chalk.yellow(
					"查看所有任务列表",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker list")}\n${chalk.white("3. ")}${chalk.yellow(
					"查看下一个要处理的任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker next")}\n${chalk.white("4. ")}${chalk.yellow(
					"开始处理任务并更新状态",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker set-status --id=<id> --status=in-progress")}\n${chalk.white("5. ")}${chalk.yellow(
					"为复杂任务添加子任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim('使用: speco-tasker add-subtask --parent=<id> --title="子任务标题"')}\n${chalk.white("6. ")}${chalk.yellow(
					"管理任务依赖关系",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker add-dependency --id=<id> --depends-on=<dependency-id>")}\n${chalk.white("7. ")}${chalk.yellow(
					"使用标签组织不同功能的任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim('使用: speco-tasker add-tag <tag-name> --description="标签描述"')}\n${chalk.white("8. ")}${chalk.yellow(
					"生成任务文件以便查看和管理",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker generate")}\n${chalk.white("9. ")}${chalk.yellow(
					"完成任务后标记为完成",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: speco-tasker set-status --id=<id> --status=done")}\n${chalk.white("10. ")}${chalk.green.bold("开始您的开发工作流程!")}\n\n${chalk.dim(
					"💡 提示: 使用 speco-tasker --help 查看所有可用命令",
				)}\n${chalk.dim("📖 文档: 查看 docs/tutorial.md 了解完整的使用指南")}`,
				{
					padding: 1,
					margin: 1,
					borderStyle: "round",
					borderColor: "yellow",
					title: "开始使用 Speco Tasker",
					titleAlignment: "center",
				},
			),
		);
	}
}

// Environment detection and compatibility checking
class EnvironmentValidator {
	constructor() {
		this.issues = [];
		this.warnings = [];
	}

	/**
	 * Validate the current environment for Speco Tasker initialization
	 * @returns {Promise<{valid: boolean, issues: string[], warnings: string[]}>}
	 */
	async validate() {
		this.issues = [];
		this.warnings = [];

		await this.checkNodeVersion();
		await this.checkNpmAvailability();
		await this.checkDiskSpace();
		await this.checkGitAvailability();
		await this.checkWritePermissions();
		await this.checkExistingInstallation();

		return {
			valid: this.issues.length === 0,
			issues: this.issues,
			warnings: this.warnings,
		};
	}

	/**
	 * Check Node.js version compatibility
	 */
	async checkNodeVersion() {
		try {
			const nodeVersion = process.version;
			const majorVersion = Number.parseInt(
				nodeVersion.replace(/^v/, "").split(".")[0],
			);

			if (majorVersion < 18) {
				this.issues.push(
					`Node.js版本 ${nodeVersion} 太低。需要 Node.js 18 或更高版本。`,
				);
			} else if (majorVersion < 20) {
				this.warnings.push(
					`Node.js版本 ${nodeVersion} 已支持，但推荐使用 Node.js 20+ 以获得最佳体验。`,
				);
			}
		} catch (error) {
			this.issues.push("无法检测 Node.js 版本。");
		}
	}

	/**
	 * Check npm availability
	 */
	async checkNpmAvailability() {
		try {
			const { execSync } = await import("node:child_process");
			execSync("npm --version", { stdio: "pipe" });
		} catch (error) {
			this.warnings.push(
				"npm 未找到。这可能影响依赖安装，但不会阻止 Speco Tasker 的基本功能。",
			);
		}
	}

	/**
	 * Check available disk space
	 */
	async checkDiskSpace() {
		try {
			const { execSync } = await import("node:child_process");
			const output = execSync("df -k . | tail -1 | awk '{print $4}'", {
				encoding: "utf8",
			});
			const availableKB = Number.parseInt(output.trim());

			if (availableKB < 100 * 1024) {
				// Less than 100MB
				this.issues.push(
					`磁盘空间不足。可用空间: ${Math.round(availableKB / 1024)}MB。需要至少 100MB 可用空间。`,
				);
			} else if (availableKB < 500 * 1024) {
				// Less than 500MB
				this.warnings.push(
					`磁盘空间有限。可用空间: ${Math.round(availableKB / 1024)}MB。推荐至少 500MB 可用空间。`,
				);
			}
		} catch (error) {
			// Disk space check failed, but don't treat as critical issue
			log("debug", "无法检查磁盘空间，但这不会影响初始化。");
		}
	}

	/**
	 * Check Git availability
	 */
	async checkGitAvailability() {
		try {
			const { execSync } = await import("node:child_process");
			execSync("git --version", { stdio: "pipe" });
		} catch (error) {
			this.warnings.push(
				"Git 未找到。无法自动初始化 Git 仓库，但不会影响 Speco Tasker 的核心功能。",
			);
		}
	}

	/**
	 * Check write permissions in current directory
	 */
	async checkWritePermissions() {
		try {
			const testFile = path.join(process.cwd(), ".speco-test-write");
			await fs.promises.writeFile(testFile, "test");
			await fs.promises.unlink(testFile);
		} catch (error) {
			this.issues.push(`当前目录没有写权限: ${error.message}`);
		}
	}

	/**
	 * Check for existing Speco Tasker installation
	 */
	async checkExistingInstallation() {
		const specoDir = path.join(process.cwd(), ".speco");

		if (fs.existsSync(specoDir)) {
			this.warnings.push(
				"检测到现有的 Speco Tasker 配置。初始化将继续，但可能会覆盖现有配置。",
			);

			// Check for existing tasks
			const tasksFile = path.join(specoDir, "tasks", "tasks.json");
			if (fs.existsSync(tasksFile)) {
				try {
					const tasks = JSON.parse(
						await fs.promises.readFile(tasksFile, "utf8"),
					);
					const taskCount = Object.keys(tasks).length;
					if (taskCount > 0) {
						this.warnings.push(
							`现有配置包含 ${taskCount} 个任务。建议先备份重要任务。`,
						);
					}
				} catch (error) {
					// Ignore parse errors
				}
			}
		}
	}

	/**
	 * Get environment information for debugging
	 */
	getEnvironmentInfo() {
		return {
			nodeVersion: process.version,
			platform: process.platform,
			architecture: process.arch,
			cwd: process.cwd(),
			uid: process.getuid ? process.getuid() : "N/A",
			gid: process.getgid ? process.getgid() : "N/A",
		};
	}
}

// Configuration backup and recovery
class ConfigBackupManager {
	constructor() {
		this.backups = new Map();
		this.backupDir = path.join(process.cwd(), ".speco-backups");
	}

	/**
	 * Create backup of existing configuration
	 * @param {string} backupName - Name for the backup
	 */
	async createBackup(backupName = "pre-init") {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const backupPath = path.join(this.backupDir, `${backupName}-${timestamp}`);

		try {
			// Create backup directory
			await fs.promises.mkdir(backupPath, { recursive: true });

			// Backup existing .speco directory if it exists
			const specoDir = path.join(process.cwd(), ".speco");
			if (fs.existsSync(specoDir)) {
				await copyDirectoryRecursive(specoDir, path.join(backupPath, ".speco"));
			}

			// Backup package.json if it exists
			const packageJson = path.join(process.cwd(), "package.json");
			if (fs.existsSync(packageJson)) {
				await fs.promises.copyFile(
					packageJson,
					path.join(backupPath, "package.json"),
				);
			}

			this.backups.set(backupName, backupPath);
			log("info", `配置备份已创建: ${backupPath}`);

			return backupPath;
		} catch (error) {
			log("warn", `创建配置备份失败: ${error.message}`);
			return null;
		}
	}

	/**
	 * Restore configuration from backup
	 * @param {string} backupName - Name of the backup to restore
	 */
	async restoreBackup(backupName) {
		const backupPath = this.backups.get(backupName);
		if (!backupPath || !fs.existsSync(backupPath)) {
			throw new Error(`备份不存在: ${backupName}`);
		}

		try {
			// Restore .speco directory
			const specoBackup = path.join(backupPath, ".speco");
			if (fs.existsSync(specoBackup)) {
				const specoDir = path.join(process.cwd(), ".speco");
				if (fs.existsSync(specoDir)) {
					fs.rmSync(specoDir, { recursive: true, force: true });
				}
				await copyDirectoryRecursive(specoBackup, specoDir);
			}

			// Restore package.json
			const packageJsonBackup = path.join(backupPath, "package.json");
			if (fs.existsSync(packageJsonBackup)) {
				await fs.promises.copyFile(
					packageJsonBackup,
					path.join(process.cwd(), "package.json"),
				);
			}

			log("info", `配置已从备份恢复: ${backupPath}`);
			return true;
		} catch (error) {
			log("error", `恢复配置备份失败: ${error.message}`);
			return false;
		}
	}

	/**
	 * List available backups
	 */
	async listBackups() {
		try {
			if (!fs.existsSync(this.backupDir)) {
				return [];
			}

			const entries = await fs.promises.readdir(this.backupDir);
			return entries.map((entry) => ({
				name: entry,
				path: path.join(this.backupDir, entry),
				created: fs.statSync(path.join(this.backupDir, entry)).mtime,
			}));
		} catch (error) {
			log("warn", `列出备份失败: ${error.message}`);
			return [];
		}
	}

	/**
	 * Clean up old backups (keep only recent ones)
	 * @param {number} keepCount - Number of recent backups to keep
	 */
	async cleanupOldBackups(keepCount = 5) {
		try {
			const backups = await this.listBackups();
			if (backups.length <= keepCount) {
				return;
			}

			// Sort by creation date, keep newest
			backups.sort((a, b) => b.created - a.created);

			// Remove old backups
			const toRemove = backups.slice(keepCount);
			for (const backup of toRemove) {
				fs.rmSync(backup.path, { recursive: true, force: true });
				log("debug", `清理旧备份: ${backup.name}`);
			}

			log("info", `清理了 ${toRemove.length} 个旧备份`);
		} catch (error) {
			log("warn", `清理旧备份失败: ${error.message}`);
		}
	}
}

// Enhanced initialization with validation and backup
async function initializeProjectWithValidation(options = {}) {
	const validator = new EnvironmentValidator();
	const backupManager = new ConfigBackupManager();

	log("info", "开始环境验证...");
	const validation = await validator.validate();

	if (!validation.valid) {
		log("error", "环境验证失败:");
		for (const issue of validation.issues) {
			log("error", `❌ ${issue}`);
		}
		return {
			success: false,
			error: "环境验证失败",
			issues: validation.issues,
		};
	}

	if (validation.warnings.length > 0) {
		log("warn", "环境警告:");
		for (const warning of validation.warnings) {
			log("warn", `⚠️  ${warning}`);
		}
	}

	// Create backup before initialization
	log("info", "创建配置备份...");
	const backupPath = await backupManager.createBackup("pre-init");

	try {
		// Use transactional initialization
		const transaction = new InitializationTransaction();

		// Add initialization steps with rollback functions
		transaction.addStep(
			"创建项目目录结构",
			async () => {
				const specoDir = path.join(process.cwd(), ".speco");
				const tasksDir = path.join(specoDir, "tasks");
				const logsDir = path.join(specoDir, "logs");

				await fs.promises.mkdir(specoDir, { recursive: true });
				await fs.promises.mkdir(tasksDir, { recursive: true });
				await fs.promises.mkdir(logsDir, { recursive: true });
			},
			async () => {
				// Rollback: remove created directories
				const specoDir = path.join(process.cwd(), ".speco");
				if (fs.existsSync(specoDir)) {
					fs.rmSync(specoDir, { recursive: true, force: true });
				}
			},
		);

		transaction.addStep(
			"创建配置文件",
			async () => {
				await createSpecoConfig(process.cwd(), options);
			},
			async () => {
				// Config rollback will be handled by backup restoration
			},
		);

		transaction.addStep(
			"创建初始状态文件",
			async () => {
				await createInitialStateFile(process.cwd());
			},
			null, // No specific rollback needed, will be handled by backup
		);

		transaction.addStep(
			"创建初始任务文件",
			async () => {
				await createInitialTasksFile(process.cwd());
			},
			null, // No specific rollback needed, will be handled by backup
		);

		// Execute transactional initialization
		const result = await transaction.execute();

		if (result.success) {
			// Cleanup old backups after successful initialization
			await backupManager.cleanupOldBackups();
			log("success", "Speco Tasker 初始化完成！");
			return { success: true, backupPath };
		}

		// Restore from backup on failure
		log("error", `初始化失败: ${result.error}`);
		if (backupPath) {
			log("info", "正在从备份恢复...");
			const restored = await backupManager.restoreBackup("pre-init");
			if (restored) {
				log("success", "配置已从备份恢复");
			}
		}
		return {
			success: false,
			error: result.error,
			failedStep: result.failedStep,
			backupRestored: !!backupPath,
		};
	} catch (error) {
		log("error", `初始化过程中发生意外错误: ${error.message}`);

		// Attempt backup restoration
		if (backupPath) {
			log("info", "正在从备份恢复...");
			try {
				await backupManager.restoreBackup("pre-init");
				log("success", "配置已从备份恢复");
			} catch (restoreError) {
				log("error", `备份恢复失败: ${restoreError.message}`);
			}
		}

		return {
			success: false,
			error: error.message,
			backupRestored: !!backupPath,
		};
	}
}

// Ensure necessary functions are exported
export {
	initializeProject,
	initializeProjectWithValidation,
	log,
	EnvironmentValidator,
	ConfigBackupManager,
};
