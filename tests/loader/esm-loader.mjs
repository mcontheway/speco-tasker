/**
 * ESM Loader for Jest - handles ESM modules in CommonJS environment
 */

export async function resolve(specifier, context, defaultResolve) {
	// Handle relative imports for scripts/modules
	if (specifier.startsWith("../../scripts/modules/")) {
		const url = new URL(specifier, context.parentURL);
		return defaultResolve(url.href, context);
	}

	return defaultResolve(specifier, context);
}

export async function load(url, context, defaultLoad) {
	// For config-manager.js, provide CommonJS wrapper
	if (url.endsWith("scripts/modules/config-manager.js")) {
		const { source } = await defaultLoad(url, { ...context, format: "module" });

		// Convert ESM exports to CommonJS
		const cjsSource = `
const fs = require("node:fs");
const path = require("node:path");
const { fileURLToPath } = require("node:url");
const chalk = require("chalk");
const { z } = require("zod");
const { AI_COMMAND_NAMES } = require("../../src/constants/commands.js");
const {
  LEGACY_CONFIG_FILE,
  TASKMASTER_DIR,
} = require("../../src/constants/paths.js");
const { findConfigPath } = require("../../src/utils/path-utils.js");
const {
  findProjectRoot,
  isEmpty,
  log,
  resolveEnvVariable,
} = require("./core-utils.js");

// Calculate __dirname in CommonJS
const __filename = require("node:path").resolve(process.cwd(), "scripts/modules/config-manager.js");
const __dirname = require("node:path").dirname(__filename);

${source.replace(/export\s+(const|function|class)\s+(\w+)/g, "const $2")}
${source.replace(/export\s+\{([^}]+)\}/g, "module.exports = {$1}")}

module.exports = {
  getConfig,
  writeConfig,
  ConfigurationError,
  isConfigFilePresent,
  getLogLevel,
  getDebugFlag,
  getDefaultNumTasks,
  getDefaultPriority,
  getProjectName,
  getUserId,
  getConfigValue,
};
`;

		return {
			format: "commonjs",
			source: cjsSource,
		};
	}

	return defaultLoad(url, context);
}
