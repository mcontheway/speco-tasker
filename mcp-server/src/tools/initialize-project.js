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
	[
		{
			name: "projectRoot",
			description: "项目根目录的绝对路径（可选，会自动检测）",
		},
		{
			name: "projectName",
			description: "项目名称（可选，会自动从Git仓库或目录名检测）",
		},
		{
			name: "projectDescription",
			description: "项目描述",
		},
		{
			name: "projectVersion",
			description: "项目版本（可选，默认为'0.1.0'）",
		},
		{
			name: "authorName",
			description: "作者名称（可选，默认为'Vibe coder'）",
		},
		{
			name: "shell",
			description: "Shell类型（可选，zsh或bash，用于添加别名）",
		},
		{
			name: "force",
			description: "强制重新初始化，即使项目已存在",
		},
	],
	[],
	[
		"{}", // 无参数，使用智能默认值
		'{"projectRoot": "/path/to/project", "projectName": "my-project"}', // 指定项目根目录和名称
		'{"projectName": "my-project", "shell": "zsh"}', // 指定名称和Shell类型
	],
);

export function registerInitializeProjectTool(server) {
	server.addTool({
		name: "initialize_project",
		description:
			"初始化新的Speco Tasker项目结构，调用核心初始化逻辑，在当前目录创建必要的文件夹和配置文件。",
		parameters: z.object({
			projectRoot: z
				.string()
				.optional()
				.describe("项目的根目录路径（可选，会自动检测）"),
			projectName: z
				.string()
				.optional()
				.describe("项目名称（可选，会自动从Git仓库或目录名检测）"),
			projectDescription: z
				.string()
				.optional()
				.describe("项目描述"),
			projectVersion: z
				.string()
				.optional()
				.describe("项目版本（可选，默认为'0.1.0'）"),
			authorName: z
				.string()
				.optional()
				.describe("作者名称（可选，默认为'Vibe coder'）"),
			shell: z
				.string()
				.optional()
				.describe("Shell类型（可选，zsh或bash，用于添加别名）"),
			force: z
				.boolean()
				.optional()
				.describe("强制重新初始化，即使项目已存在"),
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
