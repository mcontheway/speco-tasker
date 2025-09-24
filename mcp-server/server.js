#!/usr/bin/env node

import TaskMasterMCPServer from "./src/index.js";
import logger from "./src/logger.js";

// Suppress FastMCP client capability inference warnings
const originalWarn = console.warn;
console.warn = function(...args) {
	if (args[0] && typeof args[0] === 'string' && args[0].includes('could not infer client capabilities')) {
		// Suppress this specific warning as it doesn't affect functionality
		return;
	}
	originalWarn.apply(console, args);
};

/**
 * Start the MCP server
 */
async function startServer() {
	const server = new TaskMasterMCPServer();

	// Handle graceful shutdown
	process.on("SIGINT", async () => {
		await server.stop();
		process.exit(0);
	});

	process.on("SIGTERM", async () => {
		await server.stop();
		process.exit(0);
	});

	try {
		// Check for port argument to determine transport type
		const portArg = process.argv.find((arg) => arg.startsWith("--port="));
		const port = portArg ? Number.parseInt(portArg.split("=")[1]) : null;

		if (port) {
			// SSE transport mode for testing (HTTP-based)
			await server.start({
				transportType: "sse",
				port: port,
				endpoint: "/sse",
				timeout: 120000,
			});
			logger.info(`MCP Server started on SSE port ${port}`);
		} else {
			// Default stdio transport
			await server.start({
				transportType: "stdio",
				timeout: 120000,
			});
		}
	} catch (error) {
		logger.error(`Failed to start MCP server: ${error.message}`);
		process.exit(1);
	}
}

// Start the server
startServer();
