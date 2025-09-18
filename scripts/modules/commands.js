/**
 * commands.js
 * Command-line interface for the Speco Tasker CLI
 */

import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import search from "@inquirer/search";
import boxen from "boxen";
import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import ora from "ora"; // Import ora

import {
	addSubtask,
	addTask,
	clearSubtasks,
	findTaskById,
	generateTaskFiles,
	listTasks,
	migrateProject,
	moveTask,
	removeSubtask,
	removeTask,
	setTaskStatus,
	taskExists,
	updateSubtaskById,
} from "./task-manager.js";
import {
	detectCamelCaseFlags,
	getCurrentTag,
	log,
	readJSON,
	toKebabCase,
	writeJSON,
} from "./utils.js";
import {
	getConfigValue,
	setConfigValue,
	getConfigValues,
	validateConfiguration,
	getConfigHistory,
	rollbackConfig,
	resetConfigToDefaults,
} from "./config-manager.js";

import {
	MOVE_ERROR_CODES,
	MoveTaskError,
	moveTasksBetweenTags,
} from "./task-manager/move-task.js";

import {
	copyTag,
	createTag,
	deleteTag,
	renameTag,
	tags,
	useTag,
} from "./task-manager/tag-management.js";

import {
	DEPENDENCY_ERROR_CODES,
	DependencyError,
	addDependency,
	fixDependenciesCommand,
	removeDependency,
	validateDependenciesCommand,
} from "./dependency-manager.js";

import {
	ConfigurationError,
	getConfig,
	getDebugFlag,
	getDefaultNumTasks,
	isConfigFilePresent,
	writeConfig,
} from "./config-manager.js";

import {
	COMPLEXITY_REPORT_FILE,
	TASKMASTER_DOCS_DIR,
	TASKMASTER_TASKS_FILE,
} from "../../src/constants/paths.js";

import { initTaskMaster } from "../../src/task-master.js";

// 导入新的品牌重塑服务
import { PathService } from "../../src/services/PathService.js";
import { BrandService } from "../../src/services/BrandService.js";
import { CleanupService } from "../../src/services/CleanupService.js";

import {
	confirmProfilesRemove,
	confirmRemoveAllRemainingProfiles,
} from "../../src/ui/confirm.js";
import {
	confirmTaskOverwrite,
	displayBanner,
	displayCrossTagDependencyError,
	displayCurrentTagIndicator,
	displayDependencyValidationHints,
	displayHelp,
	displayInvalidTagCombinationError,
	displayMultipleTasksSummary,
	displayNextTask,
	displaySubtaskMoveError,
	displayTaggedTasksFYI,
	displayTaskById,
	getStatusWithColor,
	startLoadingIndicator,
	stopLoadingIndicator,
} from "./ui.js";

import {
	TASK_STATUS_OPTIONS,
	isValidTaskStatus,
} from "../../src/constants/task-status.js";
import { getTaskMasterVersion } from "../../src/utils/getVersion.js";
import { initializeProject } from "../init.js";
import { syncTasksToReadme } from "./sync-readme.js";

/**
 * Configure and register CLI commands
 * @param {Object} program - Commander program instance
 */
function registerCommands(programInstance) {
	// Add global error handler for unknown options
	programInstance.on("option:unknown", function (unknownOption) {
		const commandName = this._name || "unknown";
		console.error(chalk.red(`Error: Unknown option '${unknownOption}'`));
		console.error(
			chalk.yellow(
				`Run 'task-master ${commandName} --help' to see available options`,
			),
		);
		process.exit(1);
	});

	// generate command
	programInstance
		.command("generate")
		.description("从tasks.json生成任务文件")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option(
			"-o, --output <dir>",
			"输出目录",
			path.dirname(TASKMASTER_TASKS_FILE),
		)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const outputDir = options.output;
			const tag = taskMaster.getCurrentTag();

			console.log(
				chalk.blue(`Generating task files from: ${taskMaster.getTasksPath()}`),
			);
			console.log(chalk.blue(`Output directory: ${outputDir}`));

			await generateTaskFiles(taskMaster.getTasksPath(), outputDir, {
				projectRoot: taskMaster.getProjectRoot(),
				tag,
			});
		});

	// 品牌重塑相关命令

	// rebrand command - 高风险命令，涉及原子性操作
	programInstance
		.command("rebrand")
		.description("⚠️ 执行品牌重塑（高风险操作）")
		.requiredOption("--new-name <name>", "新产品名称")
		.requiredOption("--new-command <command>", "新CLI命令名")
		.option("--new-description <desc>", "新产品描述")
		.option("--backup-dir <dir>", "备份目录路径", ".speco/backup")
		.option("--force", "强制执行，不进行额外确认", false)
		.option("--dry-run", "试运行模式，显示将要执行的操作但不实际执行", false)
		.action(async (options) => {
			try {
				console.log(chalk.yellow("⚠️  品牌重塑操作 - 这是一个高风险操作"));
				console.log(chalk.yellow("请确保您已经备份了所有重要数据"));
				console.log();

				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				// 初始化服务
				const pathService = new PathService();
				await pathService.initialize({ projectRoot });

				const brandService = new BrandService(pathService);
				await brandService.initialize();

				// 验证新品牌信息
				const newBrand = {
					name: options.newName,
					command: options.newCommand,
					description:
						options.newDescription || `使用 ${options.newName} 管理项目任务`,
					version: "1.2.0",
				};

				console.log(chalk.blue("正在验证新品牌信息..."));
				const validation = this.validateBrandInfo(newBrand);
				if (!validation.valid) {
					console.error(chalk.red("品牌信息验证失败:"));
					validation.errors.forEach((error) =>
						console.error(chalk.red(`  - ${error}`)),
					);
					process.exit(1);
				}

				// 显示将要执行的操作
				console.log(chalk.blue("\n将要执行的品牌重塑操作:"));
				console.log(`  旧品牌: ${brandService.getDisplayInfo().name}`);
				console.log(`  新品牌: ${newBrand.name}`);
				console.log(`  旧命令: ${brandService.getCLIInfo().command}`);
				console.log(`  新命令: ${newBrand.command}`);
				console.log(`  备份目录: ${options.backupDir}`);
				console.log();

				if (!options.force && !options.dryRun) {
					const confirmed = await this.confirmOperation(
						`确定要将品牌重塑为 "${newBrand.name}" 吗？`,
					);
					if (!confirmed) {
						console.log(chalk.yellow("操作已取消"));
						return;
					}
				}

				if (options.dryRun) {
					console.log(chalk.cyan("试运行模式：以上是将会执行的操作"));
					return;
				}

				// 创建备份
				console.log(chalk.blue("📦 创建备份..."));
				await this.createBackup(options.backupDir, projectRoot);

				// 执行品牌重塑
				console.log(chalk.blue("🔄 执行品牌重塑..."));
				const result = await brandService.rebrand(newBrand, {
					renameFiles: true,
					updateReferences: true,
				});

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
					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red("✗ 品牌重塑过程中出错:"), error.message);
				process.exit(1);
			}
		});

	// cleanup command
	programInstance
		.command("cleanup")
		.description("清理AI内容和旧品牌信息")
		.option("--ai-only", "仅清理AI相关内容", false)
		.option("--brand-only", "仅清理品牌相关内容", false)
		.option("--preview", "预览模式，不执行实际清理", false)
		.option("--rules <rules>", "指定清理规则文件", ".speco/cleanup-rules.json")
		.option("--dry-run", "试运行模式，显示将要清理的内容但不实际执行", false)
		.action(async (options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				// 初始化服务
				const pathService = new PathService();
				await pathService.initialize({ projectRoot });

				const cleanupService = new CleanupService(pathService);
				await cleanupService.initialize();

				console.log(chalk.blue("🧹 开始清理操作..."));

				const cleanupOptions = {
					preview: options.preview || options.dryRun,
					type: options.aiOnly
						? "ai_service"
						: options.brandOnly
							? "brand_info"
							: "all",
				};

				if (options.preview || options.dryRun) {
					console.log(chalk.yellow("预览模式：不会执行实际的清理操作"));
				}

				const results = await cleanupService.cleanup(cleanupOptions);

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
		});

	// config command group
	const configCommand = programInstance
		.command("config")
		.description("配置管理");

	configCommand
		.command("show")
		.description("显示当前配置")
		.option("--paths", "仅显示路径配置", false)
		.option("--brand", "仅显示品牌配置", false)
		.option("--cleanup", "仅显示清理配置", false)
		.action(async (options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				// 初始化服务
				const pathService = new PathService();
				await pathService.initialize({ projectRoot });

				const brandService = new BrandService(pathService);
				await brandService.initialize();

				const cleanupService = new CleanupService(pathService);
				await cleanupService.initialize();

				if (options.paths) {
					const paths = pathService.getPathSnapshot();
					console.log(JSON.stringify(paths, null, 2));
				} else if (options.brand) {
					const brand = brandService.getBrandSummary();
					console.log(JSON.stringify(brand, null, 2));
				} else if (options.cleanup) {
					const stats = cleanupService.getStatistics();
					console.log(JSON.stringify(stats, null, 2));
				} else {
					const paths = pathService.getPathSnapshot();
					const brand = brandService.getBrandSummary();
					const cleanupStats = cleanupService.getStatistics();

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
		});

	configCommand
		.command("update")
		.description("更新配置")
		.option("--paths <file>", "更新路径配置")
		.option("--brand <file>", "更新品牌配置")
		.option("--cleanup <file>", "更新清理配置")
		.action(async (options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				// 初始化服务
				const pathService = new PathService();
				await pathService.initialize({ projectRoot });

				const brandService = new BrandService(pathService);
				await brandService.initialize();

				const cleanupService = new CleanupService(pathService);
				await cleanupService.initialize();

				if (options.paths) {
					const pathsConfig = JSON.parse(
						await fs.readFile(options.paths, "utf8"),
					);
					await pathService.updateConfiguration(pathsConfig);
					console.log(chalk.green("✓ 路径配置更新完成"));
				}

				if (options.brand) {
					const brandConfig = JSON.parse(
						await fs.readFile(options.brand, "utf8"),
					);
					await brandService.updateBrand(brandConfig);
					console.log(chalk.green("✓ 品牌配置更新完成"));
				}

				if (options.cleanup) {
					const cleanupConfig = JSON.parse(
						await fs.readFile(options.cleanup, "utf8"),
					);
					// 这里需要实现清理配置的更新逻辑
					console.log(chalk.yellow("清理配置更新功能待实现"));
				}
			} catch (error) {
				console.error(chalk.red("✗ 更新配置失败:"), error.message);
				process.exit(1);
			}
		});

	// config set command - 设置配置参数
	configCommand
		.command("set <key> <value>")
		.description("设置配置参数值")
		.option("--validate", "启用配置验证", true)
		.option("--backup", "创建配置备份", false)
		.option("--force", "强制设置，即使验证失败", false)
		.action(async (key, value, options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				console.log(chalk.blue(`设置配置参数: ${key} = ${value}`));

				// 解析值类型
				let parsedValue = value;
				if (value === "true") parsedValue = true;
				else if (value === "false") parsedValue = false;
				else if (!isNaN(value) && value !== "") parsedValue = Number(value);

				const success = setConfigValue(
					key,
					parsedValue,
					{
						validate: options.validate,
						backup: options.backup,
						source: "cli",
					},
					projectRoot,
				);

				if (success) {
					console.log(
						chalk.green(`✓ 配置参数 ${key} 已设置为: ${parsedValue}`),
					);

					// 显示验证结果
					if (options.validate) {
						const validation = validateConfiguration(null, projectRoot);
						if (validation.valid) {
							console.log(chalk.green("✓ 配置验证通过"));
						} else {
							console.log(chalk.yellow("⚠ 配置验证发现问题:"));
							validation.errors.forEach((error) =>
								console.log(chalk.yellow(`  - ${error}`)),
							);
						}
					}
				} else {
					console.error(chalk.red(`✗ 设置配置参数失败: ${key}`));
					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red(`✗ 设置配置参数失败: ${error.message}`));
				process.exit(1);
			}
		});

	// config validate command - 验证配置
	configCommand
		.command("validate")
		.description("验证当前配置的正确性和完整性")
		.option("--strict", "启用严格验证模式", false)
		.option("--fix", "尝试自动修复发现的问题", false)
		.action(async (options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				console.log(chalk.blue("正在验证配置..."));

				const config = getConfigValues({}, projectRoot);
				const validation = validateConfiguration(config, projectRoot);

				if (validation.valid) {
					console.log(chalk.green("✓ 配置验证通过"));
					console.log(chalk.blue("配置摘要:"));
					console.log(
						`  - 全局配置: ${Object.keys(config.global || {}).length} 个参数`,
					);
					console.log(
						`  - 路径配置: ${Object.keys(config.paths || {}).length} 个路径`,
					);
					console.log(
						`  - 功能配置: ${Object.keys(config.features || {}).length} 个功能`,
					);
				} else {
					console.log(chalk.red("✗ 配置验证失败"));
					console.log(chalk.red("发现的错误:"));
					validation.errors.forEach((error) =>
						console.log(chalk.red(`  - ${error}`)),
					);

					if (validation.warnings && validation.warnings.length > 0) {
						console.log(chalk.yellow("警告信息:"));
						validation.warnings.forEach((warning) =>
							console.log(chalk.yellow(`  - ${warning}`)),
						);
					}

					if (options.fix) {
						console.log(chalk.blue("尝试自动修复..."));
						// 这里可以实现自动修复逻辑
						console.log(chalk.yellow("自动修复功能暂未实现"));
					}

					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red(`✗ 配置验证失败: ${error.message}`));
				process.exit(1);
			}
		});

	// config history command - 配置历史
	configCommand
		.command("history")
		.description("查看配置变更历史")
		.option("--key <key>", "按配置键过滤")
		.option("--user <userId>", "按用户ID过滤")
		.option("--start-time <time>", "开始时间 (ISO格式)")
		.option("--end-time <time>", "结束时间 (ISO格式)")
		.option("--limit <number>", "限制返回的条目数量", 20)
		.action(async (options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				console.log(chalk.blue("正在获取配置历史..."));

				const history = getConfigHistory(
					{
						key: options.key,
						userId: options.user,
						startTime: options.startTime,
						endTime: options.endTime,
						limit: parseInt(options.limit, 10),
					},
					projectRoot,
				);

				if (history.length === 0) {
					console.log(chalk.yellow("未找到配置历史记录"));
					return;
				}

				console.log(chalk.blue(`找到 ${history.length} 条配置历史记录:`));
				console.log();

				history.forEach((entry, index) => {
					const timestamp = new Date(entry.timestamp).toLocaleString();
					console.log(`${index + 1}. ${chalk.cyan(entry.key)}`);
					console.log(`   时间: ${timestamp}`);
					console.log(`   用户: ${entry.userId}`);
					console.log(`   旧值: ${JSON.stringify(entry.oldValue)}`);
					console.log(`   新值: ${JSON.stringify(entry.newValue)}`);
					console.log(`   版本: ${entry.versionId}`);
					console.log();
				});
			} catch (error) {
				console.error(chalk.red(`✗ 获取配置历史失败: ${error.message}`));
				process.exit(1);
			}
		});

	// config rollback command - 回滚配置
	configCommand
		.command("rollback <versionId>")
		.description("回滚配置到指定版本")
		.option("--confirm", "跳过确认提示", false)
		.option("--backup", "创建回滚前备份", true)
		.action(async (versionId, options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				// 显示将要回滚的版本信息
				const history = getConfigHistory({}, projectRoot);
				const targetEntry = history.find(
					(entry) => entry.versionId === versionId,
				);

				if (!targetEntry) {
					console.error(chalk.red(`✗ 未找到配置版本: ${versionId}`));
					process.exit(1);
				}

				console.log(chalk.yellow("⚠️  配置回滚操作"));
				console.log(`版本ID: ${versionId}`);
				console.log(
					`变更时间: ${new Date(targetEntry.timestamp).toLocaleString()}`,
				);
				console.log(`配置键: ${targetEntry.key}`);
				console.log(`旧值: ${JSON.stringify(targetEntry.oldValue)}`);
				console.log(`新值: ${JSON.stringify(targetEntry.newValue)}`);
				console.log();

				// 确认提示
				if (!options.confirm) {
					const { proceed } = await inquirer.prompt([
						{
							type: "confirm",
							name: "proceed",
							message: "确定要回滚到此配置版本吗？这将覆盖当前配置。",
							default: false,
						},
					]);

					if (!proceed) {
						console.log(chalk.yellow("操作已取消"));
						return;
					}
				}

				console.log(chalk.blue("正在执行配置回滚..."));
				const success = rollbackConfig(versionId, projectRoot);

				if (success) {
					console.log(chalk.green(`✓ 配置已成功回滚到版本: ${versionId}`));

					if (options.backup) {
						console.log(chalk.blue("✓ 已创建回滚前配置备份"));
					}
				} else {
					console.error(chalk.red("✗ 配置回滚失败"));
					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red(`✗ 配置回滚失败: ${error.message}`));
				process.exit(1);
			}
		});

	// config reset command - 重置配置
	configCommand
		.command("reset")
		.description("重置配置为默认值")
		.option("--confirm", "跳过确认提示", false)
		.option("--backup", "创建重置前备份", true)
		.action(async (options) => {
			try {
				const projectRoot = findProjectRoot();
				if (!projectRoot) {
					console.error(chalk.red("错误：找不到项目根目录"));
					process.exit(1);
				}

				console.log(chalk.yellow("⚠️  配置重置操作"));
				console.log(chalk.yellow("这将把所有配置重置为默认值。"));
				console.log();

				// 确认提示
				if (!options.confirm) {
					const { proceed } = await inquirer.prompt([
						{
							type: "confirm",
							name: "proceed",
							message: "确定要重置所有配置为默认值吗？",
							default: false,
						},
					]);

					if (!proceed) {
						console.log(chalk.yellow("操作已取消"));
						return;
					}
				}

				console.log(chalk.blue("正在重置配置..."));
				const success = resetConfigToDefaults(projectRoot);

				if (success) {
					console.log(chalk.green("✓ 配置已成功重置为默认值"));

					if (options.backup) {
						console.log(chalk.blue("✓ 已创建重置前配置备份"));
					}

					console.log(chalk.blue("默认配置摘要:"));
					const defaultConfig = getConfigValues({}, projectRoot);
					console.log(
						`  - 日志级别: ${defaultConfig.global?.logLevel || "info"}`,
					);
					console.log(
						`  - 默认任务数量: ${defaultConfig.global?.defaultNumTasks || 10}`,
					);
					console.log(
						`  - 默认优先级: ${defaultConfig.global?.defaultPriority || "medium"}`,
					);
				} else {
					console.error(chalk.red("✗ 配置重置失败"));
					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red(`✗ 配置重置失败: ${error.message}`));
				process.exit(1);
			}
		});

	// set-status command
	programInstance
		.command("set-status")
		.alias("mark")
		.alias("set")
		.description("设置任务状态")
		.option("-i, --id <id>", "任务ID，支持逗号分隔多个任务")
		.option(
			"-s, --status <status>",
			`新状态，可选值：${TASK_STATUS_OPTIONS.join(", ")}`,
		)
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const taskId = options.id;
			const status = options.status;

			if (!taskId || !status) {
				console.error(chalk.red("Error: Both --id and --status are required"));
				process.exit(1);
			}

			if (!isValidTaskStatus(status)) {
				console.error(
					chalk.red(
						`Error: Invalid status value: ${status}. Use one of: ${TASK_STATUS_OPTIONS.join(", ")}`,
					),
				);

				process.exit(1);
			}
			const tag = taskMaster.getCurrentTag();

			displayCurrentTagIndicator(tag);

			console.log(
				chalk.blue(`Setting status of task(s) ${taskId} to: ${status}`),
			);

			await setTaskStatus(taskMaster.getTasksPath(), taskId, status, {
				projectRoot: taskMaster.getProjectRoot(),
				tag,
			});
		});

	// list command
	programInstance
		.command("list")
		.description("列出所有任务")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-s, --status <status>", "按状态过滤任务")
		.option("--with-subtasks", "显示每个任务的子任务")
		.option("-c, --compact", "使用紧凑的一行格式显示任务")
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			// Initialize TaskMaster
			const initOptions = {
				tasksPath: options.file || true,
				tag: options.tag,
			};

			const taskMaster = initTaskMaster(initOptions);

			const statusFilter = options.status;
			const withSubtasks = options.withSubtasks || false;
			const compact = options.compact || false;
			const tag = taskMaster.getCurrentTag();
			// Show current tag context
			displayCurrentTagIndicator(tag);

			if (!compact) {
				console.log(
					chalk.blue(`Listing tasks from: ${taskMaster.getTasksPath()}`),
				);
				if (statusFilter) {
					console.log(chalk.blue(`Filtering by status: ${statusFilter}`));
				}
				if (withSubtasks) {
					console.log(chalk.blue("Including subtasks in listing"));
				}
			}

			await listTasks(
				taskMaster.getTasksPath(),
				statusFilter,
				taskMaster.getComplexityReportPath(),
				withSubtasks,
				compact ? "compact" : "text",
				{ projectRoot: taskMaster.getProjectRoot(), tag },
			);
		});

	// clear-subtasks command
	programInstance
		.command("clear-subtasks")
		.description("清除指定任务的子任务")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-i, --id <ids>", "要清除子任务的任务ID，支持逗号分隔")
		.option("--all", "清除所有任务的子任务")
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			const taskIds = options.id;
			const all = options.all;

			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			if (!taskIds && !all) {
				console.error(
					chalk.red(
						"Error: Please specify task IDs with --id=<ids> or use --all to clear all tasks",
					),
				);
				process.exit(1);
			}

			if (all) {
				// If --all is specified, get all task IDs
				const data = readJSON(
					taskMaster.getTasksPath(),
					taskMaster.getProjectRoot(),
					tag,
				);
				if (!data || !data.tasks) {
					console.error(chalk.red("Error: No valid tasks found"));
					process.exit(1);
				}
				const allIds = data.tasks.map((t) => t.id).join(",");
				clearSubtasks(taskMaster.getTasksPath(), allIds, {
					projectRoot: taskMaster.getProjectRoot(),
					tag,
				});
			} else {
				clearSubtasks(taskMaster.getTasksPath(), taskIds, {
					projectRoot: taskMaster.getProjectRoot(),
					tag,
				});
			}
		});

	// add-task command
	programInstance
		.command("add-task")
		.description("添加新任务")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-t, --title <title>", "任务标题（必需）")
		.option("-d, --description <description>", "任务描述（必需）")
		.option("--details <details>", "实现细节（必需）")
		.option(
			"--dependencies <dependencies>",
			"此任务依赖的任务ID列表，用逗号分隔",
		)
		.option(
			"--priority <priority>",
			"任务优先级（high, medium, low）",
			"medium",
		)
		.option("--test-strategy <text>", "测试策略（必需）")
		.option(
			"--spec-files <files>",
			"规范文档文件路径，用逗号分隔（必需，至少一个文档）",
		)
		// Research option removed - functionality no longer available
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			const isManualCreation =
				options.title &&
				options.description &&
				options.details &&
				options.testStrategy &&
				options.specFiles;

			// Validate that all required fields are provided for spec-driven development
			if (!isManualCreation) {
				console.error(
					chalk.red(
						"Error: All required fields must be provided for spec-driven development:",
					),
				);
				console.error(chalk.red("  --title: Task title (required)"));
				console.error(
					chalk.red("  --description: Task description (required)"),
				);
				console.error(
					chalk.red("  --details: Implementation details (required)"),
				);
				console.error(chalk.red("  --test-strategy: Test strategy (required)"));
				console.error(
					chalk.red(
						"  --spec-files: Specification document files (required, at least one)",
					),
				);
				process.exit(1);
			}

			const tasksPath = options.file || TASKMASTER_TASKS_FILE;

			if (!fs.existsSync(tasksPath)) {
				console.error(
					`❌ No tasks.json file found. Please run "task-master init" or create a tasks.json file at ${TASKMASTER_TASKS_FILE}`,
				);
				process.exit(1);
			}

			// Correctly determine projectRoot
			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const projectRoot = taskMaster.getProjectRoot();

			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			let manualTaskData = null;
			if (isManualCreation) {
				manualTaskData = {
					title: options.title,
					description: options.description,
					details: options.details || "",
					testStrategy: options.testStrategy || "",
					spec_files: options.specFiles
						? options.specFiles.split(",").map((f) => {
								const trimmed = f.trim();
								return {
									type: "spec",
									title: trimmed.split("/").pop() || "Specification Document",
									file: trimmed,
								};
							})
						: [],
				};
				// Restore specific logging for manual creation
				console.log(
					chalk.blue(`Creating task manually with title: "${options.title}"`),
				);
			}

			// Log dependencies and priority if provided (restored)
			const dependenciesArray = options.dependencies
				? options.dependencies.split(",").map((id) => id.trim())
				: [];
			if (dependenciesArray.length > 0) {
				console.log(
					chalk.blue(`Dependencies: [${dependenciesArray.join(", ")}]`),
				);
			}
			if (options.priority) {
				console.log(chalk.blue(`Priority: ${options.priority}`));
			}

			const context = {
				projectRoot,
				tag,
				commandName: "add-task",
				outputType: "cli",
			};

			try {
				const result = await addTask(
					taskMaster.getTasksPath(),
					dependenciesArray,
					options.priority || undefined, // Ensure undefined if not provided
					context,
					"text",
					manualTaskData,
				);

				// addTask handles detailed CLI success logging
			} catch (error) {
				console.error(chalk.red(`Error adding task: ${error.message}`));
				if (error.details) {
					console.error(chalk.red(error.details));
				}
				process.exit(1);
			}
		});

	// next command
	programInstance
		.command("next")
		.description("显示基于依赖关系和状态的下一个可处理任务")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			const initOptions = {
				tasksPath: options.file || true,
				tag: options.tag,
			};

			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const tag = taskMaster.getCurrentTag();

			const context = {
				projectRoot: taskMaster.getProjectRoot(),
				tag,
			};

			// Show current tag context
			displayCurrentTagIndicator(tag);

			await displayNextTask(
				taskMaster.getTasksPath(),
				taskMaster.getComplexityReportPath(),
				context,
			);
		});

	// show command
	programInstance
		.command("show")
		.description("显示一个或多个任务的详细信息")
		.argument("[id]", "要显示的任务ID，支持逗号分隔多个")
		.option("-i, --id <id>", "要显示的任务ID，支持逗号分隔多个")
		.option("-s, --status <status>", "按状态过滤子任务")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (taskId, options) => {
			// Initialize TaskMaster
			const initOptions = {
				tasksPath: options.file || true,
				tag: options.tag,
			};
			const taskMaster = initTaskMaster(initOptions);

			const idArg = taskId || options.id;
			const statusFilter = options.status;
			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			if (!idArg) {
				console.error(chalk.red("Error: Please provide a task ID"));
				process.exit(1);
			}

			// Check if multiple IDs are provided (comma-separated)
			const taskIds = idArg
				.split(",")
				.map((id) => id.trim())
				.filter((id) => id.length > 0);

			if (taskIds.length > 1) {
				// Multiple tasks - use compact summary view with interactive drill-down
				await displayMultipleTasksSummary(
					taskMaster.getTasksPath(),
					taskIds,
					taskMaster.getComplexityReportPath(),
					statusFilter,
					{ projectRoot: taskMaster.getProjectRoot(), tag },
				);
			} else {
				// Single task - use detailed view
				await displayTaskById(
					taskMaster.getTasksPath(),
					taskIds[0],
					taskMaster.getComplexityReportPath(),
					statusFilter,
					{ projectRoot: taskMaster.getProjectRoot(), tag },
				);
			}
		});

	// add-dependency command
	programInstance
		.command("add-dependency")
		.description("为任务添加依赖关系")
		.option("-i, --id <id>", "要添加依赖关系的目标任务ID")
		.option("-d, --depends-on <id>", "将成为依赖项的任务ID")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			const initOptions = {
				tasksPath: options.file || true,
				tag: options.tag,
			};

			// Initialize TaskMaster
			const taskMaster = initTaskMaster(initOptions);

			const taskId = options.id;
			const dependencyId = options.dependsOn;

			// Resolve tag using standard pattern
			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			if (!taskId || !dependencyId) {
				console.error(
					chalk.red("Error: Both --id and --depends-on are required"),
				);
				process.exit(1);
			}

			// Handle subtask IDs correctly by preserving the string format for IDs containing dots
			// Only use parseInt for simple numeric IDs
			const formattedTaskId = taskId.includes(".")
				? taskId
				: Number.parseInt(taskId, 10);
			const formattedDependencyId = dependencyId.includes(".")
				? dependencyId
				: Number.parseInt(dependencyId, 10);

			await addDependency(
				taskMaster.getTasksPath(),
				formattedTaskId,
				formattedDependencyId,
				{
					projectRoot: taskMaster.getProjectRoot(),
					tag,
				},
			);
		});

	// remove-dependency command
	programInstance
		.command("remove-dependency")
		.description("从任务中移除依赖关系")
		.option("-i, --id <id>", "要移除依赖关系的目标任务ID")
		.option("-d, --depends-on <id>", "要移除为依赖项的任务ID")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			const initOptions = {
				tasksPath: options.file || true,
				tag: options.tag,
			};

			// Initialize TaskMaster
			const taskMaster = initTaskMaster(initOptions);

			const taskId = options.id;
			const dependencyId = options.dependsOn;

			// Resolve tag using standard pattern
			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			if (!taskId || !dependencyId) {
				console.error(
					chalk.red("Error: Both --id and --depends-on are required"),
				);
				process.exit(1);
			}

			// Handle subtask IDs correctly by preserving the string format for IDs containing dots
			// Only use parseInt for simple numeric IDs
			const formattedTaskId = taskId.includes(".")
				? taskId
				: Number.parseInt(taskId, 10);
			const formattedDependencyId = dependencyId.includes(".")
				? dependencyId
				: Number.parseInt(dependencyId, 10);

			await removeDependency(
				taskMaster.getTasksPath(),
				formattedTaskId,
				formattedDependencyId,
				{
					projectRoot: taskMaster.getProjectRoot(),
					tag,
				},
			);
		});

	// validate-dependencies command
	programInstance
		.command("validate-dependencies")
		.description("识别无效的依赖关系但不进行修复")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			const initOptions = {
				tasksPath: options.file || true,
				tag: options.tag,
			};

			// Initialize TaskMaster
			const taskMaster = initTaskMaster(initOptions);

			// Resolve tag using standard pattern
			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			await validateDependenciesCommand(taskMaster.getTasksPath(), {
				context: { projectRoot: taskMaster.getProjectRoot(), tag },
			});
		});

	// fix-dependencies command
	programInstance
		.command("fix-dependencies")
		.description("自动修复无效的依赖关系")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			const initOptions = {
				tasksPath: options.file || true,
				tag: options.tag,
			};

			// Initialize TaskMaster
			const taskMaster = initTaskMaster(initOptions);

			// Resolve tag using standard pattern
			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			await fixDependenciesCommand(taskMaster.getTasksPath(), {
				context: { projectRoot: taskMaster.getProjectRoot(), tag },
			});
		});

	// update-task command
	programInstance
		.command("update-task")
		.description("通过ID更新单个特定任务的手动字段更改")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-i, --id <id>", "要更新的任务ID（必需）")
		.option("-t, --title <text>", "更新任务标题")
		.option("-d, --description <text>", "更新任务描述，支持--append增量更新")
		.option(
			"-s, --status <status>",
			"更新任务状态（pending, in-progress, done）",
		)
		.option("-p, --priority <priority>", "更新任务优先级（high, medium, low）")
		.option("--details <text>", "更新任务实现细节，支持--append增量更新")
		.option("--test-strategy <text>", "更新任务测试策略，支持--append增量更新")
		.option("--dependencies <ids>", "更新任务依赖关系，用逗号分隔的ID列表")
		.option("--spec-files <files>", "更新任务规范文档文件路径，用逗号分隔")
		.option("--logs <text>", "添加任务日志，支持--append增量更新")
		.option("--append", "追加到描述/细节/测试策略/日志字段而不是替换")
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
					tag: options.tag,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Resolve tag using standard pattern
				const tag = taskMaster.getCurrentTag();

				// Show current tag context
				displayCurrentTagIndicator(tag);

				// Validate required parameters
				if (!options.id) {
					console.error(chalk.red("Error: --id parameter is required"));
					console.log(
						chalk.yellow(
							'Usage example: task-master update-task --id=23 --title="New title"',
						),
					);
					process.exit(1);
				}

				// Parse the task ID and validate it's a number
				const taskId = Number.parseInt(options.id, 10);
				if (Number.isNaN(taskId) || taskId <= 0) {
					console.error(
						chalk.red(
							`Error: Invalid task ID: ${options.id}. Task ID must be a positive integer.`,
						),
					);
					console.log(
						chalk.yellow(
							'Usage example: task-master update-task --id=23 --title="New title"',
						),
					);
					process.exit(1);
				}

				// Prepare update data with append mode support
				const updateData = {
					fieldsToUpdate: {
						title: options.title,
						description: options.description,
						status: options.status,
						priority: options.priority,
						details: options.details,
						testStrategy: options.testStrategy,
						dependencies: options.dependencies
							? options.dependencies.split(",").map((id) => id.trim())
							: undefined,
						spec_files: options.specFiles
							? options.specFiles.split(",").map((f) => {
									const trimmed = f.trim();
									return {
										type: "spec",
										title: trimmed.split("/").pop() || "Specification Document",
										file: trimmed,
									};
								})
							: undefined,
						logs: options.logs,
					},
					appendMode: options.append || false,
				};

				const hasUpdates = Object.values(updateData.fieldsToUpdate).some(
					(value) => value !== undefined,
				);
				if (!hasUpdates) {
					console.error(
						chalk.red("Error: At least one field to update must be provided."),
					);
					console.log(
						chalk.yellow(
							'Usage example: task-master update-task --id=23 --title="New title" --status="in-progress"',
						),
					);
					console.log(
						chalk.yellow(
							'For incremental updates: task-master update-task --id=23 --description="Additional info" --append',
						),
					);
					process.exit(1);
				}

				// Validate status if provided
				if (options.status && !isValidTaskStatus(options.status)) {
					console.error(
						chalk.red(
							`Error: Invalid status: ${options.status}. Valid statuses are: ${TASK_STATUS_OPTIONS.join(", ")}`,
						),
					);
					process.exit(1);
				}

				// Validate priority if provided
				if (
					options.priority &&
					!["high", "medium", "low"].includes(options.priority)
				) {
					console.error(
						chalk.red(
							`Error: Invalid priority: ${options.priority}. Valid priorities are: high, medium, low`,
						),
					);
					process.exit(1);
				}

				console.log(chalk.blue(`Updating task ${taskId}...`));
				if (updateData.appendMode) {
					console.log(chalk.blue("Using incremental update mode (--append)"));
				}

				// Import and call the manual update function
				const { updateTaskManually } = await import(
					"./task-manager/update-task-manually.js"
				);
				const result = await updateTaskManually(
					tasksPath,
					taskId,
					updateData.fieldsToUpdate,
					{
						projectRoot: taskMaster.getProjectRoot(),
						tag,
						appendMode: updateData.appendMode,
					},
				);

				if (result.success) {
					console.log(chalk.green(`✓ Task ${taskId} updated successfully`));
					if (result.updatedFields && result.updatedFields.length > 0) {
						console.log(
							chalk.blue(`Updated fields: ${result.updatedFields.join(", ")}`),
						);
					}
				} else {
					console.error(
						chalk.red(
							`Error updating task: ${result.error?.message || "Unknown error"}`,
						),
					);
					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red(`Error: ${error.message}`));
				process.exit(1);
			}
		});

	// update-subtask command
	programInstance
		.command("update-subtask")
		.description("通过ID更新特定子任务的手动字段更改")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-i, --id <id>", '子任务ID，格式为"parentId.subtaskId"（必需）')
		.option("-t, --title <text>", "更新子任务标题")
		.option("-d, --description <text>", "更新子任务描述，支持--append增量更新")
		.option(
			"-s, --status <status>",
			"更新子任务状态（pending, in-progress, done）",
		)
		.option(
			"-p, --priority <priority>",
			"更新子任务优先级（high, medium, low）",
		)
		.option("--details <text>", "更新子任务实现细节，支持--append增量更新")
		.option(
			"--test-strategy <text>",
			"更新子任务测试策略，支持--append增量更新",
		)
		.option("--dependencies <ids>", "更新子任务依赖关系，用逗号分隔的ID列表")
		.option(
			"--spec-files <files>",
			"更新子任务规范文档文件路径，用逗号分隔（可选，可设置为空）",
		)
		.option("--logs <text>", "添加子任务日志，支持--append增量更新")
		.option("--append", "追加到描述/细节/测试策略/日志字段而不是替换")
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
					tag: options.tag,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Resolve tag using standard pattern
				const tag = taskMaster.getCurrentTag();

				// Show current tag context
				displayCurrentTagIndicator(tag);

				// Validate required parameters
				if (!options.id) {
					console.error(chalk.red("Error: --id parameter is required"));
					console.log(
						chalk.yellow(
							'Usage example: task-master update-subtask --id=5.2 --title="New subtask title"',
						),
					);
					process.exit(1);
				}

				// Parse the subtask ID
				if (!options.id.includes(".")) {
					console.error(
						chalk.red(
							`Error: Subtask ID must be in format "parentId.subtaskId", got: ${options.id}`,
						),
					);
					console.log(
						chalk.yellow(
							'Usage example: task-master update-subtask --id=5.2 --title="New subtask title"',
						),
					);
					process.exit(1);
				}

				const [parentIdStr, subtaskIdStr] = options.id.split(".");
				const parentId = Number.parseInt(parentIdStr, 10);
				const subtaskId = Number.parseInt(subtaskIdStr, 10);

				if (
					Number.isNaN(parentId) ||
					Number.isNaN(subtaskId) ||
					parentId <= 0 ||
					subtaskId <= 0
				) {
					console.error(
						chalk.red(
							`Error: Invalid subtask ID: ${options.id}. Must be in format "parentId.subtaskId" with positive integers.`,
						),
					);
					console.log(
						chalk.yellow(
							'Usage example: task-master update-subtask --id=5.2 --title="New subtask title"',
						),
					);
					process.exit(1);
				}

				// Prepare update data with append mode support
				const updateData = {
					fieldsToUpdate: {
						title: options.title,
						description: options.description,
						status: options.status,
						priority: options.priority,
						details: options.details,
						testStrategy: options.testStrategy,
						dependencies: options.dependencies
							? options.dependencies.split(",").map((id) => id.trim())
							: undefined,
						spec_files: options.specFiles
							? options.specFiles.split(",").map((f) => {
									const trimmed = f.trim();
									return {
										type: "spec",
										title: trimmed.split("/").pop() || "Specification Document",
										file: trimmed,
									};
								})
							: undefined,
						logs: options.logs,
					},
					appendMode: options.append || false,
				};

				const hasUpdates = Object.values(updateData.fieldsToUpdate).some(
					(value) => value !== undefined,
				);
				if (!hasUpdates) {
					console.error(
						chalk.red("Error: At least one field to update must be provided."),
					);
					console.log(
						chalk.yellow(
							'Usage example: task-master update-subtask --id=5.2 --title="New title" --status="in-progress"',
						),
					);
					console.log(
						chalk.yellow(
							'For incremental updates: task-master update-subtask --id=5.2 --description="Additional info" --append',
						),
					);
					process.exit(1);
				}

				// Validate status if provided
				if (options.status && !isValidTaskStatus(options.status)) {
					console.error(
						chalk.red(
							`Error: Invalid status: ${options.status}. Valid statuses are: ${TASK_STATUS_OPTIONS.join(", ")}`,
						),
					);
					process.exit(1);
				}

				console.log(chalk.blue(`Updating subtask ${options.id}...`));
				if (updateData.appendMode) {
					console.log(chalk.blue("Using incremental update mode (--append)"));
				}

				// Import and call the manual update function
				const { updateSubtaskManually } = await import(
					"./task-manager/update-subtask-manually.js"
				);
				const result = await updateSubtaskManually(
					tasksPath,
					parentId,
					subtaskId,
					updateData.fieldsToUpdate,
					{
						projectRoot: taskMaster.getProjectRoot(),
						tag,
						appendMode: updateData.appendMode,
					},
				);

				if (result.success) {
					console.log(
						chalk.green(`✓ Subtask ${options.id} updated successfully`),
					);
					if (result.updatedFields && result.updatedFields.length > 0) {
						console.log(
							chalk.blue(`Updated fields: ${result.updatedFields.join(", ")}`),
						);
					}
				} else {
					console.error(
						chalk.red(
							`Error updating subtask: ${result.error?.message || "Unknown error"}`,
						),
					);
					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red(`Error: ${error.message}`));
				process.exit(1);
			}
		});

	// add-subtask command
	programInstance
		.command("add-subtask")
		.description("为现有任务添加子任务")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-p, --parent <id>", "父任务ID（必需）")
		.option("-i, --task-id <id>", "要转换为子任务的现有任务ID")
		.option("-t, --title <title>", "新子任务的标题")
		.option("-d, --description <text>", "新子任务的描述")
		.option("--details <text>", "新子任务的实现细节")
		.option("--dependencies <ids>", "新子任务的依赖ID列表，用逗号分隔")
		.option("-s, --status <status>", "新子任务的状态", "pending")
		.option("--priority <priority>", "新子任务的优先级（high, medium, low）")
		.option("--test-strategy <text>", "新子任务的测试策略")
		.option(
			"--spec-files <files>",
			"新子任务的规范文档文件路径，用逗号分隔（可选）",
		)
		.option("--logs <text>", "新子任务的日志信息")
		.option(
			"--inherit-parent",
			"继承父任务的优先级和测试策略（不包含规范文档）",
		)
		.option("--generate", "添加子任务后重新生成任务文件")
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const parentId = options.parent;
			const existingTaskId = options.taskId;
			const generateFiles = options.generate || false;

			// Resolve tag using standard pattern
			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			if (!parentId) {
				console.error(
					chalk.red(
						"Error: --parent parameter is required. Please provide a parent task ID.",
					),
				);
				showAddSubtaskHelp();
				process.exit(1);
			}

			// Parse dependencies if provided
			let dependencies = [];
			if (options.dependencies) {
				dependencies = options.dependencies.split(",").map((id) => {
					// Handle both regular IDs and dot notation
					return id.includes(".") ? id.trim() : Number.parseInt(id.trim(), 10);
				});
			}

			try {
				if (existingTaskId) {
					// Convert existing task to subtask
					console.log(
						chalk.blue(
							`Converting task ${existingTaskId} to a subtask of ${parentId}...`,
						),
					);
					await addSubtask(
						taskMaster.getTasksPath(),
						parentId,
						existingTaskId,
						null,
						generateFiles,
						{ projectRoot: taskMaster.getProjectRoot(), tag },
					);
					console.log(
						chalk.green(
							`✓ Task ${existingTaskId} successfully converted to a subtask of task ${parentId}`,
						),
					);
				} else if (options.title) {
					// Create new subtask with provided data
					console.log(
						chalk.blue(`Creating new subtask for parent task ${parentId}...`),
					);

					// Prepare subtask data (no inheritance for spec_files)
					const subtaskData = {
						title: options.title,
						description: options.description || "",
						details: options.details || "",
						status: options.status || "pending",
						dependencies: dependencies,
						priority: options.priority,
						testStrategy: options.testStrategy,
						spec_files: options.specFiles
							? options.specFiles.split(",").map((f) => {
									const trimmed = f.trim();
									return {
										type: "spec",
										title: trimmed.split("/").pop() || "Specification Document",
										file: trimmed,
									};
								})
							: [], // Use provided spec_files or empty array (no inheritance)
						logs: options.logs || "",
					};

					// Inherit from parent task for other fields if requested (excluding spec_files)
					if (options.inheritParent) {
						console.log(chalk.blue("Inheriting fields from parent task..."));
						try {
							const data = readJSON(
								taskMaster.getTasksPath(),
								taskMaster.getProjectRoot(),
								tag,
							);
							const parentTask = data.tasks.find((t) => t.id === parentId);
							if (parentTask) {
								// Inherit fields if not explicitly provided (excluding spec_files)
								if (!subtaskData.priority && parentTask.priority) {
									subtaskData.priority = parentTask.priority;
									console.log(
										chalk.gray(`  Inherited priority: ${parentTask.priority}`),
									);
								}
								if (!subtaskData.testStrategy && parentTask.testStrategy) {
									subtaskData.testStrategy = parentTask.testStrategy;
									console.log(
										chalk.gray(
											`  Inherited test strategy: ${parentTask.testStrategy.substring(0, 50)}...`,
										),
									);
								}
								// Note: spec_files inheritance removed - subtasks are independent
							}
						} catch (error) {
							console.warn(
								chalk.yellow(
									`Warning: Could not inherit from parent task: ${error.message}`,
								),
							);
						}
					}

					const newSubtaskData = subtaskData;

					const subtask = await addSubtask(
						taskMaster.getTasksPath(),
						parentId,
						null,
						newSubtaskData,
						generateFiles,
						{ projectRoot: taskMaster.getProjectRoot(), tag },
					);
					console.log(
						chalk.green(
							`✓ New subtask ${parentId}.${subtask.id} successfully created`,
						),
					);

					// Display success message and suggested next steps
					console.log(
						boxen(
							`${chalk.white.bold(`子任务 ${parentId}.${subtask.id} 添加成功`)}\n\n${chalk.white(`标题: ${subtask.title}`)}\n${chalk.white(`状态: ${getStatusWithColor(subtask.status)}`)}\n${
								dependencies.length > 0
									? `${chalk.white(`依赖关系: ${dependencies.join(", ")}`)}\n`
									: ""
							}\n${chalk.white.bold("下一步操作:")}\n${chalk.cyan(
								`1. 查看父任务详情: ${chalk.yellow(`task-master show ${parentId}`)}`,
							)}\n${chalk.cyan(
								`2. 开始处理子任务: ${chalk.yellow(`task-master set-status --id=${parentId}.${subtask.id} --status=in-progress`)}`,
							)}\n${chalk.cyan(
								`3. 查看所有任务: ${chalk.yellow("task-master list --with-subtasks")}`,
							)}`,
							{
								padding: 1,
								borderColor: "green",
								borderStyle: "round",
								margin: { top: 1 },
							},
						),
					);
				} else {
					console.error(
						chalk.red("Error: Either --task-id or --title must be provided."),
					);
					console.log(
						boxen(
							`${chalk.white.bold("Usage Examples:")}\n\n${chalk.white("Convert existing task to subtask:")}\n${chalk.yellow(
								"  task-master add-subtask --parent=5 --task-id=8",
							)}\n\n${chalk.white("Create new subtask:")}\n${chalk.yellow(
								`  task-master add-subtask --parent=5 --title="Implement login UI" --description="Create the login form"`,
							)}\n\n`,
							{ padding: 1, borderColor: "blue", borderStyle: "round" },
						),
					);
					process.exit(1);
				}
			} catch (error) {
				console.error(chalk.red(`Error: ${error.message}`));
				showAddSubtaskHelp();
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			showAddSubtaskHelp();
			process.exit(1);
		});

	// Helper function to show add-subtask command help
	function showAddSubtaskHelp() {
		console.log(
			boxen(
				`${chalk.white.bold("Add Subtask Command Help")}\n\n${chalk.cyan("Usage:")}\n  task-master add-subtask --parent=<id> [options]\n\n${chalk.cyan("Options:")}\n  -p, --parent <id>         Parent task ID (required)\n  -i, --task-id <id>        Existing task ID to convert to subtask\n  -t, --title <title>       Title for the new subtask\n  -d, --description <text>  Description for the new subtask\n  --details <text>          Implementation details for the new subtask\n  --dependencies <ids>      Comma-separated list of dependency IDs\n  -s, --status <status>     Status for the new subtask (default: "pending")\n  -f, --file <file>         Path to the tasks file (default: "${TASKMASTER_TASKS_FILE}")\n  --generate                Regenerate task files after adding subtask\n\n${chalk.cyan("Examples:")}\n  task-master add-subtask --parent=5 --task-id=8\n  task-master add-subtask -p 5 -t "Implement login UI" -d "Create the login form" --generate`,
				{ padding: 1, borderColor: "blue", borderStyle: "round" },
			),
		);
	}

	// remove-subtask command
	programInstance
		.command("remove-subtask")
		.description("从父任务中移除子任务")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option(
			"-i, --id <id>",
			'要移除的子任务ID，格式为"parentId.subtaskId"，支持逗号分隔多个',
		)
		.option("-c, --convert", "将子任务转换为独立任务而不是删除")
		.option("--generate", "移除子任务后重新生成任务文件")
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const subtaskIds = options.id;
			const convertToTask = options.convert || false;
			const generateFiles = options.generate || false;
			const tag = taskMaster.getCurrentTag();

			if (!subtaskIds) {
				console.error(
					chalk.red(
						'Error: --id parameter is required. Please provide subtask ID(s) in format "parentId.subtaskId".',
					),
				);
				showRemoveSubtaskHelp();
				process.exit(1);
			}

			try {
				// Split by comma to support multiple subtask IDs
				const subtaskIdArray = subtaskIds.split(",").map((id) => id.trim());

				for (const subtaskId of subtaskIdArray) {
					// Validate subtask ID format
					if (!subtaskId.includes(".")) {
						console.error(
							chalk.red(
								`Error: Subtask ID "${subtaskId}" must be in format "parentId.subtaskId"`,
							),
						);
						showRemoveSubtaskHelp();
						process.exit(1);
					}

					console.log(chalk.blue(`Removing subtask ${subtaskId}...`));
					if (convertToTask) {
						console.log(
							chalk.blue("The subtask will be converted to a standalone task"),
						);
					}

					const result = await removeSubtask(
						taskMaster.getTasksPath(),
						subtaskId,
						convertToTask,
						generateFiles,
						{ projectRoot: taskMaster.getProjectRoot(), tag },
					);

					if (convertToTask && result) {
						// Display success message and next steps for converted task
						console.log(
							boxen(
								`${chalk.white.bold(
									`子任务 ${subtaskId} 已转换为独立任务 #${result.id}`,
								)}\n\n${chalk.white(`标题: ${result.title}`)}\n${chalk.white(`状态: ${getStatusWithColor(result.status)}`)}\n${chalk.white(`依赖关系: ${result.dependencies.join(", ")}`)}\n\n${chalk.white.bold("下一步操作:")}\n${chalk.cyan(
									`1. 查看新任务详情: ${chalk.yellow(`task-master show ${result.id}`)}`,
								)}\n${chalk.cyan(
									`2. 开始处理任务: ${chalk.yellow(`task-master set-status --id=${result.id} --status=in-progress`)}`,
								)}\n${chalk.cyan(
									`3. 查看任务列表: ${chalk.yellow("task-master list")}`,
								)}`,
								{
									padding: 1,
									borderColor: "green",
									borderStyle: "round",
									margin: { top: 1 },
								},
							),
						);
					} else {
						// Display success message for deleted subtask
						console.log(
							boxen(
								`${chalk.white.bold(`子任务 ${subtaskId} 已删除`)}\n\n${chalk.white("子任务已被成功删除。")}\n\n${chalk.white.bold("下一步操作:")}\n${chalk.cyan(
									`1. 查看父任务: ${chalk.yellow(`task-master show ${parentId}`)}`,
								)}\n${chalk.cyan(
									`2. 查看所有任务: ${chalk.yellow("task-master list --with-subtasks")}`,
								)}`,
								{
									padding: 1,
									borderColor: "green",
									borderStyle: "round",
									margin: { top: 1 },
								},
							),
						);
					}
				}
			} catch (error) {
				console.error(chalk.red(`Error: ${error.message}`));
				showRemoveSubtaskHelp();
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			showRemoveSubtaskHelp();
			process.exit(1);
		});

	// Helper function to show remove-subtask command help
	function showRemoveSubtaskHelp() {
		console.log(
			boxen(
				`${chalk.white.bold("Remove Subtask Command Help")}\n\n${chalk.cyan("Usage:")}\n  task-master remove-subtask --id=<parentId.subtaskId> [options]\n\n${chalk.cyan("Options:")}\n  -i, --id <id>       Subtask ID(s) to remove in format "parentId.subtaskId" (can be comma-separated, required)\n  -c, --convert       Convert the subtask to a standalone task instead of deleting it\n  -f, --file <file>   Path to the tasks file (default: "${TASKMASTER_TASKS_FILE}")\n  --skip-generate     Skip regenerating task files\n\n${chalk.cyan("Examples:")}\n  task-master remove-subtask --id=5.2\n  task-master remove-subtask --id=5.2,6.3,7.1\n  task-master remove-subtask --id=5.2 --convert`,
				{ padding: 1, borderColor: "blue", borderStyle: "round" },
			),
		);
	}

	// Helper function to show tags command help
	function showTagsHelp() {
		console.log(
			boxen(
				`${chalk.white.bold("Tags Command Help")}\n\n${chalk.cyan("Usage:")}\n  task-master tags [options]\n\n${chalk.cyan("Options:")}\n  -f, --file <file>   Path to the tasks file (default: "${TASKMASTER_TASKS_FILE}")\n  --show-metadata     Show detailed metadata for each tag\n\n${chalk.cyan("Examples:")}\n  task-master tags\n  task-master tags --show-metadata\n\n${chalk.cyan("Related Commands:")}\n  task-master add-tag <name>      Create a new tag\n  task-master use-tag <name>      Switch to a tag\n  task-master delete-tag <name>   Delete a tag`,
				{ padding: 1, borderColor: "blue", borderStyle: "round" },
			),
		);
	}

	// Helper function to show add-tag command help
	function showAddTagHelp() {
		console.log(
			boxen(
				`${chalk.white.bold("Add Tag Command Help")}\n\n${chalk.cyan("Usage:")}\n  task-master add-tag <tagName> [options]\n\n${chalk.cyan("Options:")}\n  -f, --file <file>        Path to the tasks file (default: "${TASKMASTER_TASKS_FILE}")\n  --copy-from-current      Copy tasks from the current tag to the new tag\n  --copy-from <tag>        Copy tasks from the specified tag to the new tag\n  -d, --description <text> Optional description for the tag\n\n${chalk.cyan("Examples:")}\n  task-master add-tag feature-xyz\n  task-master add-tag feature-xyz --copy-from-current\n  task-master add-tag feature-xyz --copy-from master\n  task-master add-tag feature-xyz -d "Feature XYZ development"`,
				{ padding: 1, borderColor: "blue", borderStyle: "round" },
			),
		);
	}

	// Helper function to show delete-tag command help
	function showDeleteTagHelp() {
		console.log(
			boxen(
				`${chalk.white.bold("Delete Tag Command Help")}\n\n${chalk.cyan("Usage:")}\n  task-master delete-tag <tagName> [options]\n\n${chalk.cyan("Options:")}\n  -f, --file <file>   Path to the tasks file (default: "${TASKMASTER_TASKS_FILE}")\n  -y, --yes           Skip confirmation prompts\n\n${chalk.cyan("Examples:")}\n  task-master delete-tag feature-xyz\n  task-master delete-tag feature-xyz --yes\n\n${chalk.yellow("Warning:")}\n  This will permanently delete the tag and all its tasks!`,
				{ padding: 1, borderColor: "blue", borderStyle: "round" },
			),
		);
	}

	// Helper function to show use-tag command help
	function showUseTagHelp() {
		console.log(
			boxen(
				`${chalk.white.bold("Use Tag Command Help")}\n\n${chalk.cyan("Usage:")}\n  task-master use-tag <tagName> [options]\n\n${chalk.cyan("Options:")}\n  -f, --file <file>   Path to the tasks file (default: "${TASKMASTER_TASKS_FILE}")\n\n${chalk.cyan("Examples:")}\n  task-master use-tag feature-xyz\n  task-master use-tag master\n\n${chalk.cyan("Related Commands:")}\n  task-master tags                 List all available tags\n  task-master add-tag <name>       Create a new tag`,
				{ padding: 1, borderColor: "blue", borderStyle: "round" },
			),
		);
	}

	// remove-task command
	programInstance
		.command("remove-task")
		.description("永久删除一个或多个任务或子任务")
		.option(
			"-i, --id <ids>",
			'要删除的任务或子任务ID，支持格式如"5", "5.2"或"5,6.1,7"',
		)
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-y, --yes", "跳过确认提示", false)
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const taskIdsString = options.id;

			// Resolve tag using standard pattern
			const tag = taskMaster.getCurrentTag();

			// Show current tag context
			displayCurrentTagIndicator(tag);

			if (!taskIdsString) {
				console.error(chalk.red("Error: Task ID(s) are required"));
				console.error(
					chalk.yellow(
						"Usage: task-master remove-task --id=<taskId1,taskId2...>",
					),
				);
				process.exit(1);
			}

			const taskIdsToRemove = taskIdsString
				.split(",")
				.map((id) => id.trim())
				.filter(Boolean);

			if (taskIdsToRemove.length === 0) {
				console.error(chalk.red("Error: No valid task IDs provided."));
				process.exit(1);
			}

			try {
				// Read data once for checks and confirmation
				const data = readJSON(
					taskMaster.getTasksPath(),
					taskMaster.getProjectRoot(),
					tag,
				);
				if (!data || !data.tasks) {
					console.error(
						chalk.red(`Error: No valid tasks found in ${tasksPath}`),
					);
					process.exit(1);
				}

				const existingTasksToRemove = [];
				const nonExistentIds = [];
				let totalSubtasksToDelete = 0;
				const dependentTaskMessages = [];

				for (const taskId of taskIdsToRemove) {
					if (!taskExists(data.tasks, taskId)) {
						nonExistentIds.push(taskId);
					} else {
						// Correctly extract the task object from the result of findTaskById
						const findResult = findTaskById(data.tasks, taskId);
						const taskObject = findResult.task; // Get the actual task/subtask object

						if (taskObject) {
							existingTasksToRemove.push({ id: taskId, task: taskObject }); // Push the actual task object

							// If it's a main task, count its subtasks and check dependents
							if (!taskObject.isSubtask) {
								// Check the actual task object
								if (taskObject.subtasks && taskObject.subtasks.length > 0) {
									totalSubtasksToDelete += taskObject.subtasks.length;
								}
								const dependentTasks = data.tasks.filter((t) =>
									t.dependencies?.includes(Number.parseInt(taskId, 10)),
								);
								if (dependentTasks.length > 0) {
									dependentTaskMessages.push(
										`  - Task ${taskId}: ${dependentTasks.length} dependent tasks (${dependentTasks.map((t) => t.id).join(", ")})`,
									);
								}
							}
						} else {
							// Handle case where findTaskById returned null for the task property (should be rare)
							nonExistentIds.push(`${taskId} (error finding details)`);
						}
					}
				}

				if (nonExistentIds.length > 0) {
					console.warn(
						chalk.yellow(
							`Warning: The following task IDs were not found: ${nonExistentIds.join(", ")}`,
						),
					);
				}

				if (existingTasksToRemove.length === 0) {
					console.log(chalk.blue("No existing tasks found to remove."));
					process.exit(0);
				}

				// Skip confirmation if --yes flag is provided
				if (!options.yes) {
					console.log();
					console.log(
						chalk.red.bold(
							`⚠️ WARNING: This will permanently delete the following ${existingTasksToRemove.length} item(s):`,
						),
					);
					console.log();

					existingTasksToRemove.forEach(({ id, task }) => {
						if (!task) return; // Should not happen due to taskExists check, but safeguard
						if (task.isSubtask) {
							// Subtask - title is directly on the task object
							console.log(
								chalk.white(`  Subtask ${id}: ${task.title || "(no title)"}`),
							);
							// Optionally show parent context if available
							if (task.parentTask) {
								console.log(
									chalk.gray(
										`    (Parent: ${task.parentTask.id} - ${task.parentTask.title || "(no title)"})`,
									),
								);
							}
						} else {
							// Main task - title is directly on the task object
							console.log(
								chalk.white.bold(`  Task ${id}: ${task.title || "(no title)"}`),
							);
						}
					});

					if (totalSubtasksToDelete > 0) {
						console.log(
							chalk.yellow(
								`⚠️ This will also delete ${totalSubtasksToDelete} subtasks associated with the selected main tasks!`,
							),
						);
					}

					if (dependentTaskMessages.length > 0) {
						console.log(
							chalk.yellow(
								"⚠️ Warning: Dependencies on the following tasks will be removed:",
							),
						);
						dependentTaskMessages.forEach((msg) =>
							console.log(chalk.yellow(msg)),
						);
					}

					console.log();

					const { confirm } = await inquirer.prompt([
						{
							type: "confirm",
							name: "confirm",
							message: chalk.red.bold(
								`Are you sure you want to permanently delete these ${existingTasksToRemove.length} item(s)?`,
							),
							default: false,
						},
					]);

					if (!confirm) {
						console.log(chalk.blue("Task deletion cancelled."));
						process.exit(0);
					}
				}

				const indicator = startLoadingIndicator(
					`Removing ${existingTasksToRemove.length} task(s)/subtask(s)...`,
				);

				// Use the string of existing IDs for the core function
				const existingIdsString = existingTasksToRemove
					.map(({ id }) => id)
					.join(",");
				const result = await removeTask(
					taskMaster.getTasksPath(),
					existingIdsString,
					{
						projectRoot: taskMaster.getProjectRoot(),
						tag,
					},
				);

				stopLoadingIndicator(indicator);

				if (result.success) {
					console.log(
						boxen(
							chalk.green(
								`Successfully removed ${result.removedTasks.length} task(s)/subtask(s).`,
							) +
								(result.message ? `\n\nDetails:\n${result.message}` : "") +
								(result.error
									? `\n\nWarnings:\n${chalk.yellow(result.error)}`
									: ""),
							{ padding: 1, borderColor: "green", borderStyle: "round" },
						),
					);
				} else {
					console.error(
						boxen(
							chalk.red(
								`Operation completed with errors. Removed ${result.removedTasks.length} task(s)/subtask(s).`,
							) +
								(result.message ? `\n\nDetails:\n${result.message}` : "") +
								(result.error ? `\n\nErrors:\n${chalk.red(result.error)}` : ""),
							{
								padding: 1,
								borderColor: "red",
								borderStyle: "round",
							},
						),
					);
					process.exit(1); // Exit with error code if any part failed
				}

				// Log any initially non-existent IDs again for clarity
				if (nonExistentIds.length > 0) {
					console.warn(
						chalk.yellow(
							`Note: The following IDs were not found initially and were skipped: ${nonExistentIds.join(", ")}`,
						),
					);

					// Exit with error if any removals failed
					if (result.removedTasks.length === 0) {
						process.exit(1);
					}
				}
			} catch (error) {
				console.error(
					chalk.red(`Error: ${error.message || "An unknown error occurred"}`),
				);
				process.exit(1);
			}
		});

	// init command (Directly calls the implementation from init.js)
	programInstance
		.command("init")
		.description("初始化 Speco Tasker 项目（自动检测配置）")
		.action(async () => {
			try {
				// Use intelligent defaults - no complex configuration needed
				const options = {
					yes: false, // CLI mode allows interactive prompts for better UX
				};
				await initializeProject(options);
			} catch (error) {
				console.error(
					chalk.red(`Error during initialization: ${error.message}`),
				);
				process.exit(1);
			}
		});

	// move-task command
	programInstance
		.command("move")
		.description(
			"在标签间移动任务或重新排序。支持跨标签移动及依赖关系解析选项。",
		)
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option(
			"--from <id>",
			'要移动的任务/子任务ID，支持格式如"5"或"5.2"，可逗号分隔多个任务',
		)
		.option("--to <id>", '目标位置ID，支持格式如"7"或"7.3"，数量须与源ID匹配')
		.option("--tag <tag>", "选择要处理的任务分组")
		.option("--from-tag <tag>", "跨标签移动的源标签")
		.option("--to-tag <tag>", "跨标签移动的目标标签")
		.option("--with-dependencies", "连同主任务一起移动依赖任务")
		.option("--ignore-dependencies", "在移动时断开跨标签依赖关系")
		.action(async (options) => {
			// Helper function to show move command help - defined in scope for proper encapsulation
			function showMoveHelp() {
				console.log(
					`${chalk.white.bold("Move Command Help")}\n\n${chalk.cyan("Move tasks between tags or reorder within tags.")}\n\n${chalk.yellow.bold("Within-Tag Moves:")}\n${chalk.white("  task-master move --from=5 --to=7")}\n${chalk.white("  task-master move --from=5.2 --to=7.3")}\n${chalk.white("  task-master move --from=5,6,7 --to=10,11,12")}\n\n${chalk.yellow.bold("Cross-Tag Moves:")}\n${chalk.white(
						"  task-master move --from=5 --from-tag=backlog --to-tag=in-progress",
					)}\n${chalk.white(
						"  task-master move --from=5,6 --from-tag=backlog --to-tag=done",
					)}\n\n${chalk.yellow.bold("Dependency Resolution:")}\n${chalk.white("  # Move with dependencies")}\n${chalk.white(
						"  task-master move --from=5 --from-tag=backlog --to-tag=in-progress --with-dependencies",
					)}\n\n${chalk.white("  # Break dependencies")}\n${chalk.white(
						"  task-master move --from=5 --from-tag=backlog --to-tag=in-progress --ignore-dependencies",
					)}\n\n\n${chalk.yellow.bold("Best Practices:")}\n${chalk.white(
						"  • Use --with-dependencies to move dependent tasks together",
					)}\n${chalk.white(
						"  • Use --ignore-dependencies to break cross-tag dependencies",
					)}\n${chalk.white(
						"  • Check dependencies first: task-master validate-dependencies",
					)}\n${chalk.white(
						"  • Fix dependency issues: task-master fix-dependencies",
					)}\n\n${chalk.yellow.bold("Error Resolution:")}\n${chalk.white(
						"  • Cross-tag dependency conflicts: Use --with-dependencies or --ignore-dependencies",
					)}\n${chalk.white(
						"  • Subtask movement: Promote subtask first with remove-subtask --convert",
					)}\n${chalk.white(
						"  • Invalid tags: Check available tags with task-master tags",
					)}\n\n${chalk.gray("For more help, run: task-master move --help")}`,
				);
			}

			// Helper function to handle cross-tag move logic
			async function handleCrossTagMove(moveContext, options) {
				const { sourceId, sourceTag, toTag, taskMaster } = moveContext;

				if (!sourceId) {
					console.error(
						chalk.red(
							"Error: --from parameter is required for cross-tag moves",
						),
					);
					showMoveHelp();
					process.exit(1);
				}

				const sourceIds = sourceId.split(",").map((id) => id.trim());
				const moveOptions = {
					withDependencies: options.withDependencies || false,
					ignoreDependencies: options.ignoreDependencies || false,
				};

				console.log(
					chalk.blue(
						`Moving tasks ${sourceIds.join(", ")} from "${sourceTag}" to "${toTag}"...`,
					),
				);

				const result = await moveTasksBetweenTags(
					taskMaster.getTasksPath(),
					sourceIds,
					sourceTag,
					toTag,
					moveOptions,
					{ projectRoot: taskMaster.getProjectRoot() },
				);

				console.log(chalk.green(`✓ ${result.message}`));

				// Print any tips returned from the move operation (e.g., after ignoring dependencies)
				if (Array.isArray(result.tips) && result.tips.length > 0) {
					console.log(`\n${chalk.yellow.bold("提示:")}`);
					result.tips.forEach((t) => console.log(chalk.white(`  • ${t}`)));
				}

				// Check if source tag still contains tasks before regenerating files
				const tasksData = readJSON(
					taskMaster.getTasksPath(),
					taskMaster.getProjectRoot(),
					sourceTag,
				);
				const sourceTagHasTasks =
					tasksData &&
					Array.isArray(tasksData.tasks) &&
					tasksData.tasks.length > 0;

				// Generate task files for the affected tags
				await generateTaskFiles(
					taskMaster.getTasksPath(),
					path.dirname(taskMaster.getTasksPath()),
					{ tag: toTag, projectRoot: taskMaster.getProjectRoot() },
				);

				// Only regenerate source tag files if it still contains tasks
				if (sourceTagHasTasks) {
					await generateTaskFiles(
						taskMaster.getTasksPath(),
						path.dirname(taskMaster.getTasksPath()),
						{ tag: sourceTag, projectRoot: taskMaster.getProjectRoot() },
					);
				}
			}

			// Helper function to handle within-tag move logic
			async function handleWithinTagMove(moveContext) {
				const { sourceId, destinationId, tag, taskMaster } = moveContext;

				if (!sourceId || !destinationId) {
					console.error(
						chalk.red(
							"Error: Both --from and --to parameters are required for within-tag moves",
						),
					);
					console.log(
						chalk.yellow(
							"Usage: task-master move --from=<sourceId> --to=<destinationId>",
						),
					);
					process.exit(1);
				}

				// Check if destinationId looks like a tag name (contains letters)
				const destIdNum = Number.parseInt(destinationId, 10);
				if (Number.isNaN(destIdNum) && destinationId.match(/[a-zA-Z]/)) {
					console.error(
						chalk.red(
							"Error: --to parameter appears to be a tag name, but no --to-tag specified",
						),
					);
					console.error(
						chalk.red("For cross-tag moves, use: --to-tag=<tagName>"),
					);
					console.error(
						chalk.yellow(
							"Example: task-master move --from=108 --to-tag=test-move",
						),
					);
					process.exit(1);
				}

				// Check if we're moving multiple tasks (comma-separated IDs)
				const sourceIds = sourceId.split(",").map((id) => id.trim());
				const destinationIds = destinationId.split(",").map((id) => id.trim());

				// Validate that the number of source and destination IDs match
				if (sourceIds.length !== destinationIds.length) {
					console.error(
						chalk.red(
							"Error: The number of source and destination IDs must match",
						),
					);
					console.log(
						chalk.yellow(
							"Example: task-master move --from=5,6,7 --to=10,11,12",
						),
					);
					process.exit(1);
				}

				// If moving multiple tasks
				if (sourceIds.length > 1) {
					console.log(
						chalk.blue(
							`Moving multiple tasks: ${sourceIds.join(", ")} to ${destinationIds.join(", ")}...`,
						),
					);

					// Read tasks data once to validate destination IDs
					const tasksData = readJSON(
						taskMaster.getTasksPath(),
						taskMaster.getProjectRoot(),
						tag,
					);
					if (!tasksData || !tasksData.tasks) {
						console.error(
							chalk.red(
								`Error: Invalid or missing tasks file at ${taskMaster.getTasksPath()}`,
							),
						);
						process.exit(1);
					}

					// Collect errors during move attempts
					const moveErrors = [];
					const successfulMoves = [];

					// Move tasks one by one
					for (let i = 0; i < sourceIds.length; i++) {
						const fromId = sourceIds[i];
						const toId = destinationIds[i];

						// Skip if source and destination are the same
						if (fromId === toId) {
							console.log(
								chalk.yellow(`Skipping ${fromId} -> ${toId} (same ID)`),
							);
							continue;
						}

						console.log(
							chalk.blue(`Moving task/subtask ${fromId} to ${toId}...`),
						);
						try {
							await moveTask(
								taskMaster.getTasksPath(),
								fromId,
								toId,
								i === sourceIds.length - 1,
								{
									projectRoot: taskMaster.getProjectRoot(),
									tag,
								},
							);
							console.log(
								chalk.green(
									`✓ Successfully moved task/subtask ${fromId} to ${toId}`,
								),
							);
							successfulMoves.push({ fromId, toId });
						} catch (error) {
							const errorInfo = {
								fromId,
								toId,
								error: error.message,
							};
							moveErrors.push(errorInfo);
							console.error(
								chalk.red(
									`Error moving ${fromId} to ${toId}: ${error.message}`,
								),
							);
							// Continue with the next task rather than exiting
						}
					}

					// Display summary after all moves are attempted
					if (moveErrors.length > 0) {
						console.log(chalk.yellow("\n--- Move Operation Summary ---"));
						console.log(
							chalk.green(
								`✓ Successfully moved: ${successfulMoves.length} tasks`,
							),
						);
						console.log(
							chalk.red(`✗ Failed to move: ${moveErrors.length} tasks`),
						);

						if (successfulMoves.length > 0) {
							console.log(chalk.cyan("\nSuccessful moves:"));
							successfulMoves.forEach(({ fromId, toId }) => {
								console.log(chalk.cyan(`  ${fromId} → ${toId}`));
							});
						}

						console.log(chalk.red("\nFailed moves:"));
						moveErrors.forEach(({ fromId, toId, error }) => {
							console.log(chalk.red(`  ${fromId} → ${toId}: ${error}`));
						});

						console.log(
							chalk.yellow(
								"\nNote: Some tasks were moved successfully. Check the errors above for failed moves.",
							),
						);
					} else {
						console.log(chalk.green("\n✓ All tasks moved successfully!"));
					}
				} else {
					// Moving a single task (existing logic)
					console.log(
						chalk.blue(
							`Moving task/subtask ${sourceId} to ${destinationId}...`,
						),
					);

					const result = await moveTask(
						taskMaster.getTasksPath(),
						sourceId,
						destinationId,
						true,
						{
							projectRoot: taskMaster.getProjectRoot(),
							tag,
						},
					);
					console.log(
						chalk.green(
							`✓ Successfully moved task/subtask ${sourceId} to ${destinationId}`,
						),
					);
				}
			}

			// Helper function to handle move errors
			function handleMoveError(error, moveContext) {
				console.error(chalk.red(`Error: ${error.message}`));

				// Enhanced error handling with structured error objects
				if (error.code === "CROSS_TAG_DEPENDENCY_CONFLICTS") {
					// Use structured error data
					const conflicts = error.data.conflicts || [];
					const taskIds = error.data.taskIds || [];
					displayCrossTagDependencyError(
						conflicts,
						moveContext.sourceTag,
						moveContext.toTag,
						taskIds.join(", "),
					);
				} else if (error.code === "CANNOT_MOVE_SUBTASK") {
					// Use structured error data
					const taskId =
						error.data.taskId || moveContext.sourceId?.split(",")[0];
					displaySubtaskMoveError(
						taskId,
						moveContext.sourceTag,
						moveContext.toTag,
					);
				} else if (
					error.code === "SOURCE_TARGET_TAGS_SAME" ||
					error.code === "SAME_SOURCE_TARGET_TAG"
				) {
					displayInvalidTagCombinationError(
						moveContext.sourceTag,
						moveContext.toTag,
						"Source and target tags are identical",
					);
				} else {
					// General error - show dependency validation hints
					displayDependencyValidationHints("after-error");
				}

				process.exit(1);
			}

			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const sourceId = options.from;
			const destinationId = options.to;
			const fromTag = options.fromTag;
			const toTag = options.toTag;

			const tag = taskMaster.getCurrentTag();

			// Get the source tag - fallback to current tag if not provided
			const sourceTag = fromTag || taskMaster.getCurrentTag();

			// Check if this is a cross-tag move (different tags)
			const isCrossTagMove = sourceTag && toTag && sourceTag !== toTag;

			// Initialize move context with all relevant data
			const moveContext = {
				sourceId,
				destinationId,
				sourceTag,
				toTag,
				tag,
				taskMaster,
			};

			try {
				if (isCrossTagMove) {
					// Cross-tag move logic
					await handleCrossTagMove(moveContext, options);
				} else {
					// Within-tag move logic
					await handleWithinTagMove(moveContext);
				}
			} catch (error) {
				const errMsg = String(error && (error.message || error));
				if (errMsg.includes("already exists in target tag")) {
					console.error(chalk.red(`Error: ${errMsg}`));
					console.log(
						`\n${chalk.yellow.bold("Conflict: ID already exists in target tag")}\n${chalk.white(
							"  • Choose a different target tag without conflicting IDs",
						)}\n${chalk.white(
							"  • Move a different set of IDs (avoid existing ones)",
						)}\n${chalk.white(
							"  • If needed, move within-tag to a new ID first, then cross-tag move",
						)}`,
					);
					process.exit(1);
				}
				handleMoveError(error, moveContext);
			}
		});

	programInstance
		.command("migrate")
		.description("迁移现有项目以使用新的.taskmaster目录结构")
		.option("-f, --force", "强制迁移，即使.taskmaster目录已存在")
		.option("--backup", "迁移前创建旧文件的备份（默认：false）", false)
		.option("--cleanup", "成功迁移后删除旧文件（默认：true）", true)
		.option("-y, --yes", "跳过确认提示")
		.option("--dry-run", "显示将要迁移的内容但不实际移动文件")
		.action(async (options) => {
			try {
				await migrateProject(options);
			} catch (error) {
				console.error(chalk.red("Error during migration:"), error.message);
				process.exit(1);
			}
		});

	// sync-readme command
	programInstance
		.command("sync-readme")
		.description("将当前任务列表同步到项目根目录的README.md文件")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--with-subtasks", "在README输出中包含子任务")
		.option("-s, --status <status>", "仅显示匹配此状态的任务，如pending, done")
		.option("-t, --tag <tag>", "用于任务列表的标签（默认：master）")
		.action(async (options) => {
			// Initialize TaskMaster
			const taskMaster = initTaskMaster({
				tasksPath: options.file || true,
				tag: options.tag,
			});

			const withSubtasks = options.withSubtasks || false;
			const status = options.status || null;

			const tag = taskMaster.getCurrentTag();

			console.log(
				chalk.blue(
					`📝 Syncing tasks to README.md${withSubtasks ? " (with subtasks)" : ""}${status ? ` (status: ${status})` : ""}...`,
				),
			);

			const success = await syncTasksToReadme(taskMaster.getProjectRoot(), {
				withSubtasks,
				status,
				tasksPath: taskMaster.getTasksPath(),
				tag,
			});

			if (!success) {
				console.error(chalk.red("❌ Failed to sync tasks to README.md"));
				process.exit(1);
			}
		});

	// ===== TAG MANAGEMENT COMMANDS =====

	// add-tag command
	programInstance
		.command("add-tag")
		.description("创建新的标签上下文来组织任务")
		.argument("[tagName]", "新标签的名称，使用--from-branch时可选")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--copy-from-current", "从当前标签复制任务到新标签")
		.option("--copy-from <tag>", "从指定标签复制任务到新标签")
		.option("--from-branch", "从当前git分支创建标签名称，忽略tagName参数")
		.option("-d, --description <text>", "标签的可选描述")
		.action(async (tagName, options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Validate tasks file exists
				if (!fs.existsSync(tasksPath)) {
					console.error(
						chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
					);
					console.log(
						chalk.yellow(
							"Hint: Run task-master init to create tasks.json first",
						),
					);
					process.exit(1);
				}

				// Validate that either tagName is provided or --from-branch is used
				if (!tagName && !options.fromBranch) {
					console.error(
						chalk.red(
							"Error: Either tagName argument or --from-branch option is required.",
						),
					);
					console.log(chalk.yellow("Usage examples:"));
					console.log(chalk.cyan("  task-master add-tag my-tag"));
					console.log(chalk.cyan("  task-master add-tag --from-branch"));
					process.exit(1);
				}

				const context = {
					projectRoot: taskMaster.getProjectRoot(),
					commandName: "add-tag",
					outputType: "cli",
				};

				// Handle --from-branch option
				if (options.fromBranch) {
					const { createTagFromBranch } = await import(
						"./task-manager/tag-management.js"
					);
					const gitUtils = await import("./utils/git-utils.js");

					// Check if we're in a git repository
					if (!(await gitUtils.isGitRepository(context.projectRoot))) {
						console.error(
							chalk.red(
								"Error: Not in a git repository. Cannot use --from-branch option.",
							),
						);
						process.exit(1);
					}

					// Get current git branch
					const currentBranch = await gitUtils.getCurrentBranch(
						context.projectRoot,
					);
					if (!currentBranch) {
						console.error(
							chalk.red("Error: Could not determine current git branch."),
						);
						process.exit(1);
					}

					// Create tag from branch
					const branchOptions = {
						copyFromCurrent: options.copyFromCurrent || false,
						copyFromTag: options.copyFrom,
						description:
							options.description ||
							`Tag created from git branch "${currentBranch}"`,
					};

					await createTagFromBranch(
						taskMaster.getTasksPath(),
						currentBranch,
						branchOptions,
						context,
						"text",
					);
				} else {
					// Regular tag creation
					const createOptions = {
						copyFromCurrent: options.copyFromCurrent || false,
						copyFromTag: options.copyFrom,
						description: options.description,
					};

					await createTag(
						taskMaster.getTasksPath(),
						tagName,
						createOptions,
						context,
						"text",
					);
				}

				// Handle auto-switch if requested
				if (options.autoSwitch) {
					const { useTag } = await import("./task-manager/tag-management.js");
					const finalTagName = options.fromBranch
						? (await import("./utils/git-utils.js")).sanitizeBranchNameForTag(
								await (await import("./utils/git-utils.js")).getCurrentBranch(
									projectRoot,
								),
							)
						: tagName;
					await useTag(
						taskMaster.getTasksPath(),
						finalTagName,
						{},
						context,
						"text",
					);
				}
			} catch (error) {
				console.error(chalk.red(`Error creating tag: ${error.message}`));
				showAddTagHelp();
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			showAddTagHelp();
			process.exit(1);
		});

	// delete-tag command
	programInstance
		.command("delete-tag")
		.description("删除现有标签及其所有任务")
		.argument("<tagName>", "要删除的标签名称")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-y, --yes", "跳过确认提示")
		.action(async (tagName, options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Validate tasks file exists
				if (!fs.existsSync(tasksPath)) {
					console.error(
						chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
					);
					process.exit(1);
				}

				const deleteOptions = {
					yes: options.yes || false,
				};

				const context = {
					projectRoot: taskMaster.getProjectRoot(),
					commandName: "delete-tag",
					outputType: "cli",
				};

				await deleteTag(
					taskMaster.getTasksPath(),
					tagName,
					deleteOptions,
					context,
					"text",
				);
			} catch (error) {
				console.error(chalk.red(`Error deleting tag: ${error.message}`));
				showDeleteTagHelp();
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			showDeleteTagHelp();
			process.exit(1);
		});

	// tags command
	programInstance
		.command("tags")
		.description("列出所有可用标签及其元数据")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("--show-metadata", "显示每个标签的详细元数据")
		.option("--tag <tag>", "选择要处理的任务分组")
		.action(async (options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
					tag: options.tag,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Validate tasks file exists
				if (!fs.existsSync(tasksPath)) {
					console.error(
						chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
					);
					process.exit(1);
				}

				const listOptions = {
					showTaskCounts: true,
					showMetadata: options.showMetadata || false,
				};

				const context = {
					projectRoot: taskMaster.getProjectRoot(),
					commandName: "tags",
					outputType: "cli",
				};

				await tags(taskMaster.getTasksPath(), listOptions, context, "text");
			} catch (error) {
				console.error(chalk.red(`Error listing tags: ${error.message}`));
				showTagsHelp();
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			showTagsHelp();
			process.exit(1);
		});

	// use-tag command
	programInstance
		.command("use-tag")
		.description("切换到不同的标签上下文")
		.argument("<tagName>", "要切换到的标签名称")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.action(async (tagName, options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Validate tasks file exists
				if (!fs.existsSync(tasksPath)) {
					console.error(
						chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
					);
					process.exit(1);
				}

				const context = {
					projectRoot: taskMaster.getProjectRoot(),
					commandName: "use-tag",
					outputType: "cli",
				};

				await useTag(taskMaster.getTasksPath(), tagName, {}, context, "text");
			} catch (error) {
				console.error(chalk.red(`Error switching tag: ${error.message}`));
				showUseTagHelp();
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			showUseTagHelp();
			process.exit(1);
		});

	// rename-tag command
	programInstance
		.command("rename-tag")
		.description("重命名现有标签")
		.argument("<oldName>", "标签的当前名称")
		.argument("<newName>", "标签的新名称")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.action(async (oldName, newName, options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Validate tasks file exists
				if (!fs.existsSync(tasksPath)) {
					console.error(
						chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
					);
					process.exit(1);
				}

				const context = {
					projectRoot: taskMaster.getProjectRoot(),
					commandName: "rename-tag",
					outputType: "cli",
				};

				await renameTag(
					taskMaster.getTasksPath(),
					oldName,
					newName,
					{},
					context,
					"text",
				);
			} catch (error) {
				console.error(chalk.red(`Error renaming tag: ${error.message}`));
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			process.exit(1);
		});

	// copy-tag command
	programInstance
		.command("copy-tag")
		.description("复制现有标签来创建具有相同任务的新标签")
		.argument("<sourceName>", "要复制的源标签名称")
		.argument("<targetName>", "要创建的新标签名称")
		.option("-f, --file <file>", "任务文件路径", TASKMASTER_TASKS_FILE)
		.option("-d, --description <text>", "新标签的可选描述")
		.action(async (sourceName, targetName, options) => {
			try {
				// Initialize TaskMaster
				const taskMaster = initTaskMaster({
					tasksPath: options.file || true,
				});
				const tasksPath = taskMaster.getTasksPath();

				// Validate tasks file exists
				if (!fs.existsSync(tasksPath)) {
					console.error(
						chalk.red(`Error: Tasks file not found at path: ${tasksPath}`),
					);
					process.exit(1);
				}

				const copyOptions = {
					description: options.description,
				};

				const context = {
					projectRoot: taskMaster.getProjectRoot(),
					commandName: "copy-tag",
					outputType: "cli",
				};

				await copyTag(
					tasksPath,
					sourceName,
					targetName,
					copyOptions,
					context,
					"text",
				);
			} catch (error) {
				console.error(chalk.red(`Error copying tag: ${error.message}`));
				process.exit(1);
			}
		})
		.on("error", (err) => {
			console.error(chalk.red(`Error: ${err.message}`));
			process.exit(1);
		});

	return programInstance;
}

/**
 * Setup the CLI application
 * @returns {Object} Configured Commander program
 */
function setupCLI() {
	// Create a new program instance
	const programInstance = program
		.name("dev")
		.description("Manual development task management")
		.version(() => {
			// Read version directly from package.json ONLY
			try {
				const packageJsonPath = path.join(process.cwd(), "package.json");
				if (fs.existsSync(packageJsonPath)) {
					const packageJson = JSON.parse(
						fs.readFileSync(packageJsonPath, "utf8"),
					);
					return packageJson.version;
				}
			} catch (error) {
				// Silently fall back to 'unknown'
				log(
					"warn",
					"Could not read package.json for version info in .version()",
				);
			}
			return "unknown"; // Default fallback if package.json fails
		})
		.helpOption("-h, --help", "Display help")
		.addHelpCommand(false); // Disable default help command

	// Only override help for the main program, not for individual commands
	const originalHelpInformation =
		programInstance.helpInformation.bind(programInstance);
	programInstance.helpInformation = function () {
		// If this is being called for a subcommand, use the default Commander.js help
		if (this.parent && this.parent !== programInstance) {
			return originalHelpInformation();
		}
		// If this is the main program help, use our custom display
		displayHelp();
		return "";
	};

	// Register commands
	registerCommands(programInstance);

	return programInstance;
}

/**
 * Check for newer version of task-master-ai
 * @returns {Promise<{currentVersion: string, latestVersion: string, needsUpdate: boolean}>}
 */
async function checkForUpdate() {
	// Get current version from package.json ONLY
	const currentVersion = getTaskMasterVersion();

	return new Promise((resolve) => {
		// Get the latest version from npm registry
		const options = {
			hostname: "registry.npmjs.org",
			path: "/task-master-ai",
			method: "GET",
			headers: {
				Accept: "application/vnd.npm.install-v1+json", // Lightweight response
			},
		};

		const req = https.request(options, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				try {
					const npmData = JSON.parse(data);
					const latestVersion = npmData["dist-tags"]?.latest || currentVersion;

					// Compare versions
					const needsUpdate =
						compareVersions(currentVersion, latestVersion) < 0;

					resolve({
						currentVersion,
						latestVersion,
						needsUpdate,
					});
				} catch (error) {
					log("debug", `Error parsing npm response: ${error.message}`);
					resolve({
						currentVersion,
						latestVersion: currentVersion,
						needsUpdate: false,
					});
				}
			});
		});

		req.on("error", (error) => {
			log("debug", `Error checking for updates: ${error.message}`);
			resolve({
				currentVersion,
				latestVersion: currentVersion,
				needsUpdate: false,
			});
		});

		// Set a timeout to avoid hanging if npm is slow
		req.setTimeout(3000, () => {
			req.abort();
			log("debug", "Update check timed out");
			resolve({
				currentVersion,
				latestVersion: currentVersion,
				needsUpdate: false,
			});
		});

		req.end();
	});
}

/**
 * Compare semantic versions
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
	const v1Parts = v1.split(".").map((p) => Number.parseInt(p, 10));
	const v2Parts = v2.split(".").map((p) => Number.parseInt(p, 10));

	for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
		const v1Part = v1Parts[i] || 0;
		const v2Part = v2Parts[i] || 0;

		if (v1Part < v2Part) return -1;
		if (v1Part > v2Part) return 1;
	}

	return 0;
}

/**
 * Display upgrade notification message
 * @param {string} currentVersion - Current version
 * @param {string} latestVersion - Latest version
 */
function displayUpgradeNotification(currentVersion, latestVersion) {
	const message = boxen(
		`${chalk.blue.bold("Update Available!")} ${chalk.dim(currentVersion)} → ${chalk.green(latestVersion)}\n\n` +
			`Run ${chalk.cyan("npm i task-master-ai@latest -g")} to update to the latest version with new features and bug fixes.`,
		{
			padding: 1,
			margin: { top: 1, bottom: 1 },
			borderColor: "yellow",
			borderStyle: "round",
		},
	);

	console.log(message);
}

/**
 * Parse arguments and run the CLI
 * @param {Array} argv - Command-line arguments
 */
async function runCLI(argv = process.argv) {
	try {
		// Display banner if not in a pipe
		if (process.stdout.isTTY) {
			displayBanner();
		}

		// If no arguments provided, show help
		if (argv.length <= 2) {
			displayHelp();
			process.exit(0);
		}

		// Start the update check in the background - don't await yet
		const updateCheckPromise = checkForUpdate();

		// Setup and parse
		// NOTE: getConfig() might be called during setupCLI->registerCommands if commands need config
		// This means the ConfigurationError might be thrown here if configuration file is missing.
		const programInstance = setupCLI();
		await programInstance.parseAsync(argv);

		// After command execution, check if an update is available
		const updateInfo = await updateCheckPromise;
		if (updateInfo.needsUpdate) {
			displayUpgradeNotification(
				updateInfo.currentVersion,
				updateInfo.latestVersion,
			);
		}

		// Check if migration has occurred and show FYI notice once
		try {
			// Use initTaskMaster with no required fields - will only fail if no project root
			const taskMaster = initTaskMaster({});

			const tasksPath = taskMaster.getTasksPath();
			const statePath = taskMaster.getStatePath();

			if (tasksPath && fs.existsSync(tasksPath)) {
				// Read raw file to check if it has master key (bypassing tag resolution)
				const rawData = fs.readFileSync(tasksPath, "utf8");
				const parsedData = JSON.parse(rawData);

				if (parsedData?.master) {
					// Migration has occurred, check if we've shown the notice
					let stateData = { migrationNoticeShown: false };
					if (statePath && fs.existsSync(statePath)) {
						// Read state.json directly without tag resolution since it's not a tagged file
						const rawStateData = fs.readFileSync(statePath, "utf8");
						stateData = JSON.parse(rawStateData) || stateData;
					}

					if (!stateData.migrationNoticeShown) {
						displayTaggedTasksFYI({ _migrationHappened: true });

						// Mark as shown
						stateData.migrationNoticeShown = true;
						// Write state.json directly without tag resolution since it's not a tagged file
						if (statePath) {
							fs.writeFileSync(statePath, JSON.stringify(stateData, null, 2));
						}
					}
				}
			}
		} catch (error) {
			// Silently ignore errors checking for migration notice
		}
	} catch (error) {
		// Generic error handling
		console.error(chalk.red(`Error: ${error.message}`));
		if (getDebugFlag()) {
			console.error(error);
		}

		process.exit(1);
	}
}

/**
 * 验证品牌信息
 * @param {Object} brand - 品牌信息对象
 * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
 */
function validateBrandInfo(brand) {
	const errors = [];

	// 验证必填字段
	if (
		!brand.name ||
		typeof brand.name !== "string" ||
		brand.name.trim().length === 0
	) {
		errors.push("name 必须是非空字符串");
	}

	if (
		!brand.command ||
		typeof brand.command !== "string" ||
		brand.command.trim().length === 0
	) {
		errors.push("command 必须是非空字符串");
	}

	// 验证名称长度
	if (brand.name && brand.name.length > 50) {
		errors.push("name 长度不能超过50字符");
	}

	// 验证命令格式
	if (brand.command && !/^[a-z0-9-]+$/.test(brand.command)) {
		errors.push("command 只能包含小写字母、数字和中划线");
	}

	// 验证版本格式
	if (brand.version && !/^\d+\.\d+\.\d+/.test(brand.version)) {
		errors.push("version 必须符合语义化版本格式 (MAJOR.MINOR.PATCH)");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * 确认操作
 * @param {string} message - 确认消息
 * @returns {Promise<boolean>} 用户确认结果
 */
async function confirmOperation(message) {
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
 * 创建备份
 * @param {string} backupDir - 备份目录
 * @param {string} projectRoot - 项目根目录
 * @returns {Promise<void>}
 */
async function createBackup(backupDir, projectRoot) {
	const fs = require("fs").promises;
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const fullBackupDir = path.join(projectRoot, backupDir, timestamp);

	await fs.mkdir(fullBackupDir, { recursive: true });

	// 备份关键文件
	const filesToBackup = [
		"package.json",
		"README.md",
		".speco/config.json",
		".speco/brand.json",
	];

	for (const file of filesToBackup) {
		try {
			const content = await fs.readFile(path.join(projectRoot, file), "utf8");
			const backupFile = path.join(fullBackupDir, path.basename(file));
			await fs.writeFile(backupFile, content);
		} catch (error) {
			// 文件不存在，跳过
			continue;
		}
	}

	console.log(`备份创建在: ${fullBackupDir}`);
}

/**
 * Resolve the final complexity-report path.
 * Rules:
 *  1. If caller passes --output, always respect it.
 *  2. If no explicit output AND tag === 'main' → default report file
 *  3. If no explicit output AND tag !== 'main' → append _<tag>.json
 *
 * @param {string|undefined} outputOpt  --output value from CLI (may be undefined)
 * @param {string} targetTag            resolved tag (defaults to 'main')
 * @param {string} projectRoot          absolute project root
 * @returns {string} absolute path for the report
 */
export function resolveComplexityReportPath({
	projectRoot,
	tag = "main",
	output, // may be undefined
}) {
	// 1. user knows best
	if (output) {
		return path.isAbsolute(output) ? output : path.join(projectRoot, output);
	}

	// 2. default naming
	const base = path.join(projectRoot, COMPLEXITY_REPORT_FILE);
	return tag !== "main" ? base.replace(".json", `_${tag}.json`) : base;
}

export {
	registerCommands,
	setupCLI,
	runCLI,
	checkForUpdate,
	compareVersions,
	displayUpgradeNotification,
};
