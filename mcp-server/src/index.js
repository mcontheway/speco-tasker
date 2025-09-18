import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FastMCP } from "fastmcp";
import logger from "./logger.js";
import { MCPProvider } from "./providers/mcp-provider.js";
import { registerSpecoTaskerTools } from "./tools/index.js";

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main MCP server class that integrates with Speco Tasker
 */
class TaskMasterMCPServer {
	constructor() {
		// Get version from package.json using synchronous fs
		const packagePath = path.join(__dirname, "../../package.json");
		const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

		this.options = {
			name: "Speco Tasker MCP Server",
			version: packageJson.version,
		};

		this.server = new FastMCP(this.options);
		this.initialized = false;
		this.asyncManager = null; // Initialize asyncManager as null since it's not used

		// Bind methods
		this.init = this.init.bind(this);
		this.start = this.start.bind(this);
		this.stop = this.stop.bind(this);

		// Setup logging
		this.logger = logger;
	}

	/**
	 * Initialize the MCP server with necessary tools and routes
	 */
	async init() {
		if (this.initialized) return;

		// Pass the manager instance to the tool registration function
		registerSpecoTaskerTools(this.server, this.asyncManager);

		this.initialized = true;

		return this;
	}

	/**
	 * Start the MCP server
	 */
	async start(options = {}) {
		if (!this.initialized) {
			await this.init();
		}

		this.server.on("connect", (event) => {
			event.session.server.sendLoggingMessage({
				data: {
					context: event.session.context,
					message: `MCP Server connected: ${event.session.name}`,
				},
				level: "info",
			});
			this.registerRemoteProvider(event.session);
		});

		// Start the FastMCP server with provided options or defaults
		const startOptions = {
			transportType: "stdio",
			timeout: 120000, // 2 minutes timeout (in milliseconds)
			...options,
		};

		await this.server.start(startOptions);

		return this;
	}

	/**
	 * Register MCP provider for the session
	 */
	registerRemoteProvider(session) {
		// Check if the server has at least one session
		if (session) {
			// Note: Removed sampling capability requirement since AI features were removed
			// The server now works as a pure task management interface

			// Register the unified MCP provider (simplified after AI removal)
			const mcpProvider = new MCPProvider();
			mcpProvider.setSession(session);

			session.server.sendLoggingMessage({
				data: {
					context: session.context,
					message: "MCP Server connected - Speco Tasker tools available",
				},
				level: "info",
			});
		} else {
			session.server.sendLoggingMessage({
				data: {
					context: session.context,
					message: "No MCP sessions available, provider not registered",
				},
				level: "warn",
			});
		}
	}

	/**
	 * Stop the MCP server
	 */
	async stop() {
		if (this.server) {
			await this.server.stop();
		}
	}
}

export default TaskMasterMCPServer;
