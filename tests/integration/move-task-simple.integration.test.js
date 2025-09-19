import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mockFs from "mock-fs";

// Import the actual move task functionality
import { moveTasksBetweenTags } from "../../scripts/modules/task-manager/move-task.js";
import { readJSON, writeJSON } from "../../scripts/modules/utils.js";

// Mock console to avoid conflicts with mock-fs
const originalConsole = { ...console };
beforeAll(() => {
	global.console = {
		...console,
		log: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
	};
});

afterAll(() => {
	global.console = originalConsole;
});

// Get __dirname equivalent for ES modules
let __filename;
let __dirname;
try {
	__filename = fileURLToPath(import.meta.url);
	__dirname = path.dirname(__filename);
} catch (error) {
	// Fallback for CommonJS environments
	__filename = __filename || "unknown";
	__dirname = path.dirname(__filename);
}

describe("Cross-Tag Task Movement Simple Integration Tests", () => {
	const testDataDir = path.join(__dirname, "fixtures");
	const testTasksPath = path.join(testDataDir, "tasks.json");

	// Test data structure with proper tagged format
	const testData = {
		backlog: {
			tasks: [
				{ id: 1, title: "Task 1", dependencies: [], status: "pending" },
				{ id: 2, title: "Task 2", dependencies: [], status: "pending" },
			],
		},
		"in-progress": {
			tasks: [
				{ id: 3, title: "Task 3", dependencies: [], status: "in-progress" },
			],
		},
	};

	beforeEach(() => {
		// Set up mock file system with test data
		mockFs({
			[testDataDir]: {
				"tasks.json": JSON.stringify(testData, null, 2),
			},
		});
	});

	afterEach(() => {
		// Clean up mock file system
		mockFs.restore();
	});

	it("should move tasks between tags using moveTasksBetweenTags function", async () => {
		// Test moving Task 1 from backlog to in-progress tag
		const result = await moveTasksBetweenTags(
			testTasksPath,
			["1"], // Task IDs to move (as strings)
			"backlog", // Source tag
			"in-progress", // Target tag
			{ withDependencies: false, ignoreDependencies: false },
			{ projectRoot: testDataDir },
		);

		// Verify the cross-tag move operation was successful
		expect(result).toBeDefined();
		expect(result.message).toContain(
			'Successfully moved 1 tasks from "backlog" to "in-progress"',
		);
		expect(result.movedTasks).toHaveLength(1);
		expect(result.movedTasks[0].id).toBe("1");
		expect(result.movedTasks[0].fromTag).toBe("backlog");
		expect(result.movedTasks[0].toTag).toBe("in-progress");

		// Read the updated data to verify the move actually happened
		const updatedData = readJSON(testTasksPath, null, "backlog");
		// readJSON returns resolved data, so we need to access the raw tagged data
		const rawData = updatedData._rawTaggedData || updatedData;
		const backlogTasks = rawData.backlog?.tasks || [];
		const inProgressTasks = rawData["in-progress"]?.tasks || [];

		// Verify Task 1 is no longer in backlog
		const taskInBacklog = backlogTasks.find((t) => t.id === 1);
		expect(taskInBacklog).toBeUndefined();

		// Verify Task 1 is now in in-progress
		const taskInProgress = inProgressTasks.find((t) => t.id === 1);
		expect(taskInProgress).toBeDefined();
		expect(taskInProgress.title).toBe("Task 1");
		expect(taskInProgress.status).toBe("pending");
	});
});
