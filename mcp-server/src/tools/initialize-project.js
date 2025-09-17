import { z } from "zod";
import { initializeProjectDirect } from "../core/task-master-core.js";
import {
	createErrorResponse,
	generateParameterHelp,
	getTagInfo,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

// Generate parameter help for initialize_project tool
const initializeProjectParameterHelp = generateParameterHelp(
	"initialize_project",
	[{ name: "projectRoot", description: "项目根目录的绝对路径" }],
	[
		{ name: "skipInstall", description: "是否跳过依赖安装" },
		{ name: "addAliases", description: "是否添加shell别名" },
		{ name: "initGit", description: "是否初始化Git仓库" },
		{ name: "storeTasksInGit", description: "是否在Git中存储任务" },
		{ name: "yes", description: "是否跳过确认提示" },
	],
	[
		'{"projectRoot": "/path/to/project"}',
		'{"projectRoot": "/path/to/project", "addAliases": true, "initGit": true}',
	],
);

export function registerInitializeProjectTool(server) {
	server.addTool({
		name: "initialize_project",
		description:
			"初始化新的Speco Tasker项目结构，调用核心初始化逻辑，在当前目录创建必要的文件夹和配置文件。",
		parameters: z.object({
			skipInstall: z
				.boolean()
				.optional()
				.default(false)
				.describe(
					"跳过自动安装依赖项。除非您确信项目已经安装，否则永远不要这样做。",
				),
			addAliases: z
				.boolean()
				.optional()
				.default(true)
				.describe("添加 shell 别名 (tm, taskmaster) 到 shell 配置文件。"),
			initGit: z
				.boolean()
				.optional()
				.default(true)
				.describe("在项目根目录初始化 Git 仓库。"),
			storeTasksInGit: z
				.boolean()
				.optional()
				.default(true)
				.describe("在 Git 中存储任务 (tasks.json 和 tasks/ 目录)。"),
			yes: z
				.boolean()
				.optional()
				.default(true)
				.describe(
					"跳过提示并使用默认值。对于 MCP 工具，始终设置为 true。",
				),
			projectRoot: z
				.string()
				.describe(
					"项目的根目录。始终将此设置为项目根目录。如果未设置，工具将无法工作。",
				),
		}),
		execute: withNormalizedProjectRoot(async (args, context) => {
			const { log } = context;
			const session = context.session;

			try {
				log.info(
					`Executing initialize_project tool with args: ${JSON.stringify(args)}`,
				);

				const result = await initializeProjectDirect(args, log, { session });

				return handleApiResult(
					result,
					log,
					"Initialization failed",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				const errorMessage = `Project initialization failed: ${error.message || "Unknown error"}`;
				log.error(errorMessage, error);

				// Get tag info for better error context
				const tagInfo = args.projectRoot
					? getTagInfo(args.projectRoot, log)
					: null;

				return createErrorResponse(
					errorMessage,
					undefined,
					tagInfo,
					"INITIALIZE_PROJECT_FAILED",
					initializeProjectParameterHelp,
				);
			}
		}),
	});
}
