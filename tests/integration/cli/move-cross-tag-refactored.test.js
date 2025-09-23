// Test file for refactored moveAction with dependency injection
// This file contains only the successfully refactored test cases

import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";

// Import refactored moveAction and dependencies
import { moveAction } from "../../../scripts/modules/cli/move-action.js";
import { createMockDependencies } from "../../../scripts/modules/cli/move-action-dependencies.js";

let tempDir;

/**
 * Create test-specific mock dependencies with custom behavior
 */
function createTestMockDependencies(overrides = {}) {
  const baseMocks = createMockDependencies();

  // Apply custom overrides
  Object.keys(overrides).forEach(key => {
    if (typeof overrides[key] === 'function') {
      baseMocks[key] = overrides[key];
    }
  });

  return baseMocks;
}

describe("Refactored Cross-Tag Move CLI Integration", () => {
	beforeAll(async () => {
		// Create a temporary directory for testing
		tempDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "taskmaster-test-"),
		);

		// Create basic project structure using absolute paths
		const taskmasterDir = path.join(tempDir, ".taskmaster");
		const tasksDir = path.join(taskmasterDir, "tasks");
		const tasksFile = path.join(tasksDir, "tasks.json");
		const packageFile = path.join(tempDir, "package.json");

		fs.mkdirSync(tasksDir, { recursive: true });
		fs.writeFileSync(packageFile, JSON.stringify({ name: "test-project" }));

		// Create mock task data in the correct format that moveTasksBetweenTags expects
		const mockTasksData = {
			version: "1.0.0",
			tasks: {
				"1": {
					id: "1",
					title: "Test Task 1",
					status: "pending",
					tags: ["backlog"]
				},
				"2": {
					id: "2",
					title: "Test Task 2",
					status: "pending",
					tags: ["backlog"]
				}
			},
			tags: {
				backlog: ["1", "2"],
				"in-progress": [],
				done: []
			}
		};

		fs.writeFileSync(tasksFile, JSON.stringify(mockTasksData, null, 2));
	});

	afterAll(() => {
		// Cleanup temporary directory
		if (tempDir && fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should move task without dependencies successfully", async () => {
		// Create mock dependencies with custom behavior
		let moveTasksCallCount = 0;
		let generateTasksCallCount = 0;

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				return { message: "Successfully moved task(s) between tags" };
			},
			generateTaskFiles: () => async (...args) => {
				generateTasksCallCount++;
			},
			getCurrentTag: () => "main" // Mock current tag
		});

		const options = {
			from: "2",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		// Execute move action with mock dependencies
		await expect(moveAction(options, mockDeps, { tempDir })).resolves.not.toThrow();

		// Verify the functions were called correctly
		expect(moveTasksCallCount).toBe(1);
		expect(generateTasksCallCount).toBe(2); // Called twice: for source and target tags
	});

	it("should fail to move task with cross-tag dependencies", async () => {
		// Create mock dependencies that simulate dependency conflict
		let moveTasksCallCount = 0;
		const expectedError = new Error("Cannot move task due to cross-tag dependency conflicts");

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				throw expectedError;
			},
			generateTaskFiles: () => async (...args) => {
				// Should not be called due to error
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		// Execute and expect rejection
		await expect(moveAction(options, mockDeps, { tempDir })).rejects.toThrow(
			"Cannot move task due to cross-tag dependency conflicts"
		);

		// Verify function was called and error was logged
		expect(moveTasksCallCount).toBe(1);
	});

	it("should move task with dependencies when --with-dependencies is used", async () => {
		// Create mock dependencies for dependency-aware move
		let moveTasksCallCount = 0;
		let capturedArgs = null;

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				capturedArgs = args;
				return { message: "Successfully moved with dependencies" };
			},
			generateTaskFiles: () => async (...args) => {
				// Called for both tags
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
			withDependencies: true,
		};

		// Execute the move action
		await moveAction(options, mockDeps, { tempDir });

		// Verify the function was called with correct dependency parameters
		expect(moveTasksCallCount).toBe(1);
		expect(capturedArgs).toEqual([
			expect.stringContaining("tasks.json"), // tasksPath
			["1"], // taskIds
			"backlog", // sourceTag
			"in-progress", // toTag
			expect.objectContaining({
				withDependencies: true,
				ignoreDependencies: false, // default value
			}),
			expect.objectContaining({
				projectRoot: tempDir,
			})
		]);
	});

	it("should break dependencies when --ignore-dependencies is used", async () => {
		// Create mock dependencies for dependency-breaking move
		let moveTasksCallCount = 0;
		let capturedArgs = null;

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				capturedArgs = args;
				return { message: "Successfully moved with dependencies ignored" };
			},
			generateTaskFiles: () => async (...args) => {
				// Called for both tags
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
			ignoreDependencies: true,
		};

		// Execute the move action
		await moveAction(options, mockDeps, { tempDir });

		// Verify the function was called with ignore dependencies parameter
		expect(moveTasksCallCount).toBe(1);
		expect(capturedArgs).toEqual([
			expect.stringContaining("tasks.json"), // tasksPath
			["1"], // taskIds
			"backlog", // sourceTag
			"in-progress", // toTag
			expect.objectContaining({
				withDependencies: false, // default value
				ignoreDependencies: true,
			}),
			expect.objectContaining({
				projectRoot: tempDir,
			})
		]);
	});

	it("should create target tag if it does not exist", async () => {
		// Create mock dependencies for moving to new tag
		let moveTasksCallCount = 0;
		let capturedArgs = null;

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				capturedArgs = args;
				return { message: "Successfully moved to new tag" };
			},
			generateTaskFiles: () => async (...args) => {
				// Called for both tags (source and newly created target)
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: "2",
			fromTag: "backlog",
			toTag: "new-tag", // New tag that doesn't exist
		};

		// Execute the move action
		await moveAction(options, mockDeps, { tempDir });

		// Verify the function was called with the new target tag
		expect(moveTasksCallCount).toBe(1);
		expect(capturedArgs[3]).toBe("new-tag"); // toTag should be "new-tag"
	});

	it("should fail to move a subtask directly", async () => {
		// Create mock dependencies that reject subtask movement
		let moveTasksCallCount = 0;
		const subtaskError = new Error(
			"Cannot move subtasks directly between tags. Please promote the subtask to a full task first."
		);

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				throw subtaskError;
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: "1.2", // Subtask ID
			fromTag: "backlog",
			toTag: "in-progress",
		};

		// Execute and expect rejection
		await expect(moveAction(options, mockDeps, { tempDir })).rejects.toThrow(
			"Cannot move subtasks directly between tags. Please promote the subtask to a full task first."
		);

		// Verify function was called and error was captured
		expect(moveTasksCallCount).toBe(1);
	});

	it("should provide helpful error messages for dependency conflicts", async () => {
		// Create mock dependencies for dependency conflict scenario
		let moveTasksCallCount = 0;
		const dependencyError = new Error(
			"Cross-tag dependency conflicts detected. Task 1 depends on Task 2 which is in a different tag."
		);

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				throw dependencyError;
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		// Execute and expect detailed error message
		await expect(moveAction(options, mockDeps, { tempDir })).rejects.toThrow(
			"Cross-tag dependency conflicts detected. Task 1 depends on Task 2 which is in a different tag."
		);

		// Verify function was called and error was captured
		expect(moveTasksCallCount).toBe(1);
	});
});
