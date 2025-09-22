/**
 * Direct function wrapper for cross-tag task moves
 */

import { moveTasksBetweenTags } from "../../../../scripts/modules/task-manager/move-task.js";
import { findTasksPath } from "../utils/path-utils.js";

import {
	disableSilentMode,
	enableSilentMode,
} from "../../../../scripts/modules/utils.js";

/**
 * Move tasks between tags
 * @param {Object} args - Function arguments
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file
 * @param {string} args.sourceIds - Comma-separated IDs of tasks to move
 * @param {string} args.sourceTag - Source tag name
 * @param {string} args.targetTag - Target tag name
 * @param {boolean} args.withDependencies - Move dependent tasks along with main task
 * @param {boolean} args.ignoreDependencies - Break cross-tag dependencies during move
 * @param {string} args.file - Alternative path to the tasks.json file
 * @param {string} args.projectRoot - Project root directory
 * @param {Object} log - Logger object
 * @returns {Promise<{success: boolean, data?: Object, error?: Object}>}
 */
export async function moveTaskCrossTagDirect(args, log, context = {}) {
	const { session } = context;
	const { projectRoot } = args;

	log.info(`moveTaskCrossTagDirect called with args: ${JSON.stringify(args)}`);

	// Validate required parameters
	if (!args.sourceIds) {
		return {
			success: false,
			error: {
				message: "需要源任务ID",
				code: "MISSING_SOURCE_IDS",
			},
		};
	}

	if (!args.sourceTag) {
		return {
			success: false,
			error: {
				message: "跨标签移动需要源标签",
				code: "MISSING_SOURCE_TAG",
			},
		};
	}

	if (!args.targetTag) {
		return {
			success: false,
			error: {
				message: "跨标签移动需要目标标签",
				code: "MISSING_TARGET_TAG",
			},
		};
	}

	// Validate that source and target tags are different
	if (args.sourceTag === args.targetTag) {
		return {
			success: false,
			error: {
				message: `源标签和目标标签相同（"${args.sourceTag}"）`,
				code: "SAME_SOURCE_TARGET_TAG",
				suggestions: [
					"使用不同的标签进行跨标签移动",
					"使用 move_task 工具进行同标签内的移动",
					"使用 list_tags 工具查看可用标签",
				],
			},
		};
	}

	try {
		// Find tasks.json path if not provided
		let tasksPath = args.tasksJsonPath || args.file;
		if (!tasksPath) {
			if (!args.projectRoot) {
				return {
					success: false,
					error: {
						message:
							"如果未提供 tasksJsonPath，则需要项目根目录",
						code: "MISSING_PROJECT_ROOT",
					},
				};
			}
			tasksPath = findTasksPath(args, log);
		}

		// Enable silent mode to prevent console output during MCP operation
		enableSilentMode();

		try {
			// Parse source IDs
			const sourceIds = args.sourceIds.split(",").map((id) => id.trim());

			// Prepare move options
			const moveOptions = {
				withDependencies: args.withDependencies || false,
				ignoreDependencies: args.ignoreDependencies || false,
			};

			// Call the core moveTasksBetweenTags function
			const result = await moveTasksBetweenTags(
				tasksPath,
				sourceIds,
				args.sourceTag,
				args.targetTag,
				moveOptions,
				{ projectRoot },
			);

			return {
				success: true,
				data: {
					...result,
					message: `成功将 ${sourceIds.length} 个任务从 "${args.sourceTag}" 移动到 "${args.targetTag}"`,
					moveOptions,
					sourceTag: args.sourceTag,
					targetTag: args.targetTag,
				},
			};
		} finally {
			// Restore console output - always executed regardless of success or error
			disableSilentMode();
		}
	} catch (error) {
		log.error(`Failed to move tasks between tags: ${error.message}`);
		log.error(`Error code: ${error.code}, Error name: ${error.name}`);

		// Enhanced error handling with structured error objects
		let errorCode = "MOVE_TASK_CROSS_TAG_ERROR";
		let suggestions = [];

		// Handle structured errors first
		if (error.code === "CROSS_TAG_DEPENDENCY_CONFLICTS") {
			errorCode = "CROSS_TAG_DEPENDENCY_CONFLICT";
			suggestions = [
				"使用 --with-dependencies 参数将相关任务一起移动",
				"使用 --ignore-dependencies 参数断开跨标签依赖关系",
				"使用 validate_dependencies 工具检查依赖关系问题",
				"先移动依赖项，然后移动主任务",
			];
		} else if (error.code === "CANNOT_MOVE_SUBTASK") {
			errorCode = "SUBTASK_MOVE_RESTRICTION";
			suggestions = [
				"先使用 remove_subtask 工具将子任务转换为独立任务",
				"使用 withDependencies 参数移动父任务及其所有子任务",
			];
		} else if (
			error.code === "TASK_NOT_FOUND" ||
			error.code === "INVALID_SOURCE_TAG" ||
			error.code === "INVALID_TARGET_TAG"
		) {
			errorCode = "TAG_OR_TASK_NOT_FOUND";
			suggestions = [
				"使用 list_tags 工具查看可用标签",
				"使用 get_tasks 工具验证任务ID是否存在",
				"使用 get_task 工具查看任务详情",
			];
		} else if (error.message.includes("cross-tag dependency conflicts")) {
			// Fallback for legacy error messages
			errorCode = "CROSS_TAG_DEPENDENCY_CONFLICT";
			suggestions = [
				"Use --with-dependencies to move dependent tasks together",
				"Use --ignore-dependencies to break cross-tag dependencies",
				"使用 validate_dependencies 工具检查依赖关系问题",
				"Move dependencies first, then move the main task",
			];
		} else if (error.message.includes("无法移动子任务")) {
			// Fallback for legacy error messages
			errorCode = "SUBTASK_MOVE_RESTRICTION";
			suggestions = [
				"先使用 remove_subtask 工具将子任务转换为独立任务",
				"使用 withDependencies 参数移动父任务及其所有子任务",
			];
		} else if (error.message.includes("not found")) {
			// Fallback for legacy error messages
			errorCode = "TAG_OR_TASK_NOT_FOUND";
			suggestions = [
				"使用 list_tags 工具查看可用标签",
				"使用 get_tasks 工具验证任务ID是否存在",
				"使用 get_task 工具查看任务详情",
			];
		} else if (
			error.code === "TASK_ALREADY_EXISTS" ||
			error.message?.includes("already exists in target tag")
		) {
			// Target tag has an ID collision
			errorCode = "TASK_ALREADY_EXISTS";
			suggestions = [
				"Choose a different target tag without conflicting IDs",
				"Move a different set of IDs (avoid existing ones)",
				"If needed, move within-tag to a new ID first, then cross-tag move",
			];
		}

		return {
			success: false,
			error: {
				message: error.message,
				code: errorCode,
				suggestions,
			},
		};
	}
}
