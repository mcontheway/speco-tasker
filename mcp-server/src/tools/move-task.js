/**
 * tools/move-task.js
 * Tool for moving tasks or subtasks to a new position
 */

import { z } from "zod";
import { resolveTag } from "../../../scripts/modules/utils.js";
import {
	moveTaskCrossTagDirect,
	moveTaskDirect,
} from "../core/task-master-core.js";
import { findTasksPath } from "../core/utils/path-utils.js";
import {
	createErrorResponse,
	getTagInfo,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";

/**
 * Register the moveTask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerMoveTaskTool(server) {
	server.addTool({
		name: "move_task",
		description: `将任务或子任务移动到新位置

支持两种移动模式：
• 标签内移动：使用 'from' 和 'to' 参数，将任务移动到同一标签内的不同位置
• 跨标签移动：使用 'from', 'fromTag', 'toTag' 参数，将任务移动到其他标签

示例：
• 标签内移动单个任务：{"from": "5", "to": "3.1"}
• 标签内移动多个任务：{"from": "5,6", "to": "3.1,3.2"}
• 跨标签移动：{"from": "5,6", "fromTag": "main", "toTag": "backend"}`,
		parameters: z.object({
			from: z
				.string()
				.describe(
					'要移动的任务或子任务ID（例如："5" 或 "5.2"）。可逗号分隔同时移动多个任务（例如："5,6,7"）',
				),
			to: z
				.string()
				.optional()
				.describe(
					'目标ID，仅用于标签内移动（例如："7" 或 "7.3"）。跨标签移动时请勿使用此参数',
				),
			file: z.string().optional().describe("自定义tasks.json文件路径"),
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录（可选，会自动检测）"),
			tag: z.string().optional().describe("标签内移动时使用的标签上下文（可选，会使用当前标签）"),
			fromTag: z.string().optional().describe("跨标签移动的源标签名称"),
			toTag: z.string().optional().describe("跨标签移动的目标标签名称"),
			withDependencies: z
				.boolean()
				.optional()
				.describe("同时移动主任务的依赖任务"),
			ignoreDependencies: z
				.boolean()
				.optional()
				.describe("在跨标签移动期间断开依赖关系"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				// Check if this is a cross-tag move
				const isCrossTagMove =
					args.fromTag && args.toTag && args.fromTag !== args.toTag;

				if (isCrossTagMove) {
					// Cross-tag move logic
					if (!args.from) {
						return createErrorResponse(
							"跨标签移动需要指定 'from' 参数（要移动的任务ID）",
							"MISSING_SOURCE_IDS",
						);
					}

					// Warn if 'to' parameter is provided for cross-tag moves
					if (args.to) {
						log.warn(
							'The "to" parameter is not used for cross-tag moves and will be ignored. Tasks retain their original IDs in the target tag.',
						);
					}

					// Find tasks.json path if not provided
					let tasksJsonPath = args.file;
					if (!tasksJsonPath) {
						tasksJsonPath = findTasksPath(args, log);
					}

					// Use cross-tag move function
					return handleApiResult(
						await moveTaskCrossTagDirect(
							{
								sourceIds: args.from,
								sourceTag: args.fromTag,
								targetTag: args.toTag,
								withDependencies: args.withDependencies || false,
								ignoreDependencies: args.ignoreDependencies || false,
								tasksJsonPath,
								projectRoot: args.projectRoot,
							},
							log,
							{ session },
						),
						log,
						"Error moving tasks between tags",
						undefined,
						args.projectRoot,
					);
				}
				// Within-tag move logic (existing functionality)
				if (!args.to) {
					return createErrorResponse(
						"标签内移动需要指定 'to' 参数（目标位置ID）。如果要进行跨标签移动，请使用 'fromTag' 和 'toTag' 参数",
						"MISSING_DESTINATION_ID",
					);
				}

				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag,
				});

				// Find tasks.json path if not provided
				let tasksJsonPath = args.file;
				if (!tasksJsonPath) {
					tasksJsonPath = findTasksPath(args, log);
				}

				// Parse comma-separated IDs
				const fromIds = args.from.split(",").map((id) => id.trim());
				const toIds = args.to.split(",").map((id) => id.trim());

				// Validate matching IDs count
				if (fromIds.length !== toIds.length) {
					if (fromIds.length > 1) {
						const results = [];
						const skipped = [];
						// Move tasks one by one, only generate files on the last move
						for (let i = 0; i < fromIds.length; i++) {
							const fromId = fromIds[i];
							const toId = toIds[i];

							// Skip if source and destination are the same
							if (fromId === toId) {
								log.info(`Skipping ${fromId} -> ${toId} (same ID)`);
								skipped.push({ fromId, toId, reason: "same ID" });
								continue;
							}

							const shouldGenerateFiles = i === fromIds.length - 1;
							const result = await moveTaskDirect(
								{
									sourceId: fromId,
									destinationId: toId,
									tasksJsonPath,
									projectRoot: args.projectRoot,
									tag: resolvedTag,
									generateFiles: shouldGenerateFiles,
								},
								log,
								{ session },
							);

							if (!result.success) {
								log.error(
									`Failed to move ${fromId} to ${toId}: ${result.error.message}`,
								);
							} else {
								results.push(result.data);
							}
						}

						return handleApiResult(
							{
								success: true,
								data: {
									moves: results,
									skipped: skipped.length > 0 ? skipped : undefined,
									message: `成功移动 ${results.length} 个任务${skipped.length > 0 ? `，跳过 ${skipped.length} 个` : ""}`,
								},
							},
							log,
							"Error moving multiple tasks",
							undefined,
							args.projectRoot,
						);
					}
					return handleApiResult(
						{
							success: true,
							data: {
								moves: results,
								skippedMoves: skippedMoves,
								message: `成功移动 ${results.length} 个任务${skippedMoves.length > 0 ? `，跳过 ${skippedMoves.length} 次移动` : ""}`,
							},
						},
						log,
						"Error moving multiple tasks",
						undefined,
						args.projectRoot,
					);
				}
				// Moving a single task
				return handleApiResult(
					await moveTaskDirect(
						{
							sourceId: args.from,
							destinationId: args.to,
							tasksJsonPath,
							projectRoot: args.projectRoot,
							tag: resolvedTag,
							generateFiles: true,
						},
						log,
						{ session },
					),
					log,
					"Error moving task",
					undefined,
					args.projectRoot,
				);
			} catch (error) {
				const errorMessage = `Failed to move task: ${error.message || "Unknown error"}`;
				log.error(`[move-task tool] ${errorMessage}`);

				// Get tag info for better error context
				const tagInfo = args.projectRoot
					? getTagInfo(args.projectRoot, log)
					: null;

				return createErrorResponse(
					errorMessage,
					undefined,
					tagInfo,
					"MOVE_TASK_ERROR",
				);
			}
		}),
	});
}
