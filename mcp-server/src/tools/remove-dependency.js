/**
 * tools/remove-dependency.js
 * Tool for removing a dependency from a task
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { removeDependencyDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the removeDependency tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerRemoveDependencyTool(server) {
	server.addTool({
		name: "remove_dependency",
		description: "从任务中移除依赖关系",
		parameters: z.object({
			id: z.string().describe("Task ID to remove dependency from"),
			dependsOn: z.string().describe("Task ID to remove as a dependency"),
			file: z
				.string()
				.optional()
				.describe(
					"任务文件的绝对路径（默认：tasks/tasks.json）",
				),
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
				log.info(
					`Removing dependency for task ${args.id} from ${args.dependsOn} with args: ${JSON.stringify(args)}`,
				);

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

				const result = await removeDependencyDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						dependsOn: args.dependsOn,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
				);

				if (result.success) {
					log.info(`Successfully removed dependency: ${result.data.message}`);
				} else {
					log.error(`Failed to remove dependency: ${result.error.message}`);
				}

				return handleApiResult(
					result,
					log,
					"Error removing dependency",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in removeDependency tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}),
	});
}
