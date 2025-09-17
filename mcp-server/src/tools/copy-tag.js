/**
 * tools/copy-tag.js
 * Tool to copy an existing tag to a new tag
 */

import { z } from "zod";
import { copyTagDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the copyTag tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerCopyTagTool(server) {
	server.addTool({
		name: "copy_tag",
		description: "复制现有标签来创建包含所有任务和元数据的新标签",
		parameters: z.object({
			sourceName: z.string().describe("要复制的源标签名称"),
			targetName: z.string().describe("要创建的新标签名称"),
			description: z.string().optional().describe("新标签的可选描述"),
			file: z
				.string()
				.optional()
				.describe("任务文件路径，默认为tasks/tasks.json"),
			projectRoot: z.string().describe("项目目录，必须是绝对路径"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Starting copy-tag with args: ${JSON.stringify(args)}`);

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
				const result = await copyTagDirect(
					{
						tasksJsonPath: tasksJsonPath,
						sourceName: args.sourceName,
						targetName: args.targetName,
						description: args.description,
						projectRoot: args.projectRoot,
					},
					log,
					{ session },
				);

				return handleApiResult(
					result,
					log,
					"Error copying tag",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in copy-tag tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}),
	});
}
