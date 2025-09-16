/**
 * tools/update-subtask.js
 * Tool to append additional information to a specific subtask
 */

import { z } from 'zod'
import { resolveTag } from '../../../scripts/modules/utils.js'
import { updateSubtaskByIdDirect } from '../core/task-master-core.js'
import { findTasksPath } from '../core/utils/path-utils.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot } from './utils.js'

/**
 * Register the update-subtask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerUpdateSubtaskTool(server) {
	server.addTool({
		name: 'update_subtask',
		description:
			'Updates a specific subtask by ID with manual field changes. Supports both full replacement and incremental append modes.',
		parameters: z.object({
			id: z
				.string()
				.describe(
					'ID of the subtask to update in format "parentId.subtaskId" (e.g., "5.2"). Parent ID is the ID of the task that contains the subtask.'
				),
			// Manual field update parameters
			title: z.string().optional().describe('更新子任务标题'),
			description: z.string().optional().describe('更新子任务描述，支持追加模式'),
			status: z.string().optional().describe('更新子任务状态，支持pending, in-progress, done'),
			details: z.string().optional().describe('更新子任务实现细节，支持追加模式'),
			// Update mode
			append: z.boolean().optional().describe('追加到描述/细节字段而不是替换，默认为false'),
			file: z.string().optional().describe('任务文件的绝对路径'),
			projectRoot: z.string().describe('项目目录，必须是绝对路径'),
			tag: z.string().optional().describe('选择要处理的任务分组')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const toolName = 'update_subtask'

			try {
				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag
				})
				log.info(`Updating subtask with args: ${JSON.stringify(args)}`)

				let tasksJsonPath
				try {
					tasksJsonPath = findTasksPath({ projectRoot: args.projectRoot, file: args.file }, log)
				} catch (error) {
					log.error(`${toolName}: Error finding tasks.json: ${error.message}`)
					return createErrorResponse(`Failed to find tasks.json: ${error.message}`)
				}

				// Prepare manual field update data
				const updateData = {
					fieldsToUpdate: {
						title: args.title,
						description: args.description,
						status: args.status,
						details: args.details
					},
					appendMode: args.append || false
				}

				// Check if at least one field to update is provided
				const hasUpdates = Object.values(updateData.fieldsToUpdate).some(
					(value) => value !== undefined
				)
				if (!hasUpdates) {
					return createErrorResponse(
						'At least one field to update must be provided',
						undefined,
						undefined,
						'NO_UPDATES_PROVIDED'
					)
				}

				const result = await updateSubtaskByIdDirect(
					{
						tasksJsonPath: tasksJsonPath,
						id: args.id,
						fieldsToUpdate: updateData.fieldsToUpdate,
						appendMode: updateData.appendMode,
						projectRoot: args.projectRoot,
						tag: resolvedTag
					},
					log,
					{ session }
				)

				if (result.success) {
					log.info(`Successfully updated subtask with ID ${args.id}`)
				} else {
					log.error(`Failed to update subtask: ${result.error?.message || 'Unknown error'}`)
				}

				return handleApiResult(result, log, 'Error updating subtask', undefined, args.projectRoot)
			} catch (error) {
				log.error(`Critical error in ${toolName} tool execute: ${error.message}`)
				return createErrorResponse(`Internal tool error (${toolName}): ${error.message}`)
			}
		})
	})
}
