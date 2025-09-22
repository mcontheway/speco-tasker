/**
 * add-task.js
 * Direct function implementation for adding a new task
 */

import { addTask } from "../../../../scripts/modules/task-manager.js";
import {
	disableSilentMode,
	enableSilentMode,
} from "../../../../scripts/modules/utils.js";
import { createLogWrapper } from "../../tools/utils.js";

/**
 * Direct function wrapper for adding a new task with error handling.
 *
 * @param {Object} args - Command arguments
 * @param {string} args.title - Task title (required)
 * @param {string} args.description - Task description (required)
 * @param {string} [args.details] - Implementation details (for manual task creation)
 * @param {string} [args.testStrategy] - Test strategy (for manual task creation)
 * @param {string} [args.dependencies] - Comma-separated list of task IDs this task depends on
 * @param {string} [args.priority='medium'] - Task priority (high, medium, low)
 * @param {string} [args.tasksJsonPath] - Path to the tasks.json file (resolved by tool)
 * @param {boolean} [args.research=false] - Deprecated: Research functionality removed
 * @param {string} [args.projectRoot] - Project root path
 * @param {string} [args.tag] - Tag for the task (optional)
 * @param {Object} log - Logger object
 * @param {Object} context - Additional context (session)
 * @returns {Promise<Object>} - Result object { success: boolean, data?: any, error?: { code: string, message: string } }
 */
export async function addTaskDirect(args, log, context = {}) {
	// Destructure expected args
	const {
		tasksJsonPath,
		dependencies,
		priority,
		projectRoot,
		tag,
		spec_files,
		logs,
	} = args;
	const { session } = context; // Destructure session from context

	// Enable silent mode to prevent console logs from interfering with JSON response
	enableSilentMode();

	// Create logger wrapper using the utility
	const mcpLog = createLogWrapper(log);

	try {
		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			log.error("addTaskDirect called without tasksJsonPath");
			disableSilentMode(); // Disable before returning
			return {
				success: false,
				error: {
					code: "MISSING_ARGUMENT",
					message: "需要 tasksJsonPath",
				},
			};
		}

		// Use provided path
		const tasksPath = tasksJsonPath;

		// Check if this is manual task creation with all required fields for spec-driven development
		const isManualCreation =
			args.title &&
			args.description &&
			args.details &&
			args.testStrategy &&
			args.spec_files;

		// Check required parameters for spec-driven development
		if (!isManualCreation) {
			log.error("Missing required parameters for spec-driven development");
			disableSilentMode();
			return {
				success: false,
				error: {
					code: "MISSING_PARAMETER",
					message:
						"All required fields must be provided for spec-driven development: title, description, details, testStrategy, spec_files",
				},
			};
		}

		// Extract and prepare parameters
		const taskDependencies = Array.isArray(dependencies)
			? dependencies // Already an array if passed directly
			: dependencies // Check if dependencies exist and are a string
				? String(dependencies)
						.split(",")
						.map((id) => Number.parseInt(id.trim(), 10)) // Split, trim, and parse
				: []; // Default to empty array if null/undefined
		const taskPriority = priority || "medium"; // Default priority

		let manualTaskData = null;
		let newTaskId;

		if (isManualCreation) {
			// Process spec_files into array format for spec-driven development
			let processedSpecFiles = [];
			if (typeof args.spec_files === "string") {
				processedSpecFiles = args.spec_files.split(",").map((f) => {
					const trimmed = f.trim();
					return {
						type: "spec",
						title: trimmed.split("/").pop() || "Specification Document",
						file: trimmed,
					};
				});
			} else if (Array.isArray(args.spec_files)) {
				processedSpecFiles = args.spec_files;
			}

			// Create manual task data object with all required fields for spec-driven development
			manualTaskData = {
				title: args.title,
				description: args.description,
				details: args.details,
				testStrategy: args.testStrategy,
				spec_files: processedSpecFiles,
				logs: logs || "",
			};

			log.info(
				`Adding new task manually with title: "${args.title}", dependencies: [${taskDependencies.join(", ")}], priority: ${taskPriority}`,
			);

			// Call the addTask function with manual task data
			const result = await addTask(
				tasksPath,
				taskDependencies,
				taskPriority,
				{
					session,
					mcpLog,
					projectRoot,
					commandName: "add-task",
					outputType: "mcp",
					tag,
				},
				"json", // outputFormat
				manualTaskData, // Pass the manual task data
			);
			newTaskId = result.newTaskId;
		}

		// Restore normal logging
		disableSilentMode();

		return {
			success: true,
			data: {
				taskId: newTaskId,
				message: `成功添加新任务 #${newTaskId}`,
			},
		};
	} catch (error) {
		// Make sure to restore normal logging even if there's an error
		disableSilentMode();

		log.error(`Error in addTaskDirect: ${error.message}`);
		// Add specific error code checks if needed
		return {
			success: false,
			error: {
				code: error.code || "ADD_TASK_ERROR", // Use error code if available
				message: error.message,
			},
		};
	}
}
