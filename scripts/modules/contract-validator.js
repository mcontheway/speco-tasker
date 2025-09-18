#!/usr/bin/env node

/**
 * 合约验证工具
 * 验证OpenAPI/Swagger合约文件与合同测试的一致性
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 解析OpenAPI/Swagger文件
 * @param {string} filePath - 合约文件路径
 * @returns {Object} 解析后的合约对象
 */
function parseOpenAPIContract(filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf8");
		const contract = JSON.parse(content);

		const endpoints = {};

		// 解析paths
		if (contract.paths) {
			for (const [path, methods] of Object.entries(contract.paths)) {
				for (const [method, operation] of Object.entries(methods)) {
					const endpointKey = `${method.toUpperCase()} ${path}`;
					endpoints[endpointKey] = {
						method: method.toUpperCase(),
						path,
						operation,
						responses: operation.responses || {},
						parameters: operation.parameters || [],
						requestBody: operation.requestBody,
					};
				}
			}
		}

		return {
			endpoints,
			components: contract.components || {},
			info: contract.info || {},
		};
	} catch (error) {
		throw new Error(
			`Failed to parse OpenAPI contract ${filePath}: ${error.message}`,
		);
	}
}

/**
 * 解析YAML格式的OpenAPI文件
 * @param {string} filePath - YAML文件路径
 * @returns {Object} 解析后的合约对象
 */
function parseYAMLContract(filePath) {
	try {
		// 对于YAML文件，我们使用简单的文本解析
		// 在实际项目中应该使用yaml库
		const content = fs.readFileSync(filePath, "utf8");

		// 简单的YAML解析（有限支持）
		const endpoints = {};
		const lines = content.split("\n");
		let currentPath = "";
		let currentMethod = "";

		for (const line of lines) {
			// 匹配路径定义
			const pathMatch = line.match(/^  (\/\w+):$/);
			if (pathMatch) {
				currentPath = pathMatch[1];
			}

			// 匹配HTTP方法
			const methodMatch = line.match(/^    (get|post|put|patch|delete):$/);
			if (methodMatch && currentPath) {
				currentMethod = methodMatch[1].toUpperCase();
				const endpointKey = `${currentMethod} ${currentPath}`;
				endpoints[endpointKey] = {
					method: currentMethod,
					path: currentPath,
					operation: {},
					responses: {},
					parameters: [],
					requestBody: null,
				};
			}

			// 匹配响应
			const responseMatch = line.match(/^      '(\d+)':$/);
			if (responseMatch && currentMethod && currentPath) {
				const statusCode = responseMatch[1];
				const endpointKey = `${currentMethod} ${currentPath}`;
				if (endpoints[endpointKey]) {
					endpoints[endpointKey].responses[statusCode] = {};
				}
			}
		}

		return { endpoints, components: {}, info: {} };
	} catch (error) {
		throw new Error(
			`Failed to parse YAML contract ${filePath}: ${error.message}`,
		);
	}
}

/**
 * 解析合同测试文件
 * @param {string} filePath - 测试文件路径
 * @returns {Object} 解析后的测试对象
 */
function parseContractTest(filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf8");

		const testCases = [];
		const describeBlocks = [];

		// 提取describe块
		const describeRegex = /describe\(['"]([^'"]+)['"]/g;
		let match;
		while ((match = describeRegex.exec(content)) !== null) {
			describeBlocks.push(match[1]);
		}

		// 提取测试用例
		const testRegex = /it\(['"]([^'"]+)['"]/g;
		while ((match = testRegex.exec(content)) !== null) {
			testCases.push(match[1]);
		}

		// 提取端点调用模式
		const endpointPatterns = [];
		const endpointRegex = /(GET|POST|PUT|PATCH|DELETE)\s+['"]([^'"]+)['"]/g;
		while ((match = endpointRegex.exec(content)) !== null) {
			endpointPatterns.push({
				method: match[1],
				path: match[2],
			});
		}

		// 提取mock实现
		const mocks = [];
		const mockRegex = /mockImplementation\(([^)]+)\)/g;
		while ((match = mockRegex.exec(content)) !== null) {
			mocks.push(match[1].trim());
		}

		return {
			filePath,
			describeBlocks,
			testCases,
			endpointPatterns,
			mocks,
		};
	} catch (error) {
		throw new Error(
			`Failed to parse contract test ${filePath}: ${error.message}`,
		);
	}
}

/**
 * 验证合约与测试的一致性
 * @param {Object} contract - 合约对象
 * @param {Object} test - 测试对象
 * @returns {Object} 验证结果
 */
function validateContractConsistency(contract, test) {
	const issues = [];
	const warnings = [];
	const recommendations = [];

	// 1. 检查测试是否覆盖所有合约端点
	const contractEndpoints = Object.keys(contract.endpoints);
	const testEndpoints = test.endpointPatterns.map(
		(p) => `${p.method} ${p.path}`,
	);

	const missingEndpoints = contractEndpoints.filter(
		(endpoint) =>
			!testEndpoints.some(
				(testEndpoint) =>
					testEndpoint === endpoint ||
					testEndpoint.includes(endpoint.split(" ")[1]),
			),
	);

	if (missingEndpoints.length > 0) {
		issues.push({
			type: "MISSING_ENDPOINT_TESTS",
			severity: "error",
			message: `以下合约端点缺少对应的测试用例: ${missingEndpoints.join(", ")}`,
			details: missingEndpoints,
		});
	}

	// 2. 检查测试是否验证了所有响应状态码
	for (const [endpointKey, endpoint] of Object.entries(contract.endpoints)) {
		const expectedStatuses = Object.keys(endpoint.responses);
		const testStatuses = [];

		// 从测试文件中提取验证的状态码
		const statusRegex = new RegExp(
			`expect\\([^)]*\\)\\.toBe\\((${expectedStatuses.join("|")})\\)`,
			"g",
		);
		let match;
		while ((match = statusRegex.exec(test.testCases.join(" "))) !== null) {
			testStatuses.push(match[1]);
		}

		const missingStatuses = expectedStatuses.filter(
			(status) => !testStatuses.includes(status),
		);
		if (missingStatuses.length > 0) {
			warnings.push({
				type: "MISSING_STATUS_CODE_TESTS",
				severity: "warning",
				message: `端点 ${endpointKey} 的状态码 ${missingStatuses.join(", ")} 缺少测试验证`,
				details: { endpoint: endpointKey, missingStatuses },
			});
		}
	}

	// 3. 检查测试是否验证了错误响应格式
	const errorResponses = contractEndpoints.some((endpointKey) => {
		const endpoint = contract.endpoints[endpointKey];
		return Object.keys(endpoint.responses).some(
			(status) => status.startsWith("4") || status.startsWith("5"),
		);
	});

	if (errorResponses) {
		const hasErrorValidation = test.testCases.some(
			(testCase) =>
				testCase.toLowerCase().includes("error") ||
				testCase.toLowerCase().includes("invalid") ||
				testCase.toLowerCase().includes("fail"),
		);

		if (!hasErrorValidation) {
			recommendations.push({
				type: "MISSING_ERROR_VALIDATION",
				severity: "info",
				message: "建议添加错误响应格式和内容的验证测试",
				details: "确保错误响应符合统一的错误格式标准",
			});
		}
	}

	// 4. 检查测试数据结构一致性
	const contractSchemas = contract.components.schemas || {};
	const hasSchemaValidation = Object.keys(contractSchemas).length > 0;

	if (hasSchemaValidation) {
		const hasDataValidation = test.testCases.some(
			(testCase) =>
				testCase.toLowerCase().includes("schema") ||
				testCase.toLowerCase().includes("structure") ||
				testCase.toLowerCase().includes("format"),
		);

		if (!hasDataValidation) {
			recommendations.push({
				type: "MISSING_SCHEMA_VALIDATION",
				severity: "info",
				message: "建议添加数据结构和schema验证测试",
				details: "验证响应数据符合OpenAPI schema定义",
			});
		}
	}

	return {
		contractFile: contract.info.title || "Unknown Contract",
		testFile: path.basename(test.filePath),
		issues,
		warnings,
		recommendations,
		summary: {
			totalEndpoints: contractEndpoints.length,
			testedEndpoints: contractEndpoints.length - missingEndpoints.length,
			coverage:
				contractEndpoints.length > 0
					? (
							((contractEndpoints.length - missingEndpoints.length) /
								contractEndpoints.length) *
							100
						).toFixed(1)
					: 0,
		},
	};
}

/**
 * 生成验证报告
 * @param {Array} results - 验证结果数组
 * @returns {string} 格式化的报告
 */
function generateReport(results) {
	let report = "# 合约与测试一致性验证报告\n\n";
	report += `*生成时间: ${new Date().toLocaleString("zh-CN")}*\n\n`;

	for (const result of results) {
		report += `## ${result.contractFile} vs ${result.testFile}\n\n`;

		// 摘要
		report += `### 📊 覆盖率摘要\n\n`;
		report += `- **总端点数**: ${result.summary.totalEndpoints}\n`;
		report += `- **已测试端点**: ${result.summary.testedEndpoints}\n`;
		report += `- **覆盖率**: ${result.summary.coverage}%\n\n`;

		// 问题
		if (result.issues.length > 0) {
			report += `### ❌ 问题 (${result.issues.length})\n\n`;
			for (const issue of result.issues) {
				report += `- **${issue.type}**: ${issue.message}\n`;
				if (issue.details) {
					report += `  - 详情: ${JSON.stringify(issue.details, null, 2)}\n`;
				}
			}
			report += "\n";
		}

		// 警告
		if (result.warnings.length > 0) {
			report += `### ⚠️ 警告 (${result.warnings.length})\n\n`;
			for (const warning of result.warnings) {
				report += `- **${warning.type}**: ${warning.message}\n`;
				if (warning.details) {
					report += `  - 详情: ${JSON.stringify(warning.details, null, 2)}\n`;
				}
			}
			report += "\n";
		}

		// 建议
		if (result.recommendations.length > 0) {
			report += `### 💡 建议 (${result.recommendations.length})\n\n`;
			for (const rec of result.recommendations) {
				report += `- **${rec.type}**: ${rec.message}\n`;
				if (rec.details) {
					report += `  - 详情: ${rec.details}\n`;
				}
			}
			report += "\n";
		}
	}

	// 总体统计
	const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
	const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
	const totalRecommendations = results.reduce(
		(sum, r) => sum + r.recommendations.length,
		0,
	);
	const avgCoverage =
		results.length > 0
			? (
					results.reduce((sum, r) => sum + parseFloat(r.summary.coverage), 0) /
					results.length
				).toFixed(1)
			: 0;

	report += `## 📈 总体统计\n\n`;
	report += `- **验证文件对数**: ${results.length}\n`;
	report += `- **平均覆盖率**: ${avgCoverage}%\n`;
	report += `- **总问题数**: ${totalIssues}\n`;
	report += `- **总警告数**: ${totalWarnings}\n`;
	report += `- **总建议数**: ${totalRecommendations}\n\n`;

	// 状态评估
	let status = "✅ 通过";
	if (totalIssues > 0) status = "❌ 需要修复";
	else if (totalWarnings > 0) status = "⚠️ 需要注意";
	else if (parseFloat(avgCoverage) < 80) status = "📉 覆盖不足";

	report += `## 🎯 验证状态: ${status}\n\n`;

	if (totalIssues > 0) {
		report += "**优先修复问题以确保合约与测试的一致性**\n\n";
	} else if (parseFloat(avgCoverage) >= 80) {
		report += "**合约与测试保持良好一致性**\n\n";
	}

	return report;
}

/**
 * 主函数
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
		console.log(`
合约验证工具 - 验证OpenAPI/Swagger合约与测试的一致性

用法:
  node contract-validator.js [options] [contract-files...]

选项:
  --contracts <dir>    指定合约文件目录 (默认: specs/*/contracts/)
  --tests <dir>        指定测试文件目录 (默认: tests/contract/)
  --output <file>      指定输出报告文件 (默认: .speco/contract-validation-report.md)
  --json               输出JSON格式报告
  --help, -h           显示帮助信息

示例:
  # 验证所有合约文件
  node contract-validator.js

  # 指定特定合约文件
  node contract-validator.js specs/002-feature-description-ai-taskmaster-speco/contracts/*.yaml

  # 输出JSON格式
  node contract-validator.js --json --output validation.json
`);
		return;
	}

	try {
		let contractDir = "specs/*/contracts/";
		let testDir = "tests/contract/";
		let outputFile = ".speco/contract-validation-report.md";
		let jsonOutput = false;

		// 解析命令行参数
		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			switch (arg) {
				case "--contracts":
					contractDir = args[++i];
					break;
				case "--tests":
					testDir = args[++i];
					break;
				case "--output":
					outputFile = args[++i];
					break;
				case "--json":
					jsonOutput = true;
					outputFile = outputFile.replace(".md", ".json");
					break;
				default:
					if (!arg.startsWith("--")) {
						// 处理合约文件路径
						contractDir = arg;
					}
					break;
			}
		}

		// 查找合约文件
		const contractFiles = [];
		if (contractDir.includes("*")) {
			// 使用glob模式
			const glob = await import("glob");
			const { glob: globSync } = glob;
			contractFiles.push(...globSync(contractDir));
		} else if (fs.existsSync(contractDir)) {
			const stat = fs.statSync(contractDir);
			if (stat.isDirectory()) {
				const files = fs.readdirSync(contractDir);
				contractFiles.push(
					...files
						.filter(
							(file) =>
								file.endsWith(".yaml") ||
								file.endsWith(".yml") ||
								file.endsWith(".json"),
						)
						.map((file) => path.join(contractDir, file)),
				);
			} else {
				contractFiles.push(contractDir);
			}
		}

		// 查找测试文件
		const testFiles = [];
		if (fs.existsSync(testDir)) {
			const files = fs.readdirSync(testDir);
			testFiles.push(
				...files
					.filter((file) => file.endsWith(".js") || file.endsWith(".cjs"))
					.map((file) => path.join(testDir, file)),
			);
		}

		console.log(
			`🔍 发现 ${contractFiles.length} 个合约文件和 ${testFiles.length} 个测试文件`,
		);

		const results = [];

		// 验证每个合约文件
		for (const contractFile of contractFiles) {
			try {
				console.log(`📄 解析合约文件: ${path.basename(contractFile)}`);

				let contract;
				if (contractFile.endsWith(".yaml") || contractFile.endsWith(".yml")) {
					contract = parseYAMLContract(contractFile);
				} else {
					contract = parseOpenAPIContract(contractFile);
				}

				// 寻找对应的测试文件
				const contractName = path.basename(
					contractFile,
					path.extname(contractFile),
				);
				const matchingTest = testFiles.find((testFile) => {
					const testName = path.basename(testFile, path.extname(testFile));
					// 支持多种命名模式：
					// cleanup-api.yaml -> cleanup_api.test.js
					// path-config-api.yaml -> path_config_api.test.js
					const normalizedContract = contractName.replace(/-/g, "_");
					const normalizedTest = testName
						.replace(/-/g, "_")
						.replace(/^test_/, "");

					return (
						normalizedTest.includes(normalizedContract) ||
						normalizedContract.includes(normalizedTest) ||
						testName === contractName.replace("-api", "_api")
					);
				});

				if (matchingTest) {
					console.log(`🧪 解析测试文件: ${path.basename(matchingTest)}`);
					const test = parseContractTest(matchingTest);

					const result = validateContractConsistency(contract, test);
					results.push(result);
				} else {
					console.warn(`⚠️ 未找到合约文件 ${contractName} 对应的测试文件`);
				}
			} catch (error) {
				console.error(`❌ 处理合约文件 ${contractFile} 时出错:`, error.message);
			}
		}

		// 生成报告
		let report;
		if (jsonOutput) {
			report = JSON.stringify(results, null, 2);
		} else {
			report = generateReport(results);
		}

		// 确保输出目录存在
		const outputDir = path.dirname(outputFile);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		// 写入报告
		fs.writeFileSync(outputFile, report, "utf8");
		console.log(`📋 验证报告已保存至: ${outputFile}`);

		// 输出简要结果
		const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
		if (totalIssues > 0) {
			console.log(`❌ 发现 ${totalIssues} 个问题需要修复`);
			process.exit(1);
		} else {
			console.log(`✅ 合约与测试验证通过`);
		}
	} catch (error) {
		console.error("❌ 验证过程出错:", error.message);
		process.exit(1);
	}
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export {
	parseOpenAPIContract,
	parseYAMLContract,
	parseContractTest,
	validateContractConsistency,
	generateReport,
};
