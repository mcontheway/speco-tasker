/**
 * tools/rename-tag.js
 * Tool to rename an existing tag
 */

import { z } from 'zod'
import { renameTagDirect } from '../core/task-master-core.js'
import { findTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot } from './utils.js'

/**
 * Register the renameTag tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerRenameTagTool(server) {
	server.addTool({
		name: 'rename_tag',
		description: '重命名现有标签',
		parameters: z.object({
			oldName: z.string().describe('标签的当前名称'),
			newName: z.string().describe('标签的新名称'),
			file: z.string().optional().describe('任务文件路径，默认为tasks/tasks.json'),
			projectRoot: z.string().describe('项目目录，必须是绝对路径')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Starting rename-tag with args: ${JSON.stringify(args)}`)

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath
				try {
					tasksJsonPath = findTasksPath({ projectRoot: args.projectRoot, file: args.file }, log)
				} catch (error) {
					log.error(`Error finding tasks.json: ${error.message}`)
					return createErrorResponse(`Failed to find tasks.json: ${error.message}`)
				}

				// Call the direct function
				const result = await renameTagDirect(
					{
						tasksJsonPath: tasksJsonPath,
						oldName: args.oldName,
						newName: args.newName,
						projectRoot: args.projectRoot
					},
					log,
					{ session }
				)

				return handleApiResult(result, log, 'Error renaming tag', undefined, args.projectRoot)
			} catch (error) {
				log.error(`Error in rename-tag tool: ${error.message}`)
				return createErrorResponse(error.message)
			}
		})
	})
}
