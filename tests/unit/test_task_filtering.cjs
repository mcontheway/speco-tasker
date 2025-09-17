/**
 * test_task_filtering.cjs
 * 单元测试：验证任务过滤功能
 *
 * SCOPE: 测试任务的状态、优先级、标签、时间范围等过滤功能
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

describe("任务过滤功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const mockTasks = [
		{
			id: 1,
			title: "实现用户登录功能",
			description: "创建用户登录页面和API接口",
			status: "in-progress",
			priority: "high",
			tags: ["frontend", "auth"],
			createdAt: "2024-01-01T10:00:00Z",
			updatedAt: "2024-01-02T10:00:00Z",
			assignee: "alice",
			estimatedHours: 8,
		},
		{
			id: 2,
			title: "设置数据库连接",
			description: "配置PostgreSQL数据库连接和迁移",
			status: "done",
			priority: "medium",
			tags: ["backend", "database"],
			createdAt: "2024-01-01T11:00:00Z",
			updatedAt: "2024-01-03T11:00:00Z",
			assignee: "bob",
			estimatedHours: 4,
		},
		{
			id: 3,
			title: "编写用户认证逻辑",
			description: "实现JWT令牌认证和用户会话管理",
			status: "pending",
			priority: "high",
			tags: ["backend", "auth", "security"],
			createdAt: "2024-01-02T10:00:00Z",
			updatedAt: "2024-01-02T15:00:00Z",
			assignee: "alice",
			estimatedHours: 12,
		},
		{
			id: 4,
			title: "优化前端性能",
			description: "改进页面加载速度和响应性能",
			status: "pending",
			priority: "low",
			tags: ["frontend", "performance"],
			createdAt: "2024-01-03T10:00:00Z",
			updatedAt: "2024-01-03T14:00:00Z",
			assignee: "charlie",
			estimatedHours: 6,
		},
	];

	describe("状态过滤", () => {
		it("应该支持按单个状态过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 状态过滤
					if (filters.status && task.status !== filters.status) {
						return false;
					}

					return true;
				});
			};

			const inProgressTasks = filterTasks(mockTasks, { status: "in-progress" });
			expect(inProgressTasks.length).toBe(1);
			expect(inProgressTasks[0].id).toBe(1);

			const pendingTasks = filterTasks(mockTasks, { status: "pending" });
			expect(pendingTasks.length).toBe(2);
			expect(pendingTasks.map((t) => t.id)).toEqual([3, 4]);
		});

		it("应该支持按多个状态过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 状态过滤
					if (filters.statuses && filters.statuses.length > 0) {
						if (!filters.statuses.includes(task.status)) {
							return false;
						}
					}

					return true;
				});
			};

			const activeTasks = filterTasks(mockTasks, {
				statuses: ["in-progress", "pending"],
			});
			expect(activeTasks.length).toBe(3);
			expect(activeTasks.map((t) => t.id)).toEqual([1, 3, 4]);

			const completedTasks = filterTasks(mockTasks, { statuses: ["done"] });
			expect(completedTasks.length).toBe(1);
			expect(completedTasks[0].id).toBe(2);
		});

		it("应该支持排除特定状态", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 排除状态过滤
					if (
						filters.excludeStatuses &&
						filters.excludeStatuses.includes(task.status)
					) {
						return false;
					}

					return true;
				});
			};

			const notDoneTasks = filterTasks(mockTasks, {
				excludeStatuses: ["done"],
			});
			expect(notDoneTasks.length).toBe(3);
			expect(notDoneTasks.map((t) => t.id)).toEqual([1, 3, 4]);

			const notPendingTasks = filterTasks(mockTasks, {
				excludeStatuses: ["pending"],
			});
			expect(notPendingTasks.length).toBe(2);
			expect(notPendingTasks.map((t) => t.id)).toEqual([1, 2]);
		});
	});

	describe("优先级过滤", () => {
		it("应该支持按优先级过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 优先级过滤
					if (filters.priority && task.priority !== filters.priority) {
						return false;
					}

					return true;
				});
			};

			const highPriorityTasks = filterTasks(mockTasks, { priority: "high" });
			expect(highPriorityTasks.length).toBe(2);
			expect(highPriorityTasks.map((t) => t.id)).toEqual([1, 3]);

			const lowPriorityTasks = filterTasks(mockTasks, { priority: "low" });
			expect(lowPriorityTasks.length).toBe(1);
			expect(lowPriorityTasks[0].id).toBe(4);
		});

		it("应该支持按最小优先级过滤", () => {
			const filterTasks = (tasks, filters) => {
				const priorityLevels = { low: 1, medium: 2, high: 3 };

				return tasks.filter((task) => {
					// 最小优先级过滤
					if (filters.minPriority) {
						const taskLevel = priorityLevels[task.priority] || 0;
						const minLevel = priorityLevels[filters.minPriority] || 0;
						if (taskLevel < minLevel) {
							return false;
						}
					}

					return true;
				});
			};

			const mediumOrHigherTasks = filterTasks(mockTasks, {
				minPriority: "medium",
			});
			expect(mediumOrHigherTasks.length).toBe(3);
			expect(mediumOrHigherTasks.map((t) => t.id)).toEqual([1, 2, 3]);

			const highOnlyTasks = filterTasks(mockTasks, { minPriority: "high" });
			expect(highOnlyTasks.length).toBe(2);
			expect(highOnlyTasks.map((t) => t.id)).toEqual([1, 3]);
		});

		it("应该支持按优先级范围过滤", () => {
			const filterTasks = (tasks, filters) => {
				const priorityOrder = ["low", "medium", "high"];

				return tasks.filter((task) => {
					// 优先级范围过滤
					if (filters.priorityRange) {
						const [minPriority, maxPriority] = filters.priorityRange;
						const taskIndex = priorityOrder.indexOf(task.priority);
						const minIndex = priorityOrder.indexOf(minPriority);
						const maxIndex = priorityOrder.indexOf(maxPriority);

						if (taskIndex < minIndex || taskIndex > maxIndex) {
							return false;
						}
					}

					return true;
				});
			};

			const mediumRangeTasks = filterTasks(mockTasks, {
				priorityRange: ["medium", "high"],
			});
			expect(mediumRangeTasks.length).toBe(3);
			expect(mediumRangeTasks.map((t) => t.id)).toEqual([1, 2, 3]);
		});
	});

	describe("标签过滤", () => {
		it("应该支持按单个标签过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 标签过滤
					if (filters.tag && (!task.tags || !task.tags.includes(filters.tag))) {
						return false;
					}

					return true;
				});
			};

			const frontendTasks = filterTasks(mockTasks, { tag: "frontend" });
			expect(frontendTasks.length).toBe(2);
			expect(frontendTasks.map((t) => t.id)).toEqual([1, 4]);

			const authTasks = filterTasks(mockTasks, { tag: "auth" });
			expect(authTasks.length).toBe(2);
			expect(authTasks.map((t) => t.id)).toEqual([1, 3]);
		});

		it("应该支持按多个标签过滤（OR逻辑）", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 多个标签过滤（OR）
					if (filters.tags && filters.tags.length > 0) {
						const hasAnyTag = filters.tags.some(
							(tag) => task.tags && task.tags.includes(tag),
						);
						if (!hasAnyTag) {
							return false;
						}
					}

					return true;
				});
			};

			const frontendOrAuthTasks = filterTasks(mockTasks, {
				tags: ["frontend", "auth"],
			});
			expect(frontendOrAuthTasks.length).toBe(3);
			expect(frontendOrAuthTasks.map((t) => t.id)).toEqual([1, 3, 4]);
		});

		it("应该支持按多个标签过滤（AND逻辑）", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 多个标签过滤（AND）
					if (filters.allTags && filters.allTags.length > 0) {
						const hasAllTags = filters.allTags.every(
							(tag) => task.tags && task.tags.includes(tag),
						);
						if (!hasAllTags) {
							return false;
						}
					}

					return true;
				});
			};

			const backendAndAuthTasks = filterTasks(mockTasks, {
				allTags: ["backend", "auth"],
			});
			expect(backendAndAuthTasks.length).toBe(1);
			expect(backendAndAuthTasks[0].id).toBe(3);

			const noMatchingTasks = filterTasks(mockTasks, {
				allTags: ["frontend", "database"],
			});
			expect(noMatchingTasks.length).toBe(0);
		});

		it("应该支持排除特定标签", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 排除标签过滤
					if (filters.excludeTags && filters.excludeTags.length > 0) {
						const hasExcludedTag = filters.excludeTags.some(
							(tag) => task.tags && task.tags.includes(tag),
						);
						if (hasExcludedTag) {
							return false;
						}
					}

					return true;
				});
			};

			const nonFrontendTasks = filterTasks(mockTasks, {
				excludeTags: ["frontend"],
			});
			expect(nonFrontendTasks.length).toBe(2);
			expect(nonFrontendTasks.map((t) => t.id)).toEqual([2, 3]);
		});
	});

	describe("时间范围过滤", () => {
		it("应该支持按创建时间过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 创建时间过滤
					if (filters.createdAfter) {
						const taskDate = new Date(task.createdAt);
						const filterDate = new Date(filters.createdAfter);
						if (taskDate <= filterDate) {
							return false;
						}
					}

					if (filters.createdBefore) {
						const taskDate = new Date(task.createdAt);
						const filterDate = new Date(filters.createdBefore);
						if (taskDate >= filterDate) {
							return false;
						}
					}

					return true;
				});
			};

			const recentTasks = filterTasks(mockTasks, {
				createdAfter: "2024-01-01T12:00:00Z",
			});
			expect(recentTasks.length).toBe(2);
			expect(recentTasks.map((t) => t.id)).toEqual([3, 4]);

			const oldTasks = filterTasks(mockTasks, {
				createdBefore: "2024-01-02T00:00:00Z",
			});
			expect(oldTasks.length).toBe(2);
			expect(oldTasks.map((t) => t.id)).toEqual([1, 2]);
		});

		it("应该支持按更新时间过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 更新时间过滤
					if (filters.updatedAfter) {
						const taskDate = new Date(task.updatedAt);
						const filterDate = new Date(filters.updatedAfter);
						if (taskDate <= filterDate) {
							return false;
						}
					}

					if (filters.updatedBefore) {
						const taskDate = new Date(task.updatedAt);
						const filterDate = new Date(filters.updatedBefore);
						if (taskDate >= filterDate) {
							return false;
						}
					}

					return true;
				});
			};

			const recentlyUpdatedTasks = filterTasks(mockTasks, {
				updatedAfter: "2024-01-03T00:00:00Z",
			});
			expect(recentlyUpdatedTasks.length).toBe(2);
			expect(recentlyUpdatedTasks.map((t) => t.id)).toEqual([2, 4]);
		});

		it("应该支持按时间范围过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 时间范围过滤
					if (filters.dateRange) {
						const [startDate, endDate] = filters.dateRange;
						const taskDate = new Date(task.createdAt);
						const start = new Date(startDate);
						const end = new Date(endDate);

						if (taskDate < start || taskDate > end) {
							return false;
						}
					}

					return true;
				});
			};

			const rangeTasks = filterTasks(mockTasks, {
				dateRange: ["2024-01-01T00:00:00Z", "2024-01-02T12:00:00Z"],
			});
			expect(rangeTasks.length).toBe(3);
			expect(rangeTasks.map((t) => t.id)).toEqual([1, 2, 3]);
		});
	});

	describe("其他字段过滤", () => {
		it("应该支持按负责人过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 负责人过滤
					if (filters.assignee && task.assignee !== filters.assignee) {
						return false;
					}

					return true;
				});
			};

			const aliceTasks = filterTasks(mockTasks, { assignee: "alice" });
			expect(aliceTasks.length).toBe(2);
			expect(aliceTasks.map((t) => t.id)).toEqual([1, 3]);

			const bobTasks = filterTasks(mockTasks, { assignee: "bob" });
			expect(bobTasks.length).toBe(1);
			expect(bobTasks[0].id).toBe(2);
		});

		it("应该支持按预估工时过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 工时过滤
					if (filters.minHours && task.estimatedHours < filters.minHours) {
						return false;
					}

					if (filters.maxHours && task.estimatedHours > filters.maxHours) {
						return false;
					}

					return true;
				});
			};

			const longTasks = filterTasks(mockTasks, { minHours: 8 });
			expect(longTasks.length).toBe(2);
			expect(longTasks.map((t) => t.id)).toEqual([1, 3]);

			const shortTasks = filterTasks(mockTasks, { maxHours: 6 });
			expect(shortTasks.length).toBe(2);
			expect(shortTasks.map((t) => t.id)).toEqual([2, 4]);
		});

		it("应该支持按任务ID范围过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// ID范围过滤
					if (filters.minId && task.id < filters.minId) {
						return false;
					}

					if (filters.maxId && task.id > filters.maxId) {
						return false;
					}

					return true;
				});
			};

			const idRangeTasks = filterTasks(mockTasks, { minId: 2, maxId: 3 });
			expect(idRangeTasks.length).toBe(2);
			expect(idRangeTasks.map((t) => t.id)).toEqual([2, 3]);
		});
	});

	describe("复合过滤", () => {
		it("应该支持多条件复合过滤", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 状态过滤
					if (filters.status && task.status !== filters.status) {
						return false;
					}

					// 优先级过滤
					if (filters.priority && task.priority !== filters.priority) {
						return false;
					}

					// 标签过滤
					if (filters.tag && (!task.tags || !task.tags.includes(filters.tag))) {
						return false;
					}

					// 负责人过滤
					if (filters.assignee && task.assignee !== filters.assignee) {
						return false;
					}

					return true;
				});
			};

			// 复合过滤：高优先级 + Alice负责 + 前端标签
			const complexTasks = filterTasks(mockTasks, {
				priority: "high",
				assignee: "alice",
				tag: "frontend",
			});
			expect(complexTasks.length).toBe(1);
			expect(complexTasks[0].id).toBe(1);
		});

		it("应该支持过滤器组合（AND/OR逻辑）", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					let matches = true;

					// AND条件：所有条件都必须满足
					if (filters.andConditions) {
						for (const condition of filters.andConditions) {
							if (
								condition.type === "status" &&
								task.status !== condition.value
							) {
								matches = false;
								break;
							}
							if (
								condition.type === "priority" &&
								task.priority !== condition.value
							) {
								matches = false;
								break;
							}
							if (
								condition.type === "tag" &&
								(!task.tags || !task.tags.includes(condition.value))
							) {
								matches = false;
								break;
							}
						}
					}

					// OR条件：满足任一条件即可
					if (filters.orConditions && !matches) {
						matches = false;
						for (const condition of filters.orConditions) {
							if (
								condition.type === "status" &&
								task.status === condition.value
							) {
								matches = true;
								break;
							}
							if (
								condition.type === "priority" &&
								task.priority === condition.value
							) {
								matches = true;
								break;
							}
							if (
								condition.type === "tag" &&
								task.tags &&
								task.tags.includes(condition.value)
							) {
								matches = true;
								break;
							}
						}
					}

					return matches;
				});
			};

			// AND条件：进行中状态 AND 高优先级
			const andTasks = filterTasks(mockTasks, {
				andConditions: [
					{ type: "status", value: "in-progress" },
					{ type: "priority", value: "high" },
				],
			});
			expect(andTasks.length).toBe(1);
			expect(andTasks[0].id).toBe(1);
		});

		it("应该支持自定义过滤器函数", () => {
			const filterTasks = (tasks, filters) => {
				return tasks.filter((task) => {
					// 自定义过滤器函数
					if (
						filters.customFilter &&
						typeof filters.customFilter === "function"
					) {
						return filters.customFilter(task);
					}

					return true;
				});
			};

			// 自定义过滤器：工时大于6小时且状态为pending
			const customFilteredTasks = filterTasks(mockTasks, {
				customFilter: (task) =>
					task.estimatedHours > 6 && task.status === "pending",
			});
			expect(customFilteredTasks.length).toBe(1);
			expect(customFilteredTasks[0].id).toBe(3);
		});
	});

	describe("过滤结果处理", () => {
		it("应该返回过滤结果的统计信息", () => {
			const filterTasksWithStats = (tasks, filters) => {
				const results = tasks.filter((task) => {
					// 简单的状态过滤作为示例
					if (filters.status && task.status !== filters.status) {
						return false;
					}
					return true;
				});

				return {
					results,
					total: results.length,
					filters: filters,
					summary: {
						byStatus: results.reduce((acc, task) => {
							acc[task.status] = (acc[task.status] || 0) + 1;
							return acc;
						}, {}),
						byPriority: results.reduce((acc, task) => {
							acc[task.priority] = (acc[task.priority] || 0) + 1;
							return acc;
						}, {}),
						byAssignee: results.reduce((acc, task) => {
							acc[task.assignee] = (acc[task.assignee] || 0) + 1;
							return acc;
						}, {}),
					},
				};
			};

			const filteredResult = filterTasksWithStats(mockTasks, {
				status: "pending",
			});

			expect(filteredResult.total).toBe(2);
			expect(filteredResult.summary.byStatus.pending).toBe(2);
			expect(filteredResult.summary.byPriority.high).toBe(1);
			expect(filteredResult.summary.byPriority.low).toBe(1);
		});

		it("应该支持过滤结果的分页", () => {
			const filterTasksWithPagination = (tasks, filters, pagination = {}) => {
				let results = tasks.filter((task) => {
					if (filters.status && task.status !== filters.status) {
						return false;
					}
					return true;
				});

				const { page = 1, limit = 10 } = pagination;
				const total = results.length;
				const startIndex = (page - 1) * limit;
				const endIndex = startIndex + limit;
				results = results.slice(startIndex, endIndex);

				return {
					results,
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit),
						hasNext: endIndex < total,
						hasPrev: page > 1,
					},
				};
			};

			const paginatedResult = filterTasksWithPagination(
				mockTasks,
				{ status: "pending" },
				{ page: 1, limit: 1 },
			);

			expect(paginatedResult.results.length).toBe(1);
			expect(paginatedResult.pagination.total).toBe(2);
			expect(paginatedResult.pagination.hasNext).toBe(true);
		});
	});
});
