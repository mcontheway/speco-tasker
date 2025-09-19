/**
 * Node.js loader to fix process.cwd() compatibility issues
 * This loader intercepts process.cwd() calls and provides fallbacks
 */

// Store original process.cwd
const originalCwd = process.cwd;

// Safe process.cwd implementation
const safeProcessCwd = () => {
	try {
		return originalCwd.call(process);
	} catch (error) {
		// Fallback for environments where process.cwd() fails
		console.warn("process.cwd() failed, using fallback:", "/tmp");
		return "/tmp";
	}
};

// Replace process.cwd with safe version
process.cwd = safeProcessCwd;

// Export the loader function for Node.js --loader
export async function resolve(specifier, context, defaultResolve) {
	return defaultResolve(specifier, context);
}

export async function getFormat(url, context, defaultGetFormat) {
	return defaultGetFormat(url, context);
}

export async function getSource(url, context, defaultGetSource) {
	return defaultGetSource(url, context);
}
