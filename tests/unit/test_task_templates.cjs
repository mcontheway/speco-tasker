/**
 * test_task_templates.cjs
 * 单元测试：验证任务模板功能
 *
 * SCOPE: 测试任务模板的创建、管理、参数替换和应用
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

describe("任务模板功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("模板数据结构", () => {
		it("应该正确定义模板对象结构", () => {
			const template = {
				id: "feature-template",
				name: "功能开发模板",
				description: "用于新功能开发的完整任务模板",
				version: "1.0.0",
				author: "developer",
				category: "development",
				tags: ["feature", "development", "frontend"],
				parameters: {
					featureName: {
						type: "string",
						description: "功能名称",
						required: true,
						default: "新功能",
					},
					priority: {
						type: "string",
						description: "优先级",
						required: false,
						default: "medium",
						enum: ["low", "medium", "high"],
					},
				},
				tasks: [
					{
						id: "analysis",
						title: "需求分析: {{featureName}}",
						description: "分析{{featureName}}的需求和实现方案",
						priority: "{{priority}}",
						estimatedHours: 4,
						tags: ["analysis"],
						dependencies: [],
					},
					{
						id: "design",
						title: "设计: {{featureName}}",
						description: "设计{{featureName}}的UI和架构",
						priority: "{{priority}}",
						estimatedHours: 6,
						tags: ["design"],
						dependencies: ["analysis"],
					},
					{
						id: "implementation",
						title: "实现: {{featureName}}",
						description: "实现{{featureName}}的核心功能",
						priority: "{{priority}}",
						estimatedHours: 16,
						tags: ["implementation"],
						dependencies: ["design"],
					},
				],
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				usageCount: 0,
			};

			expect(template).toHaveProperty("id");
			expect(template).toHaveProperty("name");
			expect(template).toHaveProperty("description");
			expect(template).toHaveProperty("parameters");
			expect(template).toHaveProperty("tasks");
			expect(template.tasks).toHaveLength(3);
			expect(template.parameters.featureName.required).toBe(true);
			expect(template.tasks[0].dependencies).toEqual([]);
			expect(template.tasks[1].dependencies).toEqual(["analysis"]);
		});

		it("应该验证模板参数的有效性", () => {
			const validateTemplateParameters = (parameters) => {
				const errors = [];

				Object.entries(parameters).forEach(([key, param]) => {
					if (!param.type) {
						errors.push(`参数 ${key} 缺少类型定义`);
					}

					if (!param.description) {
						errors.push(`参数 ${key} 缺少描述`);
					}

					if (param.required && param.default === undefined) {
						// 必需参数可以没有默认值
					} else if (!param.required && param.default === undefined) {
						errors.push(`可选参数 ${key} 应该有默认值`);
					}

					// 验证枚举值
					if (
						param.enum &&
						param.default &&
						!param.enum.includes(param.default)
					) {
						errors.push(`参数 ${key} 的默认值不在枚举范围内`);
					}
				});

				return { isValid: errors.length === 0, errors };
			};

			const validParameters = {
				featureName: {
					type: "string",
					description: "功能名称",
					required: true,
				},
				priority: {
					type: "string",
					description: "优先级",
					required: false,
					default: "medium",
					enum: ["low", "medium", "high"],
				},
			};

			const invalidParameters = {
				featureName: {
					description: "功能名称",
					required: true,
					// 缺少type
				},
				priority: {
					type: "string",
					required: false,
					default: "urgent",
					enum: ["low", "medium", "high"],
					// 默认值不在枚举中
				},
			};

			expect(validateTemplateParameters(validParameters).isValid).toBe(true);
			expect(validateTemplateParameters(invalidParameters).isValid).toBe(false);
			expect(validateTemplateParameters(invalidParameters).errors).toContain(
				"参数 featureName 缺少类型定义",
			);
		});
	});

	describe("模板参数替换", () => {
		it("应该能够替换模板中的变量", () => {
			const replaceTemplateVariables = (template, variables) => {
				const replaceInString = (str) => {
					if (typeof str !== "string") return str;

					let result = str;
					Object.entries(variables).forEach(([key, value]) => {
						const regex = new RegExp(`{{${key}}}`, "g");
						result = result.replace(regex, value);
					});

					return result;
				};

				const replaceInObject = (obj) => {
					if (typeof obj === "string") {
						return replaceInString(obj);
					}

					if (Array.isArray(obj)) {
						return obj.map(replaceInObject);
					}

					if (obj && typeof obj === "object") {
						const result = {};
						Object.entries(obj).forEach(([key, value]) => {
							result[key] = replaceInObject(value);
						});
						return result;
					}

					return obj;
				};

				return replaceInObject(template);
			};

			const template = {
				title: "开发功能: {{featureName}}",
				description: "实现{{featureName}}功能，优先级为{{priority}}",
				tasks: [
					{
						title: "分析{{featureName}}",
						priority: "{{priority}}",
					},
				],
			};

			const variables = {
				featureName: "用户登录",
				priority: "high",
			};

			const result = replaceTemplateVariables(template, variables);

			expect(result.title).toBe("开发功能: 用户登录");
			expect(result.description).toBe("实现用户登录功能，优先级为high");
			expect(result.tasks[0].title).toBe("分析用户登录");
			expect(result.tasks[0].priority).toBe("high");
		});

		it("应该处理模板参数的默认值", () => {
			const applyTemplateDefaults = (template, providedParams = {}) => {
				const finalParams = {};

				Object.entries(template.parameters).forEach(([key, param]) => {
					if (providedParams[key] !== undefined) {
						finalParams[key] = providedParams[key];
					} else if (param.required) {
						throw new Error(`缺少必需参数: ${key}`);
					} else if (param.default !== undefined) {
						finalParams[key] = param.default;
					} else {
						finalParams[key] = null;
					}
				});

				return finalParams;
			};

			const template = {
				parameters: {
					featureName: {
						type: "string",
						required: true,
						default: "未命名功能",
					},
					priority: {
						type: "string",
						required: false,
						default: "medium",
						enum: ["low", "medium", "high"],
					},
					assignee: {
						type: "string",
						required: false,
						// 无默认值
					},
				},
			};

			// 提供部分参数
			const params1 = applyTemplateDefaults(template, {
				featureName: "自定义功能",
			});
			expect(params1.featureName).toBe("自定义功能");
			expect(params1.priority).toBe("medium");
			expect(params1.assignee).toBe(null);

			// 提供所有参数
			const params2 = applyTemplateDefaults(template, {
				featureName: "登录功能",
				priority: "high",
				assignee: "developer",
			});
			expect(params2.featureName).toBe("登录功能");
			expect(params2.priority).toBe("high");
			expect(params2.assignee).toBe("developer");

			// 测试缺少必需参数
			expect(() =>
				applyTemplateDefaults(template, { priority: "high" }),
			).toThrow("缺少必需参数: featureName");
		});
	});

	describe("模板管理和存储", () => {
		it("应该能够注册和管理模板", () => {
			const templateRegistry = new Map();

			const registerTemplate = (template) => {
				if (!template.id) {
					throw new Error("模板必须有ID");
				}

				if (templateRegistry.has(template.id)) {
					throw new Error(`模板 ${template.id} 已存在`);
				}

				const templateWithMeta = {
					...template,
					registeredAt: new Date().toISOString(),
					usageCount: 0,
					lastUsed: null,
				};

				templateRegistry.set(template.id, templateWithMeta);
				return templateWithMeta;
			};

			const getTemplate = (id) => {
				const template = templateRegistry.get(id);
				if (template) {
					template.usageCount++;
					template.lastUsed = new Date().toISOString();
				}
				return template;
			};

			const listTemplates = (category = null) => {
				let templates = Array.from(templateRegistry.values());

				if (category) {
					templates = templates.filter((t) => t.category === category);
				}

				return templates.map((t) => ({
					id: t.id,
					name: t.name,
					description: t.description,
					category: t.category,
					usageCount: t.usageCount,
				}));
			};

			const mockTemplate = {
				id: "feature-dev",
				name: "功能开发模板",
				description: "新功能开发任务模板",
				category: "development",
			};

			const registered = registerTemplate(mockTemplate);
			expect(registered.id).toBe("feature-dev");
			expect(registered.usageCount).toBe(0);
			expect(registered.registeredAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);

			const retrieved = getTemplate("feature-dev");
			expect(retrieved.usageCount).toBe(1);
			expect(retrieved.lastUsed).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);

			const templates = listTemplates();
			expect(templates).toHaveLength(1);
			expect(templates[0].name).toBe("功能开发模板");

			const devTemplates = listTemplates("development");
			expect(devTemplates).toHaveLength(1);

			const otherTemplates = listTemplates("testing");
			expect(otherTemplates).toHaveLength(0);
		});

		it("应该支持模板的导入和导出", () => {
			const exportTemplate = (template) => {
				const exportData = {
					version: "1.0",
					template: {
						...template,
						exportedAt: new Date().toISOString(),
						exportVersion: "1.0",
					},
					metadata: {
						exportedBy: "task-master",
						format: "task-template-v1",
					},
				};

				return JSON.stringify(exportData, null, 2);
			};

			const importTemplate = (jsonData) => {
				try {
					const importData = JSON.parse(jsonData);

					if (importData.version !== "1.0") {
						throw new Error("不支持的模板版本");
					}

					if (!importData.template || !importData.template.id) {
						throw new Error("无效的模板数据");
					}

					const template = {
						...importData.template,
						importedAt: new Date().toISOString(),
						importVersion: "1.0",
					};

					// 移除导出专用字段
					delete template.exportedAt;
					delete template.exportVersion;

					return template;
				} catch (error) {
					throw new Error(`导入模板失败: ${error.message}`);
				}
			};

			const originalTemplate = {
				id: "test-template",
				name: "测试模板",
				description: "用于测试的模板",
				category: "testing",
			};

			// 导出模板
			const exportedData = exportTemplate(originalTemplate);
			const parsedExport = JSON.parse(exportedData);

			expect(parsedExport.version).toBe("1.0");
			expect(parsedExport.template.id).toBe("test-template");
			expect(parsedExport.metadata.format).toBe("task-template-v1");
			expect(parsedExport.template.exportedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);

			// 导入模板
			const importedTemplate = importTemplate(exportedData);
			expect(importedTemplate.id).toBe("test-template");
			expect(importedTemplate.name).toBe("测试模板");
			expect(importedTemplate.importedAt).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
			expect(importedTemplate).not.toHaveProperty("exportedAt");

			// 测试导入无效数据
			expect(() => importTemplate("invalid json")).toThrow("导入模板失败");
			expect(() => importTemplate('{"version":"2.0"}')).toThrow(
				"不支持的模板版本",
			);
		});
	});

	describe("模板实例化和任务生成", () => {
		it("应该能够从模板实例化任务", () => {
			const instantiateTemplate = (template, parameters) => {
				const appliedParams = {};

				// 应用参数和默认值
				Object.entries(template.parameters).forEach(([key, param]) => {
					if (parameters[key] !== undefined) {
						appliedParams[key] = parameters[key];
					} else if (param.default !== undefined) {
						appliedParams[key] = param.default;
					} else {
						throw new Error(`缺少必需参数: ${key}`);
					}
				});

				// 生成任务
				const tasks = template.tasks.map((taskTemplate, index) => {
					const task = {
						id: `${template.id}-${index + 1}`,
						templateId: template.id,
						createdFromTemplate: true,
						createdAt: new Date().toISOString(),
						...taskTemplate,
					};

					// 替换变量
					Object.entries(appliedParams).forEach(([key, value]) => {
						const regex = new RegExp(`{{${key}}}`, "g");
						if (task.title) task.title = task.title.replace(regex, value);
						if (task.description)
							task.description = task.description.replace(regex, value);
						if (task.priority)
							task.priority = task.priority.replace(regex, value);
					});

					return task;
				});

				return {
					templateId: template.id,
					parameters: appliedParams,
					tasks,
					totalTasks: tasks.length,
					estimatedTotalHours: tasks.reduce(
						(sum, task) => sum + (task.estimatedHours || 0),
						0,
					),
				};
			};

			const template = {
				id: "feature-dev",
				parameters: {
					featureName: { type: "string", required: true, default: "新功能" },
					priority: { type: "string", required: false, default: "medium" },
				},
				tasks: [
					{
						title: "分析: {{featureName}}",
						description: "分析{{featureName}}的需求",
						priority: "{{priority}}",
						estimatedHours: 4,
					},
					{
						title: "实现: {{featureName}}",
						description: "实现{{featureName}}的功能",
						priority: "{{priority}}",
						estimatedHours: 8,
					},
				],
			};

			const result = instantiateTemplate(template, { featureName: "用户注册" });

			expect(result.templateId).toBe("feature-dev");
			expect(result.parameters.featureName).toBe("用户注册");
			expect(result.parameters.priority).toBe("medium");
			expect(result.tasks).toHaveLength(2);
			expect(result.totalTasks).toBe(2);
			expect(result.estimatedTotalHours).toBe(12);

			expect(result.tasks[0].id).toBe("feature-dev-1");
			expect(result.tasks[0].title).toBe("分析: 用户注册");
			expect(result.tasks[0].description).toBe("分析用户注册的需求");
			expect(result.tasks[0].priority).toBe("medium");

			expect(result.tasks[1].id).toBe("feature-dev-2");
			expect(result.tasks[1].title).toBe("实现: 用户注册");
		});

		it("应该处理模板实例化错误", () => {
			const safeInstantiateTemplate = (template, parameters) => {
				try {
					// 验证必需参数
					const missingParams = [];
					Object.entries(template.parameters).forEach(([key, param]) => {
						if (param.required && parameters[key] === undefined) {
							missingParams.push(key);
						}
					});

					if (missingParams.length > 0) {
						throw new Error(`缺少必需参数: ${missingParams.join(", ")}`);
					}

					// 验证参数类型
					Object.entries(parameters).forEach(([key, value]) => {
						const param = template.parameters[key];
						if (param) {
							if (param.type === "string" && typeof value !== "string") {
								throw new Error(`参数 ${key} 必须是字符串类型`);
							}
							if (param.enum && !param.enum.includes(value)) {
								throw new Error(
									`参数 ${key} 的值必须是: ${param.enum.join(", ")}`,
								);
							}
						}
					});

					// 这里应该调用实际的实例化逻辑
					return { success: true, message: "模板实例化成功" };
				} catch (error) {
					return {
						success: false,
						error: error.message,
						templateId: template.id,
						providedParams: parameters,
					};
				}
			};

			const template = {
				id: "test-template",
				parameters: {
					name: { type: "string", required: true },
					type: { type: "string", enum: ["web", "mobile", "api"] },
				},
			};

			// 成功实例化
			const successResult = safeInstantiateTemplate(template, {
				name: "test",
				type: "web",
			});
			expect(successResult.success).toBe(true);

			// 缺少必需参数
			const missingParamResult = safeInstantiateTemplate(template, {
				type: "web",
			});
			expect(missingParamResult.success).toBe(false);
			expect(missingParamResult.error).toContain("缺少必需参数: name");

			// 参数类型错误
			const typeErrorResult = safeInstantiateTemplate(template, {
				name: 123,
				type: "web",
			});
			expect(typeErrorResult.success).toBe(false);
			expect(typeErrorResult.error).toContain("必须是字符串类型");

			// 枚举值错误
			const enumErrorResult = safeInstantiateTemplate(template, {
				name: "test",
				type: "desktop",
			});
			expect(enumErrorResult.success).toBe(false);
			expect(enumErrorResult.error).toContain("必须是: web, mobile, api");
		});
	});

	describe("模板搜索和发现", () => {
		it("应该支持模板搜索功能", () => {
			const templates = [
				{
					id: "feature-dev",
					name: "功能开发模板",
					description: "新功能开发任务模板",
					category: "development",
					tags: ["feature", "development"],
				},
				{
					id: "bug-fix",
					name: "Bug修复模板",
					description: "Bug修复任务模板",
					category: "maintenance",
					tags: ["bug", "fix"],
				},
				{
					id: "refactor",
					name: "代码重构模板",
					description: "代码重构任务模板",
					category: "maintenance",
					tags: ["refactor", "code"],
				},
			];

			const searchTemplates = (query, filters = {}) => {
				let results = templates;

				// 文本搜索
				if (query) {
					const lowerQuery = query.toLowerCase();
					results = results.filter(
						(template) =>
							template.name.toLowerCase().includes(lowerQuery) ||
							template.description.toLowerCase().includes(lowerQuery) ||
							template.tags.some((tag) =>
								tag.toLowerCase().includes(lowerQuery),
							),
					);
				}

				// 分类过滤
				if (filters.category) {
					results = results.filter(
						(template) => template.category === filters.category,
					);
				}

				// 标签过滤
				if (filters.tags && filters.tags.length > 0) {
					results = results.filter((template) =>
						filters.tags.some((tag) => template.tags.includes(tag)),
					);
				}

				// 排序（按相关性）
				results.sort((a, b) => {
					if (query) {
						const aScore =
							(a.name.toLowerCase().includes(query.toLowerCase()) ? 3 : 0) +
							(a.description.toLowerCase().includes(query.toLowerCase())
								? 2
								: 0) +
							a.tags.filter((tag) =>
								tag.toLowerCase().includes(query.toLowerCase()),
							).length;
						const bScore =
							(b.name.toLowerCase().includes(query.toLowerCase()) ? 3 : 0) +
							(b.description.toLowerCase().includes(query.toLowerCase())
								? 2
								: 0) +
							b.tags.filter((tag) =>
								tag.toLowerCase().includes(query.toLowerCase()),
							).length;
						return bScore - aScore;
					}
					return 0;
				});

				return results.map((template) => ({
					id: template.id,
					name: template.name,
					description: template.description,
					category: template.category,
					tags: template.tags,
				}));
			};

			// 按名称搜索
			const nameResults = searchTemplates("开发");
			expect(nameResults).toHaveLength(1);
			expect(nameResults[0].id).toBe("feature-dev");

			// 按标签搜索
			const tagResults = searchTemplates("bug");
			expect(tagResults).toHaveLength(1);
			expect(tagResults[0].id).toBe("bug-fix");

			// 按分类过滤
			const categoryResults = searchTemplates("", { category: "maintenance" });
			expect(categoryResults).toHaveLength(2);
			expect(categoryResults.map((t) => t.id).sort()).toEqual([
				"bug-fix",
				"refactor",
			]);

			// 组合搜索
			const combinedResults = searchTemplates("代码", {
				category: "maintenance",
			});
			expect(combinedResults).toHaveLength(1);
			expect(combinedResults[0].id).toBe("refactor");
		});

		it("应该提供模板使用统计", () => {
			const templateStats = new Map();

			const recordTemplateUsage = (templateId, userId = null) => {
				const stats = templateStats.get(templateId) || {
					templateId,
					totalUsage: 0,
					lastUsed: null,
					userUsage: new Map(),
				};

				stats.totalUsage++;
				stats.lastUsed = new Date().toISOString();

				if (userId) {
					const userCount = stats.userUsage.get(userId) || 0;
					stats.userUsage.set(userId, userCount + 1);
				}

				templateStats.set(templateId, stats);
				return stats;
			};

			const getTemplateStats = (templateId = null) => {
				if (templateId) {
					return templateStats.get(templateId) || null;
				}

				// 返回所有模板的统计
				const allStats = Array.from(templateStats.values());
				const summary = {
					totalTemplates: allStats.length,
					totalUsage: allStats.reduce((sum, stat) => sum + stat.totalUsage, 0),
					mostUsed:
						allStats.length > 0
							? allStats.reduce(
									(prev, current) =>
										prev.totalUsage > current.totalUsage
											? prev
											: prev.totalUsage < current.totalUsage
												? current
												: prev.templateId < current.templateId
													? prev
													: current, // 当使用次数相同时，按ID排序选择第一个
								)
							: null,
					recentlyUsed:
						allStats
							.filter((stat) => stat.lastUsed)
							.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))[0] ||
						null,
				};

				return summary;
			};

			// 记录模板使用
			recordTemplateUsage("feature-dev", "user1");
			recordTemplateUsage("feature-dev", "user2");
			recordTemplateUsage("bug-fix", "user1");
			recordTemplateUsage("bug-fix", "user1"); // 同一个用户使用多次

			// 获取单个模板统计
			const featureStats = getTemplateStats("feature-dev");
			expect(featureStats.totalUsage).toBe(2);
			expect(featureStats.userUsage.get("user1")).toBe(1);
			expect(featureStats.userUsage.get("user2")).toBe(1);

			const bugStats = getTemplateStats("bug-fix");
			expect(bugStats.totalUsage).toBe(2);
			expect(bugStats.userUsage.get("user1")).toBe(2);

			// 获取总体统计
			const summary = getTemplateStats();
			expect(summary.totalTemplates).toBe(2);
			expect(summary.totalUsage).toBe(4);
			expect(["feature-dev", "bug-fix"]).toContain(summary.mostUsed.templateId);
			expect(summary.recentlyUsed).not.toBeNull();
		});
	});
});
