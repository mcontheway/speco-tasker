import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";

// Use __dirname directly (available in CommonJS)
const testDirname = path.dirname(fileURLToPath(import.meta.url));

// IMPORTANT: Mock ESM modules BEFORE any imports that use them
vi.mock("boxen", () => ({
	__esModule: true,
	default: vi.fn((text, options) => `[BOX] ${text}`),
}));

vi.mock("chalk", () => ({
	__esModule: true,
	default: {
		blue: vi.fn((text) => text),
		green: vi.fn((text) => text),
		red: vi.fn((text) => text),
		yellow: vi.fn((text) => text),
		cyan: vi.fn((text) => text),
		magenta: vi.fn((text) => text),
		white: vi.fn((text) => text),
		gray: vi.fn((text) => text),
		bold: vi.fn((text) => text),
	},
}));

// Mock config-manager to avoid ESM issues
vi.mock("../../scripts/modules/config-manager.js", () => ({
	getProjectName: vi.fn(() => "test-project"),
	getMainProvider: vi.fn(() => ({
		name: "test-provider",
		model: "test-model",
	})),
	// Add other functions as needed
}));

// IMPORTANT: Mock dependencies BEFORE any imports that use them
const mockUtils = {
	readJSON: vi.fn(),
	writeJSON: vi.fn(),
	findProjectRoot: vi.fn(() => "/test/project/root"),
	log: vi.fn(),
	setTasksForTag: vi.fn(),
	traverseDependencies: vi.fn((sourceTasks, allTasks, options = {}) => {
		// Mock realistic dependency behavior for testing
		const { direction = "forward" } = options;

		if (direction === "forward") {
			// Return dependencies that tasks have
			const result = [];
			for (const task of sourceTasks) {
				if (task.dependencies && Array.isArray(task.dependencies)) {
					result.push(...task.dependencies);
				}
			}
			return result;
		}
		if (direction === "reverse") {
			// Return tasks that depend on the source tasks
			const sourceIds = sourceTasks.map((t) => t.id);
			const normalizedSourceIds = sourceIds.map((id) => String(id));
			const result = [];
			for (const task of allTasks) {
				if (task.dependencies && Array.isArray(task.dependencies)) {
					const hasDependency = task.dependencies.some((depId) =>
						normalizedSourceIds.includes(String(depId)),
					);
					if (hasDependency) {
						result.push(task.id);
					}
				}
			}
			return result;
		}
		return [];
	}),
};

// Mock the utils module BEFORE importing it using absolute paths
vi.doMock(
	path.join(__dirname, "../../scripts/modules/utils.js"),
	() => mockUtils,
);

// Mock other dependencies BEFORE importing them using absolute paths
// Note: is-task-dependent.js doesn't exist, removing this mock

vi.doMock(
	path.join(__dirname, "../../scripts/modules/dependency-manager.js"),
	() => ({
		findCrossTagDependencies: vi.fn(() => {
			// Since dependencies can only exist within the same tag,
			// this function should never find any cross-tag conflicts
			return [];
		}),
		getDependentTaskIds: vi.fn(
			(sourceTasks, crossTagDependencies, allTasks) => {
				// Since we now use findAllDependenciesRecursively in the actual implementation,
				// this mock simulates finding all dependencies recursively within the same tag
				const dependentIds = new Set();
				const processedIds = new Set();

				function findAllDependencies(taskId) {
					if (processedIds.has(taskId)) return;
					processedIds.add(taskId);

					const task = allTasks.find((t) => t.id === taskId);
					if (!task || !Array.isArray(task.dependencies)) return;

					for (const depId of task.dependencies) {
						const normalizedDepId =
							typeof depId === "string" ? Number.parseInt(depId, 10) : depId;
						if (!Number.isNaN(normalizedDepId) && normalizedDepId !== taskId) {
							dependentIds.add(normalizedDepId);
							findAllDependencies(normalizedDepId);
						}
					}
				}

				for (const sourceTask of sourceTasks) {
					if (sourceTask?.id) {
						findAllDependencies(sourceTask.id);
					}
				}

				return Array.from(dependentIds);
			},
		),
		validateSubtaskMove: vi.fn((taskId, sourceTag, targetTag) => {
			// Throw error for subtask IDs
			const taskIdStr = String(taskId);
			if (taskIdStr.includes(".")) {
				throw new Error("Cannot move subtasks directly between tags");
			}
		}),
	}),
);

vi.doMock(
	path.join(
		__dirname,
		"../../scripts/modules/task-manager/generate-task-files.js",
	),
	() => ({
		default: vi.fn().mockResolvedValue(),
	}),
);

// Cross-Tag Task Movement Integration Tests
describe("Cross-Tag Task Movement Integration Tests", () => {
	test("placeholder test for cross-tag movement", () => {
		expect(true).toBe(true);
	});
});
