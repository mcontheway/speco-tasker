/**
 * tools/add-dependency.js
 * Tool for adding a dependency to a task
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { addDependencyDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the addDependency tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerAddDependencyTool(server) {
	server.addTool({
		name: "add_dependency",
		description: "在两个任务之间添加依赖关系",
		parameters: z.object({
			id: z.string().describe("将依赖其他任务的任务ID"),
			dependsOn: z.string().describe("将成为依赖项的任务ID"),
			file: z
				.string()
				.optional()
				.describe("任务文件的绝对路径，默认为tasks/tasks.json"),
			projectRoot: z.string().optional().describe("项目根目录（可选，会自动检测）"),
			tag: z.string().optional().describe("选择要处理的任务分组"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(
					`Adding dependency for task ${args.id} to depend on ${args.dependsOn}`,
				);
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});
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

				// Call the direct function with the resolved path
				const result = await addDependencyDirect(
					{
						// Pass the explicitly resolved path
						tasksJsonPath: tasksJsonPath,
						// Pass other relevant args
						id: args.id,
						dependsOn: args.dependsOn,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
					// Remove context object
				);

				// Log result
				if (result.success) {
					log.info(`Successfully added dependency: ${result.data.message}`);
				} else {
					log.error(`Failed to add dependency: ${result.error.message}`);
				}

				// Use handleApiResult to format the response
				return handleApiResult(
					result,
					log,
					"Error adding dependency",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in addDependency tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}),
	});
}
