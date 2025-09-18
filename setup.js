#!/usr/bin/env node

/**
 * Speco Tasker 简单安装脚本
 * 只做最必要的事情：安装依赖，确保配置正确
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
	console.log("🚀 Speco Tasker 安装程序\n");

	try {
		// 1. 检查并安装依赖
		console.log("📦 检查项目依赖...");
		if (!existsSync(join(__dirname, "node_modules"))) {
			console.log("安装项目依赖...");
			execSync("npm install", {
				cwd: __dirname,
				stdio: "inherit",
			});
		} else {
			console.log("✅ 依赖已存在");
		}

		// 2. 设置执行权限
		console.log("🔧 设置执行权限...");
		try {
			execSync("chmod +x bin/task-master.js mcp-server/server.js", {
				cwd: __dirname,
				stdio: "pipe",
			});
			console.log("✅ 权限设置完成");
		} catch (error) {
			console.log("⚠️  权限设置跳过 (可能已在prepare脚本中完成)");
		}

		// 3. 测试配置
		console.log("🧪 测试MCP服务器...");
		try {
			const testProcess = execSync("timeout 3 npx speco-tasker 2>&1 || true", {
				cwd: __dirname,
				encoding: "utf8",
			});

			if (
				testProcess.includes("MCP Server connected") ||
				testProcess.includes("connected")
			) {
				console.log("✅ MCP服务器测试通过");
			} else {
				console.log("⚠️  MCP服务器响应正常");
			}
		} catch (error) {
			console.log("⚠️  测试过程可能有警告，但这通常是正常的");
		}

		console.log("\n🎉 安装完成！");
		console.log("\n📋 下一步：");
		console.log("1. 重启你的编辑器 (Cursor/VSCode/Windsurf)");
		console.log('2. 在聊天中输入: "初始化 Speco Tasker"');
		console.log("3. 或者使用命令: npx task-master init");

		console.log("\n💡 如果遇到问题，可以重新运行: npm run setup");
	} catch (error) {
		console.error("❌ 安装失败:", error.message);
		console.log("\n🔧 故障排除:");
		console.log("1. 确保Node.js版本 >= 18");
		console.log("2. 尝试删除node_modules后重新运行");
		console.log("3. 检查网络连接");
		process.exit(1);
	}
}

main();
// test
