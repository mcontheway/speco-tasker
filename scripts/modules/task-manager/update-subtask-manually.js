import fs from "node:fs";
import path from "node:path";

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
 * Manually update a subtask's fields without AI involvement
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} parentId - ID of the parent task
 * @param {number} subtaskId - ID of the subtask to update
 * @param {object} fieldsToUpdate - Object containing fields to update
 * @param {object} context - Context object with projectRoot, tag, and appendMode
 * @returns {object} Result object with success status and updated fields
 */
async function updateSubtaskManually(
	tasksPath,
	parentId,
	subtaskId,
	fieldsToUpdate,
	context = {},
) {
	const { projectRoot, tag, appendMode } = context;

	try {
		// Read the tasks data
		const tasksData = readJSON(tasksPath, projectRoot, tag);

		// Find the parent task
		const tasks = tasksData.tasks || [];
		const parentTask = tasks.find((task) => task.id === parentId);

		if (!parentTask) {
			return {
				success: false,
				error: { message: `Parent task with ID ${parentId} not found` },
			};
		}

		if (!parentTask.subtasks || !Array.isArray(parentTask.subtasks)) {
			return {
				success: false,
				error: { message: `Parent task ${parentId} has no subtasks` },
			};
		}

		// Find the subtask to update
		const subtaskIndex = parentTask.subtasks.findIndex(
			(subtask) => subtask.id === subtaskId,
		);

		if (subtaskIndex === -1) {
			return {
				success: false,
				error: {
					message: `Subtask with ID ${subtaskId} not found in parent task ${parentId}`,
				},
			};
		}

		const subtask = parentTask.subtasks[subtaskIndex];
		const updatedFields = [];

		// Update the fields that were provided
		Object.keys(fieldsToUpdate).forEach((field) => {
			const newValue = fieldsToUpdate[field];
			if (newValue !== undefined) {
				// Validate field update permission
				const validation = validateFieldUpdatePermission(
					field,
					newValue,
					subtask,
				);
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
					case "dependencies": {
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
					}

					case "spec_files": {
						const parsedSpecFiles = parseSpecFiles(newValue, projectRoot);
						// For subtasks, spec_files validation is optional, for main tasks it's required
						// Since this is update-subtask-manually, we know it's always a subtask
						const specValidation = validateSpecFiles(
							parsedSpecFiles,
							projectRoot,
							consoleLog,
							true,
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
					}

					case "logs":
						processedValue = parseLogs(newValue, appendMode, subtask[field]);
						break;

					default:
						// Handle append mode for text fields
						if (
							appendMode &&
							["description", "details", "testStrategy"].includes(field)
						) {
							const currentValue = subtask[field] || "";
							processedValue = currentValue
								? `${currentValue}\n\n${newValue}`
								: newValue;
						}
						break;
				}

				// Apply the update
				if (processedValue !== subtask[field]) {
					subtask[field] = processedValue;
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
		consoleLog("error", `Error updating subtask manually: ${error.message}`);
		return {
			success: false,
			error: { message: error.message },
		};
	}
}

export { updateSubtaskManually };
