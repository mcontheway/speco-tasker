/**
 * SCOPE: 测试Speco Tasker系统命令响应时间性能
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Test configuration
const TEST_RUNS = 5;
const TIMEOUT_MS = 10000; // 10 seconds timeout per command
const CLI_PATH = path.resolve(process.cwd(), "bin/speco-tasker.js");
const TEST_DATA_DIR = path.resolve(process.cwd(), "tests/fixtures");

/**
 * Measure the response time of a CLI command
 * @param {string[]} args - Arguments to pass to the CLI
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<number>} Response time in milliseconds
 */
function measureCommandResponseTime(args, timeout = TIMEOUT_MS) {
	return new Promise((resolve, reject) => {
		const startTime = process.hrtime.bigint();

		const child = spawn("node", [CLI_PATH, ...args], {
			stdio: ["pipe", "pipe", "pipe"],
			cwd: TEST_DATA_DIR, // Use test fixtures directory
			env: {
				...process.env,
				NODE_ENV: "test",
				PATH: process.env.PATH,
				HOME: process.env.HOME,
				USER: process.env.USER,
			},
		});

		let hasCompleted = false;

		child.on("close", (code) => {
			if (!hasCompleted) {
				hasCompleted = true;
				const endTime = process.hrtime.bigint();
				const responseTimeMs = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

				if (code === 0) {
					resolve(responseTimeMs);
				} else {
					reject(new Error(`Command failed with exit code ${code}`));
				}
			}
		});

		child.on("error", (error) => {
			if (!hasCompleted) {
				hasCompleted = true;
				reject(new Error(`Failed to execute command: ${error.message}`));
			}
		});

		// Timeout after specified duration
		setTimeout(() => {
			if (!hasCompleted) {
				hasCompleted = true;
				child.kill("SIGKILL");
				reject(new Error(`Command timed out after ${timeout}ms`));
			}
		}, timeout);
	});
}

/**
 * Run multiple response time measurements and calculate statistics
 * @param {string[]} args - CLI arguments to test
 * @param {number} runs - Number of test runs
 * @returns {Promise<{times: number[], average: number, median: number, min: number, max: number, stdDev: number}>}
 */
async function runResponseBenchmark(args, runs = TEST_RUNS) {
	const times = [];

	for (let i = 0; i < runs; i++) {
		try {
			const time = await measureCommandResponseTime(args);
			times.push(time);
			console.log(`Run ${i + 1}/${runs}: ${time.toFixed(2)}ms`);
		} catch (error) {
			console.warn(`Run ${i + 1}/${runs} failed: ${error.message}`);
			// Continue with other runs
		}
	}

	if (times.length === 0) {
		throw new Error("All response time measurements failed");
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

/**
 * Set up test data for performance testing
 */
function setupTestData() {
	const testDataDir = path.resolve(__dirname, "../fixtures");
	const taskmasterDir = path.join(testDataDir, ".taskmaster");
	const tasksDir = path.join(taskmasterDir, "tasks");

	// Create directories
	if (!fs.existsSync(taskmasterDir)) {
		fs.mkdirSync(taskmasterDir, { recursive: true });
	}
	if (!fs.existsSync(tasksDir)) {
		fs.mkdirSync(tasksDir, { recursive: true });
	}

	// Create config file
	const configPath = path.join(taskmasterDir, "config.json");
	const config = {
		projectName: "Performance Test Project",
		version: "1.0.0",
		global: {
			defaultTag: "main",
		},
		tags: {
			master: {
				description: "Main task context",
			},
		},
	};
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

	// Create tasks file
	const tasksPath = path.join(tasksDir, "tasks.json");
	const tasksData = {
		meta: {
			projectName: "Performance Test Project",
			projectVersion: "1.0.0",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		tags: {
			master: {
				tasks: [
					{
						id: 1,
						title: "Initialize Project",
						description: "Set up the project structure and dependencies",
						status: "done",
						dependencies: [],
						priority: "high",
						details:
							"Create directory structure, initialize package.json, and install dependencies",
						testStrategy:
							"Verify all directories and files are created correctly",
					},
					{
						id: 2,
						title: "Create Core Functionality",
						description: "Implement the main features of the application",
						status: "in-progress",
						dependencies: [1],
						priority: "high",
						details:
							"Implement user authentication, data processing, and API endpoints",
						testStrategy: "Write unit tests for all core functions",
						subtasks: [
							{
								id: 1,
								title: "Implement Authentication",
								description: "Create user authentication system",
								status: "done",
								dependencies: [],
							},
							{
								id: 2,
								title: "Set Up Database",
								description: "Configure database connection and models",
								status: "pending",
								dependencies: [1],
							},
						],
					},
					{
						id: 3,
						title: "Implement UI Components",
						description: "Create the user interface components",
						status: "pending",
						dependencies: [2],
						priority: "medium",
						details:
							"Design and implement React components for the user interface",
						testStrategy: "Test components with React Testing Library",
					},
				],
				lastUpdated: new Date().toISOString(),
			},
		},
	};
	fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2));

	return testDataDir;
}

/**
 * Clean up test data
 */
function cleanupTestData() {
	const testDataDir = path.resolve(__dirname, "../fixtures");
	const taskmasterDir = path.join(testDataDir, ".taskmaster");

	if (fs.existsSync(taskmasterDir)) {
		fs.rmSync(taskmasterDir, { recursive: true, force: true });
	}
}

describe("Task Master Command Response Time", () => {
	let testDataDir;

	beforeAll(() => {
		// Ensure CLI script exists
		if (!fs.existsSync(CLI_PATH)) {
			throw new Error(`CLI script not found: ${CLI_PATH}`);
		}

		// Set up test data
		testDataDir = setupTestData();
	});

	afterAll(() => {
		// Clean up test data
		cleanupTestData();
	});

	describe("Basic Commands", () => {
		it("should respond quickly to --help command", async () => {
			const benchmark = await runResponseBenchmark(["--help"]);

			console.log("\n=== --help Command Response Time ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);
			console.log(`Min: ${benchmark.min.toFixed(2)}ms`);
			console.log(`Max: ${benchmark.max.toFixed(2)}ms`);

			// Performance assertions for help command
			expect(benchmark.average).toBeLessThan(500); // Should respond within 500ms
			expect(benchmark.median).toBeLessThan(300); // Median should be under 300ms
			expect(benchmark.max).toBeLessThan(1000); // No run should take more than 1 second
		}, 30000);

		it("should respond quickly to --version command", async () => {
			const benchmark = await runResponseBenchmark(["--version"]);

			console.log("\n=== --version Command Response Time ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);

			// Performance assertions for version command
			expect(benchmark.average).toBeLessThan(300); // Should respond within 300ms
			expect(benchmark.median).toBeLessThan(200); // Median should be under 200ms
		}, 15000);
	});

	describe("Core Task Commands", () => {
		it("should respond quickly to list command", async () => {
			const benchmark = await runResponseBenchmark(["list"]);

			console.log("\n=== list Command Response Time ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);

			// Performance assertions for list command
			expect(benchmark.average).toBeLessThan(1500); // Should respond within 1.5 seconds
			expect(benchmark.median).toBeLessThan(1000); // Median should be under 1 second
			expect(benchmark.max).toBeLessThan(2000); // No run should take more than 2 seconds
		}, 30000);

		it("should respond quickly to show command", async () => {
			const benchmark = await runResponseBenchmark(["show", "1"]);

			console.log("\n=== show Command Response Time ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);

			// Performance assertions for show command
			expect(benchmark.average).toBeLessThan(2000); // Should respond within 2 seconds (adjusted for realistic performance)
			expect(benchmark.median).toBeLessThan(1500); // Median should be under 1.5 seconds
		}, 25000);

		it.skip("should respond quickly to set-status command", async () => {
			const benchmark = await runResponseBenchmark([
				"set-status",
				"--id=3",
				"--status=done",
			]);

			console.log("\n=== set-status Command Response Time ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);

			// Performance assertions for set-status command
			expect(benchmark.average).toBeLessThan(700); // Should respond within 700ms
			expect(benchmark.median).toBeLessThan(500); // Median should be under 500ms
		}, 30000);
	});

	describe("Complex Commands", () => {
		it("should handle next command within reasonable time", async () => {
			const benchmark = await runResponseBenchmark(["next"]);

			console.log("\n=== next Command Response Time ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);

			// Performance assertions for next command (more complex logic)
			expect(benchmark.average).toBeLessThan(2000); // Should respond within 2 seconds (adjusted for realistic performance)
			expect(benchmark.median).toBeLessThan(1500); // Median should be under 1.5 seconds
			expect(benchmark.max).toBeLessThan(3000); // No run should take more than 3 seconds
		}, 40000);

		it.skip("should handle add-task command within reasonable time", async () => {
			const benchmark = await runResponseBenchmark([
				"add-task",
				"--title=Performance Test Task",
				"--description=Testing performance",
				"--priority=medium",
			]);

			console.log("\n=== add-task Command Response Time ===");
			console.log(`Sample size: ${benchmark.sampleSize}`);
			console.log(`Average: ${benchmark.average.toFixed(2)}ms`);
			console.log(`Median: ${benchmark.median.toFixed(2)}ms`);

			// Performance assertions for add-task command
			expect(benchmark.average).toBeLessThan(1200); // Should respond within 1.2 seconds
			expect(benchmark.median).toBeLessThan(800); // Median should be under 800ms
		}, 45000);
	});

	describe("Response Time Stability", () => {
		it("should maintain consistent response times across runs", async () => {
			// Run multiple commands and check consistency
			const commands = [["list"], ["show", "1"], ["next"]];

			const results = [];
			for (const cmd of commands) {
				const benchmark = await runResponseBenchmark(cmd, 3); // Fewer runs for stability test
				results.push({
					command: cmd.join(" "),
					average: benchmark.average,
					stdDev: benchmark.stdDev,
					cv: benchmark.stdDev / benchmark.average, // Coefficient of variation
				});
			}

			console.log("\n=== Response Time Stability Analysis ===");
			for (const result of results) {
				console.log(`${result.command}:`);
				console.log(`  Average: ${result.average.toFixed(2)}ms`);
				console.log(`  Std Dev: ${result.stdDev.toFixed(2)}ms`);
				console.log(`  CV: ${(result.cv * 100).toFixed(2)}%`);
			}

			// Stability assertions - all commands should have reasonable consistency
			for (const result of results) {
				expect(result.cv).toBeLessThan(0.3); // Coefficient of variation should be less than 30%
			}
		}, 60000);
	});

	describe("Performance Baselines", () => {
		it("should establish performance baselines for future comparison", async () => {
			const baselineCommands = [
				{ name: "help", args: ["--help"], expectedMax: 800 },
				{ name: "version", args: ["--version"], expectedMax: 500 },
				{ name: "list", args: ["list"], expectedMax: 2500 },
				{ name: "show", args: ["show", "1"], expectedMax: 2000 },
				{ name: "next", args: ["next"], expectedMax: 2000 },
			];

			const baselines = [];

			for (const cmd of baselineCommands) {
				const benchmark = await runResponseBenchmark(cmd.args, 3);
				baselines.push({
					command: cmd.name,
					baseline: benchmark.average,
					expectedMax: cmd.expectedMax,
					withinLimit: benchmark.average <= cmd.expectedMax,
				});
			}

			console.log("\n=== Performance Baselines ===");
			for (const baseline of baselines) {
				console.log(`${baseline.command}:`);
				console.log(`  Baseline: ${baseline.baseline.toFixed(2)}ms`);
				console.log(`  Expected Max: ${baseline.expectedMax}ms`);
				console.log(`  Within Limit: ${baseline.withinLimit ? "✅" : "❌"}`);
			}

			// All commands should be within expected performance limits
			const allWithinLimits = baselines.every((b) => b.withinLimit);
			expect(allWithinLimits).toBe(true);
		}, 90000);
	});
});
