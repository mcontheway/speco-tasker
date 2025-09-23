/**
 * formatting-utils.js
 * Utility functions for formatting and display
 */

import chalk from "chalk";

/**
 * Get status color for console output
 * @param {string} status - Task status
 * @returns {Function} Chalk color function
 */
function getStatusColor(status) {
	switch (status?.toLowerCase()) {
		case "done":
		case "completed":
			return chalk.green;
		case "in-progress":
		case "progress":
			return chalk.blue;
		case "pending":
			return chalk.yellow;
		case "cancelled":
		case "failed":
			return chalk.red;
		default:
			return chalk.gray;
	}
}

/**
 * Get status icon for display
 * @param {string} status - Task status
 * @returns {string} Status icon
 */
function getStatusIcon(status) {
	switch (status?.toLowerCase()) {
		case "done":
		case "completed":
			return "✅";
		case "in-progress":
		case "progress":
			return "🔄";
		case "pending":
			return "⏳";
		case "cancelled":
		case "failed":
			return "❌";
		default:
			return "❓";
	}
}

/**
 * Find task by ID in tasks array
 * @param {Array} tasks - Tasks array
 * @param {string|number} taskId - Task ID to find
 * @param {Object|null} complexityReport - Optional complexity report
 * @param {string} statusFilter - Optional status filter
 * @returns {Object} Task result object
 */
function findTaskById(tasks, taskId, complexityReport = null, statusFilter = null) {
	if (!taskId || !tasks || !Array.isArray(tasks)) {
		return { task: null, originalSubtaskCount: null };
	}

	// Check if it's a subtask ID (e.g., "1.2")
	if (typeof taskId === "string" && taskId.includes(".")) {
		const [parentId, subtaskId] = taskId.split(".").map(Number);
		const parentTask = tasks.find((t) => t.id === parentId);

		if (parentTask && parentTask.subtasks) {
			const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);

			if (subtask && (!statusFilter || subtask.status === statusFilter)) {
				return {
					task: {
						...subtask,
						id: `${parentId}.${subtaskId}`,
						parentId,
						isSubtask: true,
					},
					originalSubtaskCount: parentTask.subtasks.length,
					originalSubtasks: parentTask.subtasks,
				};
			}
		}

		return { task: null, originalSubtaskCount: null };
	}

	// Regular task ID
	const task = tasks.find((t) => t.id === Number(taskId));

	if (!task) {
		return { task: null, originalSubtaskCount: null };
	}

	// Filter subtasks if statusFilter is provided
	if (statusFilter && task.subtasks && Array.isArray(task.subtasks)) {
		const originalSubtasks = task.subtasks;
		const filteredSubtasks = originalSubtasks.filter(
			(st) => st.status === statusFilter,
		);

		return {
			task: { ...task, subtasks: filteredSubtasks },
			originalSubtaskCount: originalSubtasks.length,
			originalSubtasks,
		};
	}

	return { task, originalSubtaskCount: null, originalSubtasks: null };
}

/**
 * Format dependencies with status information
 * @param {Array} dependencies - Array of dependency IDs
 * @param {Array} allTasks - Array of all tasks
 * @param {boolean} forConsole - Whether formatting for console output
 * @param {Object|null} complexityReport - Optional complexity report
 * @returns {string} Formatted dependencies string
 */
export function formatDependenciesWithStatus(
	dependencies,
	allTasks,
	forConsole = false,
	complexityReport = null,
) {
	if (
		!dependencies ||
		!Array.isArray(dependencies) ||
		dependencies.length === 0
	) {
		return forConsole ? chalk.gray("None") : "None";
	}

	const formattedDeps = dependencies.map((depId) => {
		const depIdStr = depId.toString(); // Ensure string format for display

		// Check if it's already a fully qualified subtask ID (like "22.1")
		if (depIdStr.includes(".")) {
			const parts = depIdStr.split(".");
			// Validate that it's a proper subtask format (parentId.subtaskId)
			if (parts.length !== 2 || !parts[0] || !parts[1]) {
				// Invalid format - treat as regular dependency
				const numericDepId =
					typeof depId === "string" ? Number.parseInt(depId, 10) : depId;
				const depTaskResult = findTaskById(
					allTasks,
					numericDepId,
					complexityReport,
				);
				const depTask = depTaskResult.task;

				if (!depTask) {
					return forConsole
						? chalk.red(`${depIdStr} (Not found)`)
						: `${depIdStr} (Not found)`;
				}

				const status = depTask.status || "pending";
				const isDone =
					status.toLowerCase() === "done" ||
					status.toLowerCase() === "completed";
				const isInProgress = status.toLowerCase() === "in-progress";

				if (forConsole) {
					if (isDone) {
						return chalk.green.bold(depIdStr);
					}
					if (isInProgress) {
						return chalk.blue.bold(depIdStr);
					}
					return chalk.yellow.bold(depIdStr);
				}
				return depIdStr;
			}

			// Valid subtask format - find the actual subtask
			const parentId = Number.parseInt(parts[0], 10);
			const subtaskId = Number.parseInt(parts[1], 10);

			// Find the parent task
			const parentTask = allTasks.find((t) => t.id === parentId);
			if (parentTask && parentTask.subtasks) {
				const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);
				if (subtask) {
					const statusColor = getStatusColor(subtask.status || "pending");
					const statusIcon = getStatusIcon(subtask.status || "pending");
					return forConsole
						? `${statusColor(statusIcon)} ${parentId}.${subtaskId} - ${subtask.title}`
						: `${statusIcon} ${parentId}.${subtaskId} - ${subtask.title}`;
				}
			}
		}

		// Handle regular task dependencies
		const numericDepId = typeof depId === "string" ? Number.parseInt(depId, 10) : depId;
		const depTaskResult = findTaskById(allTasks, numericDepId, complexityReport);
		const task = depTaskResult.task;

		if (task) {
			const statusColor = getStatusColor(task.status || "pending");
			const statusIcon = getStatusIcon(task.status || "pending");
			return forConsole
				? `${statusColor(statusIcon)} ${task.id} - ${task.title}`
				: `${statusIcon} ${task.id} - ${task.title}`;
		}

		// Fallback for unknown dependencies
		return forConsole
			? chalk.red(`❓ ${depId} - Unknown Task`)
			: `❓ ${depId} - Unknown Task`;
	});

	return formattedDeps.join(forConsole ? "\n" : ", ");
}
