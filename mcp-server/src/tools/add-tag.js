/**
 * tools/add-tag.js
 * Tool to create a new tag
 */

import { z } from "zod";
import { addTagDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the addTag tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerAddTagTool(server) {
	server.addTool({
		name: "add_tag",
		description: "创建新标签来组织不同上下文的任务",
		parameters: z.object({
			name: z.string().describe("要创建的新标签名称"),
			copyFromCurrent: z
				.boolean()
				.optional()
				.describe("是否从当前标签复制任务到新标签，默认为false"),
			copyFromTag: z.string().optional().describe("要复制任务的特定标签"),
			fromBranch: z
				.boolean()
				.optional()
				.describe("从当前git分支创建标签名称，忽略name参数"),
			description: z.string().optional().describe("标签的可选描述"),
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
				log.info(`Starting add-tag with args: ${JSON.stringify(args)}`);

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
				const result = await addTagDirect(
					{
						tasksJsonPath: tasksJsonPath,
						name: args.name,
						copyFromCurrent: args.copyFromCurrent,
						copyFromTag: args.copyFromTag,
						fromBranch: args.fromBranch,
						description: args.description,
						projectRoot: args.projectRoot,
					},
					log,
					{ session },
				);

				return handleApiResult(
					result,
					log,
					"Error creating tag",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in add-tag tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}),
	});
}
