/**
 * tools/get-tasks.js
 * Tool to get all tasks from Speco Tasker
 */

import { z } from "zod";
import { listTasksDirect } from "../core/task-master-core.js";
import {
	resolveComplexityReportPath,
	resolveTasksPath,
} from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	generateParameterHelp,
	getTagInfo,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

import { resolveTag } from "../../../scripts/modules/utils.js";

/**
 * Register the getTasks tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */

// Generate parameter help for get_tasks tool
const getTasksParameterHelp = generateParameterHelp(
	"get_tasks",
	[{ name: "projectRoot", description: "项目根目录的绝对路径" }],
	[
		{
			name: "status",
			description:
				"按状态过滤任务（pending, done, in-progress等），多个状态用逗号分隔",
		},
		{ name: "withSubtasks", description: "是否包含子任务信息" },
		{ name: "file", description: "任务文件路径（默认：tasks/tasks.json）" },
		{ name: "complexityReport", description: "复杂度报告文件路径" },
		{ name: "tag", description: "选择要处理的任务分组" },
	],
	[
		'{"projectRoot": "/path/to/project"}',
		'{"projectRoot": "/path/to/project", "status": "pending"}',
		'{"projectRoot": "/path/to/project", "withSubtasks": true, "tag": "feature-branch"}',
	],
);

export function registerListTasksTool(server) {
	server.addTool({
		name: "get_tasks",
		description: "获取Speco Tasker中的所有任务，可选按状态过滤和包含子任务。",
		parameters: z.object({
			status: z
				.string()
				.optional()
				.describe(
					"按状态过滤任务，支持格式如'pending', 'done'或用逗号分隔多个状态",
				),
			withSubtasks: z
				.boolean()
				.optional()
				.describe("在响应中包含嵌套在父任务中的子任务"),
			file: z
				.string()
				.optional()
				.describe("任务文件路径（相对于项目根目录或绝对路径）"),
			complexityReport: z
				.string()
				.optional()
				.describe("复杂度报告文件路径（相对于项目根目录或绝对路径）"),
			projectRoot: z.string().describe("项目目录，必须是绝对路径"),
			tag: z.string().optional().describe("选择要处理的任务分组"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Getting tasks with filters: ${JSON.stringify(args)}`);

				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});
				// Resolve the path to tasks.json using new path utilities
				let tasksJsonPath;
				try {
					tasksJsonPath = resolveTasksPath(args, log);
				} catch (error) {
					const errorMessage = `Failed to find tasks.json: ${error.message || "File not found"}`;
					log.error(`[get-tasks tool] ${errorMessage}`);

					// Get tag info for better error context
					const tagInfo = args.projectRoot
						? getTagInfo(args.projectRoot, log)
						: null;

					return createErrorResponse(
						errorMessage,
						undefined,
						tagInfo,
						"TASKS_JSON_NOT_FOUND",
					);
				}

				// Resolve the path to complexity report
				let complexityReportPath;
				try {
					complexityReportPath = resolveComplexityReportPath(
						{ ...args, tag: resolvedTag },
						session,
					);
				} catch (error) {
					log.error(`Error finding complexity report: ${error.message}`);
					// This is optional, so we don't fail the operation
					complexityReportPath = null;
				}

				const result = await listTasksDirect(
					{
						tasksJsonPath: tasksJsonPath,
						status: args.status,
						withSubtasks: args.withSubtasks,
						reportPath: complexityReportPath,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
					{ session },
				);

				log.info(
					`Retrieved ${result.success ? result.data?.tasks?.length || 0 : 0} tasks`,
				);
				return handleApiResult(
					result,
					log,
					"Error getting tasks",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				const errorMessage = `获取任务列表失败: ${error.message || "未知错误"}`;
				log.error(`[get-tasks tool] ${errorMessage}`);

				// Get tag info for better error context
				const tagInfo = args.projectRoot
					? getTagInfo(args.projectRoot, log)
					: null;

				return createErrorResponse(
					errorMessage,
					undefined,
					tagInfo,
					"GET_TASKS_FAILED",
					getTasksParameterHelp,
				);
			}
		}),
	});
}

// We no longer need the formatTasksResponse function as we're returning raw JSON data
