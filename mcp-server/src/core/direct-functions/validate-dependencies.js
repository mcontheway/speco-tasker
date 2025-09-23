/**
 * Direct function wrapper for validateDependenciesCommand
 */

import fs from "node:fs";
import { validateDependenciesCommand } from "../../../../scripts/modules/dependency-manager.js";
import {
	disableSilentMode,
	enableSilentMode,
} from "../../../../scripts/modules/utils.js";

/**
 * Validate dependencies in tasks.json
 * @param {Object} args - Function arguments
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} args.projectRoot - Project root path (for MCP/env fallback)
 * @param {string} args.tag - Tag for the task (optional)
 * @param {Object} log - Logger object
 * @returns {Promise<{success: boolean, data?: Object, error?: {code: string, message: string}}>}
 */
export async function validateDependenciesDirect(args, log) {
	// Destructure the explicit tasksJsonPath
	const { tasksJsonPath, projectRoot, tag } = args;

	if (!tasksJsonPath) {
		log.error("validateDependenciesDirect called without tasksJsonPath");
		return {
			success: false,
			error: {
				code: "MISSING_ARGUMENT",
				message: "需要 tasksJsonPath",
			},
		};
	}

	try {
		log.info(`Validating dependencies in tasks: ${tasksJsonPath}`);

		// Use the provided tasksJsonPath
		const tasksPath = tasksJsonPath;

		// Verify the file exists
		if (!fs.existsSync(tasksPath)) {
			return {
				success: false,
				error: {
					code: "FILE_NOT_FOUND",
					message: `在 ${tasksPath} 未找到任务文件`,
				},
			};
		}

		// Enable silent mode to prevent console logs from interfering with JSON response
		enableSilentMode();

		const options = { projectRoot, tag };
		// Call the original command function using the provided tasksPath
		await validateDependenciesCommand(tasksPath, options);

		// Restore normal logging
		disableSilentMode();

		return {
			success: true,
			data: {
				message: "依赖关系验证成功",
				tasksPath,
			},
		};
	} catch (error) {
		// Make sure to restore normal logging even if there's an error
		disableSilentMode();

		log.error(`Error validating dependencies: ${error.message}`);
		return {
			success: false,
			error: {
				code: "VALIDATION_ERROR",
				message: error.message,
			},
		};
	}
}
