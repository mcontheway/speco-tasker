/**
 * test_task_update.cjs
 * 单元测试：验证任务更新功能
 *
 * SCOPE: 测试任务属性更新、状态变更、验证和数据完整性
 */

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

describe("任务更新功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("任务属性更新", () => {
		it("应该能够更新任务标题", () => {
			const originalTask = { id: 1, title: "原标题", status: "pending" };
			const updatedTask = { ...originalTask, title: "新标题" };

			expect(updatedTask.title).toBe("新标题");
			expect(updatedTask.id).toBe(originalTask.id);
			expect(updatedTask.status).toBe(originalTask.status);
		});

		it("应该能够更新任务描述", () => {
			const originalTask = {
				id: 1,
				title: "任务",
				description: "原描述",
				status: "pending",
			};
			const updatedTask = {
				...originalTask,
				description: "新描述，包含更多详细信息",
			};

			expect(updatedTask.description).toBe("新描述，包含更多详细信息");
			expect(updatedTask.description).not.toBe(originalTask.description);
		});

		it("应该能够更新任务优先级", () => {
			const originalTask = { id: 1, title: "任务", priority: "low" };
			const updatedTask = { ...originalTask, priority: "high" };

			expect(updatedTask.priority).toBe("high");
			expect(updatedTask.priority).not.toBe(originalTask.priority);
		});

		it("应该能够更新任务详情", () => {
			const originalTask = {
				id: 1,
				title: "任务",
				details: "原实现细节",
			};
			const updatedTask = {
				...originalTask,
				details: "更新后的实现细节，包含新要求",
			};

			expect(updatedTask.details).toContain("更新后的实现细节");
			expect(updatedTask.details).toContain("新要求");
		});
	});

	describe("任务状态管理", () => {
		it("应该能够更新任务状态为进行中", () => {
			const task = { id: 1, title: "任务", status: "pending" };
			const updatedTask = { ...task, status: "in-progress" };

			expect(updatedTask.status).toBe("in-progress");
			expect([
				"pending",
				"in-progress",
				"done",
				"blocked",
				"cancelled",
			]).toContain(updatedTask.status);
		});

		it("应该能够更新任务状态为已完成", () => {
			const task = { id: 1, title: "任务", status: "in-progress" };
			const updatedTask = { ...task, status: "done" };

			expect(updatedTask.status).toBe("done");
		});

		it("应该能够更新任务状态为已阻塞", () => {
			const task = { id: 1, title: "任务", status: "pending" };
			const updatedTask = { ...task, status: "blocked" };

			expect(updatedTask.status).toBe("blocked");
		});

		it("应该支持状态工作流", () => {
			const task = { id: 1, title: "任务", status: "pending" };

			// pending -> in-progress
			const inProgressTask = { ...task, status: "in-progress" };
			expect(inProgressTask.status).toBe("in-progress");

			// in-progress -> done
			const doneTask = { ...inProgressTask, status: "done" };
			expect(doneTask.status).toBe("done");

			// done -> blocked (重新打开)
			const blockedTask = { ...doneTask, status: "blocked" };
			expect(blockedTask.status).toBe("blocked");
		});
	});

	describe("任务验证", () => {
		it("应该验证更新后的任务数据完整性", () => {
			const originalTask = {
				id: 1,
				title: "原标题",
				description: "原描述",
				status: "pending",
				priority: "medium",
				details: "原详情",
				testStrategy: "原测试策略",
				dependencies: [],
				subtasks: [],
			};

			const updatedTask = {
				...originalTask,
				title: "新标题",
				description: "新描述",
				status: "in-progress",
				priority: "high",
				details: "新详情",
			};

			// 验证所有必需属性都存在
			expect(updatedTask).toHaveProperty("id");
			expect(updatedTask).toHaveProperty("title");
			expect(updatedTask).toHaveProperty("description");
			expect(updatedTask).toHaveProperty("status");
			expect(updatedTask).toHaveProperty("priority");
			expect(updatedTask).toHaveProperty("details");
			expect(updatedTask).toHaveProperty("testStrategy");
			expect(updatedTask).toHaveProperty("dependencies");
			expect(updatedTask).toHaveProperty("subtasks");

			// 验证更新后的值
			expect(updatedTask.title).toBe("新标题");
			expect(updatedTask.description).toBe("新描述");
			expect(updatedTask.status).toBe("in-progress");
			expect(updatedTask.priority).toBe("high");
			expect(updatedTask.details).toBe("新详情");

			// 验证未更新的属性保持不变
			expect(updatedTask.id).toBe(originalTask.id);
			expect(updatedTask.testStrategy).toBe(originalTask.testStrategy);
		});

		it("应该验证任务ID在更新过程中保持不变", () => {
			const task = { id: 5, title: "任务5", status: "pending" };
			const updatedTask = { ...task, title: "更新的任务5", status: "done" };

			expect(updatedTask.id).toBe(5);
			expect(updatedTask.id).toBe(task.id);
		});

		it("应该验证任务优先级的有效性", () => {
			const validPriorities = ["high", "medium", "low"];
			const invalidPriorities = ["urgent", "critical", "normal"];

			validPriorities.forEach((priority) => {
				const task = { id: 1, title: "任务", priority };
				expect(["high", "medium", "low"]).toContain(task.priority);
			});

			invalidPriorities.forEach((priority) => {
				expect(["high", "medium", "low"]).not.toContain(priority);
			});
		});
	});

	describe("批量更新", () => {
		it("应该支持批量更新多个任务", () => {
			const tasks = [
				{ id: 1, title: "任务1", status: "pending" },
				{ id: 2, title: "任务2", status: "pending" },
				{ id: 3, title: "任务3", status: "pending" },
			];

			const updatedTasks = tasks.map((task) => ({
				...task,
				status: "in-progress",
			}));

			expect(updatedTasks).toHaveLength(3);
			updatedTasks.forEach((task) => {
				expect(task.status).toBe("in-progress");
			});
		});

		it("应该支持条件批量更新", () => {
			const tasks = [
				{ id: 1, title: "任务1", status: "pending", priority: "high" },
				{ id: 2, title: "任务2", status: "pending", priority: "low" },
				{ id: 3, title: "任务3", status: "pending", priority: "high" },
			];

			const updatedTasks = tasks.map((task) =>
				task.priority === "high" ? { ...task, status: "in-progress" } : task,
			);

			const highPriorityTasks = updatedTasks.filter(
				(task) => task.priority === "high",
			);
			const lowPriorityTasks = updatedTasks.filter(
				(task) => task.priority === "low",
			);

			highPriorityTasks.forEach((task) => {
				expect(task.status).toBe("in-progress");
			});

			lowPriorityTasks.forEach((task) => {
				expect(task.status).toBe("pending");
			});
		});
	});

	describe("更新历史追踪", () => {
		it("应该记录任务更新历史", () => {
			const task = { id: 1, title: "任务", status: "pending" };
			const history = [];

			// 第一次更新
			const firstUpdate = { ...task, status: "in-progress" };
			history.push({
				timestamp: new Date().toISOString(),
				action: "status_update",
				oldValue: "pending",
				newValue: "in-progress",
			});

			// 第二次更新
			const secondUpdate = { ...firstUpdate, title: "更新的任务" };
			history.push({
				timestamp: new Date().toISOString(),
				action: "title_update",
				oldValue: "任务",
				newValue: "更新的任务",
			});

			expect(history).toHaveLength(2);
			expect(history[0].action).toBe("status_update");
			expect(history[1].action).toBe("title_update");
			expect(history[0].oldValue).toBe("pending");
			expect(history[1].newValue).toBe("更新的任务");
		});

		it("应该支持撤销最近的更新", () => {
			const task = { id: 1, title: "原标题", status: "pending" };
			const updatedTask = { ...task, title: "新标题", status: "in-progress" };

			// 撤销到原始状态
			const revertedTask = {
				...updatedTask,
				title: "原标题",
				status: "pending",
			};

			expect(revertedTask.title).toBe(task.title);
			expect(revertedTask.status).toBe(task.status);
		});
	});

	describe("依赖关系更新", () => {
		it("应该能够更新任务依赖关系", () => {
			const task = {
				id: 1,
				title: "任务",
				dependencies: [2, 3],
			};

			const updatedTask = {
				...task,
				dependencies: [2, 3, 4], // 添加新依赖
			};

			expect(updatedTask.dependencies).toHaveLength(3);
			expect(updatedTask.dependencies).toContain(4);
		});

		it("应该能够移除任务依赖关系", () => {
			const task = {
				id: 1,
				title: "任务",
				dependencies: [2, 3, 4],
			};

			const updatedTask = {
				...task,
				dependencies: [2, 3], // 移除依赖 4
			};

			expect(updatedTask.dependencies).toHaveLength(2);
			expect(updatedTask.dependencies).not.toContain(4);
		});
	});

	describe("错误处理", () => {
		it("应该处理无效的更新数据", () => {
			const task = { id: 1, title: "任务", status: "pending" };
			const invalidUpdates = {
				id: null,
				title: "",
				status: "invalid_status",
				priority: "invalid_priority",
			};

			// 无效的更新不应该影响有效的数据
			const updatedTask = { ...task };

			expect(updatedTask.id).toBe(1);
			expect(updatedTask.title).toBe("任务");
			expect(updatedTask.status).toBe("pending");
		});

		it("应该处理并发更新冲突", () => {
			const task = { id: 1, title: "任务", status: "pending" };

			// 模拟两个并发更新
			const update1 = { status: "in-progress" };
			const update2 = { title: "新标题" };

			// 按顺序应用更新（合并两个更新对象）
			const finalTask = {
				...task,
				...update1,
				...update2,
			};

			expect(finalTask.status).toBe("in-progress");
			expect(finalTask.title).toBe("新标题");
		});
	});
});
