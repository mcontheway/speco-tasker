import fs from "fs";
import path from "path";

import {
	log as consoleLog,
	findProjectRoot,
	parseDependencies,
	parseLogs,
	parseSpecFiles,
	readJSON,
	validateFieldUpdatePermission,
	validateSpecFiles,
	writeJSON,
} from "../utils.js";

/**
 * Manually update a task's fields without AI involvement
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} taskId - ID of the task to update
 * @param {object} fieldsToUpdate - Object containing fields to update
 * @param {object} context - Context object with projectRoot, tag, and appendMode
 * @returns {object} Result object with success status and updated fields
 */
async function updateTaskManually(
	tasksPath,
	taskId,
	fieldsToUpdate,
	context = {},
) {
	const { projectRoot, tag, appendMode } = context;

	try {
		// Read the tasks data
		const tasksData = readJSON(tasksPath, projectRoot, tag);

		// Find the task to update
		const tasks = tasksData.tasks || [];
		const taskIndex = tasks.findIndex((task) => task.id === taskId);

		if (taskIndex === -1) {
			return {
				success: false,
				error: { message: `Task with ID ${taskId} not found` },
			};
		}

		const task = tasks[taskIndex];
		const updatedFields = [];

		// Update the fields that were provided
		Object.keys(fieldsToUpdate).forEach((field) => {
			const newValue = fieldsToUpdate[field];
			if (newValue !== undefined) {
				// Validate field update permission
				const validation = validateFieldUpdatePermission(field, newValue, task);
				if (!validation.isAllowed) {
					consoleLog(
						"warn",
						`Field update rejected for '${field}': ${validation.reason}`,
					);
					return;
				}

				let processedValue = newValue;

				// Special processing for specific fields
				switch (field) {
					case "dependencies":
						const depResult = parseDependencies(newValue);
						if (depResult.errors.length > 0) {
							consoleLog(
								"warn",
								`Dependency parsing errors for ${field}: ${depResult.errors.join(", ")}`,
							);
						}
						if (depResult.warnings.length > 0) {
							consoleLog(
								"warn",
								`Dependency warnings for ${field}: ${depResult.warnings.join(", ")}`,
							);
						}
						processedValue = depResult.dependencies;
						break;

					case "spec_files":
						const parsedSpecFiles = parseSpecFiles(newValue, projectRoot);
						const specValidation = validateSpecFiles(
							parsedSpecFiles,
							projectRoot,
						);
						if (specValidation.errors.length > 0) {
							consoleLog(
								"warn",
								`Spec files validation errors for ${field}: ${specValidation.errors.join(", ")}`,
							);
						}
						if (specValidation.warnings.length > 0) {
							consoleLog(
								"warn",
								`Spec files warnings for ${field}: ${specValidation.warnings.join(", ")}`,
							);
						}
						processedValue = parsedSpecFiles;
						break;

					case "logs":
						processedValue = parseLogs(newValue, appendMode, task[field]);
						break;

					default:
						// Handle append mode for text fields
						if (
							appendMode &&
							["description", "details", "testStrategy"].includes(field)
						) {
							const currentValue = task[field] || "";
							processedValue = currentValue
								? `${currentValue}\n\n${newValue}`
								: newValue;
						}
						break;
				}

				// Apply the update
				if (processedValue !== task[field]) {
					task[field] = processedValue;
					updatedFields.push(field);
				}
			}
		});

		// Write the updated data back
		writeJSON(tasksPath, tasksData, projectRoot, tag);

		return {
			success: true,
			updatedFields,
		};
	} catch (error) {
		consoleLog("error", `Error updating task manually: ${error.message}`);
		return {
			success: false,
			error: { message: error.message },
		};
	}
}

export { updateTaskManually };
