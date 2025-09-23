/**
 * Jest setup file
 *
 * This file is run before each test suite to set up the test environment.
 */

// ===== 安全Polyfills集成 =====
// 在所有其他代码之前加载安全polyfills
try {
  import('../scripts/utils/safe-process-polyfills.js');
  console.log('✅ 安全polyfills已加载');
} catch (error) {
  console.error('❌ 安全polyfills加载失败:', error.message);
  // 在CI环境中失败，在本地环境中警告
  if (process.env.CI) {
    process.exit(1);
  }
}

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

// ===== Jest Compatibility for Vitest =====
// Make jest functions available globally for tests written with Jest API

// Dynamic import to avoid issues during setup
const setupJestCompatibility = async () => {
	try {
		const { vi } = await import('vitest');

		// Make vi globally available
		global.vi = vi;

		// Create jest object with vitest equivalents only if it doesn't exist
		if (!global.jest) {
			global.jest = {
				// Mock functions
				fn: vi.fn,
				mock: vi.mock,
				mockImplementation: vi.mockImplementation,
				mockImplementationOnce: vi.mockImplementationOnce,
				mockReturnValue: vi.mockReturnValue,
				mockReturnValueOnce: vi.mockReturnValueOnce,
				mockResolvedValue: vi.mockResolvedValue,
				mockResolvedValueOnce: vi.mockResolvedValueOnce,
				mockRejectedValue: vi.mockRejectedValue,
				mockRejectedValueOnce: vi.mockRejectedValueOnce,
				mockClear: vi.mockClear,
				mockReset: vi.mockReset,
				mockRestore: vi.mockRestore,

				// Spy functions
				spyOn: vi.spyOn,

				// Utility functions
				clearAllMocks: vi.clearAllMocks,
				resetAllMocks: vi.resetAllMocks,
				restoreAllMocks: vi.restoreAllMocks,

				// Timing functions
				useFakeTimers: vi.useFakeTimers,
				useRealTimers: vi.useRealTimers,
				runAllTimers: vi.runAllTimers,
				runOnlyPendingTimers: vi.runOnlyPendingTimers,
				advanceTimersByTime: vi.advanceTimersByTime,
				advanceTimersToNextTimer: vi.advanceTimersToNextTimer,
				getTimerCount: vi.getTimerCount,

				// Config
				setTimeout: vi.setTimeout,
				getRealSystemTime: vi.getRealSystemTime,
				setSystemTime: vi.setSystemTime,
			};
		}

		console.log('✅ Jest compatibility layer loaded successfully');
	} catch (error) {
		console.error('❌ Failed to load Jest compatibility layer:', error.message);
	}
};

// Initialize jest compatibility
await setupJestCompatibility();
