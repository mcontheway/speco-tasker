/**
 * tools/list-tags.js
 * Tool to list all available tags
 */

import { z } from "zod";
import { listTagsDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the listTags tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerListTagsTool(server) {
	server.addTool({
		name: "list_tags",
		description: "列出所有可用标签及其任务数量和元数据",
		parameters: z.object({
			showMetadata: z
				.boolean()
				.optional()
				.describe("是否在输出中包含元数据，默认为false"),
			file: z
				.string()
				.optional()
				.describe("任务文件路径，默认为tasks/tasks.json"),
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录（可选，会自动检测）"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Starting list-tags with args: ${JSON.stringify(args)}`);

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

				// Call the direct function
				const result = await listTagsDirect(
					{
						tasksJsonPath: tasksJsonPath,
						showMetadata: args.showMetadata,
						projectRoot: args.projectRoot,
					},
					log,
					{ session },
				);

				return handleApiResult(
					result,
					log,
					"Error listing tags",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in list-tags tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}),
	});
}
