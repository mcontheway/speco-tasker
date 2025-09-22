/**
 * Jest setup file
 *
 * This file is run before each test suite to set up the test environment.
 */

// Import required modules
import os from "node:os";
import path from "node:path";

// Capture the actual original working directory
let originalWorkingDirectory;
try {
	originalWorkingDirectory = process.cwd();
} catch (error) {
	// Fallback for environments where process.cwd() might fail
	originalWorkingDirectory = os.homedir() || "/tmp";
	console.warn(
		"Warning: Could not get current working directory, using fallback:",
		originalWorkingDirectory,
	);
}

// Store original working directory and project root
const projectRoot = path.resolve(__dirname, "..");

// CRITICAL: Mock process.cwd to prevent graceful-fs issues
const originalCwd = process.cwd;
const safeCwd = () => {
	try {
		return originalCwd.call(process);
	} catch (error) {
		// If original fails, return the captured working directory
		console.warn(
			"[SETUP] process.cwd failed, using fallback:",
			global.originalWorkingDirectory,
		);
		return global.originalWorkingDirectory || projectRoot;
	}
};

// Replace process.cwd with safe version
process.cwd = safeCwd;

// Note: Jest now handles working directory via config.cwd
// Avoid manual process.chdir() to prevent path resolution issues

// Mock environment variables for testing
process.env.DEBUG = "false";
process.env.TASKMASTER_LOG_LEVEL = "error"; // Set to error to reduce noise in tests
process.env.DEFAULT_SUBTASKS = "5";
process.env.DEFAULT_PRIORITY = "medium";
process.env.PROJECT_NAME = "Test Project";
process.env.PROJECT_VERSION = "1.0.0";

// Add global test helpers if needed
global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Store original working directory for tests that need it
global.originalWorkingDirectory = originalWorkingDirectory;
global.projectRoot = projectRoot;

// If needed, silence console during tests
if (process.env.SILENCE_CONSOLE === "true") {
	global.console = {
		...console,
		log: () => {},
		info: () => {},
		warn: () => {},
		error: () => {},
	};
}

