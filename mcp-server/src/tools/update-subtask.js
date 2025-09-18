/**
 * tools/update-subtask.js
 * Tool to append additional information to a specific subtask
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { updateSubtaskByIdDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the update-subtask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerUpdateSubtaskTool(server) {
	server.addTool({
		name: "update_subtask",
		description:
			"通过ID更新特定子任务的手动字段更改。支持完整替换和增量追加模式。",
		parameters: z.object({
			id: z
				.string()
				.describe(
					'要更新的子任务ID，格式为"父任务ID.子任务ID"（例如："5.2"）。父任务ID是包含该子任务的任务ID。',
				),
			// Manual field update parameters
			title: z.string().optional().describe("更新子任务标题"),
			description: z
				.string()
				.optional()
				.describe("更新子任务描述，支持追加模式"),
			status: z
				.string()
				.optional()
				.describe("更新子任务状态，支持pending, in-progress, done"),
			priority: z
				.string()
				.optional()
				.describe("更新子任务优先级，支持high, medium, low"),
			details: z
				.string()
				.optional()
				.describe("更新子任务实现细节，支持追加模式"),
			testStrategy: z
				.string()
				.optional()
				.describe("更新子任务测试策略，支持追加模式"),
			dependencies: z
				.string()
				.optional()
				.describe("更新子任务依赖关系，依赖的子任务ID列表，用逗号分隔"),
			spec_files: z
				.string()
				.optional()
				.describe("更新子任务规范文档文件路径列表，用逗号分隔"),
			logs: z
				.string()
				.optional()
				.describe("更新子任务相关的日志信息，支持追加模式"),
			// Update mode
			append: z
				.boolean()
				.optional()
				.describe("追加到描述/细节/测试策略/日志字段而不是替换，默认为true"),
			file: z.string().optional().describe("任务文件的绝对路径"),
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录（可选，会自动检测）"),
			tag: z.string().optional().describe("选择要处理的任务分组"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const toolName = "update_subtask";

			try {
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});
				log.info(`Updating subtask with args: ${JSON.stringify(args)}`);

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						log,
					);
				} catch (error) {
					log.error(`${toolName}: Error finding tasks.json: ${error.message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${error.message}`,
					);
				}

				// Prepare manual field update data
				const updateData = {
					fieldsToUpdate: {
						title: args.title,
						description: args.description,
						status: args.status,
						priority: args.priority,
						details: args.details,
						testStrategy: args.testStrategy,
						dependencies: args.dependencies,
						spec_files: args.spec_files,
						logs: args.logs,
					},
					appendMode: args.append !== false,
				};

				// Check if at least one field to update is provided
				const hasUpdates = Object.values(updateData.fieldsToUpdate).some(
					(value) => value !== undefined,
				);
				if (!hasUpdates) {
					return createErrorResponse(
						"必须至少提供一个要更新的字段",
						undefined,
						undefined,
						"NO_UPDATES_PROVIDED",
					);
				}

				const result = await updateSubtaskByIdDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						fieldsToUpdate: updateData.fieldsToUpdate,
						appendMode: updateData.appendMode,
						projectRoot: args.projectRoot,
						tag: resolvedTag,
					},
					log,
					{ session },
				);

				if (result.success) {
					log.info(`Successfully updated subtask with ID ${args.id}`);
				} else {
					log.error(
						`Failed to update subtask: ${result.error?.message || "Unknown error"}`,
					);
				}

				return handleApiResult(
					result,
					log,
					"Error updating subtask",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				log.error(
					`Critical error in ${toolName} tool execute: ${error.message}`,
				);
				return createErrorResponse(
					`Internal tool error (${toolName}): ${error.message}`,
				);
			}
		}),
	});
}
