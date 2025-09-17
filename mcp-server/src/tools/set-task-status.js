/**
 * tools/setTaskStatus.js
 * Tool to set the status of a task
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { TASK_STATUS_OPTIONS } from "../../../src/constants/task-status.js";
import {
	nextTaskDirect,
	setTaskStatusDirect,
} from "../core/task-master-core.js";
import {
	findComplexityReportPath,
	findTasksPath,
} from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	generateParameterHelp,
	getTagInfo,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the setTaskStatus tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */

// Generate parameter help for set_task_status tool
const setTaskStatusParameterHelp = generateParameterHelp(
	"set_task_status",
	[
		{ name: "projectRoot", description: "项目根目录的绝对路径" },
		{
			name: "id",
			description: "任务ID或子任务ID（例如：15, 15.2），多个ID用逗号分隔",
		},
		{
			name: "status",
			description:
				"新状态（pending, done, in-progress, review, deferred, cancelled）",
		},
	],
	[
		{ name: "file", description: "任务文件路径（默认：tasks/tasks.json）" },
		{ name: "complexityReport", description: "复杂度报告文件路径" },
		{ name: "tag", description: "选择要处理的任务分组" },
	],
	[
		'{"projectRoot": "/path/to/project", "id": "1", "status": "done"}',
		'{"projectRoot": "/path/to/project", "id": "2,3,4", "status": "in-progress"}',
		'{"projectRoot": "/path/to/project", "id": "5.1", "status": "review", "tag": "feature-branch"}',
	],
);

export function registerSetTaskStatusTool(server) {
	server.addTool({
		name: "set_task_status",
		description: "设置一个或多个任务或子任务的状态",
		parameters: z.object({
			id: z
				.string()
				.describe(
					"任务ID或子任务ID，支持格式如'15', '15.2'，可逗号分隔同时更新多个任务",
				),
			status: z
				.enum(TASK_STATUS_OPTIONS)
				.describe(
					"新状态，支持'pending', 'done', 'in-progress', 'review', 'deferred', 'cancelled'",
				),
			file: z.string().optional().describe("任务文件的绝对路径"),
			complexityReport: z
				.string()
				.optional()
				.describe("复杂度报告文件路径，相对于项目根目录或绝对路径"),
			projectRoot: z.string().describe("项目目录，必须是绝对路径"),
			tag: z.string().optional().describe("可选的标签上下文"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(
					`Setting status of task(s) ${args.id} to: ${args.status} ${
						args.tag ? `in tag: ${args.tag}` : "in current tag"
					}`,
				);
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});
				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						log,
					);
				} catch (error) {
					const errorMessage = `Failed to find tasks.json: ${error.message || "File not found"}`;
					log.error(`[set-task-status tool] ${errorMessage}`);

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

				let complexityReportPath;
				try {
					complexityReportPath = findComplexityReportPath(
						{
							projectRoot: args.projectRoot,
							complexityReport: args.complexityReport,
							tag: resolvedTag,
						},
						log,
					);
				} catch (error) {
					log.error(`Error finding complexity report: ${error.message}`);
				}

				const result = await setTaskStatusDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						status: args.status,
						complexityReportPath,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
					{ session },
				);

				if (result.success) {
					log.info(
						`Successfully updated status for task(s) ${args.id} to "${args.status}": ${result.data.message}`,
					);
				} else {
					log.error(
						`Failed to update task status: ${result.error?.message || "Unknown error"}`,
					);
				}

				return handleApiResult(
					result,
					log,
					"Error setting task status",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in setTaskStatus tool: ${error.message}`);
				return createErrorResponse(
					`Error setting task status: ${error.message}`,
				);
			}
		}),
	});
}
