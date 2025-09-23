/**
 * loading-utils.js
 * Loading indicator utilities that don't depend on main UI modules
 * This module is designed to avoid circular dependencies
 */

import chalk from "chalk";
import ora from "ora";

/**
 * Start a loading indicator
 * @param {string} text - Loading text
 * @returns {Object} Loading indicator instance
 */
export function startLoadingIndicator(text) {
	return ora(text).start();
}

/**
 * Stop a loading indicator
 * @param {Object} indicator - Loading indicator instance
 */
export function stopLoadingIndicator(indicator) {
	if (indicator) {
		indicator.stop();
	}
}

/**
 * Mark loading indicator as successful
 * @param {Object} indicator - Loading indicator instance
 * @param {string} text - Success text
 */
export function succeedLoadingIndicator(indicator, text) {
	if (indicator) {
		indicator.succeed(text);
	}
}

/**
 * Mark loading indicator as failed
 * @param {Object} indicator - Loading indicator instance
 * @param {string} text - Failure text
 */
export function failLoadingIndicator(indicator, text) {
	if (indicator) {
		indicator.fail(text);
	}
}

/**
 * Get status color for display
 * @param {string} status - Task status
 * @returns {Function} Chalk color function
 */
export function getStatusWithColor(status) {
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
