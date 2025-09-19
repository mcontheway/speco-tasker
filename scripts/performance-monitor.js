#!/usr/bin/env node
/**
 * Performance monitoring script for Speco-Tasker
 * This script monitors memory usage and performance metrics during runtime
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONITOR_DURATION = 10000; // 10 seconds
const SAMPLING_INTERVAL = 500; // 500ms
const CLI_PATH = path.resolve(__dirname, "../bin/task-master.js");

/**
 * Monitor memory usage of a process
 */
async function monitorMemoryUsage(command, args = []) {
  return new Promise((resolve, reject) => {
    const samples = [];
    const startTime = Date.now();

    console.log(`🚀 Starting performance monitoring for: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Sample memory usage
    const sampler = setInterval(() => {
      try {
        const usage = process.memoryUsage();
        samples.push({
          timestamp: Date.now() - startTime,
          rss: (usage.rss / 1024 / 1024).toFixed(2),
          heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2),
          heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2),
          external: (usage.external / 1024 / 1024).toFixed(2)
        });
      } catch (error) {
        // Ignore sampling errors
      }
    }, SAMPLING_INTERVAL);

    // Monitor for specified duration
    setTimeout(() => {
      clearInterval(sampler);
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 1000);
    }, MONITOR_DURATION);

    child.on('close', (code) => {
      clearInterval(sampler);

      if (samples.length === 0) {
        reject(new Error('No performance samples collected'));
        return;
      }

      // Calculate statistics
      const heapUsages = samples.map(s => Number.parseFloat(s.heapUsed));
      const rssValues = samples.map(s => Number.parseFloat(s.rss));

      const stats = {
        duration: MONITOR_DURATION,
        samples: samples.length,
        memory: {
          average: {
            heapUsed: (heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length).toFixed(2),
            rss: (rssValues.reduce((a, b) => a + b, 0) / rssValues.length).toFixed(2)
          },
          peak: {
            heapUsed: Math.max(...heapUsages).toFixed(2),
            rss: Math.max(...rssValues).toFixed(2)
          },
          growth: heapUsages.length > 1 ?
            ((heapUsages[heapUsages.length - 1] - heapUsages[0])).toFixed(2) : '0'
        },
        exitCode: code
      };

      resolve(stats);
    });

    child.on('error', (error) => {
      clearInterval(sampler);
      reject(new Error(`Process monitoring failed: ${error.message}`));
    });
  });
}

/**
 * Run performance benchmark
 */
async function runBenchmark() {
  console.log('📊 Speco-Tasker Performance Monitor');
  console.log('=' .repeat(50));

  try {
    // Test basic CLI help command
    console.log('\n🔍 Testing CLI help command...');
    const helpStats = await monitorMemoryUsage('node', [CLI_PATH, '--help']);

    console.log('\n📈 Performance Results for CLI --help:');
    console.log(`Duration: ${helpStats.duration}ms`);
    console.log(`Samples: ${helpStats.samples}`);
	console.log("Average Memory:");
    console.log(`  Heap Used: ${helpStats.memory.average.heapUsed} MB`);
    console.log(`  RSS: ${helpStats.memory.average.rss} MB`);
	console.log("Peak Memory:");
    console.log(`  Heap Used: ${helpStats.memory.peak.heapUsed} MB`);
    console.log(`  RSS: ${helpStats.memory.peak.rss} MB`);
    console.log(`Memory Growth: ${helpStats.memory.growth} MB`);
    console.log(`Exit Code: ${helpStats.exitCode}`);

    // Performance assertions
    const avgHeap = Number.parseFloat(helpStats.memory.average.heapUsed);
    const peakHeap = Number.parseFloat(helpStats.memory.peak.heapUsed);
    const growth = Math.abs(Number.parseFloat(helpStats.memory.growth));

    console.log('\n✅ Performance Assertions:');
    console.log(`Average heap memory < 100MB: ${avgHeap < 100 ? 'PASS' : 'FAIL'} (${avgHeap}MB)`);
    console.log(`Peak heap memory < 200MB: ${peakHeap < 200 ? 'PASS' : 'FAIL'} (${peakHeap}MB)`);
    console.log(`Memory growth < 10MB: ${growth < 10 ? 'PASS' : 'FAIL'} (${growth}MB)`);

    // Test version command
    console.log('\n🔍 Testing CLI version command...');
    const versionStats = await monitorMemoryUsage('node', [CLI_PATH, '--version']);

    console.log('\n📈 Performance Results for CLI --version:');
    console.log(`Average Heap: ${versionStats.memory.average.heapUsed} MB`);
    console.log(`Peak Heap: ${versionStats.memory.peak.heapUsed} MB`);

    // Save results to file
    const results = {
      timestamp: new Date().toISOString(),
      cli: {
        help: helpStats,
        version: versionStats
      }
    };

    const resultsPath = path.join(__dirname, '../performance-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);

    console.log('\n🎉 Performance monitoring completed successfully!');

  } catch (error) {
    console.error('❌ Performance monitoring failed:', error.message);
    process.exit(1);
  }
}

// Run benchmark if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark();
}

export { monitorMemoryUsage, runBenchmark };
