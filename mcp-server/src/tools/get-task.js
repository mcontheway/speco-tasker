/**
 * tools/get-task.js
 * Tool to get task details by ID
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { showTaskDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	generateParameterHelp,
	getTagInfo,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Custom processor function that removes allTasks from the response
 * @param {Object} data - The data returned from showTaskDirect
 * @returns {Object} - The processed data with allTasks removed
 */

// Generate parameter help for get_task tool
const getTaskParameterHelp = generateParameterHelp(
	"get_task",
	[
		{ name: "projectRoot", description: "项目根目录（可选，会自动检测）" },
		{ name: "id", description: "要查看的任务ID或子任务ID（例如：15, 15.2）" },
	],
	[
		{ name: "file", description: "任务文件路径（默认：tasks/tasks.json）" },
		{ name: "tag", description: "选择要处理的任务分组" },
	],
	[
		'{"projectRoot": "/path/to/project", "id": "1"}',
		'{"projectRoot": "/path/to/project", "id": "5.2"}',
		'{"projectRoot": "/path/to/project", "id": "10", "tag": "feature-branch"}',
	],
);
function processTaskResponse(data) {
	if (!data) return data;

	// If we have the expected structure with task and allTasks
	if (typeof data === "object" && data !== null && data.id && data.title) {
		// If the data itself looks like the task object, return it
		return data;
	}
	if (data.task) {
		return data.task;
	}

	// If structure is unexpected, return as is
	return data;
}

/**
 * Register the get-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerShowTaskTool(server) {
	server.addTool({
		name: "get_task",
		description: "获取特定任务的详细信息",
		parameters: z.object({
			id: z.string().describe("要获取的任务ID，支持逗号分隔多个任务"),
			status: z
				.string()
				.optional()
				.describe("按状态过滤子任务，支持'pending', 'done'等"),
			file: z.string().optional().describe("相对于项目根目录的任务文件路径"),
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录（可选，会自动检测）"),
			tag: z.string().optional().describe("选择要处理的任务分组"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const { id, file, status, projectRoot } = args;

			try {
				log.info(
					`Getting task details for ID: ${id}${status ? ` (filtering subtasks by status: ${status})` : ""} in root: ${projectRoot}`,
				);
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});

				// Resolve the path to tasks.json using the NORMALIZED projectRoot from args
				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: projectRoot, file: file },
						log,
					);
					log.info(`Resolved tasks path: ${tasksJsonPath}`);
				} catch (error) {
					const errorMessage = `Failed to find tasks.json: ${error.message || "File not found"}`;
					log.error(`[get-task tool] ${errorMessage}`);

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

				// Call the direct function, passing the normalized projectRoot
				const result = await showTaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						// Pass other relevant args
						id: id,
						status: status,
						projectRoot: projectRoot,
						tag: resolvedTag,
					},
					log,
					{ session },
				);

				if (result.success) {
					log.info(`成功检索到ID为 ${args.id} 的任务详情`);
				} else {
					log.error(`Failed to get task: ${result.error.message}`);
				}

				// Use our custom processor function
				return handleApiResult(
					result,
					log,
					"Error retrieving task details",
					processTaskResponse,
					projectRoot,
				);
			} catch (error) {
				const errorMessage = `获取任务失败: ${error.message || "未知错误"}`;
				log.error(`[get-task tool] ${errorMessage}`);

				// Get tag info for better error context
				const tagInfo = args.projectRoot
					? getTagInfo(args.projectRoot, log)
					: null;

				return createErrorResponse(
					errorMessage,
					undefined,
					tagInfo,
					"GET_TASK_FAILED",
					getTaskParameterHelp,
				);
			}
		}),
	});
}
