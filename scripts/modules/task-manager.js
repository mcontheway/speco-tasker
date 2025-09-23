/**
 * task-manager.js
 * Task management functions for the Task Master CLI
 */

import addSubtask from "./task-manager/add-subtask.js";
import addTask from "./task-manager/add-task.js";
import clearSubtasks from "./task-manager/clear-subtasks.js";
import findNextTask from "./task-manager/find-next-task.js";
import generateTaskFiles from "./task-manager/generate-task-files.js";
// isTaskDependentOn moved to task-dependency-utils.js
import listTasks from "./task-manager/list-tasks.js";
import { migrateProject } from "./task-manager/migrate.js";
import moveTask from "./task-manager/move-task.js";
import removeSubtask from "./task-manager/remove-subtask.js";
import removeTask from "./task-manager/remove-task.js";
import setTaskStatus from "./task-manager/set-task-status.js";
import taskExists from "./task-manager/task-exists.js";
import updateSingleTaskStatus from "./task-manager/update-single-task-status.js";
import { updateSubtaskById } from "./task-manager/update-subtask-by-id.js";
import { updateSubtaskManually } from "./task-manager/update-subtask-manually.js";
import { updateTaskManually } from "./task-manager/update-task-manually.js";
import { findTaskById } from "./utils.js";
import { readComplexityReport } from "./utils.js";

// Export task manager functions
export {
	updateSubtaskById,
	updateTaskManually,
	updateSubtaskManually,
	generateTaskFiles,
	setTaskStatus,
	updateSingleTaskStatus,
	listTasks,
	clearSubtasks,
	addTask,
	addSubtask,
	removeSubtask,
	findNextTask,
	removeTask,
	findTaskById,
	taskExists,
	moveTask,
	readComplexityReport,
	migrateProject,
};
