/**
 * Check if task is dependent on another (placeholder implementation)
 * @param {Array} tasks - Tasks array
 * @param {number} taskId - Task ID to check
 * @param {number} dependencyId - Dependency ID to check for
 * @returns {boolean} Whether task is dependent
 */
export function isTaskDependentOn(tasks, taskId, dependencyId) {
	// Placeholder implementation - simple check for direct dependencies
	const task = tasks.find((t) => t.id === taskId)
	if (!task || !task.dependencies) {
		return false
	}
	return task.dependencies.includes(dependencyId)
}
