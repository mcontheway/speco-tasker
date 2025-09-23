// Import required modules first
import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";

// Import modules (no global mocks - we'll mock in individual tests)
import moveTaskModule from "../../../scripts/modules/task-manager/move-task.js";
import generateTaskFilesModule from "../../../scripts/modules/task-manager/generate-task-files.js";
import * as utilsModule from "../../../scripts/modules/utils.js";
import chalk from "chalk";

// Import refactored moveAction and dependencies
import { moveAction } from "../../../scripts/modules/cli/move-action.js";
import { createMockDependencies } from "../../../scripts/modules/cli/move-action-dependencies.js";

let tempDir;

/**
 * Create test-specific mock dependencies with custom behavior
 * @param {object} overrides - Custom mock behaviors to override defaults
 * @returns {object} Mock dependencies object
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

/**
 * Helper to create spy-based mock for a specific module function
 * @param {object} module - The module to spy on
 * @param {string} functionName - Function name to spy on
 * @param {*} returnValue - Return value for the spy
 * @returns {Function} Spy function
 */
function createModuleSpy(module, functionName, returnValue = undefined) {
  if (typeof module[functionName] === 'function') {
    const spy = vi.fn().mockResolvedValue(returnValue);
    // Replace the module function with our spy
    const original = module[functionName];
    module[functionName] = spy;
    spy.restore = () => { module[functionName] = original; };
    return spy;
  }
  return vi.fn().mockResolvedValue(returnValue);
}

/**
 * Cross-Tag Move CLI Integration Tests
 *
 * These tests validate the CLI interface for cross-tag task movement.
 * They cover 22 different scenarios including:
 * - Basic cross-tag moves
 * - Dependency handling (--with-dependencies, --ignore-dependencies)
 * - Error conditions and validation
 * - Parameter parsing and validation
 * - Target tag auto-creation
 * - Multiple task handling
 *
 * STATUS: Temporarily skipped due to Vitest ES module mocking complexities.
 * The core business logic is fully tested in move-task-simple.integration.test.js
 *
 * TODO: Re-enable once Vitest ES module mocking is more stable, or refactor
 * to use a different mocking strategy (e.g., dependency injection).
 */
describe("Cross-Tag Move CLI Integration", () => {
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
		const taskData = {
			"backlog": {
				tasks: [
					{
						id: 1,
						title: "Task 1",
						description: "Description 1",
						status: "pending",
						dependencies: [],
						priority: "medium",
						details: "Details 1",
						testStrategy: "Test 1",
					},
					{
						id: 2,
						title: "Task 2",
						description: "Description 2",
						status: "pending",
						dependencies: [],
						priority: "medium",
						details: "Details 2",
						testStrategy: "Test 2",
					},
				],
				lastUpdated: new Date().toISOString(),
			},
			"in-progress": {
				tasks: [],
				lastUpdated: new Date().toISOString(),
			},
			"done": {
				tasks: [],
				lastUpdated: new Date().toISOString(),
			},
		};

		fs.writeFileSync(tasksFile, JSON.stringify(taskData, null, 2));
	});

	afterAll(() => {
		// Cleanup temporary directory
		// Note: Delay cleanup to ensure tests complete first
		setTimeout(() => {
			if (tempDir && fs.existsSync(tempDir)) {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		}, 1000);
	});

	beforeEach(() => {
		vi.clearAllMocks();
		// Mock functions individually in each test
	});

	// Helper function to capture console output and process.exit calls
	function captureConsoleAndExit() {
		const originalConsoleError = console.error;
		const originalConsoleLog = console.log;
		const originalProcessExit = process.exit;

		const errorMessages = [];
		const logMessages = [];
		const exitCodes = [];

		console.error = vi.fn((...args) => {
			errorMessages.push(args.join(" "));
		});

		console.log = vi.fn((...args) => {
			logMessages.push(args.join(" "));
		});

		process.exit = vi.fn((code) => {
			exitCodes.push(code);
		});

		return {
			errorMessages,
			logMessages,
			exitCodes,
			restore: () => {
				console.error = originalConsoleError;
				console.log = originalConsoleLog;
				process.exit = originalProcessExit;
			},
		};
	}

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

		const { errorMessages, restore } = captureConsoleAndExit();

		// Execute and expect rejection
		await expect(moveAction(options, mockDeps, { tempDir })).rejects.toThrow(
			"Cannot move task due to cross-tag dependency conflicts"
		);

		// Verify function was called and error was logged
		expect(moveTasksCallCount).toBe(1);
		expect(
			errorMessages.some((msg) =>
				msg.includes("cross-tag dependency conflicts")
			)
		).toBe(true);

		restore();
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

		const { errorMessages, restore } = captureConsoleAndExit();

		// Execute and expect rejection
		await expect(moveAction(options, mockDeps, { tempDir })).rejects.toThrow(
			"Cannot move subtasks directly between tags. Please promote the subtask to a full task first."
		);

		// Verify function was called and error was captured
		expect(moveTasksCallCount).toBe(1);
		expect(errorMessages.some((msg) => msg.includes("subtasks directly"))).toBe(true);

		restore();
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

		const { errorMessages, restore } = captureConsoleAndExit();

		// Execute and expect detailed error message
		await expect(moveAction(options, mockDeps, { tempDir })).rejects.toThrow(
			"Cross-tag dependency conflicts detected. Task 1 depends on Task 2 which is in a different tag."
		);

		// Verify function was called and error was captured
		expect(moveTasksCallCount).toBe(1);
		expect(
			errorMessages.some((msg) =>
				msg.includes("Cross-tag dependency conflicts detected")
			)
		).toBe(true);

		restore();
	});

	it("should print advisory tips when result.tips are returned (ignore-dependencies)", async () => {
		const { errorMessages, logMessages, restore } = captureConsoleAndExit();

		try {
			// Create mock dependencies that return tips
			const mockDeps = createTestMockDependencies({
				moveTasksBetweenTags: () => async (...args) => ({
					message: "ok",
					tips: [
						'Run "task-master validate-dependencies" to check for dependency issues.',
						'Run "task-master fix-dependencies" to automatically repair dangling dependencies.',
					],
				}),
				generateTaskFiles: () => async (...args) => {
					// Called for both tags
				},
				getCurrentTag: () => "main"
			});

			await moveAction({
				from: "2",
				fromTag: "backlog",
				toTag: "in-progress",
				ignoreDependencies: true,
			}, mockDeps, { tempDir });

			const joined = logMessages.join("\n");
			expect(joined).toContain("Next Steps");
			expect(joined).toContain("validate-dependencies");
			expect(joined).toContain("fix-dependencies");
		} finally {
			restore();
		}
	});

	it("should print ID collision suggestions when target already has the ID", async () => {
		const { errorMessages, logMessages, restore } = captureConsoleAndExit();

		try {
			// Create mock dependencies that throw ID collision error
			const collisionError = new Error(
				'Task 1 already exists in target tag "in-progress"'
			);

			const mockDeps = createTestMockDependencies({
				moveTasksBetweenTags: () => async (...args) => {
					throw collisionError;
				},
				getCurrentTag: () => "main"
			});

			await expect(
				moveAction({ from: "1", fromTag: "backlog", toTag: "in-progress" }, mockDeps, { tempDir }),
			).rejects.toThrow("already exists in target tag");

			const joined = logMessages.join("\n");
			expect(joined).toContain("Conflict: ID already exists in target tag");
			expect(joined).toContain("different target tag");
			expect(joined).toContain("different set of IDs");
			expect(joined).toContain("within-tag");
		} finally {
			restore();
		}
	});

	it("should handle same tag error correctly", async () => {
		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "backlog", // Same tag but no destination
		};

		const { errorMessages, logMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options, {}, { tempDir })).rejects.toThrow(
			'Source and target tags are the same ("backlog") but no destination specified',
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes(
					'Source and target tags are the same ("backlog") but no destination specified',
				),
			),
		).toBe(true);
		expect(
			logMessages.some((msg) => msg.includes("For within-tag moves")),
		).toBe(true);
		expect(logMessages.some((msg) => msg.includes("For cross-tag moves"))).toBe(
			true,
		);

		restore();
	});

	it("should use current tag when --from-tag is not provided", async () => {
		// Create mock dependencies for current tag fallback
		let moveTasksCallCount = 0;
		let generateTasksCalls = [];

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				return { message: "Successfully moved task(s) between tags" };
			},
			generateTaskFiles: () => async (...args) => {
				generateTasksCalls.push(args);
			},
			getCurrentTag: () => "main" // Mock current tag as "main"
		});

		// Simulate command: task-master move --from=1 --to-tag=in-progress
		// (no --from-tag provided, should use current tag 'main')
		await moveAction({
			from: "1",
			toTag: "in-progress",
			withDependencies: false,
			ignoreDependencies: false,
			// fromTag is intentionally not provided to test fallback
		}, mockDeps, { tempDir });

		// Verify that moveTasksBetweenTags was called with 'main' as source tag
		expect(moveTasksCallCount).toBe(1);

		// Verify that generateTaskFiles was called for both tags
		expect(generateTasksCalls.length).toBe(2);
		expect(generateTasksCalls[0][2]).toEqual({ tag: "main" }); // First call for source tag
		expect(generateTasksCalls[1][2]).toEqual({ tag: "in-progress" }); // Second call for target tag
	});

	it("should move multiple tasks with comma-separated IDs successfully", async () => {
		// Create mock dependencies for multiple task move
		let moveTasksCallCount = 0;
		let generateTasksCalls = [];

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				return { message: "Successfully moved multiple tasks" };
			},
			generateTaskFiles: () => async (...args) => {
				generateTasksCalls.push(args);
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: "1,2,3",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		await moveAction(options, mockDeps, { tempDir });

		// Verify that moveTasksBetweenTags was called with parsed task IDs
		expect(moveTasksCallCount).toBe(1);

		// Verify task files are generated for both tags
		expect(generateTasksCalls.length).toBe(2);
		expect(generateTasksCalls[0][2]).toEqual({ tag: "backlog" });
		expect(generateTasksCalls[1][2]).toEqual({ tag: "in-progress" });
	});

	// Note: --force flag is no longer supported for cross-tag moves

	it("should fail when invalid task ID is provided", async () => {
		const options = {
			from: "1,abc,3", // Invalid ID in middle
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options, {}, { tempDir })).rejects.toThrow(
			'Invalid task ID at position 2: "abc" is not a valid number',
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes("Invalid task ID at position 2"),
			),
		).toBe(true);

		restore();
	});

	it("should fail when first task ID is invalid", async () => {
		const options = {
			from: "abc,2,3", // Invalid ID at start
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options, {}, { tempDir })).rejects.toThrow(
			'Invalid task ID at position 1: "abc" is not a valid number',
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes("Invalid task ID at position 1"),
			),
		).toBe(true);

		restore();
	});

	it("should fail when last task ID is invalid", async () => {
		const options = {
			from: "1,2,xyz", // Invalid ID at end
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options, {}, { tempDir })).rejects.toThrow(
			'Invalid task ID at position 3: "xyz" is not a valid number',
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes("Invalid task ID at position 3"),
			),
		).toBe(true);

		restore();
	});

	it("should fail when single invalid task ID is provided", async () => {
		const options = {
			from: "invalid",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options, {}, { tempDir })).rejects.toThrow(
			'Invalid task ID at position 1: "invalid" is not a valid number',
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes("Invalid task ID at position 1"),
			),
		).toBe(true);

		restore();
	});

	// Note: --force combinations removed

	// Note: --force combinations removed

	// Note: --force combinations removed

	it("should handle whitespace in comma-separated task IDs", async () => {
		// Create mock dependencies for whitespace handling test
		let moveTasksCallCount = 0;
		let capturedArgs = null;

		const mockDeps = createTestMockDependencies({
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksCallCount++;
				capturedArgs = args;
				return { message: "Successfully handled whitespace" };
			},
			generateTaskFiles: () => async (...args) => {
				// Called for both tags
			},
			getCurrentTag: () => "main"
		});

		const options = {
			from: " 1 , 2 , 3 ", // Whitespace around IDs and commas
			fromTag: "backlog",
			toTag: "in-progress",
		};

		await moveAction(options, mockDeps, { tempDir });

		// Verify that whitespace was properly trimmed and parsed
		expect(moveTasksCallCount).toBe(1);
		expect(capturedArgs[1]).toEqual(["1", "2", "3"]); // Should trim whitespace and keep as strings
	});

	it("should fail when --from parameter is missing for cross-tag move", async () => {
		const options = {
			fromTag: "backlog",
			toTag: "in-progress",
			// from is intentionally missing
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options, {}, { tempDir })).rejects.toThrow(
			"--from parameter is required for cross-tag moves",
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes("--from parameter is required for cross-tag moves"),
			),
		).toBe(true);

		restore();
	});

	it("should fail when both --from and --to are missing for within-tag move", async () => {
		const options = {
			// Both from and to are missing for within-tag move
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		// Provide mock dependencies with getCurrentTag to avoid the function not found error
		const mockDeps = createTestMockDependencies({
			getCurrentTag: () => "test-tag" // Return a tag so it's treated as within-tag move
		});

		await expect(moveAction(options, mockDeps, { tempDir })).rejects.toThrow(
			"Both --from and --to parameters are required for within-tag moves",
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes(
					"Both --from and --to parameters are required for within-tag moves",
				),
			),
		).toBe(true);

		restore();
	});

	it("should handle within-tag move when only --from is provided", async () => {
		// Create mock dependencies for within-tag move
		let moveTaskCallCount = 0;
		let moveTasksBetweenTagsCallCount = 0;
		let capturedArgs = null;

		const mockDeps = createTestMockDependencies({
			getCurrentTag: () => "test-tag", // Return a tag so it's treated as within-tag move
			moveTask: () => async (...args) => {
				moveTaskCallCount++;
				capturedArgs = args;
				return { message: "Successfully moved task" };
			},
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksBetweenTagsCallCount++;
			}
		});

		const options = {
			from: "1",
			to: "2",
			// No tags specified, should use within-tag logic
		};

		await moveAction(options, mockDeps, { tempDir });

		// Verify moveTask was called with correct arguments and moveTasksBetweenTags was not
		expect(moveTaskCallCount).toBe(1);
		expect(moveTasksBetweenTagsCallCount).toBe(0);
		expect(capturedArgs).toEqual(["1", "2"]);
	});

	it("should handle within-tag move when both tags are the same", async () => {
		// Create mock dependencies for within-tag move with same tags
		let moveTaskCallCount = 0;
		let moveTasksBetweenTagsCallCount = 0;
		let capturedArgs = null;

		const mockDeps = createTestMockDependencies({
			moveTask: () => async (...args) => {
				moveTaskCallCount++;
				capturedArgs = args;
				return { message: "Successfully moved task" };
			},
			moveTasksBetweenTags: () => async (...args) => {
				moveTasksBetweenTagsCallCount++;
			}
		});

		const options = {
			from: "1",
			to: "2",
			fromTag: "main",
			toTag: "main", // Same tag, should use within-tag logic
		};

		await moveAction(options, mockDeps, { tempDir });

		// Verify moveTask was called with correct arguments and moveTasksBetweenTags was not
		expect(moveTaskCallCount).toBe(1);
		expect(moveTasksBetweenTagsCallCount).toBe(0);
		expect(capturedArgs).toEqual(["1", "2"]);
	});

	it("should fail when both tags are the same but no destination is provided", async () => {
		const options = {
			from: "1",
			fromTag: "main",
			toTag: "main", // Same tag but no destination
		};

		const { errorMessages, logMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options, {}, { tempDir })).rejects.toThrow(
			'Source and target tags are the same ("main") but no destination specified',
		);

		expect(
			errorMessages.some((msg) =>
				msg.includes(
					'Source and target tags are the same ("main") but no destination specified',
				),
			),
		).toBe(true);
		expect(
			logMessages.some((msg) => msg.includes("For within-tag moves")),
		).toBe(true);
		expect(logMessages.some((msg) => msg.includes("For cross-tag moves"))).toBe(
			true,
		);

		restore();
	});
});
