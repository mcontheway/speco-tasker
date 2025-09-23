/**
 * core-utils.js
 * Core utility functions that don't depend on configuration
 * This module is designed to avoid circular dependencies
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

// Constants for complexity reports
const COMPLEXITY_REPORT_FILE = "tasks-complexity-report.json";
const LEGACY_COMPLEXITY_REPORT_FILE = "task-complexity-report.json";

/**
 * Read complexity report from file system
 * @param {string} customPath - Optional custom path to complexity report
 * @returns {Object|null} Complexity report data or null if not found
 */
export function readComplexityReport(customPath = null) {
	try {
		let reportPath;
		if (customPath) {
			reportPath = customPath;
		} else {
			// Try new location first, then fall back to legacy
			const newPath = path.join(process.cwd(), COMPLEXITY_REPORT_FILE);
			const legacyPath = path.join(
				process.cwd(),
				LEGACY_COMPLEXITY_REPORT_FILE,
			);

			reportPath = fs.existsSync(newPath) ? newPath : legacyPath;
		}

		if (!fs.existsSync(reportPath)) {
			return null;
		}

		const reportData = JSON.parse(fs.readFileSync(reportPath, "utf8"));
		return reportData;
	} catch (error) {
		return null;
	}
}

// --- Environment Variable Resolution Utility ---
/**
 * Resolves an environment variable's value.
 * Precedence:
 * 1. session.env (if session provided)
 * 2. process.env
 * @param {string} key - The environment variable key.
 * @param {object|null} [session=null] - The MCP session object.
 * @param {string|null} [projectRoot=null] - The project root directory (parameter kept for compatibility).
 * @returns {string|undefined} The value of the environment variable or undefined if not found.
 */
export function resolveEnvVariable(key, session = null, projectRoot = null) {
	// 1. Check session.env (for MCP integrations)
	if (session?.env?.[key]) {
		return session.env[key];
	}

	// 2. Check process.env
	if (process.env[key]) {
		return process.env[key];
	}

	// Not found anywhere
	return undefined;
}

/**
 * Find project root by looking for specific marker files/directories
 * @param {string} startDir - Directory to start searching from
 * @param {string[]} markers - Array of marker files/directories to look for
 * @returns {string|null} Project root path or null if not found
 */
export function findProjectRoot(
	startDir = process.cwd(),
	markers = ["package.json", "pyproject.toml", ".git"],
) {
	let currentPath = path.resolve(startDir);
	const rootPath = path.parse(currentPath).root;

	while (currentPath !== rootPath) {
		// Check if any marker exists in the current directory
		const hasMarker = markers.some((marker) => {
			const markerPath = path.join(currentPath, marker);
			return fs.existsSync(markerPath);
		});

		if (hasMarker) {
			return currentPath;
		}

		// Move up one directory
		currentPath = path.dirname(currentPath);
	}

	// Check the root directory as well
	const hasMarkerInRoot = markers.some((marker) => {
		const markerPath = path.join(rootPath, marker);
		return fs.existsSync(markerPath);
	});

	return hasMarkerInRoot ? rootPath : null;
}

/**
 * Checks if a value is empty (array, object, or null/undefined)
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty
 */
export function isEmpty(value) {
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	if (typeof value === "object" && value !== null) {
		return Object.keys(value).length === 0;
	}

	return false; // Not an array or object, or is null
}

/**
 * Slugifies a tag name to be filesystem-safe
 * @param {string} tagName - The tag name to slugify
 * @returns {string} Slugified tag name safe for filesystem use
 */
export function slugifyTagForFilePath(tagName) {
	if (!tagName || typeof tagName !== "string") {
		return "unknown-tag";
	}

	// Replace invalid filesystem characters with hyphens and clean up
	return tagName
		.toLowerCase()
		.replace(/[^a-z0-9-_]/g, "-") // Replace invalid chars with hyphens
		.replace(/-+/g, "-") // Collapse multiple hyphens
		.replace(/^-|-$/g, "") // Remove leading/trailing hyphens
		.slice(0, 50); // Limit length
}

// --- Simple Logging Utility ---
// Basic logging levels (simplified, doesn't depend on config)
const LOG_LEVELS = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	success: 1, // Treat success like info level
};

/**
 * Simple logging function that doesn't depend on configuration
 * @param {string} level - Log level (debug, info, warn, error, success)
 * @param {...any} args - Arguments to log
 */
export function log(level, ...args) {
	// Use text prefixes instead of emojis
	const prefixes = {
		debug: chalk.gray("[DEBUG]"),
		info: chalk.blue("[INFO]"),
		warn: chalk.yellow("[WARN]"),
		error: chalk.red("[ERROR]"),
		success: chalk.green("[SUCCESS]"),
	};

	// Ensure level exists, default to info if not
	const currentLevel = Object.hasOwn(LOG_LEVELS, level) ? level : "info";

	// For this simplified logger, only show warn and error by default
	// This avoids needing config to determine log level
	const shouldLog = ["warn", "error", "success"].includes(currentLevel);

	if (shouldLog) {
		const prefix = prefixes[currentLevel] || "";
		// Construct the message properly
		const message = args
			.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
			.join(" ");
		console.log(`${prefix} ${message}`);
	}
}
