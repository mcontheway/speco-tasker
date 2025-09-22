/**
 * Simple test script to reproduce MCP add_dependency connection error
 */

import { spawn } from "node:child_process";
import path from "node:path";

class MCPTester {
	constructor() {
		this.serverProcess = null;
		this.requestId = 0;
		this.pendingRequests = new Map();
	}

	async startServer() {
		console.log("Starting MCP server...");

		// Start the MCP server
		this.serverProcess = spawn("node", ["mcp-server/server.js"], {
			cwd: process.cwd(),
			stdio: ["pipe", "pipe", "pipe"],
			env: { ...process.env },
		});

		// Handle server output
		this.serverProcess.stdout.on("data", (data) => {
			console.log("Server stdout:", data.toString());
		});

		this.serverProcess.stderr.on("data", (data) => {
			console.log("Server stderr:", data.toString());
		});

		// Handle server exit
		this.serverProcess.on("exit", (code) => {
			console.log(`Server exited with code ${code}`);
		});

		// Wait for server to be ready
		await new Promise((resolve) => setTimeout(resolve, 2000));
		console.log("Server should be ready now");
	}

	sendMCPRequest(method, params = {}, timeoutMs = 10000) {
		return new Promise((resolve, reject) => {
			const id = ++this.requestId;
			const request = {
				jsonrpc: "2.0",
				id,
				method,
				params,
			};

			console.log(
				`Sending MCP request: ${method}`,
				JSON.stringify(request, null, 2),
			);

			// Store pending request
			this.pendingRequests.set(id, { resolve, reject });

			// Send request
			const requestStr = `${JSON.stringify(request)}\n`;
			this.serverProcess.stdin.write(requestStr);

			// Set timeout
			const timeoutHandle = setTimeout(() => {
				if (this.pendingRequests.has(id)) {
					this.pendingRequests.delete(id);
					console.log(`MCP request timed out after ${timeoutMs}ms: ${method}`);
					reject(new Error(`MCP request timeout: ${method}`));
				}
			}, timeoutMs);
		});
	}

	async callAddDependencyTool(args) {
		try {
			console.log("Calling add_dependency tool with args:", args);
			const result = await this.sendMCPRequest("tools/call", {
				name: "add_dependency",
				arguments: args,
			});

			console.log("Raw MCP response:", JSON.stringify(result, null, 2));

			// Handle FastMCP response format
			if (result?.result?.content && Array.isArray(result.result.content)) {
				for (const contentItem of result.result.content) {
					if (contentItem.type === "text" && contentItem.text) {
						try {
							// Try to parse as JSON
							const parsedData = JSON.parse(contentItem.text);
							console.log("Parsed MCP tool result:", parsedData);
							return parsedData;
						} catch (parseError) {
							// If not JSON, return as text
							console.log("MCP tool result (text):", contentItem.text);
							return { text: contentItem.text, isError: result.result.isError };
						}
					}
				}
			}

			return result;
		} catch (error) {
			console.error("MCP tool call failed:", error.message);
			throw error;
		}
	}

	async stopServer() {
		if (this.serverProcess) {
			console.log("Stopping server...");
			this.serverProcess.kill();
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}

async function testAddDependency() {
	const tester = new MCPTester();

	try {
		await tester.startServer();

		// Test the add_dependency tool
		console.log("Testing add_dependency tool...");

		// First, try to add a valid dependency
		await tester.callAddDependencyTool({
			id: "3",
			dependsOn: "2",
			projectRoot: "/Volumes/Data_SSD/Coding/startkits/Speco-Tasker",
		});
	} catch (error) {
		console.error("Test failed:", error);
	} finally {
		await tester.stopServer();
	}
}

testAddDependency().catch(console.error);
