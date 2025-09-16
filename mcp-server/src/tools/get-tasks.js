/**
 * tools/get-tasks.js
 * Tool to get all tasks from Task Master
 */

import { z } from 'zod'
import { listTasksDirect } from '../core/task-master-core.js'
import { resolveComplexityReportPath, resolveTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot, getTagInfo, generateParameterHelp } from './utils.js'

import { resolveTag } from '../../../scripts/modules/utils.js'

/**
 * Register the getTasks tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */

// Generate parameter help for get_tasks tool
const getTasksParameterHelp = generateParameterHelp(
	'get_tasks',
	[
		{ name: 'projectRoot', description: '项目根目录的绝对路径' }
	],
	[
		{ name: 'status', description: '按状态过滤任务（pending, done, in-progress等），多个状态用逗号分隔' },
		{ name: 'withSubtasks', description: '是否包含子任务信息' },
		{ name: 'file', description: '任务文件路径（默认：tasks/tasks.json）' },
		{ name: 'complexityReport', description: '复杂度报告文件路径' },
		{ name: 'tag', description: '要操作的标签上下文' }
	],
	[
		'{"projectRoot": "/path/to/project"}',
		'{"projectRoot": "/path/to/project", "status": "pending"}',
		'{"projectRoot": "/path/to/project", "withSubtasks": true, "tag": "feature-branch"}'
	]
)

export function registerListTasksTool(server) {
	server.addTool({
		name: 'get_tasks',
		description:
			'Get all tasks from Task Master, optionally filtering by status and including subtasks.',
		parameters: z.object({
			status: z
				.string()
				.optional()
				.describe(
					"Filter tasks by status (e.g., 'pending', 'done') or multiple statuses separated by commas (e.g., 'blocked,deferred')"
				),
			withSubtasks: z
				.boolean()
				.optional()
				.describe('Include subtasks nested within their parent tasks in the response'),
			file: z
				.string()
				.optional()
				.describe('Path to the tasks file (relative to project root or absolute)'),
			complexityReport: z
				.string()
				.optional()
				.describe('Path to the complexity report file (relative to project root or absolute)'),
			projectRoot: z.string().describe('The directory of the project. Must be an absolute path.'),
			tag: z.string().optional().describe('Tag context to operate on')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Getting tasks with filters: ${JSON.stringify(args)}`)

				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag
				})
				// Resolve the path to tasks.json using new path utilities
				let tasksJsonPath
				try {
					tasksJsonPath = resolveTasksPath(args, log)
				} catch (error) {
					const errorMessage = `Failed to find tasks.json: ${error.message || 'File not found'}`
					log.error(`[get-tasks tool] ${errorMessage}`)

					// Get tag info for better error context
					const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

					return createErrorResponse(errorMessage, undefined, tagInfo, 'TASKS_JSON_NOT_FOUND')
				}

				// Resolve the path to complexity report
				let complexityReportPath
				try {
					complexityReportPath = resolveComplexityReportPath({ ...args, tag: resolvedTag }, session)
				} catch (error) {
					log.error(`Error finding complexity report: ${error.message}`)
					// This is optional, so we don't fail the operation
					complexityReportPath = null
				}

				const result = await listTasksDirect(
					{
						tasksJsonPath: tasksJsonPath,
						status: args.status,
						withSubtasks: args.withSubtasks,
						reportPath: complexityReportPath,
						projectRoot: args.projectRoot,
						tag: resolvedTag
					},
					log,
					{ session }
				)

				log.info(`Retrieved ${result.success ? result.data?.tasks?.length || 0 : 0} tasks`)
				return handleApiResult(result, log, 'Error getting tasks', undefined, args.projectRoot)
			} catch (error) {
				const errorMessage = `获取任务列表失败: ${error.message || '未知错误'}`
				log.error(`[get-tasks tool] ${errorMessage}`)

				// Get tag info for better error context
				const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

				return createErrorResponse(errorMessage, undefined, tagInfo, 'GET_TASKS_FAILED', getTasksParameterHelp)
			}
		})
	})
}

// We no longer need the formatTasksResponse function as we're returning raw JSON data
