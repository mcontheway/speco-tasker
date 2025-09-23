/**
 * Task dependency utility functions
 * Provides functions for checking task dependencies and avoiding circular references
 */

/**
 * Check if task is dependent on another (placeholder implementation)
 * @param {Array} tasks - Tasks array
 * @param {number} taskId - Task ID to check
 * @param {number} dependencyId - Dependency ID to check for
 * @returns {boolean} Whether task is dependent
 */
export function isTaskDependentOn(tasks, taskId, dependencyId) {
	// Placeholder implementation - simple check for direct dependencies
	const task = tasks.find((t) => t.id === taskId);
	if (!task || !task.dependencies) {
		return false;
	}
	return task.dependencies.includes(dependencyId);
}

/**
 * Check if a dependency relationship would create a circular dependency
 * @param {Array} tasks - Tasks array
 * @param {number} taskId - Task that would have the dependency
 * @param {number} dependencyId - Task that would be depended on
 * @returns {boolean} True if this would create a circular dependency
 */
export function wouldCreateCircularDependency(tasks, taskId, dependencyId) {
	// Simple check: if dependencyId depends on taskId, it would be circular
	return isTaskDependentOn(tasks, dependencyId, taskId);
}
