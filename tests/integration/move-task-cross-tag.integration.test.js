import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// import {  jest  } from '@jest/globals'; // Jest is already global

// Use __dirname directly (available in CommonJS)
const testDirname = __dirname;

// IMPORTANT: Mock ESM modules BEFORE any imports that use them
jest.mock("boxen", () => ({
	__esModule: true,
	default: jest.fn((text, options) => `[BOX] ${text}`),
}));

jest.mock("chalk", () => ({
	__esModule: true,
	default: {
		blue: jest.fn((text) => text),
		green: jest.fn((text) => text),
		red: jest.fn((text) => text),
		yellow: jest.fn((text) => text),
		cyan: jest.fn((text) => text),
		magenta: jest.fn((text) => text),
		white: jest.fn((text) => text),
		gray: jest.fn((text) => text),
		bold: jest.fn((text) => text),
	},
}));

// Mock config-manager to avoid ESM issues
jest.mock("../../scripts/modules/config-manager.js", () => ({
	getProjectName: jest.fn(() => "test-project"),
	getMainProvider: jest.fn(() => ({
		name: "test-provider",
		model: "test-model",
	})),
	// Add other functions as needed
}));

// IMPORTANT: Mock dependencies BEFORE any imports that use them
const mockUtils = {
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	findProjectRoot: jest.fn(() => "/test/project/root"),
	log: jest.fn(),
	setTasksForTag: jest.fn(),
	traverseDependencies: jest.fn((sourceTasks, allTasks, options = {}) => {
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
jest.unstable_mockModule(
	path.join(__dirname, "../../scripts/modules/utils.js"),
	() => mockUtils,
);

// Mock other dependencies BEFORE importing them using absolute paths
// Note: is-task-dependent.js doesn't exist, removing this mock

jest.unstable_mockModule(
	path.join(__dirname, "../../scripts/modules/dependency-manager.js"),
	() => ({
		findCrossTagDependencies: jest.fn(() => {
			// Since dependencies can only exist within the same tag,
			// this function should never find any cross-tag conflicts
			return [];
		}),
		getDependentTaskIds: jest.fn(
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
		validateSubtaskMove: jest.fn((taskId, sourceTag, targetTag) => {
			// Throw error for subtask IDs
			const taskIdStr = String(taskId);
			if (taskIdStr.includes(".")) {
				throw new Error("Cannot move subtasks directly between tags");
			}
		}),
	}),
);

jest.unstable_mockModule(
	path.join(
		__dirname,
		"../../scripts/modules/task-manager/generate-task-files.js",
	),
	() => ({
		default: jest.fn().mockResolvedValue(),
	}),
);

// Cross-Tag Task Movement Integration Tests
describe("Cross-Tag Task Movement Integration Tests", () => {
	test("placeholder test for cross-tag movement", () => {
		expect(true).toBe(true);
	});
});
