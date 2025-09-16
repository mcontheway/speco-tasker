import fs from 'fs'
import path from 'path'

import { log as consoleLog, findProjectRoot, readJSON, writeJSON } from '../utils.js'

/**
 * Manually update a subtask's fields without AI involvement
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} parentId - ID of the parent task
 * @param {number} subtaskId - ID of the subtask to update
 * @param {object} fieldsToUpdate - Object containing fields to update
 * @param {object} context - Context object with projectRoot, tag, and appendMode
 * @returns {object} Result object with success status and updated fields
 */
async function updateSubtaskManually(tasksPath, parentId, subtaskId, fieldsToUpdate, context = {}) {
	const { projectRoot, tag, appendMode } = context

	try {
		// Read the tasks data
		const tasksData = readJSON(tasksPath, projectRoot, tag)

		// Find the parent task
		const tasks = tasksData.tasks || []
		const parentTask = tasks.find((task) => task.id === parentId)

		if (!parentTask) {
			return {
				success: false,
				error: { message: `Parent task with ID ${parentId} not found` }
			}
		}

		if (!parentTask.subtasks || !Array.isArray(parentTask.subtasks)) {
			return {
				success: false,
				error: { message: `Parent task ${parentId} has no subtasks` }
			}
		}

		// Find the subtask to update
		const subtaskIndex = parentTask.subtasks.findIndex((subtask) => subtask.id === subtaskId)

		if (subtaskIndex === -1) {
			return {
				success: false,
				error: { message: `Subtask with ID ${subtaskId} not found in parent task ${parentId}` }
			}
		}

		const subtask = parentTask.subtasks[subtaskIndex]
		const updatedFields = []

		// Update the fields that were provided
		Object.keys(fieldsToUpdate).forEach((field) => {
			const newValue = fieldsToUpdate[field]
			if (newValue !== undefined) {
				// Handle append mode for text fields
				if (appendMode && ['description', 'details'].includes(field)) {
					const currentValue = subtask[field] || ''
					const updatedValue = currentValue ? `${currentValue}\n\n${newValue}` : newValue
					if (updatedValue !== subtask[field]) {
						subtask[field] = updatedValue
						updatedFields.push(field)
					}
				} else {
					// Regular replacement mode
					if (newValue !== subtask[field]) {
						subtask[field] = newValue
						updatedFields.push(field)
					}
				}
			}
		})

		// Write the updated data back
		writeJSON(tasksPath, tasksData, projectRoot, tag)

		return {
			success: true,
			updatedFields
		}
	} catch (error) {
		consoleLog('error', `Error updating subtask manually: ${error.message}`)
		return {
			success: false,
			error: { message: error.message }
		}
	}
}

export { updateSubtaskManually }
