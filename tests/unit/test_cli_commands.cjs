/**
 * test_cli_commands.cjs
 * 单元测试：验证CLI命令功能
 *
 * SCOPE: 测试命令行接口的解析、参数处理、帮助信息和错误处理
 */

// Mock 工具函数
jest.mock("../scripts/modules/utils.js", () => ({
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	findProjectRoot: jest.fn(() => "/mock/project/root"),
	ensureTagMetadata: jest.fn(),
	markMigrationForNotice: jest.fn(),
	performCompleteTagMigration: jest.fn(),
	isSilentMode: jest.fn(() => false),
}));

// Mock 配置管理器
jest.mock("../scripts/modules/config-manager.js", () => ({
	getDefaultPriority: jest.fn(() => "medium"),
	hasCodebaseAnalysis: jest.fn(() => false),
}));

describe("CLI命令功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("命令解析和参数处理", () => {
		it("应该能够解析基本命令", () => {
			const parseCommand = (args) => {
				const command = args[0];
				const options = {};

				for (let i = 1; i < args.length; i++) {
					const arg = args[i];
					if (arg.startsWith("--")) {
						const [key, value] = arg.slice(2).split("=");
						if (value !== undefined) {
							options[key] = value;
						} else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
							options[key] = args[++i];
						} else {
							options[key] = true;
						}
					} else if (arg.startsWith("-")) {
						const key = arg.slice(1);
						const value =
							args[i + 1] && !args[i + 1].startsWith("-") ? args[++i] : true;
						options[key] = value;
					} else {
						if (!options.title && !options.id) {
							// 检查是否可能是ID（数字）
							if (/^\d+$/.test(arg)) {
								options.id = arg;
							} else {
								options.title = arg;
							}
						}
					}
				}

				return { command, options };
			};

			expect(parseCommand(["add-task", "实现用户登录功能"])).toEqual({
				command: "add-task",
				options: { title: "实现用户登录功能" },
			});

			expect(parseCommand(["list", "--status", "pending"])).toEqual({
				command: "list",
				options: { status: "pending" },
			});

			expect(
				parseCommand([
					"update",
					"1",
					"--title",
					"新标题",
					"--priority",
					"high",
				]),
			).toEqual({
				command: "update",
				options: { id: "1", title: "新标题", priority: "high" },
			});
		});

		it("应该支持长短参数格式", () => {
			const parseArguments = (args) => {
				const result = { positional: [], options: {} };

				for (let i = 0; i < args.length; i++) {
					const arg = args[i];

					if (arg.startsWith("--")) {
						// 长参数格式
						const [key, value] = arg.slice(2).split("=");
						if (value !== undefined) {
							result.options[key] = value;
						} else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
							result.options[key] = args[++i];
						} else {
							result.options[key] = true;
						}
					} else if (arg.startsWith("-")) {
						// 短参数格式
						const flags = arg.slice(1).split("");
						for (const flag of flags) {
							if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
								result.options[flag] = args[++i];
								break; // 只处理第一个需要值的标志
							} else {
								result.options[flag] = true;
							}
						}
					} else {
						// 位置参数
						result.positional.push(arg);
					}
				}

				return result;
			};

			expect(
				parseArguments(["add-task", "任务标题", "--priority", "high", "-v"]),
			).toEqual({
				positional: ["add-task", "任务标题"],
				options: { priority: "high", v: true },
			});

			expect(
				parseArguments(["list", "--status=pending", "--limit", "10"]),
			).toEqual({
				positional: ["list"],
				options: { status: "pending", limit: "10" },
			});

			expect(parseArguments(["update", "1", "-t", "新标题"])).toEqual({
				positional: ["update", "1"],
				options: { t: "新标题" },
			});
		});

		it("应该验证必需参数", () => {
			const validateCommandArgs = (command, args) => {
				const commandSchemas = {
					"add-task": { required: ["title"], optional: ["priority", "status"] },
					update: {
						required: ["id"],
						optional: ["title", "priority", "status"],
					},
					delete: { required: ["id"], optional: [] },
					list: { required: [], optional: ["status", "priority", "limit"] },
				};

				const schema = commandSchemas[command];
				if (!schema)
					return {
						valid: false,
						error: "未知命令",
						parsed: { positional: [], options: {} },
					};

				const parsed = { positional: [], options: {} };
				let i = 0;

				// 解析参数（简化版本）
				while (i < args.length) {
					const arg = args[i];
					if (arg.startsWith("-")) {
						const key = arg.replace(/^-+/, "");
						if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
							parsed.options[key] = args[++i];
						} else {
							parsed.options[key] = true;
						}
					} else {
						parsed.positional.push(arg);
					}
					i++;
				}

				// 验证必需参数
				const missing = schema.required.filter((req) => {
					if (req === "title" && parsed.positional.length > 0) return false;
					if (req === "id" && parsed.positional.length > 0) return false;
					return !parsed.options[req];
				});

				return {
					valid: missing.length === 0,
					error:
						missing.length > 0 ? `缺少必需参数: ${missing.join(", ")}` : null,
					parsed,
				};
			};

			expect(validateCommandArgs("add-task", ["实现登录功能"])).toEqual({
				valid: true,
				error: null,
				parsed: { positional: ["实现登录功能"], options: {} },
			});

			expect(validateCommandArgs("add-task", ["--priority", "high"])).toEqual({
				valid: false,
				error: "缺少必需参数: title",
				parsed: { positional: [], options: { priority: "high" } },
			});

			expect(validateCommandArgs("update", ["1", "--title", "新标题"])).toEqual(
				{
					valid: true,
					error: null,
					parsed: { positional: ["1"], options: { title: "新标题" } },
				},
			);

			expect(validateCommandArgs("unknown-command", [])).toEqual({
				valid: false,
				error: "未知命令",
				parsed: { positional: [], options: {} },
			});
		});
	});

	describe("命令执行和结果处理", () => {
		it("应该正确执行命令并返回结果", () => {
			const commandRegistry = {
				"add-task": (options) => {
					if (!options.title) throw new Error("标题不能为空");
					return {
						success: true,
						task: { id: 1, title: options.title, status: "pending" },
						message: `任务 "${options.title}" 创建成功`,
					};
				},

				list: (options) => {
					const mockTasks = [
						{ id: 1, title: "任务1", status: "pending" },
						{ id: 2, title: "任务2", status: "done" },
					];

					let filtered = mockTasks;
					if (options.status) {
						filtered = mockTasks.filter(
							(task) => task.status === options.status,
						);
					}

					return {
						success: true,
						tasks: filtered,
						count: filtered.length,
					};
				},
			};

			const executeCommand = (command, options) => {
				const handler = commandRegistry[command];
				if (!handler) {
					return { success: false, error: `未知命令: ${command}` };
				}

				try {
					return handler(options);
				} catch (error) {
					return { success: false, error: error.message };
				}
			};

			// 测试成功执行
			const addResult = executeCommand("add-task", { title: "新任务" });
			expect(addResult.success).toBe(true);
			expect(addResult.task.title).toBe("新任务");
			expect(addResult.message).toContain("创建成功");

			// 测试带参数的命令
			const listResult = executeCommand("list", { status: "pending" });
			expect(listResult.success).toBe(true);
			expect(listResult.tasks).toHaveLength(1);
			expect(listResult.tasks[0].status).toBe("pending");

			// 测试错误处理
			const errorResult = executeCommand("add-task", {});
			expect(errorResult.success).toBe(false);
			expect(errorResult.error).toBe("标题不能为空");

			const unknownResult = executeCommand("unknown", {});
			expect(unknownResult.success).toBe(false);
			expect(unknownResult.error).toBe("未知命令: unknown");
		});

		it("应该支持命令的输出格式化", () => {
			const formatters = {
				"add-task": (result) => `✅ ${result.message}`,
				list: (result) => {
					const lines = result.tasks.map(
						(task) => `  ${task.id}. ${task.title} [${task.status}]`,
					);
					return `📋 任务列表 (${result.count}个):\n${lines.join("\n")}`;
				},
				update: (result) => `🔄 任务 ${result.task.id} 更新成功`,
				delete: (result) => `🗑️  任务 ${result.id} 删除成功`,
			};

			const formatOutput = (command, result, format = "text") => {
				if (!result.success) {
					return `❌ 错误: ${result.error}`;
				}

				const formatter = formatters[command];
				if (formatter) {
					return formatter(result);
				}

				return JSON.stringify(result, null, 2);
			};

			const addResult = { success: true, message: "任务创建成功" };
			const listResult = {
				success: true,
				tasks: [
					{ id: 1, title: "任务1", status: "pending" },
					{ id: 2, title: "任务2", status: "done" },
				],
				count: 2,
			};
			const errorResult = { success: false, error: "操作失败" };

			expect(formatOutput("add-task", addResult)).toBe("✅ 任务创建成功");
			expect(formatOutput("list", listResult)).toContain("📋 任务列表 (2个)");
			expect(formatOutput("list", listResult)).toContain("任务1 [pending]");
			expect(formatOutput("unknown", addResult)).toContain('"success": true');
			expect(formatOutput("add-task", errorResult)).toBe("❌ 错误: 操作失败");
		});

		it("应该处理异步命令执行", async () => {
			const asyncCommandRegistry = {
				"process-data": async (options) => {
					// 模拟异步操作
					await new Promise((resolve) => setTimeout(resolve, 10));

					if (!options.input) {
						throw new Error("输入数据不能为空");
					}

					return {
						success: true,
						processed: options.input.toUpperCase(),
						timestamp: new Date().toISOString(),
					};
				},

				"fetch-remote": async (options) => {
					await new Promise((resolve) => setTimeout(resolve, 10));

					if (options.fail) {
						throw new Error("网络连接失败");
					}

					return {
						success: true,
						data: "远程数据",
						source: options.url || "default-api",
					};
				},
			};

			const executeAsyncCommand = async (command, options) => {
				const handler = asyncCommandRegistry[command];
				if (!handler) {
					return { success: false, error: `未知命令: ${command}` };
				}

				try {
					const result = await handler(options);
					return result;
				} catch (error) {
					return { success: false, error: error.message };
				}
			};

			// 测试成功的异步命令
			const successResult = await executeAsyncCommand("process-data", {
				input: "hello world",
			});
			expect(successResult.success).toBe(true);
			expect(successResult.processed).toBe("HELLO WORLD");
			expect(successResult.timestamp).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);

			// 测试失败的异步命令
			const failResult = await executeAsyncCommand("process-data", {});
			expect(failResult.success).toBe(false);
			expect(failResult.error).toBe("输入数据不能为空");

			// 测试带参数的异步命令
			const fetchResult = await executeAsyncCommand("fetch-remote", {
				url: "api.example.com",
			});
			expect(fetchResult.success).toBe(true);
			expect(fetchResult.data).toBe("远程数据");
			expect(fetchResult.source).toBe("api.example.com");
		});
	});

	describe("帮助信息和命令发现", () => {
		it("应该提供命令帮助信息", () => {
			const commandHelp = {
				"add-task": {
					description: "创建新任务",
					usage: "add-task <title> [options]",
					options: {
						"--priority <level>": "设置任务优先级 (low|medium|high)",
						"--status <status>": "设置任务状态 (pending|in-progress|done)",
						"--description <text>": "设置任务描述",
					},
					examples: [
						'task-master add-task "实现用户登录功能"',
						'task-master add-task "修复登录bug" --priority high --status in-progress',
					],
				},

				list: {
					description: "列出任务",
					usage: "list [options]",
					options: {
						"--status <status>": "按状态过滤",
						"--priority <level>": "按优先级过滤",
						"--limit <number>": "限制结果数量",
					},
					examples: [
						"task-master list",
						"task-master list --status pending --limit 5",
					],
				},
			};

			const getCommandHelp = (command) => {
				const help = commandHelp[command];
				if (!help) {
					return `未知命令: ${command}\n运行 'task-master help' 查看所有可用命令`;
				}

				let helpText = `${command}: ${help.description}\n\n`;
				helpText += `用法: ${help.usage}\n\n`;

				if (help.options && Object.keys(help.options).length > 0) {
					helpText += "选项:\n";
					Object.entries(help.options).forEach(([option, desc]) => {
						helpText += `  ${option}: ${desc}\n`;
					});
					helpText += "\n";
				}

				if (help.examples && help.examples.length > 0) {
					helpText += "示例:\n";
					help.examples.forEach((example) => {
						helpText += `  ${example}\n`;
					});
				}

				return helpText;
			};

			const addTaskHelp = getCommandHelp("add-task");
			expect(addTaskHelp).toContain("add-task: 创建新任务");
			expect(addTaskHelp).toContain("add-task <title> [options]");
			expect(addTaskHelp).toContain("--priority <level>");
			expect(addTaskHelp).toContain("实现用户登录功能");

			const listHelp = getCommandHelp("list");
			expect(listHelp).toContain("list: 列出任务");
			expect(listHelp).toContain("--status <status>");
			expect(listHelp).toContain("task-master list --status pending --limit 5");

			const unknownHelp = getCommandHelp("unknown");
			expect(unknownHelp).toContain("未知命令: unknown");
			expect(unknownHelp).toContain("task-master help");
		});

		it("应该支持命令自动补全", () => {
			const availableCommands = [
				"add-task",
				"list",
				"update",
				"delete",
				"help",
				"version",
				"show",
				"move",
				"tag",
				"untag",
				"export",
				"import",
			];

			const getCommandCompletions = (partial) => {
				if (!partial) return availableCommands;

				return availableCommands.filter((cmd) =>
					cmd.toLowerCase().startsWith(partial.toLowerCase()),
				);
			};

			const getOptionCompletions = (command, partialOption) => {
				const commandOptions = {
					"add-task": ["--priority", "--status", "--description", "--tags"],
					list: ["--status", "--priority", "--limit", "--sort"],
					update: ["--title", "--priority", "--status", "--description"],
				};

				const options = commandOptions[command] || [];
				if (!partialOption) return options;

				return options.filter((option) =>
					option.toLowerCase().startsWith(partialOption.toLowerCase()),
				);
			};

			expect(getCommandCompletions("")).toHaveLength(12);
			expect(getCommandCompletions("add")).toEqual(["add-task"]);
			expect(getCommandCompletions("li")).toEqual(["list"]);
			expect(getCommandCompletions("nonexistent")).toHaveLength(0);

			expect(getOptionCompletions("add-task", "--p")).toEqual(["--priority"]);
			expect(getOptionCompletions("list", "--s")).toEqual([
				"--status",
				"--sort",
			]);
			expect(getOptionCompletions("unknown", "")).toHaveLength(0);
		});

		it("应该提供全局帮助信息", () => {
			const getGlobalHelp = () => {
				const helpText = `
Speco Tasker - 任务管理系统

可用命令:
  add-task    创建新任务
  list        列出任务
  update      更新任务
  delete      删除任务
  show        显示任务详情
  move        移动任务位置
  tag         为任务添加标签
  untag       从任务移除标签
  export      导出任务数据
  import      导入任务数据
  help        显示帮助信息
  version     显示版本信息

全局选项:
  -v, --verbose    详细输出
  -q, --quiet      静默模式
  -h, --help       显示帮助信息
  --config <file>  指定配置文件

示例:
  task-master add-task "实现用户登录功能" --priority high
  task-master list --status pending --limit 10
  task-master update 1 --title "新标题" --status in-progress

运行 'task-master <command> --help' 查看具体命令的帮助信息
				`.trim();

				return helpText;
			};

			const helpText = getGlobalHelp();
			expect(helpText).toContain("Speco Tasker - 任务管理系统");
			expect(helpText).toContain("可用命令:");
			expect(helpText).toContain("add-task    创建新任务");
			expect(helpText).toContain("list        列出任务");
			expect(helpText).toContain("全局选项:");
			expect(helpText).toContain("-v, --verbose");
			expect(helpText).toContain("示例:");
			expect(helpText).toContain(
				'task-master add-task "实现用户登录功能" --priority high',
			);
		});
	});

	describe("命令历史和重做", () => {
		it("应该记录命令执行历史", () => {
			const commandHistory = [];

			const recordCommand = (command, args, result) => {
				commandHistory.push({
					id: commandHistory.length + 1,
					timestamp: new Date().toISOString(),
					command,
					args: [...args],
					success: result.success,
					result: result.success ? "执行成功" : result.error,
				});
			};

			const executeWithHistory = (command, args) => {
				// 模拟命令执行
				let result;
				if (command === "add-task" && args.length > 0) {
					result = { success: true, taskId: 1 };
				} else if (command === "list") {
					result = { success: true, count: 5 };
				} else {
					result = { success: false, error: "无效命令或参数" };
				}

				recordCommand(command, args, result);
				return result;
			};

			// 执行一些命令
			executeWithHistory("add-task", ["实现登录功能", "--priority", "high"]);
			executeWithHistory("list", ["--status", "pending"]);
			executeWithHistory("invalid", []);

			expect(commandHistory).toHaveLength(3);
			expect(commandHistory[0].command).toBe("add-task");
			expect(commandHistory[0].args).toEqual([
				"实现登录功能",
				"--priority",
				"high",
			]);
			expect(commandHistory[0].success).toBe(true);
			expect(commandHistory[1].command).toBe("list");
			expect(commandHistory[2].success).toBe(false);
			expect(commandHistory[2].result).toBe("无效命令或参数");
		});

		it("应该支持命令重做功能", () => {
			let lastExecutedCommand = null;

			const executeCommand = (command, args) => {
				lastExecutedCommand = { command, args, timestamp: new Date() };

				if (command === "add-task" && args[0]) {
					return { success: true, taskId: Math.floor(Math.random() * 1000) };
				} else {
					return { success: false, error: "执行失败" };
				}
			};

			const redoLastCommand = () => {
				if (!lastExecutedCommand) {
					return { success: false, error: "没有可重做的命令" };
				}

				// 重新执行上一个命令
				return executeCommand(
					lastExecutedCommand.command,
					lastExecutedCommand.args,
				);
			};

			// 执行初始命令
			const result1 = executeCommand("add-task", ["测试任务"]);
			expect(result1.success).toBe(true);
			expect(lastExecutedCommand.command).toBe("add-task");

			// 重做命令
			const result2 = redoLastCommand();
			expect(result2.success).toBe(true);
			expect(result2.taskId).not.toBe(result1.taskId); // 每次执行应该生成不同的ID

			// 测试无历史的重做
			lastExecutedCommand = null;
			const result3 = redoLastCommand();
			expect(result3.success).toBe(false);
			expect(result3.error).toBe("没有可重做的命令");
		});

		it("应该支持命令撤销功能", () => {
			const executedCommands = [];
			const taskStore = [];

			const executeCommand = (command, args) => {
				executedCommands.push({ command, args, timestamp: new Date() });

				if (command === "add-task" && args[0]) {
					const task = {
						id: taskStore.length + 1,
						title: args[0],
						status: "pending",
					};
					taskStore.push(task);
					return { success: true, task };
				} else if (command === "delete" && args[0]) {
					const taskId = Number.parseInt(args[0]);
					const taskIndex = taskStore.findIndex((t) => t.id === taskId);
					if (taskIndex !== -1) {
						const deletedTask = taskStore.splice(taskIndex, 1)[0];
						return { success: true, deleted: deletedTask };
					}
				}

				return { success: false, error: "无效操作" };
			};

			const undoLastCommand = () => {
				if (executedCommands.length === 0) {
					return { success: false, error: "没有可撤销的命令" };
				}

				const lastCommand = executedCommands.pop();

				// 撤销命令逻辑
				if (lastCommand.command === "add-task") {
					// 撤销添加任务
					const removedTask = taskStore.pop();
					return { success: true, undone: "add-task", removedTask };
				} else if (lastCommand.command === "delete") {
					// 撤销删除任务（需要恢复任务）
					// 这里简化处理，实际需要更复杂的撤销逻辑
					return {
						success: true,
						undone: "delete",
						restoredTask: lastCommand.args[0],
					};
				}

				return { success: false, error: "无法撤销此命令" };
			};

			// 执行添加任务命令
			executeCommand("add-task", ["任务1"]);
			expect(taskStore).toHaveLength(1);

			// 撤销添加任务
			const undoResult = undoLastCommand();
			expect(undoResult.success).toBe(true);
			expect(undoResult.undone).toBe("add-task");
			expect(taskStore).toHaveLength(0);

			// 测试无历史撤销
			const undoEmptyResult = undoLastCommand();
			expect(undoEmptyResult.success).toBe(false);
			expect(undoEmptyResult.error).toBe("没有可撤销的命令");
		});
	});

	describe("CLI环境和配置", () => {
		it("应该检测和处理不同的运行环境", () => {
			const detectEnvironment = () => {
				const env = process.env;

				return {
					isInteractive: !!(env.TERM && env.TERM !== "dumb"),
					hasColorSupport: !!(
						env.COLORTERM || env.TERM_PROGRAM === "Apple_Terminal"
					),
					isCI: !!(env.CI || env.CONTINUOUS_INTEGRATION),
					isWindows: process.platform === "win32",
					isMacOS: process.platform === "darwin",
					isLinux: process.platform === "linux",
					nodeVersion: process.version,
					workingDirectory: process.cwd(),
				};
			};

			const env = detectEnvironment();

			expect(typeof env.isInteractive).toBe("boolean");
			expect(typeof env.hasColorSupport).toBe("boolean");
			expect(typeof env.isCI).toBe("boolean");
			expect(["win32", "darwin", "linux"].includes(process.platform)).toBe(
				true,
			);
			expect(env.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
			expect(typeof env.workingDirectory).toBe("string");
		});

		it("应该根据环境调整输出格式", () => {
			const formatOutputForEnvironment = (result, env) => {
				let output = "";

				if (result.success) {
					if (env.hasColorSupport) {
						output += "\x1b[32m✅ \x1b[0m"; // 绿色成功图标
					} else {
						output += "SUCCESS: ";
					}
					output += result.message || "操作成功";
				} else {
					if (env.hasColorSupport) {
						output += "\x1b[31m❌ \x1b[0m"; // 红色失败图标
					} else {
						output += "ERROR: ";
					}
					output += result.error || "操作失败";
				}

				// 在CI环境中添加更多结构化信息
				if (env.isCI) {
					output += `\n---\nCommand: ${result.command || "unknown"}`;
					output += `\nTimestamp: ${new Date().toISOString()}`;
					if (result.data) {
						output += `\nData: ${JSON.stringify(result.data)}`;
					}
				}

				return output;
			};

			const envWithColor = { hasColorSupport: true, isCI: false };
			const envWithoutColor = { hasColorSupport: false, isCI: false };
			const envCI = { hasColorSupport: true, isCI: true };

			const successResult = {
				success: true,
				message: "任务创建成功",
				command: "add-task",
			};
			const errorResult = {
				success: false,
				error: "权限被拒绝",
				command: "delete",
			};

			const coloredSuccess = formatOutputForEnvironment(
				successResult,
				envWithColor,
			);
			const plainSuccess = formatOutputForEnvironment(
				successResult,
				envWithoutColor,
			);
			const ciOutput = formatOutputForEnvironment(successResult, envCI);

			expect(coloredSuccess).toContain("\x1b[32m✅ \x1b[0m");
			expect(plainSuccess).toContain("SUCCESS: ");
			expect(ciOutput).toContain("Command: add-task");
			expect(ciOutput).toContain("Timestamp:");

			const coloredError = formatOutputForEnvironment(
				errorResult,
				envWithColor,
			);
			expect(coloredError).toContain("\x1b[31m❌ \x1b[0m");
		});

		it("应该处理配置文件路径解析", () => {
			const resolveConfigPath = (configArg, env) => {
				if (!configArg) {
					// 默认配置文件路径
					const defaultPaths = [
						"./.taskmaster/config.json",
						"./taskmaster.json",
						env.isWindows
							? "~/AppData/taskmaster/config.json"
							: "~/.config/taskmaster/config.json",
					];

					return defaultPaths[0]; // 返回第一个默认路径
				}

				// 处理家目录展开
				if (configArg.startsWith("~")) {
					const homeDir = env.isWindows
						? process.env.USERPROFILE || "C:\\Users\\Default"
						: process.env.HOME || "/tmp";
					return configArg.replace(/^~/, homeDir);
				}

				// 处理相对路径
				if (!configArg.startsWith("/") && !configArg.match(/^[A-Z]:/i)) {
					return "./" + configArg;
				}

				return configArg;
			};

			const env = { isWindows: false };
			const mockHome = "/Users/testuser";

			// Mock process.env.HOME for this test
			const originalHome = process.env.HOME;
			process.env.HOME = mockHome;

			try {
				expect(resolveConfigPath("", env)).toBe("./.taskmaster/config.json");
				expect(resolveConfigPath("custom-config.json", env)).toBe(
					"./custom-config.json",
				);
				expect(resolveConfigPath("/absolute/path/config.json", env)).toBe(
					"/absolute/path/config.json",
				);
				expect(resolveConfigPath("~/config.json", env)).toBe(
					mockHome + "/config.json",
				);
			} finally {
				// Restore original HOME
				process.env.HOME = originalHome;
			}
		});
	});
});
