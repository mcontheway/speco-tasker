import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { z } from "zod";
// AI functionality has been removed - no AI command constants needed
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

// Calculate __dirname in ESM - Jest compatible
let __filename;
try {
	__filename = fileURLToPath(import.meta.url);
} catch (e) {
	// Fallback for Jest environment - use a simple approach
	__filename = path.resolve(process.cwd(), "scripts/modules/config-manager.js");
}
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

			// Deep merge parsed config onto defaults
			config = {
				global: { ...defaults.global, ...parsedConfig?.global },
				project: parsedConfig?.project || {},
				paths: parsedConfig?.paths || {},
				logging: parsedConfig?.logging || {},
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
					`Warning: Configuration file not found at provided project root (${explicitRoot}). Using default configuration.`,
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
	// Read project name from config.project.name, fallback to global default
	const config = getConfig(explicitRoot);
	return config?.project?.name || DEFAULTS.global.projectName;
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
	// AI functionality has been removed - no providers needed
	return [];
}

function getBaseUrlForRole(role, explicitRoot = null) {
	// AI functionality has been removed - this function is deprecated
	// Return undefined as no role-based configuration exists
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

/**
 * 获取所有配置参数
 * @param {Object} options - 选项
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {Object} 配置对象
 */

/**
 * 验证配置
 * @param {Object} config - 要验证的配置对象
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {Object} 验证结果
 */

/**
 * 获取配置变更历史
 * @param {Object} options - 查询选项
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {Array} 历史记录
 */

/**
 * 回滚配置到指定版本
 * @param {string} versionId - 版本ID
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {boolean} 成功状态
 */

/**
 * 重置配置为默认值
 * @param {string|null} explicitRoot - 可选的显式项目根目录
 * @returns {boolean} 成功状态
 */

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

// AI functionality has been removed - provider validation no longer needed

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
	// AI functionality has been removed - no provider validation needed
};
