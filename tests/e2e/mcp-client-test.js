#!/usr/bin/env node

// MCP 客户端自动化测试
// 使用 @modelcontextprotocol/sdk 直接测试 MCP 服务器

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPClient() {
	console.log("🚀 启动 MCP 客户端自动化测试...");

	try {
		// 创建 stdio 传输
		const transport = new StdioClientTransport({
			command: "node",
			args: ["mcp-server/server.js"],
			cwd: process.cwd(),
		});

		// 创建 MCP 客户端
		const client = new Client(
			{
				name: "mcp-client-test",
				version: "1.0.0",
			},
			{
				capabilities: {},
			},
		);

		// 连接到服务器
		await client.connect(transport);
		console.log("✅ 已连接到 MCP 服务器");

		// 初始化
		const initResult = await client.request(
			{
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: {
						name: "mcp-client-test",
						version: "1.0.0",
					},
				},
			},
			{ timeout: 10000 },
		);
		console.log("✅ MCP 初始化成功:", initResult);

		// 获取工具列表
		const toolsResult = await client.request(
			{ method: "tools/list", params: {} },
			{ timeout: 10000 },
		);
		console.log("✅ 工具列表:", JSON.stringify(toolsResult, null, 2));

		if (toolsResult.tools && toolsResult.tools.length > 0) {
			console.log(`🎉 发现 ${toolsResult.tools.length} 个工具`);

			// 测试第一个工具
			const firstTool = toolsResult.tools[0];
			console.log(`🧪 测试工具: ${firstTool.name}`);

			// 调用工具（示例）
			if (firstTool.name === "list_tasks") {
				const toolResult = await client.request(
					{
						method: "tools/call",
						params: {
							name: "list_tasks",
							arguments: {},
						},
					},
					{ timeout: 10000 },
				);
				console.log("✅ 工具调用结果:", JSON.stringify(toolResult, null, 2));
			}
		}

		// 断开连接
		await client.close();
		console.log("✅ 测试完成");
	} catch (error) {
		console.error("❌ 测试失败:", error.message);
		process.exit(1);
	}
}

testMCPClient();
