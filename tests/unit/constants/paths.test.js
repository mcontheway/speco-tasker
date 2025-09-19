/**
 * Unit tests for path constants
 */

import { 
	TASKMASTER_DIR,
	TASKMASTER_TASKS_DIR,
	TASKMASTER_CONFIG_FILE,
	TASKMASTER_TASKS_FILE,
	PROJECT_MARKERS,
 } from '../../../src/constants/paths.js';

describe("Path Constants", () => {
	describe("Directory paths", () => {
		test("should define speco directory", () => {
			expect(TASKMASTER_DIR).toBe(".speco");
		});

		test("should define speco tasks directory", () => {
			expect(TASKMASTER_TASKS_DIR).toBe(".speco/tasks");
		});
	});

	describe("File paths", () => {
		test("should define config file path", () => {
			expect(TASKMASTER_CONFIG_FILE).toBe(".speco/config.json");
		});

		test("should define tasks file path", () => {
			expect(TASKMASTER_TASKS_FILE).toBe(".speco/tasks/tasks.json");
		});
	});

	describe("Project markers", () => {
		test("should include essential project markers", () => {
			expect(PROJECT_MARKERS).toContain(".speco");
			expect(PROJECT_MARKERS).toContain(".taskmaster");
			expect(PROJECT_MARKERS).toContain(".git");
			expect(PROJECT_MARKERS).toContain(".taskmasterconfig");
		});

		test("should be an array", () => {
			expect(Array.isArray(PROJECT_MARKERS)).toBe(true);
		});

		test("should have reasonable length", () => {
			expect(PROJECT_MARKERS.length).toBeGreaterThan(0);
			expect(PROJECT_MARKERS.length).toBeLessThan(20);
		});

		test("should contain only strings", () => {
			for (const marker of PROJECT_MARKERS) {
				expect(typeof marker).toBe("string");
			}
		});
	});
});
