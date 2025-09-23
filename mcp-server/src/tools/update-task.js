/**
 * tools/update-task.js
 * Tool to update a single task by ID with new information
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import { updateTaskByIdDirect } from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the update-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerUpdateTaskTool(server) {
	server.addTool({
		name: "update_task",
		description:
			"通过ID更新单个任务的手动字段更改。支持完整替换和增量追加模式。",
		parameters: z.object({
			id: z
				.string() // ID can be number or string like "1.2"
				.describe(
					"要更新的任务ID，支持格式如'15'，子任务请使用update-subtask工具",
				),
			// Manual field update parameters
			title: z.string().optional().describe("更新任务标题"),
			description: z.string().optional().describe("更新任务描述，支持追加模式"),
			status: z
				.string()
				.optional()
				.describe("更新任务状态，支持pending, in-progress, done"),
			priority: z
				.string()
				.optional()
				.describe("更新任务优先级，支持high, medium, low"),
			details: z.string().optional().describe("更新任务实现细节，支持追加模式"),
			testStrategy: z
				.string()
				.optional()
				.describe("更新任务测试策略，支持追加模式"),
			dependencies: z
				.string()
				.optional()
				.describe("更新任务依赖关系，依赖的任务ID列表，用逗号分隔"),
			spec_files: z
				.array(
					z.object({
						type: z
							.enum(["plan", "spec", "requirement", "design", "test", "other"])
							.describe('文档类型：plan（计划）、spec（规格）、requirement（需求）、design（设计）、test（测试）、other（其他）'),
						title: z.string().describe("文档标题"),
						file: z.string().describe("文档文件路径"),
					}),
				)
				.optional()
				.describe("更新规范文档列表，每个文档包含类型、标题和文件路径"),
			logs: z
				.string()
				.optional()
				.describe("更新任务相关的日志信息，支持追加模式"),
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
			const toolName = "update_task";
			try {
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});
				log.info(
					`Executing ${toolName} tool with args: ${JSON.stringify(args)}`,
				);

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						log,
					);
					log.info(`${toolName}: Resolved tasks path: ${tasksJsonPath}`);
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
						dependencies: args.dependencies
							? args.dependencies.split(",").map((id) => id.trim()).filter((id) => id.length > 0)
							: undefined,
						spec_files: args.spec_files || undefined,
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

				// 3. Call Direct Function with manual update parameters
				const result = await updateTaskByIdDirect(
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

				// 4. Handle Result
				log.info(
					`${toolName}: Direct function result: success=${result.success}`,
				);
				return handleApiResult(
					result,
					log,
					"Error updating task",
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
