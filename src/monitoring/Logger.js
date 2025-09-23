/**
 * 结构化日志系统
 * 提供统一日志记录、审计日志和监控报告功能
 */

import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";

export const LOG_LEVELS = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3,
	TRACE: 4,
};

export const LOG_TYPES = {
	SYSTEM: "system",
	USER: "user",
	SECURITY: "security",
	AUDIT: "audit",
	PERFORMANCE: "performance",
	BUSINESS: "business",
};

/**
 * 日志条目类
 */
export class LogEntry {
	/**
	 * 构造函数
	 * @param {Object} options - 日志选项
	 */
	constructor(options = {}) {
		this.timestamp = options.timestamp || new Date().toISOString();
		this.level = options.level || LOG_LEVELS.INFO;
		this.type = options.type || LOG_TYPES.SYSTEM;
		this.category = options.category || "general";
		this.message = options.message || "";
		this.details = options.details || {};
		this.context = options.context || {};
		this.userId = options.userId || "system";
		this.sessionId = options.sessionId || null;
		this.requestId = options.requestId || null;
		this.duration = options.duration || null;
		this.error = options.error || null;
		this.stackTrace = options.stackTrace || null;
		this.source = options.source || "application";
		this.metadata = options.metadata || {};
	}

	/**
	 * 转换为结构化对象
	 * @returns {Object} 结构化日志对象
	 */
	toStructured() {
		return {
			timestamp: this.timestamp,
			level: this.level,
			levelName: Object.keys(LOG_LEVELS)[this.level],
			type: this.type,
			category: this.category,
			message: this.message,
			details: this.details,
			context: this.context,
			userId: this.userId,
			sessionId: this.sessionId,
			requestId: this.requestId,
			duration: this.duration,
			error: this.error,
			stackTrace: this.stackTrace,
			source: this.source,
			metadata: this.metadata,
		};
	}

	/**
	 * 转换为JSON字符串
	 * @returns {string} JSON字符串
	 */
	toJSON() {
		return JSON.stringify(this.toStructured());
	}

	/**
	 * 转换为可读字符串
	 * @returns {string} 可读字符串
	 */
	toReadable() {
		const levelName = Object.keys(LOG_LEVELS)[this.level];
		const timestamp = new Date(this.timestamp).toLocaleString();
		let readable = `[${timestamp}] ${levelName} [${this.type}:${this.category}] ${this.message}`;

		if (this.userId && this.userId !== "system") {
			readable += ` [User: ${this.userId}]`;
		}

		if (this.duration !== null) {
			readable += ` (${this.duration}ms)`;
		}

		if (this.error) {
			readable += ` Error: ${this.error}`;
		}

		return readable;
	}
}

/**
 * 日志系统类
 */
export class Logger extends EventEmitter {
	/**
	 * 构造函数
	 * @param {Object} config - 配置对象
	 */
	constructor(config = {}) {
		super();
		this.config = {
			level: config.level || LOG_LEVELS.INFO,
			enableConsole: config.enableConsole !== false,
			enableFile: config.enableFile !== false,
			logDirectory: config.logDirectory || ".speco/logs",
			maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
			maxFiles: config.maxFiles || 30,
			compressOldLogs: config.compressOldLogs !== false,
			structuredOutput: config.structuredOutput !== false,
			...config,
		};

		this.currentLogFile = null;
		this.writeQueue = [];
		this.isWriting = false;
		this.metrics = {
			totalLogs: 0,
			logsByLevel: {},
			logsByType: {},
			errors: 0,
			warnings: 0,
		};

		this._initializeLogger();
	}

	/**
	 * 初始化日志系统
	 * @private
	 */
	async _initializeLogger() {
		try {
			// 确保日志目录存在
			await fs.mkdir(this.config.logDirectory, { recursive: true });

			// 生成当前日志文件名
			this.currentLogFile = this._generateLogFileName();

			// 清理旧日志文件
			await this._cleanupOldLogs();

			// 设置定期清理任务
			this._startPeriodicCleanup();

			this.info("Logger initialized", {
				logDirectory: this.config.logDirectory,
				currentLogFile: this.currentLogFile,
			});
		} catch (error) {
			console.error("Failed to initialize logger:", error);
			// 如果日志系统初始化失败，至少保持控制台输出
			this.config.enableFile = false;
		}
	}

	/**
	 * 生成日志文件名
	 * @private
	 * @returns {string} 日志文件名
	 */
	_generateLogFileName() {
		const now = new Date();
		const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
		const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
		return path.join(
			this.config.logDirectory,
			`speco-tasker-${dateStr}-${timeStr}.log`,
		);
	}

	/**
	 * 清理旧日志文件
	 * @private
	 */
	async _cleanupOldLogs() {
		try {
			const files = await fs.readdir(this.config.logDirectory);
			const logFiles = files
				.filter(
					(file) => file.startsWith("speco-tasker-") && file.endsWith(".log"),
				)
				.map((file) => ({
					name: file,
					path: path.join(this.config.logDirectory, file),
					timestamp: this._extractTimestampFromLogFile(file),
				}))
				.filter((file) => file.timestamp)
				.sort((a, b) => b.timestamp - a.timestamp);

			// 保留最新的文件，删除旧的
			if (logFiles.length > this.config.maxFiles) {
				const filesToDelete = logFiles.slice(this.config.maxFiles);
				for (const file of filesToDelete) {
					try {
						await fs.unlink(file.path);
					} catch (error) {
						this.warn("Failed to delete old log file", {
							file: file.name,
							error: error.message,
						});
					}
				}
			}
		} catch (error) {
			this.warn("Failed to cleanup old logs", { error: error.message });
		}
	}

	/**
	 * 从日志文件名提取时间戳
	 * @private
	 * @param {string} fileName - 文件名
	 * @returns {number|null} 时间戳
	 */
	_extractTimestampFromLogFile(fileName) {
		const match = fileName.match(
			/speco-tasker-(\d{4}-\d{2}-\d{2})-(\d{2}-\d{2}-\d{2})\.log/,
		);
		if (match) {
			const dateStr = `${match[1]}T${match[2].replace(/-/g, ":")}:00.000Z`;
			return new Date(dateStr).getTime();
		}
		return null;
	}

	/**
	 * 启动定期清理任务
	 * @private
	 */
	_startPeriodicCleanup() {
		// 每小时清理一次旧日志
		this.cleanupInterval = setInterval(
			async () => {
				await this._cleanupOldLogs();
			},
			60 * 60 * 1000,
		); // 1小时
	}

	/**
	 * 记录日志
	 * @param {number} level - 日志级别
	 * @param {string} type - 日志类型
	 * @param {string} category - 日志分类
	 * @param {string} message - 日志消息
	 * @param {Object} options - 其他选项
	 */
	async log(level, type, category, message, options = {}) {
		// 检查日志级别
		if (level > this.config.level) {
			return;
		}

		const logEntry = new LogEntry({
			level,
			type,
			category,
			message,
			...options,
		});

		// 更新统计信息
		this._updateMetrics(logEntry);

		// 触发事件
		this.emit("log", logEntry);

		// 控制台输出
		if (this.config.enableConsole) {
			this._outputToConsole(logEntry);
		}

		// 文件输出
		if (this.config.enableFile) {
			await this._outputToFile(logEntry);
		}
	}

	/**
	 * 错误日志
	 */
	error(message, details = {}, context = {}) {
		return this.log(LOG_LEVELS.ERROR, LOG_TYPES.SYSTEM, "error", message, {
			details,
			context,
		});
	}

	/**
	 * 警告日志
	 */
	warn(message, details = {}, context = {}) {
		return this.log(LOG_LEVELS.WARN, LOG_TYPES.SYSTEM, "warning", message, {
			details,
			context,
		});
	}

	/**
	 * 信息日志
	 */
	info(message, details = {}, context = {}) {
		return this.log(LOG_LEVELS.INFO, LOG_TYPES.SYSTEM, "info", message, {
			details,
			context,
		});
	}

	/**
	 * 调试日志
	 */
	debug(message, details = {}, context = {}) {
		return this.log(LOG_LEVELS.DEBUG, LOG_TYPES.SYSTEM, "debug", message, {
			details,
			context,
		});
	}

	/**
	 * 跟踪日志
	 */
	trace(message, details = {}, context = {}) {
		return this.log(LOG_LEVELS.TRACE, LOG_TYPES.SYSTEM, "trace", message, {
			details,
			context,
		});
	}

	/**
	 * 审计日志
	 */
	audit(operation, params, context = {}) {
		return this.log(LOG_LEVELS.INFO, LOG_TYPES.AUDIT, "audit", operation, {
			details: params,
			context,
		});
	}

	/**
	 * 安全日志
	 */
	security(event, details = {}, context = {}) {
		return this.log(LOG_LEVELS.WARN, LOG_TYPES.SECURITY, "security", event, {
			details,
			context,
		});
	}

	/**
	 * 性能日志
	 */
	performance(operation, duration, details = {}, context = {}) {
		return this.log(
			LOG_LEVELS.INFO,
			LOG_TYPES.PERFORMANCE,
			"performance",
			operation,
			{
				duration,
				details,
				context,
			},
		);
	}

	/**
	 * 业务日志
	 */
	business(event, details = {}, context = {}) {
		return this.log(LOG_LEVELS.INFO, LOG_TYPES.BUSINESS, "business", event, {
			details,
			context,
		});
	}

	/**
	 * 更新统计信息
	 * @private
	 * @param {LogEntry} logEntry - 日志条目
	 */
	_updateMetrics(logEntry) {
		this.metrics.totalLogs++;

		const levelName = Object.keys(LOG_LEVELS)[logEntry.level];
		this.metrics.logsByLevel[levelName] =
			(this.metrics.logsByLevel[levelName] || 0) + 1;

		this.metrics.logsByType[logEntry.type] =
			(this.metrics.logsByType[logEntry.type] || 0) + 1;

		if (logEntry.level === LOG_LEVELS.ERROR) {
			this.metrics.errors++;
		} else if (logEntry.level === LOG_LEVELS.WARN) {
			this.metrics.warnings++;
		}
	}

	/**
	 * 输出到控制台
	 * @private
	 * @param {LogEntry} logEntry - 日志条目
	 */
	_outputToConsole(logEntry) {
		const readable = logEntry.toReadable();

		switch (logEntry.level) {
			case LOG_LEVELS.ERROR:
				console.error(`\x1b[31m${readable}\x1b[0m`); // 红色
				break;
			case LOG_LEVELS.WARN:
				console.warn(`\x1b[33m${readable}\x1b[0m`); // 黄色
				break;
			case LOG_LEVELS.INFO:
				console.info(`\x1b[36m${readable}\x1b[0m`); // 青色
				break;
			case LOG_LEVELS.DEBUG:
				console.debug(`\x1b[35m${readable}\x1b[0m`); // 紫色
				break;
			case LOG_LEVELS.TRACE:
				console.debug(`\x1b[37m${readable}\x1b[0m`); // 白色
				break;
		}
	}

	/**
	 * 输出到文件
	 * @private
	 * @param {LogEntry} logEntry - 日志条目
	 */
	async _outputToFile(logEntry) {
		this.writeQueue.push(logEntry);

		if (!this.isWriting) {
			this.isWriting = true;
			await this._processWriteQueue();
		}
	}

	/**
	 * 处理写入队列
	 * @private
	 */
	async _processWriteQueue() {
		while (this.writeQueue.length > 0) {
			const logEntry = this.writeQueue.shift();
			try {
				const logLine = this.config.structuredOutput
					? `${logEntry.toJSON()}\n`
					: `${logEntry.toReadable()}\n`;

				await fs.appendFile(this.currentLogFile, logLine, "utf8");

				// 检查文件大小是否需要轮转
				await this._checkFileRotation();
			} catch (error) {
				console.error("Failed to write log to file:", error);
				// 如果文件写入失败，将日志放回队列前端
				this.writeQueue.unshift(logEntry);
				break;
			}
		}
		this.isWriting = false;
	}

	/**
	 * 检查文件是否需要轮转
	 * @private
	 */
	async _checkFileRotation() {
		try {
			const stats = await fs.stat(this.currentLogFile);
			if (stats.size > this.config.maxFileSize) {
				// 生成新的日志文件名
				this.currentLogFile = this._generateLogFileName();
			}
		} catch (error) {
			// 如果检查失败，继续使用当前文件
		}
	}

	/**
	 * 获取日志统计信息
	 * @returns {Object} 统计信息
	 */
	getMetrics() {
		return { ...this.metrics };
	}

	/**
	 * 生成监控报告
	 * @param {Object} options - 报告选项
	 * @returns {Object} 监控报告
	 */
	generateReport(options = {}) {
		const now = new Date();
		const report = {
			generatedAt: now.toISOString(),
			period: options.period || "current-session",
			metrics: this.getMetrics(),
			health: this._assessHealth(),
			recommendations: this._generateRecommendations(),
			alerts: this._checkAlerts(),
		};

		return report;
	}

	/**
	 * 评估系统健康状态
	 * @private
	 * @returns {Object} 健康状态
	 */
	_assessHealth() {
		const metrics = this.metrics;
		let status = "healthy";
		let score = 100;

		// 基于错误率评估健康状态
		const errorRate = metrics.errors / Math.max(metrics.totalLogs, 1);
		if (errorRate > 0.1) {
			// 10%错误率
			status = "critical";
			score -= 50;
		} else if (errorRate > 0.05) {
			// 5%错误率
			status = "warning";
			score -= 25;
		}

		// 基于警告率评估
		const warningRate = metrics.warnings / Math.max(metrics.totalLogs, 1);
		if (warningRate > 0.2) {
			// 20%警告率
			score -= 10;
		}

		return {
			status,
			score: Math.max(0, score),
			indicators: {
				errorRate: `${(errorRate * 100).toFixed(2)}%`,
				warningRate: `${(warningRate * 100).toFixed(2)}%`,
				totalLogs: metrics.totalLogs,
			},
		};
	}

	/**
	 * 生成建议
	 * @private
	 * @returns {Array} 建议列表
	 */
	_generateRecommendations() {
		const recommendations = [];
		const metrics = this.metrics;

		if (metrics.errors > metrics.totalLogs * 0.05) {
			recommendations.push({
				priority: "high",
				message: "错误率较高，建议检查系统稳定性",
				action: "Review recent error logs and fix underlying issues",
			});
		}

		if (metrics.warnings > metrics.totalLogs * 0.1) {
			recommendations.push({
				priority: "medium",
				message: "警告数量较多，建议优化系统配置",
				action: "Review warning logs and optimize configurations",
			});
		}

		if (metrics.totalLogs < 100) {
			recommendations.push({
				priority: "low",
				message: "日志数量较少，建议增加调试信息",
				action: "Enable more detailed logging for better observability",
			});
		}

		return recommendations;
	}

	/**
	 * 检查告警
	 * @private
	 * @returns {Array} 告警列表
	 */
	_checkAlerts() {
		const alerts = [];
		const metrics = this.metrics;

		if (metrics.errors > 10) {
			alerts.push({
				level: "critical",
				message: `High error count: ${metrics.errors} errors detected`,
				timestamp: new Date().toISOString(),
			});
		}

		if (metrics.warnings > 50) {
			alerts.push({
				level: "warning",
				message: `High warning count: ${metrics.warnings} warnings detected`,
				timestamp: new Date().toISOString(),
			});
		}

		return alerts;
	}

	/**
	 * 查询日志
	 * @param {Object} filters - 查询过滤器
	 * @returns {Promise<Array>} 日志条目数组
	 */
	async queryLogs(filters = {}) {
		try {
			const files = await fs.readdir(this.config.logDirectory);
			const logFiles = files
				.filter(
					(file) => file.startsWith("speco-tasker-") && file.endsWith(".log"),
				)
				.map((file) => path.join(this.config.logDirectory, file))
				.sort()
				.reverse(); // 最新的文件在前

			const results = [];

			for (const filePath of logFiles) {
				try {
					const content = await fs.readFile(filePath, "utf8");
					const lines = content.trim().split("\n");

					for (const line of lines) {
						if (!line.trim()) continue;

						let logEntry;
						try {
							if (this.config.structuredOutput) {
								logEntry = JSON.parse(line);
							} else {
								// 解析可读格式（简化版）
								logEntry = this._parseReadableLogLine(line);
							}

							if (this._matchesFilters(logEntry, filters)) {
								results.push(logEntry);
							}
						} catch (error) {}
					}
				} catch (error) {
					// 跳过无法读取的文件
					continue;
				}

				// 如果已经有足够的结果，停止搜索
				if (results.length >= (filters.limit || 1000)) {
					break;
				}
			}

			return results.slice(0, filters.limit || 1000);
		} catch (error) {
			this.error("Failed to query logs", { error: error.message });
			return [];
		}
	}

	/**
	 * 解析可读格式日志行
	 * @private
	 * @param {string} line - 日志行
	 * @returns {Object} 解析后的日志对象
	 */
	_parseReadableLogLine(line) {
		// 简化的解析逻辑，实际实现可能需要更复杂的解析
		const timestampMatch = line.match(/\[([^\]]+)\]/);
		const levelMatch = line.match(/] (\w+) \[([^\]]+)\] (.+)/);

		return {
			timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
			level: levelMatch
				? LOG_LEVELS[levelMatch[1]] || LOG_LEVELS.INFO
				: LOG_LEVELS.INFO,
			type: levelMatch ? levelMatch[2].split(":")[0] : "system",
			category: levelMatch
				? levelMatch[2].split(":")[1] || "general"
				: "general",
			message: levelMatch ? levelMatch[3] : line,
		};
	}

	/**
	 * 检查日志条目是否匹配过滤器
	 * @private
	 * @param {Object} logEntry - 日志条目
	 * @param {Object} filters - 过滤器
	 * @returns {boolean} 是否匹配
	 */
	_matchesFilters(logEntry, filters) {
		if (filters.level && logEntry.level !== filters.level) return false;
		if (filters.type && logEntry.type !== filters.type) return false;
		if (filters.category && logEntry.category !== filters.category)
			return false;

		if (
			filters.startTime &&
			new Date(logEntry.timestamp) < new Date(filters.startTime)
		)
			return false;
		if (
			filters.endTime &&
			new Date(logEntry.timestamp) > new Date(filters.endTime)
		)
			return false;

		if (filters.userId && logEntry.userId !== filters.userId) return false;
		if (filters.sessionId && logEntry.sessionId !== filters.sessionId)
			return false;

		if (
			filters.message &&
			!logEntry.message.toLowerCase().includes(filters.message.toLowerCase())
		)
			return false;

		return true;
	}

	/**
	 * 关闭日志系统
	 */
	async close() {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		// 等待写入队列处理完成
		while (this.isWriting || this.writeQueue.length > 0) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		this.removeAllListeners();
	}
}

// 创建全局日志实例
let globalLogger = null;

/**
 * 获取全局日志实例
 * @param {Object} config - 配置对象
 * @returns {Logger} 日志实例
 */
export function getLogger(config = {}) {
	if (!globalLogger) {
		globalLogger = new Logger(config);
	}
	return globalLogger;
}

/**
 * 设置全局日志实例
 * @param {Logger} logger - 日志实例
 */
export function setLogger(logger) {
	globalLogger = logger;
}

// Logger and LogEntry are already exported via class/function declarations
