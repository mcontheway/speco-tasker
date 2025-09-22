/**
 * Direct function wrapper for clearSubtasks
 */

import fs from "node:fs";
import path from "node:path";
import { clearSubtasks } from "../../../../scripts/modules/task-manager.js";
import {
	disableSilentMode,
	enableSilentMode,
	readJSON,
} from "../../../../scripts/modules/utils.js";

/**
 * Clear subtasks from specified tasks
 * @param {Object} args - Function arguments
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} [args.id] - Task IDs (comma-separated) to clear subtasks from
 * @param {boolean} [args.all] - Clear subtasks from all tasks
 * @param {string} [args.tag] - Tag context to operate on (defaults to current active tag)
 * @param {string} [args.projectRoot] - Project root path (for MCP/env fallback)
 * @param {Object} log - Logger object
 * @returns {Promise<{success: boolean, data?: Object, error?: {code: string, message: string}}>}
 */
export async function clearSubtasksDirect(args, log) {
	// Destructure expected args
	const { tasksJsonPath, id, all, tag, projectRoot } = args;
	try {
		log.info(`Clearing subtasks with args: ${JSON.stringify(args)}`);

		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			log.error("clearSubtasksDirect called without tasksJsonPath");
			return {
				success: false,
				error: {
					code: "MISSING_ARGUMENT",
					message: "需要 tasksJsonPath",
				},
			};
		}

		// Either id or all must be provided
		if (!id && !all) {
			return {
				success: false,
				error: {
					code: "INPUT_VALIDATION_ERROR",
					message:
						"必须提供 id 参数的任务ID或 all 参数",
				},
			};
		}

		// Use provided path
		const tasksPath = tasksJsonPath;

		// Check if tasks.json exists
		if (!fs.existsSync(tasksPath)) {
			return {
				success: false,
				error: {
					code: "FILE_NOT_FOUND_ERROR",
					message: `在 ${tasksPath} 未找到任务文件`,
				},
			};
		}

		let taskIds;

		// Use readJSON which handles silent migration and tag resolution
		const data = readJSON(tasksPath, projectRoot, tag);

		if (!data || !data.tasks) {
			return {
				success: false,
				error: {
					code: "INPUT_VALIDATION_ERROR",
					message: `在任务文件 ${tasksPath} 中未找到任务`,
				},
			};
		}

		const currentTag = data.tag || tag;
		const tasks = data.tasks;

		// If all is specified, get all task IDs
		if (all) {
			log.info(`Clearing subtasks from all tasks in tag '${currentTag}'`);
			if (tasks.length === 0) {
				return {
					success: false,
					error: {
						code: "INPUT_VALIDATION_ERROR",
						message: `在标签上下文 '${currentTag}' 中未找到任务`,
					},
				};
			}
			taskIds = tasks.map((t) => t.id).join(",");
		} else {
			// Use the provided task IDs
			taskIds = id;
		}

		log.info(`Clearing subtasks from tasks: ${taskIds} in tag '${currentTag}'`);

		// Enable silent mode to prevent console logs from interfering with JSON response
		enableSilentMode();

		// Call the core function
		clearSubtasks(tasksPath, taskIds, { projectRoot, tag: currentTag });

		// Restore normal logging
		disableSilentMode();

		// Read the updated data to provide a summary
		const updatedData = readJSON(tasksPath, projectRoot, currentTag);
		const taskIdArray = taskIds
			.split(",")
			.map((id) => Number.parseInt(id.trim(), 10));

		// Build a summary of what was done
		const clearedTasksCount = taskIdArray.length;
		const updatedTasks = updatedData.tasks || [];

		const taskSummary = taskIdArray.map((id) => {
			const task = updatedTasks.find((t) => t.id === id);
			return task ? { id, title: task.title } : { id, title: "任务未找到" };
		});

		return {
			success: true,
			data: {
				message: `成功从标签 '${currentTag}' 中的 ${clearedTasksCount} 个任务清除子任务`,
				tasksCleared: taskSummary,
				tag: currentTag,
			},
		};
	} catch (error) {
		// Make sure to restore normal logging even if there's an error
		disableSilentMode();

		log.error(`Error in clearSubtasksDirect: ${error.message}`);
		return {
			success: false,
			error: {
				code: "CORE_FUNCTION_ERROR",
				message: error.message,
			},
		};
	}
}
