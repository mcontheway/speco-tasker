/**
 * test_error_handling.cjs
 * 单元测试：验证错误处理功能
 *
 * SCOPE: 测试异常处理、错误分类、错误恢复和用户友好错误信息
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

describe("错误处理功能验证", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("错误分类和类型", () => {
		it("应该能够分类不同类型的错误", () => {
			const categorizeError = (error) => {
				if (error.code === "ENOENT") return "FILE_NOT_FOUND";
				if (error.code === "EACCES") return "PERMISSION_DENIED";
				if (error.code === "ENOTDIR") return "NOT_A_DIRECTORY";
				if (error.code === "EISDIR") return "IS_DIRECTORY";
				if (error.code === "EMFILE") return "TOO_MANY_OPEN_FILES";
				if (error.message && error.message.includes("JSON"))
					return "INVALID_JSON";
				if (error.message && error.message.toLowerCase().includes("network"))
					return "NETWORK_ERROR";
				if (error.message && error.message.includes("timeout"))
					return "TIMEOUT_ERROR";
				return "UNKNOWN_ERROR";
			};

			expect(categorizeError({ code: "ENOENT" })).toBe("FILE_NOT_FOUND");
			expect(categorizeError({ code: "EACCES" })).toBe("PERMISSION_DENIED");
			expect(categorizeError({ message: "Invalid JSON format" })).toBe(
				"INVALID_JSON",
			);
			expect(categorizeError({ message: "Network connection failed" })).toBe(
				"NETWORK_ERROR",
			);
			expect(categorizeError({ message: "Request timeout" })).toBe(
				"TIMEOUT_ERROR",
			);
			expect(categorizeError({ message: "Unknown error" })).toBe(
				"UNKNOWN_ERROR",
			);
		});

		it("应该提供用户友好的错误信息", () => {
			const getUserFriendlyMessage = (errorType, originalError) => {
				const messages = {
					FILE_NOT_FOUND: "文件或目录不存在，请检查路径是否正确",
					PERMISSION_DENIED: "没有足够的权限访问此文件或目录",
					NOT_A_DIRECTORY: "指定的路径不是一个目录",
					IS_DIRECTORY: "指定的路径是一个目录而不是文件",
					INVALID_JSON: "文件内容不是有效的JSON格式",
					NETWORK_ERROR: "网络连接出现问题，请检查网络设置",
					TIMEOUT_ERROR: "操作超时，请稍后重试",
					UNKNOWN_ERROR: "发生了未知错误，请联系技术支持",
				};

				const baseMessage = messages[errorType] || messages.UNKNOWN_ERROR;
				const details =
					originalError && originalError.message
						? ` (详情: ${originalError.message})`
						: "";

				return baseMessage + details;
			};

			expect(getUserFriendlyMessage("FILE_NOT_FOUND")).toContain(
				"文件或目录不存在",
			);
			const jsonErrorMessage = getUserFriendlyMessage("INVALID_JSON", {
				message: "Unexpected token",
			});
			expect(jsonErrorMessage).toContain("不是有效的JSON格式");
			expect(jsonErrorMessage).toContain("Unexpected token");
			expect(getUserFriendlyMessage("UNKNOWN_ERROR")).toContain(
				"发生了未知错误",
			);
		});

		it("应该根据错误严重程度进行分级", () => {
			const getErrorSeverity = (errorType) => {
				const criticalErrors = [
					"NETWORK_ERROR",
					"PERMISSION_DENIED",
					"UNKNOWN_ERROR",
				];
				const warningErrors = ["TIMEOUT_ERROR", "INVALID_JSON"];
				const infoErrors = ["FILE_NOT_FOUND", "NOT_A_DIRECTORY"];

				if (criticalErrors.includes(errorType)) return "CRITICAL";
				if (warningErrors.includes(errorType)) return "WARNING";
				if (infoErrors.includes(errorType)) return "INFO";
				return "UNKNOWN";
			};

			expect(getErrorSeverity("NETWORK_ERROR")).toBe("CRITICAL");
			expect(getErrorSeverity("TIMEOUT_ERROR")).toBe("WARNING");
			expect(getErrorSeverity("FILE_NOT_FOUND")).toBe("INFO");
			expect(getErrorSeverity("UNKNOWN_ERROR_TYPE")).toBe("UNKNOWN");
		});
	});

	describe("异常处理机制", () => {
		it("应该能够捕获和处理同步异常", () => {
			const safeExecute = (fn, fallback = null) => {
				try {
					return { success: true, result: fn() };
				} catch (error) {
					return {
						success: false,
						error: error.message,
						fallback,
					};
				}
			};

			const riskyFunction = () => {
				throw new Error("Something went wrong");
			};

			const safeFunction = () => {
				return "Success";
			};

			const failedResult = safeExecute(riskyFunction, "default value");
			const successResult = safeExecute(safeFunction);

			expect(failedResult.success).toBe(false);
			expect(failedResult.error).toBe("Something went wrong");
			expect(failedResult.fallback).toBe("default value");

			expect(successResult.success).toBe(true);
			expect(successResult.result).toBe("Success");
		});

		it("应该能够处理异步异常", async () => {
			const safeExecuteAsync = async (fn, fallback = null) => {
				try {
					const result = await fn();
					return { success: true, result };
				} catch (error) {
					return {
						success: false,
						error: error.message,
						fallback,
					};
				}
			};

			const riskyAsyncFunction = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				throw new Error("Async error occurred");
			};

			const safeAsyncFunction = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return "Async success";
			};

			const failedResult = await safeExecuteAsync(
				riskyAsyncFunction,
				"async default",
			);
			const successResult = await safeExecuteAsync(safeAsyncFunction);

			expect(failedResult.success).toBe(false);
			expect(failedResult.error).toBe("Async error occurred");
			expect(failedResult.fallback).toBe("async default");

			expect(successResult.success).toBe(true);
			expect(successResult.result).toBe("Async success");
		});

		it("应该支持错误重试机制", async () => {
			let attempts = 0;

			const unreliableFunction = () => {
				attempts++;
				if (attempts < 3) {
					throw new Error(`Attempt ${attempts} failed`);
				}
				return "Success on attempt " + attempts;
			};

			const retryExecute = async (fn, maxRetries = 3, delay = 10) => {
				let lastError;

				for (let i = 0; i <= maxRetries; i++) {
					try {
						return { success: true, result: await fn(), attempts: i + 1 };
					} catch (error) {
						lastError = error;
						if (i < maxRetries) {
							await new Promise((resolve) => setTimeout(resolve, delay));
						}
					}
				}

				return {
					success: false,
					error: lastError.message,
					attempts: maxRetries + 1,
				};
			};

			const result = await retryExecute(() =>
				Promise.resolve(unreliableFunction()),
			);

			expect(result.success).toBe(true);
			expect(result.result).toBe("Success on attempt 3");
			expect(result.attempts).toBe(3);
		});
	});

	describe("错误恢复策略", () => {
		it("应该支持降级处理策略", () => {
			const executeWithFallback = (primaryFn, fallbackFn) => {
				try {
					return { success: true, result: primaryFn(), strategy: "primary" };
				} catch (error) {
					try {
						return {
							success: true,
							result: fallbackFn(),
							strategy: "fallback",
						};
					} catch (fallbackError) {
						return {
							success: false,
							error: fallbackError.message,
							strategy: "failed",
						};
					}
				}
			};

			const primary = () => {
				throw new Error("Primary method failed");
			};

			const fallback = () => {
				return "Fallback result";
			};

			const fallbackFail = () => {
				throw new Error("Fallback also failed");
			};

			const successResult = executeWithFallback(primary, fallback);
			const failedResult = executeWithFallback(primary, fallbackFail);

			expect(successResult.success).toBe(true);
			expect(successResult.result).toBe("Fallback result");
			expect(successResult.strategy).toBe("fallback");

			expect(failedResult.success).toBe(false);
			expect(failedResult.strategy).toBe("failed");
		});

		it("应该支持断路器模式", () => {
			class CircuitBreaker {
				constructor(failureThreshold = 3, resetTimeout = 5000) {
					this.failureThreshold = failureThreshold;
					this.resetTimeout = resetTimeout;
					this.failureCount = 0;
					this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
					this.lastFailureTime = null;
				}

				async execute(fn) {
					if (this.state === "OPEN") {
						if (Date.now() - this.lastFailureTime > this.resetTimeout) {
							this.state = "HALF_OPEN";
						} else {
							throw new Error("Circuit breaker is OPEN");
						}
					}

					try {
						const result = await fn();
						this.onSuccess();
						return result;
					} catch (error) {
						this.onFailure();
						throw error;
					}
				}

				onSuccess() {
					this.failureCount = 0;
					this.state = "CLOSED";
				}

				onFailure() {
					this.failureCount++;
					this.lastFailureTime = Date.now();

					if (this.failureCount >= this.failureThreshold) {
						this.state = "OPEN";
					}
				}
			}

			const breaker = new CircuitBreaker(2, 1000);

			// 模拟成功调用
			const successFn = () => Promise.resolve("success");

			// 模拟失败调用
			const failFn = () => Promise.reject(new Error("failed"));

			// 测试断路器逻辑（简化版本）
			const testBreaker = async () => {
				try {
					await breaker.execute(successFn);
					expect(breaker.state).toBe("CLOSED");
					expect(breaker.failureCount).toBe(0);
				} catch (error) {
					// 不应该到达这里
					expect(true).toBe(false);
				}

				// 第一次失败
				try {
					await breaker.execute(failFn);
				} catch (error) {
					expect(error.message).toBe("failed");
					expect(breaker.state).toBe("CLOSED");
					expect(breaker.failureCount).toBe(1);
				}

				// 第二次失败 - 应该打开断路器
				try {
					await breaker.execute(failFn);
				} catch (error) {
					expect(error.message).toBe("failed");
					expect(breaker.state).toBe("OPEN");
				}
			};

			// 运行异步测试
			testBreaker();
		});

		it("应该支持缓存作为恢复机制", () => {
			const createCacheFallback = (cache = new Map()) => {
				return {
					get: (key, fetchFn) => {
						if (cache.has(key)) {
							return { success: true, result: cache.get(key), source: "cache" };
						}

						try {
							const result = fetchFn();
							cache.set(key, result);
							return { success: true, result, source: "fresh" };
						} catch (error) {
							return { success: false, error: error.message, source: "error" };
						}
					},

					invalidate: (key) => {
						cache.delete(key);
					},

					clear: () => {
						cache.clear();
					},
				};
			};

			const cache = createCacheFallback();

			// 首次调用 - 从源获取
			const result1 = cache.get("key1", () => "fresh data");
			expect(result1.success).toBe(true);
			expect(result1.result).toBe("fresh data");
			expect(result1.source).toBe("fresh");

			// 再次调用 - 从缓存获取
			const result2 = cache.get("key1", () => "should not be called");
			expect(result2.success).toBe(true);
			expect(result2.result).toBe("fresh data");
			expect(result2.source).toBe("cache");

			// 模拟失败情况
			const result3 = cache.get("key2", () => {
				throw new Error("Source failed");
			});
			expect(result3.success).toBe(false);
			expect(result3.source).toBe("error");
		});
	});

	describe("错误日志和监控", () => {
		it("应该能够记录错误详情", () => {
			const errorLogs = [];

			const logError = (error, context = {}) => {
				const errorEntry = {
					timestamp: new Date().toISOString(),
					message: error.message,
					stack: error.stack,
					type: error.name,
					context,
					severity: "ERROR",
				};

				errorLogs.push(errorEntry);
				return errorEntry;
			};

			const testError = new Error("Test error message");
			testError.name = "TestError";

			const loggedError = logError(testError, {
				userId: "user123",
				action: "file_upload",
			});

			expect(errorLogs).toHaveLength(1);
			expect(loggedError.message).toBe("Test error message");
			expect(loggedError.type).toBe("TestError");
			expect(loggedError.context.userId).toBe("user123");
			expect(loggedError.timestamp).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
		});

		it("应该支持错误聚合和统计", () => {
			const errorStats = {
				total: 0,
				byType: new Map(),
				byTime: new Map(),
				recentErrors: [],
			};

			const recordError = (error, context = {}) => {
				errorStats.total++;

				// 按类型统计
				const type = error.name || "UnknownError";
				errorStats.byType.set(type, (errorStats.byType.get(type) || 0) + 1);

				// 按时间统计（按小时）
				const hour = new Date().getHours();
				errorStats.byTime.set(hour, (errorStats.byTime.get(hour) || 0) + 1);

				// 记录最近的错误
				const errorEntry = {
					timestamp: new Date().toISOString(),
					message: error.message,
					type,
					context,
				};
				errorStats.recentErrors.push(errorEntry);

				// 只保留最近10个错误
				if (errorStats.recentErrors.length > 10) {
					errorStats.recentErrors.shift();
				}
			};

			const getErrorSummary = () => {
				return {
					totalErrors: errorStats.total,
					errorTypes: Object.fromEntries(errorStats.byType),
					errorsByHour: Object.fromEntries(errorStats.byTime),
					recentErrorCount: errorStats.recentErrors.length,
				};
			};

			// 记录一些错误
			recordError(new Error("File not found"), { file: "/test.txt" });
			recordError(new TypeError("Invalid type"), { operation: "parse" });
			recordError(new Error("Network timeout"), {
				url: "http://api.example.com",
			});

			const summary = getErrorSummary();

			expect(summary.totalErrors).toBe(3);
			expect(summary.errorTypes.Error).toBe(2);
			expect(summary.errorTypes.TypeError).toBe(1);
			expect(summary.recentErrorCount).toBe(3);
		});

		it("应该支持错误警报机制", () => {
			const alerts = [];

			const createErrorMonitor = (thresholds = {}) => {
				const defaultThresholds = {
					errorCount: 10,
					errorRate: 0.5, // 50% 错误率
					timeWindow: 60000, // 1分钟
				};

				const config = { ...defaultThresholds, ...thresholds };
				let errorCount = 0;
				let totalRequests = 0;
				let windowStart = Date.now();

				return {
					recordRequest: (hasError) => {
						totalRequests++;
						if (hasError) errorCount++;

						const now = Date.now();
						if (now - windowStart > config.timeWindow) {
							// 重置时间窗口
							errorCount = hasError ? 1 : 0;
							totalRequests = 1;
							windowStart = now;
						}

						// 检查是否需要警报
						const errorRate =
							totalRequests > 0 ? errorCount / totalRequests : 0;

						if (errorCount >= config.errorCount) {
							alerts.push({
								type: "ERROR_COUNT_THRESHOLD",
								message: `错误数量超过阈值: ${errorCount}/${config.errorCount}`,
								timestamp: new Date().toISOString(),
							});
						}

						if (errorRate >= config.errorRate) {
							alerts.push({
								type: "ERROR_RATE_THRESHOLD",
								message: `错误率超过阈值: ${(errorRate * 100).toFixed(1)}%`,
								timestamp: new Date().toISOString(),
							});
						}
					},

					getAlerts: () => [...alerts],
				};
			};

			const monitor = createErrorMonitor({ errorCount: 3, errorRate: 0.6 });

			// 记录一些请求
			monitor.recordRequest(false); // 成功
			monitor.recordRequest(true); // 失败
			monitor.recordRequest(true); // 失败
			monitor.recordRequest(true); // 失败 - 应该触发警报

			const currentAlerts = monitor.getAlerts();

			expect(currentAlerts.length).toBeGreaterThan(0);
			expect(
				currentAlerts.some((alert) => alert.type === "ERROR_COUNT_THRESHOLD"),
			).toBe(true);
			expect(
				currentAlerts.some((alert) => alert.type === "ERROR_RATE_THRESHOLD"),
			).toBe(true);
		});
	});

	describe("错误处理的最佳实践", () => {
		it("应该遵循错误处理的最佳实践", () => {
			// 1. 不要吞掉异常
			const badErrorHandling = () => {
				try {
					throw new Error("This should not be ignored");
				} catch (error) {
					// 默默忽略错误 - 这是不好的做法
				}
			};

			// 2. 正确的错误处理
			const goodErrorHandling = () => {
				try {
					throw new Error("This error is properly handled");
				} catch (error) {
					console.error("Error occurred:", error.message);
					throw error; // 重新抛出或返回错误信息
				}
			};

			// 3. 使用自定义错误类型
			class ValidationError extends Error {
				constructor(message, field) {
					super(message);
					this.name = "ValidationError";
					this.field = field;
				}
			}

			class NetworkError extends Error {
				constructor(message, statusCode) {
					super(message);
					this.name = "NetworkError";
					this.statusCode = statusCode;
				}
			}

			const validateInput = (input) => {
				if (!input || typeof input !== "string") {
					throw new ValidationError(
						"Input must be a non-empty string",
						"input",
					);
				}
				return input.trim();
			};

			const makeNetworkRequest = async () => {
				throw new NetworkError("Connection failed", 500);
			};

			// 测试验证错误
			expect(() => validateInput(null)).toThrow(ValidationError);
			expect(() => validateInput("")).toThrow(ValidationError);

			// 测试网络错误
			expect(makeNetworkRequest()).rejects.toThrow(NetworkError);
		});

		it("应该正确处理异步错误", async () => {
			// 1. Promise 中的错误处理
			const asyncOperationWithError = () => {
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						reject(new Error("Async operation failed"));
					}, 10);
				});
			};

			// 2. 使用 async/await 的错误处理
			const handleAsyncError = async () => {
				try {
					await asyncOperationWithError();
					return { success: true };
				} catch (error) {
					return {
						success: false,
						error: error.message,
						timestamp: new Date().toISOString(),
					};
				}
			};

			// 3. 多个异步操作的错误处理
			const handleMultipleAsync = async () => {
				const results = await Promise.allSettled([
					asyncOperationWithError(),
					Promise.resolve("success"),
					asyncOperationWithError(),
				]);

				return results.map((result, index) => {
					if (result.status === "fulfilled") {
						return { index, success: true, value: result.value };
					} else {
						return { index, success: false, error: result.reason.message };
					}
				});
			};

			const singleResult = await handleAsyncError();
			expect(singleResult.success).toBe(false);
			expect(singleResult.error).toBe("Async operation failed");

			const multipleResults = await handleMultipleAsync();
			expect(multipleResults).toHaveLength(3);
			expect(multipleResults.filter((r) => !r.success)).toHaveLength(2);
			expect(multipleResults.filter((r) => r.success)).toHaveLength(1);
		});

		it("应该提供有意义的错误上下文", () => {
			const processUserData = (userData) => {
				const errors = [];
				const context = { operation: "processUserData", input: userData };

				try {
					if (!userData) {
						throw new Error("User data is required");
					}

					if (!userData.name) {
						errors.push({
							field: "name",
							message: "Name is required",
							context: { ...context, field: "name" },
						});
					}

					if (userData.email && !userData.email.includes("@")) {
						errors.push({
							field: "email",
							message: "Invalid email format",
							context: { ...context, field: "email", value: userData.email },
						});
					}

					if (userData.age && (userData.age < 0 || userData.age > 150)) {
						errors.push({
							field: "age",
							message: "Age must be between 0 and 150",
							context: { ...context, field: "age", value: userData.age },
						});
					}

					if (errors.length > 0) {
						const error = new Error("Validation failed");
						error.details = errors;
						error.context = context;
						throw error;
					}

					return { success: true, processedData: userData };
				} catch (error) {
					if (error.details) {
						// 验证错误
						return {
							success: false,
							type: "VALIDATION_ERROR",
							errors: error.details,
							context: error.context,
						};
					} else {
						// 其他错误
						return {
							success: false,
							type: "PROCESSING_ERROR",
							message: error.message,
							context,
						};
					}
				}
			};

			const invalidData = {
				name: "",
				email: "invalid-email",
				age: 200,
			};

			const result = processUserData(invalidData);

			expect(result.success).toBe(false);
			expect(result.type).toBe("VALIDATION_ERROR");
			expect(result.errors).toHaveLength(3);
			expect(result.errors[0].field).toBe("name");
			expect(result.errors[1].field).toBe("email");
			expect(result.errors[2].field).toBe("age");
			expect(result.context.operation).toBe("processUserData");
		});
	});

	describe("错误恢复和重试策略", () => {
		it("应该实现指数退避重试策略", async () => {
			let attempts = 0;
			const maxRetries = 3;
			const baseDelay = 100;

			const unreliableOperation = () => {
				attempts++;
				if (attempts <= 2) {
					throw new Error(`Attempt ${attempts} failed`);
				}
				return `Success on attempt ${attempts}`;
			};

			const exponentialBackoffRetry = async (
				operation,
				maxRetries,
				baseDelay,
			) => {
				let lastError;

				for (let attempt = 0; attempt <= maxRetries; attempt++) {
					try {
						return {
							success: true,
							result: await operation(),
							attempts: attempt + 1,
						};
					} catch (error) {
						lastError = error;

						if (attempt < maxRetries) {
							const delay = baseDelay * Math.pow(2, attempt); // 指数退避
							await new Promise((resolve) => setTimeout(resolve, delay));
						}
					}
				}

				return {
					success: false,
					error: lastError.message,
					attempts: maxRetries + 1,
				};
			};

			const result = await exponentialBackoffRetry(
				() => Promise.resolve(unreliableOperation()),
				maxRetries,
				baseDelay,
			);

			expect(result.success).toBe(true);
			expect(result.result).toBe("Success on attempt 3");
			expect(result.attempts).toBe(3);
		});

		it("应该支持条件重试策略", async () => {
			let attempts = 0;

			const conditionalOperation = () => {
				attempts++;
				const error = new Error(`Attempt ${attempts}`);

				// 某些错误类型可以重试
				if (attempts === 1) {
					error.code = "ECONNRESET"; // 网络错误，可以重试
				} else if (attempts === 2) {
					error.code = "EACCES"; // 权限错误，不可以重试
				} else {
					return `Success on attempt ${attempts}`;
				}

				throw error;
			};

			const conditionalRetry = async (operation, shouldRetry) => {
				let lastError;
				let attempts = 0;
				const maxAttempts = 3;

				while (attempts < maxAttempts) {
					try {
						attempts++;
						return { success: true, result: await operation(), attempts };
					} catch (error) {
						lastError = error;

						if (!shouldRetry(error) || attempts >= maxAttempts) {
							break;
						}

						await new Promise((resolve) => setTimeout(resolve, 50));
					}
				}

				return {
					success: false,
					error: lastError.code || lastError.message,
					attempts,
				};
			};

			const shouldRetryFn = (error) => {
				// 只重试网络相关的错误
				const retryableErrors = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"];
				return retryableErrors.includes(error.code);
			};

			const result = await conditionalRetry(
				() => Promise.resolve(conditionalOperation()),
				shouldRetryFn,
			);

			expect(result.success).toBe(false); // 因为EACCES不应该重试
			expect(result.attempts).toBe(2); // 只尝试了2次
			expect(result.error).toContain("EACCES");
		});

		it("应该支持优雅降级", () => {
			const createGracefulDegradation = () => {
				const services = [
					{ name: "primary", available: true, priority: 1 },
					{ name: "secondary", available: true, priority: 2 },
					{ name: "tertiary", available: true, priority: 3 },
					{ name: "fallback", available: true, priority: 4 },
				];

				return {
					executeWithDegradation: async (operation) => {
						const availableServices = services
							.filter((service) => service.available)
							.sort((a, b) => a.priority - b.priority);

						let lastError;

						for (const service of availableServices) {
							try {
								const result = await operation(service);
								return {
									success: true,
									result,
									service: service.name,
									degraded: service.priority > 1,
								};
							} catch (error) {
								lastError = error;

								// 标记服务不可用（临时）
								service.available = false;

								// 如果还有其他服务可用，继续尝试
								if (
									availableServices.indexOf(service) <
									availableServices.length - 1
								) {
									continue;
								}
							}
						}

						return {
							success: false,
							error: lastError?.message || "All services failed",
							degraded: true,
							allServicesFailed: true,
						};
					},

					resetService: (serviceName) => {
						const service = services.find((s) => s.name === serviceName);
						if (service) {
							service.available = true;
						}
					},
				};
			};

			const degradationHandler = createGracefulDegradation();

			const mockOperation = (service) => {
				if (service.name === "primary") {
					throw new Error("Primary service failed");
				}
				return Promise.resolve(`${service.name} result`);
			};

			const result = degradationHandler.executeWithDegradation(mockOperation);

			expect(result).resolves.toEqual({
				success: true,
				result: "secondary result",
				service: "secondary",
				degraded: true,
			});
		});
	});
});
