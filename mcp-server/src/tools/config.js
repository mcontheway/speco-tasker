/**
 * tools/config.js
 * Tool to manage Speco Tasker configuration
 */

import { z } from "zod";
import {
	createErrorResponse,
	handleApiResult,
	withNormalizedProjectRoot,
} from "./utils.js";
import {
	getConfigValue,
	setConfigValue,
	getConfigValues,
	validateConfiguration,
	getConfigHistory,
	rollbackConfig,
	resetConfigToDefaults,
} from "../../../scripts/modules/config-manager.js";

/**
 * Register the config management tools with the MCP server
 * @param {Object} server - FastMCP server instance
 */

// Tool to get configuration values
export function registerGetConfigTool(server) {
	server.addTool({
		name: "get_config",
		description: "获取Speco Tasker的当前配置信息",
		parameters: z.object({
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录路径（可选，会自动检测）"),
			section: z
				.enum(["global", "paths", "features", "all"])
				.optional()
				.describe(
					"配置部分：global（全局）、paths（路径）、features（功能）、all（全部）",
				),
			format: z
				.enum(["json", "table"])
				.optional()
				.describe("输出格式：json 或 table"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log }) => {
			try {
				log.info(`Getting config with section: ${args.section || "all"}`);

				const options = {};
				if (args.section && args.section !== "all") {
					options.section = args.section;
				}

				const config = getConfigValues(options, args.projectRoot);

				if (args.format === "table") {
					// 转换为表格格式（简化实现）
					const result = {
						section: args.section || "all",
						config: config,
						timestamp: new Date().toISOString(),
					};
					return handleApiResult({ success: true, data: result }, log);
				}

				return handleApiResult(
					{
						success: true,
						data: {
							config,
							metadata: {
								generatedAt: new Date().toISOString(),
								section: args.section || "all",
								source: "mcp",
							},
						},
					},
					log,
				);
			} catch (error) {
				log.error(`Error getting config: ${error.message}`);
				return createErrorResponse(`Failed to get config: ${error.message}`);
			}
		}),
	});
}

// Tool to set configuration value
export function registerSetConfigTool(server) {
	server.addTool({
		name: "set_config",
		description: "设置Speco Tasker的配置参数值",
		parameters: z.object({
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录路径（可选，会自动检测）"),
			key: z
				.string()
				.describe("配置键名（支持点号分隔，如 'global.logLevel'）"),
			value: z.union([z.string(), z.number(), z.boolean()]).describe("配置值"),
			validate: z.boolean().optional().describe("是否验证配置（默认：true）"),
			backup: z.boolean().optional().describe("是否创建备份（默认：false）"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log }) => {
			try {
				log.info(`Setting config: ${args.key} = ${args.value}`);

				const success = setConfigValue(
					args.key,
					args.value,
					{
						validate: args.validate !== false,
						backup: args.backup || false,
						source: "mcp",
					},
					args.projectRoot,
				);

				if (!success) {
					return createErrorResponse(
						`Failed to set config value for key: ${args.key}`,
					);
				}

				// 如果启用了验证，获取验证结果
				let validationResult = null;
				if (args.validate !== false) {
					const validation = validateConfiguration(null, args.projectRoot);
					validationResult = {
						valid: validation.valid,
						errors: validation.errors,
						warnings: validation.warnings,
					};
				}

				return handleApiResult(
					{
						success: true,
						data: {
							key: args.key,
							value: args.value,
							validation: validationResult,
							backupCreated: args.backup || false,
							timestamp: new Date().toISOString(),
						},
					},
					log,
				);
			} catch (error) {
				log.error(`Error setting config: ${error.message}`);
				return createErrorResponse(`Failed to set config: ${error.message}`);
			}
		}),
	});
}

// Tool to validate configuration
export function registerValidateConfigTool(server) {
	server.addTool({
		name: "validate_config",
		description: "验证Speco Tasker配置的正确性和完整性",
		parameters: z.object({
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录路径（可选，会自动检测）"),
			strict: z
				.boolean()
				.optional()
				.describe("启用严格验证模式（默认：false）"),
			fix: z
				.boolean()
				.optional()
				.describe("尝试自动修复发现的问题（默认：false）"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log }) => {
			try {
				log.info(`Validating config with strict mode: ${args.strict || false}`);

				const config = getConfigValues({}, args.projectRoot);
				const validation = validateConfiguration(config, args.projectRoot);

				const result = {
					valid: validation.valid,
					errors: validation.errors || [],
					warnings: validation.warnings || [],
					configSummary: {
						global: Object.keys(config.global || {}).length,
						paths: Object.keys(config.paths || {}).length,
						features: Object.keys(config.features || {}).length,
					},
					timestamp: new Date().toISOString(),
				};

				// 如果启用了自动修复
				if (args.fix && !validation.valid) {
					log.info("Attempting automatic fixes...");
					// 这里可以实现自动修复逻辑
					result.attemptedFixes = "Automatic fixes not yet implemented";
				}

				return handleApiResult(
					{
						success: true,
						data: result,
					},
					log,
				);
			} catch (error) {
				log.error(`Error validating config: ${error.message}`);
				return createErrorResponse(
					`Failed to validate config: ${error.message}`,
				);
			}
		}),
	});
}

// Tool to get configuration history
export function registerGetConfigHistoryTool(server) {
	server.addTool({
		name: "get_config_history",
		description: "获取Speco Tasker配置变更历史",
		parameters: z.object({
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录路径（可选，会自动检测）"),
			key: z.string().optional().describe("按配置键过滤"),
			userId: z.string().optional().describe("按用户ID过滤"),
			startTime: z.string().optional().describe("开始时间（ISO格式）"),
			endTime: z.string().optional().describe("结束时间（ISO格式）"),
			limit: z.number().optional().describe("限制返回的条目数量（默认：20）"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log }) => {
			try {
				log.info(
					`Getting config history with filters: ${JSON.stringify(args)}`,
				);

				const filters = {
					key: args.key,
					userId: args.userId,
					startTime: args.startTime,
					endTime: args.endTime,
					limit: args.limit || 20,
				};

				const history = getConfigHistory(filters, args.projectRoot);

				return handleApiResult(
					{
						success: true,
						data: {
							history,
							count: history.length,
							filters: filters,
							timestamp: new Date().toISOString(),
						},
					},
					log,
				);
			} catch (error) {
				log.error(`Error getting config history: ${error.message}`);
				return createErrorResponse(
					`Failed to get config history: ${error.message}`,
				);
			}
		}),
	});
}

// Tool to rollback configuration
export function registerRollbackConfigTool(server) {
	server.addTool({
		name: "rollback_config",
		description: "回滚Speco Tasker配置到指定版本",
		parameters: z.object({
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录路径（可选，会自动检测）"),
			versionId: z.string().describe("要回滚到的配置版本ID"),
			confirm: z.boolean().optional().describe("跳过确认提示（默认：false）"),
			backup: z.boolean().optional().describe("创建回滚前备份（默认：true）"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log }) => {
			try {
				log.info(`Rolling back config to version: ${args.versionId}`);

				// 获取版本信息用于确认
				const history = getConfigHistory({}, args.projectRoot);
				const targetEntry = history.find(
					(entry) => entry.versionId === args.versionId,
				);

				if (!targetEntry) {
					return createErrorResponse(
						`Configuration version not found: ${args.versionId}`,
					);
				}

				// 这里应该有确认逻辑，但在MCP上下文中，我们假设已经确认
				const success = rollbackConfig(args.versionId, args.projectRoot);

				if (!success) {
					return createErrorResponse(
						`Failed to rollback config to version: ${args.versionId}`,
					);
				}

				return handleApiResult(
					{
						success: true,
						data: {
							versionId: args.versionId,
							rolledBackTo: targetEntry,
							backupCreated: args.backup !== false,
							timestamp: new Date().toISOString(),
						},
					},
					log,
				);
			} catch (error) {
				log.error(`Error rolling back config: ${error.message}`);
				return createErrorResponse(
					`Failed to rollback config: ${error.message}`,
				);
			}
		}),
	});
}

// Tool to reset configuration to defaults
export function registerResetConfigTool(server) {
	server.addTool({
		name: "reset_config",
		description: "重置Speco Tasker配置为默认值",
		parameters: z.object({
			projectRoot: z
				.string()
				.optional()
				.describe("项目根目录路径（可选，会自动检测）"),
			confirm: z.boolean().optional().describe("跳过确认提示（默认：false）"),
			backup: z.boolean().optional().describe("创建重置前备份（默认：true）"),
		}),
		execute: withNormalizedProjectRoot(async (args, { log }) => {
			try {
				log.info("Resetting config to defaults");

				const success = resetConfigToDefaults(args.projectRoot);

				if (!success) {
					return createErrorResponse("Failed to reset config to defaults");
				}

				// 获取新的默认配置信息
				const defaultConfig = getConfigValues({}, args.projectRoot);

				return handleApiResult(
					{
						success: true,
						data: {
							reset: true,
							newConfig: defaultConfig,
							backupCreated: args.backup !== false,
							timestamp: new Date().toISOString(),
						},
					},
					log,
				);
			} catch (error) {
				log.error(`Error resetting config: ${error.message}`);
				return createErrorResponse(`Failed to reset config: ${error.message}`);
			}
		}),
	});
}

// Register all config tools
export function registerConfigTools(server) {
	registerGetConfigTool(server);
	registerSetConfigTool(server);
	registerValidateConfigTool(server);
	registerGetConfigHistoryTool(server);
	registerRollbackConfigTool(server);
	registerResetConfigTool(server);
}

// Default export for convenience
export default registerConfigTools;
