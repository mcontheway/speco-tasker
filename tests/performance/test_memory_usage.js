/**
 * SCOPE: 测试Task Master系统内存使用性能
 */

import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test configuration
const TEST_DURATION_MS = 10000 // 10 seconds test duration
const SAMPLING_INTERVAL_MS = 500 // Sample memory every 500ms
const CLI_PATH = path.resolve(__dirname, '../../bin/task-master.js')
const MCP_SERVER_PATH = path.resolve(__dirname, '../../mcp-server/server.js')

/**
 * Monitor memory usage of a Node.js process
 * @param {string} scriptPath - Path to the script to execute
 * @param {string[]} args - Arguments to pass to the script
 * @param {number} duration - How long to monitor (ms)
 * @param {number} interval - Sampling interval (ms)
 * @returns {Promise<{samples: number[], average: number, peak: number, growth: number}>}
 */
function monitorMemoryUsage(scriptPath, args = [], duration = TEST_DURATION_MS, interval = SAMPLING_INTERVAL_MS) {
	return new Promise((resolve, reject) => {
		const samples = []
		let monitoring = false

		const child = spawn('node', [
			'--expose-gc', // Enable garbage collection
			'--max-old-space-size=512', // Limit heap to detect memory issues
			scriptPath,
			...args
		], {
			stdio: ['pipe', 'pipe', 'pipe'],
			cwd: path.resolve(__dirname, '../..'),
			env: {
				...process.env,
				NODE_ENV: 'test',
				PATH: process.env.PATH,
				HOME: process.env.HOME,
				USER: process.env.USER
			}
		})

		// Send periodic memory inspection commands
		const inspector = setInterval(() => {
			if (monitoring) {
				try {
					// Request memory usage from the process
					child.stdin.write('process.memoryUsage()\n')
				} catch (error) {
					// Process might have ended
				}
			}
		}, interval)

		let startTime = Date.now()

		child.stdout.on('data', (data) => {
			const output = data.toString()

			// Look for memory usage data in output
			const memoryMatch = output.match(/heapUsed:\s*(\d+)/)
			if (memoryMatch) {
				const heapUsed = parseInt(memoryMatch[1])
				samples.push({
					timestamp: Date.now() - startTime,
					heapUsed: heapUsed / 1024 / 1024 // Convert to MB
				})
			}

			// Start monitoring once we see the process has started
			if (!monitoring && (output.includes('task-master') || output.includes('TaskMasterMCPServer'))) {
				monitoring = true
				startTime = Date.now()
			}
		})

		child.stderr.on('data', (data) => {
			const output = data.toString()

			// Look for memory usage data in stderr too
			const memoryMatch = output.match(/heapUsed:\s*(\d+)/)
			if (memoryMatch) {
				const heapUsed = parseInt(memoryMatch[1])
				samples.push({
					timestamp: Date.now() - startTime,
					heapUsed: heapUsed / 1024 / 1024
				})
			}
		})

		child.on('error', (error) => {
			clearInterval(inspector)
			reject(new Error(`Failed to start process: ${error.message}`))
		})

		// Monitor for the specified duration, then kill the process
		setTimeout(() => {
			clearInterval(inspector)
			child.kill('SIGTERM')

			setTimeout(() => {
				if (!child.killed) {
					child.kill('SIGKILL')
				}
			}, 1000)
		}, duration + 1000) // Extra time for cleanup

		child.on('close', () => {
			clearInterval(inspector)

			if (samples.length === 0) {
				reject(new Error('No memory samples collected'))
				return
			}

			// Calculate statistics
			const heapUsages = samples.map(s => s.heapUsed)
			const average = heapUsages.reduce((sum, usage) => sum + usage, 0) / heapUsages.length
			const peak = Math.max(...heapUsages)

			// Calculate memory growth (slope of linear regression)
			let growth = 0
			if (samples.length > 1) {
				const n = samples.length
				const sumX = samples.reduce((sum, s, i) => sum + i, 0)
				const sumY = heapUsages.reduce((sum, usage) => sum + usage, 0)
				const sumXY = samples.reduce((sum, s, i) => sum + i * s.heapUsed, 0)
				const sumXX = samples.reduce((sum, s, i) => sum + i * i, 0)

				const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
				growth = slope * (samples.length - 1) // Growth over the monitoring period
			}

			resolve({
				samples,
				average,
				peak,
				growth,
				sampleCount: samples.length
			})
		})
	})
}

/**
 * Monitor memory usage with garbage collection
 * @param {string} scriptPath - Path to the script to execute
 * @param {string[]} args - Arguments to pass to the script
 * @param {number} duration - How long to monitor (ms)
 * @returns {Promise<{beforeGC: number, afterGC: number, freed: number}>}
 */
function monitorGarbageCollection(scriptPath, args = [], duration = 5000) {
	return new Promise((resolve, reject) => {
		let beforeGC = 0
		let afterGC = 0

		const child = spawn('node', [
			'--expose-gc',
			'--max-old-space-size=512',
			scriptPath,
			...args
		], {
			stdio: ['pipe', 'pipe', 'pipe'],
			cwd: path.resolve(__dirname, '../..'),
			env: {
				...process.env,
				NODE_ENV: 'test'
			}
		})

		child.stdout.on('data', (data) => {
			const output = data.toString()

			if (output.includes('heapUsed')) {
				const memoryMatch = output.match(/heapUsed:\s*(\d+)/)
				if (memoryMatch) {
					const heapUsed = parseInt(memoryMatch[1])

					if (beforeGC === 0) {
						beforeGC = heapUsed / 1024 / 1024 // MB
						// Trigger garbage collection after getting baseline
						setTimeout(() => {
							child.stdin.write('gc()\n')
						}, 1000)
					} else if (afterGC === 0) {
						afterGC = heapUsed / 1024 / 1024 // MB
						child.kill('SIGTERM')
					}
				}
			}
		})

		child.on('error', (error) => {
			reject(new Error(`Failed to monitor GC: ${error.message}`))
		})

		setTimeout(() => {
			child.kill('SIGKILL')
			if (beforeGC > 0 && afterGC > 0) {
				resolve({
					beforeGC,
					afterGC,
					freed: beforeGC - afterGC
				})
			} else {
				reject(new Error('GC monitoring failed to collect data'))
			}
		}, duration)
	})
}

describe.skip('Task Master Memory Usage', () => {
	beforeAll(() => {
		// Ensure required files exist
		if (!fs.existsSync(CLI_PATH)) {
			throw new Error(`CLI script not found: ${CLI_PATH}`)
		}
		if (!fs.existsSync(MCP_SERVER_PATH)) {
			throw new Error(`MCP server script not found: ${MCP_SERVER_PATH}`)
		}
	})

	describe('CLI Memory Usage', () => {
		it('should maintain reasonable memory usage during operation', async () => {
			const memoryStats = await monitorMemoryUsage(CLI_PATH, ['--help'])

			console.log('\n=== CLI Memory Usage Results ===')
			console.log(`Sample count: ${memoryStats.sampleCount}`)
			console.log(`Average memory: ${memoryStats.average.toFixed(2)} MB`)
			console.log(`Peak memory: ${memoryStats.peak.toFixed(2)} MB`)
			console.log(`Memory growth: ${memoryStats.growth.toFixed(2)} MB`)

			// Memory assertions
			expect(memoryStats.average).toBeLessThan(100) // Should use less than 100MB on average
			expect(memoryStats.peak).toBeLessThan(200) // Should not exceed 200MB peak
			expect(Math.abs(memoryStats.growth)).toBeLessThan(10) // Memory growth should be minimal
		}, 30000)

		it('should not have memory leaks during CLI operations', async () => {
			const gcStats = await monitorGarbageCollection(CLI_PATH, ['--version'])

			console.log('\n=== CLI Garbage Collection Results ===')
			console.log(`Memory before GC: ${gcStats.beforeGC.toFixed(2)} MB`)
			console.log(`Memory after GC: ${gcStats.afterGC.toFixed(2)} MB`)
			console.log(`Memory freed: ${gcStats.freed.toFixed(2)} MB`)

			// GC assertions
			expect(gcStats.freed).toBeGreaterThan(0) // Should free some memory
			expect(gcStats.freed / gcStats.beforeGC).toBeGreaterThan(0.1) // Should free at least 10% of memory
		}, 15000)
	})

	describe('MCP Server Memory Usage', () => {
		it('should maintain reasonable memory usage during server operation', async () => {
			const memoryStats = await monitorMemoryUsage(MCP_SERVER_PATH, [], 8000) // Shorter duration for server

			console.log('\n=== MCP Server Memory Usage Results ===')
			console.log(`Sample count: ${memoryStats.sampleCount}`)
			console.log(`Average memory: ${memoryStats.average.toFixed(2)} MB`)
			console.log(`Peak memory: ${memoryStats.peak.toFixed(2)} MB`)
			console.log(`Memory growth: ${memoryStats.growth.toFixed(2)} MB`)

			// Memory assertions (MCP server may use more memory due to dependencies)
			expect(memoryStats.average).toBeLessThan(150) // Should use less than 150MB on average
			expect(memoryStats.peak).toBeLessThan(300) // Should not exceed 300MB peak
			expect(Math.abs(memoryStats.growth)).toBeLessThan(20) // Memory growth should be minimal
		}, 30000)

		it('should not have memory leaks during server operation', async () => {
			const gcStats = await monitorGarbageCollection(MCP_SERVER_PATH, [], 8000)

			console.log('\n=== MCP Server Garbage Collection Results ===')
			console.log(`Memory before GC: ${gcStats.beforeGC.toFixed(2)} MB`)
			console.log(`Memory after GC: ${gcStats.afterGC.toFixed(2)} MB`)
			console.log(`Memory freed: ${gcStats.freed.toFixed(2)} MB`)

			// GC assertions
			expect(gcStats.freed).toBeGreaterThan(0) // Should free some memory
			expect(gcStats.freed / gcStats.beforeGC).toBeGreaterThan(0.05) // Should free at least 5% of memory
		}, 20000)
	})

	describe('Memory Usage Comparison', () => {
		it('should compare memory usage between CLI and MCP server', async () => {
			const cliStats = await monitorMemoryUsage(CLI_PATH, ['--help'], 5000)
			const mcpStats = await monitorMemoryUsage(MCP_SERVER_PATH, [], 5000)

			console.log('\n=== Memory Usage Comparison ===')
			console.log(`CLI Average: ${cliStats.average.toFixed(2)} MB`)
			console.log(`MCP Average: ${mcpStats.average.toFixed(2)} MB`)
			console.log(`Difference: ${(mcpStats.average - cliStats.average).toFixed(2)} MB`)

			// MCP server should use more memory than CLI due to additional dependencies
			expect(mcpStats.average).toBeGreaterThan(cliStats.average)
			expect(mcpStats.average / cliStats.average).toBeLessThan(3) // MCP should not use more than 3x CLI memory
		}, 45000)
	})

	describe('Memory Stability', () => {
		it('should maintain stable memory usage without significant growth', async () => {
			const memoryStats = await monitorMemoryUsage(CLI_PATH, ['--version'])

			// Calculate memory stability (coefficient of variation of memory samples)
			const heapUsages = memoryStats.samples.map(s => s.heapUsed)
			const mean = heapUsages.reduce((sum, usage) => sum + usage, 0) / heapUsages.length
			const variance = heapUsages.reduce((sum, usage) => sum + Math.pow(usage - mean, 2), 0) / heapUsages.length
			const stdDev = Math.sqrt(variance)
			const coefficientOfVariation = stdDev / mean

			console.log('\n=== Memory Stability Results ===')
			console.log(`Memory Mean: ${mean.toFixed(2)} MB`)
			console.log(`Memory Std Dev: ${stdDev.toFixed(2)} MB`)
			console.log(`Coefficient of Variation: ${(coefficientOfVariation * 100).toFixed(2)}%`)

			// Stability assertions
			expect(coefficientOfVariation).toBeLessThan(0.2) // CV should be less than 20% for stable memory usage
			expect(Math.abs(memoryStats.growth)).toBeLessThan(5) // Absolute growth should be minimal
		}, 20000)
	})
})
