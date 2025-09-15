/**
 * mcp-server/src/providers/mcp-provider.js
 *
 * MCP provider implementation (AI functionality removed)
 * Simplified placeholder after AI removal in phase 3.3
 */

/**
 * MCP Provider (placeholder after AI removal)
 * Since AI functionality has been removed, this is now a minimal placeholder.
 */
export class MCPProvider {
	constructor() {
		this.name = 'mcp'
		this.session = null // MCP server session object (kept for compatibility)
	}

	/**
	 * Method called by MCP server on connect events
	 * @param {object} session - MCP session object
	 */
	setSession(session) {
		this.session = session
	}

	/**
	 * Get current session status
	 * @returns {boolean} True if session is available
	 */
	hasValidSession() {
		return !!this.session
	}
}
