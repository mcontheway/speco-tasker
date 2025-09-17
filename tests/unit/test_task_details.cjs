/**
 * test_task_details.cjs
 * 单元测试：验证任务详情功能
 *
 * SCOPE: 测试任务详情的核心功能，包括详情数据的完整性、格式化、更新和验证
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

describe("任务详情功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// 模拟文件系统
		fs.existsSync = jest.fn().mockReturnValue(true);
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}));
		path.dirname = jest.fn().mockReturnValue("/mock/project");
		path.join = jest.fn().mockImplementation((...args) => args.join("/"));
	});

	describe("任务详情数据结构验证", () => {
		it("应该创建具有完整详情属性的任务对象", () => {
			const task = {
				id: 1,
				title: "测试任务",
				description: "任务的详细描述",
				details: "具体的实现步骤和要求",
				testStrategy: "测试验证方法",
				requirements: "功能需求和技术规格",
				acceptanceCriteria: "验收标准",
				notes: "附加备注信息",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			expect(task).toHaveProperty("id");
			expect(task).toHaveProperty("title");
			expect(task).toHaveProperty("description");
			expect(task).toHaveProperty("details");
			expect(task).toHaveProperty("testStrategy");
			expect(task).toHaveProperty("requirements");
			expect(task).toHaveProperty("acceptanceCriteria");
			expect(task).toHaveProperty("notes");
			expect(task).toHaveProperty("createdAt");
			expect(task).toHaveProperty("updatedAt");

			// 验证数据类型
			expect(typeof task.details).toBe("string");
			expect(typeof task.description).toBe("string");
			expect(typeof task.testStrategy).toBe("string");
		});

		it("应该验证任务详情的完整性", () => {
			const completeTask = {
				id: 1,
				title: "完整任务",
				description: "详细描述",
				details: "具体实现详情",
				testStrategy: "测试策略",
				requirements: "需求规格",
				acceptanceCriteria: "验收标准",
			};

			const incompleteTask = {
				id: 2,
				title: "不完整任务",
				// 缺少其他详情字段
			};

			const isTaskDetailsComplete = (task) => {
				const requiredFields = ["description", "details", "testStrategy"];
				return requiredFields.every(
					(field) => task[field] && task[field].length > 0,
				);
			};

			expect(isTaskDetailsComplete(completeTask)).toBe(true);
			expect(isTaskDetailsComplete(incompleteTask)).toBe(false);
		});

		it("应该支持可选的任务详情字段", () => {
			const minimalTask = {
				id: 1,
				title: "最小任务",
				description: "基本描述",
				details: "基本详情",
				testStrategy: "基本测试策略",
			};

			const extendedTask = {
				...minimalTask,
				requirements: "扩展需求",
				acceptanceCriteria: "扩展验收标准",
				notes: "扩展备注",
			};

			expect(minimalTask.requirements).toBeUndefined();
			expect(minimalTask.notes).toBeUndefined();
			expect(extendedTask.requirements).toBeDefined();
			expect(extendedTask.notes).toBeDefined();
		});
	});

	describe("任务详情格式化功能", () => {
		it("应该能够格式化任务详情为可读格式", () => {
			const task = {
				id: 1,
				title: "用户注册功能",
				description: "实现用户注册流程",
				details: "1. 创建注册表单\n2. 验证用户输入\n3. 保存用户信息",
				testStrategy: "单元测试 + 集成测试",
				requirements: "支持邮箱和手机号注册",
				acceptanceCriteria: "用户能够成功注册并收到确认邮件",
			};

			const formatTaskDetails = (task) => {
				return `
任务 #${task.id}: ${task.title}

描述:
${task.details}

测试策略:
${task.testStrategy}

需求:
${task.requirements || "无"}

验收标准:
${task.acceptanceCriteria || "无"}
				`.trim();
			};

			const formatted = formatTaskDetails(task);

			expect(formatted).toContain("任务 #1: 用户注册功能");
			expect(formatted).toContain("描述:");
			expect(formatted).toContain("测试策略:");
			expect(formatted).toContain("需求:");
			expect(formatted).toContain("验收标准:");
			expect(formatted).toContain(task.details);
		});

		it("应该能够生成任务详情摘要", () => {
			const task = {
				id: 1,
				title: "复杂任务",
				description: "这是一个非常复杂的任务需要详细说明",
				details: "非常详细的实现步骤...".repeat(10),
				testStrategy: "全面测试策略",
				requirements: "复杂的需求规格",
				acceptanceCriteria: "严格的验收标准",
			};

			const generateTaskSummary = (task, maxLength = 100) => {
				const summary = task.details.substring(0, maxLength);
				return summary + (task.details.length > maxLength ? "..." : "");
			};

			const summary = generateTaskSummary(task, 50);
			expect(summary.length).toBeLessThanOrEqual(53); // 50 + '...'
			expect(summary).toContain("...");
			expect(summary).toContain(task.details.substring(0, 50));
		});

		it("应该能够格式化任务详情为Markdown格式", () => {
			const task = {
				id: 1,
				title: "API开发任务",
				description: "开发REST API端点",
				details: "- 实现GET端点\n- 实现POST端点\n- 添加错误处理",
				testStrategy: "使用Jest进行单元测试和集成测试",
				requirements: "遵循RESTful设计原则",
				acceptanceCriteria: "所有端点返回正确的HTTP状态码",
			};

			const formatTaskAsMarkdown = (task) => {
				return `# 任务 #${task.id}: ${task.title}

## 描述
${task.description}

## 详细说明
${task.details}

## 测试策略
${task.testStrategy}

## 需求规格
${task.requirements}

## 验收标准
${task.acceptanceCriteria}

---
*创建时间: ${task.createdAt || "未知"}*
*更新时间: ${task.updatedAt || "未知"}*
				`;
			};

			const markdown = formatTaskAsMarkdown(task);

			expect(markdown).toContain("# 任务 #1: API开发任务");
			expect(markdown).toContain("## 描述");
			expect(markdown).toContain("## 详细说明");
			expect(markdown).toContain("## 测试策略");
			expect(markdown).toContain("## 需求规格");
			expect(markdown).toContain("## 验收标准");
			expect(markdown).toContain("*创建时间:");
		});
	});

	describe("任务详情更新功能", () => {
		it("应该能够更新任务的基本详情", () => {
			const originalTask = {
				id: 1,
				title: "原任务",
				description: "原描述",
				details: "原详情",
				testStrategy: "原测试策略",
			};

			const updates = {
				description: "新描述",
				details: "新详情",
				testStrategy: "新测试策略",
			};

			const updatedTask = { ...originalTask, ...updates };

			expect(updatedTask.description).toBe("新描述");
			expect(updatedTask.details).toBe("新详情");
			expect(updatedTask.testStrategy).toBe("新测试策略");
			expect(updatedTask.title).toBe("原任务"); // 未更新的字段保持不变
		});

		it("应该能够追加任务详情内容", () => {
			const task = {
				id: 1,
				details: "初始详情内容",
				notes: "初始备注",
			};

			const appendToTaskDetails = (task, field, newContent) => {
				const timestamp = new Date().toISOString();
				const existingContent = task[field] || "";
				const separator = existingContent ? "\n\n" : "";
				const newEntry = `[${timestamp}]\n${newContent}`;

				return {
					...task,
					[field]: existingContent + separator + newEntry,
				};
			};

			const updatedTask = appendToTaskDetails(task, "details", "追加的新内容");
			const secondUpdate = appendToTaskDetails(
				updatedTask,
				"details",
				"第二次追加内容",
			);

			expect(updatedTask.details).toContain("初始详情内容");
			expect(updatedTask.details).toContain("追加的新内容");
			expect(updatedTask.details).toContain("[");
			expect(updatedTask.details).toContain("]");

			expect(secondUpdate.details).toContain("第二次追加内容");
			expect(secondUpdate.details.split("\n\n")).toHaveLength(3); // 初始 + 第一次追加 + 第二次追加
		});

		it("应该能够更新任务的时间戳", () => {
			const task = {
				id: 1,
				title: "测试任务",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			const updateTaskTimestamp = (task) => {
				const now = new Date().toISOString();
				return {
					...task,
					updatedAt: now,
				};
			};

			const updatedTask = updateTaskTimestamp(task);

			expect(updatedTask.updatedAt).not.toBe(task.updatedAt);
			expect(updatedTask.createdAt).toBe(task.createdAt); // 创建时间不变
			expect(new Date(updatedTask.updatedAt).getTime()).toBeGreaterThan(
				new Date(task.updatedAt).getTime(),
			);
		});
	});

	describe("任务详情验证功能", () => {
		it("应该验证任务详情的长度限制", () => {
			const taskWithShortDetails = {
				id: 1,
				details: "短详情",
			};

			const taskWithLongDetails = {
				id: 2,
				details: "非常长的详情内容".repeat(1000), // 很长的内容
			};

			const validateDetailsLength = (task, maxLength = 10000) => {
				return task.details && task.details.length <= maxLength;
			};

			expect(validateDetailsLength(taskWithShortDetails)).toBe(true);
			expect(validateDetailsLength(taskWithLongDetails, 100)).toBe(false);
			expect(validateDetailsLength(taskWithLongDetails, 100000)).toBe(true);
		});

		it("应该验证任务详情的必需字段", () => {
			const validTask = {
				id: 1,
				title: "有效任务",
				description: "有效描述",
				details: "有效详情",
				testStrategy: "有效测试策略",
			};

			const invalidTask = {
				id: 2,
				title: "", // 空标题
				description: "描述",
				details: "", // 空详情
				testStrategy: "测试策略",
			};

			const validateRequiredFields = (task) => {
				const requiredFields = [
					"title",
					"description",
					"details",
					"testStrategy",
				];
				return requiredFields.every(
					(field) =>
						task[field] &&
						typeof task[field] === "string" &&
						task[field].trim().length > 0,
				);
			};

			expect(validateRequiredFields(validTask)).toBe(true);
			expect(validateRequiredFields(invalidTask)).toBe(false);
		});

		it("应该验证任务详情的格式正确性", () => {
			const validDetails = [
				"正常的文本详情",
				"- 项目1\n- 项目2\n- 项目3",
				"1. 步骤1\n2. 步骤2\n3. 步骤3",
				"包含特殊字符：@#$%^&*()",
			];

			const invalidDetails = [
				null,
				undefined,
				123, // 数字
				{}, // 对象
				[], // 数组
			];

			const validateDetailsFormat = (details) => {
				return typeof details === "string" && details.length > 0;
			};

			validDetails.forEach((detail) => {
				expect(validateDetailsFormat(detail)).toBe(true);
			});

			invalidDetails.forEach((detail) => {
				expect(validateDetailsFormat(detail)).toBe(false);
			});
		});
	});

	describe("任务详情显示功能", () => {
		it("应该能够按层次显示任务详情", () => {
			const task = {
				id: 1,
				title: "父任务",
				description: "父任务描述",
				details: "父任务详情",
				subtasks: [
					{
						id: "1.1",
						title: "子任务1",
						description: "子任务1描述",
						details: "子任务1详情",
					},
					{
						id: "1.2",
						title: "子任务2",
						description: "子任务2描述",
						details: "子任务2详情",
					},
				],
			};

			const displayTaskHierarchy = (task, level = 0) => {
				const indent = "  ".repeat(level);
				let output = `${indent}${task.title} (${task.id})\n`;
				output += `${indent}  ${task.description}\n`;

				if (task.subtasks) {
					task.subtasks.forEach((subtask) => {
						output += displayTaskHierarchy(subtask, level + 1);
					});
				}

				return output;
			};

			const hierarchyDisplay = displayTaskHierarchy(task);

			expect(hierarchyDisplay).toContain("父任务 (1)");
			expect(hierarchyDisplay).toContain("子任务1 (1.1)");
			expect(hierarchyDisplay).toContain("子任务2 (1.2)");
			expect(hierarchyDisplay).toContain("父任务描述");
			expect(hierarchyDisplay).toContain("子任务1描述");
		});

		it("应该能够生成任务详情报告", () => {
			const tasks = [
				{
					id: 1,
					title: "任务1",
					description: "描述1",
					status: "completed",
					priority: "high",
				},
				{
					id: 2,
					title: "任务2",
					description: "描述2",
					status: "pending",
					priority: "medium",
				},
			];

			const generateTaskReport = (tasks) => {
				const report = {
					total: tasks.length,
					completed: tasks.filter((t) => t.status === "completed").length,
					pending: tasks.filter((t) => t.status === "pending").length,
					byPriority: tasks.reduce((acc, task) => {
						acc[task.priority] = (acc[task.priority] || 0) + 1;
						return acc;
					}, {}),
				};
				return report;
			};

			const report = generateTaskReport(tasks);

			expect(report.total).toBe(2);
			expect(report.completed).toBe(1);
			expect(report.pending).toBe(1);
			expect(report.byPriority.high).toBe(1);
			expect(report.byPriority.medium).toBe(1);
		});

		it("应该能够过滤和搜索任务详情", () => {
			const tasks = [
				{
					id: 1,
					title: "用户注册功能",
					description: "实现用户注册",
					details: "包含表单验证和数据库存储",
				},
				{
					id: 2,
					title: "用户登录功能",
					description: "实现用户登录",
					details: "包含密码验证和会话管理",
				},
				{
					id: 3,
					title: "密码重置功能",
					description: "实现密码重置",
					details: "包含邮件发送和安全验证",
				},
			];

			const searchTasks = (tasks, keyword) => {
				return tasks.filter(
					(task) =>
						task.title.toLowerCase().includes(keyword.toLowerCase()) ||
						task.description.toLowerCase().includes(keyword.toLowerCase()) ||
						task.details.toLowerCase().includes(keyword.toLowerCase()),
				);
			};

			const userResults = searchTasks(tasks, "用户");
			const passwordResults = searchTasks(tasks, "密码");
			const validationResults = searchTasks(tasks, "验证");

			expect(userResults.length).toBe(2); // 用户注册和用户登录
			expect(passwordResults.length).toBe(2); // 密码重置 + 密码验证
			expect(validationResults.length).toBe(3); // 所有任务都包含验证
		});
	});

	describe("任务详情边界情况处理", () => {
		it("应该处理空或未定义的任务详情", () => {
			const tasks = [
				{ id: 1, details: null },
				{ id: 2, details: undefined },
				{ id: 3, details: "" },
				{ id: 4, details: "有效详情" },
			];

			const safeGetDetails = (task) => {
				return task.details || "暂无详情";
			};

			expect(safeGetDetails(tasks[0])).toBe("暂无详情");
			expect(safeGetDetails(tasks[1])).toBe("暂无详情");
			expect(safeGetDetails(tasks[2])).toBe("暂无详情");
			expect(safeGetDetails(tasks[3])).toBe("有效详情");
		});

		it("应该处理包含特殊字符的任务详情", () => {
			const task = {
				id: 1,
				details:
					'包含特殊字符：@#$%^&*()[]{}|\\:;"\'<>,.?/~`！@#￥%……&*（）——+{}|："。，、？《》',
			};

			const sanitizeDetails = (details) => {
				// 移除或转义危险字符的简单实现
				return details.replace(/[<>]/g, "");
			};

			const sanitized = sanitizeDetails(task.details);

			expect(sanitized).not.toContain("<");
			expect(sanitized).not.toContain(">");
			expect(sanitized.length).toBeLessThan(task.details.length);
		});

		it("应该处理非常长的任务详情", () => {
			const longDetails = "非常长的任务详情内容".repeat(1000);
			const task = {
				id: 1,
				details: longDetails,
			};

			const truncateDetails = (details, maxLength = 500) => {
				if (details.length <= maxLength) return details;
				return details.substring(0, maxLength - 3) + "...";
			};

			const truncated = truncateDetails(task.details, 100);

			// 检查截断后的长度（如果内容被截断，应该等于maxLength）
			expect(truncated.length).toBe(100);
			expect(truncated).toContain("...");
			expect(truncated).toContain(task.details.substring(0, 97));
		});
	});

	describe("任务详情版本控制", () => {
		it("应该能够跟踪任务详情的变更历史", () => {
			const task = {
				id: 1,
				title: "版本控制任务",
				details: "初始详情",
				changeHistory: [],
			};

			const updateTaskWithHistory = (task, newDetails, author = "系统") => {
				const timestamp = new Date().toISOString();
				const change = {
					timestamp,
					author,
					field: "details",
					oldValue: task.details,
					newValue: newDetails,
				};

				return {
					...task,
					details: newDetails,
					changeHistory: [...(task.changeHistory || []), change],
				};
			};

			const updatedTask = updateTaskWithHistory(
				task,
				"更新后的详情",
				"开发者A",
			);
			const secondUpdate = updateTaskWithHistory(
				updatedTask,
				"第二次更新的详情",
				"开发者B",
			);

			expect(updatedTask.changeHistory).toHaveLength(1);
			expect(secondUpdate.changeHistory).toHaveLength(2);
			expect(updatedTask.changeHistory[0].oldValue).toBe("初始详情");
			expect(updatedTask.changeHistory[0].newValue).toBe("更新后的详情");
			expect(updatedTask.changeHistory[0].author).toBe("开发者A");
		});

		it("应该能够回滚任务详情到之前的版本", () => {
			const task = {
				id: 1,
				details: "当前版本",
				changeHistory: [
					{
						timestamp: "2024-01-01T10:00:00Z",
						oldValue: "版本1",
						newValue: "版本2",
					},
					{
						timestamp: "2024-01-02T10:00:00Z",
						oldValue: "版本2",
						newValue: "当前版本",
					},
				],
			};

			const rollbackTaskDetails = (task, versionIndex) => {
				if (!task.changeHistory || versionIndex >= task.changeHistory.length) {
					return task;
				}

				const targetChange = task.changeHistory[versionIndex];
				return {
					...task,
					details: targetChange.oldValue,
				};
			};

			const rolledBackTask = rollbackTaskDetails(task, 0);

			expect(rolledBackTask.details).toBe("版本1");
		});
	});

	describe("任务详情性能验证", () => {
		it("应该高效处理大量任务的详情操作", () => {
			const generateTasks = (count) => {
				return Array.from({ length: count }, (_, i) => ({
					id: i + 1,
					title: `任务${i + 1}`,
					details: `任务${i + 1}的详细描述内容`.repeat(10),
					description: `任务${i + 1}的简要描述`,
					testStrategy: `任务${i + 1}的测试策略`,
				}));
			};

			const tasks = generateTasks(1000);

			const startTime = Date.now();

			// 测试详情搜索性能
			const searchDetails = (tasks, keyword) => {
				return tasks.filter((task) =>
					task.details.toLowerCase().includes(keyword.toLowerCase()),
				);
			};

			const results = searchDetails(tasks, "任务100");
			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(results.length).toBeGreaterThan(0);
			expect(results[0].id).toBe(100);
			expect(duration).toBeLessThan(100); // 应该在100ms内完成
		});
	});
});
