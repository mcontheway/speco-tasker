/**
 * tools/validate-dependencies.js
 * Tool for validating task dependencies
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { validateDependenciesDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the validateDependencies tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerValidateDependenciesTool(server) {
	server.addTool({
		name: "validate_dependencies",
		description:
			"检查任务的依赖关系问题（如循环引用或指向不存在的任务），不进行任何修改。",
		parameters: z.object({
			file: z.string().optional().describe("任务文件的绝对路径"),
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录（可选，会自动检测）"),
			tag: z.string().optional().describe("选择要处理的任务分组"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});
				log.info(`Validating dependencies with args: ${JSON.stringify(args)}`);

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

				const result = await validateDependenciesDirect(
					{
						tasksJsonPath: tasksJsonPath,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
				);

				if (result.success) {
					log.info(
						`Successfully validated dependencies: ${result.data.message}`,
					);
				} else {
					log.error(`Failed to validate dependencies: ${result.error.message}`);
				}

				return handleApiResult(
					result,
					log,
					"Error validating dependencies",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(`Error in validateDependencies tool: ${error.message}`);
				return createErrorResponse(error.message);
			}
		}),
	});
}
