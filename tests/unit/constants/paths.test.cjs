/**
 * Unit tests for path constants
 */

const {
	TASKMASTER_DIR,
	TASKMASTER_TASKS_DIR,
	TASKMASTER_CONFIG_FILE,
	TASKMASTER_TASKS_FILE,
	PROJECT_MARKERS,
} = require("../../../src/constants/paths.js");

describe("Path Constants", () => {
	describe("Directory paths", () => {
		test("should define taskmaster directory", () => {
			expect(TASKMASTER_DIR).toBe(".taskmaster");
		});

		test("should define taskmaster tasks directory", () => {
			expect(TASKMASTER_TASKS_DIR).toBe(".taskmaster/tasks");
		});
	});

	describe("File paths", () => {
		test("should define config file path", () => {
			expect(TASKMASTER_CONFIG_FILE).toBe(".taskmaster/config.json");
		});

		test("should define tasks file path", () => {
			expect(TASKMASTER_TASKS_FILE).toBe(".taskmaster/tasks/tasks.json");
		});
	});

	describe("Project markers", () => {
		test("should include essential project markers", () => {
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
			PROJECT_MARKERS.forEach((marker) => {
				expect(typeof marker).toBe("string");
			});
		});
	});
});
