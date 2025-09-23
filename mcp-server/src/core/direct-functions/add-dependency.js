/**
 * add-dependency.js
 * Direct function implementation for adding a dependency to a task
 */

import { addDependency } from "../../../../scripts/modules/dependency-manager.js";
import {
	disableSilentMode,
	enableSilentMode,
} from "../../../../scripts/modules/utils.js";

/**
 * Direct function wrapper for addDependency with error handling.
 *
 * @param {Object} args - Command arguments
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string|number} args.id - Task ID to add dependency to
 * @param {string|number} args.dependsOn - Task ID that will become a dependency
 * @param {string} args.tag - Tag for the task (optional)
 * @param {string} args.projectRoot - Project root path (for MCP/env fallback)
 * @param {Object} log - Logger object
 * @returns {Promise<Object>} - Result object with success status and data/error information
 */
export async function addDependencyDirect(args, log) {
	// Destructure expected args
	const { tasksJsonPath, id, dependsOn, tag, projectRoot } = args;
	try {
		log.info(`Adding dependency with args: ${JSON.stringify(args)}`);

		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			log.error("addDependencyDirect called without tasksJsonPath");
			return {
				success: false,
				error: {
					code: "MISSING_ARGUMENT",
					message: "需要 tasksJsonPath",
				},
			};
		}

		// Validate required parameters
		if (!id) {
			return {
				success: false,
				error: {
					code: "INPUT_VALIDATION_ERROR",
					message: "需要任务ID (id)",
				},
			};
		}

		if (!dependsOn) {
			return {
				success: false,
				error: {
					code: "INPUT_VALIDATION_ERROR",
					message: "需要依赖ID (dependsOn)",
				},
			};
		}

		// Use provided path
		const tasksPath = tasksJsonPath;

		// Format IDs for the core function
		const taskId = id?.includes?.(".") ? id : Number.parseInt(id, 10);
		const dependencyId = dependsOn?.includes?.(".")
			? dependsOn
			: Number.parseInt(dependsOn, 10);

		log.info(
			`Adding dependency: task ${taskId} will depend on ${dependencyId}`,
		);

		// Enable silent mode to prevent console logs from interfering with JSON response
		enableSilentMode();

		// Create context object
		const context = { projectRoot, tag };

		// Call the core function using the provided path
		await addDependency(tasksPath, taskId, dependencyId, context);

		// Restore normal logging
		disableSilentMode();

		return {
			success: true,
			data: {
				message: `成功添加依赖关系：任务 ${taskId} 现在依赖于 ${dependencyId}`,
				taskId: taskId,
				dependencyId: dependencyId,
			},
		};
	} catch (error) {
		// Make sure to restore normal logging even if there's an error
		disableSilentMode();

		log.error(`Error in addDependencyDirect: ${error.message}`);
		return {
			success: false,
			error: {
				code: "CORE_FUNCTION_ERROR",
				message: error.message,
			},
		};
	}
}
