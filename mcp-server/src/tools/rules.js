/**
 * tools/rules.js
 * Tool to add or remove rules from a project (MCP server)
 */

import { z } from 'zod'
import { RULE_PROFILES } from '../../../src/constants/profiles.js'
import { rulesDirect } from '../core/direct-functions/rules.js'
import { createErrorResponse, handleApiResult, withNormalizedProjectRoot, getTagInfo, generateParameterHelp } from './utils.js'

/**
 * Register the rules tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */

// Generate parameter help for rules tool
const rulesParameterHelp = generateParameterHelp(
	'rules',
	[
		{ name: 'projectRoot', description: '项目根目录的绝对路径' },
		{ name: 'action', description: '操作类型（add 或 remove）' },
		{ name: 'profiles', description: '要添加或移除的规则配置列表' }
	],
	[
		{ name: 'force', description: '是否强制移除（危险操作）' }
	],
	[
		'{"projectRoot": "/path/to/project", "action": "add", "profiles": ["cursor"]}',
		'{"projectRoot": "/path/to/project", "action": "remove", "profiles": ["windsurf"]}',
		'{"projectRoot": "/path/to/project", "action": "add", "profiles": ["cursor", "roo"], "force": false}'
	]
)

export function registerRulesTool(server) {
	server.addTool({
		name: 'rules',
		description: 'Add or remove rule profiles from the project.',
		parameters: z.object({
			action: z.enum(['add', 'remove']).describe('Whether to add or remove rule profiles.'),
			profiles: z
				.array(z.enum(RULE_PROFILES))
				.min(1)
				.describe(
					`List of rule profiles to add or remove (e.g., [\"cursor\", \"roo\"]). Available options: ${RULE_PROFILES.join(', ')}`
				),
			projectRoot: z
				.string()
				.describe('The root directory of the project. Must be an absolute path.'),
			force: z
				.boolean()
				.optional()
				.default(false)
				.describe(
					'DANGEROUS: Force removal even if it would leave no rule profiles. Only use if you are absolutely certain.'
				)
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(
					`[rules tool] Executing action: ${args.action} for profiles: ${args.profiles.join(', ')} in ${args.projectRoot}`
				)
				const result = await rulesDirect(args, log, { session })
				return handleApiResult(result, log)
			} catch (error) {
				const errorMessage = `Rules operation failed: ${error.message || 'Unknown error'}`
				log.error(`[rules tool] ${errorMessage}`)

				// Get tag info for better error context
				const tagInfo = args.projectRoot ? getTagInfo(args.projectRoot, log) : null

				return createErrorResponse(errorMessage, undefined, tagInfo, 'RULES_OPERATION_FAILED', rulesParameterHelp)
			}
		})
	})
}
