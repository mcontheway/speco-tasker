import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import { z } from 'zod'
import { AI_COMMAND_NAMES } from '../../src/constants/commands.js'
import { LEGACY_CONFIG_FILE, TASKMASTER_DIR } from '../../src/constants/paths.js'
import { findConfigPath } from '../../src/utils/path-utils.js'
import { findProjectRoot, isEmpty, log, resolveEnvVariable } from './utils.js'

// Calculate __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// AI functionality has been removed - no model loading needed

// Default configuration values (used if config file is missing or incomplete)
const DEFAULTS = {
	global: {
		logLevel: 'info',
		debug: false,
		defaultNumTasks: 10,
		defaultSubtasks: 5,
		defaultPriority: 'medium',
		projectName: 'Task Master'
	}
}

// --- Internal Config Loading ---
let loadedConfig = null
let loadedConfigRoot = null // Track which root loaded the config

// Custom Error for configuration issues
class ConfigurationError extends Error {
	constructor(message) {
		super(message)
		this.name = 'ConfigurationError'
	}
}

function _loadAndValidateConfig(explicitRoot = null) {
	const defaults = DEFAULTS // Use the defined defaults
	let rootToUse = explicitRoot
	let configSource = explicitRoot
		? `explicit root (${explicitRoot})`
		: 'defaults (no root provided yet)'

	// ---> If no explicit root, TRY to find it <---
	if (!rootToUse) {
		rootToUse = findProjectRoot()
		if (rootToUse) {
			configSource = `found root (${rootToUse})`
		} else {
			// No root found, use current working directory as fallback
			// This prevents infinite loops during initialization
			rootToUse = process.cwd()
			configSource = `current directory (${rootToUse}) - no project markers found`
		}
	}
	// ---> End find project root logic <---

	// --- Find configuration file ---
	let configPath = null
	let config = { ...defaults } // Start with a deep copy of defaults
	let configExists = false

	// During initialization (no project markers), skip config file search entirely
	const hasProjectMarkers =
		fs.existsSync(path.join(rootToUse, TASKMASTER_DIR)) ||
		fs.existsSync(path.join(rootToUse, LEGACY_CONFIG_FILE))

	if (hasProjectMarkers) {
		// Only try to find config if we have project markers
		// This prevents the repeated warnings during init
		configPath = findConfigPath(null, { projectRoot: rootToUse })
	}

	if (configPath) {
		configExists = true
		const isLegacy = configPath.endsWith(LEGACY_CONFIG_FILE)

		try {
			const rawData = fs.readFileSync(configPath, 'utf-8')
			const parsedConfig = JSON.parse(rawData)

			// Deep merge parsed config onto defaults (only global config now)
			config = {
				global: { ...defaults.global, ...parsedConfig?.global }
			}
			configSource = `file (${configPath})` // Update source info

			// Issue deprecation warning if using legacy config file
			if (isLegacy) {
				console.warn(
					chalk.yellow(
						`⚠️  DEPRECATION WARNING: Found configuration in legacy location '${configPath}'. Please migrate to .taskmaster/config.json. Please migrate to .taskmaster/config.json.`
					)
				)
			}
		} catch (error) {
			// Use console.error for actual errors during parsing
			console.error(
				chalk.red(
					`Error reading or parsing ${configPath}: ${error.message}. Using default configuration.`
				)
			)
			config = { ...defaults } // Reset to defaults on parse error
			configSource = `defaults (parse error at ${configPath})`
		}
	} else {
		// Config file doesn't exist at the determined rootToUse.
		if (explicitRoot) {
			// Only warn if an explicit root was *expected*.
			console.warn(
				chalk.yellow(
					`Warning: Configuration file not found at provided project root (${explicitRoot}). Using default configuration. Run 'task-master models --setup' to configure.`
				)
			)
		} else {
			// Don't warn about missing config during initialization
			// Only warn if this looks like an existing project (has .taskmaster dir or legacy config marker)
			const hasTaskmasterDir = fs.existsSync(path.join(rootToUse, TASKMASTER_DIR))
			const hasLegacyMarker = fs.existsSync(path.join(rootToUse, LEGACY_CONFIG_FILE))

			if (hasTaskmasterDir || hasLegacyMarker) {
				console.warn(
					chalk.yellow(
						`Warning: Configuration file not found at derived root (${rootToUse}). Using defaults.`
					)
				)
			}
		}
		// Keep config as defaults
		config = { ...defaults }
		configSource = `defaults (no config file found at ${rootToUse})`
	}

	return config
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
		!loadedConfig || forceReload || (explicitRoot && explicitRoot !== loadedConfigRoot)

	if (needsLoad) {
		const newConfig = _loadAndValidateConfig(explicitRoot) // _load handles null explicitRoot

		// Only update the global cache if loading was forced or if an explicit root
		// was provided (meaning we attempted to load a specific project's config).
		// We avoid caching the initial default load triggered without an explicitRoot.
		if (forceReload || explicitRoot) {
			loadedConfig = newConfig
			loadedConfigRoot = explicitRoot // Store the root used for this loaded config
		}
		return newConfig // Return the newly loaded/default config
	}

	// If no load was needed, return the cached config
	return loadedConfig
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

/**
 * Check if codebase analysis feature flag is enabled across all sources
 * Priority: .env > MCP env > config.json
 * @param {object|null} session - MCP session object (optional)
 * @param {string|null} projectRoot - Project root path (optional)
 * @returns {boolean} True if codebase analysis is enabled
 */
function isCodebaseAnalysisEnabled(session = null, projectRoot = null) {
	// Priority 1: Environment variable
	const envFlag = resolveEnvVariable('TASKMASTER_ENABLE_CODEBASE_ANALYSIS', session, projectRoot)
	if (envFlag !== null && envFlag !== undefined && envFlag !== '') {
		return envFlag.toLowerCase() === 'true' || envFlag === '1'
	}

	// Priority 2: MCP session environment
	if (session?.env?.TASKMASTER_ENABLE_CODEBASE_ANALYSIS) {
		const mcpFlag = session.env.TASKMASTER_ENABLE_CODEBASE_ANALYSIS
		return mcpFlag.toLowerCase() === 'true' || mcpFlag === '1'
	}

	// Priority 3: Configuration file
	const globalConfig = getGlobalConfig(projectRoot)
	return globalConfig.enableCodebaseAnalysis !== false // Default to true
}

/**
 * Check if codebase analysis is available and enabled
 * @param {boolean} useResearch - Whether to check research provider or main provider
 * @param {string|null} projectRoot - Project root path (optional)
 * @param {object|null} session - MCP session object (optional)
 * @returns {boolean} True if codebase analysis is available and enabled
 */
function hasCodebaseAnalysis(useResearch = false, projectRoot = null, session = null) {
	// First check if the feature is enabled
	if (!isCodebaseAnalysisEnabled(session, projectRoot)) {
		return false
	}

	// Then check if a codebase analysis provider is configured
	const currentProvider = useResearch
		? getResearchProvider(projectRoot)
		: getMainProvider(projectRoot)

	return (
		currentProvider === CUSTOM_PROVIDERS.CLAUDE_CODE ||
		currentProvider === CUSTOM_PROVIDERS.GEMINI_CLI
	)
}




// --- Global Settings Getters ---

function getGlobalConfig(explicitRoot = null) {
	const config = getConfig(explicitRoot)
	// Ensure global defaults are applied if global section is missing
	return { ...DEFAULTS.global, ...(config?.global || {}) }
}

function getLogLevel(explicitRoot = null) {
	// Directly return value from config
	return getGlobalConfig(explicitRoot).logLevel.toLowerCase()
}

function getDebugFlag(explicitRoot = null) {
	// Directly return value from config, ensure boolean
	return getGlobalConfig(explicitRoot).debug === true
}

function getDefaultSubtasks(explicitRoot = null) {
	// Directly return value from config, ensure integer
	const val = getGlobalConfig(explicitRoot).defaultSubtasks
	const parsedVal = parseInt(val, 10)
	return Number.isNaN(parsedVal) ? DEFAULTS.global.defaultSubtasks : parsedVal
}

function getDefaultNumTasks(explicitRoot = null) {
	const val = getGlobalConfig(explicitRoot).defaultNumTasks
	const parsedVal = parseInt(val, 10)
	return Number.isNaN(parsedVal) ? DEFAULTS.global.defaultNumTasks : parsedVal
}

function getDefaultPriority(explicitRoot = null) {
	// Directly return value from config
	return getGlobalConfig(explicitRoot).defaultPriority
}

function getProjectName(explicitRoot = null) {
	// Directly return value from config
	return getGlobalConfig(explicitRoot).projectName
}




/**
 * Gets the Google Cloud project ID for Vertex AI from configuration
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string|null} The project ID or null if not configured
 */
function getVertexProjectId(explicitRoot = null) {
	// Return value from config
	return getGlobalConfig(explicitRoot).vertexProjectId
}

/**
 * Gets the Google Cloud location for Vertex AI from configuration
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string} The location or default value of "us-central1"
 */
function getVertexLocation(explicitRoot = null) {
	// Return value from config or default
	return getGlobalConfig(explicitRoot).vertexLocation || 'us-central1'
}


function getCodebaseAnalysisEnabled(explicitRoot = null) {
	// Directly return value from config
	return getGlobalConfig(explicitRoot).enableCodebaseAnalysis
}



/**
 * Writes the configuration object to the file.
 * @param {Object} config The configuration object to write.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {boolean} True if successful, false otherwise.
 */
function writeConfig(config, explicitRoot = null) {
	// ---> Determine root path reliably <---
	let rootPath = explicitRoot
	if (explicitRoot === null || explicitRoot === undefined) {
		// Logic matching _loadAndValidateConfig
		const foundRoot = findProjectRoot() // *** Explicitly call findProjectRoot ***
		if (!foundRoot) {
			console.error(chalk.red('Error: Could not determine project root. Configuration not saved.'))
			return false
		}
		rootPath = foundRoot
	}
	// ---> End determine root path logic <---

	// Use new config location: .taskmaster/config.json
	const taskmasterDir = path.join(rootPath, '.taskmaster')
	const configPath = path.join(taskmasterDir, 'config.json')

	try {
		// Ensure .taskmaster directory exists
		if (!fs.existsSync(taskmasterDir)) {
			fs.mkdirSync(taskmasterDir, { recursive: true })
		}

		fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
		loadedConfig = config // Update the cache after successful write
		return true
	} catch (error) {
		console.error(chalk.red(`Error writing configuration to ${configPath}: ${error.message}`))
		return false
	}
}

/**
 * Checks if a configuration file exists at the project root (new or legacy location)
 * @param {string|null} explicitRoot - Optional explicit path to the project root
 * @returns {boolean} True if the file exists, false otherwise
 */
function isConfigFilePresent(explicitRoot = null) {
	return findConfigPath(null, { projectRoot: explicitRoot }) !== null
}

/**
 * Gets the user ID from the configuration.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string|null} The user ID or null if not found.
 */
function getUserId(explicitRoot = null) {
	const config = getConfig(explicitRoot)
	if (!config.global) {
		config.global = {} // Ensure global object exists
	}
	if (!config.global.userId) {
		config.global.userId = '1234567890'
		// Attempt to write the updated config.
		// It's important that writeConfig correctly resolves the path
		// using explicitRoot, similar to how getConfig does.
		const success = writeConfig(config, explicitRoot)
		if (!success) {
			// Log an error or handle the failure to write,
			// though for now, we'll proceed with the in-memory default.
			log(
				'warning',
				'Failed to write updated configuration with new userId. Please let the developers know.'
			)
		}
	}
	return config.global.userId
}

/**
 * Gets a list of all known provider names (both validated and custom).
 * @returns {string[]} An array of all provider names.
 */
function getAllProviders() {
	return ALL_PROVIDERS
}

function getBaseUrlForRole(role, explicitRoot = null) {
	const roleConfig = getModelConfigForRole(role, explicitRoot)
	if (roleConfig && typeof roleConfig.baseURL === 'string') {
		return roleConfig.baseURL
	}
	const provider = roleConfig?.provider
	if (provider) {
		const envVarName = `${provider.toUpperCase()}_BASE_URL`
		return resolveEnvVariable(envVarName, null, explicitRoot)
	}
	return undefined
}

// AI functionality has been removed - no provider constants needed

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
	getDefaultSubtasks,
	getDefaultPriority,
	getProjectName,
	getCodebaseAnalysisEnabled,
	isCodebaseAnalysisEnabled,
	getUserId,
	getVertexProjectId,
	getVertexLocation
}
