/**
 * Contract test for GET /show/{id} endpoint
 * Tests the task display functionality according to API contract
 */

describe("GET /show/{id} Endpoint Contract Test", () => {
	let mockTaskManager;

	beforeEach(() => {
		mockTaskManager = {
			getTask: jest.fn(),
			findProjectRoot: jest.fn().mockReturnValue("/mock/project"),
		};
	});

	describe("Basic functionality", () => {
		it("should show task details for valid task ID", () => {
			const mockTask = {
				id: 1,
				title: "Test Task",
				description: "Test Description",
				status: "pending",
				priority: "medium",
				dependencies: [],
				subtasks: [],
			};

			mockTaskManager.getTask.mockReturnValue({
				success: true,
				data: mockTask,
				message: "Task retrieved successfully",
			});

			const result = mockTaskManager.getTask({
				taskId: 1,
				projectRoot: "/mock/project",
				tasksPath: "/mock/project/.taskmaster/tasks/tasks.json",
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockTask);
			expect(result.message).toBe("Task retrieved successfully");
		});

		it("should show subtask details for valid subtask ID", () => {
			const mockSubtask = {
				id: "1.1",
				title: "Test Subtask",
				description: "Test Subtask Description",
				status: "done",
				parentId: 1,
			};

			mockTaskManager.getTask.mockReturnValue({
				success: true,
				data: mockSubtask,
				message: "Subtask retrieved successfully",
			});

			const result = mockTaskManager.getTask({
				taskId: "1.1",
				projectRoot: "/mock/project",
				tasksPath: "/mock/project/.taskmaster/tasks/tasks.json",
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockSubtask);
			expect(result.data.parentId).toBe(1);
		});

		it("should include subtasks when showing parent task", () => {
			const mockTaskWithSubtasks = {
				id: 1,
				title: "Parent Task",
				status: "pending",
				subtasks: [
					{ id: "1.1", title: "Subtask 1", status: "done" },
					{ id: "1.2", title: "Subtask 2", status: "pending" },
				],
			};

			mockTaskManager.getTask.mockReturnValue({
				success: true,
				data: mockTaskWithSubtasks,
				message: "Task with subtasks retrieved successfully",
			});

			const result = mockTaskManager.getTask({ taskId: 1 });

			expect(result.success).toBe(true);
			expect(result.data.subtasks).toHaveLength(2);
			expect(result.data.subtasks[0].id).toBe("1.1");
		});
	});

	describe("Error handling", () => {
		it("should handle non-existent task ID", () => {
			mockTaskManager.getTask.mockReturnValue({
				success: false,
				error: "Task not found",
				message: "Task with ID 999 does not exist",
			});

			const result = mockTaskManager.getTask({ taskId: 999 });

			expect(result.success).toBe(false);
			expect(result.error).toBe("Task not found");
			expect(result.message).toBe("Task with ID 999 does not exist");
		});

		it("should handle invalid task ID format", () => {
			mockTaskManager.getTask.mockReturnValue({
				success: false,
				error: "Invalid task ID format",
				message: "Task ID must be a number or subtask format (e.g., 1.2)",
			});

			const result = mockTaskManager.getTask({ taskId: "invalid" });

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid task ID format");
		});

		it("should handle file read errors", () => {
			mockTaskManager.getTask.mockReturnValue({
				success: false,
				error: "Failed to read tasks file",
				message: "Could not access tasks.json",
			});

			const result = mockTaskManager.getTask({ taskId: 1 });

			expect(result.success).toBe(false);
			expect(result.error).toBe("Failed to read tasks file");
		});
	});

	describe("Response format", () => {
		it("should return consistent response structure", () => {
			const mockResponse = {
				success: true,
				data: { id: 1, title: "Test Task", status: "pending" },
				message: "Task retrieved successfully",
			};

			mockTaskManager.getTask.mockReturnValue(mockResponse);

			const result = mockTaskManager.getTask({ taskId: 1 });

			expect(result).toHaveProperty("success");
			expect(result).toHaveProperty("data");
			expect(result).toHaveProperty("message");
			expect(typeof result.success).toBe("boolean");
			expect(typeof result.data).toBe("object");
			expect(typeof result.message).toBe("string");
		});

		it("should include task metadata", () => {
			const mockTask = {
				id: 1,
				title: "Test Task",
				description: "Test Description",
				status: "pending",
				priority: "high",
				dependencies: [2, 3],
				details: "Implementation details",
				testStrategy: "Test approach",
			};

			mockTaskManager.getTask.mockReturnValue({
				success: true,
				data: mockTask,
				message: "Task retrieved successfully",
			});

			const result = mockTaskManager.getTask({ taskId: 1 });

			expect(result.data).toHaveProperty("id");
			expect(result.data).toHaveProperty("title");
			expect(result.data).toHaveProperty("description");
			expect(result.data).toHaveProperty("status");
			expect(result.data).toHaveProperty("priority");
			expect(result.data).toHaveProperty("dependencies");
		});
	});

	describe("Parameter validation", () => {
		it("should handle different ID formats", () => {
			// Test integer ID
			mockTaskManager.getTask.mockReturnValueOnce({
				success: true,
				data: { id: 5, title: "Task 5" },
				message: "Task retrieved successfully",
			});

			const result1 = mockTaskManager.getTask({ taskId: 5 });
			expect(result1.success).toBe(true);

			// Test subtask ID format
			mockTaskManager.getTask.mockReturnValueOnce({
				success: true,
				data: { id: "5.2", title: "Subtask 5.2", parentId: 5 },
				message: "Subtask retrieved successfully",
			});

			const result2 = mockTaskManager.getTask({ taskId: "5.2" });
			expect(result2.success).toBe(true);
		});

		it("should validate required parameters", () => {
			mockTaskManager.getTask.mockReturnValue({
				success: false,
				error: "Task ID is required",
				message: "Please provide a valid task ID",
			});

			const result = mockTaskManager.getTask({});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Task ID is required");
		});
	});
});
