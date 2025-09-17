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
	[{ name: "projectRoot", description: "项目根目录的绝对路径（可选，会自动检测）" }],
	[],
	[
		'{}',  // 无参数，自动检测
		'{"projectRoot": "/path/to/project"}',  // 指定项目根目录
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
				.describe("项目的根目录（可选，会自动检测当前工作目录）"),
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
