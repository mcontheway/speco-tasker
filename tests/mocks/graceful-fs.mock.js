/**
 * Mock for graceful-fs to prevent process.cwd() issues in test environments
 */

// Use the actual fs module but mock problematic methods
const fs = require("node:fs");

// Mock process.cwd() to return a safe fallback
const originalCwd = process.cwd;
process.cwd = () => {
	try {
		return originalCwd.call(process);
	} catch (error) {
		// Fallback for environments where process.cwd() fails
		return "/tmp";
	}
};

// Export all fs methods
module.exports = {
	...fs,
	// Override any problematic methods if needed
};
