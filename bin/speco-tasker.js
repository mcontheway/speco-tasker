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
 * 品牌重塑后的新CLI工具，完全替换原task-master命令
 */

const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");
const chalk = require("chalk");
const { Command } = require("commander");

// 导入核心服务
import { PathService } from "../src/services/PathService.js";
import { BrandService } from "../src/services/BrandService.js";
import { CleanupService } from "../src/services/CleanupService.js";

// 获取包信息
const packageJson = require("../package.json");
const version = packageJson.version;

// 获取脚本路径
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const devScriptPath = path.resolve(__dirname, "../scripts/dev.js");

/**
 * 主CLI类
 * 负责处理命令行界面和品牌重塑逻辑
 */
class SpecoTaskerCLI {
	constructor() {
		this.program = new Command();
		this.pathService = null;
		this.brandService = null;
		this.cleanupService = null;
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
			.command("cleanup")
			.description("清理AI内容和旧品牌信息")
			.option("--ai-only", "仅清理AI相关内容")
			.option("--brand-only", "仅清理品牌相关内容")
			.option("--preview", "预览模式，不执行实际清理")
			.option("--rules <rules>", "指定清理规则文件")
			.action(this.handleCleanup.bind(this));

		this.program
			.command("rebrand")
			.description("执行品牌重塑（高风险操作）")
			.requiredOption("--new-name <name>", "新产品名称")
			.requiredOption("--new-command <command>", "新CLI命令名")
			.option("--new-description <desc>", "新产品描述")
			.option("--backup-dir <dir>", "备份目录路径")
			.option("--force", "强制执行，不进行额外确认")
			.action(this.handleRebrand.bind(this));

		this.program
			.command("config")
			.description("配置管理")
			.addCommand(
				new Command("show")
					.description("显示当前配置")
					.option("--paths", "仅显示路径配置")
					.option("--brand", "仅显示品牌配置")
					.action(this.handleConfigShow.bind(this)),
			)
			.addCommand(
				new Command("update")
					.description("更新配置")
					.option("--paths <file>", "更新路径配置")
					.option("--brand <file>", "更新品牌配置")
					.action(this.handleConfigUpdate.bind(this)),
			);

		// 任务管理命令（代理到原有系统）
		this.program
			.command("task <command>")
			.description("任务管理命令")
			.allowUnknownOption()
			.action(this.handleTaskCommand.bind(this));

		// 帮助和版本
		this.program.on("--help", () => {
			console.log("\n示例:");
			console.log('  $ speco-tasker init --name "my-project"');
			console.log("  $ speco-tasker cleanup --preview");
			console.log(
				'  $ speco-tasker rebrand --new-name "MyApp" --new-command "myapp"',
			);
			console.log("  $ speco-tasker config show --brand");
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

			// 初始化品牌服务
			this.brandService = new BrandService(this.pathService);
			await this.brandService.initialize();

			// 初始化清理服务
			this.cleanupService = new CleanupService(this.pathService);
			await this.cleanupService.initialize();

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
			console.log(chalk.blue("🚀 初始化 Speco Tasker 项目..."));

			await this.initializeServices();

			const projectName = options.name || path.basename(process.cwd());
			const config = {
				name: projectName,
				version: "1.2.0",
				description: "使用 Speco Tasker 管理项目任务",
				author: "Speco Team",
			};

			// 创建项目配置
			await this.createProjectConfig(config);

			// 创建必要的目录结构
			await this.createProjectStructure();

			console.log(chalk.green("✓ 项目初始化完成！"));
			console.log(`项目名称: ${projectName}`);
			console.log(`版本: ${config.version}`);

			if (options.verbose) {
				console.log("\n创建的文件和目录:");
				console.log("- .speco/ (主配置目录)");
				console.log("- .speco/config.json (配置文件)");
				console.log("- .speco/brand.json (品牌配置)");
				console.log("- .speco/cleanup-rules.json (清理规则)");
			}
		} catch (error) {
			console.error(chalk.red("✗ 初始化失败:"), error.message);
			process.exit(1);
		}
	}

	/**
	 * 处理清理命令
	 */
	async handleCleanup(options) {
		try {
			console.log(chalk.blue("🧹 开始清理操作..."));

			await this.initializeServices();

			const cleanupOptions = {
				preview: options.preview || false,
				type: options.aiOnly
					? "ai_service"
					: options.brandOnly
						? "brand_info"
						: "all",
			};

			if (options.preview) {
				console.log(chalk.yellow("预览模式：不会执行实际的清理操作"));
			}

			const results = await this.cleanupService.cleanup(cleanupOptions);

			if (results.success) {
				console.log(chalk.green("✓ 清理完成"));
				console.log(
					`处理文件数: ${results.processedFiles}/${results.totalFiles}`,
				);

				if (results.changes.length > 0) {
					console.log("\n清理详情:");
					results.changes.forEach((change) => {
						console.log(`- ${change.file}: ${change.changes} 处变更`);
					});
				}
			} else {
				console.error(chalk.red("✗ 清理失败:"), results.error);
				process.exit(1);
			}
		} catch (error) {
			console.error(chalk.red("✗ 清理过程中出错:"), error.message);
			process.exit(1);
		}
	}

	/**
	 * 处理品牌重塑命令（高风险操作）
	 */
	async handleRebrand(options) {
		try {
			console.log(chalk.yellow("⚠️  品牌重塑操作 - 这是一个高风险操作"));
			console.log(chalk.yellow("请确保您已经备份了所有重要数据"));

			if (!options.force) {
				const confirmed = await this.confirmOperation(
					`确定要将品牌重塑为 "${options.newName}" 吗？`,
				);
				if (!confirmed) {
					console.log("操作已取消");
					return;
				}
			}

			await this.initializeServices();

			// 创建备份
			console.log(chalk.blue("📦 创建备份..."));
			await this.createBackup(options.backupDir);

			// 执行品牌重塑
			console.log(chalk.blue("🔄 执行品牌重塑..."));
			const rebrandOptions = {
				renameFiles: true,
				updateReferences: true,
			};

			const newBrand = {
				name: options.newName,
				command: options.newCommand,
				description:
					options.newDescription || `使用 ${options.newName} 管理项目任务`,
				version: "1.2.0",
			};

			const result = await this.brandService.rebrand(newBrand, rebrandOptions);

			if (result.success) {
				console.log(chalk.green("✓ 品牌重塑完成！"));
				console.log(`新品牌名称: ${newBrand.name}`);
				console.log(`新命令名称: ${newBrand.command}`);

				if (result.changes) {
					console.log("\n重塑详情:");
					Object.entries(result.changes).forEach(([key, change]) => {
						console.log(`- ${key}: ${change.from} → ${change.to}`);
					});
				}
			} else {
				console.error(chalk.red("✗ 品牌重塑失败:"), result.error);

				// 回滚操作
				console.log(chalk.yellow("🔄 正在回滚..."));
				await this.rollbackRebrand();

				process.exit(1);
			}
		} catch (error) {
			console.error(chalk.red("✗ 品牌重塑过程中出错:"), error.message);

			// 回滚操作
			try {
				console.log(chalk.yellow("🔄 正在回滚..."));
				await this.rollbackRebrand();
			} catch (rollbackError) {
				console.error(chalk.red("✗ 回滚也失败了:"), rollbackError.message);
			}

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
			} else if (options.brand) {
				const brand = this.brandService.getBrandSummary();
				console.log(JSON.stringify(brand, null, 2));
			} else {
				const paths = this.pathService.getPathSnapshot();
				const brand = this.brandService.getBrandSummary();
				const cleanupStats = this.cleanupService.getStatistics();

				console.log(
					JSON.stringify(
						{
							paths,
							brand,
							cleanup: cleanupStats,
						},
						null,
						2,
					),
				);
			}
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

			if (options.brand) {
				const brandConfig = JSON.parse(
					await fs.readFile(options.brand, "utf8"),
				);
				await this.brandService.updateBrand(brandConfig);
				console.log(chalk.green("✓ 品牌配置更新完成"));
			}
		} catch (error) {
			console.error(chalk.red("✗ 更新配置失败:"), error.message);
			process.exit(1);
		}
	}

	/**
	 * 处理任务管理命令
	 */
	async handleTaskCommand(command, options) {
		try {
			// 代理到原有的任务管理脚本
			const args = [command, ...options];

			const child = spawn("node", [devScriptPath, ...args], {
				stdio: "inherit",
				cwd: process.cwd(),
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
		const brandPath = ".speco/brand.json";
		const cleanupPath = ".speco/cleanup-rules.json";

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
				aiCleanup: false,
				brandRebrand: true,
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

		// 创建品牌配置
		const brandConfig = {
			name: "Speco Tasker",
			command: "speco-tasker",
			description: "纯净的任务管理系统",
			version: config.version,
			shortName: "Speco",
			tagline: "纯净的任务管理系统",
			author: config.author,
			license: "MIT WITH Commons-Clause",
			website: "",
			repository: "",
			documentation: "",
		};

		// 创建清理规则配置
		const cleanupConfig = {
			rules: [
				{
					id: "ai-service-cleanup",
					name: "AI服务调用清理",
					type: "ai_service",
					patterns: ["**/ai/**", "**/services/ai/**"],
					contentPatterns: [/import.*from.*ai-service/, /require.*ai-service/],
					action: "remove",
					safePatterns: ["**/tests/**", "**/mocks/**"],
					requiresConfirmation: true,
				},
				{
					id: "brand-info-cleanup",
					name: "品牌信息清理",
					type: "brand_info",
					contentPatterns: [/Task Master|task-master|TaskMaster/],
					action: "replace",
					replacement: "Speco Tasker",
					requiresConfirmation: false,
				},
			],
		};

		// 写入配置文件
		await fs.mkdir(".speco", { recursive: true });
		await fs.writeFile(configPath, JSON.stringify(mainConfig, null, 2));
		await fs.writeFile(brandPath, JSON.stringify(brandConfig, null, 2));
		await fs.writeFile(cleanupPath, JSON.stringify(cleanupConfig, null, 2));
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
			".speco/brand.json",
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
				continue;
			}
		}

		console.log(`备份创建在: ${backupPath}`);
	}

	/**
	 * 回滚品牌重塑
	 */
	async rollbackRebrand() {
		if (!this.backupState) {
			console.error("没有可用的备份状态");
			return;
		}

		for (const file of this.backupState.files) {
			try {
				const backupContent = await fs.readFile(file.backup, "utf8");
				await fs.writeFile(file.original, backupContent);
				console.log(`已恢复: ${file.original}`);
			} catch (error) {
				console.error(`恢复失败 ${file.original}:`, error.message);
			}
		}

		console.log("回滚完成");
	}

	/**
	 * 确认操作
	 */
	async confirmOperation(message) {
		const readline = require("readline");
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

module.exports = SpecoTaskerCLI;
