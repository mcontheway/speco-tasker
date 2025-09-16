import { z } from 'zod'
import { RULE_PROFILES } from '../../../src/constants/profiles.js'
import { initializeProjectDirect } from '../core/task-master-core.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot, getTagInfo, generateParameterHelp } from './utils.js'

// Generate parameter help for initialize_project tool
const initializeProjectParameterHelp = generateParameterHelp(
	'initialize_project',
	[
		{ name: 'projectRoot', description: '项目根目录的绝对路径' }
	],
	[
		{ name: 'skipInstall', description: '是否跳过依赖安装' },
		{ name: 'addAliases', description: '是否添加shell别名' },
		{ name: 'initGit', description: '是否初始化Git仓库' },
		{ name: 'storeTasksInGit', description: '是否在Git中存储任务' },
		{ name: 'yes', description: '是否跳过确认提示' },
		{ name: 'rules', description: '要包含的规则配置列表' }
	],
	[
		'{"projectRoot": "/path/to/project"}',
		'{"projectRoot": "/path/to/project", "addAliases": true, "initGit": true}',
		'{"projectRoot": "/path/to/project", "rules": ["cursor"], "yes": true}'
	]
)

export function registerInitializeProjectTool(server) {
	server.addTool({
		name: 'initialize_project',
		description:
			'Initializes a new Task Master project structure by calling the core initialization logic. Creates necessary folders and configuration files for Task Master in the current directory.',
		parameters: z.object({
			skipInstall: z
				.boolean()
				.optional()
				.default(false)
				.describe(
					'Skip installing dependencies automatically. Never do this unless you are sure the project is already installed.'
				),
			addAliases: z
				.boolean()
				.optional()
				.default(true)
				.describe('Add shell aliases (tm, taskmaster) to shell config file.'),
			initGit: z
				.boolean()
				.optional()
				.default(true)
				.describe('Initialize Git repository in project root.'),
			storeTasksInGit: z
				.boolean()
				.optional()
				.default(true)
				.describe('Store tasks in Git (tasks.json and tasks/ directory).'),
			yes: z
				.boolean()
				.optional()
				.default(true)
				.describe('Skip prompts and use default values. Always set to true for MCP tools.'),
			projectRoot: z
				.string()
				.describe(
					'The root directory for the project. ALWAYS SET THIS TO THE PROJECT ROOT DIRECTORY. IF NOT SET, THE TOOL WILL NOT WORK.'
				),
			rules: z
				.array(z.enum(RULE_PROFILES))
				.optional()
				.describe(
					`List of rule profiles to include at initialization. If omitted, defaults to Cursor profile only. Available options: ${RULE_PROFILES.join(', ')}`
				)
		}),
		execute: withNormalizedProjectRoot(async (args, context) => {
			const { log } = context
			const session = context.session

			try {
				log.info(`Executing initialize_project tool with args: ${JSON.stringify(args)}`)

				const result = await initializeProjectDirect(args, log, { session })

				return handleApiResult(result, log, 'Initialization failed', undefined, args.projectRoot)
			} catch (error) {
				const errorMessage = `Project initialization failed: ${error.message || 'Unknown error'}`
				log.error(errorMessage, error)

				// Get tag info for better error context
				const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

				return createErrorResponse(errorMessage, undefined, tagInfo, 'INITIALIZE_PROJECT_FAILED', initializeProjectParameterHelp)
			}
		})
	})
}
