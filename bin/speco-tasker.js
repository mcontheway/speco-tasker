#!/usr/bin/env node

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

/**
 * Speco Tasker CLI
 * 纯净的任务管理系统
 */

import { spawn } from "node:child_process";
// ES模块导入
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { Command } from "commander";

import { initializeProject } from "../scripts/init.js";
// 导入核心服务
import { PathService } from "../src/services/PathService.js";

// 获取脚本路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const devScriptPath = path.resolve(projectRoot, "scripts/dev.js");
const packageJsonPath = path.resolve(projectRoot, "package.json");

// 获取包信息 - 从当前工作目录读取，而不是从link的目录
import { readFileSync } from "node:fs";
let version = "unknown";
try {
	// 尝试从当前工作目录读取package.json，这样可以确保读取到正确的版本
	const cwdPackageJsonPath = path.resolve(process.cwd(), "package.json");
	const packageJson = JSON.parse(readFileSync(cwdPackageJsonPath, "utf8"));
	version = packageJson.version || version;
} catch (error) {
	// 如果无法读取当前目录的package.json，尝试从脚本目录读取
	try {
		const packageJsonPath = path.resolve(projectRoot, "package.json");
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
		version = packageJson.version || version;
	} catch (fallbackError) {
		// 如果都无法读取，保持为unknown
		version = "unknown";
	}
}

/**
 * 主CLI类
 * 负责处理命令行界面
 */
class SpecoTaskerCLI {
	constructor() {
		this.program = new Command();
		this.pathService = null;
		this.backupState = null;

		this.setupCLI();
	}

	/**
	 * 设置CLI界面
	 */
	setupCLI() {
		this.program
			.name("speco-tasker")
			.description("Speco Tasker - 纯净的任务管理系统")
			.version(version)
			.option("--verbose", "启用详细输出")
			.option("--dry-run", "试运行模式，不执行实际操作");

		// 核心命令
		this.program
			.command("init")
			.description("初始化新项目")
			.option("-y, --yes", "跳过确认提示")
			.option("--name <name>", "项目名称")
			.option("--force", "强制重新初始化")
			.action(this.handleInit.bind(this));

		this.program
			.command("config")
			.description("配置管理")
			.addCommand(
				new Command("show")
					.description("显示当前配置")
					.option("--paths", "仅显示路径配置")
					.action(this.handleConfigShow.bind(this)),
			)
			.addCommand(
				new Command("update")
					.description("更新配置")
					.option("--paths <file>", "更新路径配置")
					.action(this.handleConfigUpdate.bind(this)),
			);

		// 任务管理命令（代理到原有系统）
		this.program
			.command("task <command> [args...]")
			.description("任务管理命令")
			.allowUnknownOption()
			.action(this.handleTaskCommand.bind(this));

		// 帮助和版本
		this.program.on("--help", () => {
			console.log("\n示例:");
			console.log('  $ speco-tasker init --name "my-project"');
			console.log("  $ speco-tasker config show --paths");
			console.log("  $ speco-tasker task list");
		});
	}

	/**
	 * 初始化核心服务
	 */
	async initializeServices() {
		try {
			// 初始化路径服务
			this.pathService = new PathService();
			await this.pathService.initialize();

			if (this.program.opts().verbose) {
				console.log(chalk.green("✓ 核心服务初始化完成"));
			}
		} catch (error) {
			console.error(chalk.red("✗ 核心服务初始化失败:"), error.message);
			throw error;
		}
	}

	/**
	 * 处理初始化命令
	 */
	async handleInit(options) {
		try {
			// 使用统一的初始化逻辑
			await initializeProject({
				name: options.name,
				yes: options.yes,
				verbose: options.verbose,
			});

			process.exit(0);
		} catch (error) {
			console.error(chalk.red("✗ 初始化失败:"), error.message);
			process.exit(1);
		}
	}

	/**
	 * 处理配置显示命令
	 */
	async handleConfigShow(options) {
		try {
			await this.initializeServices();

			if (options.paths) {
				const paths = this.pathService.getPathSnapshot();
				console.log(JSON.stringify(paths, null, 2));
			} else {
				const paths = this.pathService.getPathSnapshot();
				console.log(JSON.stringify({ paths }, null, 2));
			}
			process.exit(0);
		} catch (error) {
			console.error(chalk.red("✗ 获取配置失败:"), error.message);
			process.exit(1);
		}
	}

	/**
	 * 处理配置更新命令
	 */
	async handleConfigUpdate(options) {
		try {
			await this.initializeServices();

			if (options.paths) {
				const pathsConfig = JSON.parse(
					await fs.readFile(options.paths, "utf8"),
				);
				await this.pathService.updateConfiguration(pathsConfig);
				console.log(chalk.green("✓ 路径配置更新完成"));
			}
			process.exit(0);
		} catch (error) {
			console.error(chalk.red("✗ 更新配置失败:"), error.message);
			process.exit(1);
		}
	}

	/**
	 * 处理任务管理命令
	 */
	async handleTaskCommand(command, args) {
		try {
			// 代理到原有的任务管理脚本
			let finalArgs = [command];

			// args 现在是数组形式，包含所有剩余的参数
			if (args && Array.isArray(args)) {
				finalArgs = finalArgs.concat(args);
			}

			const child = spawn("node", [devScriptPath, ...finalArgs], {
				stdio: "inherit",
				cwd: process.cwd(),
				env: {
					...process.env,
					PARENT_COMMAND: "speco-tasker", // Set environment variable for command detection
				},
			});

			child.on("close", (code) => {
				process.exit(code);
			});
		} catch (error) {
			console.error(chalk.red("✗ 任务命令执行失败:"), error.message);
			process.exit(1);
		}
	}

	/**
	 * 创建项目配置
	 */
	async createProjectConfig(config) {
		const configPath = ".speco/config.json";

		// 创建主配置
		const mainConfig = {
			project: config,
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
			features: {
				pathConfig: true,
				mcpServer: true,
				cli: true,
			},
			testing: {
				framework: "jest",
				coverage: {
					enabled: true,
					thresholds: {
						branches: 70,
						functions: 80,
						lines: 80,
						statements: 80,
					},
				},
			},
			quality: {
				eslint: true,
				prettier: true,
				biome: true,
			},
		};

		// 写入配置文件
		await fs.mkdir(".speco", { recursive: true });
		await fs.writeFile(configPath, JSON.stringify(mainConfig, null, 2));
	}

	/**
	 * 创建项目目录结构
	 */
	async createProjectStructure() {
		const dirs = [
			"src/models",
			"src/services",
			"src/controllers",
			"tests/unit",
			"tests/integration",
			"tests/e2e",
			"docs",
			"scripts/modules",
		];

		for (const dir of dirs) {
			await fs.mkdir(dir, { recursive: true });
		}
	}

	/**
	 * 创建备份
	 */
	async createBackup(backupDir = ".speco/backup") {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		this.backupState = {
			timestamp,
			backupDir,
			files: [],
		};

		const backupPath = path.join(backupDir, timestamp);
		await fs.mkdir(backupPath, { recursive: true });

		// 备份关键文件
		const filesToBackup = [
			"package.json",
			"bin/task-master.js",
			"README.md",
			".speco/config.json",
		];

		for (const file of filesToBackup) {
			try {
				const content = await fs.readFile(file, "utf8");
				const backupFile = path.join(backupPath, path.basename(file));
				await fs.writeFile(backupFile, content);
				this.backupState.files.push({
					original: file,
					backup: backupFile,
				});
			} catch (error) {
				// 文件不存在，跳过
			}
		}

		console.log(`备份创建在: ${backupPath}`);
	}

	/**
	 * 确认操作
	 */
	async confirmOperation(message) {
		const readline = require("node:readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		return new Promise((resolve) => {
			rl.question(`${message} (y/N): `, (answer) => {
				rl.close();
				resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
			});
		});
	}

	/**
	 * 启动CLI
	 */
	async start() {
		try {
			this.program.parse();
		} catch (error) {
			console.error(chalk.red("CLI 执行出错:"), error.message);
			process.exit(1);
		}
	}
}

// 创建并启动CLI
const cli = new SpecoTaskerCLI();
cli.start().catch((error) => {
	console.error(chalk.red("CLI 启动失败:"), error.message);
	process.exit(1);
});

export { SpecoTaskerCLI };
