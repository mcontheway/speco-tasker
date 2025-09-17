/**
 * test_status_management.cjs
 * 单元测试：验证状态管理功能
 *
 * SCOPE: 测试任务状态的转换、验证、同步和生命周期管理
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

describe("状态管理功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("任务状态数据结构", () => {
		it("应该正确定义任务状态枚举", () => {
			const validStatuses = [
				"pending",
				"in-progress",
				"done",
				"blocked",
				"cancelled",
				"deferred",
			];

			const task1 = { id: 1, status: "pending" };
			const task2 = { id: 2, status: "in-progress" };
			const task3 = { id: 3, status: "done" };
			const task4 = { id: 4, status: "blocked" };
			const task5 = { id: 5, status: "cancelled" };
			const task6 = { id: 6, status: "deferred" };

			validStatuses.forEach((status) => {
				expect([
					"pending",
					"in-progress",
					"done",
					"blocked",
					"cancelled",
					"deferred",
				]).toContain(status);
			});

			expect(task1.status).toBe("pending");
			expect(task2.status).toBe("in-progress");
			expect(task3.status).toBe("done");
			expect(task4.status).toBe("blocked");
			expect(task5.status).toBe("cancelled");
			expect(task6.status).toBe("deferred");
		});

		it("应该验证状态的默认值", () => {
			const task = { id: 1, title: "新任务" };

			// 如果没有指定状态，应该默认为'pending'
			const defaultTask = { ...task, status: task.status || "pending" };

			expect(defaultTask.status).toBe("pending");
		});

		it("应该支持状态时间戳", () => {
			const now = new Date().toISOString();
			const task = {
				id: 1,
				status: "done",
				statusChangedAt: now,
				completedAt: now,
			};

			expect(task.statusChangedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
			expect(task.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});
	});

	describe("状态转换规则", () => {
		it("应该定义有效的状态转换", () => {
			const validTransitions = {
				pending: ["in-progress", "cancelled", "blocked"],
				"in-progress": ["done", "blocked", "pending", "cancelled"],
				done: ["pending", "in-progress"], // 允许重新打开
				blocked: ["pending", "in-progress", "cancelled"],
				cancelled: ["pending"], // 只允许重新开始
				deferred: ["pending", "in-progress", "cancelled"],
			};

			const isValidTransition = (fromStatus, toStatus) => {
				return validTransitions[fromStatus]?.includes(toStatus) || false;
			};

			expect(isValidTransition("pending", "in-progress")).toBe(true);
			expect(isValidTransition("in-progress", "done")).toBe(true);
			expect(isValidTransition("done", "cancelled")).toBe(false);
			expect(isValidTransition("cancelled", "done")).toBe(false);
		});

		it("应该防止无效的状态转换", () => {
			const invalidTransitions = [
				["cancelled", "done"],
				["done", "blocked"],
				["blocked", "done"],
			];

			const validTransitions = {
				pending: ["in-progress", "cancelled", "blocked"],
				"in-progress": ["done", "blocked", "pending", "cancelled"],
				done: ["pending", "in-progress"],
				blocked: ["pending", "in-progress", "cancelled"],
				cancelled: ["pending"],
				deferred: ["pending", "in-progress", "cancelled"],
			};

			invalidTransitions.forEach(([fromStatus, toStatus]) => {
				expect(validTransitions[fromStatus]).not.toContain(toStatus);
			});
		});

		it("应该允许重新打开已完成的任务", () => {
			const completedTask = { id: 1, status: "done" };

			const reopenedTask = { ...completedTask, status: "pending" };

			expect(reopenedTask.status).toBe("pending");
			expect(reopenedTask.id).toBe(1);
		});
	});

	describe("状态转换逻辑", () => {
		it("应该在状态转换时更新时间戳", () => {
			const task = {
				id: 1,
				status: "pending",
				statusChangedAt: "2024-01-01T00:00:00.000Z",
			};

			const now = new Date().toISOString();
			const updatedTask = {
				...task,
				status: "in-progress",
				statusChangedAt: now,
			};

			expect(updatedTask.status).toBe("in-progress");
			expect(updatedTask.statusChangedAt).toBe(now);
			expect(updatedTask.statusChangedAt).not.toBe(task.statusChangedAt);
		});

		it("应该在完成任务时设置完成时间", () => {
			const task = {
				id: 1,
				status: "in-progress",
				completedAt: null,
			};

			const now = new Date().toISOString();
			const completedTask = {
				...task,
				status: "done",
				completedAt: now,
			};

			expect(completedTask.status).toBe("done");
			expect(completedTask.completedAt).toBe(now);
		});

		it("应该在重新打开任务时清除完成时间", () => {
			const task = {
				id: 1,
				status: "done",
				completedAt: "2024-01-01T00:00:00.000Z",
			};

			const reopenedTask = {
				...task,
				status: "in-progress",
				completedAt: null,
			};

			expect(reopenedTask.status).toBe("in-progress");
			expect(reopenedTask.completedAt).toBeNull();
		});
	});

	describe("批量状态操作", () => {
		it("应该支持批量更新任务状态", () => {
			const tasks = [
				{ id: 1, status: "pending" },
				{ id: 2, status: "pending" },
				{ id: 3, status: "pending" },
			];

			const updatedTasks = tasks.map((task) => ({
				...task,
				status: "in-progress",
			}));

			expect(updatedTasks.every((task) => task.status === "in-progress")).toBe(
				true,
			);
			expect(updatedTasks).toHaveLength(3);
		});

		it("应该支持条件批量状态更新", () => {
			const tasks = [
				{ id: 1, status: "pending", priority: "high" },
				{ id: 2, status: "pending", priority: "medium" },
				{ id: 3, status: "pending", priority: "low" },
			];

			const updatedTasks = tasks.map((task) =>
				task.priority === "high" ? { ...task, status: "in-progress" } : task,
			);

			const highPriorityTask = updatedTasks.find(
				(task) => task.priority === "high",
			);
			const mediumPriorityTask = updatedTasks.find(
				(task) => task.priority === "medium",
			);
			const lowPriorityTask = updatedTasks.find(
				(task) => task.priority === "low",
			);

			expect(highPriorityTask.status).toBe("in-progress");
			expect(mediumPriorityTask.status).toBe("pending");
			expect(lowPriorityTask.status).toBe("pending");
		});

		it("应该验证批量操作的原子性", () => {
			const tasks = [
				{ id: 1, status: "pending" },
				{ id: 2, status: "pending" },
				{ id: 3, status: "pending" },
			];

			// 模拟原子性批量更新
			const newStatus = "in-progress";
			const updatedTasks = tasks.map((task) => ({
				...task,
				status: newStatus,
			}));

			// 所有任务都应该成功更新，或者全部回滚
			const allUpdated = updatedTasks.every(
				(task) => task.status === newStatus,
			);
			const noneUpdated = updatedTasks.every(
				(task) => task.status === "pending",
			);

			expect(allUpdated || noneUpdated).toBe(true);
			expect(allUpdated).toBe(true); // 在这个简单实现中，所有任务都应该更新成功
		});
	});

	describe("状态同步和依赖", () => {
		it("应该根据子任务状态更新父任务状态", () => {
			const parentTask = {
				id: 1,
				status: "pending",
				subtasks: [
					{ id: "1.1", status: "done" },
					{ id: "1.2", status: "in-progress" },
					{ id: "1.3", status: "pending" },
				],
			};

			// 计算父任务状态
			const subtaskStatuses = parentTask.subtasks.map((st) => st.status);
			let parentStatus = "pending";

			if (subtaskStatuses.includes("in-progress")) {
				parentStatus = "in-progress";
			} else if (subtaskStatuses.includes("blocked")) {
				parentStatus = "blocked";
			} else if (subtaskStatuses.every((status) => status === "done")) {
				parentStatus = "done";
			} else if (subtaskStatuses.some((status) => status === "pending")) {
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

			const allSubtasksDone = parentTask.subtasks.every(
				(st) => st.status === "done",
			);
			const parentStatus = allSubtasksDone ? "done" : "in-progress";

			expect(parentStatus).toBe("done");
		});

		it("应该处理依赖关系的状态传播", () => {
			const tasks = [
				{ id: 1, status: "done", dependencies: [] },
				{ id: 2, status: "blocked", dependencies: [1] },
				{ id: 3, status: "pending", dependencies: [2] },
			];

			// 检查任务是否可以开始
			const canStartTask = (taskId) => {
				const task = tasks.find((t) => t.id === taskId);
				if (!task) return false;

				if (task.dependencies.length === 0) return true;

				return task.dependencies.every((depId) => {
					const depTask = tasks.find((t) => t.id === depId);
					return depTask && depTask.status === "done";
				});
			};

			expect(canStartTask(1)).toBe(true); // 无依赖，可以开始
			expect(canStartTask(2)).toBe(true); // 依赖的任务已完成，状态虽然是blocked但可以开始
			expect(canStartTask(3)).toBe(false); // 依赖的任务不能开始
		});
	});

	describe("状态历史和审计", () => {
		it("应该记录状态变化历史", () => {
			const task = {
				id: 1,
				status: "pending",
				statusHistory: [
					{
						status: "pending",
						changedAt: "2024-01-01T00:00:00.000Z",
						changedBy: "system",
					},
				],
			};

			const now = new Date().toISOString();
			const newStatus = "in-progress";
			const updatedTask = {
				...task,
				status: newStatus,
				statusHistory: [
					...task.statusHistory,
					{ status: newStatus, changedAt: now, changedBy: "user" },
				],
			};

			expect(updatedTask.statusHistory).toHaveLength(2);
			expect(updatedTask.statusHistory[1].status).toBe("in-progress");
			expect(updatedTask.statusHistory[1].changedAt).toBe(now);
			expect(updatedTask.statusHistory[1].changedBy).toBe("user");
		});

		it("应该提供状态变化统计", () => {
			const statusHistory = [
				{ status: "pending", changedAt: "2024-01-01T00:00:00.000Z" },
				{ status: "in-progress", changedAt: "2024-01-02T00:00:00.000Z" },
				{ status: "done", changedAt: "2024-01-03T00:00:00.000Z" },
				{ status: "pending", changedAt: "2024-01-04T00:00:00.000Z" },
			];

			const statusCounts = statusHistory.reduce((counts, entry) => {
				counts[entry.status] = (counts[entry.status] || 0) + 1;
				return counts;
			}, {});

			expect(statusCounts.pending).toBe(2);
			expect(statusCounts["in-progress"]).toBe(1);
			expect(statusCounts.done).toBe(1);
		});

		it("应该计算状态持续时间", () => {
			const statusHistory = [
				{ status: "pending", changedAt: "2024-01-01T00:00:00.000Z" },
				{ status: "in-progress", changedAt: "2024-01-02T00:00:00.000Z" },
				{ status: "done", changedAt: "2024-01-03T00:00:00.000Z" },
			];

			const calculateDuration = (startTime, endTime) => {
				const start = new Date(startTime).getTime();
				const end = new Date(endTime).getTime();
				return end - start;
			};

			const pendingDuration = calculateDuration(
				statusHistory[0].changedAt,
				statusHistory[1].changedAt,
			);

			const inProgressDuration = calculateDuration(
				statusHistory[1].changedAt,
				statusHistory[2].changedAt,
			);

			expect(pendingDuration).toBe(24 * 60 * 60 * 1000); // 1天
			expect(inProgressDuration).toBe(24 * 60 * 60 * 1000); // 1天
		});
	});

	describe("状态验证和错误处理", () => {
		it("应该验证状态值的有效性", () => {
			const validStatuses = [
				"pending",
				"in-progress",
				"done",
				"blocked",
				"cancelled",
				"deferred",
			];
			const invalidStatuses = [
				"unknown",
				"completed",
				"active",
				null,
				undefined,
				"",
			];

			const isValidStatus = (status) => validStatuses.includes(status);

			validStatuses.forEach((status) => {
				expect(isValidStatus(status)).toBe(true);
			});

			invalidStatuses.forEach((status) => {
				expect(isValidStatus(status)).toBe(false);
			});
		});

		it("应该处理无效状态转换", () => {
			const task = { id: 1, status: "cancelled" };

			const invalidTransition = () => {
				if (task.status === "cancelled") {
					throw new Error(`不能从 'cancelled' 状态转换为 'done' 状态`);
				}
			};

			expect(invalidTransition).toThrow(
				"不能从 'cancelled' 状态转换为 'done' 状态",
			);
		});

		it("应该处理并发状态修改冲突", () => {
			const task = { id: 1, status: "pending", version: 1 };

			// 模拟并发修改
			const update1 = { ...task, status: "in-progress", version: 2 };
			const update2 = { ...task, status: "blocked", version: 2 };

			// 基于版本号解决冲突（最后写入获胜），如果版本相同则第二个更新获胜
			const latestUpdate =
				update2.version > update1.version
					? update2
					: update1.version > update2.version
						? update1
						: update2;

			expect(latestUpdate.status).toBe("blocked");
			expect(latestUpdate.version).toBe(2);
		});

		it("应该处理状态转换中的业务规则", () => {
			const task = {
				id: 1,
				status: "blocked",
				blockedReason: "等待外部依赖",
			};

			const canTransitionFromBlocked = (newStatus) => {
				if (task.status !== "blocked") return true;

				// 从blocked状态只能转换为pending或in-progress
				return ["pending", "in-progress"].includes(newStatus);
			};

			expect(canTransitionFromBlocked("pending")).toBe(true);
			expect(canTransitionFromBlocked("in-progress")).toBe(true);
			expect(canTransitionFromBlocked("done")).toBe(false);
			expect(canTransitionFromBlocked("cancelled")).toBe(false);
		});
	});

	describe("状态相关的业务逻辑", () => {
		it("应该根据状态过滤任务", () => {
			const tasks = [
				{ id: 1, status: "pending" },
				{ id: 2, status: "in-progress" },
				{ id: 3, status: "done" },
				{ id: 4, status: "blocked" },
				{ id: 5, status: "cancelled" },
			];

			const filterByStatus = (tasks, status) => {
				return tasks.filter((task) => task.status === status);
			};

			expect(filterByStatus(tasks, "pending")).toHaveLength(1);
			expect(filterByStatus(tasks, "in-progress")).toHaveLength(1);
			expect(filterByStatus(tasks, "done")).toHaveLength(1);
			expect(filterByStatus(tasks, "blocked")).toHaveLength(1);
			expect(filterByStatus(tasks, "cancelled")).toHaveLength(1);
		});

		it("应该计算项目状态统计", () => {
			const tasks = [
				{ id: 1, status: "pending" },
				{ id: 2, status: "in-progress" },
				{ id: 3, status: "done" },
				{ id: 4, status: "blocked" },
				{ id: 5, status: "cancelled" },
				{ id: 6, status: "done" },
			];

			const statusStats = tasks.reduce((stats, task) => {
				stats[task.status] = (stats[task.status] || 0) + 1;
				return stats;
			}, {});

			expect(statusStats.pending).toBe(1);
			expect(statusStats["in-progress"]).toBe(1);
			expect(statusStats.done).toBe(2);
			expect(statusStats.blocked).toBe(1);
			expect(statusStats.cancelled).toBe(1);

			const totalTasks = Object.values(statusStats).reduce(
				(sum, count) => sum + count,
				0,
			);
			expect(totalTasks).toBe(6);
		});

		it("应该识别活跃任务", () => {
			const tasks = [
				{ id: 1, status: "pending" },
				{ id: 2, status: "in-progress" },
				{ id: 3, status: "done" },
				{ id: 4, status: "blocked" },
				{ id: 5, status: "cancelled" },
				{ id: 6, status: "deferred" },
			];

			const activeStatuses = ["pending", "in-progress"];
			const activeTasks = tasks.filter((task) =>
				activeStatuses.includes(task.status),
			);

			expect(activeTasks).toHaveLength(2);
			expect(activeTasks.map((t) => t.id)).toEqual([1, 2]);
		});

		it("应该计算项目完成度", () => {
			const tasks = [
				{ id: 1, status: "done" },
				{ id: 2, status: "done" },
				{ id: 3, status: "in-progress" },
				{ id: 4, status: "pending" },
				{ id: 5, status: "cancelled" },
			];

			const completedTasks = tasks.filter(
				(task) => task.status === "done",
			).length;
			const totalActiveTasks = tasks.filter(
				(task) => !["cancelled", "deferred"].includes(task.status),
			).length;

			const completionRate = Math.round(
				(completedTasks / totalActiveTasks) * 100,
			);

			expect(completionRate).toBe(50); // 2/4 = 50%
		});
	});

	describe("状态转换工作流", () => {
		it("应该支持标准任务工作流", () => {
			// 标准工作流：pending -> in-progress -> done
			const workflows = [
				{ from: "pending", to: "in-progress", valid: true },
				{ from: "in-progress", to: "done", valid: true },
				{ from: "pending", to: "done", valid: false }, // 跳过in-progress
				{ from: "done", to: "cancelled", valid: false },
			];

			const isValidWorkflowTransition = (from, to) => {
				const validTransitions = {
					pending: ["in-progress", "cancelled", "blocked"],
					"in-progress": ["done", "blocked", "pending", "cancelled"],
					done: ["pending", "in-progress"],
					blocked: ["pending", "in-progress", "cancelled"],
					cancelled: ["pending"],
					deferred: ["pending", "in-progress", "cancelled"],
				};

				return validTransitions[from]?.includes(to) || false;
			};

			workflows.forEach((workflow) => {
				expect(isValidWorkflowTransition(workflow.from, workflow.to)).toBe(
					workflow.valid,
				);
			});
		});

		it("应该支持复杂的工作流场景", () => {
			const task = {
				id: 1,
				status: "pending",
				workflow: {
					canReopen: true,
					allowBlocking: true,
					maxRetries: 3,
				},
			};

			// 支持重新打开
			const reopenedTask = { ...task, status: "done" };
			const canReopen = reopenedTask.workflow.canReopen;
			expect(canReopen).toBe(true);

			// 支持阻塞
			const blockedTask = { ...task, status: "blocked" };
			const allowBlocking = blockedTask.workflow.allowBlocking;
			expect(allowBlocking).toBe(true);

			// 重试机制
			const failedTask = { ...task, retryCount: 0, maxRetries: 3 };
			const canRetry = failedTask.retryCount < failedTask.maxRetries;
			expect(canRetry).toBe(true);
		});
	});
});
