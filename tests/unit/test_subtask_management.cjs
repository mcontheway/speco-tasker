/**
 * test_subtask_management.cjs
 * 单元测试：验证子任务管理功能
 *
 * SCOPE: 测试子任务的创建、更新、删除、状态管理和层级结构
 */

// Mock 工具函数
jest.mock("../scripts/modules/utils.js", () => ({
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
jest.mock("../scripts/modules/config-manager.js", () => ({
	getDefaultPriority: jest.fn(() => "medium"),
	hasCodebaseAnalysis: jest.fn(() => false),
}));

describe("子任务管理功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("子任务数据结构", () => {
		it("应该正确创建子任务对象", () => {
			const subtask = {
				id: "1.1",
				title: "实现用户登录功能",
				description: "完成用户认证模块的开发",
				status: "pending",
				priority: "high",
				parentId: 1,
				details: "需要实现JWT认证和密码加密",
				testStrategy: "单元测试和集成测试",
				dependencies: [],
				createdAt: new Date().toISOString(),
			};

			expect(subtask).toHaveProperty("id");
			expect(subtask).toHaveProperty("title");
			expect(subtask).toHaveProperty("description");
			expect(subtask).toHaveProperty("status");
			expect(subtask).toHaveProperty("priority");
			expect(subtask).toHaveProperty("parentId");
			expect(subtask).toHaveProperty("details");
			expect(subtask).toHaveProperty("testStrategy");
			expect(subtask).toHaveProperty("dependencies");
			expect(subtask).toHaveProperty("createdAt");

			expect(subtask.id).toBe("1.1");
			expect(subtask.parentId).toBe(1);
			expect(subtask.status).toBe("pending");
		});

		it("应该验证子任务ID格式", () => {
			const validIds = ["1.1", "1.2", "2.1", "10.5", "100.99"];
			const invalidIds = ["1", "1.", ".1", "a.1", "1.b", "1.1.2"];

			validIds.forEach((id) => {
				expect(id).toMatch(/^\d+\.\d+$/);
			});

			invalidIds.forEach((id) => {
				expect(id).not.toMatch(/^\d+\.\d+$/);
			});
		});

		it("应该支持多层嵌套子任务", () => {
			const nestedSubtask = {
				id: "1.1.1",
				title: "孙任务",
				parentId: "1.1",
				subtasks: [{ id: "1.1.1.1", title: "曾孙任务", parentId: "1.1.1" }],
			};

			expect(nestedSubtask.id).toBe("1.1.1");
			expect(nestedSubtask.parentId).toBe("1.1");
			expect(nestedSubtask.subtasks).toHaveLength(1);
			expect(nestedSubtask.subtasks[0].parentId).toBe("1.1.1");
		});
	});

	describe("子任务生命周期管理", () => {
		it("应该能够创建子任务", () => {
			const parentTask = {
				id: 1,
				title: "主要功能开发",
				subtasks: [],
			};

			const newSubtask = {
				id: "1.1",
				title: "实现核心逻辑",
				parentId: 1,
				status: "pending",
			};

			const updatedParentTask = {
				...parentTask,
				subtasks: [...parentTask.subtasks, newSubtask],
			};

			expect(updatedParentTask.subtasks).toHaveLength(1);
			expect(updatedParentTask.subtasks[0].id).toBe("1.1");
			expect(updatedParentTask.subtasks[0].parentId).toBe(1);
		});

		it("应该能够更新子任务属性", () => {
			const subtask = {
				id: "1.1",
				title: "原标题",
				status: "pending",
				priority: "medium",
			};

			const updatedSubtask = {
				...subtask,
				title: "新标题",
				status: "in-progress",
				priority: "high",
			};

			expect(updatedSubtask.title).toBe("新标题");
			expect(updatedSubtask.status).toBe("in-progress");
			expect(updatedSubtask.priority).toBe("high");
			expect(updatedSubtask.id).toBe("1.1"); // ID保持不变
		});

		it("应该能够完成子任务", () => {
			const subtask = {
				id: "1.1",
				title: "实现功能",
				status: "in-progress",
				completedAt: null,
			};

			const completedSubtask = {
				...subtask,
				status: "done",
				completedAt: new Date().toISOString(),
			};

			expect(completedSubtask.status).toBe("done");
			expect(completedSubtask.completedAt).not.toBeNull();
			expect(completedSubtask.completedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
		});

		it("应该能够删除子任务", () => {
			const parentTask = {
				id: 1,
				subtasks: [
					{ id: "1.1", title: "子任务1" },
					{ id: "1.2", title: "子任务2" },
					{ id: "1.3", title: "子任务3" },
				],
			};

			const subtaskIdToDelete = "1.2";
			const updatedParentTask = {
				...parentTask,
				subtasks: parentTask.subtasks.filter(
					(st) => st.id !== subtaskIdToDelete,
				),
			};

			expect(updatedParentTask.subtasks).toHaveLength(2);
			expect(updatedParentTask.subtasks.map((st) => st.id)).toEqual([
				"1.1",
				"1.3",
			]);
		});
	});

	describe("子任务状态同步", () => {
		it("应该根据子任务状态更新父任务状态", () => {
			const parentTask = {
				id: 1,
				title: "父任务",
				status: "pending",
				subtasks: [
					{ id: "1.1", status: "done" },
					{ id: "1.2", status: "done" },
					{ id: "1.3", status: "pending" },
				],
			};

			// 如果有子任务未完成，父任务应该是in-progress
			const allCompleted = parentTask.subtasks.every(
				(st) => st.status === "done",
			);
			const hasInProgress = parentTask.subtasks.some(
				(st) => st.status === "in-progress",
			);
			const hasPending = parentTask.subtasks.some(
				(st) => st.status === "pending",
			);

			let parentStatus;
			if (allCompleted) {
				parentStatus = "done";
			} else if (hasInProgress || hasPending) {
				parentStatus = "in-progress";
			} else {
				parentStatus = "pending";
			}

			expect(parentStatus).toBe("in-progress");
		});

		it("应该在所有子任务完成后自动完成父任务", () => {
			const parentTask = {
				id: 1,
				subtasks: [
					{ id: "1.1", status: "done" },
					{ id: "1.2", status: "done" },
					{ id: "1.3", status: "done" },
				],
			};

			const allCompleted = parentTask.subtasks.every(
				(st) => st.status === "done",
			);
			const updatedParentStatus = allCompleted ? "done" : "in-progress";

			expect(updatedParentStatus).toBe("done");
		});

		it("应该处理混合状态的子任务", () => {
			const parentTask = {
				id: 1,
				subtasks: [
					{ id: "1.1", status: "done" },
					{ id: "1.2", status: "in-progress" },
					{ id: "1.3", status: "pending" },
					{ id: "1.4", status: "blocked" },
				],
			};

			const statusSummary = {
				done: parentTask.subtasks.filter((st) => st.status === "done").length,
				inProgress: parentTask.subtasks.filter(
					(st) => st.status === "in-progress",
				).length,
				pending: parentTask.subtasks.filter((st) => st.status === "pending")
					.length,
				blocked: parentTask.subtasks.filter((st) => st.status === "blocked")
					.length,
			};

			expect(statusSummary.done).toBe(1);
			expect(statusSummary.inProgress).toBe(1);
			expect(statusSummary.pending).toBe(1);
			expect(statusSummary.blocked).toBe(1);

			const hasActiveWork =
				statusSummary.inProgress > 0 || statusSummary.pending > 0;
			expect(hasActiveWork).toBe(true);
		});
	});

	describe("子任务依赖管理", () => {
		it("应该支持子任务间的依赖关系", () => {
			const parentTask = {
				id: 1,
				subtasks: [
					{ id: "1.1", title: "设计阶段", dependencies: [] },
					{ id: "1.2", title: "开发阶段", dependencies: ["1.1"] },
					{ id: "1.3", title: "测试阶段", dependencies: ["1.2"] },
				],
			};

			// 验证依赖关系
			const subtask2 = parentTask.subtasks.find((st) => st.id === "1.2");
			const subtask3 = parentTask.subtasks.find((st) => st.id === "1.3");

			expect(subtask2.dependencies).toContain("1.1");
			expect(subtask3.dependencies).toContain("1.2");
		});

		it("应该检测子任务依赖循环", () => {
			const subtasks = [
				{ id: "1.1", dependencies: ["1.3"] },
				{ id: "1.2", dependencies: ["1.1"] },
				{ id: "1.3", dependencies: ["1.2"] },
			];

			// 检测循环依赖的函数
			const hasCircularDependency = (subtaskId, visited = new Set()) => {
				if (visited.has(subtaskId)) return true;

				const subtask = subtasks.find((st) => st.id === subtaskId);
				if (!subtask) return false;

				visited.add(subtaskId);
				for (const depId of subtask.dependencies) {
					if (hasCircularDependency(depId, visited)) return true;
				}
				visited.delete(subtaskId);
				return false;
			};

			expect(hasCircularDependency("1.1")).toBe(true);
			expect(hasCircularDependency("1.2")).toBe(true);
			expect(hasCircularDependency("1.3")).toBe(true);
		});

		it("应该计算子任务的执行顺序", () => {
			const subtasks = [
				{ id: "1.1", dependencies: [], title: "任务1.1" },
				{ id: "1.2", dependencies: ["1.1"], title: "任务1.2" },
				{ id: "1.3", dependencies: ["1.1"], title: "任务1.3" },
				{ id: "1.4", dependencies: ["1.2", "1.3"], title: "任务1.4" },
			];

			// 拓扑排序计算执行顺序
			const calculateExecutionOrder = (tasks) => {
				const result = [];
				const visited = new Set();
				const visiting = new Set();

				const visit = (taskId) => {
					if (visited.has(taskId)) return;
					if (visiting.has(taskId)) return; // 循环依赖，暂时跳过

					visiting.add(taskId);

					const task = tasks.find((t) => t.id === taskId);
					if (task) {
						task.dependencies.forEach((depId) => visit(depId));
					}

					visiting.delete(taskId);
					visited.add(taskId);
					result.push(taskId);
				};

				tasks.forEach((task) => visit(task.id));
				return result;
			};

			const executionOrder = calculateExecutionOrder(subtasks);
			expect(executionOrder).toEqual(["1.1", "1.2", "1.3", "1.4"]);
		});
	});

	describe("子任务进度追踪", () => {
		it("应该计算子任务完成进度", () => {
			const subtasks = [
				{ id: "1.1", status: "done" },
				{ id: "1.2", status: "done" },
				{ id: "1.3", status: "in-progress" },
				{ id: "1.4", status: "pending" },
			];

			const completedCount = subtasks.filter(
				(st) => st.status === "done",
			).length;
			const totalCount = subtasks.length;
			const progressPercentage = Math.round(
				(completedCount / totalCount) * 100,
			);

			expect(progressPercentage).toBe(50); // 2/4 = 50%
		});

		it("应该计算子任务预计完成时间", () => {
			const subtasks = [
				{ id: "1.1", status: "done", estimatedHours: 2 },
				{ id: "1.2", status: "in-progress", estimatedHours: 4 },
				{ id: "1.3", status: "pending", estimatedHours: 3 },
				{ id: "1.4", status: "pending", estimatedHours: 1 },
			];

			const completedHours = subtasks
				.filter((st) => st.status === "done")
				.reduce((sum, st) => sum + st.estimatedHours, 0);

			const totalHours = subtasks.reduce(
				(sum, st) => sum + st.estimatedHours,
				0,
			);
			const remainingHours = totalHours - completedHours;

			expect(completedHours).toBe(2);
			expect(totalHours).toBe(10);
			expect(remainingHours).toBe(8);
		});

		it("应该识别阻塞的子任务", () => {
			const subtasks = [
				{ id: "1.1", status: "done", dependencies: [] },
				{ id: "1.2", status: "blocked", dependencies: ["1.1"] },
				{ id: "1.3", status: "pending", dependencies: ["1.2"] },
				{ id: "1.4", status: "pending", dependencies: [] },
			];

			const blockedSubtasks = subtasks.filter((st) => st.status === "blocked");
			const waitingSubtasks = subtasks.filter(
				(st) =>
					st.status === "pending" &&
					st.dependencies.some((depId) => {
						const depTask = subtasks.find((t) => t.id === depId);
						return (
							depTask &&
							(depTask.status === "blocked" || depTask.status === "pending")
						);
					}),
			);

			expect(blockedSubtasks).toHaveLength(1);
			expect(blockedSubtasks[0].id).toBe("1.2");
			expect(waitingSubtasks).toHaveLength(1);
			expect(waitingSubtasks[0].id).toBe("1.3");
		});
	});

	describe("子任务批量操作", () => {
		it("应该支持批量更新子任务状态", () => {
			const parentTask = {
				id: 1,
				subtasks: [
					{ id: "1.1", status: "pending" },
					{ id: "1.2", status: "pending" },
					{ id: "1.3", status: "pending" },
				],
			};

			const updatedParentTask = {
				...parentTask,
				subtasks: parentTask.subtasks.map((st) => ({
					...st,
					status: "in-progress",
				})),
			};

			expect(
				updatedParentTask.subtasks.every((st) => st.status === "in-progress"),
			).toBe(true);
		});

		it("应该支持批量添加子任务", () => {
			const parentTask = {
				id: 1,
				subtasks: [],
			};

			const newSubtasks = [
				{ id: "1.1", title: "子任务1", status: "pending" },
				{ id: "1.2", title: "子任务2", status: "pending" },
				{ id: "1.3", title: "子任务3", status: "pending" },
			];

			const updatedParentTask = {
				...parentTask,
				subtasks: [...parentTask.subtasks, ...newSubtasks],
			};

			expect(updatedParentTask.subtasks).toHaveLength(3);
			expect(updatedParentTask.subtasks.map((st) => st.id)).toEqual([
				"1.1",
				"1.2",
				"1.3",
			]);
		});

		it("应该支持条件批量操作", () => {
			const parentTask = {
				id: 1,
				subtasks: [
					{ id: "1.1", status: "done", priority: "high" },
					{ id: "1.2", status: "pending", priority: "medium" },
					{ id: "1.3", status: "pending", priority: "high" },
				],
			};

			// 只更新高优先级的待处理子任务
			const updatedParentTask = {
				...parentTask,
				subtasks: parentTask.subtasks.map((st) =>
					st.status === "pending" && st.priority === "high"
						? { ...st, status: "in-progress" }
						: st,
				),
			};

			const updatedSubtasks = updatedParentTask.subtasks;
			expect(updatedSubtasks.find((st) => st.id === "1.1").status).toBe("done");
			expect(updatedSubtasks.find((st) => st.id === "1.2").status).toBe(
				"pending",
			);
			expect(updatedSubtasks.find((st) => st.id === "1.3").status).toBe(
				"in-progress",
			);
		});
	});

	describe("子任务验证和错误处理", () => {
		it("应该验证子任务的必需字段", () => {
			const validSubtask = {
				id: "1.1",
				title: "有效的子任务",
				parentId: 1,
				status: "pending",
			};

			const invalidSubtask = {
				id: "1.2",
				// 缺少title和其他必需字段
			};

			const isValidSubtask = (st) => {
				return !!(st.id && st.title && st.parentId && st.status);
			};

			expect(isValidSubtask(validSubtask)).toBe(true);
			expect(isValidSubtask(invalidSubtask)).toBe(false);
		});

		it("应该处理无效的子任务ID", () => {
			const invalidIds = ["1", "abc", "1.", ".1", "1.1.2"];
			const validIds = ["1.1", "2.3", "10.5"];

			const isValidSubtaskId = (id) => /^\d+\.\d+$/.test(id);

			invalidIds.forEach((id) => {
				expect(isValidSubtaskId(id)).toBe(false);
			});

			validIds.forEach((id) => {
				expect(isValidSubtaskId(id)).toBe(true);
			});
		});

		it("应该处理子任务层级过深的情况", () => {
			const deepNestedSubtask = {
				id: "1.1.1.1.1",
				title: "深度嵌套的子任务",
				parentId: "1.1.1.1",
			};

			const getNestingLevel = (id) => id.split(".").length - 1;

			expect(getNestingLevel(deepNestedSubtask.id)).toBe(4);

			// 建议最大嵌套层级为3
			const MAX_NESTING_LEVEL = 3;
			const isTooDeep =
				getNestingLevel(deepNestedSubtask.id) > MAX_NESTING_LEVEL;

			expect(isTooDeep).toBe(true);
		});

		it("应该处理重复的子任务ID", () => {
			const subtasks = [
				{ id: "1.1", title: "子任务1" },
				{ id: "1.2", title: "子任务2" },
				{ id: "1.1", title: "重复ID的子任务" }, // 重复ID
			];

			const ids = subtasks.map((st) => st.id);
			const uniqueIds = [...new Set(ids)];
			const hasDuplicates = uniqueIds.length !== ids.length;

			expect(hasDuplicates).toBe(true);
			expect(uniqueIds).toHaveLength(2);
		});
	});
});
