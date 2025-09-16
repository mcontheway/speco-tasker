/**
 * tools/use-tag.js
 * Tool to switch to a different tag context
 */

import { z } from 'zod'
import { useTagDirect } from '../core/task-master-core.js'
import { findTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot, getTagInfo, generateParameterHelp } from './utils.js'

/**
 * Register the useTag tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */

// Generate parameter help for use_tag tool
const useTagParameterHelp = generateParameterHelp(
	'use_tag',
	[
		{ name: 'projectRoot', description: '项目根目录的绝对路径' },
		{ name: 'name', description: '要切换到的标签名称' }
	],
	[
		{ name: 'file', description: '任务文件路径（默认：tasks/tasks.json）' }
	],
	[
		'{"projectRoot": "/path/to/project", "name": "feature-branch"}',
		'{"projectRoot": "/path/to/project", "name": "master"}'
	]
)

export function registerUseTagTool(server) {
	server.addTool({
		name: 'use_tag',
		description: 'Switch to a different tag context for task operations',
		parameters: z.object({
			name: z.string().describe('Name of the tag to switch to'),
			file: z.string().optional().describe('Path to the tasks file (default: tasks/tasks.json)'),
			projectRoot: z.string().describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Starting use-tag with args: ${JSON.stringify(args)}`)

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath
				try {
					tasksJsonPath = findTasksPath({ projectRoot: args.projectRoot, file: args.file }, log)
				} catch (error) {
					const errorMessage = `Failed to find tasks.json: ${error.message || 'File not found'}`
					log.error(`[use-tag tool] ${errorMessage}`)

					// Get tag info for better error context
					const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

					return createErrorResponse(errorMessage, undefined, tagInfo, 'USE_TAG_FAILED', useTagParameterHelp)
				}

				// Call the direct function
				const result = await useTagDirect(
					{
						tasksJsonPath: tasksJsonPath,
						name: args.name,
						projectRoot: args.projectRoot
					},
					log,
					{ session }
				)

				return handleApiResult(result, log, 'Error switching tag', undefined, args.projectRoot)
			} catch (error) {
				log.error(`Error in use-tag tool: ${error.message}`)
				return createErrorResponse(error.message)
			}
		})
	})
}
