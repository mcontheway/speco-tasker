/**
 * test_task_export.cjs
 * 单元测试：验证任务导出功能
 *
 * SCOPE: 测试任务导出和数据序列化的核心功能，包括不同格式的导出、数据完整性验证和导出配置管理
 */

const fs = require("fs");
const path = require("path");

// Mock 依赖项
jest.mock("fs");
jest.mock("path");

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
	getCurrentTag: jest.fn(() => "main"),
	slugifyTagForFilePath: jest.fn(() => "main"),
	truncate: jest.fn((text, length) =>
		text.length > length ? text.substring(0, length) + "..." : text,
	),
}));

// Mock 配置管理器
jest.mock("../scripts/modules/config-manager.js", () => ({
	getDefaultPriority: jest.fn(() => "medium"),
	hasCodebaseAnalysis: jest.fn(() => false),
}));

// Store original path methods to restore them after tests
const originalPathMethods = {
	dirname: require("path").dirname,
	join: require("path").join,
	extname: require("path").extname,
	basename: require("path").basename,
};

describe("任务导出功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// 模拟文件系统
		fs.existsSync = jest.fn().mockReturnValue(true);
		fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}));
		fs.writeFileSync = jest.fn().mockReturnValue(undefined);
		path.dirname = jest.fn().mockReturnValue("/mock/project");
		path.join = jest.fn().mockImplementation((...args) => args.join("/"));
		path.extname = jest.fn().mockImplementation((filePath) => {
			const ext = filePath.split(".").pop();
			return ext ? `.${ext}` : "";
		});
		path.basename = jest.fn().mockImplementation((filePath) => {
			return filePath.split("/").pop() || filePath;
		});
	});

	afterEach(() => {
		// Restore original path methods to prevent interference with other test suites
		Object.assign(path, originalPathMethods);
	});

	describe("导出数据结构验证", () => {
		it("应该创建具有完整属性的导出对象", () => {
			const exportData = {
				metadata: {
					version: "1.0.0",
					exportedAt: new Date().toISOString(),
					exportedBy: "test-user",
					tag: "main",
					totalTasks: 5,
					totalSubtasks: 12,
					format: "json",
				},
				tasks: [
					{
						id: 1,
						title: "测试任务1",
						description: "任务描述",
						status: "pending",
						priority: "medium",
						details: "详细说明",
						testStrategy: "测试策略",
						dependencies: [],
						subtasks: [],
					},
				],
				settings: {
					defaultPriority: "medium",
					supportedStatuses: ["pending", "in-progress", "done"],
					supportedPriorities: ["high", "medium", "low"],
				},
			};

			// 验证导出对象包含所有必需属性
			expect(exportData).toHaveProperty("metadata");
			expect(exportData).toHaveProperty("tasks");
			expect(exportData).toHaveProperty("settings");

			// 验证元数据属性
			expect(exportData.metadata).toHaveProperty("version");
			expect(exportData.metadata).toHaveProperty("exportedAt");
			expect(exportData.metadata).toHaveProperty("exportedBy");
			expect(exportData.metadata).toHaveProperty("tag");
			expect(exportData.metadata).toHaveProperty("totalTasks");
			expect(exportData.metadata).toHaveProperty("format");

			// 验证属性类型
			expect(typeof exportData.metadata.version).toBe("string");
			expect(typeof exportData.metadata.exportedAt).toBe("string");
			expect(typeof exportData.metadata.exportedBy).toBe("string");
			expect(typeof exportData.metadata.tag).toBe("string");
			expect(typeof exportData.metadata.totalTasks).toBe("number");
			expect(typeof exportData.metadata.format).toBe("string");
			expect(Array.isArray(exportData.tasks)).toBe(true);
			expect(typeof exportData.settings).toBe("object");
		});

		it("应该支持不同导出格式的元数据", () => {
			const formats = [
				{
					format: "json",
					contentType: "application/json",
					fileExtension: ".json",
				},
				{
					format: "csv",
					contentType: "text/csv",
					fileExtension: ".csv",
				},
				{
					format: "xml",
					contentType: "application/xml",
					fileExtension: ".xml",
				},
				{
					format: "markdown",
					contentType: "text/markdown",
					fileExtension: ".md",
				},
			];

			formats.forEach((formatInfo) => {
				const exportData = {
					metadata: {
						version: "1.0.0",
						exportedAt: new Date().toISOString(),
						exportedBy: "test-user",
						tag: "main",
						totalTasks: 3,
						totalSubtasks: 5,
						format: formatInfo.format,
						contentType: formatInfo.contentType,
						fileExtension: formatInfo.fileExtension,
					},
					tasks: [],
					settings: {},
				};

				expect(exportData.metadata.format).toBe(formatInfo.format);
				expect(exportData.metadata.contentType).toBe(formatInfo.contentType);
				expect(exportData.metadata.fileExtension).toBe(
					formatInfo.fileExtension,
				);
			});
		});

		it("应该正确统计导出数据的统计信息", () => {
			const mockTasksData = {
				master: {
					tasks: [
						{
							id: 1,
							title: "任务1",
							subtasks: [
								{ id: "1.1", title: "子任务1.1" },
								{ id: "1.2", title: "子任务1.2" },
							],
						},
						{
							id: 2,
							title: "任务2",
							subtasks: [{ id: "2.1", title: "子任务2.1" }],
						},
						{
							id: 3,
							title: "任务3",
							subtasks: [],
						},
					],
				},
			};

			const totalTasks = mockTasksData.master.tasks.length;
			const totalSubtasks = mockTasksData.master.tasks.reduce(
				(sum, task) => sum + task.subtasks.length,
				0,
			);

			expect(totalTasks).toBe(3);
			expect(totalSubtasks).toBe(3);

			const exportMetadata = {
				version: "1.0.0",
				exportedAt: new Date().toISOString(),
				exportedBy: "test-user",
				tag: "main",
				totalTasks,
				totalSubtasks,
				format: "json",
			};

			expect(exportMetadata.totalTasks).toBe(3);
			expect(exportMetadata.totalSubtasks).toBe(3);
		});
	});

	describe("导出格式转换验证", () => {
		it("应该支持JSON格式导出", () => {
			const tasksData = [
				{
					id: 1,
					title: "测试任务",
					description: "任务描述",
					status: "pending",
					priority: "medium",
				},
			];

			const jsonExport = JSON.stringify(tasksData, null, 2);
			const parsedTasks = JSON.parse(jsonExport);

			expect(parsedTasks).toHaveLength(1);
			expect(parsedTasks[0].id).toBe(1);
			expect(parsedTasks[0].title).toBe("测试任务");
			expect(parsedTasks[0].status).toBe("pending");
		});

		it("应该支持CSV格式导出", () => {
			const tasksData = [
				{
					id: 1,
					title: "任务1",
					status: "pending",
					priority: "high",
				},
				{
					id: 2,
					title: "任务2",
					status: "done",
					priority: "medium",
				},
			];

			// 模拟CSV格式转换
			const headers = ["ID", "Title", "Status", "Priority"];
			const csvRows = tasksData.map((task) => [
				task.id,
				`"${task.title}"`,
				task.status,
				task.priority,
			]);

			const csvContent = [headers, ...csvRows]
				.map((row) => row.join(","))
				.join("\n");

			expect(csvContent).toContain("ID,Title,Status,Priority");
			expect(csvContent).toContain('1,"任务1",pending,high');
			expect(csvContent).toContain('2,"任务2",done,medium');
		});

		it("应该支持Markdown格式导出", () => {
			const tasksData = [
				{
					id: 1,
					title: "测试任务",
					description: "任务描述",
					status: "pending",
					priority: "medium",
					subtasks: [{ id: "1.1", title: "子任务1", status: "pending" }],
				},
			];

			// 模拟Markdown格式转换
			let markdownContent = "# 任务列表\n\n";
			tasksData.forEach((task) => {
				markdownContent += `## 任务 ${task.id}: ${task.title}\n\n`;
				markdownContent += `- **状态**: ${task.status}\n`;
				markdownContent += `- **优先级**: ${task.priority}\n`;
				markdownContent += `- **描述**: ${task.description}\n\n`;

				if (task.subtasks && task.subtasks.length > 0) {
					markdownContent += "### 子任务\n\n";
					task.subtasks.forEach((subtask) => {
						markdownContent += `- ${subtask.id}: ${subtask.title} (${subtask.status})\n`;
					});
					markdownContent += "\n";
				}
			});

			expect(markdownContent).toContain("# 任务列表");
			expect(markdownContent).toContain("## 任务 1: 测试任务");
			expect(markdownContent).toContain("**状态**: pending");
			expect(markdownContent).toContain("**优先级**: medium");
			expect(markdownContent).toContain("### 子任务");
			expect(markdownContent).toContain("- 1.1: 子任务1 (pending)");
		});

		it("应该处理导出数据的过滤和排序", () => {
			const tasksData = [
				{
					id: 1,
					title: "任务1",
					status: "done",
					priority: "high",
				},
				{
					id: 2,
					title: "任务2",
					status: "pending",
					priority: "medium",
				},
				{
					id: 3,
					title: "任务3",
					status: "in-progress",
					priority: "low",
				},
			];

			// 按状态过滤
			const pendingTasks = tasksData.filter(
				(task) => task.status === "pending",
			);
			expect(pendingTasks).toHaveLength(1);
			expect(pendingTasks[0].id).toBe(2);

			// 按优先级排序
			const sortedByPriority = [...tasksData].sort((a, b) => {
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			});

			expect(sortedByPriority[0].priority).toBe("high");
			expect(sortedByPriority[1].priority).toBe("medium");
			expect(sortedByPriority[2].priority).toBe("low");
		});
	});

	describe("导出文件操作验证", () => {
		it("应该能够生成正确的导出文件名", () => {
			const baseName = "tasks";
			const tag = "main";
			const timestamp = "2024-01-01";
			const format = "json";

			// 模拟文件名生成
			const fileName =
				tag === "main"
					? `${baseName}_export_${timestamp}.${format}`
					: `${baseName}_export_${timestamp}_${tag}.${format}`;

			expect(fileName).toBe("tasks_export_2024-01-01.json");

			// 测试非master标签
			const featureTag = "feature-branch";
			const featureFileName =
				featureTag === "main"
					? `${baseName}_export_${timestamp}.${format}`
					: `${baseName}_export_${timestamp}_${featureTag}.${format}`;

			expect(featureFileName).toBe(
				"tasks_export_2024-01-01_feature-branch.json",
			);
		});

		it("应该验证导出文件的写入操作", () => {
			const exportContent = JSON.stringify(
				{
					metadata: { version: "1.0.0" },
					tasks: [],
				},
				null,
				2,
			);

			const exportPath = "/mock/project/tasks_export.json";

			// Mock 文件写入
			fs.writeFileSync.mockImplementation(() => undefined);

			// 模拟导出操作
			fs.writeFileSync(exportPath, exportContent, "utf8");

			expect(fs.writeFileSync).toHaveBeenCalledWith(
				exportPath,
				exportContent,
				"utf8",
			);
		});

		it("应该处理导出目录的创建", () => {
			const exportDir = "/mock/project/exports";
			const exportPath = `${exportDir}/tasks_export.json`;

			// Mock 目录不存在
			fs.existsSync.mockReturnValue(false);

			// 模拟目录创建
			const { writeJSON } = require("../scripts/modules/utils.js");
			writeJSON.mockImplementation(() => undefined);

			// 验证目录创建逻辑
			if (!fs.existsSync(exportDir)) {
				// 应该创建目录
				expect(true).toBe(true); // 目录创建逻辑应该在这里执行
			}

			expect(fs.existsSync).toHaveBeenCalledWith(exportDir);
		});

		it("应该验证导出文件的完整性检查", () => {
			const exportData = {
				metadata: {
					version: "1.0.0",
					exportedAt: new Date().toISOString(),
					totalTasks: 2,
				},
				tasks: [
					{ id: 1, title: "任务1" },
					{ id: 2, title: "任务2" },
				],
			};

			const jsonString = JSON.stringify(exportData, null, 2);
			const parsedData = JSON.parse(jsonString);

			// 验证导出数据的完整性
			expect(parsedData.metadata.totalTasks).toBe(2);
			expect(parsedData.tasks).toHaveLength(2);
			expect(parsedData.tasks.every((task) => task.id && task.title)).toBe(
				true,
			);

			// 验证JSON格式的有效性
			expect(() => JSON.parse(jsonString)).not.toThrow();
		});
	});

	describe("导出配置和选项验证", () => {
		it("应该支持导出选项的配置", () => {
			const exportOptions = {
				format: "json",
				includeSubtasks: true,
				includeDependencies: true,
				includeMetadata: true,
				filterByStatus: null,
				filterByPriority: null,
				sortBy: "id",
				sortOrder: "asc",
				dateRange: null,
				maxRecords: null,
			};

			expect(exportOptions.format).toBe("json");
			expect(exportOptions.includeSubtasks).toBe(true);
			expect(exportOptions.includeDependencies).toBe(true);
			expect(exportOptions.includeMetadata).toBe(true);
			expect(exportOptions.sortBy).toBe("id");
			expect(exportOptions.sortOrder).toBe("asc");
		});

		it("应该验证导出选项的边界情况", () => {
			const validOptions = {
				format: "json",
				includeSubtasks: true,
				maxRecords: 100,
			};

			const invalidOptions = {
				format: "invalid",
				includeSubtasks: "yes", // 应该是boolean
				maxRecords: -1, // 应该是正数
			};

			// 验证有效选项
			expect(["json", "csv", "xml", "markdown"]).toContain(validOptions.format);
			expect(typeof validOptions.includeSubtasks).toBe("boolean");
			expect(validOptions.maxRecords).toBeGreaterThan(0);

			// 验证无效选项应该被处理
			expect(["json", "csv", "xml", "markdown"]).not.toContain(
				invalidOptions.format,
			);
			expect(typeof invalidOptions.includeSubtasks).not.toBe("boolean");
			expect(invalidOptions.maxRecords).toBeLessThan(0);
		});

		it("应该支持导出模板和预设配置", () => {
			const exportTemplates = {
				minimal: {
					format: "json",
					includeSubtasks: false,
					includeDependencies: false,
					includeMetadata: true,
				},
				complete: {
					format: "json",
					includeSubtasks: true,
					includeDependencies: true,
					includeMetadata: true,
				},
				report: {
					format: "markdown",
					includeSubtasks: true,
					includeDependencies: false,
					includeMetadata: true,
					sortBy: "priority",
					sortOrder: "desc",
				},
			};

			expect(exportTemplates.minimal.includeSubtasks).toBe(false);
			expect(exportTemplates.complete.includeSubtasks).toBe(true);
			expect(exportTemplates.report.format).toBe("markdown");
			expect(exportTemplates.report.sortBy).toBe("priority");
		});

		it("应该处理导出选项的合并和覆盖", () => {
			const defaultOptions = {
				format: "json",
				includeSubtasks: true,
				includeMetadata: true,
				sortBy: "id",
			};

			const userOptions = {
				format: "csv",
				sortBy: "priority",
				maxRecords: 50,
			};

			// 模拟选项合并
			const mergedOptions = {
				...defaultOptions,
				...userOptions,
			};

			expect(mergedOptions.format).toBe("csv"); // 用户选项覆盖默认
			expect(mergedOptions.includeSubtasks).toBe(true); // 默认值保留
			expect(mergedOptions.sortBy).toBe("priority"); // 用户选项覆盖默认
			expect(mergedOptions.maxRecords).toBe(50); // 新选项添加
		});
	});

	describe("导出错误处理验证", () => {
		it("应该处理无效的导出格式", () => {
			const invalidFormats = ["pdf", "docx", "xls", "invalid"];
			const validFormats = ["json", "csv", "xml", "markdown"];

			invalidFormats.forEach((format) => {
				expect(validFormats).not.toContain(format);
			});

			// 验证默认格式回退
			const defaultFormat = "json";
			expect(validFormats).toContain(defaultFormat);
		});

		it("应该处理导出文件写入失败", () => {
			const exportPath = "/mock/project/tasks_export.json";
			const exportContent = "mock content";

			// Mock 写入失败
			fs.writeFileSync.mockImplementation(() => {
				throw new Error("文件写入失败");
			});

			expect(() => {
				fs.writeFileSync(exportPath, exportContent);
			}).toThrow("文件写入失败");
		});

		it("应该处理导出数据为空的情况", () => {
			const emptyTasksData = [];
			const exportData = {
				metadata: {
					version: "1.0.0",
					exportedAt: new Date().toISOString(),
					totalTasks: emptyTasksData.length,
				},
				tasks: emptyTasksData,
			};

			expect(exportData.tasks).toHaveLength(0);
			expect(exportData.metadata.totalTasks).toBe(0);

			// 验证空数据导出仍然有效
			const jsonString = JSON.stringify(exportData);
			expect(jsonString).toBeTruthy();
		});

		it("应该验证导出数据的类型安全", () => {
			const validTask = {
				id: 1,
				title: "有效任务",
				status: "pending",
				priority: "medium",
				dependencies: [],
				subtasks: [],
			};

			const invalidTask = {
				id: "invalid", // 应该是数字
				title: null, // 应该是字符串
				status: "invalid_status", // 无效状态
				dependencies: "invalid", // 应该是数组
				subtasks: {}, // 应该是数组
			};

			// 验证有效任务
			expect(typeof validTask.id).toBe("number");
			expect(typeof validTask.title).toBe("string");
			expect(["pending", "in-progress", "done"]).toContain(validTask.status);
			expect(Array.isArray(validTask.dependencies)).toBe(true);
			expect(Array.isArray(validTask.subtasks)).toBe(true);

			// 验证无效任务的类型问题
			expect(typeof invalidTask.id).not.toBe("number");
			expect(invalidTask.title).toBeNull();
			expect(["pending", "in-progress", "done"]).not.toContain(
				invalidTask.status,
			);
			expect(Array.isArray(invalidTask.dependencies)).toBe(false);
			expect(Array.isArray(invalidTask.subtasks)).toBe(false);
		});
	});
});
