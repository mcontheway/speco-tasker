/**
 * tools/remove-task.js
 * Tool to remove a task by ID
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { removeTaskDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the remove-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerRemoveTaskTool(server) {
	server.addTool({
		name: "remove_task",
		description: "从任务列表中永久删除任务或子任务",
		parameters: z.object({
			id: z
				.string()
				.describe(
					"要删除的任务或子任务ID（例如：'5' 或 '5.2'）。可逗号分隔同时更新多个任务/子任务。",
				),
			file: z.string().optional().describe("任务文件的绝对路径"),
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录（可选，会自动检测）"),
			confirm: z
				.boolean()
				.optional()
				.describe("是否跳过确认提示（默认：false）"),
			tag: z
				.string()
				.optional()
				.describe("指定要操作的标签上下文。默认为当前活动的标签。"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Removing task(s) with ID(s): ${args.id}`);

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
					log.error(`Error finding tasks.json: ${error.message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${error.message}`,
					);
				}

				log.info(`Using tasks file path: ${tasksJsonPath}`);

				const result = await removeTaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
					{ session },
				);

				if (result.success) {
					log.info(`成功移除任务：${args.id}`);
				} else {
					log.error(`Failed to remove task: ${result.error.message}`);
				}

				return handleApiResult(
					result,
					log,
					"Error removing task",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in remove-task tool: ${error.message}`);
				return createErrorResponse(`Failed to remove task: ${error.message}`);
			}
		}),
	});
}
