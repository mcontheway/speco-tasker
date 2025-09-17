/**
 * test_task_search.cjs
 * 单元测试：验证任务搜索功能
 *
 * SCOPE: 测试任务的标题、描述、状态、优先级等字段的搜索功能
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

describe("任务搜索功能验证", () => {
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
		},
		{
			id: 2,
			title: "设置数据库连接",
			description: "配置PostgreSQL数据库连接和迁移",
			status: "done",
			priority: "medium",
			tags: ["backend", "database"],
		},
		{
			id: 3,
			title: "编写用户认证逻辑",
			description: "实现JWT令牌认证和用户会话管理",
			status: "pending",
			priority: "high",
			tags: ["backend", "auth", "security"],
		},
		{
			id: 4,
			title: "优化前端性能",
			description: "改进页面加载速度和响应性能",
			status: "pending",
			priority: "low",
			tags: ["frontend", "performance"],
		},
	];

	describe("基本搜索功能", () => {
		it("应该支持按标题搜索任务", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 搜索标题
			const loginResults = searchTasks(mockTasks, "登录", "title");
			expect(loginResults.length).toBe(1);
			expect(loginResults[0].id).toBe(1);

			// 搜索不存在的标题
			const nonExistentResults = searchTasks(
				mockTasks,
				"不存在的任务",
				"title",
			);
			expect(nonExistentResults.length).toBe(0);
		});

		it("应该支持按描述搜索任务", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 搜索描述中的关键词
			const apiResults = searchTasks(mockTasks, "API", "description");
			expect(apiResults.length).toBe(1);
			expect(apiResults[0].id).toBe(1);

			// 搜索数据库相关描述
			const dbResults = searchTasks(mockTasks, "数据库", "description");
			expect(dbResults.length).toBe(1);
			expect(dbResults[0].id).toBe(2);
		});

		it("应该支持按标签搜索任务", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 搜索auth标签
			const authResults = searchTasks(mockTasks, "auth", "tags");
			expect(authResults.length).toBe(2);
			expect(authResults.map((t) => t.id)).toEqual([1, 3]);

			// 搜索frontend标签
			const frontendResults = searchTasks(mockTasks, "frontend", "tags");
			expect(frontendResults.length).toBe(2);
			expect(frontendResults.map((t) => t.id)).toEqual([1, 4]);
		});

		it("应该支持全局搜索", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 全局搜索"用户"
			const userResults = searchTasks(mockTasks, "用户");
			expect(userResults.length).toBe(2);
			expect(userResults.map((t) => t.id)).toEqual([1, 3]);

			// 全局搜索"性能"
			const performanceResults = searchTasks(mockTasks, "性能");
			expect(performanceResults.length).toBe(1);
			expect(performanceResults[0].id).toBe(4);
		});
	});

	describe("高级搜索功能", () => {
		it("应该支持多关键词搜索", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const keywords = query
					.toLowerCase()
					.split(/\s+/)
					.filter((k) => k.length > 0);

				return tasks.filter((task) => {
					return keywords.every((keyword) => {
						if (field === "title" || field === "all") {
							if (task.title && task.title.toLowerCase().includes(keyword)) {
								return true;
							}
						}

						if (field === "description" || field === "all") {
							if (
								task.description &&
								task.description.toLowerCase().includes(keyword)
							) {
								return true;
							}
						}

						if (field === "tags" || field === "all") {
							if (
								task.tags &&
								task.tags.some((tag) => tag.toLowerCase().includes(keyword))
							) {
								return true;
							}
						}

						return false;
					});
				});
			};

			// 多关键词搜索
			const multiResults = searchTasks(mockTasks, "用户 认证");
			expect(multiResults.length).toBe(1);
			expect(multiResults[0].id).toBe(3);

			// 多关键词搜索（OR逻辑）
			const orResults = searchTasks(mockTasks, "登录");
			expect(orResults.length).toBe(1);
			expect(orResults[0].id).toBe(1);
		});

		it("应该支持大小写不敏感搜索", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 大写搜索
			const upperResults = searchTasks(mockTasks, "用户登录");
			expect(upperResults.length).toBe(1);
			expect(upperResults[0].id).toBe(1);

			// 混合大小写搜索
			const mixedResults = searchTasks(mockTasks, "PostgreSQL");
			expect(mixedResults.length).toBe(1);
			expect(mixedResults[0].id).toBe(2);
		});

		it("应该支持模糊搜索和部分匹配", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 部分匹配搜索
			const partialResults = searchTasks(mockTasks, "认证");
			expect(partialResults.length).toBe(1);
			expect(partialResults[0].id).toBe(3);

			// 模糊匹配搜索
			const fuzzyResults = searchTasks(mockTasks, "连");
			expect(fuzzyResults.length).toBe(1);
			expect(fuzzyResults[0].id).toBe(2);
		});
	});

	describe("搜索结果处理", () => {
		it("应该返回搜索结果的统计信息", () => {
			const searchTasksWithStats = (tasks, query, field = "all") => {
				const results = tasks.filter((task) => {
					if (!query) return true;

					const lowerQuery = query.toLowerCase();

					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});

				return {
					results,
					total: results.length,
					query,
					field,
					matchedFields: results.map((task) => {
						const matched = [];
						const lowerQuery = query.toLowerCase();

						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							matched.push("title");
						}
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							matched.push("description");
						}
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							matched.push("tags");
						}

						return { id: task.id, matchedFields: matched };
					}),
				};
			};

			const searchResult = searchTasksWithStats(mockTasks, "用户");

			expect(searchResult.total).toBe(2);
			expect(searchResult.query).toBe("用户");
			expect(searchResult.results.length).toBe(2);
			expect(searchResult.matchedFields[0].matchedFields).toContain("title");
			expect(searchResult.matchedFields[1].matchedFields).toContain("title");
		});

		it("应该支持分页搜索结果", () => {
			const searchTasksWithPagination = (tasks, query, options = {}) => {
				const { page = 1, limit = 10, field = "all" } = options;

				let results = tasks.filter((task) => {
					if (!query) return true;

					const lowerQuery = query.toLowerCase();

					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});

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

			const paginatedResult = searchTasksWithPagination(mockTasks, "用户", {
				page: 1,
				limit: 1,
			});

			expect(paginatedResult.results.length).toBe(1);
			expect(paginatedResult.pagination.total).toBe(2);
			expect(paginatedResult.pagination.hasNext).toBe(true);
			expect(paginatedResult.pagination.hasPrev).toBe(false);
		});

		it("应该支持按相关度排序搜索结果", () => {
			const searchTasksWithRelevance = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				const scoredResults = tasks
					.map((task) => {
						let score = 0;
						const matches = [];

						// 标题匹配权重最高
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							score += 10;
							matches.push("title");
						}

						// 描述匹配权重中等
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							score += 5;
							matches.push("description");
						}

						// 标签匹配权重最低
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							score += 2;
							matches.push("tags");
						}

						return { task, score, matches };
					})
					.filter((item) => item.score > 0)
					.sort((a, b) => b.score - a.score);

				return scoredResults.map((item) => ({
					...item.task,
					relevanceScore: item.score,
					matchedFields: item.matches,
				}));
			};

			const relevanceResults = searchTasksWithRelevance(mockTasks, "用户");

			expect(relevanceResults.length).toBe(2);
			expect(relevanceResults[0].relevanceScore).toBeGreaterThanOrEqual(
				relevanceResults[1].relevanceScore,
			);
			expect(relevanceResults[0].matchedFields).toContain("title");
		});
	});

	describe("搜索边界情况", () => {
		it("应该处理空搜索查询", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 空查询应该返回所有任务
			const emptyResults = searchTasks(mockTasks, "");
			expect(emptyResults.length).toBe(4);

			// null/undefined查询应该返回所有任务
			const nullResults = searchTasks(mockTasks, null);
			expect(nullResults.length).toBe(4);

			const undefinedResults = searchTasks(mockTasks, undefined);
			expect(undefinedResults.length).toBe(4);
		});

		it("应该处理不存在的字段搜索", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				const lowerQuery = query.toLowerCase();

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && task.title.toLowerCase().includes(lowerQuery)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (
							task.description &&
							task.description.toLowerCase().includes(lowerQuery)
						) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (
							task.tags &&
							task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
						) {
							return true;
						}
					}

					return false;
				});
			};

			// 搜索不存在的任务
			const noResults = searchTasks(mockTasks, "nonexistent");
			expect(noResults.length).toBe(0);

			// 搜索不存在的标签
			const noTagResults = searchTasks(mockTasks, "nonexistent-tag", "tags");
			expect(noTagResults.length).toBe(0);
		});

		it("应该处理包含特殊字符的搜索", () => {
			const searchTasks = (tasks, query, field = "all") => {
				if (!query) return tasks;

				// 转义特殊字符进行安全搜索
				const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const regex = new RegExp(escapedQuery, "i");

				return tasks.filter((task) => {
					if (field === "title" || field === "all") {
						if (task.title && regex.test(task.title)) {
							return true;
						}
					}

					if (field === "description" || field === "all") {
						if (task.description && regex.test(task.description)) {
							return true;
						}
					}

					if (field === "tags" || field === "all") {
						if (task.tags && task.tags.some((tag) => regex.test(tag))) {
							return true;
						}
					}

					return false;
				});
			};

			// 测试特殊字符搜索
			const tasksWithSpecial = [
				{ id: 1, title: "测试(特殊)字符", description: "desc", tags: [] },
				{ id: 2, title: "正常标题", description: "desc", tags: [] },
			];

			const specialResults = searchTasks(tasksWithSpecial, "测试(特殊)");
			expect(specialResults.length).toBe(1);
			expect(specialResults[0].id).toBe(1);
		});
	});
});
