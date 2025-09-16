/**
 * tools/index.js
 * Export all Task Master CLI tools for MCP server
 */

import logger from '../logger.js'
import { registerAddDependencyTool } from './add-dependency.js'
import { registerAddSubtaskTool } from './add-subtask.js'
import { registerAddTagTool } from './add-tag.js'
import { registerAddTaskTool } from './add-task.js'
import { registerClearSubtasksTool } from './clear-subtasks.js'
import { registerCopyTagTool } from './copy-tag.js'
import { registerDeleteTagTool } from './delete-tag.js'
import { registerFixDependenciesTool } from './fix-dependencies.js'
import { registerGenerateTool } from './generate.js'
import { registerShowTaskTool } from './get-task.js'
import { registerListTasksTool } from './get-tasks.js'
import { registerInitializeProjectTool } from './initialize-project.js'
import { registerListTagsTool } from './list-tags.js'
import { registerMoveTaskTool } from './move-task.js'
import { registerNextTaskTool } from './next-task.js'
import { registerRemoveDependencyTool } from './remove-dependency.js'
import { registerRemoveSubtaskTool } from './remove-subtask.js'
import { registerRemoveTaskTool } from './remove-task.js'
import { registerRenameTagTool } from './rename-tag.js'
import { registerSetTaskStatusTool } from './set-task-status.js'
import { registerUseTagTool } from './use-tag.js'
import { registerValidateDependenciesTool } from './validate-dependencies.js'

/**
 * Register all Task Master tools with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerTaskMasterTools(server) {
	try {
		// Register each tool in a logical workflow order

		// Group 1: Initialization & Setup
		registerInitializeProjectTool(server)
		// Models tool removed (AI functionality)
		// Rules tool removed (rules functionality)
		// AI-based PRD parsing tool removed in phase 3.3

		// Group 2: Task Analysis & Expansion
		// AI-based analysis and expansion tools removed in phase 3.3

		// Group 3: Task Listing & Viewing
		registerListTasksTool(server)
		registerShowTaskTool(server)
		registerNextTaskTool(server)
		// Complexity report tool removed (AI functionality)

		// Group 4: Task Status & Management
		registerSetTaskStatusTool(server)
		registerGenerateTool(server)

		// Group 5: Task Creation & Modification
		registerAddTaskTool(server)
		registerAddSubtaskTool(server)
		// AI-based update tools removed in phase 3.3
		registerRemoveTaskTool(server)
		registerRemoveSubtaskTool(server)
		registerClearSubtasksTool(server)
		registerMoveTaskTool(server)

		// Group 6: Dependency Management
		registerAddDependencyTool(server)
		registerRemoveDependencyTool(server)
		registerValidateDependenciesTool(server)
		registerFixDependenciesTool(server)

		// Group 7: Tag Management
		registerListTagsTool(server)
		registerAddTagTool(server)
		registerDeleteTagTool(server)
		registerUseTagTool(server)
		registerRenameTagTool(server)
		registerCopyTagTool(server)

		// Group 8: Research Features
		// AI-based research tool removed in phase 3.3
	} catch (error) {
		logger.error(`Error registering Task Master tools: ${error.message}`)
		throw error
	}
}

export default {
	registerTaskMasterTools
}
