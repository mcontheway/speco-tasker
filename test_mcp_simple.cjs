#!/usr/bin/env node

// 简单的 MCP 服务器测试脚本
const { spawn } = require("child_process");
const http = require("http");

console.log("🚀 启动 MCP 服务器测试...");

// 启动 MCP 服务器（HTTP 模式）
console.log("📡 启动 MCP 服务器 (HTTP 端口 8083)...");
const serverProcess = spawn("node", ["mcp-server/server.js", "--port=8083"], {
	stdio: ["pipe", "pipe", "pipe"],
	cwd: process.cwd(),
});

let serverReady = false;
let serverOutput = "";

serverProcess.stdout.on("data", (data) => {
	const output = data.toString();
	serverOutput += output;
	console.log("📝 服务器输出:", output.trim());

	if (
		output.includes("MCP Server connected") &&
		output.includes("Speco Tasker tools available")
	) {
		serverReady = true;
	}
});

serverProcess.stderr.on("data", (data) => {
	console.log("⚠️  服务器错误:", data.toString().trim());
});

// 检查端口是否在监听
function checkPort(port) {
	return new Promise((resolve) => {
		const net = require("net");
		const client = net.createConnection(
			{ port: port, host: "localhost" },
			() => {
				client.end();
				resolve(true);
			},
		);
		client.on("error", () => resolve(false));
		setTimeout(() => {
			client.end();
			resolve(false);
		}, 1000);
	});
}

// 等待服务器启动
setTimeout(async () => {
	console.log("🔍 检查端口 8083 是否在监听...");
	const isPortOpen = await checkPort(8083);
	console.log("📡 端口 8083 状态:", isPortOpen ? "✅ 开放" : "❌ 关闭");

	if (!isPortOpen) {
		console.log("❌ 端口 8083 未开放，服务器可能启动失败");
		serverProcess.kill();
		process.exit(1);
	}
	if (!serverReady) {
		console.log("❌ MCP 服务器未能正常启动");
		console.log("服务器输出:", serverOutput);
		serverProcess.kill();
		process.exit(1);
	}

	console.log("✅ MCP 服务器启动成功");

	// 测试工具列表
	console.log("🔧 测试获取工具列表...");
	try {
		console.log("📡 发送 tools/list 请求...");
		const toolsResponse = await makeRequest("tools/list", {});
		console.log("✅ 工具列表响应:", JSON.stringify(toolsResponse, null, 2));

		if (toolsResponse.tools && toolsResponse.tools.length > 0) {
			console.log("🎉 发现", toolsResponse.tools.length, "个工具");

			// 测试其中一个工具
			const firstTool = toolsResponse.tools[0];
			console.log("🧪 测试工具:", firstTool.name);

			// 这里可以添加具体的工具测试
		} else {
			console.log("⚠️  没有发现工具");
		}
	} catch (error) {
		console.log("❌ 工具列表测试失败:", error.message);
		console.log("🔍 错误详情:", error);
	}

	// 清理
	console.log("🧹 清理测试...");
	serverProcess.kill();
	console.log("✅ 测试完成");
}, 5000);

// 发送 HTTP 请求的辅助函数
function makeRequest(method, params = {}) {
	return new Promise((resolve, reject) => {
		const postData = JSON.stringify({
			jsonrpc: "2.0",
			method: method,
			params: params,
			id: Date.now(),
		});

		const options = {
			hostname: "localhost",
			port: 8083,
			path: "/json-rpc",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(postData),
			},
		};

		const req = http.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});
			res.on("end", () => {
				try {
					resolve(JSON.parse(data));
				} catch (e) {
					reject(new Error("Invalid JSON response: " + data));
				}
			});
		});

		req.on("error", (e) => {
			reject(e);
		});

		req.write(postData);
		req.end();
	});
}

// 处理进程退出
serverProcess.on("exit", (code) => {
	if (code !== 0) {
		console.log("❌ MCP 服务器异常退出，退出码:", code);
	}
});
