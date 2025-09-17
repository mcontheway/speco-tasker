/**
 * task-master-core.js
 * Central module that imports and re-exports all direct function implementations
 * for improved organization and maintainability.
 */

import { addDependencyDirect } from './direct-functions/add-dependency.js'
import { addSubtaskDirect } from './direct-functions/add-subtask.js'
import { addTagDirect } from './direct-functions/add-tag.js'
import { addTaskDirect } from './direct-functions/add-task.js'
import { getCacheStatsDirect } from './direct-functions/cache-stats.js'
import { clearSubtasksDirect } from './direct-functions/clear-subtasks.js'
import { copyTagDirect } from './direct-functions/copy-tag.js'
import { deleteTagDirect } from './direct-functions/delete-tag.js'
import { fixDependenciesDirect } from './direct-functions/fix-dependencies.js'
import { generateTaskFilesDirect } from './direct-functions/generate-task-files.js'
import { initializeProjectDirect } from './direct-functions/initialize-project.js'
import { listTagsDirect } from './direct-functions/list-tags.js'
// Import direct function implementations
import { listTasksDirect } from './direct-functions/list-tasks.js'
import { moveTaskCrossTagDirect } from './direct-functions/move-task-cross-tag.js'
import { moveTaskDirect } from './direct-functions/move-task.js'
import { nextTaskDirect } from './direct-functions/next-task.js'
import { removeDependencyDirect } from './direct-functions/remove-dependency.js'
import { removeSubtaskDirect } from './direct-functions/remove-subtask.js'
import { removeTaskDirect } from './direct-functions/remove-task.js'
import { renameTagDirect } from './direct-functions/rename-tag.js'
import { setTaskStatusDirect } from './direct-functions/set-task-status.js'
import { showTaskDirect } from './direct-functions/show-task.js'
import { updateSubtaskByIdDirect } from './direct-functions/update-subtask-by-id.js'
import { updateTaskByIdDirect } from './direct-functions/update-task-by-id.js'
import { useTagDirect } from './direct-functions/use-tag.js'
import { validateDependenciesDirect } from './direct-functions/validate-dependencies.js'

// Re-export utility functions
export { findTasksPath } from './utils/path-utils.js'

// Use Map for potential future enhancements like introspection or dynamic dispatch
export const directFunctions = new Map([
	['listTasksDirect', listTasksDirect],
	['getCacheStatsDirect', getCacheStatsDirect],
	['updateTaskByIdDirect', updateTaskByIdDirect],
	['updateSubtaskByIdDirect', updateSubtaskByIdDirect],
	['generateTaskFilesDirect', generateTaskFilesDirect],
	['setTaskStatusDirect', setTaskStatusDirect],
	['showTaskDirect', showTaskDirect],
	['nextTaskDirect', nextTaskDirect],
	['addTaskDirect', addTaskDirect],
	['addSubtaskDirect', addSubtaskDirect],
	['removeSubtaskDirect', removeSubtaskDirect],
	['clearSubtasksDirect', clearSubtasksDirect],
	['removeDependencyDirect', removeDependencyDirect],
	['validateDependenciesDirect', validateDependenciesDirect],
	['fixDependenciesDirect', fixDependenciesDirect],
	['addDependencyDirect', addDependencyDirect],
	['removeTaskDirect', removeTaskDirect],
	['initializeProjectDirect', initializeProjectDirect],
	['moveTaskDirect', moveTaskDirect],
	['moveTaskCrossTagDirect', moveTaskCrossTagDirect],
	['addTagDirect', addTagDirect],
	['deleteTagDirect', deleteTagDirect],
	['listTagsDirect', listTagsDirect],
	['useTagDirect', useTagDirect],
	['renameTagDirect', renameTagDirect],
	['copyTagDirect', copyTagDirect]
])

// Re-export all direct function implementations
export {
	listTasksDirect,
	getCacheStatsDirect,
	updateTaskByIdDirect,
	updateSubtaskByIdDirect,
	generateTaskFilesDirect,
	setTaskStatusDirect,
	showTaskDirect,
	nextTaskDirect,
	addTaskDirect,
	addSubtaskDirect,
	removeSubtaskDirect,
	clearSubtasksDirect,
	removeDependencyDirect,
	validateDependenciesDirect,
	fixDependenciesDirect,
	addDependencyDirect,
	removeTaskDirect,
	initializeProjectDirect,
	moveTaskDirect,
	moveTaskCrossTagDirect,
	addTagDirect,
	deleteTagDirect,
	listTagsDirect,
	useTagDirect,
	renameTagDirect,
	copyTagDirect
}
