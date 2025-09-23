/**
 * ui-utils.js
 * UI utility functions that don't depend on the main ui.js module
 * This module is designed to avoid circular dependencies
 */

import chalk from "chalk";

/**
 * Format dependencies with status indicators for display
 * @param {Array} dependencies - Array of dependency IDs
 * @param {Array} allTasks - Array of all tasks for status lookup
 * @param {boolean} colored - Whether to use colored output
 * @returns {string} Formatted dependencies string
 */
export function formatDependenciesWithStatus(
	dependencies,
	allTasks,
	colored = true,
) {
	if (
		!dependencies ||
		!Array.isArray(dependencies) ||
		dependencies.length === 0
	) {
		return "None";
	}

	return dependencies
		.map((depId) => {
			const task = allTasks.find((t) => t.id === depId);
			const status = task ? task.status : "unknown";
			const statusSymbol = getStatusSymbol(status);

			if (colored) {
				const statusColor = getStatusColor(status);
				return `${statusColor(statusSymbol)} ${depId}`;
			}
			return `${statusSymbol} ${depId}`;
		})
		.join(", ");
}

/**
 * Get status symbol for display
 * @param {string} status - Task status
 * @returns {string} Status symbol
 */
function getStatusSymbol(status) {
	const symbols = {
		done: "✅",
		completed: "✅",
		in_progress: "🔄",
		"in-progress": "🔄",
		pending: "⏳",
		blocked: "🚫",
		cancelled: "❌",
		deferred: "⏸️",
		review: "👀",
	};
	return symbols[status] || "❓";
}

/**
 * Get status color function
 * @param {string} status - Task status
 * @returns {Function} Chalk color function
 */
function getStatusColor(status) {
	const colors = {
		done: chalk.green,
		completed: chalk.green,
		in_progress: chalk.blue,
		"in-progress": chalk.blue,
		pending: chalk.yellow,
		blocked: chalk.red,
		cancelled: chalk.gray,
		deferred: chalk.gray,
		review: chalk.magenta,
	};
	return colors[status] || chalk.white;
}
