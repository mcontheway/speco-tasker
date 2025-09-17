/**
 * Test ES module functionality
 */

import { jest } from '@jest/globals';

// Test basic ES module functionality
describe('ES Module Support', () => {
	test('should support ES module syntax', () => {
		expect(true).toBe(true);
	});

	test('should handle import.meta.url', () => {
		// This should work with our mock
		const url = import.meta.url;
		expect(typeof url).toBe('string');
		expect(url).toMatch(/^file:\/\/\//);
	});

	test('should support async/await in ES modules', async () => {
		const result = await Promise.resolve('test');
		expect(result).toBe('test');
	});
});
