import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { z } from "zod";
import { AI_COMMAND_NAMES } from "../../src/constants/commands.js";
import {
	LEGACY_CONFIG_FILE,
	TASKMASTER_DIR,
} from "../../src/constants/paths.js";
import { findConfigPath } from "../../src/utils/path-utils.js";
import {
	findProjectRoot,
	isEmpty,
	log,
	resolveEnvVariable,
} from "./core-utils.js";

// Calculate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI functionality has been removed - no model loading needed

// Default configuration values (used if config file is missing or incomplete)
const DEFAULTS = {
	global: {
		logLevel: "info",
		debug: false,
		defaultNumTasks: 10,
		defaultPriority: "medium",
		projectName: "MyProject",
	},
};

// --- Internal Config Loading ---
let loadedConfig = null;
let loadedConfigRoot = null; // Track which root loaded the config

// Custom Error for configuration issues
class ConfigurationError extends Error {
	constructor(message) {
		super(message);
		this.name = "ConfigurationError";
	}
}

function _loadAndValidateConfig(explicitRoot = null) {
	const defaults = DEFAULTS; // Use the defined defaults
	let rootToUse = explicitRoot;
	let configSource = explicitRoot
		? `explicit root (${explicitRoot})`
		: "defaults (no root provided yet)";

	// ---> If no explicit root, TRY to find it <---
	if (!rootToUse) {
		rootToUse = findProjectRoot();
		if (rootToUse) {
			configSource = `found root (${rootToUse})`;
		} else {
			// No root found, use current working directory as fallback
			// This prevents infinite loops during initialization
			rootToUse = process.cwd();
			configSource = `current directory (${rootToUse}) - no project markers found`;
		}
	}
	// ---> End find project root logic <---

	// --- Find configuration file ---
	let configPath = null;
	let config = { ...defaults }; // Start with a deep copy of defaults
	let configExists = false;

	// During initialization (no project markers), skip config file search entirely
	const hasProjectMarkers =
		fs.existsSync(path.join(rootToUse, TASKMASTER_DIR)) ||
		fs.existsSync(path.join(rootToUse, LEGACY_CONFIG_FILE));

	if (hasProjectMarkers) {
		// Only try to find config if we have project markers
		// This prevents the repeated warnings during init
		configPath = findConfigPath(null, { projectRoot: rootToUse });
	}

	if (configPath) {
		configExists = true;
		const isLegacy = configPath.endsWith(LEGACY_CONFIG_FILE);

		try {
			const rawData = fs.readFileSync(configPath, "utf-8");
			const parsedConfig = JSON.parse(rawData);

			// Deep merge parsed config onto defaults (only global config now)
			config = {
				global: { ...defaults.global, ...parsedConfig?.global },
			};
			configSource = `file (${configPath})`; // Update source info

			// Issue deprecation warning if using legacy config file
			if (isLegacy) {
				console.warn(
					chalk.yellow(
						`⚠️  DEPRECATION WARNING: Found configuration in legacy location '${configPath}'. Please migrate to .taskmaster/config.json. Please migrate to .taskmaster/config.json.`,
					),
				);
			}
		} catch (error) {
			// Use console.error for actual errors during parsing
			console.error(
				chalk.red(
					`Error reading or parsing ${configPath}: ${error.message}. Using default configuration.`,
				),
			);
			config = { ...defaults }; // Reset to defaults on parse error
			configSource = `defaults (parse error at ${configPath})`;
		}
	} else {
		// Config file doesn't exist at the determined rootToUse.
		if (explicitRoot) {
			// Only warn if an explicit root was *expected*.
			console.warn(
				chalk.yellow(
					`Warning: Configuration file not found at provided project root (${explicitRoot}). Using default configuration. Run 'task-master models --setup' to configure.`,
				),
			);
		} else {
			// Don't warn about missing config during initialization
			// Only warn if this looks like an existing project (has .taskmaster dir or legacy config marker)
			const hasTaskmasterDir = fs.existsSync(
				path.join(rootToUse, TASKMASTER_DIR),
			);
			const hasLegacyMarker = fs.existsSync(
				path.join(rootToUse, LEGACY_CONFIG_FILE),
			);

			if (hasTaskmasterDir || hasLegacyMarker) {
				console.warn(
					chalk.yellow(
						`Warning: Configuration file not found at derived root (${rootToUse}). Using defaults.`,
					),
				);
			}
		}
		// Keep config as defaults
		config = { ...defaults };
		configSource = `defaults (no config file found at ${rootToUse})`;
	}

	return config;
}

/**
 * Gets the current configuration, loading it if necessary.
 * Handles MCP initialization context gracefully.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @param {boolean} forceReload - Force reloading the config file.
 * @returns {object} The loaded configuration object.
 */
function getConfig(explicitRoot = null, forceReload = false) {
	// Determine if a reload is necessary
	const needsLoad =
		!loadedConfig ||
		forceReload ||
		(explicitRoot && explicitRoot !== loadedConfigRoot);

	if (needsLoad) {
		const newConfig = _loadAndValidateConfig(explicitRoot); // _load handles null explicitRoot

		// Only update the global cache if loading was forced or if an explicit root
		// was provided (meaning we attempted to load a specific project's config).
		// We avoid caching the initial default load triggered without an explicitRoot.
		if (forceReload || explicitRoot) {
			loadedConfig = newConfig;
			loadedConfigRoot = explicitRoot; // Store the root used for this loaded config
		}
		return newConfig; // Return the newly loaded/default config
	}

	// If no load was needed, return the cached config
	return loadedConfig;
}

/**
 * Validates if a provider name is supported.
 * Custom providers (azure, vertex, bedrock, openrouter, ollama) are always allowed.
 * Validated providers must exist in the MODEL_MAP from supported-models.json.
 * @param {string} providerName The name of the provider.
 * @returns {boolean} True if the provider is valid, false otherwise.
 */
// AI functionality has been removed - no validation or Claude Code settings needed

// AI functionality has been removed - no model configuration needed

// --- Global Settings Getters ---

function getGlobalConfig(explicitRoot = null) {
	const config = getConfig(explicitRoot);
	// Ensure global defaults are applied if global section is missing
	return { ...DEFAULTS.global, ...(config?.global || {}) };
}

function getLogLevel(explicitRoot = null) {
	// Directly return value from config
	return getGlobalConfig(explicitRoot).logLevel.toLowerCase();
}

function getDebugFlag(explicitRoot = null) {
	// Directly return value from config, ensure boolean
	return getGlobalConfig(explicitRoot).debug === true;
}

function getDefaultNumTasks(explicitRoot = null) {
	const val = getGlobalConfig(explicitRoot).defaultNumTasks;
	const parsedVal = Number.parseInt(val, 10);
	return Number.isNaN(parsedVal) ? DEFAULTS.global.defaultNumTasks : parsedVal;
}

function getDefaultPriority(explicitRoot = null) {
	// Directly return value from config
	return getGlobalConfig(explicitRoot).defaultPriority;
}

function getProjectName(explicitRoot = null) {
	// Directly return value from config
	return getGlobalConfig(explicitRoot).projectName;
}

/**
 * Writes the configuration object to the file.
 * @param {Object} config The configuration object to write.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {boolean} True if successful, false otherwise.
 */
function writeConfig(config, explicitRoot = null) {
	// ---> Determine root path reliably <---
	let rootPath = explicitRoot;
	if (explicitRoot === null || explicitRoot === undefined) {
		// Logic matching _loadAndValidateConfig
		const foundRoot = findProjectRoot(); // *** Explicitly call findProjectRoot ***
		if (!foundRoot) {
			console.error(
				chalk.red(
					"Error: Could not determine project root. Configuration not saved.",
				),
			);
			return false;
		}
		rootPath = foundRoot;
	}
	// ---> End determine root path logic <---

	// Use new config location: .taskmaster/config.json
	const taskmasterDir = path.join(rootPath, ".taskmaster");
	const configPath = path.join(taskmasterDir, "config.json");

	try {
		// Ensure .taskmaster directory exists
		if (!fs.existsSync(taskmasterDir)) {
			fs.mkdirSync(taskmasterDir, { recursive: true });
		}

		fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
		loadedConfig = config; // Update the cache after successful write
		return true;
	} catch (error) {
		console.error(
			chalk.red(
				`Error writing configuration to ${configPath}: ${error.message}`,
			),
		);
		return false;
	}
}

/**
 * Checks if a configuration file exists at the project root (new or legacy location)
 * @param {string|null} explicitRoot - Optional explicit path to the project root
 * @returns {boolean} True if the file exists, false otherwise
 */
function isConfigFilePresent(explicitRoot = null) {
	return findConfigPath(null, { projectRoot: explicitRoot }) !== null;
}

/**
 * Gets the user ID from the configuration.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string|null} The user ID or null if not found.
 */
function getUserId(explicitRoot = null) {
	const config = getConfig(explicitRoot);
	if (!config.global) {
		config.global = {}; // Ensure global object exists
	}
	if (!config.global.userId) {
		config.global.userId = "1234567890";
		// Attempt to write the updated config.
		// It's important that writeConfig correctly resolves the path
		// using explicitRoot, similar to how getConfig does.
		const success = writeConfig(config, explicitRoot);
		if (!success) {
			// Log an error or handle the failure to write,
			// though for now, we'll proceed with the in-memory default.
			log(
				"warning",
				"Failed to write updated configuration with new userId. Please let the developers know.",
			);
		}
	}
	return config.global.userId;
}

/**
 * Gets a list of all known provider names (both validated and custom).
 * @returns {string[]} An array of all provider names.
 */
function getAllProviders() {
	// Since AI functionality has been removed, return a minimal list
	return [
		"anthropic",
		"openai",
		"google",
		"perplexity",
		"ollama",
		"openrouter",
		"mistral",
		"xai",
		"azure",
	];
}

function getBaseUrlForRole(role, explicitRoot = null) {
	const roleConfig = getModelConfigForRole(role, explicitRoot);
	if (roleConfig && typeof roleConfig.baseURL === "string") {
		return roleConfig.baseURL;
	}
	const provider = roleConfig?.provider;
	if (provider) {
		const envVarName = `${provider.toUpperCase()}_BASE_URL`;
		return resolveEnvVariable(envVarName, null, explicitRoot);
	}
	return undefined;
}

// AI functionality has been removed - no provider constants needed

/**
 * 获取配置参数值
 * @param {string} key - 配置键 (支持点号分隔，如 'global.logLevel')
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {any} 配置值
 */
function getConfigValue(key, explicitRoot = null) {
	const config = getConfig(explicitRoot);
	const keys = key.split(".");
	let value = config;

	for (const k of keys) {
		if (value && typeof value === "object" && k in value) {
			value = value[k];
		} else {
			return undefined;
		}
	}

	return value;
}

/**
 * 设置配置参数值
 * @param {string} key - 配置键
 * @param {any} value - 配置值
 * @param {Object} options - 选项
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {boolean} 成功状态
 */
function setConfigValue(key, value, options = {}, explicitRoot = null) {
	try {
		const config = getConfig(explicitRoot);
		const keys = key.split(".");
		const lastKey = keys.pop();
		let current = config;

		// 创建嵌套对象结构
		for (const k of keys) {
			if (!(k in current) || typeof current[k] !== "object") {
				current[k] = {};
			}
			current = current[k];
		}

		// 备份旧值
		const oldValue = current[lastKey];

		// 设置新值
		current[lastKey] = value;

		// 验证配置
		if (options.validate !== false) {
			const validation = validateConfiguration(config, explicitRoot);
			if (!validation.valid) {
				throw new ConfigurationError(
					`配置验证失败: ${validation.errors.join(", ")}`,
				);
			}
		}

		// 保存配置
		const success = writeConfig(config, explicitRoot);
		if (!success) {
			throw new ConfigurationError("配置保存失败");
		}

		// 记录配置变更历史
		if (options.trackHistory !== false) {
			recordConfigChange(key, oldValue, value, options, explicitRoot);
		}

		return true;
	} catch (error) {
		console.error(chalk.red(`设置配置失败 (${key}): ${error.message}`));
		return false;
	}
}

/**
 * 获取所有配置参数
 * @param {Object} options - 选项
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {Object} 配置对象
 */
function getConfigValues(options = {}, explicitRoot = null) {
	const config = getConfig(explicitRoot);
	const result = {
		global: config.global || {},
		paths: config.paths || {},
		features: config.features || {},
		metadata: {
			source: "file",
			lastModified: null,
			version: "1.0.0",
		},
	};

	// 获取文件修改时间
	try {
		const configPath = findConfigPath(null, { projectRoot: explicitRoot });
		if (configPath) {
			const stats = fs.statSync(configPath);
			result.metadata.lastModified = stats.mtime.toISOString();
		}
	} catch (error) {
		// 忽略错误
	}

	// 如果只需要特定部分
	if (options.section) {
		return result[options.section] || {};
	}

	return result;
}

/**
 * 验证配置
 * @param {Object} config - 要验证的配置对象
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {Object} 验证结果
 */
function validateConfiguration(config = null, explicitRoot = null) {
	const result = {
		valid: true,
		errors: [],
		warnings: [],
	};

	try {
		const configToValidate = config || getConfig(explicitRoot);

		// 验证全局配置
		if (configToValidate.global) {
			const globalConfig = configToValidate.global;

			// 验证日志级别
			if (
				globalConfig.logLevel &&
				!["error", "warn", "info", "debug", "trace"].includes(
					globalConfig.logLevel,
				)
			) {
				result.errors.push("无效的日志级别");
			}

			// 验证默认任务数量
			if (globalConfig.defaultNumTasks !== undefined) {
				const numTasks = Number(globalConfig.defaultNumTasks);
				if (Number.isNaN(numTasks) || numTasks < 1 || numTasks > 100) {
					result.errors.push("默认任务数量必须是1-100之间的数字");
				}
			}

			// 验证默认优先级
			if (
				globalConfig.defaultPriority &&
				!["low", "medium", "high"].includes(globalConfig.defaultPriority)
			) {
				result.errors.push("无效的默认优先级");
			}
		}

		// 验证路径配置
		if (configToValidate.paths) {
			const pathsConfig = configToValidate.paths;

			// 验证必需的路径
			const requiredPaths = ["root", "dirs"];
			for (const pathKey of requiredPaths) {
				if (!pathsConfig[pathKey]) {
					result.errors.push(`缺少必需的路径配置: ${pathKey}`);
				}
			}

			// 验证路径格式
			if (pathsConfig.root?.speco) {
				const specoPath = pathsConfig.root.speco;
				if (typeof specoPath !== "string" || specoPath.length === 0) {
					result.errors.push("speco根路径必须是非空字符串");
				}
			}
		}

		// 检查配置一致性
		if (configToValidate.global && configToValidate.paths) {
			// 这里可以添加跨配置部分的验证逻辑
		}

		result.valid = result.errors.length === 0;
	} catch (error) {
		result.valid = false;
		result.errors.push(`配置验证过程中出错: ${error.message}`);
	}

	return result;
}

/**
 * 获取配置变更历史
 * @param {Object} options - 查询选项
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {Array} 历史记录
 */
function getConfigHistory(options = {}, explicitRoot = null) {
	try {
		const historyFile = getConfigHistoryFile(explicitRoot);
		if (!fs.existsSync(historyFile)) {
			return [];
		}

		const content = fs.readFileSync(historyFile, "utf8");
		const history = JSON.parse(content);

		// 应用过滤器
		let filteredHistory = history;

		if (options.key) {
			filteredHistory = filteredHistory.filter(
				(entry) => entry.key === options.key,
			);
		}

		if (options.userId) {
			filteredHistory = filteredHistory.filter(
				(entry) => entry.userId === options.userId,
			);
		}

		if (options.startTime) {
			filteredHistory = filteredHistory.filter(
				(entry) => new Date(entry.timestamp) >= new Date(options.startTime),
			);
		}

		if (options.endTime) {
			filteredHistory = filteredHistory.filter(
				(entry) => new Date(entry.timestamp) <= new Date(options.endTime),
			);
		}

		// 排序（最新的在前）
		filteredHistory.sort(
			(a, b) => new Date(b.timestamp) - new Date(a.timestamp),
		);

		// 限制数量
		const limit = options.limit || 50;
		return filteredHistory.slice(0, limit);
	} catch (error) {
		console.warn(`获取配置历史失败: ${error.message}`);
		return [];
	}
}

/**
 * 回滚配置到指定版本
 * @param {string} versionId - 版本ID
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {boolean} 成功状态
 */
function rollbackConfig(versionId, explicitRoot = null) {
	try {
		const history = getConfigHistory({}, explicitRoot);
		const targetEntry = history.find((entry) => entry.versionId === versionId);

		if (!targetEntry) {
			throw new ConfigurationError(`未找到配置版本: ${versionId}`);
		}

		// 获取当前配置
		const currentConfig = getConfig(explicitRoot);

		// 应用回滚
		const rolledBackConfig = applyConfigChanges(
			currentConfig,
			targetEntry.rollbackData,
		);

		// 验证并保存
		const validation = validateConfiguration(rolledBackConfig, explicitRoot);
		if (!validation.valid) {
			throw new ConfigurationError(
				`回滚后的配置验证失败: ${validation.errors.join(", ")}`,
			);
		}

		const success = writeConfig(rolledBackConfig, explicitRoot);
		if (!success) {
			throw new ConfigurationError("配置回滚保存失败");
		}

		// 记录回滚操作
		recordConfigChange(
			"system.rollback",
			versionId,
			"applied",
			{
				rollback: true,
				targetVersion: versionId,
			},
			explicitRoot,
		);

		return true;
	} catch (error) {
		console.error(chalk.red(`配置回滚失败: ${error.message}`));
		return false;
	}
}

/**
 * 重置配置为默认值
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {boolean} 成功状态
 */
function resetConfigToDefaults(explicitRoot = null) {
	try {
		const defaultConfig = {
			global: { ...DEFAULTS.global },
		};

		const success = writeConfig(defaultConfig, explicitRoot);
		if (!success) {
			throw new ConfigurationError("默认配置保存失败");
		}

		// 记录重置操作
		recordConfigChange(
			"system.reset",
			"current",
			"defaults",
			{
				reset: true,
			},
			explicitRoot,
		);

		return true;
	} catch (error) {
		console.error(chalk.red(`重置配置失败: ${error.message}`));
		return false;
	}
}

/**
 * 记录配置变更
 * @private
 * @param {string} key - 配置键
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @param {Object} options - 选项
 * @param {string|null} explicitRoot - 项目根目录
 */
function recordConfigChange(
	key,
	oldValue,
	newValue,
	options = {},
	explicitRoot = null,
) {
	try {
		const historyFile = getConfigHistoryFile(explicitRoot);
		let history = [];

		// 读取现有历史
		if (fs.existsSync(historyFile)) {
			const content = fs.readFileSync(historyFile, "utf8");
			history = JSON.parse(content);
		}

		// 创建历史条目
		const entry = {
			versionId: generateVersionId(),
			timestamp: new Date().toISOString(),
			key,
			oldValue,
			newValue,
			userId: getUserId(explicitRoot),
			source: options.source || "cli",
			metadata: options.metadata || {},
			rollbackData: generateRollbackData(key, oldValue, newValue),
		};

		history.push(entry);

		// 限制历史记录数量
		const maxHistory = 100;
		if (history.length > maxHistory) {
			history = history.slice(-maxHistory);
		}

		// 保存历史
		fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
	} catch (error) {
		console.warn(`记录配置变更失败: ${error.message}`);
	}
}

/**
 * 获取配置历史文件路径
 * @private
 * @param {string|null} explicitRoot - 项目根目录
 * @returns {string} 历史文件路径
 */
function getConfigHistoryFile(explicitRoot = null) {
	let rootPath = explicitRoot;
	if (!rootPath) {
		rootPath = findProjectRoot();
		if (!rootPath) {
			rootPath = process.cwd();
		}
	}

	const configDir = path.join(rootPath, ".speco");
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}

	return path.join(configDir, "config-history.json");
}

/**
 * 生成版本ID
 * @private
 * @returns {string} 版本ID
 */
function generateVersionId() {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `v${timestamp}_${random}`;
}

/**
 * 生成回滚数据
 * @private
 * @param {string} key - 配置键
 * @param {any} oldValue - 旧值
 * @param {any} newValue - 新值
 * @returns {Object} 回滚数据
 */
function generateRollbackData(key, oldValue, newValue) {
	return {
		key,
		from: newValue,
		to: oldValue,
	};
}

/**
 * 应用配置变更
 * @private
 * @param {Object} config - 当前配置
 * @param {Object} changes - 变更数据
 * @returns {Object} 修改后的配置
 */
function applyConfigChanges(config, changes) {
	const result = JSON.parse(JSON.stringify(config)); // 深拷贝

	// 这里实现配置变更应用逻辑
	// 简化版本：直接设置值
	const keys = changes.key.split(".");
	let current = result;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (!(key in current) || typeof current[key] !== "object") {
			current[key] = {};
		}
		current = current[key];
	}

	current[keys[keys.length - 1]] = changes.to;

	return result;
}

/**
 * 验证提供商名称是否有效
 * @param {string} provider - 要验证的提供商名称
 * @returns {boolean} 是否有效
 */
function validateProvider(provider) {
	if (!provider || typeof provider !== "string") {
		return false;
	}

	const validProviders = [
		"anthropic",
		"openai",
		"google",
		"perplexity",
		"ollama",
		"openrouter",
		"mistral",
		"xai",
		"azure",
	];

	return validProviders.includes(provider.toLowerCase());
}

/**
 * 验证提供商和模型组合是否有效
 * @param {string} provider - 提供商名称
 * @param {string} model - 模型名称
 * @returns {boolean} 是否有效组合
 */
function validateProviderModelCombination(provider, model) {
	if (!model) {
		return false;
	}

	// 对于不在验证列表中的provider，默认返回true（向后兼容）
	if (!validateProvider(provider)) {
		return true;
	}

	// 对于某些提供商，模型列表是空的，说明支持所有模型
	const emptyModelLists = ["ollama", "openrouter"];

	if (emptyModelLists.includes(provider.toLowerCase())) {
		return true;
	}

	// 基本的provider-model匹配验证
	const providerLower = provider.toLowerCase();
	const modelLower = model.toLowerCase();

	// OpenAI提供商只能使用OpenAI的模型
	if (providerLower === "openai") {
		return modelLower.includes("gpt") || modelLower.includes("chatgpt");
	}

	// Anthropic提供商只能使用Claude模型
	if (providerLower === "anthropic") {
		return modelLower.includes("claude");
	}

	// Google提供商只能使用Gemini/PaLM模型
	if (providerLower === "google") {
		return (
			modelLower.includes("gemini") ||
			modelLower.includes("palm") ||
			modelLower.includes("bard")
		);
	}

	// Perplexity提供商只能使用Sonar模型
	if (providerLower === "perplexity") {
		return modelLower.includes("sonar");
	}

	// Mistral提供商只能使用Mistral模型
	if (providerLower === "mistral") {
		return modelLower.includes("mistral");
	}

	// XAI提供商只能使用Grok模型
	if (providerLower === "xai") {
		return modelLower.includes("grok");
	}

	// Azure提供商只能使用Azure OpenAI模型
	if (providerLower === "azure") {
		return modelLower.includes("gpt") || modelLower.includes("azure");
	}

	// 对于其他provider，默认返回true（向后兼容）
	return true;
}

export {
	// Core config access
	getConfig,
	writeConfig,
	ConfigurationError,
	isConfigFilePresent,
	// Global setting getters (No env var overrides)
	getLogLevel,
	getDebugFlag,
	getDefaultNumTasks,
	getDefaultPriority,
	getProjectName,
	getUserId,
	// Configuration management
	getConfigValue,
	setConfigValue,
	getConfigValues,
	validateConfiguration,
	getConfigHistory,
	rollbackConfig,
	resetConfigToDefaults,
	// Provider validation
	validateProvider,
	validateProviderModelCombination,
	getAllProviders,
};
