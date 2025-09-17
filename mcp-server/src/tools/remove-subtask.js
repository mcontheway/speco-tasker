/**
 * tools/remove-subtask.js
 * Tool for removing subtasks from parent tasks
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { removeSubtaskDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the removeSubtask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerRemoveSubtaskTool(server) {
	server.addTool({
		name: "remove_subtask",
		description: "从父任务中移除子任务",
		parameters: z.object({
			id: z
				.string()
				.describe(
					"Subtask ID to remove in format 'parentId.subtaskId' (required)",
				),
			convert: z
				.boolean()
				.optional()
				.describe(
					"Convert the subtask to a standalone task instead of deleting it",
				),
			file: z
				.string()
				.optional()
				.describe(
					"任务文件的绝对路径（默认：tasks/tasks.json）",
				),
			skipGenerate: z
				.boolean()
				.optional()
				.describe("跳过重新生成任务文件"),
			projectRoot: z
				.string()
				.describe("项目目录，必须是绝对路径"),
			tag: z.string().optional().describe("选择要处理的任务分组"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});
				log.info(`Removing subtask with args: ${JSON.stringify(args)}`);

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

				const result = await removeSubtaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						convert: args.convert,
						skipGenerate: args.skipGenerate,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
					{ session },
				);

				if (result.success) {
					log.info(`Subtask removed successfully: ${result.data.message}`);
				} else {
					log.error(`Failed to remove subtask: ${result.error.message}`);
				}

				return handleApiResult(
					result,
					log,
					"Error removing subtask",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in removeSubtask tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}),
	});
}
