/**
 * tools/add-task.js
 * Tool to add a new task using AI
 */

import { z } from 'zod'
import { resolveTag } from '../../../scripts/modules/utils.js'
import { addTaskDirect } from '../core/task-master-core.js'
import { findTasksPath } from '../core/utils/path-utils.js'
import {
	createErrorResponse,
	generateParameterHelp,
	getTagInfo,
	handleApiResult,
	withNormalizedProjectRoot
} from './utils.js'

/**
 * Register the addTask tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
// Generate parameter help for add_task tool
const addTaskParameterHelp = generateParameterHelp(
	'add_task',
	[
		{ name: 'projectRoot', description: '项目根目录的绝对路径' },
		{ name: 'title', description: '任务标题' },
		{ name: 'description', description: '任务描述' }
	],
	[
		{ name: 'details', description: '实现细节' },
		{ name: 'testStrategy', description: '测试策略' },
		{ name: 'dependencies', description: '依赖的任务ID列表，用逗号分隔' },
		{ name: 'priority', description: '任务优先级（high, medium, low）' },
		{ name: 'file', description: '任务文件路径（默认：tasks/tasks.json）' },
		{ name: 'tag', description: '选择要处理的任务分组' }
	],
	[
		'{"projectRoot": "/path/to/project", "title": "用户认证", "description": "实现JWT用户认证", "priority": "high"}',
		'{"projectRoot": "/path/to/project", "title": "数据库迁移", "description": "创建用户表结构", "details": "使用SQL创建users表，包含id, email, password字段"}'
	]
)

export function registerAddTaskTool(server) {
	server.addTool({
		name: 'add_task',
		description: '手动添加新任务',
		parameters: z.object({
			projectRoot: z.string().describe('项目根目录的绝对路径'),
			title: z.string().describe('任务标题'),
			description: z.string().describe('任务描述'),
			details: z.string().optional().describe('实现细节'),
			testStrategy: z.string().optional().describe('测试策略'),
			dependencies: z.string().optional().describe('依赖的任务ID列表，用逗号分隔'),
			priority: z.string().optional().describe('任务优先级，支持high, medium, low'),
			file: z.string().optional().describe('任务文件路径，默认为tasks/tasks.json'),
			tag: z.string().optional().describe('选择要处理的任务分组')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Starting add-task with args: ${JSON.stringify(args)}`)

				const resolvedTag = resolveTag({
					projectRoot: args.projectRoot,
					tag: args.tag
				})

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath
				try {
					tasksJsonPath = findTasksPath({ projectRoot: args.projectRoot, file: args.file }, log)
				} catch (error) {
					const errorMessage = `Failed to find tasks.json: ${error.message || 'File not found'}`
					log.error(`[add-task tool] ${errorMessage}`)

					// Get tag info for better error context
					const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

					return createErrorResponse(errorMessage, undefined, tagInfo, 'TASKS_JSON_NOT_FOUND')
				}

				// Call the direct function
				const result = await addTaskDirect(
					{
						tasksJsonPath: tasksJsonPath,
						title: args.title,
						description: args.description,
						details: args.details,
						testStrategy: args.testStrategy,
						dependencies: args.dependencies,
						priority: args.priority,
						projectRoot: args.projectRoot,
						tag: resolvedTag
					},
					log,
					{ session }
				)

				return handleApiResult(result, log, 'Error adding task', undefined, args.projectRoot)
			} catch (error) {
				const errorMessage = `添加任务失败: ${error.message || '未知错误'}`
				log.error(`[add-task tool] ${errorMessage}`)

				// Get tag info for better error context
				const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

				return createErrorResponse(
					errorMessage,
					undefined,
					tagInfo,
					'ADD_TASK_FAILED',
					addTaskParameterHelp
				)
			}
		})
	})
}
