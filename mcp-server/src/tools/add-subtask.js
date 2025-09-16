/**
 * tools/add-subtask.js
 * Tool for adding subtasks to existing tasks
 */

import { z } from 'zod'
import { resolveTag } from '../../../scripts/modules/utils.js'
import { addSubtaskDirect } from '../core/task-master-core.js'
import { findTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot } from './utils.js'

/**
 * Register the addSubtask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerAddSubtaskTool(server) {
	server.addTool({
		name: 'add_subtask',
		description: '为现有任务添加子任务',
		parameters: z.object({
			id: z.string().describe('父任务ID，必填'),
			taskId: z.string().optional().describe('要转换为子任务的现有任务ID'),
			title: z.string().optional().describe('新子任务的标题，创建新子任务时使用'),
			description: z.string().optional().describe('新子任务的描述'),
			details: z.string().optional().describe('新子任务的实现细节'),
			status: z.string().optional().describe("新子任务的状态，默认为'pending'"),
			dependencies: z.string().optional().describe('新子任务的依赖ID列表，用逗号分隔'),
			file: z.string().optional().describe('任务文件的绝对路径，默认为tasks/tasks.json'),
			skipGenerate: z.boolean().optional().describe('跳过重新生成任务文件'),
			projectRoot: z.string().describe('项目目录，必须是绝对路径'),
			tag: z.string().optional().describe('选择要处理的任务分组')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag
				})
				log.info(`Adding subtask with args: ${JSON.stringify(args)}`)

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath
				try {
					tasksJsonPath = findTasksPath({ projectRoot: args.projectRoot, file: args.file }, log)
				} catch (error) {
					log.error(`Error finding tasks.json: ${error.message}`)
					return createErrorResponse(`Failed to find tasks.json: ${error.message}`)
				}

				const result = await addSubtaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						taskId: args.taskId,
						title: args.title,
						description: args.description,
						details: args.details,
						status: args.status,
						dependencies: args.dependencies,
						skipGenerate: args.skipGenerate,
						projectRoot: args.projectRoot,
						tag: resolvedTag
					},
					log,
					{ session }
				)

				if (result.success) {
					log.info(`Subtask added successfully: ${result.data.message}`)
				} else {
					log.error(`Failed to add subtask: ${result.error.message}`)
				}

				return handleApiResult(result, log, 'Error adding subtask', undefined, args.projectRoot)
			} catch (error) {
				log.error(`Error in addSubtask tool: ${error.message}`)
				return createErrorResponse(error.message)
			}
		})
	})
}
