/**
 * tools/next-task.js
 * Tool to find the next task to work on based on dependencies and status
 */

import { z } from 'zod'
import { resolveTag } from '../../../scripts/modules/utils.js'
import { nextTaskDirect } from '../core/task-master-core.js'
import { resolveComplexityReportPath, resolveTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot, getTagInfo, generateParameterHelp } from './utils.js'

/**
 * Register the nextTask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */

// Generate parameter help for next_task tool
const nextTaskParameterHelp = generateParameterHelp(
	'next_task',
	[
		{ name: 'projectRoot', description: '项目根目录的绝对路径' }
	],
	[
		{ name: 'file', description: '任务文件路径（默认：tasks/tasks.json）' },
		{ name: 'complexityReport', description: '复杂度报告文件路径' },
		{ name: 'tag', description: '要操作的标签上下文' }
	],
	[
		'{"projectRoot": "/path/to/project"}',
		'{"projectRoot": "/path/to/project", "tag": "feature-branch"}'
	]
)

export function registerNextTaskTool(server) {
	server.addTool({
		name: 'next_task',
		description: 'Find the next task to work on based on dependencies and status',
		parameters: z.object({
			file: z.string().optional().describe('Absolute path to the tasks file'),
			complexityReport: z
				.string()
				.optional()
				.describe('Path to the complexity report file (relative to project root or absolute)'),
			projectRoot: z.string().describe('The directory of the project. Must be an absolute path.'),
			tag: z.string().optional().describe('Tag context to operate on')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Finding next task with args: ${JSON.stringify(args)}`)
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag
				})

				// Resolve the path to tasks.json using new path utilities
				let tasksJsonPath
				try {
					tasksJsonPath = resolveTasksPath(args, session)
				} catch (error) {
					log.error(`Error finding tasks.json: ${error.message}`)
					return createErrorResponse(`Failed to find tasks.json: ${error.message}`)
				}

				// Resolve the path to complexity report (optional)
				let complexityReportPath
				try {
					complexityReportPath = resolveComplexityReportPath({ ...args, tag: resolvedTag }, session)
				} catch (error) {
					log.error(`Error finding complexity report: ${error.message}`)
					// This is optional, so we don't fail the operation
					complexityReportPath = null
				}

				const result = await nextTaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						reportPath: complexityReportPath,
						projectRoot: args.projectRoot,
						tag: resolvedTag
					},
					log,
					{ session }
				)

				log.info(`Next task result: ${result.success ? 'found' : 'none'}`)
				return handleApiResult(result, log, 'Error finding next task', undefined, args.projectRoot)
			} catch (error) {
				const errorMessage = `查找下一个任务失败: ${error.message || '未知错误'}`
				log.error(`[next-task tool] ${errorMessage}`)

				// Get tag info for better error context
				const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

				return createErrorResponse(errorMessage, undefined, tagInfo, 'NEXT_TASK_FAILED', nextTaskParameterHelp)
			}
		})
	})
}
