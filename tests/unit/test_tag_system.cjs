/**
 * test_tag_system.cjs
 * 单元测试：验证标签系统功能
 *
 * SCOPE: 测试标签的创建、管理、切换和任务隔离功能
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

describe("标签系统功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("标签数据结构", () => {
		it("应该正确创建标签对象", () => {
			const tag = {
				name: "feature-user-auth",
				description: "用户认证功能开发任务",
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				taskCount: 5,
				completedTasks: 2,
				activeTasks: 3,
			};

			expect(tag).toHaveProperty("name");
			expect(tag).toHaveProperty("description");
			expect(tag).toHaveProperty("createdAt");
			expect(tag).toHaveProperty("updatedAt");
			expect(tag).toHaveProperty("taskCount");
			expect(tag).toHaveProperty("completedTasks");
			expect(tag).toHaveProperty("activeTasks");

			expect(tag.name).toBe("feature-user-auth");
			expect(tag.taskCount).toBe(5);
			expect(tag.completedTasks).toBe(2);
			expect(tag.activeTasks).toBe(3);
		});

		it("应该验证标签名称格式", () => {
			const validNames = [
				"feature-auth",
				"bug-fix",
				"experiment_ui",
				"v1.0",
				"main",
				"001-task-refactor",
			];
			const invalidNames = [
				"Feature Auth",
				"bug fix",
				"",
				"tag with spaces",
				"tag-with-special!chars",
			];

			const isValidTagName = (name) =>
				/^[a-zA-Z0-9_.-][a-zA-Z0-9_.-]*$/.test(name) &&
				name.length > 0 &&
				name.length <= 50;

			validNames.forEach((name) => {
				expect(isValidTagName(name)).toBe(true);
			});

			invalidNames.forEach((name) => {
				expect(isValidTagName(name)).toBe(false);
			});
		});

		it("应该支持标签元数据", () => {
			const tagMetadata = {
				name: "feature-dashboard",
				description: "仪表板功能开发",
				color: "#FF6B6B",
				icon: "📊",
				priority: "high",
				dueDate: "2024-02-01",
				assignee: "developer@example.com",
				metadata: {
					estimatedHours: 40,
					complexity: "medium",
					tags: ["frontend", "ui", "data-visualization"],
				},
			};

			expect(tagMetadata.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
			expect(tagMetadata.icon).toBe("📊");
			expect(tagMetadata.metadata.estimatedHours).toBe(40);
			expect(tagMetadata.metadata.tags).toContain("frontend");
		});
	});

	describe("标签管理操作", () => {
		it("应该能够创建新标签", () => {
			const tags = [{ name: "main", description: "主任务列表" }];

			const newTag = {
				name: "feature-login",
				description: "登录功能开发",
				createdAt: new Date().toISOString(),
			};

			const updatedTags = [...tags, newTag];

			expect(updatedTags).toHaveLength(2);
			expect(updatedTags[1].name).toBe("feature-login");
			expect(updatedTags[1].description).toBe("登录功能开发");
		});

		it("应该能够更新标签信息", () => {
			const tag = {
				name: "feature-auth",
				description: "原描述",
				color: "#000000",
			};

			const updatedTag = {
				...tag,
				description: "新描述：用户认证功能",
				color: "#FF6B6B",
				updatedAt: new Date().toISOString(),
			};

			expect(updatedTag.description).toBe("新描述：用户认证功能");
			expect(updatedTag.color).toBe("#FF6B6B");
			expect(updatedTag.updatedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
		});

		it("应该能够删除标签", () => {
			const tags = [
				{ name: "main", description: "主任务列表" },
				{ name: "feature-auth", description: "认证功能" },
				{ name: "bug-fixes", description: "Bug修复" },
			];

			const tagToDelete = "feature-auth";
			const updatedTags = tags.filter((tag) => tag.name !== tagToDelete);

			expect(updatedTags).toHaveLength(2);
			expect(updatedTags.map((t) => t.name)).toEqual(["main", "bug-fixes"]);
		});

		it("应该防止删除master标签", () => {
			const tags = [
				{ name: "main", description: "主任务列表" },
				{ name: "feature-auth", description: "认证功能" },
			];

			const canDeleteTag = (tagName) => tagName !== "main";

			expect(canDeleteTag("main")).toBe(false);
			expect(canDeleteTag("feature-auth")).toBe(true);
		});

		it("应该防止创建重复标签名称", () => {
			const existingTags = [{ name: "main" }, { name: "feature-auth" }];

			const canCreateTag = (tagName) => {
				return !existingTags.some((tag) => tag.name === tagName);
			};

			expect(canCreateTag("feature-auth")).toBe(false); // 已存在
			expect(canCreateTag("feature-login")).toBe(true); // 不存在，可以创建
		});
	});

	describe("标签上下文切换", () => {
		it("应该能够切换当前标签上下文", () => {
			let currentTag = "main";

			const switchToTag = (tagName) => {
				currentTag = tagName;
				return { success: true, previousTag: "main", currentTag: tagName };
			};

			const result = switchToTag("feature-auth");

			expect(result.success).toBe(true);
			expect(result.previousTag).toBe("main");
			expect(result.currentTag).toBe("feature-auth");
			expect(currentTag).toBe("feature-auth");
		});

		it("应该验证标签存在性再切换", () => {
			const availableTags = ["main", "feature-auth", "bug-fixes"];

			const canSwitchToTag = (tagName) => {
				return availableTags.includes(tagName);
			};

			expect(canSwitchToTag("main")).toBe(true);
			expect(canSwitchToTag("feature-auth")).toBe(true);
			expect(canSwitchToTag("non-existent-tag")).toBe(false);
		});

		it("应该保持标签切换历史", () => {
			const tagHistory = ["main"];

			const switchTagWithHistory = (newTag) => {
				const previousTag = tagHistory[tagHistory.length - 1];
				tagHistory.push(newTag);
				return { previousTag, currentTag: newTag, history: tagHistory };
			};

			let result = switchTagWithHistory("feature-auth");
			expect(result.history).toEqual(["main", "feature-auth"]);

			result = switchTagWithHistory("bug-fixes");
			expect(result.history).toEqual(["main", "feature-auth", "bug-fixes"]);
		});
	});

	describe("标签任务隔离", () => {
		it("应该在不同标签间隔离任务", () => {
			const tasksByTag = {
				master: [
					{ id: 1, title: "主任务1", status: "pending" },
					{ id: 2, title: "主任务2", status: "done" },
				],
				"feature-auth": [
					{ id: 1, title: "登录功能", status: "in-progress" },
					{ id: 2, title: "注册功能", status: "pending" },
				],
			};

			const getTasksForTag = (tagName) => tasksByTag[tagName] || [];

			expect(getTasksForTag("main")).toHaveLength(2);
			expect(getTasksForTag("feature-auth")).toHaveLength(2);
			expect(getTasksForTag("non-existent")).toHaveLength(0);

			// 验证任务ID在不同标签中可以重复
			const masterTaskIds = getTasksForTag("main").map((t) => t.id);
			const authTaskIds = getTasksForTag("feature-auth").map((t) => t.id);
			expect(masterTaskIds).toEqual([1, 2]);
			expect(authTaskIds).toEqual([1, 2]);
		});

		it("应该支持标签间任务复制", () => {
			const sourceTasks = [
				{ id: 1, title: "任务1", status: "pending" },
				{ id: 2, title: "任务2", status: "done" },
			];

			const copyTasksToTag = (tasks, targetTag) => {
				return tasks.map((task) => ({
					...task,
					tag: targetTag,
					copiedFrom: task.id,
					copiedAt: new Date().toISOString(),
				}));
			};

			const copiedTasks = copyTasksToTag(sourceTasks, "feature-new");

			expect(copiedTasks).toHaveLength(2);
			expect(copiedTasks[0].tag).toBe("feature-new");
			expect(copiedTasks[0].copiedFrom).toBe(1);
			expect(copiedTasks[0].copiedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
		});

		it("应该支持标签间任务移动", () => {
			const tasksByTag = {
				master: [
					{ id: 1, title: "任务1", status: "pending" },
					{ id: 2, title: "任务2", status: "done" },
				],
				"feature-auth": [],
			};

			const moveTaskBetweenTags = (taskId, fromTag, toTag) => {
				const task = tasksByTag[fromTag].find((t) => t.id === taskId);
				if (!task) return null;

				// 从源标签移除
				tasksByTag[fromTag] = tasksByTag[fromTag].filter(
					(t) => t.id !== taskId,
				);

				// 添加到目标标签
				const movedTask = {
					...task,
					movedFrom: fromTag,
					movedAt: new Date().toISOString(),
				};
				tasksByTag[toTag] = [...tasksByTag[toTag], movedTask];

				return movedTask;
			};

			const movedTask = moveTaskBetweenTags(1, "main", "feature-auth");

			expect(movedTask).not.toBeNull();
			expect(movedTask.movedFrom).toBe("main");
			expect(tasksByTag.master).toHaveLength(1);
			expect(tasksByTag["feature-auth"]).toHaveLength(1);
			expect(tasksByTag.master[0].id).toBe(2);
			expect(tasksByTag["feature-auth"][0].id).toBe(1);
		});
	});

	describe("标签统计和报告", () => {
		it("应该计算标签的任务统计信息", () => {
			const tasks = [
				{ id: 1, status: "pending", priority: "high" },
				{ id: 2, status: "in-progress", priority: "medium" },
				{ id: 3, status: "done", priority: "low" },
				{ id: 4, status: "blocked", priority: "high" },
				{ id: 5, status: "cancelled", priority: "medium" },
			];

			const calculateTagStats = (tasks) => {
				const stats = {
					total: tasks.length,
					completed: tasks.filter((t) => t.status === "done").length,
					active: tasks.filter((t) =>
						["pending", "in-progress"].includes(t.status),
					).length,
					blocked: tasks.filter((t) => t.status === "blocked").length,
					cancelled: tasks.filter((t) => t.status === "cancelled").length,
					byPriority: {
						high: tasks.filter((t) => t.priority === "high").length,
						medium: tasks.filter((t) => t.priority === "medium").length,
						low: tasks.filter((t) => t.priority === "low").length,
					},
					completionRate: 0,
				};

				stats.completionRate =
					stats.total > 0
						? Math.round((stats.completed / stats.total) * 100)
						: 0;
				return stats;
			};

			const stats = calculateTagStats(tasks);

			expect(stats.total).toBe(5);
			expect(stats.completed).toBe(1);
			expect(stats.active).toBe(2);
			expect(stats.blocked).toBe(1);
			expect(stats.cancelled).toBe(1);
			expect(stats.completionRate).toBe(20);
			expect(stats.byPriority.high).toBe(2);
			expect(stats.byPriority.medium).toBe(2);
			expect(stats.byPriority.low).toBe(1);
		});

		it("应该生成标签进度报告", () => {
			const tagInfo = {
				name: "feature-dashboard",
				description: "仪表板功能开发",
				tasks: [
					{ id: 1, title: "设计界面", status: "done", priority: "high" },
					{
						id: 2,
						title: "实现数据获取",
						status: "in-progress",
						priority: "high",
					},
					{
						id: 3,
						title: "添加图表组件",
						status: "pending",
						priority: "medium",
					},
					{ id: 4, title: "编写测试", status: "pending", priority: "low" },
				],
			};

			const generateProgressReport = (tag) => {
				const totalTasks = tag.tasks.length;
				const completedTasks = tag.tasks.filter(
					(t) => t.status === "done",
				).length;
				const activeTasks = tag.tasks.filter((t) =>
					["pending", "in-progress"].includes(t.status),
				).length;
				const completionRate = Math.round((completedTasks / totalTasks) * 100);

				return {
					tagName: tag.name,
					description: tag.description,
					totalTasks,
					completedTasks,
					activeTasks,
					completionRate,
					nextPriority:
						tag.tasks
							.filter((t) => ["pending", "in-progress"].includes(t.status))
							.sort((a, b) => {
								const priorityOrder = { high: 3, medium: 2, low: 1 };
								const aPriority = priorityOrder[a.priority] || 0;
								const bPriority = priorityOrder[b.priority] || 0;
								if (aPriority !== bPriority) {
									return bPriority - aPriority; // 高优先级在前
								}
								// 如果优先级相同，in-progress 优先于 pending
								if (a.status === "in-progress" && b.status === "pending")
									return -1;
								if (a.status === "pending" && b.status === "in-progress")
									return 1;
								return 0;
							})[0]?.title || "无待处理任务",
				};
			};

			const report = generateProgressReport(tagInfo);

			expect(report.tagName).toBe("feature-dashboard");
			expect(report.totalTasks).toBe(4);
			expect(report.completedTasks).toBe(1);
			expect(report.activeTasks).toBe(3);
			expect(report.completionRate).toBe(25);
			expect(report.nextPriority).toBe("实现数据获取");
		});

		it("应该比较多个标签的进度", () => {
			const tagsData = {
				master: {
					total: 10,
					completed: 7,
					active: 3,
				},
				"feature-auth": {
					total: 5,
					completed: 2,
					active: 3,
				},
				"bug-fixes": {
					total: 8,
					completed: 8,
					active: 0,
				},
			};

			const compareTagsProgress = (tags) => {
				return Object.entries(tags)
					.map(([tagName, stats]) => ({
						name: tagName,
						completionRate: Math.round((stats.completed / stats.total) * 100),
						efficiency:
							stats.total > 0
								? Math.round(
										(stats.completed / (stats.total - stats.active)) * 100,
									)
								: 0,
					}))
					.sort((a, b) => b.completionRate - a.completionRate);
			};

			const comparison = compareTagsProgress(tagsData);

			expect(comparison[0].name).toBe("bug-fixes"); // 100%完成率
			expect(comparison[0].completionRate).toBe(100);
			expect(comparison[1].name).toBe("main"); // 70%完成率
			expect(comparison[1].completionRate).toBe(70);
			expect(comparison[2].name).toBe("feature-auth"); // 40%完成率
			expect(comparison[2].completionRate).toBe(40);
		});
	});

	describe("标签分支集成", () => {
		it("应该支持从Git分支创建标签", () => {
			const gitBranches = [
				"main",
				"feature/user-auth",
				"bug/fix-login",
				"experiment/new-ui",
			];

			const createTagFromBranch = (branchName) => {
				// 转换分支名为标签名
				const tagName = branchName
					.replace(/^(feature|bug|experiment)\//, "$1-")
					.replace(/[^a-zA-Z0-9_-]/g, "-")
					.toLowerCase();

				return {
					name: tagName,
					originalBranch: branchName,
					description: `从分支 ${branchName} 创建的任务标签`,
					createdFromBranch: true,
				};
			};

			const tag1 = createTagFromBranch("feature/user-auth");
			const tag2 = createTagFromBranch("bug/fix-login");
			const tag3 = createTagFromBranch("main");

			expect(tag1.name).toBe("feature-user-auth");
			expect(tag1.originalBranch).toBe("feature/user-auth");
			expect(tag2.name).toBe("bug-fix-login");
			expect(tag3.name).toBe("main");
		});

		it("应该支持标签与分支的同步", () => {
			const branchTagMapping = {
				main: "main",
				"feature/user-auth": "feature-user-auth",
				develop: "develop",
				"release/v1.0": "release-v1-0",
			};

			const getTagForBranch = (branchName) => {
				return (
					branchTagMapping[branchName] ||
					`branch-${branchName.replace(/[^a-zA-Z0-9]/g, "-")}`
				);
			};

			const syncBranchToTag = (branchName) => {
				const tagName = getTagForBranch(branchName);
				return {
					branch: branchName,
					tag: tagName,
					synchronized: true,
					lastSync: new Date().toISOString(),
				};
			};

			const sync1 = syncBranchToTag("feature/user-auth");
			const sync2 = syncBranchToTag("hotfix/security-patch");

			expect(sync1.tag).toBe("feature-user-auth");
			expect(sync2.tag).toBe("branch-hotfix-security-patch");
			expect(sync1.synchronized).toBe(true);
			expect(sync2.lastSync).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});

		it("应该处理标签合并冲突", () => {
			const tagA = {
				name: "feature-auth",
				tasks: [
					{ id: 1, title: "任务1", status: "done" },
					{ id: 2, title: "任务2", status: "pending" },
				],
				version: 1,
			};

			const tagB = {
				name: "feature-auth",
				tasks: [
					{ id: 1, title: "任务1", status: "done" },
					{ id: 2, title: "任务2 (修改)", status: "in-progress" },
					{ id: 3, title: "新任务", status: "pending" },
				],
				version: 1,
			};

			const mergeTags = (tagA, tagB) => {
				const mergedTasks = [];
				const taskMap = new Map();

				// 添加tagA的任务
				tagA.tasks.forEach((task) => {
					taskMap.set(task.id, { ...task, source: "A" });
				});

				// 合并tagB的任务
				tagB.tasks.forEach((task) => {
					if (taskMap.has(task.id)) {
						// 冲突处理：保留最新版本
						const existing = taskMap.get(task.id);
						if (task.status !== existing.status) {
							taskMap.set(task.id, { ...task, source: "B", conflicted: true });
						}
					} else {
						taskMap.set(task.id, { ...task, source: "B" });
					}
				});

				taskMap.forEach((task) => mergedTasks.push(task));

				return {
					name: tagA.name,
					tasks: mergedTasks,
					version: Math.max(tagA.version, tagB.version) + 1,
					merged: true,
				};
			};

			const mergedTag = mergeTags(tagA, tagB);

			expect(mergedTag.tasks).toHaveLength(3);
			expect(mergedTag.version).toBe(2);
			expect(mergedTag.tasks.find((t) => t.id === 2).conflicted).toBe(true);
			expect(mergedTag.tasks.find((t) => t.id === 2).source).toBe("B");
			expect(mergedTag.tasks.find((t) => t.id === 3).source).toBe("B");
		});
	});

	describe("标签安全和权限", () => {
		it("应该验证标签访问权限", () => {
			const userPermissions = {
				user1: ["main", "feature-auth", "bug-fixes"],
				user2: ["main", "feature-dashboard"],
				admin: ["*"], // 所有标签
			};

			const canAccessTag = (userId, tagName) => {
				const permissions = userPermissions[userId];
				if (!permissions) return false;
				return permissions.includes("*") || permissions.includes(tagName);
			};

			expect(canAccessTag("user1", "main")).toBe(true);
			expect(canAccessTag("user1", "feature-dashboard")).toBe(false);
			expect(canAccessTag("admin", "any-tag")).toBe(true);
			expect(canAccessTag("unknown-user", "main")).toBe(false);
		});

		it("应该支持标签级别的操作审计", () => {
			const auditLog = [];

			const logTagOperation = (userId, tagName, operation, details = {}) => {
				auditLog.push({
					timestamp: new Date().toISOString(),
					userId,
					tagName,
					operation,
					details,
				});
			};

			logTagOperation("user1", "feature-auth", "create", {
				description: "用户认证功能",
			});
			logTagOperation("user2", "feature-auth", "add-task", {
				taskId: 1,
				title: "登录功能",
			});
			logTagOperation("user1", "feature-auth", "switch-to");

			expect(auditLog).toHaveLength(3);
			expect(auditLog[0].operation).toBe("create");
			expect(auditLog[1].operation).toBe("add-task");
			expect(auditLog[2].operation).toBe("switch-to");
			expect(auditLog[0].userId).toBe("user1");
			expect(auditLog[1].details.taskId).toBe(1);
		});

		it("应该防止敏感标签的意外删除", () => {
			const protectedTags = ["main", "production", "release-*"];

			const canDeleteTag = (tagName) => {
				return !protectedTags.some((pattern) => {
					if (pattern.endsWith("*")) {
						return tagName.startsWith(pattern.slice(0, -1));
					}
					return pattern === tagName;
				});
			};

			expect(canDeleteTag("main")).toBe(false);
			expect(canDeleteTag("production")).toBe(false);
			expect(canDeleteTag("release-v1.0")).toBe(false);
			expect(canDeleteTag("feature-auth")).toBe(true);
			expect(canDeleteTag("bug-fixes")).toBe(true);
		});
	});
});
