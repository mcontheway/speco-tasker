import fs from "node:fs";
import path from "node:path";
import { log } from "../../scripts/modules/utils.js";

// Get current module path in a Jest-compatible way
const getCurrentModulePath = () => {
	// For Jest compatibility, use a simple relative path
	return path.resolve(process.cwd(), "src/utils/getVersion.js");
};

/**
 * Reads the version from the nearest package.json relative to this file.
 * Returns 'unknown' if not found or on error.
 * @returns {string} The version string or 'unknown'.
 */
export function getTaskMasterVersion() {
	let version = "unknown";
	try {
		// First try to read from current working directory (for normal usage)
		let packageJsonPath = path.resolve(process.cwd(), "package.json");
		if (!fs.existsSync(packageJsonPath)) {
			// Fallback to script directory (for npm link environments)
			const currentModulePath = getCurrentModulePath();
			const currentModuleDir = path.dirname(currentModulePath);
			packageJsonPath = path.resolve(currentModuleDir, "../../package.json");
		}

		// Additional fallback for E2E test environments where process.cwd() points to test run directory
		if (!fs.existsSync(packageJsonPath)) {
			// Try to find package.json by walking up the directory tree
			let currentDir = process.cwd();
			for (let i = 0; i < 5; i++) {
				// Limit to 5 levels up to avoid infinite loops
				const parentDir = path.dirname(currentDir);
				if (parentDir === currentDir) break; // Reached root
				currentDir = parentDir;
				const candidatePath = path.resolve(currentDir, "package.json");
				if (fs.existsSync(candidatePath)) {
					try {
						const content = fs.readFileSync(candidatePath, "utf8");
						const pkg = JSON.parse(content);
						if (pkg.name === "speco-tasker") {
							packageJsonPath = candidatePath;
							break;
						}
					} catch (e) {
						// Continue searching
					}
				}
			}
		}

		if (fs.existsSync(packageJsonPath)) {
			const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
			const packageJson = JSON.parse(packageJsonContent);
			version = packageJson.version || "unknown";
		}
	} catch (error) {
		// Silently fall back to default version
		log("warn", "Could not read own package.json for version info.", error);
	}
	return version;
}
