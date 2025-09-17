/**
 * Tests for the addSubtask function
 */
import { jest } from "@jest/globals";

// Mock dependencies before importing the module
const mockUtils = {
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	getCurrentTag: jest.fn(),
};
const mockTaskManager = {
	isTaskDependentOn: jest.fn(),
};
const mockGenerateTaskFiles = jest.fn();

jest.unstable_mockModule(
	"../../../../../scripts/modules/utils.js",
	() => mockUtils,
);
jest.unstable_mockModule(
	"../../../../../scripts/modules/task-manager.js",
	() => mockTaskManager,
);
jest.unstable_mockModule(
	"../../../../../scripts/modules/task-manager/generate-task-files.js",
	() => ({
		default: mockGenerateTaskFiles,
	}),
);

const addSubtask = (
	await import("../../../../../scripts/modules/task-manager/add-subtask.js")
).default;

describe("addSubtask function", () => {
	const multiTagData = {
		master: {
			tasks: [{ id: 1, title: "Master Task", subtasks: [] }],
			metadata: { description: "Master tasks" },
		},
		"feature-branch": {
			tasks: [{ id: 1, title: "Feature Task", subtasks: [] }],
			metadata: { description: "Feature tasks" },
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockTaskManager.isTaskDependentOn.mockReturnValue(false);
	});

	test("should add a new subtask and preserve other tags", async () => {
		const context = { projectRoot: "/fake/root", tag: "feature-branch" };
		const newSubtaskData = {
			title: "My New Subtask",
			description: "A new subtask description",
			details: "Implementation details for the subtask",
			priority: "medium",
			testStrategy: "Unit testing",
		};
		mockUtils.readJSON.mockReturnValueOnce({
			tasks: [{ id: 1, title: "Feature Task", subtasks: [] }],
			metadata: { description: "Feature tasks" },
		});

		await addSubtask("tasks.json", "1", null, newSubtaskData, true, context);

		expect(mockUtils.writeJSON).toHaveBeenCalledWith(
			"tasks.json",
			expect.any(Object),
			"/fake/root",
			"feature-branch",
		);
		const writtenData = mockUtils.writeJSON.mock.calls[0][1];
		const parentTask = writtenData.tasks.find((t) => t.id === 1);
		expect(parentTask.subtasks).toHaveLength(1);
		expect(parentTask.subtasks[0].title).toBe("My New Subtask");
	});

	test("should add a new subtask to a parent task", async () => {
		mockUtils.readJSON.mockReturnValueOnce({
			tasks: [{ id: 1, title: "Parent Task", subtasks: [] }],
		});
		const context = {};
		const newSubtask = await addSubtask(
			"tasks.json",
			"1",
			null,
			{
				title: "New Subtask",
				description: "Description for new subtask",
				details: "Details for new subtask",
				priority: "low",
				testStrategy: "Testing strategy",
			},
			true,
			context,
		);
		expect(newSubtask).toBeDefined();
		expect(newSubtask.id).toBe(1);
		expect(newSubtask.parentTaskId).toBe(1);
		expect(mockUtils.writeJSON).toHaveBeenCalled();
		const writeCallArgs = mockUtils.writeJSON.mock.calls[0][1]; // data is the second arg now
		const parentTask = writeCallArgs.tasks.find((t) => t.id === 1);
		expect(parentTask.subtasks).toHaveLength(1);
		expect(parentTask.subtasks[0].title).toBe("New Subtask");
		expect(mockGenerateTaskFiles).toHaveBeenCalled();
	});

	test("should convert an existing task to a subtask", async () => {
		mockUtils.readJSON.mockReturnValueOnce({
			tasks: [
				{ id: 1, title: "Parent Task", subtasks: [] },
				{ id: 2, title: "Existing Task 2", subtasks: [] },
			],
		});
		const context = {};
		const convertedSubtask = await addSubtask(
			"tasks.json",
			"1",
			"2",
			null,
			true,
			context,
		);
		expect(convertedSubtask.id).toBe(1);
		expect(convertedSubtask.parentTaskId).toBe(1);
		expect(convertedSubtask.title).toBe("Existing Task 2");
		expect(mockUtils.writeJSON).toHaveBeenCalled();
		const writeCallArgs = mockUtils.writeJSON.mock.calls[0][1];
		const parentTask = writeCallArgs.tasks.find((t) => t.id === 1);
		expect(parentTask.subtasks).toHaveLength(1);
		expect(parentTask.subtasks[0].title).toBe("Existing Task 2");
	});

	test("should throw an error if parent task does not exist", async () => {
		mockUtils.readJSON.mockReturnValueOnce({
			tasks: [{ id: 1, title: "Task 1", subtasks: [] }],
		});
		const context = {};
		await expect(
			addSubtask(
				"tasks.json",
				"99",
				null,
				{ title: "New Subtask" },
				true,
				context,
			),
		).rejects.toThrow("Parent task with ID 99 not found");
	});

	test("should throw an error if trying to convert a non-existent task", async () => {
		mockUtils.readJSON.mockReturnValueOnce({
			tasks: [{ id: 1, title: "Parent Task", subtasks: [] }],
		});
		const context = {};
		await expect(
			addSubtask("tasks.json", "1", "99", null, true, context),
		).rejects.toThrow("Task with ID 99 not found");
	});

	test("should throw an error for circular dependency", async () => {
		mockUtils.readJSON.mockReturnValueOnce({
			tasks: [
				{ id: 1, title: "Parent Task", subtasks: [] },
				{ id: 2, title: "Child Task", subtasks: [] },
			],
		});
		mockTaskManager.isTaskDependentOn.mockImplementation(
			(tasks, parentTask, existingTaskIdNum) => {
				return parentTask.id === 1 && existingTaskIdNum === 2;
			},
		);
		const context = {};
		await expect(
			addSubtask("tasks.json", "1", "2", null, true, context),
		).rejects.toThrow(
			"Cannot create circular dependency: task 1 is already a subtask or dependent of task 2",
		);
	});

	describe("Subtask field handling", () => {
		test("should inherit priority and testStrategy from parent task, but not spec_files", async () => {
			// Arrange
			const parentTask = {
				id: 1,
				title: "Parent Task",
				description: "Parent description",
				priority: "high",
				testStrategy: "Unit tests and integration tests",
				spec_files: [
					{ type: "spec", title: "Requirements", file: "docs/requirements.md" },
					{
						type: "design",
						title: "Architecture",
						file: "docs/architecture.md",
					},
				],
				subtasks: [],
			};
			const mockData = {
				master: {
					tasks: [parentTask],
					metadata: { description: "Master tasks" },
				},
			};
			// Mock readJSON to return the tag data directly (simplified for testing)
			mockUtils.readJSON.mockReturnValue({
				tasks: mockData.master.tasks,
				metadata: mockData.master.metadata,
				tag: "master",
			});

			const newSubtaskData = {
				title: "New Subtask",
				description: "Subtask description",
				details: "Implementation details",
				status: "pending",
				// Note: no priority, testStrategy, or spec_files provided
			};

			const context = { projectRoot: "/fake/root", tag: "master" };

			// Mock getCurrentTag to return the tag we're testing
			mockUtils.getCurrentTag.mockReturnValue("master");

			// Act
			const result = await addSubtask(
				"tasks.json",
				"1",
				null,
				newSubtaskData,
				false,
				context,
			);

			// Verify the subtask was added to parent by checking writeJSON was called
			expect(mockUtils.writeJSON).toHaveBeenCalledWith(
				"tasks.json",
				expect.any(Object),
				"/fake/root",
				"master",
			);

			// Assert
			expect(result).toBeDefined();
			expect(result.id).toBe(1); // First subtask
			expect(result.priority).toBe("high"); // Inherited from parent
			expect(result.testStrategy).toBe("Unit tests and integration tests"); // Inherited
			expect(result.spec_files).toEqual([]); // NOT inherited - empty array for subtasks

			// Verify writeJSON was called (subtask was saved)
			expect(mockUtils.writeJSON).toHaveBeenCalled();
		});

		test("should use explicitly provided fields and empty spec_files when not provided", async () => {
			// Arrange
			const parentTask = {
				id: 2,
				title: "Parent Task",
				description: "Parent description",
				priority: "medium",
				testStrategy: "Basic unit tests",
				spec_files: [
					{ type: "spec", title: "Parent Spec", file: "docs/parent.md" },
				],
				subtasks: [],
			};
			const mockData = {
				master: {
					tasks: [parentTask],
					metadata: { description: "Master tasks" },
				},
			};
			// Mock readJSON to return the tag data directly (simplified for testing)
			mockUtils.readJSON.mockReturnValue({
				tasks: mockData.master.tasks,
				metadata: mockData.master.metadata,
				tag: "master",
			});

			const newSubtaskData = {
				title: "Custom Subtask",
				description: "Custom description",
				details: "Custom implementation",
				priority: "high", // Override parent's medium priority
				testStrategy: "Comprehensive testing with mocks", // Override parent's strategy
				// spec_files not provided - should be empty array
			};

			const context = { projectRoot: "/fake/root", tag: "master" };
			mockUtils.getCurrentTag.mockReturnValue("master");

			// Act
			const result = await addSubtask(
				"tasks.json",
				"2",
				null,
				newSubtaskData,
				false,
				context,
			);

			// Assert
			expect(result.priority).toBe("high"); // Explicit override
			expect(result.testStrategy).toBe("Comprehensive testing with mocks"); // Explicit override
			expect(result.spec_files).toEqual([]); // NOT inherited - empty array when not provided

			// Verify the subtask was added to parent
			const writtenData = mockUtils.writeJSON.mock.calls[0][1];
			const writtenParentTask = writtenData.tasks.find((t) => t.id === 2);
			expect(writtenParentTask.subtasks).toHaveLength(1);
			expect(writtenParentTask.subtasks[0]).toMatchObject({
				id: 1,
				priority: "high",
				testStrategy: "Comprehensive testing with mocks",
				spec_files: [],
			});
		});

		test("should handle explicit field overrides while keeping spec_files independent", async () => {
			// Arrange
			const parentTask = {
				id: 3,
				title: "Parent Task",
				priority: "low",
				testStrategy: "Minimal testing",
				spec_files: [
					{ type: "spec", title: "Parent Spec", file: "docs/parent.md" },
				],
				subtasks: [],
			};
			const mockData = {
				master: {
					tasks: [parentTask],
					metadata: { description: "Master tasks" },
				},
			};
			// Mock readJSON to return the tag data directly (simplified for testing)
			mockUtils.readJSON.mockReturnValue({
				tasks: mockData.master.tasks,
				metadata: mockData.master.metadata,
				tag: "master",
			});

			const newSubtaskData = {
				title: "Partial Override Subtask",
				description: "Description provided",
				details: "Details provided",
				priority: "high", // Override priority
				testStrategy: "Enhanced testing", // Override testStrategy
				// spec_files not provided - should be empty array (not inherited)
			};

			const context = { projectRoot: "/fake/root", tag: "master" };
			mockUtils.getCurrentTag.mockReturnValue("master");

			// Act
			const result = await addSubtask(
				"tasks.json",
				"3",
				null,
				newSubtaskData,
				false,
				context,
			);

			// Assert
			expect(result.priority).toBe("high"); // Explicitly provided override
			expect(result.testStrategy).toBe("Enhanced testing"); // Explicitly provided override
			expect(result.spec_files).toEqual([]); // NOT inherited - empty array for subtasks

			// Verify the subtask was added to parent
			const writtenData = mockUtils.writeJSON.mock.calls[0][1];
			const writtenParentTask = writtenData.tasks.find((t) => t.id === 3);
			expect(writtenParentTask.subtasks).toHaveLength(1);
			expect(writtenParentTask.subtasks[0]).toMatchObject({
				id: 1,
				priority: "high",
				testStrategy: "Enhanced testing",
				spec_files: [],
			});
		});
	});
});
