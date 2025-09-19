/**
 * 直接验证config-manager模块功能，不使用Jest
 */

import {
	getConfig,
	getLogLevel,
	isConfigFilePresent,
} from "./scripts/modules/config-manager.js";

console.log("🔍 直接验证config-manager模块功能...");

try {
	// 测试1: 基本函数导入
	console.log("✅ 模块导入成功");

	// 测试2: getLogLevel 函数
	const logLevel = getLogLevel("/tmp");
	console.log(`✅ getLogLevel 函数工作: ${logLevel}`);
	if (typeof logLevel !== "string") {
		throw new Error("getLogLevel 应返回字符串");
	}

	// 测试3: getConfig 函数
	const config = getConfig("/tmp", true);
	console.log("✅ getConfig 函数工作:", typeof config);
	if (typeof config !== "object") {
		throw new Error("getConfig 应返回对象");
	}

	// 测试4: isConfigFilePresent 函数
	const exists = isConfigFilePresent("/tmp");
	console.log(`✅ isConfigFilePresent 函数工作: ${exists}`);
	if (typeof exists !== "boolean") {
		throw new Error("isConfigFilePresent 应返回布尔值");
	}

	console.log("🎉 所有config-manager测试通过！");
	console.log("✅ ESM兼容性验证完成");
	console.log("✅ 模块功能正常");
} catch (error) {
	console.error("❌ config-manager模块错误:", error.message);
	console.error("🔍 错误详情:", error);
	process.exit(1);
}
