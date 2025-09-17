/**
 * update-subtask-by-id.js
 * Direct function implementation for appending information to a specific subtask
 */

import { updateSubtaskManually } from "../../../../scripts/modules/task-manager/update-subtask-manually.js";
import {
	disableSilentMode,
	enableSilentMode,
	isSilentMode,
} from "../../../../scripts/modules/utils.js";
import { createLogWrapper } from "../../tools/utils.js";

/**
 * Direct function wrapper for manual subtask field updates with error handling.
 *
 * @param {Object} args - Command arguments containing manual field update parameters.
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} args.id - Subtask ID in format "parent.sub".
 * @param {object} args.fieldsToUpdate - Object containing fields to update (title, description, etc.).
 * @param {boolean} [args.appendMode] - Whether to append to text fields instead of replacing.
 * @param {string} [args.projectRoot] - Project root path.
 * @param {string} [args.tag] - Tag for the task (optional)
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and data/error information.
 */
export async function updateSubtaskByIdDirect(args, log, context = {}) {
	const { session } = context;
	// Destructure expected args
	const { tasksJsonPath, id, fieldsToUpdate, appendMode, projectRoot, tag } =
		args;

	const logWrapper = createLogWrapper(log);

	try {
		logWrapper.info(
			`Updating subtask by ID via direct function. ID: ${id}, ProjectRoot: ${projectRoot}`,
		);

		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			const errorMessage = "tasksJsonPath is required but was not provided.";
			logWrapper.error(errorMessage);
			return {
				success: false,
				error: { code: "MISSING_ARGUMENT", message: errorMessage },
			};
		}

		// Basic validation for ID format (e.g., '5.2')
		if (!id || typeof id !== "string" || !id.includes(".")) {
			const errorMessage =
				'Invalid subtask ID format. Must be in format "parentId.subtaskId" (e.g., "5.2").';
			logWrapper.error(errorMessage);
			return {
				success: false,
				error: { code: "INVALID_SUBTASK_ID", message: errorMessage },
			};
		}

		if (!fieldsToUpdate) {
			const errorMessage =
				"No fields to update specified. Please provide at least one field to update.";
			logWrapper.error(errorMessage);
			return {
				success: false,
				error: { code: "MISSING_FIELDS", message: errorMessage },
			};
		}

		// Check if at least one field to update is provided
		const hasUpdates = Object.values(fieldsToUpdate).some(
			(value) => value !== undefined,
		);
		if (!hasUpdates) {
			const errorMessage =
				"No field values provided. Please provide at least one field to update.";
			logWrapper.error(errorMessage);
			return {
				success: false,
				error: { code: "NO_UPDATES_PROVIDED", message: errorMessage },
			};
		}

		// Validate subtask ID format
		const subtaskId = id;
		if (typeof subtaskId !== "string" && typeof subtaskId !== "number") {
			const errorMessage = `Invalid subtask ID type: ${typeof subtaskId}. Subtask ID must be a string or number.`;
			log.error(errorMessage);
			return {
				success: false,
				error: { code: "INVALID_SUBTASK_ID_TYPE", message: errorMessage },
			};
		}

		const subtaskIdStr = String(subtaskId);
		if (!subtaskIdStr.includes(".")) {
			const errorMessage = `Invalid subtask ID format: ${subtaskIdStr}. Subtask ID must be in format "parentId.subtaskId" (e.g., "5.2").`;
			log.error(errorMessage);
			return {
				success: false,
				error: { code: "INVALID_SUBTASK_ID_FORMAT", message: errorMessage },
			};
		}

		// Use the provided path
		const tasksPath = tasksJsonPath;
		log.info(
			`Updating subtask with ID ${subtaskIdStr} with fields: ${Object.keys(fieldsToUpdate).join(", ")} ${appendMode ? "(append mode)" : "(replace mode)"}`,
		);

		const wasSilent = isSilentMode();
		if (!wasSilent) {
			enableSilentMode();
		}

		try {
			// Parse subtask ID to get parent and subtask IDs
			const [parentIdStr, actualSubtaskIdStr] = subtaskIdStr.split(".");
			const parentId = Number.parseInt(parentIdStr, 10);
			const actualSubtaskId = Number.parseInt(actualSubtaskIdStr, 10);

			// Execute core updateSubtaskManually function
			const coreResult = await updateSubtaskManually(
				tasksPath,
				parentId,
				actualSubtaskId,
				fieldsToUpdate,
				{
					projectRoot,
					tag,
					appendMode: appendMode || false,
				},
			);

			// Check if the update was successful
			if (coreResult.success) {
				const successMessage = `Successfully updated subtask with ID ${subtaskIdStr}`;
				logWrapper.success(successMessage);
				return {
					success: true,
					data: {
						message: successMessage,
						subtaskId: actualSubtaskId,
						parentId: parentId,
						tasksPath,
						updated: true,
						updatedFields: coreResult.updatedFields,
					},
				};
			} else {
				// Update failed
				const errorMessage =
					coreResult.error?.message || "Unknown error updating subtask";
				logWrapper.error(`Subtask update failed: ${errorMessage}`);
				return {
					success: false,
					error: {
						code: "UPDATE_FAILED",
						message: errorMessage,
					},
				};
			}
		} catch (error) {
			logWrapper.error(`Error updating subtask by ID: ${error.message}`);
			return {
				success: false,
				error: {
					code: "UPDATE_SUBTASK_CORE_ERROR",
					message: error.message || "Unknown error updating subtask",
				},
			};
		} finally {
			if (!wasSilent && isSilentMode()) {
				disableSilentMode();
			}
		}
	} catch (error) {
		logWrapper.error(
			`Setup error in updateSubtaskByIdDirect: ${error.message}`,
		);
		if (isSilentMode()) disableSilentMode();
		return {
			success: false,
			error: {
				code: "DIRECT_FUNCTION_SETUP_ERROR",
				message: error.message || "Unknown setup error",
			},
		};
	}
}
