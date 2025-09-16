/**
 * tools/get-task.js
 * Tool to get task details by ID
 */

import { z } from 'zod'
import { resolveTag } from '../../../scripts/modules/utils.js'
import { showTaskDirect } from '../core/task-master-core.js'
import { findComplexityReportPath, findTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, generateParameterHelp, getTagInfo, handleApiResult, withNormalizedProjectRoot } from './utils.js'

/**
 * Custom processor function that removes allTasks from the response
 * @param {Object} data - The data returned from showTaskDirect
 * @returns {Object} - The processed data with allTasks removed
 */

// Generate parameter help for get_task tool
const getTaskParameterHelp = generateParameterHelp(
	'get_task',
	[
		{ name: 'projectRoot', description: '项目根目录的绝对路径' },
		{ name: 'id', description: '要查看的任务ID或子任务ID（例如：15, 15.2）' }
	],
	[
		{ name: 'file', description: '任务文件路径（默认：tasks/tasks.json）' },
		{ name: 'complexityReport', description: '复杂度报告文件路径' },
		{ name: 'tag', description: '要操作的标签上下文' }
	],
	[
		'{"projectRoot": "/path/to/project", "id": "1"}',
		'{"projectRoot": "/path/to/project", "id": "5.2"}',
		'{"projectRoot": "/path/to/project", "id": "10", "tag": "feature-branch"}'
	]
)
 */
function processTaskResponse(data) {
	if (!data) return data

	// If we have the expected structure with task and allTasks
	if (typeof data === 'object' && data !== null && data.id && data.title) {
		// If the data itself looks like the task object, return it
		return data
	} else if (data.task) {
		return data.task
	}

	// If structure is unexpected, return as is
	return data
}

/**
 * Register the get-task tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerShowTaskTool(server) {
	server.addTool({
		name: 'get_task',
		description: 'Get detailed information about a specific task',
		parameters: z.object({
			id: z.string().describe('Task ID(s) to get (can be comma-separated for multiple tasks)'),
			status: z.string().optional().describe("Filter subtasks by status (e.g., 'pending', 'done')"),
			file: z.string().optional().describe('Path to the tasks file relative to project root'),
			complexityReport: z
				.string()
				.optional()
				.describe('Path to the complexity report file (relative to project root or absolute)'),
			projectRoot: z
				.string()
				.describe('Absolute path to the project root directory (Optional, usually from session)'),
			tag: z.string().optional().describe('Tag context to operate on')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const { id, file, status, projectRoot } = args

			try {
				log.info(
					`Getting task details for ID: ${id}${status ? ` (filtering subtasks by status: ${status})` : ''} in root: ${projectRoot}`
				)
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag
				})

				// Resolve the path to tasks.json using the NORMALIZED projectRoot from args
				let tasksJsonPath
				try {
					tasksJsonPath = findTasksPath({ projectRoot: projectRoot, file: file }, log)
					log.info(`Resolved tasks path: ${tasksJsonPath}`)
				} catch (error) {
					const errorMessage = `Failed to find tasks.json: ${error.message || 'File not found'}`
					log.error(`[get-task tool] ${errorMessage}`)

					// Get tag info for better error context
					const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

					return createErrorResponse(errorMessage, undefined, tagInfo, 'TASKS_JSON_NOT_FOUND')
				}

				// Call the direct function, passing the normalized projectRoot
				// Resolve the path to complexity report
				let complexityReportPath
				try {
					complexityReportPath = findComplexityReportPath(
						{
							projectRoot: projectRoot,
							complexityReport: args.complexityReport,
							tag: resolvedTag
						},
						log
					)
				} catch (error) {
					log.error(`Error finding complexity report: ${error.message}`)
				}
				const result = await showTaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						reportPath: complexityReportPath,
						// Pass other relevant args
						id: id,
						status: status,
						projectRoot: projectRoot,
						tag: resolvedTag
					},
					log,
					{ session }
				)

				if (result.success) {
					log.info(`Successfully retrieved task details for ID: ${args.id}`)
				} else {
					log.error(`Failed to get task: ${result.error.message}`)
				}

				// Use our custom processor function
				return handleApiResult(
					result,
					log,
					'Error retrieving task details',
					processTaskResponse,
					projectRoot
				)
			} catch (error) {
				const errorMessage = `获取任务失败: ${error.message || '未知错误'}`
				log.error(`[get-task tool] ${errorMessage}`)

				// Get tag info for better error context
				const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

				return createErrorResponse(errorMessage, undefined, tagInfo, 'GET_TASK_FAILED', getTaskParameterHelp)
			}
		})
	})
}
