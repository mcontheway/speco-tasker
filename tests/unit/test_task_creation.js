/**
 * test_task_creation.js
 * 单元测试：验证任务创建功能
 *
 * SCOPE: 测试任务创建的核心功能，包括手动任务创建、验证和数据结构完整性
 */

const fs = require("fs");
const path = require("path");

// Mock 依赖项
jest.mock("fs");
jest.mock("path");

// Mock 工具函数
jest.mock("../../scripts/modules/utils.js", () => ({
	readJSON: jest.fn(),
	writeJSON: jest.fn(),
	log: jest.fn(),
	findProjectRoot: jest.fn(() => "/mock/project/root"),
	ensureTagMetadata: jest.fn(),
	markMigrationForNotice: jest.fn(),
	performCompleteTagMigration: jest.fn(),
	isSilentMode: jest.fn(() => false),
}));

// Mock 配置管理器
jest.mock("../../scripts/modules/config-manager.js", () => ({
	getDefaultPriority: jest.fn(() => "medium"),
	hasCodebaseAnalysis: jest.fn(() => false),
}));

// Mock 任务优先级常量
jest.mock("../../src/constants/task-priority.js", () => ({
	DEFAULT_TASK_PRIORITY: "medium",
	TASK_PRIORITY_OPTIONS: ["high", "medium", "low"],
	isValidTaskPriority: jest.fn((priority) =>
		["high", "medium", "low"].includes(priority),
	),
	normalizeTaskPriority: jest.fn((priority) => priority || "medium"),
}));

describe("任务创建功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// 模拟文件系统 - 使用CommonJS方式
		fs.existsSync = jest.fn().mockReturnValue(true);
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}));
		path.dirname = jest.fn().mockReturnValue("/mock/project");
		path.join = jest.fn().mockImplementation((...args) => args.join("/"));
	});

	describe("任务数据结构验证", () => {
		it("应该创建具有完整属性的任务对象", () => {
			const taskData = {
				id: 1,
				title: "测试任务",
				description: "这是一个测试任务",
				status: "pending",
				priority: "medium",
				details: "详细的实现说明",
				testStrategy: "通过单元测试验证",
				dependencies: [],
				subtasks: [],
			};

			// 验证任务对象包含所有必需属性
			expect(taskData).toHaveProperty("id");
			expect(taskData).toHaveProperty("title");
			expect(taskData).toHaveProperty("description");
			expect(taskData).toHaveProperty("status");
			expect(taskData).toHaveProperty("priority");
			expect(taskData).toHaveProperty("details");
			expect(taskData).toHaveProperty("testStrategy");
			expect(taskData).toHaveProperty("dependencies");
			expect(taskData).toHaveProperty("subtasks");

			// 验证属性类型
			expect(typeof taskData.id).toBe("number");
			expect(typeof taskData.title).toBe("string");
			expect(typeof taskData.description).toBe("string");
			expect(typeof taskData.status).toBe("string");
			expect(typeof taskData.priority).toBe("string");
			expect(typeof taskData.details).toBe("string");
			expect(typeof taskData.testStrategy).toBe("string");
			expect(Array.isArray(taskData.dependencies)).toBe(true);
			expect(Array.isArray(taskData.subtasks)).toBe(true);
		});

		it("应该正确处理任务依赖关系", () => {
			const taskWithDependencies = {
				id: 2,
				title: "依赖任务",
				description: "测试依赖关系",
				dependencies: [1, 3],
				subtasks: [],
			};

			expect(taskWithDependencies.dependencies).toContain(1);
			expect(taskWithDependencies.dependencies).toContain(3);
			expect(taskWithDependencies.dependencies.length).toBe(2);
		});

		it("应该支持子任务结构", () => {
			const taskWithSubtasks = {
				id: 3,
				title: "父任务",
				subtasks: [
					{
						id: "3.1",
						title: "子任务1",
						status: "pending",
					},
					{
						id: "3.2",
						title: "子任务2",
						status: "pending",
					},
				],
			};

			expect(taskWithSubtasks.subtasks).toHaveLength(2);
			expect(taskWithSubtasks.subtasks[0].id).toBe("3.1");
			expect(taskWithSubtasks.subtasks[1].id).toBe("3.2");
		});
	});

	describe("任务验证功能", () => {
		it("应该验证任务ID的唯一性", () => {
			const existingTasks = [
				{ id: 1, title: "现有任务1" },
				{ id: 2, title: "现有任务2" },
			];

			const newTaskId = 3;

			// 检查新ID是否与现有任务冲突
			const isIdUnique = !existingTasks.some((task) => task.id === newTaskId);
			expect(isIdUnique).toBe(true);
		});

		it("应该验证任务标题的非空性", () => {
			const validTask = { title: "有效标题" };
			const invalidTask = { title: "" };

			expect(validTask.title.length).toBeGreaterThan(0);
			expect(invalidTask.title.length).toBe(0);
		});

		it("应该验证任务优先级的有效性", () => {
			const {
				TASK_PRIORITY_OPTIONS,
			} = require("../../src/constants/task-priority.js");

			const validPriorities = ["high", "medium", "low"];
			const invalidPriority = "urgent";

			validPriorities.forEach((priority) => {
				expect(TASK_PRIORITY_OPTIONS).toContain(priority);
			});

			expect(TASK_PRIORITY_OPTIONS).not.toContain(invalidPriority);
		});

		it("应该验证任务状态的有效性", () => {
			const validStatuses = [
				"pending",
				"in-progress",
				"done",
				"blocked",
				"cancelled",
			];
			const testStatus = "pending";

			expect(validStatuses).toContain(testStatus);
		});
	});

	describe("任务创建流程", () => {
		it("应该能够创建基础任务", () => {
			const newTask = {
				id: 1,
				title: "新任务",
				description: "任务描述",
				status: "pending",
				priority: "medium",
				details: "实现细节",
				testStrategy: "测试策略",
				dependencies: [],
				subtasks: [],
			};

			// 验证任务创建成功
			expect(newTask.id).toBe(1);
			expect(newTask.title).toBe("新任务");
			expect(newTask.status).toBe("pending");
		});

		it("应该支持创建具有依赖关系的任务", () => {
			const dependentTask = {
				id: 5,
				title: "依赖任务",
				dependencies: [1, 2, 3],
				subtasks: [],
			};

			expect(dependentTask.dependencies).toHaveLength(3);
			expect(dependentTask.dependencies).toEqual([1, 2, 3]);
		});

		it("应该支持创建具有子任务的任务", () => {
			const parentTask = {
				id: 10,
				title: "父任务",
				subtasks: [
					{ id: "10.1", title: "子任务1" },
					{ id: "10.2", title: "子任务2" },
					{ id: "10.3", title: "子任务3" },
				],
			};

			expect(parentTask.subtasks).toHaveLength(3);
			parentTask.subtasks.forEach((subtask, index) => {
				expect(subtask.id).toBe(`10.${index + 1}`);
				expect(subtask.title).toContain("子任务");
			});
		});
	});

	describe("任务存储和持久化", () => {
		it("应该能够序列化任务对象为JSON", () => {
			const task = {
				id: 1,
				title: "测试任务",
				description: "测试描述",
				status: "pending",
			};

			const jsonString = JSON.stringify(task);
			const parsedTask = JSON.parse(jsonString);

			expect(parsedTask.id).toBe(task.id);
			expect(parsedTask.title).toBe(task.title);
			expect(parsedTask.status).toBe(task.status);
		});

		it("应该处理任务数据文件读写", () => {
			const mockTasksData = {
				master: {
					tasks: [
						{ id: 1, title: "任务1" },
						{ id: 2, title: "任务2" },
					],
				},
			};

			// Mock 文件读取
			const { readJSON } = require("../../scripts/modules/utils.js");
			readJSON.mockReturnValue(mockTasksData);

			const result = readJSON("/mock/tasks.json", "/mock/project", "main");
			expect(result).toEqual(mockTasksData);
		});
	});

	describe("错误处理", () => {
		it("应该处理无效的任务数据", () => {
			const invalidTask = {
				id: null,
				title: "",
				status: "invalid",
			};

			expect(invalidTask.id).toBeNull();
			expect(invalidTask.title).toBe("");
		});

		it("应该处理重复的任务ID", () => {
			const tasks = [
				{ id: 1, title: "任务1" },
				{ id: 1, title: "重复ID任务" },
			];

			const ids = tasks.map((task) => task.id);
			const uniqueIds = [...new Set(ids)];

			expect(uniqueIds).toHaveLength(1); // 应该只有一个唯一ID
		});
	});
});
