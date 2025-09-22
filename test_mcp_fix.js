/**
 * Test script to verify MCP JSON response fixes
 */
import { detectMCPMode } from './scripts/modules/utils.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

console.log('=== MCP Fix Verification Test ===');
console.log('MCP Mode detected (CLI):', detectMCPMode());

// Simulate MCP mode by setting process.argv
const originalArgv = [...process.argv];
process.argv.push('mcp-server');

console.log('MCP Mode detected (simulated MCP):', detectMCPMode());

// Restore original argv
process.argv.splice(-1);

// Test PathService logger fix
console.log('\n=== Testing PathService logger fix ===');
try {
    // Import PathService
    const { PathService } = await import('./src/services/PathService.js');

    // Create a test directory
    const testDir = path.join(os.tmpdir(), 'speco-test-' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });

    console.log('Created test directory:', testDir);

    // Create PathService instance
    const pathService = new PathService(null, testDir, {
        info: (msg) => console.log('PathService log:', msg),
        warn: (msg) => console.log('PathService warn:', msg),
        error: (msg) => console.log('PathService error:', msg)
    });

    // Test initialize method (this should trigger the fixed logging)
    console.log('Testing PathService.initialize()...');
    const result = await pathService.initialize({});

    console.log('PathService initialize result:', result.success ? 'SUCCESS' : 'FAILED');

    // Check if result is JSON serializable
    try {
        const jsonString = JSON.stringify(result);
        console.log('✅ PathService result is JSON serializable');
    } catch (jsonError) {
        console.log('❌ PathService result is NOT JSON serializable:', jsonError.message);
    }

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });

} catch (error) {
    console.log('❌ PathService test failed:', error.message);
}

console.log('\n=== Test completed ===');
