import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";

// Mock process.chdir to avoid Vitest worker limitations
const originalChdir = process.chdir;
process.chdir = vi.fn();

afterAll(() => {
	process.chdir = originalChdir;
});

// --- Define mock functions ---
const mockMoveTasksBetweenTags = vi.fn();
const mockMoveTask = vi.fn();
const mockGenerateTaskFiles = vi.fn();
const mockLog = vi.fn();

// --- Setup mocks using vi.mock ---
vi.mock("../../../scripts/modules/task-manager/move-task.js", () => ({
	default: mockMoveTask,
	moveTasksBetweenTags: mockMoveTasksBetweenTags,
}));

vi.mock(
	"../../../scripts/modules/task-manager/generate-task-files.js",
	() => ({
		default: mockGenerateTaskFiles,
	}),
);

// Mock utils module with manual mock setup
const mockUtils = {
	log: mockLog,
	readJSON: vi.fn(),
	writeJSON: vi.fn(),
	findProjectRoot: vi.fn(),
	getCurrentTag: vi.fn(),
};

// Mock the entire utils module
vi.mock("../../../scripts/modules/utils.js", () => mockUtils);

// --- Mock chalk for consistent output formatting ---
const mockChalk = {
	red: vi.fn((text) => text),
	yellow: vi.fn((text) => text),
	blue: vi.fn((text) => text),
	green: vi.fn((text) => text),
	gray: vi.fn((text) => text),
	dim: vi.fn((text) => text),
	cyan: vi.fn((text) => text),
	white: vi.fn((text) => text),
	bold: {
		cyan: vi.fn((text) => text),
		white: vi.fn((text) => text),
		red: vi.fn((text) => text),
	},
};

vi.mock("chalk", () => mockChalk);

// --- Import modules (AFTER mock setup) ---
let moveTaskModule;
let generateTaskFilesModule;
let utilsModule;
let chalk;
let tempDir;

describe("Cross-Tag Move CLI Integration", () => {
	// Setup module imports before tests run
	beforeAll(async () => {
		// Create a temporary directory for testing
		tempDir = fs.mkdtempSync(
			path.join(require("node:os").tmpdir(), "taskmaster-test-"),
		);
		process.chdir(tempDir);

		// Create basic project structure
		fs.mkdirSync(".taskmaster/tasks", { recursive: true });
		fs.writeFileSync("package.json", JSON.stringify({ name: "test-project" }));

		// Import modules after setting up the test environment
		moveTaskModule = require("../../../scripts/modules/task-manager/move-task.js");
		generateTaskFilesModule = require("../../../scripts/modules/task-manager/generate-task-files.js");
		utilsModule = require("../../../scripts/modules/utils.js");
		chalk = require("chalk");

		// No need for findProjectRoot mock since we use tempDir directly
	});

	afterAll(() => {
		// Cleanup temporary directory
		if (tempDir && fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	beforeEach(() => {
		vi.clearAllMocks();
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

	// --- Replicate the move command action handler logic from commands.js ---
	async function moveAction(options) {
		const sourceId = options.from;
		const destinationId = options.to;
		const fromTag = options.fromTag;
		const toTag = options.toTag;
		const withDependencies = options.withDependencies;
		const ignoreDependencies = options.ignoreDependencies;
		const force = options.force;

		// Get the source tag - fallback to current tag if not provided
		const sourceTag = fromTag || utilsModule.getCurrentTag();

		// Check if this is a cross-tag move (different tags)
		const isCrossTagMove = sourceTag && toTag && sourceTag !== toTag;

		if (isCrossTagMove) {
			// Cross-tag move logic
			if (!sourceId) {
				const error = new Error(
					"--from parameter is required for cross-tag moves",
				);
				console.error(chalk.red(`Error: ${error.message}`));
				throw error;
			}

			const taskIds = sourceId
				.split(",")
				.map((id) => Number.parseInt(id.trim(), 10));

			// Validate parsed task IDs
			for (let i = 0; i < taskIds.length; i++) {
				if (Number.isNaN(taskIds[i])) {
					const error = new Error(
						`Invalid task ID at position ${i + 1}: "${sourceId.split(",")[i].trim()}" is not a valid number`,
					);
					console.error(chalk.red(`Error: ${error.message}`));
					throw error;
				}
			}

			const tasksPath = path.join(
				tempDir,
				".taskmaster",
				"tasks",
				"tasks.json",
			);

			try {
				const result = await moveTaskModule.moveTasksBetweenTags(
					tasksPath,
					taskIds,
					sourceTag,
					toTag,
					{
						withDependencies,
						ignoreDependencies,
					},
				);

				console.log(chalk.green("Successfully moved task(s) between tags"));

				// Print advisory tips when present
				if (result && Array.isArray(result.tips) && result.tips.length > 0) {
					console.log("Next Steps:");
					for (const t of result.tips) {
						console.log(`  • ${t}`);
					}
				}

				// Generate task files for both tags
				await generateTaskFilesModule.default(
					tasksPath,
					path.dirname(tasksPath),
					{
						tag: sourceTag,
					},
				);
				await generateTaskFilesModule.default(
					tasksPath,
					path.dirname(tasksPath),
					{ tag: toTag },
				);
			} catch (error) {
				console.error(chalk.red(`Error: ${error.message}`));
				// Print ID collision guidance similar to CLI help block
				if (
					typeof error?.message === "string" &&
					error.message.includes("already exists in target tag")
				) {
					console.log("");
					console.log("Conflict: ID already exists in target tag");
					console.log(
						"  • Choose a different target tag without conflicting IDs",
					);
					console.log("  • Move a different set of IDs (avoid existing ones)");
					console.log(
						"  • If needed, move within-tag to a new ID first, then cross-tag move",
					);
				}
				throw error;
			}
		} else {
			// Handle case where both tags are provided but are the same
			if (sourceTag && toTag && sourceTag === toTag) {
				// If both tags are the same and we have destinationId, treat as within-tag move
				if (destinationId) {
					if (!sourceId) {
						const error = new Error(
							"Both --from and --to parameters are required for within-tag moves",
						);
						console.error(chalk.red(`Error: ${error.message}`));
						throw error;
					}

					// Call the existing moveTask function for within-tag moves
					try {
						await moveTaskModule.default(sourceId, destinationId);
						console.log(chalk.green("Successfully moved task"));
					} catch (error) {
						console.error(chalk.red(`Error: ${error.message}`));
						throw error;
					}
				} else {
					// Same tags but no destinationId - this is an error
					const error = new Error(
						`Source and target tags are the same ("${sourceTag}") but no destination specified`,
					);
					console.error(chalk.red(`Error: ${error.message}`));
					console.log(
						chalk.yellow(
							"For within-tag moves, use: task-master move --from=<sourceId> --to=<destinationId>",
						),
					);
					console.log(
						chalk.yellow(
							"For cross-tag moves, use different tags: task-master move --from=<sourceId> --from-tag=<sourceTag> --to-tag=<targetTag>",
						),
					);
					throw error;
				}
			} else {
				// Within-tag move logic (existing functionality)
				if (!sourceId || !destinationId) {
					const error = new Error(
						"Both --from and --to parameters are required for within-tag moves",
					);
					console.error(chalk.red(`Error: ${error.message}`));
					throw error;
				}

				// Call the existing moveTask function for within-tag moves
				try {
					await moveTaskModule.default(sourceId, destinationId);
					console.log(chalk.green("Successfully moved task"));
				} catch (error) {
					console.error(chalk.red(`Error: ${error.message}`));
					throw error;
				}
			}
		}
	}

	it("should move task without dependencies successfully", async () => {
		// Mock successful cross-tag move
		mockMoveTasksBetweenTags.mockResolvedValue(undefined);
		mockGenerateTaskFiles.mockResolvedValue(undefined);

		const options = {
			from: "2",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		await moveAction(options);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			[2],
			"backlog",
			"in-progress",
			{
				withDependencies: undefined,
				ignoreDependencies: undefined,
			},
		);
	});

	it("should fail to move task with cross-tag dependencies", async () => {
		// Mock dependency conflict error
		mockMoveTasksBetweenTags.mockRejectedValue(
			new Error("Cannot move task due to cross-tag dependency conflicts"),
		);

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options)).rejects.toThrow(
			"Cannot move task due to cross-tag dependency conflicts",
		);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalled();
		expect(
			errorMessages.some((msg) =>
				msg.includes("cross-tag dependency conflicts"),
			),
		).toBe(true);

		restore();
	});

	it("should move task with dependencies when --with-dependencies is used", async () => {
		// Mock successful cross-tag move with dependencies
		mockMoveTasksBetweenTags.mockResolvedValue(undefined);
		mockGenerateTaskFiles.mockResolvedValue(undefined);

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
			withDependencies: true,
		};

		await moveAction(options);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			[1],
			"backlog",
			"in-progress",
			{
				withDependencies: true,
				ignoreDependencies: undefined,
			},
		);
	});

	it("should break dependencies when --ignore-dependencies is used", async () => {
		// Mock successful cross-tag move with dependency breaking
		mockMoveTasksBetweenTags.mockResolvedValue(undefined);
		mockGenerateTaskFiles.mockResolvedValue(undefined);

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
			ignoreDependencies: true,
		};

		await moveAction(options);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			[1],
			"backlog",
			"in-progress",
			{
				withDependencies: undefined,
				ignoreDependencies: true,
			},
		);
	});

	it("should create target tag if it does not exist", async () => {
		// Mock successful cross-tag move to new tag
		mockMoveTasksBetweenTags.mockResolvedValue(undefined);
		mockGenerateTaskFiles.mockResolvedValue(undefined);

		const options = {
			from: "2",
			fromTag: "backlog",
			toTag: "new-tag",
		};

		await moveAction(options);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			[2],
			"backlog",
			"new-tag",
			{
				withDependencies: undefined,
				ignoreDependencies: undefined,
			},
		);
	});

	it("should fail to move a subtask directly", async () => {
		// Mock subtask movement error
		mockMoveTasksBetweenTags.mockRejectedValue(
			new Error(
				"Cannot move subtasks directly between tags. Please promote the subtask to a full task first.",
			),
		);

		const options = {
			from: "1.2",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options)).rejects.toThrow(
			"Cannot move subtasks directly between tags. Please promote the subtask to a full task first.",
		);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalled();
		expect(errorMessages.some((msg) => msg.includes("subtasks directly"))).toBe(
			true,
		);

		restore();
	});

	it("should provide helpful error messages for dependency conflicts", async () => {
		// Mock dependency conflict with detailed error
		mockMoveTasksBetweenTags.mockRejectedValue(
			new Error(
				"Cross-tag dependency conflicts detected. Task 1 depends on Task 2 which is in a different tag.",
			),
		);

		const options = {
			from: "1",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options)).rejects.toThrow(
			"Cross-tag dependency conflicts detected. Task 1 depends on Task 2 which is in a different tag.",
		);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalled();
		expect(
			errorMessages.some((msg) =>
				msg.includes("Cross-tag dependency conflicts detected"),
			),
		).toBe(true);

		restore();
	});

	it("should print advisory tips when result.tips are returned (ignore-dependencies)", async () => {
		const { errorMessages, logMessages, restore } = captureConsoleAndExit();
		try {
			// Arrange: mock move to return tips
			mockMoveTasksBetweenTags.mockResolvedValue({
				message: "ok",
				tips: [
					'Run "task-master validate-dependencies" to check for dependency issues.',
					'Run "task-master fix-dependencies" to automatically repair dangling dependencies.',
				],
			});

			await moveAction({
				from: "2",
				fromTag: "backlog",
				toTag: "in-progress",
				ignoreDependencies: true,
			});

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
			// Arrange: mock move to throw collision
			const err = new Error(
				'Task 1 already exists in target tag "in-progress"',
			);
			mockMoveTasksBetweenTags.mockRejectedValue(err);

			await expect(
				moveAction({ from: "1", fromTag: "backlog", toTag: "in-progress" }),
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

		await expect(moveAction(options)).rejects.toThrow(
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
		// Mock successful move with current tag fallback
		mockMoveTasksBetweenTags.mockResolvedValue({
			message: "Successfully moved task(s) between tags",
		});

		// Mock getCurrentTag to return 'main'
		utilsModule.getCurrentTag.mockReturnValue("main");

		// Simulate command: task-master move --from=1 --to-tag=in-progress
		// (no --from-tag provided, should use current tag 'main')
		await moveAction({
			from: "1",
			toTag: "in-progress",
			withDependencies: false,
			ignoreDependencies: false,
			// fromTag is intentionally not provided to test fallback
		});

		// Verify that moveTasksBetweenTags was called with 'main' as source tag
		expect(mockMoveTasksBetweenTags).toHaveBeenCalledWith(
			expect.stringContaining(".taskmaster/tasks/tasks.json"),
			[1], // parseInt converts string to number
			"main", // Should use current tag as fallback
			"in-progress",
			{
				withDependencies: false,
				ignoreDependencies: false,
			},
		);

		// Verify that generateTaskFiles was called for both tags
		expect(generateTaskFilesModule.default).toHaveBeenCalledWith(
			expect.stringContaining(".taskmaster/tasks/tasks.json"),
			expect.stringContaining(".taskmaster/tasks"),
			{ tag: "main" },
		);
		expect(generateTaskFilesModule.default).toHaveBeenCalledWith(
			expect.stringContaining(".taskmaster/tasks/tasks.json"),
			expect.stringContaining(".taskmaster/tasks"),
			{ tag: "in-progress" },
		);
	});

	it("should move multiple tasks with comma-separated IDs successfully", async () => {
		// Mock successful cross-tag move for multiple tasks
		mockMoveTasksBetweenTags.mockResolvedValue(undefined);
		mockGenerateTaskFiles.mockResolvedValue(undefined);

		const options = {
			from: "1,2,3",
			fromTag: "backlog",
			toTag: "in-progress",
		};

		await moveAction(options);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			[1, 2, 3], // Should parse comma-separated string to array of integers
			"backlog",
			"in-progress",
			{
				withDependencies: undefined,
				ignoreDependencies: undefined,
			},
		);

		// Verify task files are generated for both tags
		expect(mockGenerateTaskFiles).toHaveBeenCalledTimes(2);
		expect(mockGenerateTaskFiles).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			expect.stringContaining(".taskmaster/tasks"),
			{ tag: "backlog" },
		);
		expect(mockGenerateTaskFiles).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			expect.stringContaining(".taskmaster/tasks"),
			{ tag: "in-progress" },
		);
	});

	// Note: --force flag is no longer supported for cross-tag moves

	it("should fail when invalid task ID is provided", async () => {
		const options = {
			from: "1,abc,3", // Invalid ID in middle
			fromTag: "backlog",
			toTag: "in-progress",
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options)).rejects.toThrow(
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

		await expect(moveAction(options)).rejects.toThrow(
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

		await expect(moveAction(options)).rejects.toThrow(
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

		await expect(moveAction(options)).rejects.toThrow(
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
		// Mock successful cross-tag move with whitespace
		mockMoveTasksBetweenTags.mockResolvedValue(undefined);
		mockGenerateTaskFiles.mockResolvedValue(undefined);

		const options = {
			from: " 1 , 2 , 3 ", // Whitespace around IDs and commas
			fromTag: "backlog",
			toTag: "in-progress",
		};

		await moveAction(options);

		expect(mockMoveTasksBetweenTags).toHaveBeenCalledWith(
			expect.stringContaining("tasks.json"),
			[1, 2, 3], // Should trim whitespace and parse as integers
			"backlog",
			"in-progress",
			{
				withDependencies: undefined,
				ignoreDependencies: undefined,
				force: undefined,
			},
		);
	});

	it("should fail when --from parameter is missing for cross-tag move", async () => {
		const options = {
			fromTag: "backlog",
			toTag: "in-progress",
			// from is intentionally missing
		};

		const { errorMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options)).rejects.toThrow(
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

		await expect(moveAction(options)).rejects.toThrow(
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
		// Mock successful within-tag move
		mockMoveTask.mockResolvedValue(undefined);

		const options = {
			from: "1",
			to: "2",
			// No tags specified, should use within-tag logic
		};

		await moveAction(options);

		expect(mockMoveTask).toHaveBeenCalledWith("1", "2");
		expect(mockMoveTasksBetweenTags).not.toHaveBeenCalled();
	});

	it("should handle within-tag move when both tags are the same", async () => {
		// Mock successful within-tag move
		mockMoveTask.mockResolvedValue(undefined);

		const options = {
			from: "1",
			to: "2",
			fromTag: "main",
			toTag: "main", // Same tag, should use within-tag logic
		};

		await moveAction(options);

		expect(mockMoveTask).toHaveBeenCalledWith("1", "2");
		expect(mockMoveTasksBetweenTags).not.toHaveBeenCalled();
	});

	it("should fail when both tags are the same but no destination is provided", async () => {
		const options = {
			from: "1",
			fromTag: "main",
			toTag: "main", // Same tag but no destination
		};

		const { errorMessages, logMessages, restore } = captureConsoleAndExit();

		await expect(moveAction(options)).rejects.toThrow(
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
