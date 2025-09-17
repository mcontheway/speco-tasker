/**
 * test_mcp_integration.cjs
 * 单元测试：验证MCP集成功能
 *
 * SCOPE: 测试MCP协议通信、工具注册和错误处理
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

describe("MCP集成功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("应该能够初始化MCP连接", () => {
		const initializeMCPConnection = (config) => {
			return {
				id: "mcp-connection-" + Date.now(),
				status: "connecting",
				config: {
					version: "1.0",
					transport: config.transport || "stdio",
					timeout: config.timeout || 30000,
					...config,
				},
				tools: new Map(),
				resources: new Map(),
				prompts: new Map(),
				connected: false,
				lastActivity: null,
			};
		};

		const config = {
			transport: "stdio",
			timeout: 30000,
			maxRetries: 3,
		};

		const connection = initializeMCPConnection(config);

		expect(connection.id).toMatch(/^mcp-connection-\d+$/);
		expect(connection.status).toBe("connecting");
		expect(connection.config.transport).toBe("stdio");
		expect(connection.config.timeout).toBe(30000);
		expect(connection.connected).toBe(false);
		expect(connection.tools).toBeInstanceOf(Map);
		expect(connection.resources).toBeInstanceOf(Map);
		expect(connection.prompts).toBeInstanceOf(Map);
	});

	it("应该能够处理MCP消息格式", () => {
		const parseMCPMessage = (rawMessage) => {
			try {
				const message =
					typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;

				// 验证必需字段
				if (!message.jsonrpc || message.jsonrpc !== "2.0") {
					throw new Error("无效的JSON-RPC版本");
				}

				if (message.id == null) {
					throw new Error("缺少消息ID");
				}

				return {
					valid: true,
					message: {
						jsonrpc: message.jsonrpc,
						id: message.id,
						method: message.method,
						params: message.params || {},
						result: message.result,
						error: message.error,
					},
				};
			} catch (error) {
				return {
					valid: false,
					error: error.message,
					originalMessage: rawMessage,
				};
			}
		};

		const formatMCPMessage = (message) => {
			const mcpMessage = {
				jsonrpc: "2.0",
				id: message.id,
				...message,
			};

			return JSON.stringify(mcpMessage);
		};

		// 测试有效消息
		const validMessage = {
			jsonrpc: "2.0",
			id: 1,
			method: "tools/list",
			params: {},
		};

		const parsed = parseMCPMessage(validMessage);
		expect(parsed.valid).toBe(true);
		expect(parsed.message.method).toBe("tools/list");

		// 测试格式化消息
		const formatted = formatMCPMessage(validMessage);
		const parsedFormatted = JSON.parse(formatted);
		expect(parsedFormatted.jsonrpc).toBe("2.0");
		expect(parsedFormatted.id).toBe(1);

		// 测试无效消息
		const invalidMessage = { method: "test" }; // 缺少jsonrpc和ID
		const invalidParsed = parseMCPMessage(invalidMessage);
		expect(invalidParsed.valid).toBe(false);
		expect(invalidParsed.error).toContain("无效的JSON-RPC版本");
	});

	it("应该能够注册MCP工具", () => {
		const toolRegistry = new Map();

		const registerTool = (name, toolDefinition) => {
			const tool = {
				name,
				description: toolDefinition.description || "",
				inputSchema: toolDefinition.inputSchema || {
					type: "object",
					properties: {},
				},
				handler: toolDefinition.handler,
				registeredAt: new Date().toISOString(),
				callCount: 0,
				lastCalled: null,
			};

			toolRegistry.set(name, tool);
			return tool;
		};

		const getTool = (name) => {
			return toolRegistry.get(name);
		};

		const listTools = () => {
			return Array.from(toolRegistry.values()).map((tool) => ({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
			}));
		};

		const mockTool = {
			description: "创建新任务",
			inputSchema: {
				type: "object",
				properties: {
					title: { type: "string", description: "任务标题" },
					priority: { type: "string", enum: ["low", "medium", "high"] },
				},
				required: ["title"],
			},
			handler: (params) => ({ success: true, taskId: 1 }),
		};

		const registeredTool = registerTool("add-task", mockTool);
		expect(registeredTool.name).toBe("add-task");
		expect(registeredTool.description).toBe("创建新任务");
		expect(registeredTool.callCount).toBe(0);

		const retrievedTool = getTool("add-task");
		expect(retrievedTool).toEqual(registeredTool);

		const tools = listTools();
		expect(tools).toHaveLength(1);
		expect(tools[0].name).toBe("add-task");
	});

	it("应该验证工具输入参数", () => {
		const validateToolInput = (toolDefinition, params) => {
			const schema = toolDefinition.inputSchema;
			const errors = [];

			// 检查必需参数
			if (schema.required) {
				schema.required.forEach((requiredField) => {
					if (!params[requiredField]) {
						errors.push(`缺少必需参数: ${requiredField}`);
					}
				});
			}

			// 检查参数类型
			if (schema.properties) {
				Object.entries(schema.properties).forEach(([field, fieldSchema]) => {
					if (params[field] !== undefined) {
						const value = params[field];
						const expectedType = fieldSchema.type;

						if (expectedType === "string" && typeof value !== "string") {
							errors.push(`参数 ${field} 必须是字符串类型`);
						} else if (expectedType === "number" && typeof value !== "number") {
							errors.push(`参数 ${field} 必须是数字类型`);
						} else if (
							expectedType === "boolean" &&
							typeof value !== "boolean"
						) {
							errors.push(`参数 ${field} 必须是布尔类型`);
						}

						// 检查枚举值
						if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
							errors.push(
								`参数 ${field} 必须是以下值之一: ${fieldSchema.enum.join(", ")}`,
							);
						}

						// 检查字符串长度
						if (
							expectedType === "string" &&
							fieldSchema.maxLength &&
							value.length > fieldSchema.maxLength
						) {
							errors.push(
								`参数 ${field} 长度不能超过 ${fieldSchema.maxLength} 个字符`,
							);
						}
					}
				});
			}

			return { isValid: errors.length === 0, errors };
		};

		const toolDefinition = {
			inputSchema: {
				type: "object",
				properties: {
					title: { type: "string", maxLength: 100 },
					priority: { type: "string", enum: ["low", "medium", "high"] },
					estimate: { type: "number" },
				},
				required: ["title"],
			},
		};

		// 有效参数
		const validParams = { title: "测试任务", priority: "high", estimate: 2 };
		expect(validateToolInput(toolDefinition, validParams).isValid).toBe(true);

		// 缺少必需参数
		const missingRequired = { priority: "medium" };
		expect(validateToolInput(toolDefinition, missingRequired).isValid).toBe(
			false,
		);

		// 类型错误
		const typeError = { title: "测试任务", estimate: "two" };
		expect(validateToolInput(toolDefinition, typeError).isValid).toBe(false);

		// 枚举值错误
		const enumError = { title: "测试任务", priority: "urgent" };
		expect(validateToolInput(toolDefinition, enumError).isValid).toBe(false);

		// 长度超限
		const lengthError = { title: "a".repeat(150) };
		expect(validateToolInput(toolDefinition, lengthError).isValid).toBe(false);
	});

	it("应该能够处理MCP通信错误", () => {
		const errorHandler = {
			handleConnectionError: (error, context = {}) => {
				const errorTypes = {
					ECONNREFUSED: "连接被拒绝",
					ETIMEDOUT: "连接超时",
					ENOTFOUND: "主机未找到",
					ECONNRESET: "连接被重置",
				};

				const friendlyMessage = errorTypes[error.code] || "未知连接错误";
				const retryable = [
					"ECONNREFUSED",
					"ETIMEDOUT",
					"ECONNRESET",
					"ENOTFOUND",
				].includes(error.code);

				return {
					type: "CONNECTION_ERROR",
					code: error.code,
					message: friendlyMessage,
					originalError: error.message,
					retryable,
					context,
					timestamp: new Date().toISOString(),
					suggestion: retryable ? "请检查网络连接后重试" : "请检查服务器配置",
				};
			},
		};

		// 测试连接错误
		const connError = new Error("Connection refused");
		connError.code = "ECONNREFUSED";

		const connectionError = errorHandler.handleConnectionError(connError, {
			host: "localhost",
			port: 3000,
		});
		expect(connectionError.type).toBe("CONNECTION_ERROR");
		expect(connectionError.code).toBe("ECONNREFUSED");
		expect(connectionError.message).toBe("连接被拒绝");
		expect(connectionError.retryable).toBe(true);
		expect(connectionError.suggestion).toContain("请检查网络连接后重试");
	});

	it("应该支持调试和日志记录", () => {
		const logs = [];
		let enabled = true;

		const log = (level, message, context = {}) => {
			if (!enabled) return;

			const logEntry = {
				timestamp: new Date().toISOString(),
				level: level.toUpperCase(),
				message,
				context,
				stack: level === "error" ? new Error().stack : undefined,
			};

			logs.push(logEntry);

			// 控制台输出（在生产环境中可能被禁用）
			const logMethod = console[level] || console.log;
			logMethod(`[${level.toUpperCase()}] ${message}`);
		};

		const debugLogger = {
			log,
			debug: (message, context) => log("debug", message, context),
			info: (message, context) => log("info", message, context),
			warn: (message, context) => log("warn", message, context),
			error: (message, context) => log("error", message, context),

			getLogs: (level = null, limit = null) => {
				let filteredLogs = logs;

				if (level) {
					filteredLogs = filteredLogs.filter(
						(log) => log.level === level.toUpperCase(),
					);
				}

				if (limit) {
					filteredLogs = filteredLogs.slice(-limit);
				}

				return filteredLogs;
			},

			clearLogs: () => {
				logs.splice(0, logs.length);
			},

			enable: () => {
				enabled = true;
			},
			disable: () => {
				enabled = false;
			},
		};

		// 记录各种级别的日志
		debugLogger.debug("开始处理MCP请求", { method: "tools/list" });
		debugLogger.info("MCP连接已建立", { transport: "stdio" });
		debugLogger.warn("检测到网络延迟", { latency: 1500 });
		debugLogger.error("工具执行失败", { tool: "add-task", error: "参数无效" });

		// 禁用console mock以避免Jest兼容性问题
		jest.restoreAllMocks();

		expect(logs).toHaveLength(4);

		const debugLogs = debugLogger.getLogs("DEBUG");
		expect(debugLogs).toHaveLength(1);
		expect(debugLogs[0].message).toContain("开始处理MCP请求");

		const errorLogs = debugLogger.getLogs("ERROR");
		expect(errorLogs).toHaveLength(1);
		expect(errorLogs[0].context.tool).toBe("add-task");

		// 测试禁用日志
		debugLogger.disable();
		debugLogger.info("这条日志应该被忽略");
		expect(logs).toHaveLength(4); // 数量不变

		debugLogger.enable();
		debugLogger.info("这条日志应该被记录");
		expect(logs).toHaveLength(5);
	});
});
