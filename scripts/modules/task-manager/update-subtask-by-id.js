import fs from "node:fs";
import {
	log as consoleLog,
	findProjectRoot,
	readJSON,
	writeJSON,
} from "../utils.js";

/**
 * Manually update a subtask by appending timestamped information.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} subtaskId - ID of the subtask to update in format "parentId.subtaskId"
 * @param {string} prompt - Information to append to the subtask
 * @param {Object} context - Context object containing projectRoot and tag.
 * @param {string} [context.projectRoot] - Project root path.
 * @param {string} [context.tag] - Tag for the task
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 * @returns {Promise<Object|null>} - The updated subtask or null if update failed.
 */
async function updateSubtaskById(
	tasksPath,
	subtaskId,
	prompt,
	context = {},
	outputFormat = "text",
) {
	const { projectRoot: providedProjectRoot, tag } = context;

	try {
		consoleLog(
			"info",
			`Updating subtask ${subtaskId} with information: "${prompt}"`,
		);

		if (
			!subtaskId ||
			typeof subtaskId !== "string" ||
			!subtaskId.includes(".")
		) {
			throw new Error(
				`Invalid subtask ID format: ${subtaskId}. Subtask ID must be in format "parentId.subtaskId"`,
			);
		}

		if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
			throw new Error(
				"Information cannot be empty. Please provide context for the subtask update.",
			);
		}

		if (!fs.existsSync(tasksPath)) {
			throw new Error(`Tasks file not found at path: ${tasksPath}`);
		}

		const projectRoot = providedProjectRoot || findProjectRoot();
		if (!projectRoot) {
			throw new Error("Could not determine project root directory");
		}

		const data = readJSON(tasksPath, projectRoot, tag);
		if (!data || !data.tasks) {
			throw new Error(
				`No valid tasks found in ${tasksPath}. The file may be corrupted or have an invalid format.`,
			);
		}

		const [parentIdStr, subtaskIdStr] = subtaskId.split(".");
		const parentId = Number.parseInt(parentIdStr, 10);
		const subtaskIdNum = Number.parseInt(subtaskIdStr, 10);

		if (
			Number.isNaN(parentId) ||
			parentId <= 0 ||
			Number.isNaN(subtaskIdNum) ||
			subtaskIdNum <= 0
		) {
			throw new Error(
				`Invalid subtask ID format: ${subtaskId}. Both parent ID and subtask ID must be positive integers.`,
			);
		}

		const parentTask = data.tasks.find((task) => task.id === parentId);
		if (!parentTask) {
			throw new Error(
				`Parent task with ID ${parentId} not found. Please verify the task ID and try again.`,
			);
		}

		if (!parentTask.subtasks || !Array.isArray(parentTask.subtasks)) {
			throw new Error(`Parent task ${parentId} has no subtasks.`);
		}

		const subtaskIndex = parentTask.subtasks.findIndex(
			(st) => st.id === subtaskIdNum,
		);
		if (subtaskIndex === -1) {
			throw new Error(
				`Subtask with ID ${subtaskId} not found. Please verify the subtask ID and try again.`,
			);
		}

		const subtask = parentTask.subtasks[subtaskIndex];

		// Append the information to the subtask
		const timestamp = new Date().toISOString();
		const formattedEntry = `[${timestamp}] ${prompt}`;

		if (subtask.details) {
			subtask.details += `\n\n${formattedEntry}`;
		} else {
			subtask.details = formattedEntry;
		}

		// Save the updated data
		writeJSON(tasksPath, data, projectRoot, tag);

		consoleLog("info", `Successfully updated subtask ${subtaskId}`);

		return {
			subtask: subtask,
			message: `Subtask ${subtaskId} updated successfully`,
		};
	} catch (error) {
		consoleLog("error", `Error updating subtask manually: ${error.message}`);
		return {
			success: false,
			error: { message: error.message },
		};
	}
}

export { updateSubtaskById };
