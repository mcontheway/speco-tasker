/**
 * update-task-by-id.js
 * Direct function implementation for updating a single task by ID with new information
 */

import { updateTaskManually } from '../../../../scripts/modules/task-manager/update-task-manually.js'
import {
	disableSilentMode,
	enableSilentMode,
	isSilentMode
} from '../../../../scripts/modules/utils.js'
import { createLogWrapper } from '../../tools/utils.js'

/**
 * Direct function wrapper for manual task field updates with error handling.
 *
 * @param {Object} args - Command arguments containing manual field update parameters.
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} args.id - Task ID (or subtask ID like "1.2").
 * @param {object} args.fieldsToUpdate - Object containing fields to update (title, description, etc.).
 * @param {boolean} [args.appendMode] - Whether to append to text fields instead of replacing.
 * @param {string} [args.projectRoot] - Project root path.
 * @param {string} [args.tag] - Tag for the task (optional)
 * @param {Object} log - Logger object.
 * @param {Object} context - Context object containing session data.
 * @returns {Promise<Object>} - Result object with success status and data/error information.
 */
export async function updateTaskByIdDirect(args, log, context = {}) {
	const { session } = context
	// Destructure expected args
	const { tasksJsonPath, id, fieldsToUpdate, appendMode, projectRoot, tag } = args

	const logWrapper = createLogWrapper(log)

	try {
		logWrapper.info(
			`Updating task by ID via direct function. ID: ${id}, ProjectRoot: ${projectRoot}`
		)

		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			const errorMessage = 'tasksJsonPath is required but was not provided.'
			logWrapper.error(errorMessage)
			return {
				success: false,
				error: { code: 'MISSING_ARGUMENT', message: errorMessage }
			}
		}

		// Check required parameters
		if (!id) {
			const errorMessage = 'No task ID specified. Please provide a task ID to update.'
			logWrapper.error(errorMessage)
			return {
				success: false,
				error: { code: 'MISSING_TASK_ID', message: errorMessage }
			}
		}

		if (!fieldsToUpdate) {
			const errorMessage = 'No fields to update specified. Please provide at least one field to update.'
			logWrapper.error(errorMessage)
			return {
				success: false,
				error: { code: 'MISSING_FIELDS', message: errorMessage }
			}
		}

		// Check if at least one field to update is provided
		const hasUpdates = Object.values(fieldsToUpdate).some((value) => value !== undefined)
		if (!hasUpdates) {
			const errorMessage = 'No field values provided. Please provide at least one field to update.'
			logWrapper.error(errorMessage)
			return {
				success: false,
				error: { code: 'NO_UPDATES_PROVIDED', message: errorMessage }
			}
		}

		// Parse taskId - handle both string and number values
		let taskId
		if (typeof id === 'string') {
			// Handle subtask IDs (e.g., "5.2")
			if (id.includes('.')) {
				taskId = id // Keep as string for subtask IDs
			} else {
				// Parse as integer for main task IDs
				taskId = parseInt(id, 10)
				if (Number.isNaN(taskId)) {
					const errorMessage = `Invalid task ID: ${id}. Task ID must be a positive integer or subtask ID (e.g., "5.2").`
					logWrapper.error(errorMessage)
					return {
						success: false,
						error: { code: 'INVALID_TASK_ID', message: errorMessage }
					}
				}
			}
		} else {
			taskId = id
		}

		// Use the provided path
		const tasksPath = tasksJsonPath

		logWrapper.info(
			`Updating task with ID ${taskId} with fields: ${Object.keys(fieldsToUpdate).join(', ')} ${appendMode ? '(append mode)' : '(replace mode)'}`
		)

		const wasSilent = isSilentMode()
		if (!wasSilent) {
			enableSilentMode()
		}

		try {
			// Execute core updateTaskManually function with proper parameters
			const coreResult = await updateTaskManually(
				tasksPath,
				taskId,
				fieldsToUpdate,
				{
					projectRoot,
					tag,
					appendMode: appendMode || false
				}
			)

			// Check if the update was successful
			if (coreResult.success) {
				const successMessage = `Successfully updated task with ID ${taskId}`
				logWrapper.success(successMessage)
				return {
					success: true,
					data: {
						message: successMessage,
						taskId: taskId,
						tasksPath: tasksPath,
						updated: true,
						updatedFields: coreResult.updatedFields
					}
				}
			} else {
				// Update failed
				const errorMessage = coreResult.error?.message || 'Unknown error updating task'
				logWrapper.error(`Task update failed: ${errorMessage}`)
				return {
					success: false,
					error: {
						code: 'UPDATE_FAILED',
						message: errorMessage
					}
				}
			}
		} catch (error) {
			logWrapper.error(`Error updating task by ID: ${error.message}`)
			return {
				success: false,
				error: {
					code: 'UPDATE_TASK_CORE_ERROR',
					message: error.message || 'Unknown error updating task'
				}
			}
		} finally {
			if (!wasSilent && isSilentMode()) {
				disableSilentMode()
			}
		}
	} catch (error) {
		logWrapper.error(`Setup error in updateTaskByIdDirect: ${error.message}`)
		if (isSilentMode()) disableSilentMode()
		return {
			success: false,
			error: {
				code: 'DIRECT_FUNCTION_SETUP_ERROR',
				message: error.message || 'Unknown setup error'
			}
		}
	}
}
