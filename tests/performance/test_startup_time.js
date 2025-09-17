/**
 * SCOPE: 测试Speco Tasker系统启动时间性能
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_RUNS = 5;
const TIMEOUT_MS = 30000; // 30 seconds timeout
const CLI_PATH = path.resolve(__dirname, "../../bin/task-master.js");
const MCP_SERVER_PATH = path.resolve(__dirname, "../../mcp-server/server.js");

/**
 * Measure the startup time of a Node.js process
 * @param {string} scriptPath - Path to the script to execute
 * @param {string[]} args - Arguments to pass to the script
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<number>} Startup time in milliseconds
 */
function measureStartupTime(scriptPath, args = [], timeout = TIMEOUT_MS) {
	return new Promise((resolve, reject) => {
		const startTime = process.hrtime.bigint();

		const child = spawn("node", [scriptPath, ...args], {
			stdio: ["pipe", "pipe", "pipe"],
			cwd: path.resolve(__dirname, "../.."),
			env: {
				...process.env,
				// Set minimal environment to avoid external dependencies affecting startup time
				NODE_ENV: "test",
				PATH: process.env.PATH,
				HOME: process.env.HOME,
				USER: process.env.USER,
			},
		});

		let hasStarted = false;

		// Listen for any output as indication that the process has started
		const onOutput = () => {
			if (!hasStarted) {
				hasStarted = true;
				const endTime = process.hrtime.bigint();
				const startupTimeMs = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

				// Give the process a moment to fully initialize, then kill it
				setTimeout(() => {
					child.kill("SIGTERM");
				}, 100);

				resolve(startupTimeMs);
			}
		};

		child.stdout.on("data", onOutput);
		child.stderr.on("data", onOutput);

		child.on("error", (error) => {
			reject(new Error(`Failed to start process: ${error.message}`));
		});

		child.on("close", (code) => {
			if (!hasStarted) {
				reject(
					new Error(`Process exited with code ${code} before producing output`),
				);
			}
		});

		// Timeout after specified duration
		setTimeout(() => {
			if (!hasStarted) {
				child.kill("SIGKILL");
				reject(new Error(`Process startup timed out after ${timeout}ms`));
			}
		}, timeout);
	});
}

/**
 * Run multiple startup time measurements and calculate statistics
 * @param {string} scriptPath - Path to the script to execute
 * @param {string[]} args - Arguments to pass to the script
 * @param {number} runs - Number of test runs
 * @returns {Promise<{times: number[], average: number, median: number, min: number, max: number, stdDev: number}>}
 */
async function runStartupBenchmark(scriptPath, args = [], runs = TEST_RUNS) {
	const times = [];

	for (let i = 0; i < runs; i++) {
		try {
			const time = await measureStartupTime(scriptPath, args);
			times.push(time);
			console.log(`Run ${i + 1}/${runs}: ${time.toFixed(2)}ms`);
		} catch (error) {
			console.warn(`Run ${i + 1}/${runs} failed: ${error.message}`);
			// Continue with other runs
		}
	}

	if (times.length === 0) {
		throw new Error("All startup time measurements failed");
	}

	// Calculate statistics
	const sorted = [...times].sort((a, b) => a - b);
	const average = times.reduce((sum, time) => sum + time, 0) / times.length;
	const median = sorted[Math.floor(sorted.length / 2)];
	const min = Math.min(...times);
	const max = Math.max(...times);

	// Calculate standard deviation
	const variance =
		times.reduce((sum, time) => sum + (time - average) ** 2, 0) / times.length;
	const stdDev = Math.sqrt(variance);

	return {
		times,
		average,
		median,
		min,
		max,
		stdDev,
		sampleSize: times.length,
	};
}

describe("Task Master Startup Performance", () => {
	beforeAll(() => {
		// Ensure required files exist
		if (!fs.existsSync(CLI_PATH)) {
			throw new Error(`CLI script not found: ${CLI_PATH}`);
		}
		if (!fs.existsSync(MCP_SERVER_PATH)) {
			throw new Error(`MCP server script not found: ${MCP_SERVER_PATH}`);
		}
	});

	describe("CLI Startup Time", () => {
		it("should start within acceptable time limits", async () => {
			const benchmark = await runStartupBenchmark(CLI_PATH, ["--help"]);

			console.log("\n=== CLI Startup Time Results ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);
			console.log(`Min: ${benchmark.min.toFixed(2)}ms`);
			console.log(`Max: ${benchmark.max.toFixed(2)}ms`);
			console.log(`Std Dev: ${benchmark.stdDev.toFixed(2)}ms`);

			// Performance assertions
			expect(benchmark.average).toBeLessThan(2000); // Should start within 2 seconds
			expect(benchmark.median).toBeLessThan(1500); // Median should be under 1.5 seconds
			expect(benchmark.max).toBeLessThan(5000); // No run should take more than 5 seconds
			expect(benchmark.stdDev).toBeLessThan(500); // Startup time should be consistent
		}, 120000); // 2 minute timeout for the entire test
	});

	describe("MCP Server Startup Time", () => {
		it("should start within acceptable time limits", async () => {
			const benchmark = await runStartupBenchmark(MCP_SERVER_PATH); // Use default runs (5) with 30s timeout per run

			console.log("\n=== MCP Server Startup Time Results ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);
			console.log(`Min: ${benchmark.min.toFixed(2)}ms`);
			console.log(`Max: ${benchmark.max.toFixed(2)}ms`);
			console.log(`Std Dev: ${benchmark.stdDev.toFixed(2)}ms`);

			// Performance assertions - MCP server may be slower due to initialization
			expect(benchmark.average).toBeLessThan(5000); // Should start within 5 seconds
			expect(benchmark.median).toBeLessThan(3000); // Median should be under 3 seconds
			expect(benchmark.max).toBeLessThan(10000); // No run should take more than 10 seconds
			expect(benchmark.stdDev).toBeLessThan(1000); // Startup time should be reasonably consistent
		}, 120000); // 2 minute timeout for the entire test
	});

	describe("Startup Time Comparison", () => {
		it("should compare CLI vs MCP server startup times", async () => {
			const cliBenchmark = await runStartupBenchmark(CLI_PATH, ["--help"], 3);
			const mcpBenchmark = await runStartupBenchmark(MCP_SERVER_PATH, [], 3);

			console.log("\n=== Startup Time Comparison ===");
			console.log(`CLI Average: ${cliBenchmark.average.toFixed(2)}ms`);
			console.log(`MCP Average: ${mcpBenchmark.average.toFixed(2)}ms`);
			console.log(
				`Difference: ${(mcpBenchmark.average - cliBenchmark.average).toFixed(2)}ms`,
			);

			// CLI should generally be faster than MCP server
			expect(cliBenchmark.average).toBeLessThan(mcpBenchmark.average);

			// But MCP server shouldn't be excessively slower
			expect(mcpBenchmark.average / cliBenchmark.average).toBeLessThan(10); // MCP should be at most 10x slower
		}, 180000); // 3 minute timeout
	});

	describe("Startup Stability", () => {
		it("should have consistent startup times across runs", async () => {
			const benchmark = await runStartupBenchmark(CLI_PATH, ["--version"]);

			// Calculate coefficient of variation (CV = stdDev / mean)
			const coefficientOfVariation = benchmark.stdDev / benchmark.average;

			console.log("\n=== Startup Stability Results ===");
			console.log(
				`Coefficient of Variation: ${(coefficientOfVariation * 100).toFixed(2)}%`,
			);

			// CV should be less than 30% for good stability
			expect(coefficientOfVariation).toBeLessThan(0.3);
		}, 60000); // 1 minute timeout
	});
});
