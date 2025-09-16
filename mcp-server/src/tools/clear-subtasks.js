/**
 * tools/clear-subtasks.js
 * Tool for clearing subtasks from parent tasks
 */

import { z } from 'zod'
import { resolveTag } from '../../../scripts/modules/utils.js'
import { clearSubtasksDirect } from '../core/task-master-core.js'
import { findTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot } from './utils.js'

/**
 * Register the clearSubtasks tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerClearSubtasksTool(server) {
	server.addTool({
		name: 'clear_subtasks',
		description: '清除指定任务的子任务',
		parameters: z
			.object({
				id: z.string().optional().describe('要清除子任务的任务ID，支持逗号分隔'),
				all: z.boolean().optional().describe('清除所有任务的子任务'),
				file: z.string().optional().describe('任务文件的绝对路径，默认为tasks/tasks.json'),
				projectRoot: z.string().describe('项目目录，必须是绝对路径'),
				tag: z.string().optional().describe('选择要处理的任务分组')
			})
			.refine((data) => data.id || data.all, {
				message: "Either 'id' or 'all' parameter must be provided",
				path: ['id', 'all']
			}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Clearing subtasks with args: ${JSON.stringify(args)}`)

				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag
				})

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath
				try {
					tasksJsonPath = findTasksPath({ projectRoot: args.projectRoot, file: args.file }, log)
				} catch (error) {
					log.error(`Error finding tasks.json: ${error.message}`)
					return createErrorResponse(`Failed to find tasks.json: ${error.message}`)
				}

				const result = await clearSubtasksDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						all: args.all,

						projectRoot: args.projectRoot,
						tag: resolvedTag
					},
					log,
					{ session }
				)

				if (result.success) {
					log.info(`Subtasks cleared successfully: ${result.data.message}`)
				} else {
					log.error(`Failed to clear subtasks: ${result.error.message}`)
				}

				return handleApiResult(result, log, 'Error clearing subtasks', undefined, args.projectRoot)
			} catch (error) {
				log.error(`Error in clearSubtasks tool: ${error.message}`)
				return createErrorResponse(error.message)
			}
		})
	})
}
