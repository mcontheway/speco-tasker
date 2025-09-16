import fs from 'fs'
import path from 'path'

import { log as consoleLog, findProjectRoot, readJSON, writeJSON } from '../utils.js'

/**
 * Manually update a task's fields without AI involvement
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} taskId - ID of the task to update
 * @param {object} fieldsToUpdate - Object containing fields to update
 * @param {object} context - Context object with projectRoot, tag, and appendMode
 * @returns {object} Result object with success status and updated fields
 */
async function updateTaskManually(tasksPath, taskId, fieldsToUpdate, context = {}) {
	const { projectRoot, tag, appendMode } = context

	try {
		// Read the tasks data
		const tasksData = readJSON(tasksPath, projectRoot, tag)

		// Find the task to update
		const tasks = tasksData.tasks || []
		const taskIndex = tasks.findIndex((task) => task.id === taskId)

		if (taskIndex === -1) {
			return {
				success: false,
				error: { message: `Task with ID ${taskId} not found` }
			}
		}

		const task = tasks[taskIndex]
		const updatedFields = []

		// Update the fields that were provided
		Object.keys(fieldsToUpdate).forEach((field) => {
			const newValue = fieldsToUpdate[field]
			if (newValue !== undefined) {
				// Handle append mode for text fields
				if (appendMode && ['description', 'details', 'testStrategy'].includes(field)) {
					const currentValue = task[field] || ''
					const updatedValue = currentValue ? `${currentValue}\n\n${newValue}` : newValue
					if (updatedValue !== task[field]) {
						task[field] = updatedValue
						updatedFields.push(field)
					}
				} else {
					// Regular replacement mode
					if (newValue !== task[field]) {
						task[field] = newValue
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
		consoleLog('error', `Error updating task manually: ${error.message}`)
		return {
			success: false,
			error: { message: error.message }
		}
	}
}

export { updateTaskManually }
