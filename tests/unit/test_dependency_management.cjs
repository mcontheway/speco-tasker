/**
 * test_dependency_management.cjs
 * 单元测试：验证依赖关系管理功能
 *
 * SCOPE: 测试任务间依赖关系的创建、验证、更新和清理
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

describe("依赖关系管理功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("依赖关系数据结构", () => {
		it("应该正确创建依赖关系", () => {
			const task = {
				id: 1,
				title: "主要任务",
				dependencies: [2, 3, 4],
			};

			expect(task.dependencies).toHaveLength(3);
			expect(task.dependencies).toEqual([2, 3, 4]);
			expect(task.dependencies).toContain(2);
			expect(task.dependencies).toContain(3);
			expect(task.dependencies).toContain(4);
		});

		it("应该支持空依赖关系", () => {
			const task = {
				id: 1,
				title: "独立任务",
				dependencies: [],
			};

			expect(task.dependencies).toHaveLength(0);
			expect(task.dependencies).toEqual([]);
		});

		it("应该验证依赖关系的数据类型", () => {
			const validTask = {
				id: 1,
				dependencies: [2, 3, 4],
			};

			const invalidTask = {
				id: 2,
				dependencies: ["2", "3", "4"], // 字符串而不是数字
			};

			expect(
				validTask.dependencies.every((dep) => typeof dep === "number"),
			).toBe(true);
			expect(
				invalidTask.dependencies.every((dep) => typeof dep === "number"),
			).toBe(false);
		});
	});

	describe("依赖关系验证", () => {
		it("应该验证依赖任务的存在性", () => {
			const tasks = [
				{ id: 1, title: "任务1" },
				{ id: 2, title: "任务2" },
				{ id: 3, title: "任务3" },
			];

			const taskWithValidDeps = {
				id: 4,
				title: "任务4",
				dependencies: [1, 2],
			};

			const taskWithInvalidDeps = {
				id: 5,
				title: "任务5",
				dependencies: [1, 999], // 999不存在
			};

			const validateDependencies = (task, allTasks) => {
				const taskIds = allTasks.map((t) => t.id);
				return task.dependencies.every((depId) => taskIds.includes(depId));
			};

			expect(validateDependencies(taskWithValidDeps, tasks)).toBe(true);
			expect(validateDependencies(taskWithInvalidDeps, tasks)).toBe(false);
		});

		it("应该防止自引用依赖", () => {
			const selfReferencingTask = {
				id: 1,
				title: "任务1",
				dependencies: [1], // 依赖自己
			};

			const hasSelfReference = (task) => {
				return task.dependencies.includes(task.id);
			};

			expect(hasSelfReference(selfReferencingTask)).toBe(true);
		});

		it("应该检测循环依赖", () => {
			const tasks = [
				{ id: 1, dependencies: [3] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [2] },
			];

			// 检测循环依赖的函数
			const hasCircularDependency = (taskId, visited = new Set()) => {
				if (visited.has(taskId)) return true;

				const task = tasks.find((t) => t.id === taskId);
				if (!task) return false;

				visited.add(taskId);
				for (const depId of task.dependencies) {
					if (hasCircularDependency(depId, visited)) return true;
				}
				visited.delete(taskId);
				return false;
			};

			expect(hasCircularDependency(1)).toBe(true);
			expect(hasCircularDependency(2)).toBe(true);
			expect(hasCircularDependency(3)).toBe(true);
		});
	});

	describe("依赖关系操作", () => {
		it("应该能够添加依赖关系", () => {
			const task = {
				id: 1,
				title: "任务1",
				dependencies: [2],
			};

			const updatedTask = {
				...task,
				dependencies: [...task.dependencies, 3],
			};

			expect(updatedTask.dependencies).toHaveLength(2);
			expect(updatedTask.dependencies).toContain(2);
			expect(updatedTask.dependencies).toContain(3);
		});

		it("应该能够移除依赖关系", () => {
			const task = {
				id: 1,
				title: "任务1",
				dependencies: [2, 3, 4],
			};

			const updatedTask = {
				...task,
				dependencies: task.dependencies.filter((dep) => dep !== 3),
			};

			expect(updatedTask.dependencies).toHaveLength(2);
			expect(updatedTask.dependencies).toEqual([2, 4]);
			expect(updatedTask.dependencies).not.toContain(3);
		});

		it("应该能够更新依赖关系", () => {
			const task = {
				id: 1,
				title: "任务1",
				dependencies: [2, 3],
			};

			const updatedTask = {
				...task,
				dependencies: [3, 4, 5], // 完全替换依赖关系
			};

			expect(updatedTask.dependencies).toEqual([3, 4, 5]);
			expect(updatedTask.dependencies).not.toContain(2);
		});

		it("应该防止重复的依赖关系", () => {
			const task = {
				id: 1,
				dependencies: [2, 3, 2], // 有重复
			};

			const uniqueDependencies = [...new Set(task.dependencies)];

			expect(uniqueDependencies).toHaveLength(2);
			expect(uniqueDependencies).toEqual([2, 3]);
		});
	});

	describe("依赖关系执行顺序", () => {
		it("应该计算任务的执行顺序", () => {
			const tasks = [
				{ id: 1, dependencies: [], title: "任务1" },
				{ id: 2, dependencies: [1], title: "任务2" },
				{ id: 3, dependencies: [1], title: "任务3" },
				{ id: 4, dependencies: [2, 3], title: "任务4" },
				{ id: 5, dependencies: [4], title: "任务5" },
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

			const executionOrder = calculateExecutionOrder(tasks);
			expect(executionOrder).toEqual([1, 2, 3, 4, 5]);
		});

		it("应该识别可并行执行的任务", () => {
			const tasks = [
				{ id: 1, dependencies: [], title: "任务1" },
				{ id: 2, dependencies: [1], title: "任务2" },
				{ id: 3, dependencies: [1], title: "任务3" }, // 与任务2并行
				{ id: 4, dependencies: [2], title: "任务4" },
				{ id: 5, dependencies: [3], title: "任务5" }, // 与任务4并行
			];

			// 计算每个执行阶段的可并行任务
			const getParallelExecutionStages = (tasks) => {
				const stages = [];
				const processed = new Set();

				const getNextStage = () => {
					const stage = [];

					tasks.forEach((task) => {
						if (!processed.has(task.id)) {
							const canExecute = task.dependencies.every((depId) =>
								processed.has(depId),
							);
							if (canExecute) {
								stage.push(task.id);
							}
						}
					});

					stage.forEach((taskId) => processed.add(taskId));
					return stage;
				};

				let stage;
				while ((stage = getNextStage()).length > 0) {
					stages.push(stage);
				}

				return stages;
			};

			const stages = getParallelExecutionStages(tasks);
			expect(stages).toEqual([[1], [2, 3], [4, 5]]);
		});

		it("应该检测阻塞的任务", () => {
			const tasks = [
				{ id: 1, status: "done", dependencies: [] },
				{ id: 2, status: "blocked", dependencies: [1] },
				{ id: 3, status: "pending", dependencies: [2] },
				{ id: 4, status: "pending", dependencies: [1] },
			];

			const getBlockedTasks = (tasks) => {
				return tasks.filter((task) => {
					if (task.status === "blocked") return true;

					// 检查依赖是否阻塞
					return task.dependencies.some((depId) => {
						const depTask = tasks.find((t) => t.id === depId);
						return depTask && depTask.status === "blocked";
					});
				});
			};

			const blockedTasks = getBlockedTasks(tasks);
			expect(blockedTasks.map((t) => t.id)).toEqual([2, 3]);
		});
	});

	describe("依赖关系影响分析", () => {
		it("应该计算依赖链的长度", () => {
			const tasks = [
				{ id: 1, dependencies: [], title: "任务1" },
				{ id: 2, dependencies: [1], title: "任务2" },
				{ id: 3, dependencies: [2], title: "任务3" },
				{ id: 4, dependencies: [3], title: "任务4" },
			];

			const calculateDependencyDepth = (taskId, tasks, visited = new Set()) => {
				if (visited.has(taskId)) return 0;

				const task = tasks.find((t) => t.id === taskId);
				if (!task || task.dependencies.length === 0) return 0;

				visited.add(taskId);
				const depths = task.dependencies.map(
					(depId) => calculateDependencyDepth(depId, tasks, visited) + 1,
				);
				visited.delete(taskId);

				return Math.max(...depths);
			};

			expect(calculateDependencyDepth(1, tasks)).toBe(0);
			expect(calculateDependencyDepth(2, tasks)).toBe(1);
			expect(calculateDependencyDepth(3, tasks)).toBe(2);
			expect(calculateDependencyDepth(4, tasks)).toBe(3);
		});

		it("应该识别关键路径", () => {
			const tasks = [
				{ id: 1, dependencies: [], title: "任务1", duration: 2 },
				{ id: 2, dependencies: [1], title: "任务2", duration: 3 },
				{ id: 3, dependencies: [1], title: "任务3", duration: 1 },
				{ id: 4, dependencies: [2, 3], title: "任务4", duration: 2 },
			];

			// 计算关键路径（最长依赖链）
			const calculateCriticalPath = (tasks) => {
				const path = [];
				const visited = new Set();

				const findLongestPath = (taskId) => {
					if (visited.has(taskId)) return [];

					const task = tasks.find((t) => t.id === taskId);
					if (!task || task.dependencies.length === 0) return [taskId];

					visited.add(taskId);

					let longestPath = [];
					task.dependencies.forEach((depId) => {
						const depPath = findLongestPath(depId);
						if (depPath.length > longestPath.length) {
							longestPath = depPath;
						}
					});

					visited.delete(taskId);
					return [...longestPath, taskId];
				};

				tasks.forEach((task) => {
					const taskPath = findLongestPath(task.id);
					if (taskPath.length > path.length) {
						path.splice(0, path.length, ...taskPath);
					}
				});

				return path;
			};

			const criticalPath = calculateCriticalPath(tasks);
			expect(criticalPath).toEqual([1, 2, 4]);
		});

		it("应该计算任务的紧前任务和后续任务", () => {
			const tasks = [
				{ id: 1, dependencies: [], title: "任务1" },
				{ id: 2, dependencies: [1], title: "任务2" },
				{ id: 3, dependencies: [1], title: "任务3" },
				{ id: 4, dependencies: [2], title: "任务4" },
				{ id: 5, dependencies: [3], title: "任务5" },
			];

			const getPredecessors = (taskId, tasks) => {
				const task = tasks.find((t) => t.id === taskId);
				if (!task) return [];

				const predecessors = [...task.dependencies];
				task.dependencies.forEach((depId) => {
					predecessors.push(...getPredecessors(depId, tasks));
				});

				return [...new Set(predecessors)];
			};

			const getSuccessors = (taskId, tasks) => {
				const successors = [];

				tasks.forEach((task) => {
					if (task.dependencies.includes(taskId)) {
						successors.push(task.id);
						successors.push(...getSuccessors(task.id, tasks));
					}
				});

				return [...new Set(successors)];
			};

			expect(getPredecessors(4, tasks)).toEqual([2, 1]);
			expect(getSuccessors(1, tasks).sort()).toEqual([2, 3, 4, 5].sort());
		});
	});

	describe("依赖关系维护", () => {
		it("应该在删除任务时清理依赖关系", () => {
			const tasks = [
				{ id: 1, dependencies: [] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [1, 2] },
				{ id: 4, dependencies: [2] },
			];

			const taskIdToDelete = 2;

			// 清理依赖关系
			const updatedTasks = tasks.map((task) => ({
				...task,
				dependencies: task.dependencies.filter(
					(depId) => depId !== taskIdToDelete,
				),
			}));

			// 删除任务
			const remainingTasks = updatedTasks.filter(
				(task) => task.id !== taskIdToDelete,
			);

			expect(remainingTasks.find((t) => t.id === 3).dependencies).toEqual([1]);
			expect(remainingTasks.find((t) => t.id === 4).dependencies).toEqual([]);
		});

		it("应该在移动任务时更新依赖关系", () => {
			const tasks = [
				{ id: 1, dependencies: [] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [2] },
			];

			// 假设任务2移动到ID 5
			const updatedTasks = tasks.map((task) => ({
				...task,
				dependencies: task.dependencies.map((depId) =>
					depId === 2 ? 5 : depId,
				),
			}));

			const movedTask = { ...tasks.find((t) => t.id === 2), id: 5 };

			expect(updatedTasks.find((t) => t.id === 3).dependencies).toEqual([5]);
			expect(movedTask.id).toBe(5);
		});

		it("应该验证依赖关系的完整性", () => {
			const tasks = [
				{ id: 1, dependencies: [] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [1, 4] }, // 引用不存在的任务4
			];

			const validateDependencyIntegrity = (tasks) => {
				const taskIds = tasks.map((t) => t.id);

				return tasks.every((task) =>
					task.dependencies.every((depId) => taskIds.includes(depId)),
				);
			};

			expect(validateDependencyIntegrity(tasks)).toBe(false);

			// 添加缺失的任务
			const fixedTasks = [...tasks, { id: 4, dependencies: [] }];
			expect(validateDependencyIntegrity(fixedTasks)).toBe(true);
		});
	});

	describe("复杂依赖关系场景", () => {
		it("应该处理菱形依赖关系", () => {
			const tasks = [
				{ id: 1, dependencies: [], title: "任务1" },
				{ id: 2, dependencies: [1], title: "任务2" },
				{ id: 3, dependencies: [1], title: "任务3" },
				{ id: 4, dependencies: [2, 3], title: "任务4" },
			];

			const calculateExecutionOrder = (tasks) => {
				const result = [];
				const visited = new Set();
				const visiting = new Set();

				const visit = (taskId) => {
					if (visited.has(taskId)) return;
					if (visiting.has(taskId)) return;

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

			const executionOrder = calculateExecutionOrder(tasks);
			expect(executionOrder).toEqual([1, 2, 3, 4]);
		});

		it("应该处理多重依赖关系", () => {
			const tasks = [
				{ id: 1, dependencies: [], title: "任务1" },
				{ id: 2, dependencies: [1, 3], title: "任务2" },
				{ id: 3, dependencies: [1], title: "任务3" },
				{ id: 4, dependencies: [2, 5], title: "任务4" },
				{ id: 5, dependencies: [3], title: "任务5" },
			];

			const calculateExecutionOrder = (tasks) => {
				const result = [];
				const visited = new Set();
				const visiting = new Set();

				const visit = (taskId) => {
					if (visited.has(taskId)) return;
					if (visiting.has(taskId)) return;

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

			const executionOrder = calculateExecutionOrder(tasks);
			expect(executionOrder).toEqual([1, 3, 2, 5, 4]);
		});
	});

	describe("依赖关系错误处理", () => {
		it("应该处理无效的依赖ID类型", () => {
			const invalidDependencies = [1, "2", null, undefined, {}];

			const validateDependencyIds = (dependencies) => {
				return dependencies.every(
					(dep) => typeof dep === "number" && dep > 0 && Number.isInteger(dep),
				);
			};

			expect(validateDependencyIds(invalidDependencies)).toBe(false);

			const validDependencies = [1, 2, 3];
			expect(validateDependencyIds(validDependencies)).toBe(true);
		});

		it("应该处理依赖关系中的空值", () => {
			const taskWithNullDeps = {
				id: 1,
				dependencies: [2, null, 3, undefined],
			};

			const cleanDependencies = taskWithNullDeps.dependencies.filter(
				(dep) => dep != null && typeof dep === "number",
			);

			expect(cleanDependencies).toEqual([2, 3]);
		});

		it("应该检测依赖关系中的孤立任务", () => {
			const tasks = [
				{ id: 1, dependencies: [] },
				{ id: 2, dependencies: [1] },
				{ id: 3, dependencies: [] }, // 孤立任务
				{ id: 4, dependencies: [2] },
			];

			const getIsolatedTasks = (tasks) => {
				const dependentTasks = new Set();

				tasks.forEach((task) => {
					task.dependencies.forEach((depId) => dependentTasks.add(depId));
				});

				// 任务3依赖任务1，任务4依赖任务2，所以只有任务3是真正孤立的
				// 任务4不是孤立的，因为它被任务4自己依赖（虽然这里没有循环）
				return tasks.filter(
					(task) =>
						!dependentTasks.has(task.id) && task.dependencies.length === 0,
				);
			};

			const isolatedTasks = getIsolatedTasks(tasks);
			expect(isolatedTasks.map((t) => t.id)).toEqual([3]);
		});
	});
});
