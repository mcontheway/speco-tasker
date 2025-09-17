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
import { isSilentMode } from "./modules/utils.js";
import { insideGitWorkTree } from "./modules/utils/git-utils.js";

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
	if (isSilentMode()) return;

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

		// Only output to console if not in silent mode
		if (!isSilentMode()) {
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
function addShellAliases() {
	const homeDir = process.env.HOME || process.env.USERPROFILE;
	let shellConfigFile;

	// Determine which shell config file to use
	if (process.env.SHELL?.includes("zsh")) {
		shellConfigFile = path.join(homeDir, ".zshrc");
	} else if (process.env.SHELL?.includes("bash")) {
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
		if (configContent.includes("alias tm='task-master'")) {
			log("info", "Speco Tasker aliases already exist in shell config.");
			return true;
		}

		// Add aliases to the shell config file
		const aliasBlock = `
# Speco Tasker aliases added on ${new Date().toLocaleDateString()}
alias tm='task-master'
alias taskmaster='task-master'
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
	Object.entries(replacements).forEach(([key, value]) => {
		const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
		content = content.replace(regex, value);
	});

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

	const projectRoot = process.cwd(); // Get current working directory as project root

	// Check if we should skip prompts (for MCP mode or CLI mode with yes=true, or CLI mode with yes=false but we want to skip for simplicity)
	const skipPrompts = options.yes === true || isSilentMode() || (options.yes === false && !process.env.FORCE_INTERACTIVE);

	if (skipPrompts) {
		// MCP mode or explicit yes - use intelligent defaults without prompts
		const smartDefaults = {
			name: await getDynamicProjectName(projectRoot), // Auto-detect from Git or directory
			description: "A project managed with Speco Tasker",
			version: "0.1.0",
			author: "Vibe coder",
			addAliases: false, // Don't modify user's shell config by default
			initGit: !insideGitWorkTree(), // Only init Git if not already a Git repo
			storeTasksInGit: insideGitWorkTree(), // Store in Git if it's already a Git repo
			rules: ["cursor"], // Default to cursor rules for MCP
			rulesExplicitlyProvided: true,
		};

		// Apply smart defaults to options
		const finalOptions = { ...smartDefaults, ...options };

		// Log what we're doing
		if (!isSilentMode()) {
			console.log(chalk.blue("🚀 Initializing Speco Tasker with intelligent defaults..."));
			console.log(chalk.gray(`📁 Project root: ${projectRoot}`));
			console.log(chalk.gray(`📦 Project name: ${finalOptions.name}`));
			console.log(chalk.gray(`🔧 Git repository: ${finalOptions.initGit ? "Will initialize" : "Already exists"}`));
			console.log(chalk.gray(`🔗 Shell aliases: ${finalOptions.addAliases ? "Will add" : "Skipping"}`));
			console.log();
		}

		// Create project structure with smart defaults
		createProjectStructure(
			finalOptions.addAliases,
			finalOptions.initGit,
			finalOptions.storeTasksInGit,
			false, // dryRun
			finalOptions,
		);
	} else {
		// CLI mode with interactive prompts (legacy behavior for backward compatibility)
		log("info", "Required options not provided, proceeding with prompts.");

		try {
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			// Get dynamic project name for default prompt
			const defaultProjectName = await getDynamicProjectName(projectRoot);
			const projectNameInput = await promptQuestion(
				rl,
				chalk.cyan(`Project name (${defaultProjectName}): `),
			);
			const projectName = projectNameInput.trim() || defaultProjectName;

			// Use smart defaults for other options
			const finalOptions = {
				name: projectName,
				description: "A project managed with Speco Tasker",
				version: "0.1.0",
				author: "Vibe coder",
				addAliases: false, // Default to not adding aliases
				initGit: !insideGitWorkTree(),
				storeTasksInGit: insideGitWorkTree(),
			};

			log("info", `Project name set to: ${projectName}`);

			// Show summary
			console.log("\nSpeco Tasker Project settings:");
			console.log(chalk.blue("Project Name:"), chalk.white(projectName));
			console.log(chalk.blue("Git repository:"), chalk.white(finalOptions.initGit ? "Will initialize" : "Already exists"));
			console.log(chalk.blue("Shell aliases:"), chalk.white(finalOptions.addAliases ? "Will add" : "Skipping"));

			const confirmInput = await promptQuestion(
				rl,
				chalk.yellow("\nDo you want to continue with these settings? (Y/n): "),
			);
			const shouldContinue = confirmInput.trim().toLowerCase() !== "n";

			if (!shouldContinue) {
				rl.close();
				log("info", "Project initialization cancelled by user");
				process.exit(0);
				return;
			}

			rl.close();

			// Create project structure
			createProjectStructure(
				finalOptions.addAliases,
				finalOptions.initGit,
				finalOptions.storeTasksInGit,
				false, // dryRun
				finalOptions,
			);
		} catch (error) {
			if (rl) {
				rl.close();
			}
			log("error", `Error during initialization process: ${error.message}`);
			process.exit(1);
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
) {
	const targetDir = process.cwd();
	log("info", `Initializing project in ${targetDir}`);

	// Create minimal .taskmaster directory structure (only what's needed)
	ensureDirectoryExists(path.join(targetDir, TASKMASTER_DIR));
	ensureDirectoryExists(path.join(targetDir, TASKMASTER_TASKS_DIR));

	// Create initial state.json file for tag management
	createInitialStateFile(targetDir);

	// Create initial tasks.json file
	createInitialTasksFile(targetDir);

	// Copy template files with replacements
	const replacements = {
		year: new Date().getFullYear(),
		projectName: options.name || "MyProject", // Use resolved name from options
	};

	// Helper function to create rule profiles

	// Skip .env.example - not needed for minimal initialization

	// Copy config.json with project name and root to NEW location
	copyTemplateFile(
		"config.json",
		path.join(targetDir, TASKMASTER_CONFIG_FILE),
		{
			...replacements,
			projectRoot: targetDir, // Save the actual project root directory
		},
	);

	// Note: maxTokens configuration update skipped (AI functionality removed)

	// Skip example_prd.txt - not needed for minimal initialization

	// Initialize git repository if git is available
	try {
		if (initGit === false) {
			log("info", "Git initialization skipped due to --no-git flag.");
		} else if (initGit === true) {
			if (insideGitWorkTree()) {
				log(
					"info",
					"Existing Git repository detected – skipping git init despite --git flag.",
				);
			} else {
				log("info", "Initializing Git repository due to --git flag...");
				execSync("git init", { cwd: targetDir, stdio: "ignore" });
				log("success", "Git repository initialized");
			}
		} else {
			// Default behavior when no flag is provided (from interactive prompt)
			if (insideGitWorkTree()) {
				log("info", "Existing Git repository detected – skipping git init.");
			} else {
				log(
					"info",
					"No Git repository detected. Initializing one in project root...",
				);
				execSync("git init", { cwd: targetDir, stdio: "ignore" });
				log("success", "Git repository initialized");
			}
		}
	} catch (error) {
		log("warn", "Git not available, skipping repository initialization");
	}

	// Add shell aliases if requested
	if (addAliases) {
		addShellAliases();
	}

	// Run npm install automatically
	const npmInstallOptions = {
		cwd: targetDir,
		// Default to inherit for interactive CLI, change if silent
		stdio: "inherit",
	};

	if (isSilentMode()) {
		// If silent (MCP mode), suppress npm install output
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

	// === Add Model Configuration Step ===
	if (!isSilentMode() && !dryRun && !options?.yes) {
		console.log(
			boxen(chalk.cyan("Configuring AI Models..."), {
				padding: 0.5,
				margin: { top: 1, bottom: 0.5 },
				borderStyle: "round",
				borderColor: "blue",
			}),
		);
		log(
			"info",
			"Running interactive model setup. Please select your preferred AI models.",
		);
		try {
			execSync("npx task-master models --setup", {
				stdio: "inherit",
				cwd: targetDir,
			});
			log("success", "AI Models configured.");
		} catch (error) {
			log("error", "Failed to configure AI models:", error.message);
			log("warn", 'You may need to run "task-master models --setup" manually.');
		}
	} else if (isSilentMode() && !dryRun) {
		log("info", "Skipping interactive model setup in silent (MCP) mode.");
		log(
			"warn",
			'Please configure AI models using "task-master models --set-..." or the "models" MCP tool.',
		);
	} else if (dryRun) {
		log("info", "DRY RUN: Skipping interactive model setup.");
	} else if (options?.yes) {
		log("info", "Skipping interactive model setup due to --yes flag.");
		log(
			"info",
			'Default AI models will be used. You can configure different models later using "task-master models --setup" or "task-master models --set-..." commands.',
		);
	}
	// ====================================

	// Add shell aliases if requested
	if (addAliases && !dryRun) {
		log("info", "Adding shell aliases...");
		const aliasResult = addShellAliases();
		if (aliasResult) {
			log("success", "Shell aliases added successfully");
		}
	} else if (addAliases && dryRun) {
		log("info", "DRY RUN: Would add shell aliases (tm, taskmaster)");
	}

	// Display success message
	if (!isSilentMode()) {
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
	if (!isSilentMode()) {
		console.log(
			boxen(
				`${chalk.cyan.bold("接下来您可以做的事情:")}\n\n${chalk.white("1. ")}${chalk.yellow(
					"创建您的第一个任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim('使用: task-master add-task --title="任务标题" --description="任务描述"')}\n${chalk.white("2. ")}${chalk.yellow(
					"查看所有任务列表",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: task-master list")}\n${chalk.white("3. ")}${chalk.yellow(
					"查看下一个要处理的任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: task-master next")}\n${chalk.white("4. ")}${chalk.yellow(
					"开始处理任务并更新状态",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: task-master set-status --id=<id> --status=in-progress")}\n${chalk.white("5. ")}${chalk.yellow(
					"为复杂任务添加子任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim('使用: task-master add-subtask --parent=<id> --title="子任务标题"')}\n${chalk.white("6. ")}${chalk.yellow(
					"管理任务依赖关系",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: task-master add-dependency --id=<id> --depends-on=<dependency-id>")}\n${chalk.white("7. ")}${chalk.yellow(
					"使用标签组织不同功能的任务",
				)}\n${chalk.white("   └─ ")}${chalk.dim('使用: task-master add-tag <tag-name> --description="标签描述"')}\n${chalk.white("8. ")}${chalk.yellow(
					"生成任务文件以便查看和管理",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: task-master generate")}\n${chalk.white("9. ")}${chalk.yellow(
					"完成任务后标记为完成",
				)}\n${chalk.white("   └─ ")}${chalk.dim("使用: task-master set-status --id=<id> --status=done")}\n${chalk.white("10. ")}${chalk.green.bold("开始您的开发工作流程!")}\n\n${chalk.dim(
					"💡 提示: 使用 task-master --help 查看所有可用命令",
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

// Ensure necessary functions are exported
export { initializeProject, log };
